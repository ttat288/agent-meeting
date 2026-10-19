'use strict';
// Gửi tệp giữa các agent: server là trạm chuyển tiếp, nội dung không đi qua tin nhắn.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs'), os = require('os'), path = require('path');
const { createApp } = require('../src/server');
const auth = require('./auth-shim');
const { fileName } = require('../src/meeting');
const minutes = require('../src/minutes');

const form = (o) => new URLSearchParams(o).toString();
async function boot(cfg = {}, keys) {
  const app = createApp({ waitMs: 400, idleMs: 60000, tick: 30, ...cfg });
  await new Promise(r => app.server.listen(0, r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const m = app.create(keys);
  const api = `${base}/a/${m.id}`;
  const post = (tool, o) => fetch(`${api}/${tool}`, { method: 'POST', body: form(o) }).then(r => r.text());
  const send = (q, body) => fetch(`${api}/send?${form(q)}`, { method: 'POST', body }).then(async r => ({ status: r.status, text: await r.text() }));
  // phần header mã riêng trong các lệnh curl mà giao thức đưa cho agent "name"
  const H = (name) => ` -H "Authorization: Bearer ${auth.tokenFor(api, name)}"`;
  return { app, base, m, api, post, send, H };
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// gửi bằng http thô: không có content-length (chunked), hoặc có "Expect: 100-continue" như curl với tệp lớn
function rawSend(url, chunks, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers }, (res) => {
      let b = ''; res.setEncoding('utf8'); res.on('data', c => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, text: b, continued: req.continued }));
    });
    req.on('error', reject);
    req.on('continue', () => { req.continued = true; for (const c of chunks) req.write(c); req.end(); });
    if (!headers.expect) { for (const c of chunks) req.write(c); req.end(); }
  });
}

test('tên tệp được làm sạch: chỉ basename, không ký tự shell/HTML, không tệp ẩn hay cờ dòng lệnh', () => {
  assert.equal(fileName('../../etc/passwd'), 'passwd');
  assert.equal(fileName('..\\..\\.bashrc'), 'bashrc');
  assert.equal(fileName('<svg onload=alert(1)>.svg'), 'svg_onload_alert_1_.svg');
  assert.equal(fileName('-rf'), 'rf');
  assert.equal(fileName('a"; rm -rf $HOME `x`.patch'), 'a_rm_-rf_HOME_x_.patch');
  assert.equal(fileName('bản vá\n\u0007.patch'), 'bản_vá_.patch');
  assert.equal(fileName('x..y'), 'x.y');
  assert.equal(fileName(''), 'tep');
  assert.equal(fileName('...'), 'tep');
});

