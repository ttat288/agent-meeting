'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');
const auth = require('./auth-shim');
const minutes = require('../src/minutes');

async function boot() {
  const app = createApp({ waitMs: 400, idleMs: 60000, tick: 30 });
  await new Promise(r => app.server.listen(0, r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  return { app, base, m: app.create() };
}
const rpc = (base, id, body) => fetch(`${base}/mcp/${id}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(body) });
const form = (o) => new URLSearchParams(o).toString();

test('MCP: initialize, tools/list, tools/call, notification', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const init = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })).json();
  assert.equal(init.result.serverInfo.name, 'agent-meeting');
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal((await rpc(base, m.id, { jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202);
  const list = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  assert.deepEqual(list.result.tools.map(x => x.name), ['join', 'wait', 'say', 'pass', 'typing', 'progress', 'files', 'leave', 'history']);
  // Codex CLI chỉ chạy không cần duyệt khi readOnlyHint, hoặc destructiveHint=false + openWorldHint=false
  for (const x of list.result.tools)
    assert.ok(x.annotations.readOnlyHint === true || (x.annotations.destructiveHint === false && x.annotations.openWorldHint === false), x.name);
  assert.equal(list.result.tools.find(x => x.name === 'history').annotations.readOnlyHint, true);
  const join = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'join', arguments: { name: 'A', model: 'Opus 5.5' } } })).json();
  assert.match(join.result.content[0].text, /slot 1/);
  const bad = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope', arguments: { name: 'A' } } })).json();
  assert.equal(bad.error.code, -32602);
});

test('--public-url: lệnh trong giao thức luôn dùng địa chỉ đã khai báo (proxy có thể đổi Host)', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  app.setPublicOrigin('https://meet.example.com', true);
  const j = await fetch(`${base}/a/${m.id}/join`, { method: 'POST', headers: { host: '127.0.0.1:3000' }, body: form({ name: 'A', model: 'x' }) }).then(r => r.text());
  assert.ok(j.includes(`curl -s -m 70 "https://meet.example.com/a/${m.id}/wait" -H "Authorization: Bearer `), j);
  assert.ok(j.includes(`--data-urlencode "text@-" <<'HET'`));
});

test('mã chủ trì cố định: "Cuộc họp mới" dùng lại đúng link, mã agent giữ nguyên', async (t) => {
  const app = createApp({ waitMs: 400, idleMs: 60000, tick: 30 });
  await new Promise(r => app.server.listen(0, r)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const m = app.create({ hostKey: 'host_key_0123456789', id: 'agent_key_0123456789', fixed: true });
  m.join('A', 'x'); m.start('x', '');
  const r = await (await fetch(`${base}/api/host/host_key_0123456789/new`, { method: 'POST' })).json();
  assert.equal(r.hostKey, 'host_key_0123456789');
  assert.equal(m.state, 'ENDED');
  const s = await (await fetch(`${base}/api/host/host_key_0123456789/state?v=-1`)).json();
  assert.equal(s.state, 'LOBBY');
  assert.equal(s.agentId, 'agent_key_0123456789');
  assert.notEqual(s.createdAt, undefined);
  // không cố định thì mỗi cuộc họp mới có mã chủ trì mới
  const k = app.create().hostKey;
  assert.notEqual((await (await fetch(`${base}/api/host/${k}/new`, { method: 'POST' })).json()).hostKey, k);
});

test('API curl: join/say/wait dạng văn bản, kèm hướng dẫn curl đúng địa chỉ', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const post = (tool, o) => fetch(`${base}/a/${m.id}/${tool}`, { method: 'POST', body: form(o) }).then(r => r.text());
  const j = await post('join', { name: 'GPT', model: 'GPT-5' });
  assert.ok(j.includes(`curl -s -m 70 "${base}/a/${m.id}/wait" -H "Authorization: Bearer ${auth.tokenFor(`${base}/a/${m.id}`, 'GPT')}"`), j);
  await post('join', { name: 'Claude', model: 'Opus 5.5' });
  m.start('x', '');
  await fetch(`${base}/a/${m.id}/wait?name=GPT`);
  const p = fetch(`${base}/a/${m.id}/wait?name=GPT`).then(r => r.text());
  await post('say', { name: 'Claude', text: 'chào GPT' });
  assert.match(await p, /\[Claude\] chào GPT/);
});

test('Chủ trì: long-poll nhận thay đổi, bắt đầu và kết thúc; token agent không điều khiển được', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const s0 = await (await fetch(`${base}/api/host/${m.hostKey}/state`)).json();
  assert.equal(s0.state, 'LOBBY');
  assert.equal(s0.version, 0);
  // v=0 phải được giữ chờ, không trả về ngay (tránh vòng lặp gửi yêu cầu liên tục)
  const t0 = Date.now();
  const idle = await Promise.race([fetch(`${base}/api/host/${m.hostKey}/state?v=0`).then(() => 'returned'), new Promise(r => setTimeout(() => r('held'), 300))]);
  assert.equal(idle, 'held', `trả về sau ${Date.now() - t0}ms`);
  assert.equal(s0.agentId, m.id);
  const p = fetch(`${base}/api/host/${m.hostKey}/state?v=${s0.version}`).then(r => r.json());
  await fetch(`${base}/api/host/${m.hostKey}/start`, { method: 'POST', body: JSON.stringify({ context: 'Chủ đề', endCondition: '' }) });
  const live = await p;
  assert.equal(live.state, 'LIVE');
  assert.equal(live.origin, base); // chưa đặt địa chỉ công khai thì dùng địa chỉ của request
  app.setPublicOrigin('https://vi-du.trycloudflare.com');
  assert.equal((await (await fetch(`${base}/api/host/${m.hostKey}/state`)).json()).origin, 'https://vi-du.trycloudflare.com');
  assert.equal((await fetch(`${base}/api/host/${m.id}/stop`, { method: 'POST' })).status, 404);
  await fetch(`${base}/api/host/${m.hostKey}/stop`, { method: 'POST' });
  assert.equal(m.state, 'ENDED');
  assert.equal((await fetch(`${base}/m/${m.hostKey}`)).status, 200);
});

