'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const B = require('../src/brief');
const { Meeting, BOUNDS, MAX_AGENDA } = require('../src/meeting');
const { createApp } = require('../src/server');

const full = {
  schema: 'agent-meeting/brief@1',
  context: 'Chọn database cho app todo.',
  endCondition: 'Khi chốt được DB',
  settings: { agenda: ['Chọn DB', 'Chia việc'], followUp: true, mode: 'turns', maxMsgs: 60, timeLimitMin: 30, idleSec: 20 },
  roles: ['phản biện', 'bảo mật'],
};
const keys = (r) => r.map(x => x.key);

test('giới hạn trùng với src/meeting.js', () => {
  assert.deepEqual(B.LIMITS.maxMsgs, BOUNDS.maxMsgs);
  assert.deepEqual(B.LIMITS.timeLimitMin, BOUNDS.timeLimitMin);
  assert.deepEqual(B.LIMITS.idleSec, BOUNDS.idleMs.map(x => x / 1000));
  assert.equal(B.LIMITS.agenda, MAX_AGENDA);
  const m = new Meeting();
  m.start('x'.repeat(9000), 'y'.repeat(2000));
  assert.equal(m.context.length, B.LIMITS.context);
  assert.equal(m.endCondition.length, B.LIMITS.endCondition);
});