test('gửi riêng: chỉ người nhận được báo kèm lệnh tải, người khác không tải được; tải về đúng từng byte, an toàn', async (t) => {
  const { app, base, m, api, post, send, H } = await boot(); t.after(() => app.close());
  for (const n of ['Lam', 'Minh', 'Tu']) await post('join', { name: n, model: 'x' });
  m.start('Sửa lỗi', '');
  for (const n of ['Lam', 'Minh', 'Tu']) await m.wait(n);
  const body = Buffer.from('From 1a2b\nSubject: [PATCH] sửa sub()\n\n-  return a + b;\n+  return a - b;\n\u0000\u00ff');
  const wM = m.wait('Minh'), wT = m.wait('Tu');
  const r = await send({ name: 'Lam', to: 'minh', file: '../../fix-sub.patch', note: 'áp dụng bằng git am' }, body);
  assert.equal(r.status, 200);
  assert.match(r.text, new RegExp(`Đã gửi tệp fix-sub\\.patch \\(${body.length} B, sha256 ${sha(body)}\\) riêng cho Minh`));
  const f = m.files[0];
  assert.deepEqual([f.name, f.size, f.from, f.to, f.sha256], ['fix-sub.patch', body.length, 'Lam', 'Minh', sha(body)]);
  assert.match(f.id, /^[0-9a-f]{24}$/);
  // Minh nhận thông báo kèm lệnh tải đúng URL; Tu không thấy gì
  const got = await wM;
  assert.match(got, /Lam gửi tệp fix-sub\.patch \(\d+ B, sha256 [0-9a-f]{12}…\) riêng cho Minh\. Ghi chú của Lam: "áp dụng bằng git am"/);
  assert.ok(got.includes(`Tải: curl -sSf -o "fix-sub.patch" "${api}/file/${f.id}"${H('Minh')}`), got);
  assert.ok(got.includes(`sha256 đúng: ${sha(body)}`));
  assert.match(await wT, /Chưa có tin mới/);
  assert.doesNotMatch(m.history('Tu'), /fix-sub/);
  // tải về: đúng bytes, header an toàn
  const dl = await fetch(`${api}/file/${f.id}?name=Minh`);
  assert.equal(dl.status, 200);
  // so bằng sha256: assert so hai Buffer lớn khác nhau sẽ tính diff từng byte (tốn hàng GB RAM, từng làm treo máy)
  assert.equal(sha(Buffer.from(await dl.arrayBuffer())), sha(body));
  assert.equal(dl.headers.get('content-type'), 'application/octet-stream');
  assert.equal(dl.headers.get('content-disposition'), `attachment; filename="fix-sub.patch"; filename*=UTF-8''fix-sub.patch`);
  assert.equal(dl.headers.get('x-content-type-options'), 'nosniff');
  assert.match(dl.headers.get('content-security-policy'), /^sandbox/);
  assert.equal(dl.headers.get('x-content-sha256'), sha(body));
  await new Promise(r => setTimeout(r, 20));
  assert.deepEqual(f.got, ['Minh']);
  assert.equal((await fetch(`${api}/file/${f.id}?name=Lam`)).status, 200); // người gửi tải lại được
  assert.deepEqual(f.got, ['Minh']); // người gửi không tính là "đã tải"
  const x = await fetch(`${api}/file/${f.id}?name=Tu`);
  assert.equal(x.status, 404); assert.match(await x.text(), /Không có tệp này cho bạn/);
  // không có mã riêng (người ngoài có mã mời) thì không tải được; mã của Tu kèm name=Minh vẫn là Tu (không giả tên được)
  for (const q of ['', '?name=Khach', '?name=Minh']) assert.equal((await auth.raw(`${api}/file/${f.id}${q}`)).status, 401, q);
  assert.equal((await auth.raw(`${api}/file/${f.id}?name=Minh`, { headers: auth.authHeader(api, 'Tu') })).status, 404);
  assert.equal((await fetch(`${base}/a/${m.hostKey}/file/${f.id}?name=Minh`)).status, 404); // mã chủ trì không phải mã agent
  // chủ trì tải được mọi tệp; trang chủ trì thấy danh sách (người gửi, nhận, cỡ, sha256, đã tải)
  const h = await fetch(`${base}/api/host/${m.hostKey}/file/${f.id}`);
  assert.equal(h.status, 200); assert.match(h.headers.get('content-disposition'), /^attachment/);
  assert.equal((await fetch(`${base}/api/host/${m.id}/file/${f.id}`)).status, 404);
  const s = await (await fetch(`${base}/api/host/${m.hostKey}/state`)).json();
  assert.deepEqual(s.files.map(x => [x.name, x.from, x.to, x.size, x.sha256, x.got]), [['fix-sub.patch', 'Lam', 'Minh', body.length, sha(body), ['Minh']]]);
  // nội dung tệp không nằm trong log / biên bản; biên bản liệt kê tệp, không có mã tệp
  assert.doesNotMatch(JSON.stringify(m.log), /return a - b/);
  const md = minutes.toMarkdown(m), j = minutes.toJSON(m);
  assert.match(md, /## Tệp\n[\s\S]*\| fix-sub\.patch \| \d+ B \| Lam \| Minh \|/);
  assert.doesNotMatch(md, /return a - b/);
  assert.deepEqual(j.files, [{ name: 'fix-sub.patch', size: body.length, sha256: sha(body), from: 'Lam', to: 'Minh', note: 'áp dụng bằng git am', sentAt: f.t, downloadedBy: ['Minh'], carried: false }]);
  assert.doesNotMatch(md + JSON.stringify(j), new RegExp(f.id));
});

test('gửi cả phòng, tool files (curl và MCP), chờ tệp bằng wait=1', async (t) => {
  const { app, base, m, api, post, send, H } = await boot(); t.after(() => app.close());
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  m.start('x', '');
  // chờ tệp: trả về ngay khi có tệp mới, không phải đợi hết thời gian
  const t0 = Date.now();
  const waiting = fetch(`${api}/files?name=Minh&wait=1`).then(r => r.text());
  await new Promise(r => setTimeout(r, 80));
  assert.equal((await send({ name: 'Lam', file: 'repo.tar.gz' }, Buffer.alloc(3000, 7))).status, 200);
  const w = await waiting;
  assert.ok(Date.now() - t0 < 380, 'files wait=1 phải trả về ngay khi có tệp');
  assert.match(w, /^Tệp bạn xem được \(1\):\n1\. repo\.tar\.gz · 2,9 KB · từ Lam → cả phòng · \d\d:\d\d · CHƯA TẢI/);
  assert.ok(w.includes(`curl -sSf -o "repo.tar.gz" "${api}/file/${m.files[0].id}"${H('Minh')}`));
  assert.ok(w.includes(`Gửi tệp: curl -s -X POST "${api}/send?to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP"${H('Minh')} --data-binary @ĐƯỜNG_DẪN_TỆP`));
  // tệp gửi cả phòng: vẫn phải là thành viên (có mã riêng)
  assert.equal((await auth.raw(`${api}/file/${m.files[0].id}`)).status, 401);
  await fetch(`${api}/file/${m.files[0].id}?name=Minh`);
  assert.match(await post('files', { name: 'Minh', wait: '1' }), /bạn đã tải/); // không có tệp mới: chờ hết rồi báo
  assert.match(await post('files', { name: 'Minh', wait: '1' }), /^Chưa có tệp mới gửi cho bạn/);
  assert.match(await post('files', { name: 'Lam' }), /bạn gửi → cả phòng · \d\d:\d\d · đã tải: Minh/);
  // MCP: tool files, có annotations chỉ đọc; giao thức join qua MCP vẫn đưa lệnh curl gửi tệp đúng địa chỉ
  const rpc = async (id, name, args) => (await (await fetch(`${base}/mcp/${m.id}`, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }) })).json()).result.content[0].text;
  const j = await rpc(1, 'join', { name: 'Codex', model: 'GPT-5' });
  assert.ok(j.includes(`11. GỬI TỆP / CODE`)); assert.ok(j.includes(`curl -s -X POST "${api}/send?to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP" -H "Authorization: Bearer `)); assert.match(j, /tool files\(name\)/);
  assert.match(await rpc(2, 'files', { name: 'Codex' }), /repo\.tar\.gz/);
  // giao thức curl có luật 11 với lệnh của chính agent
  const jc = await post('join', { name: 'Tu Anh', model: 'x' });
  assert.ok(jc.includes(`curl -s -X POST "${api}/send?to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP"${H('Tu Anh')} --data-binary @ĐƯỜNG_DẪN_TỆP`), jc);
  assert.ok(jc.includes(`curl -s "${api}/files"${H('Tu Anh')}`));
  assert.match(jc, /Tối đa 20 MB mỗi tệp/);
});