test('Phòng không tồn tại: MCP và curl trả lời rõ ràng để agent dừng', async (t) => {
  const { app, base } = await boot(); t.after(() => app.close());
  const init = await (await rpc(base, 'khongco', { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })).json();
  assert.ok(init.result); // client vẫn kết nối được
  const call = await (await rpc(base, 'khongco', { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'wait', arguments: { name: 'A', model: 'Opus 5.5' } } })).json();
  assert.match(call.result.content[0].text, /không tồn tại.*chép sai URL.*thử lại một lần.*dừng lại/s);
  const r = await fetch(`${base}/a/khongco/wait?name=A`);
  assert.match(await r.text(), /không tồn tại/);
  assert.equal((await fetch(`${base}/m/khongco`)).status, 404);
  assert.equal((await fetch(`${base}/api/host/khongco/state`)).status, 404);
  const bad = await fetch(`${base}/mcp/khongco`, { method: 'POST', body: '{oops' });
  assert.equal((await bad.json()).error.code, -32700);
});

test('Chủ trì: nhắn, kick, cấu hình khi bắt đầu, tạo cuộc họp mới', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const host = (act, body) => fetch(`${base}/api/host/${m.hostKey}/${act}`, { method: 'POST', body: JSON.stringify(body || {}) }).then(r => r.json());
  m.join('A', 'test'); m.join('B', 'test');
  assert.equal((await host('say', { text: 'chưa họp' })).ok, false);
  assert.equal((await host('start', { context: 'x', settings: { mode: 'turns', maxMsgs: 10, timeLimitMin: 5 } })).ok, true);
  assert.equal(m.cfg.mode, 'turns'); assert.equal(m.cfg.maxMsgs, 10); assert.ok(m.endsAt);
  assert.equal((await host('say', { text: 'Hãy chốt' })).ok, true);
  assert.equal(m.log.at(-1).type, 'host');
  assert.equal((await host('kick', { name: 'B' })).ok, true);
  const { hostKey } = await host('new');
  assert.ok(hostKey && hostKey !== m.hostKey);
  const s = await (await fetch(`${base}/api/host/${hostKey}/state`)).json();
  assert.equal(s.state, 'LOBBY'); assert.equal(s.settings.mode, 'turns');
  assert.equal(s.agentId, m.id); // cùng mã agent: MCP đã cài vẫn dùng được
  assert.equal(m.state, 'ENDED'); // cuộc họp cũ đang diễn ra thì được kết thúc
  const j = await fetch(`${base}/a/${m.id}/join`, { method: 'POST', body: 'name=A&model=Opus%205.5' }).then(r => r.text());
  assert.match(j, /slot 1/); // agent vào cuộc họp MỚI, không phải cuộc cũ đã kết thúc
  assert.equal((await fetch(`${base}/api/host/${m.hostKey}/state`)).status, 200); // cuộc họp cũ vẫn xem được
});