test('JSON hợp lệ: giữ nguyên, không lỗi, không cảnh báo', () => {
  const r = B.parseBrief(JSON.stringify(full));
  assert.equal(r.ok, true);
  assert.deepEqual(r.brief, full);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('bọc trong ```json và có câu dẫn của AI', () => {
  const r = B.parseBrief('Đây là bản brief:\n\n```json\n' + B.stringify(full) + '\n```\nChúc họp vui!');
  assert.equal(r.ok, true);
  assert.deepEqual(r.brief, full);
  const p = B.parseBrief('Bản brief của bạn: ' + JSON.stringify(full) + ' — hết.');
  assert.equal(p.ok, true);
  assert.deepEqual(keys(p.warnings), ['']); // báo đã bỏ phần chữ ngoài JSON
});

test('trường thiếu lấy giá trị base (mặc định của server)', () => {
  const r = B.parseBrief('{"context": "abc"}', { settings: { maxMsgs: 200, followUp: true } });
  assert.equal(r.ok, true);
  assert.equal(r.brief.settings.maxMsgs, 200);
  assert.equal(r.brief.settings.followUp, true);
  assert.equal(r.brief.settings.mode, 'free');
  assert.deepEqual(r.brief.settings.agenda, []);
  assert.deepEqual(r.brief.roles, []);
});

test('lỗi cú pháp: báo dòng, cột và lý do bằng tiếng Việt', () => {
  const cases = [
    ['{\n  "context": "a",\n}', 3, /thừa dấu phẩy/],
    ['{\n  "context": "a"\n  "endCondition": ""\n}', 3, /thiếu dấu phẩy/],
    ["{\n  'context': 'a'\n}", 2, /ngoặc kép/],
    ['{\n  "context": “a”\n}', 2, /ngoặc cong/],
    ['{\n  "context": "dòng 1\ndòng 2"\n}', 2, /xuống dòng/],
    ['{\n  "context": "a",\n  "settings": {\n    "agenda": ["x"', 4, /cắt cụt/],
    ['```json\n{\n  "context" "a"\n}\n```', 3, /thiếu dấu :/],
  ];
  for (const [txt, line, re] of cases) {
    const r = B.parseBrief(txt);
    assert.equal(r.ok, false, txt);
    assert.equal(r.brief, null);
    assert.equal(r.errors.length, 1);
    assert.equal(r.errors[0].line, line, txt + ' → ' + r.errors[0].msg);
    assert.match(r.errors[0].msg, re);
    assert.match(r.errors[0].msg, /dòng \d+, cột \d+/);
  }
});

test('sai kiểu từng trường: lỗi theo khoá, có số dòng', () => {
  const r = B.parseBrief(B.stringify({ context: 42, settings: { agenda: 'Mục 1\nMục 2', followUp: 'có', mode: 'nhanh', maxMsgs: 'nhiều', idleSec: true }, roles: [{ x: 1 }] }));
  assert.equal(r.ok, false);
  assert.deepEqual(keys(r.errors).sort(), ['context', 'roles', 'settings.followUp', 'settings.idleSec', 'settings.maxMsgs', 'settings.mode'].sort());
  for (const e of r.errors) assert.ok(e.line > 1, e.key);
  assert.equal(B.parseBrief('[1, 2]').ok, false);
  assert.equal(B.parseBrief('"chuỗi"').ok, false);
  assert.equal(B.parseBrief('{"settings": [1]}').errors[0].key, 'settings');
});

test('khoan dung: số ngoài khoảng bị kẹp, chuỗi số, true/false trong ngoặc kép, đánh số mục', () => {
  const r = B.parseBrief(JSON.stringify({ context: 'a', settings: { maxMsgs: 5000, timeLimitMin: -3, idleSec: '25', followUp: 'true', agenda: ['1. Chọn DB', '- Chia việc', ''] } }));
  assert.equal(r.ok, true);
  assert.equal(r.brief.settings.maxMsgs, 1000);
  assert.equal(r.brief.settings.timeLimitMin, 0);
  assert.equal(r.brief.settings.idleSec, 25);
  assert.equal(r.brief.settings.followUp, true);
  assert.deepEqual(r.brief.settings.agenda, ['Chọn DB', 'Chia việc']);
  assert.deepEqual(keys(r.warnings).sort(), ['settings.followUp', 'settings.maxMsgs', 'settings.timeLimitMin'].sort());
  assert.equal(B.parseBrief('{"context":"a","settings":{"maxMsgs":12.6}}').brief.settings.maxMsgs, 13);
});

test('quá dài: cắt và cảnh báo; quá nhiều mục: giữ 20', () => {
  const r = B.parseBrief(JSON.stringify({ context: 'x'.repeat(9000), endCondition: 'y'.repeat(1200), settings: { agenda: Array.from({ length: 25 }, (_, i) => 'Mục ' + i + ' ' + 'z'.repeat(i ? 0 : 300)) }, roles: Array(22).fill('vai') }));
  assert.equal(r.ok, true);
  assert.equal(r.brief.context.length, 8000);
  assert.equal(r.brief.endCondition.length, 1000);
  assert.equal(r.brief.settings.agenda.length, 20);
  assert.equal(r.brief.settings.agenda[0].length, 200);
  assert.equal(r.brief.roles.length, 20);
  assert.ok(r.warnings.length >= 5);
});

test('khoá lạ: cảnh báo chứ không lỗi; khoá settings đặt ở ngoài thì chuyển vào', () => {
  const r = B.parseBrief(JSON.stringify({ schema: 'khac', context: 'a', title: 'x', agenda: ['A'], followUp: true, settings: { foo: 1 } }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.brief.settings.agenda, ['A']);
  assert.equal(r.brief.settings.followUp, true);
  assert.deepEqual(keys(r.warnings).sort(), ['agenda', 'followUp', 'schema', 'settings.foo', 'title'].sort());
});

test('còn chỗ trống <…> hoặc chưa có bối cảnh: cảnh báo', () => {
  const r = B.parseBrief(JSON.stringify({ context: 'Tranh luận về: <chủ đề>.', roles: ['<vai trò 1>'] }));
  assert.equal(r.ok, true);
  assert.deepEqual(keys(r.warnings).sort(), ['context', 'roles']);
  assert.match(r.warnings[0].msg, /<chủ đề>/);
  assert.deepEqual(keys(B.parseBrief('{}').warnings), ['context']);
});

test('chuỗi rất lớn hoặc rỗng bị từ chối', () => {
  const big = B.parseBrief(JSON.stringify({ context: 'x'.repeat(70000) }));
  assert.equal(big.ok, false);
  assert.match(big.errors[0].msg, /quá lớn/);
  assert.equal(B.parseBrief('').ok, false);
  assert.equal(B.parseBrief('   ').ok, false);
  assert.equal(B.parseBrief(null).ok, false);
});

test('vai trò rỗng ở giữa được giữ (bỏ trống vai trò của slot đó), rỗng ở cuối bị bỏ', () => {
  const r = B.parseBrief(JSON.stringify({ context: 'a', roles: ['', 'phản biện', '', ''] }));
  assert.deepEqual(r.brief.roles, ['', 'phản biện']);
});

test('toBrief từ form và đi vòng parse(stringify) không đổi', () => {
  const b = B.toBrief({ context: '  Chọn DB ', endCondition: '', agenda: '1. A\n\n2. B', followUp: true, mode: 'turns', maxMsgs: '80', timeLimitMin: 0, idleSec: 40, roles: ['x'] });
  assert.deepEqual(b, { schema: B.SCHEMA, context: 'Chọn DB', endCondition: '', settings: { agenda: ['A', 'B'], followUp: true, mode: 'turns', maxMsgs: 80, timeLimitMin: 0, idleSec: 40 }, roles: ['x'] });
  assert.deepEqual(B.parseBrief(B.stringify(b)).brief, b);
});

test('aiPrompt: có mô tả trường, giới hạn, JSON mẫu đúng định dạng và câu chỉ trả JSON', () => {
  const p = B.aiPrompt(B.defaults());
  assert.match(p, /DUY NHẤT một khối JSON/);
  assert.match(p, /8000/);
  assert.match(p, /"roles"/);
  assert.match(p, /Mô tả cuộc họp của tôi:\n$/);
  assert.doesNotMatch(p, B.PLACEHOLDER); // không để chỗ trống <…> trong prompt (AI dễ chép lại)
  const sample = p.slice(p.indexOf('{'), p.indexOf('\n}\n') + 2);
  const r = B.parseBrief(sample);
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
  const mine = B.aiPrompt(full);
  assert.match(mine, /bản nháp hiện tại/);
  assert.ok(mine.includes(B.stringify(full)));
});

test('roles theo thứ tự slot khi bắt đầu; không đè vai trò chủ trì giao tay', () => {
  const m = new Meeting({ waitMs: 50, tick: 20 });
  m.join('An', 'x'); m.join('Bình', 'y'); m.join('Chi', 'z');
  m.leave('Bình');
  m.setRole('Chi', 'thư ký');
  m.start('bàn', '', {}, ['phản biện', 'bảo mật', 'thừa']);
  const role = (n) => m.agents.get(n).role || '';
  assert.equal(role('An'), 'phản biện');
  assert.equal(role('Bình'), '');
  assert.equal(role('Chi'), 'thư ký'); // slot thứ 2 đang có mặt, đã có vai trò tay
  assert.match(m.log.find(x => x.type === 'host').text, /Vai trò:\n- An: phản biện\n- Chi: thư ký/);
  m.stop(); m.close?.();
});

test('server: /assets/brief.js phục vụ đúng; POST start nhận nguyên bản brief (cả roles)', async () => {
  const app = createApp({});
  await new Promise(r => app.server.listen(0, r));
  const port = app.server.address().port;
  const req = (method, p, body) => new Promise((ok, fail) => {
    const r = http.request({ port, path: p, method, headers: { 'content-type': 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => ok({ status: res.statusCode, headers: res.headers, body: d }));
    });
    r.on('error', fail); if (body) r.write(body); r.end();
  });
  try {
    const js = await req('GET', '/assets/brief.js');
    assert.equal(js.status, 200);
    assert.match(js.headers['content-type'], /javascript/);
    assert.match(js.body, /AgentMeetingBrief/);
    const mt = app.create();
    mt.join('Lan', 'Opus');
    const res = await req('POST', `/api/host/${mt.hostKey}/start`, B.stringify(full));
    assert.equal(JSON.parse(res.body).ok, true);
    assert.equal(mt.state, 'LIVE');
    assert.equal(mt.agents.get('Lan').role, 'phản biện');
    assert.deepEqual(mt.agenda, full.settings.agenda);
    assert.equal(mt.cfg.followUp, true);
    assert.equal(mt.cfg.mode, 'turns');
    assert.equal(mt.cfg.maxMsgs, 60);
  } finally { app.close(); }
});

test('preset (bản brief từ CLI): chỉ hiện ở phòng chờ, lưu qua --data-dir', () => {
  const m = new Meeting();
  m.preset = B.toBrief({ context: 'abc', roles: ['x'] });
  assert.deepEqual(m.snapshot().preset, m.preset);
  const n = new Meeting(); n.restore(JSON.parse(JSON.stringify(m.toState())));
  assert.deepEqual(n.preset, m.preset);
  m.start('abc');
  assert.equal(m.snapshot().preset, null);
  m.stop();
});