test('gửi tệp: từ chối rõ ràng khi chưa họp, sai tên, sai người nhận, tệp trống, đã kết thúc', async (t) => {
  const { app, base, m, send, post } = await boot(); t.after(() => app.close());
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  const one = Buffer.from('x');
  let r = await send({ name: 'Lam', to: 'Minh', file: 'a' }, one);
  assert.equal(r.status, 400); assert.match(r.text, /chưa bắt đầu/);
  m.start('x', '');
  r = await send({ name: 'Khach', file: 'a' }, one); // có mã mời nhưng chưa join: không có mã riêng
  assert.equal(r.status, 401); assert.match(r.text, /không nhận ra bạn/);
  assert.match((await send({ name: 'Lam', to: 'Hoa', file: 'a' }, one)).text, /Không có agent tên "Hoa".*Thành viên: Minh/);
  assert.match((await send({ name: 'Lam', to: 'Lam', file: 'a' }, one)).text, /chính mình/);
  r = await send({ name: 'Lam', file: 'a' }, Buffer.alloc(0));
  assert.equal(r.status, 400); assert.match(r.text, /Tệp trống/);
  assert.equal((await fetch(`${base}/a/khongco/send?name=A`, { method: 'POST', body: 'x' })).status, 404);
  assert.equal(m.files.length, 0);
  m.kick('Minh');
  assert.match((await send({ name: 'Minh', file: 'a' }, one)).text, /mời bạn ra khỏi/);
  m.stop();
  assert.match((await send({ name: 'Lam', file: 'a' }, one)).text, /đã kết thúc/);
});