test('Long-poll gửi phần log tăng dần theo from', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  m.join('A', 'test'); m.join('B', 'test');
  const s = await (await fetch(`${base}/api/host/${m.hostKey}/state?from=1`)).json();
  assert.equal(s.logFrom, 1); assert.equal(s.log.length, 1);
});

test('Header bảo mật và tài nguyên giao diện', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const page = await fetch(`${base}/m/${m.hostKey}`);
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await page.text(), /assets\/app\.js/);
  for (const a of ['/assets/app.js', '/assets/app.css', '/favicon.svg']) assert.equal((await fetch(base + a)).status, 200, a);
});

test('Chủ trì: nhắn riêng, chuyển mục, gán vai trò, tải biên bản', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const host = (act, body) => fetch(`${base}/api/host/${m.hostKey}/${act}`, { method: 'POST', body: JSON.stringify(body || {}) }).then(r => r.json());
  m.join('A', 'x'); m.join('B', 'x');
  assert.equal((await host('role', { name: 'A', role: 'phản biện' })).ok, true);
  assert.equal((await host('start', { context: 'x', settings: { agenda: ['Mục một', 'Mục hai'] } })).ok, true);
  assert.equal((await host('say', { text: 'riêng', to: 'B' })).ok, true);
  assert.equal(m.log.at(-1).to, 'B');
  assert.equal((await host('next')).ok, true);
  assert.equal(m.agendaIndex, 1);
  const j = await (await fetch(`${base}/api/host/${m.hostKey}/minutes.json`)).json();
  assert.equal(j.members.find(x => x.name === 'A').role, 'phản biện');
  assert.equal((await fetch(`${base}/api/host/${m.id}/minutes.json`)).status, 404); // mã agent không lấy được biên bản
  const s = await (await fetch(`${base}/api/host/${m.hostKey}/state`)).json();
  assert.deepEqual(s.agenda, ['Mục một', 'Mục hai']);
});

test('--data-dir: tắt server giữa cuộc họp, bật lại thì họp tiếp, biên bản đủ', async (t) => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-data-'));
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  const keys = { hostKey: 'host_key_persist_0001', id: 'agent_key_persist_0001', fixed: true };
  const cfg = { waitMs: 400, idleMs: 60000, tick: 30, dataDir };
  const a1 = createApp(cfg);
  const m1 = a1.create(keys);
  const tokB = 'tok_B_persist_000000000001';
  m1.join('A', 'Haiku 4.5'); m1.join('B', 'Sonnet 5.5', null, undefined, { token: tokB });
  m1.start('Chọn database', '', { agenda: ['DB', 'Chia việc'], timeLimitMin: 30 });
  await m1.wait('A'); await m1.wait('B');
  m1.say('A', 'XONG MỤC 1: PostgreSQL\nVIỆC: B | viết migration | thứ 6');
  a1.close(); // ghi nốt phần chưa ghi
  const file = path.join(dataDir, keys.hostKey + '.json');
  if (process.platform !== 'win32') assert.equal(fs.statSync(file).mode & 0o777, 0o600);

  const a2 = createApp(cfg); t.after(() => a2.close());
  await new Promise(r => a2.server.listen(0, r));
  const base = `http://127.0.0.1:${a2.server.address().port}`;
  assert.equal(a2.restore('khong_co_ma_nay_0000'), null);
  const m2 = a2.restore(keys.hostKey);
  assert.equal(m2.state, 'LIVE'); assert.equal(m2.id, keys.id); assert.equal(m2.agendaIndex, 1);
  assert.equal(m2.actions[0].task, 'viết migration');
  assert.equal(m2.createdAt, m1.createdAt); // trang chủ trì không tự tải lại
  assert.ok(m2.version > m1.version);
  assert.ok(m2.endsAt > Date.now() && m2.timers.length); // giới hạn thời gian vẫn chạy tiếp
  // B đang họp: lệnh wait kế tiếp nhận đúng phần chưa đọc, không phải toàn bộ từ đầu
  const w = await fetch(`${base}/a/${keys.id}/wait`, { headers: { authorization: `Bearer ${tokB}` } }).then(r => r.text()); // mã riêng được lưu qua khởi động lại
  assert.match(w, /\[A\] XONG MỤC 1/); assert.match(w, /khởi động lại/); assert.doesNotMatch(w, /Chọn database/);
  const say = await fetch(`${base}/a/${keys.id}/say`, { method: 'POST', headers: { authorization: `Bearer ${tokB}` }, body: form({ text: 'KẾT LUẬN: xong' }) }).then(r => r.text());
  assert.match(say, /Đã gửi/);
  const md = await fetch(`${base}/api/host/${keys.hostKey}/minutes.md`).then(r => r.text());
  assert.match(md, /PostgreSQL/); assert.match(md, /viết migration/); assert.match(md, /KẾT LUẬN: xong/);
  assert.doesNotMatch(md, new RegExp(keys.hostKey + '|' + keys.id));
  // "Cuộc họp mới": cuộc cũ không được ghi đè file của cuộc mới
  await fetch(`${base}/api/host/${keys.hostKey}/new`, { method: 'POST' });
  m2.ev.emit('change'); a2.flush();
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).state, 'LOBBY');
});