test('giới hạn dung lượng: content-length, chunked, Expect 100-continue, tổng phòng, số tệp', async (t) => {
  const kb = 1 / 1024;
  const { app, m, api, send, post } = await boot({ maxFileMb: 4 * kb, maxRoomMb: 10 * kb, maxFiles: 3 }); t.after(() => app.close());
  const lam = () => auth.authHeader(api, 'Lam');
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  m.start('x', '');
  let r = await send({ name: 'Lam', file: 'big' }, Buffer.alloc(5000));
  assert.equal(r.status, 413); assert.match(r.text, /Tệp quá lớn \(4,9 KB\): tối đa 0.00390625 MB|Tệp quá lớn \(4,9 KB\)/);
  // không có content-length: dừng nhận khi vượt giới hạn, báo lỗi, không lưu gì
  r = await rawSend(`${api}/send?name=Lam&file=chunked`, [Buffer.alloc(3000), Buffer.alloc(3000)], lam());
  assert.equal(r.status, 413); assert.match(r.text, /Tệp quá lớn/);
  // curl gửi "Expect: 100-continue": từ chối trước khi agent phải đẩy cả tệp lên
  r = await rawSend(`${api}/send?name=Lam&file=big2`, [Buffer.alloc(5000)], { expect: '100-continue', 'content-length': 5000, ...lam() });
  assert.equal(r.status, 413); assert.equal(r.continued, undefined);
  r = await rawSend(`${api}/send?name=Lam&file=ok`, [Buffer.alloc(4000, 1)], { expect: '100-continue', 'content-length': 4000, ...lam() });
  assert.equal(r.status, 200); assert.equal(r.continued, true);
  assert.equal(m.files.length, 1); assert.equal(m.files[0].sha256, sha(Buffer.alloc(4000, 1)));
  assert.equal((await send({ name: 'Lam', file: 'b' }, Buffer.alloc(4000))).status, 200);
  r = await send({ name: 'Lam', file: 'c' }, Buffer.alloc(4000)); // 12000 > 10 KB cho cả phòng
  assert.equal(r.status, 413); assert.match(r.text, /cho cả phòng \(đã dùng 7,8 KB\)/);
  assert.equal((await send({ name: 'Lam', file: 'd' }, Buffer.alloc(100))).status, 200);
  r = await send({ name: 'Lam', file: 'e' }, Buffer.alloc(1));
  assert.equal(r.status, 413); assert.match(r.text, /đã có 3 tệp/);
  assert.equal(m.files.length, 3);
});

test('giai đoạn thực hiện: agent đã rời vẫn gửi/nhận tệp; chỉ dẫn WORK có lệnh gửi và chờ tệp', async (t) => {
  const { app, m, api, post, send, H } = await boot(); t.after(() => app.close());
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  m.start('x', '', { followUp: true });
  m.say('Lam', 'KẾT LUẬN: ok\nVIỆC: Lam | sửa sub() rồi gửi patch cho Minh\nVIỆC: Minh | áp dụng patch của Lam, chạy test, commit');
  await post('leave', { name: 'Lam' });
  const left = await post('leave', { name: 'Minh' });
  assert.equal(m.state, 'WORK');
  assert.ok(left.includes(`curl -s -m 70 "${api}/files?wait=1"${H('Minh')}`), left);
  assert.ok(left.includes(`${api}/send?to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP"${H('Minh')}`));
  const waiting = post('files', { name: 'Minh', wait: '1' });
  const r = await send({ name: 'Lam', to: 'Minh', file: 'fix.patch' }, Buffer.from('patch'));
  assert.match(r.text, /riêng cho Minh.*Làm tiếp việc của bạn rồi báo tiến độ/);
  assert.match(await waiting, /fix\.patch · 5 B · từ Lam → riêng bạn/);
  // agent gọi bất kỳ lệnh nào trong WORK cũng nhận thông báo tệp chưa đọc kèm lệnh tải
  assert.match(await post('progress', { name: 'Minh', task: '2', status: 'đang làm' }), /Đã cập nhật/);
  const w = await post('wait', { name: 'Minh' });
  assert.match(w, /Lam gửi tệp fix\.patch[\s\S]*Tải: curl -sSf -o "fix\.patch"/);
});

test('--data-dir: tệp ghi ra đĩa (quyền 600), khởi động lại vẫn tải được; "Cuộc họp mới" xoá, "Họp tiếp" mang theo', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-files-'));
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  const keys = { hostKey: 'host_key_files_00001', id: 'agent_key_files_0001', fixed: true };
  const a = await boot({ dataDir }, keys);
  await a.post('join', { name: 'Lam', model: 'x' }); await a.post('join', { name: 'Minh', model: 'x' });
  a.m.start('x', '');
  const body = crypto.randomBytes(70000);
  assert.equal((await a.send({ name: 'Lam', to: 'Minh', file: 'data.bin' }, body)).status, 200);
  const id = a.m.files[0].id, dir = path.join(dataDir, keys.hostKey + '.files');
  assert.deepEqual(fs.readdirSync(dir), [id]);
  if (process.platform !== 'win32') { assert.equal(fs.statSync(path.join(dir, id)).mode & 0o777, 0o600); assert.equal(fs.statSync(dir).mode & 0o777, 0o700); }
  fs.writeFileSync(path.join(dir, 'abc.tmp'), 'dở'); // tệp ghi dở lúc server tắt
  a.app.close();

  const b = await boot({ dataDir }); t.after(() => b.app.close());
  const m2 = b.app.restore(keys.hostKey);
  assert.deepEqual(fs.readdirSync(dir), [id]);
  assert.equal(m2.files[0].name, 'data.bin');
  const api = b.api.replace(/\/a\/\w+$/, `/a/${keys.id}`), host = b.api.replace(/\/a\/\w+$/, `/api/host/${keys.hostKey}`);
  const dl = await fetch(`${api}/file/${id}?name=Minh`);
  // so bằng sha256: assert so hai Buffer lớn khác nhau sẽ tính diff từng byte (tốn hàng GB RAM, từng làm treo máy)
  assert.equal(sha(Buffer.from(await dl.arrayBuffer())), sha(body));
  // Họp tiếp: tệp đi theo, vẫn tải được ở cuộc mới
  await fetch(`${host}/new`, { method: 'POST', body: JSON.stringify({ carry: true }) });
  const m3 = b.app.meetings.get(keys.hostKey);
  assert.notEqual(m3, m2); assert.equal(m3.files[0].carried, true);
  assert.equal((await fetch(`${api}/file/${id}?name=Minh`)).status, 200);
  m3.join('Minh', 'x'); m3.start('review', '');
  assert.match(m3.log.at(-1).text, /Có 1 tệp từ cuộc họp trước/);
  // Cuộc họp mới (không mang): xoá nội dung trên đĩa, chủ trì cuộc cũ tải thì báo đã xoá
  await fetch(`${host}/new`, { method: 'POST', body: JSON.stringify({}) });
  assert.deepEqual(fs.readdirSync(dir), []);
  assert.equal(b.app.meetings.get(keys.hostKey).files.length, 0);
  assert.equal(m3.files[0].gone, true);
});

test('không có --data-dir: tệp trong bộ nhớ; "Họp tiếp" mang theo, "Cuộc họp mới" thì xoá', async (t) => {
  const { app, base, m, api, post, send } = await boot(); t.after(() => app.close());
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  m.start('x', '');
  await send({ name: 'Lam', to: 'Minh', file: 'a.txt' }, Buffer.from('abc'));
  const id = m.files[0].id;
  const { hostKey } = await (await fetch(`${base}/api/host/${m.hostKey}/new`, { method: 'POST', body: JSON.stringify({ carry: true }) })).json();
  const n = app.meetings.get(hostKey);
  assert.equal((await fetch(`${api}/file/${id}?name=Minh`)).status, 200); // chưa join lại cuộc mới vẫn tải được
  assert.deepEqual(n.files[0].got, ['Minh']); assert.deepEqual(m.files[0].got, []);
  assert.equal((await fetch(`${api}/file/${id}?name=Tu`)).status, 401); // Tu chưa từng là thành viên
  // cuộc mới không mang gì: agent không tải được nữa; chủ trì cuộc vừa bị thay thấy tệp đã xoá (cuộc đầu vẫn giữ vì đang mở để xem)
  const k3 = (await (await fetch(`${base}/api/host/${hostKey}/new`, { method: 'POST', body: '{}' })).json()).hostKey;
  assert.equal((await fetch(`${api}/file/${id}?name=Minh`)).status, 401); // cuộc mới không mang mã của cuộc cũ
  assert.equal(app.meetings.get(k3).files.length, 0);
  assert.equal((await fetch(`${base}/api/host/${m.hostKey}/file/${id}`)).status, 200);
  const m2 = app.create();
  await m2.join('A', 'x'); m2.start('x', ''); m2.addFile({ id: 'f'.repeat(24), name: 'b', size: 1, sha256: '0'.repeat(64), from: 'A' });
  await fetch(`${base}/api/host/${m2.hostKey}/new`, { method: 'POST', body: '{}' });
  assert.equal((await fetch(`${base}/api/host/${m2.hostKey}/file/${'f'.repeat(24)}`)).status, 410);
});