test('--data-dir: hết giờ trong lúc server tắt thì kết thúc khi nạp lại', async (t) => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-data-'));
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  const a1 = createApp({ dataDir });
  const m1 = a1.create({ hostKey: 'host_key_persist_0002', fixed: true });
  m1.join('A', 'x'); m1.start('x', '', { timeLimitMin: 1 });
  m1.endsAt = Date.now() - 1; m1.ev.emit('change');
  a1.close();
  const a2 = createApp({ dataDir }); t.after(() => a2.close());
  const ended = new Promise(r => a2.ev.once('ended', r));
  const m2 = a2.restore('host_key_persist_0002');
  assert.equal(m2.state, 'ENDED'); assert.equal(m2.endReason, 'hết thời gian');
  await ended;
});

test('Giữ phòng báo tiến độ: webhook khi chốt, khi từng việc xong, khi đóng; biên bản ghi vào cùng một file', async (t) => {
  const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
  const minutesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-min-'));
  t.after(() => fs.rmSync(minutesDir, { recursive: true, force: true }));
  const got = [];
  const hook = http.createServer((req, res) => { let b = ''; req.on('data', c => { b += c; }); req.on('end', () => { got.push(JSON.parse(b)); res.end('ok'); }); });
  await new Promise(r => hook.listen(0, r)); t.after(() => hook.close());
  const app = createApp({ waitMs: 400, idleMs: 60000, tick: 30, minutesDir, webhooks: [`http://127.0.0.1:${hook.address().port}/x`] });
  await new Promise(r => app.server.listen(0, r)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const m = app.create();
  const post = (tool, o) => fetch(`${base}/a/${m.id}/${tool}`, { method: 'POST', body: form(o) }).then(r => r.text());
  await post('join', { name: 'Lam', model: 'x' }); await post('join', { name: 'Minh', model: 'x' });
  const host = (act, body) => fetch(`${base}/api/host/${m.hostKey}/${act}`, { method: 'POST', body: JSON.stringify(body || {}) }).then(r => r.json());
  await host('start', { context: 'Chia việc repo thử', settings: { followUp: true } });
  await post('say', { name: 'Lam', text: 'KẾT LUẬN: ok\nVIỆC: Lam | sửa lỗi | hôm nay\nVIỆC: Minh | viết test | hôm nay' });
  assert.match(await post('leave', { name: 'Lam' }), new RegExp(`${base}/a/${m.id}/progress`));
  await post('leave', { name: 'Minh' });
  assert.equal(m.state, 'WORK');
  const s = await (await fetch(`${base}/api/host/${m.hostKey}/state`)).json();
  assert.equal(s.state, 'WORK'); assert.equal(s.settings.followUp, true); assert.ok(s.workSince);
  assert.match(await post('progress', { name: 'Lam', task: '1', status: 'xong', note: 'commit abc' }), /Đã cập nhật việc #1: xong/);
  await post('progress', { name: 'Minh', task: '2', status: 'vướng', note: 'thiếu quyền' });
  assert.equal((await host('task', { n: 2, status: 'done', note: 'chủ trì sửa quyền, test xanh' })).ok, true);
  assert.equal(m.state, 'ENDED');
  for (let i = 0; i < 50 && got.length < 5; i++) await new Promise(r => setTimeout(r, 20));
  assert.deepEqual(got.map(g => g.event + (g.task ? `#${g.task.id}:${g.task.status}` : '')), ['work', 'task#1:done', 'task#2:blocked', 'task#2:done', 'ended']);
  assert.match(got[0].text, /đã chốt, đang theo dõi tiến độ/); assert.match(got.at(-1).text, /Đã đóng phòng theo dõi tiến độ[\s\S]*2\/2 xong/);
  const files = fs.readdirSync(minutesDir);
  assert.equal(files.length, 2); // .md + .json, ghi đè lúc đóng
  const j = JSON.parse(fs.readFileSync(path.join(minutesDir, files.find(f => f.endsWith('.json'))), 'utf8'));
  assert.equal(j.state, 'ENDED'); assert.ok(j.concludedAt); assert.deepEqual(j.actions.map(a => a.status), ['done', 'done']);
});

test('Họp tiếp: mang việc chưa xong (giữ số, trạng thái, bằng chứng) và quyết định sang cuộc sau', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const host = (k, act, body) => fetch(`${base}/api/host/${k}/${act}`, { method: 'POST', body: JSON.stringify(body || {}) }).then(r => r.json());
  const tokMinh = 'tok_minh_carry_0000000001';
  m.join('Lam', 'x'); m.join('Minh', 'x', null, undefined, { token: tokMinh });
  m.start('Sửa lỗi đăng nhập\nchi tiết', '');
  m.say('Lam', 'KẾT LUẬN: dùng OAuth\nVIỆC: Lam | sửa callback | mai\nVIỆC: Minh | viết test | mai\nVIỆC: Lam | cập nhật docs | thứ 6');
  m.progress('Lam', '1', 'xong', 'commit abc'); m.progress('Minh', '2', 'đang làm', 'đã có 3/5 test');
  const { hostKey } = await host(m.hostKey, 'new', { carry: true });
  const n = app.meetings.get(hostKey);
  assert.equal(n.state, 'LOBBY');
  assert.deepEqual(n.actions.map(a => [a.n, a.status, a.note, a.carried]), [[2, 'doing', 'đã có 3/5 test', true], [3, 'todo', '', true]]);
  assert.equal(m.actions.length, 3); // cuộc cũ giữ nguyên
  const s = await (await fetch(`${base}/api/host/${hostKey}/state`)).json();
  assert.equal(s.carry.topic, 'Sửa lỗi đăng nhập'); assert.match(s.carry.decisions[0].text, /dùng OAuth/); assert.equal(s.carry.done[0].n, 1);
  // agent cuộc trước báo tiến độ việc mang sang khi cuộc mới còn ở phòng chờ (chưa join lại)
  // (mã riêng của cuộc trước được mang sang để chứng minh danh tính)
  const r = await fetch(`${base}/a/${m.id}/progress`, { method: 'POST', headers: { authorization: `Bearer ${tokMinh}` }, body: form({ task: '2', status: 'xong', note: 'PR #9' }) }).then(r => r.text());
  assert.match(r, /Đã cập nhật việc #2: xong\. Cuộc họp trước đã đóng/);
  // chỉ có tên (không có mã) thì không báo được, kể cả tên của thành viên cũ
  for (const name of ['La', 'Lam']) assert.match(await fetch(`${base}/a/${m.id}/progress`, { method: 'POST', body: form({ name, task: '3', status: 'xong' }) }).then(r => r.text()), /không nhận ra bạn/);
  n.join('Lam', 'x');
  n.start('Họp review tiến độ', '');
  const intro = n.log.find(x => x.type === 'host').text;
  assert.match(intro, /TỪ CUỘC HỌP TRƯỚC \(Sửa lỗi đăng nhập\)/); assert.match(intro, /- dùng OAuth/);
  assert.match(intro, /Việc đã báo xong:\n- #1 sửa callback \(Lam\): commit abc/);
  assert.match(intro, /Việc CHƯA XONG[^\n]*\n- #3 Lam — cập nhật docs \(hạn: thứ 6\): chưa làm/);
  assert.doesNotMatch(intro, /#2 Minh/); // đã báo xong trước khi họp
  n.say('Lam', 'VIỆC: Lam | viết changelog | mai');
  assert.equal(n.actions.at(-1).n, 4); // số việc không dùng lại
  const md = minutes.toMarkdown(n), j = minutes.toJSON(n);
  assert.match(md, /## Từ cuộc họp trước: Sửa lỗi đăng nhập/); assert.match(md, /\| 3 ↩ \| cập nhật docs/);
  assert.equal(j.carriedFrom.done.length, 1); assert.deepEqual(j.actions.map(a => a.carried), [true, true, false]);
  // "Cuộc họp mới" không mang gì
  const k2 = (await host(hostKey, 'new', {})).hostKey;
  assert.equal(app.meetings.get(k2).actions.length, 0); assert.equal(app.meetings.get(k2).carry, null);
});

test('MCP: giữ phòng báo tiến độ, agent MCP được hướng dẫn gọi tool progress', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const call = async (id, name, args) => (await (await rpc(base, m.id, { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } })).json()).result.content[0].text;
  await call(1, 'join', { name: 'Codex-1', model: 'GPT-5' });
  m.start('x', '', { followUp: true });
  await call(2, 'say', { name: 'Codex-1', text: 'KẾT LUẬN: ok\nVIỆC: Codex-1 | sửa lỗi | mai' });
  const left = await call(3, 'leave', { name: 'Codex-1' });
  assert.equal(m.state, 'WORK');
  assert.match(left, /Tool MCP: progress\(name="Codex-1", task="<số việc>", status="xong", note="<bằng chứng>"\)/);
  assert.doesNotMatch(left, /\/progress"/); // báo tiến độ bằng tool; chỉ phần tệp mới dùng curl
  assert.ok(left.includes(`curl -s -X POST "${base}/a/${m.id}/send?to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP" -H "Authorization: Bearer `), left);
  assert.match(await call(4, 'progress', { name: 'Codex-1', task: '1', status: 'xong', note: 'commit 1a2b' }), /phòng đã đóng/);
  assert.equal(m.state, 'ENDED');
});

test('chủ trì đổi trạng thái, gộp và xoá việc qua API', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  m.join('A', 'x'); m.start('x', '');
  m.say('A', 'KẾT LUẬN: ok\nVIỆC: A | viết parser\nVIỆC: A | viết test\nVIỆC: A | dựng CI');
  const task = (body) => fetch(`${base}/api/host/${m.hostKey}/task`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  assert.deepEqual(await task({ n: 1, status: 'xong', note: 'PR #3' }), { ok: true });
  assert.deepEqual(await task({ n: 2, remove: true, into: '1' }), { ok: true });
  assert.deepEqual(await task({ n: 3, remove: true }), { ok: true });
  assert.deepEqual(await task({ n: 9, remove: true }), { ok: false });
  assert.deepEqual(m.actions.map(a => [a.n, a.status]), [[1, 'done']]);
  const md = await fetch(`${base}/api/host/${m.hostKey}/minutes.md`).then(r => r.text());
  assert.match(md, /Chủ trì gộp việc #2/); assert.match(md, /^\| 1 \| viết parser/m); assert.doesNotMatch(md, /^\| [23] \|/m);
});

test('bắt đầu bị từ chối (409) khi brief có N vai trò mà chưa đủ N agent, trừ khi force', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const start = (body) => fetch(`${base}/api/host/${m.hostKey}/start`, { method: 'POST', body: JSON.stringify(body) });
  m.join('A', 'x');
  const r = await start({ context: 'x', roles: ['giám sát', 'dựng MVP'] });
  assert.equal(r.status, 409);
  const d = await r.json();
  assert.match(d.error, /Cần 2 agent theo vai trò \(đang có 1\)/);
  assert.deepEqual([d.need, d.have], [2, 1]);
  assert.equal(m.state, 'LOBBY');
  // vai trò trống ở cuối không giao gì nên không tính; không có vai trò thì như cũ
  assert.equal((await start({ context: 'x', roles: ['giám sát', ''] })).status, 200);
  const n = app.create();
  assert.equal((await fetch(`${base}/api/host/${n.hostKey}/start`, { method: 'POST', body: JSON.stringify({ context: 'x', roles: ['a', 'b'], force: true }) })).status, 200);
  assert.equal(n.state, 'LIVE');
  const z = app.create();
  assert.equal((await fetch(`${base}/api/host/${z.hostKey}/start`, { method: 'POST', body: JSON.stringify({ context: 'x', roles: [] }) })).status, 200);
});
