'use strict';
// connect/disconnect (CLI giả, HOME giả: không đụng cấu hình thật) và cầu nối MCP stdio chạy thật với server.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'am-connect-'));
process.env.AGENT_MEETING_HOME = path.join(tmp, 'am');
process.env.AGENT_MEETING_USER_HOME = path.join(tmp, 'home');
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const conn = require('../src/connect');
const { createApp } = require('../src/server');

// CLI giả: ghi lại tham số vào <tên>.log, luôn thành công
function fakeCli(name) {
  const f = path.join(tmp, `fake-${name}`), log = path.join(tmp, `${name}.log`);
  fs.writeFileSync(f, `#!${process.execPath}\nrequire('fs').appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + '\\n');\n`, { mode: 0o755 });
  process.env[`AGENT_MEETING_${name.toUpperCase()}_BIN`] = f;
  return () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
}
const quiet = () => { const lines = []; return { out: (l) => lines.push(l), lines }; };

test('connect claude: cài cầu nối, đăng ký MCP bằng CLI của Claude, cấp quyền đúng tool hội thoại (không có send_file)', () => {
  const calls = fakeCli('claude');
  const settings = path.join(tmp, 'home', '.claude', 'settings.json');
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  fs.writeFileSync(settings, JSON.stringify({ model: 'opus', permissions: { allow: ['Bash(npm test)'], deny: ['Bash(rm -rf *)'] } }));
  const o = quiet();
  assert.equal(conn.connect('claude', o).ok, true);
  const bridge = fs.readFileSync(conn.bridgePath(), 'utf8');
  assert.match(bridge, /"name":"join"/); assert.doesNotMatch(bridge, /__VERSION__/);
  assert.deepEqual(calls(), [['mcp', 'remove', '-s', 'user', 'agent-meeting'], ['mcp', 'add', '-s', 'user', 'agent-meeting', '--', process.execPath, conn.bridgePath()]]);
  const s = JSON.parse(fs.readFileSync(settings, 'utf8'));
  assert.equal(s.model, 'opus'); assert.deepEqual(s.permissions.deny, ['Bash(rm -rf *)']);
  assert.deepEqual(s.permissions.allow, ['Bash(npm test)', ...['join', 'wait', 'say', 'pass', 'typing', 'progress', 'files', 'leave', 'history', 'get_file'].map(t => `mcp__agent-meeting__${t}`)]);
  assert.ok(!s.permissions.allow.some(r => /send_file|\*/.test(r)), 'không cấp quyền gửi tệp, không dùng *');
  const backups = () => fs.readdirSync(path.dirname(settings)).filter(f => f.includes('.bak-agent-meeting-'));
  assert.equal(backups().length, 1);
  // chạy lại: không trùng rule, không sao lưu thêm
  conn.connect('claude', quiet());
  assert.equal(JSON.parse(fs.readFileSync(settings, 'utf8')).permissions.allow.length, 11);
  assert.equal(backups().length, 1);
  // disconnect: gỡ đúng rule của agent-meeting
  conn.disconnect('claude', quiet());
  assert.deepEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).permissions.allow, ['Bash(npm test)']);
  assert.deepEqual(calls().at(-1), ['mcp', 'remove', '-s', 'user', 'agent-meeting']);
});

test('connect: settings.json hỏng thì không sửa; không có CLI thì in lệnh để người dùng tự chạy', () => {
  fakeCli('claude');
  const settings = path.join(tmp, 'home', '.claude', 'settings.json');
  fs.writeFileSync(settings, '{ hỏng');
  const o = quiet();
  assert.equal(conn.connect('claude', o).ok, false);
  assert.equal(fs.readFileSync(settings, 'utf8'), '{ hỏng');
  assert.ok(o.lines.some(l => /không phải JSON hợp lệ/.test(l)));
  fs.rmSync(settings);
  process.env.AGENT_MEETING_GEMINI_BIN = path.join(tmp, 'khong-co-gemini');
  fs.writeFileSync(process.env.AGENT_MEETING_GEMINI_BIN, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const g = conn.connect('gemini', quiet());
  assert.equal(g.ok, false);
  // policy của Gemini vẫn được ghi; không có send_file
  const pol = fs.readFileSync(path.join(tmp, 'home', '.gemini', 'policies', 'agent-meeting.toml'), 'utf8');
  assert.match(pol, /mcpName = "agent-meeting"\ntoolName = "wait"\ndecision = "allow"/); assert.doesNotMatch(pol, /toolName = "send_file"/);
  conn.disconnect('gemini', quiet());
  assert.equal(fs.existsSync(path.join(tmp, 'home', '.gemini', 'policies', 'agent-meeting.toml')), false);
  assert.throws(() => conn.connect('cursor', quiet()), /agent phải là/);
});

test('connect --room: lưu phòng ở máy khác; URL lạ bị từ chối', () => {
  fakeCli('codex');
  conn.connect('codex', { ...quiet(), room: 'https://abc.trycloudflare.com/a/0123456789abcdef01234567/join' });
  const r = conn.readRooms();
  assert.equal(r.current, 'abc.trycloudflare.com');
  assert.deepEqual(r.rooms['abc.trycloudflare.com'], { url: 'https://abc.trycloudflare.com', room: '0123456789abcdef01234567' });
  assert.deepEqual(conn.parseRoom('http://localhost:3000/mcp/abcd1234'), { url: 'http://localhost:3000', room: 'abcd1234' });
  for (const bad of ['ftp://x/a/abc', 'https://x/m/abc', 'không phải url']) assert.equal(conn.parseRoom(bad), null, bad);
  assert.throws(() => conn.connect('codex', { ...quiet(), room: 'https://x/m/abc' }), /không phải URL mời/);
  if (process.platform !== 'win32') assert.equal(fs.statSync(conn.roomsPath()).mode & 0o777, 0o600);
});

// ---------- cầu nối stdio ----------
function bridge(cwd) {
  const p = spawn(process.execPath, [conn.bridgePath()], { cwd, env: { ...process.env }, stdio: ['pipe', 'pipe', 'inherit'] });
  let buf = ''; const waiting = new Map();
  p.stdout.setEncoding('utf8');
  p.stdout.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\n')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); waiting.get(m.id)?.(m); } });
  let id = 0;
  const call = (method, params) => new Promise((ok) => { const n = ++id; waiting.set(n, ok); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n'); });
  const tool = async (name, args) => (await call('tools/call', { name, arguments: args })).result.content[0].text;
  return { p, call, tool };
}

test('cầu nối: chạy được khi chưa có phòng; vào phòng trên máy này; gửi/nhận tệp trong thư mục làm việc', async (t) => {
  fakeCli('claude'); conn.connect('claude', quiet());
  fs.rmSync(conn.roomsPath(), { force: true });
  const work = fs.mkdtempSync(path.join(tmp, 'work-'));
  const b = bridge(work); t.after(() => b.p.kill());
  // MCP nạp lúc mở phiên agent, có thể trước khi chạy agent-meeting: initialize/tools/list vẫn trả lời
  const init = await b.call('initialize', { protocolVersion: '2025-06-18' });
  assert.equal(init.result.serverInfo.name, 'agent-meeting');
  const names = (await b.call('tools/list')).result.tools.map(x => x.name);
  assert.deepEqual(names, ['join', 'wait', 'say', 'pass', 'typing', 'progress', 'files', 'leave', 'history', 'send_file', 'get_file']);
  const tools = (await b.call('tools/list')).result.tools;
  assert.equal(tools.find(x => x.name === 'send_file').annotations.openWorldHint, true); // gửi ra ngoài: để agent hỏi
  assert.ok(!tools.some(x => /url|host/i.test(JSON.stringify(x.inputSchema.properties))), 'không tool nào nhận URL');
  assert.match(await b.tool('join', { name: 'Lan', model: 'x' }), /Chưa có phòng họp nào/);

  const app = createApp({ waitMs: 300, idleMs: 60000, tick: 20 });
  await new Promise(r => app.server.listen(0, '127.0.0.1', r)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`, m = app.create();
  conn.setLocalRoom(`http://localhost:${app.server.address().port}`, m.id);
  assert.equal(JSON.parse(fs.readFileSync(conn.roomsPath(), 'utf8')).rooms.local.url, `http://127.0.0.1:${app.server.address().port}`);
  const j = await b.tool('join', { name: 'Lan', model: 'Opus 5.5' });
  assert.match(j, /tên "Lan"/); assert.match(j, /send_file\(name="Lan", path="ĐƯỜNG_DẪN_TỆP"/); assert.doesNotMatch(j, /Bearer|curl -s -X POST/);
  m.join('Minh', 'x'); m.start('ctx', '');
  assert.match(await b.tool('say', { name: 'Lan', text: 'chào' }), /Đã gửi/);
  assert.deepEqual(m.log.filter(x => x.type === 'chat').map(x => x.name), ['Lan']);
  assert.deepEqual(m.agents.get('Lan').via, 'local'); assert.equal(m.agents.get('Lan').bridge, true);
  // gửi tệp trong thư mục làm việc
  fs.writeFileSync(path.join(work, 'fix.patch'), 'patch-noi-dung');
  assert.match(await b.tool('send_file', { name: 'Lan', path: 'fix.patch', to: 'Minh' }), /Đã gửi tệp fix\.patch/);
  assert.equal(m.files[0].from, 'Lan'); assert.equal(m.files[0].to, 'Minh');
  // ra ngoài thư mục làm việc, tệp nhạy cảm: từ chối
  fs.writeFileSync(path.join(tmp, 'ngoai.txt'), 'x'); fs.writeFileSync(path.join(work, '.env'), 'A=1');
  for (const p of ['../ngoai.txt', path.join(tmp, 'ngoai.txt'), '.env'])
    assert.match(await b.tool('send_file', { name: 'Lan', path: p }), /Không kết nối được|chỉ dùng được|nhạy cảm/, p);
  assert.equal(m.files.length, 1);
  // nhận tệp: lưu vào thư mục làm việc, không ghi đè
  m.join('Tu', 'x', null, undefined, { token: 'tok_tu_000000000001' });
  const up2 = await fetch(`${base}/a/${m.id}/send?file=tra-loi.txt&to=Lan`, { method: 'POST', headers: { authorization: 'Bearer tok_tu_000000000001' }, body: 'ok' });
  assert.equal(up2.status, 200);
  const fid = m.files.at(-1).id;
  assert.match(await b.tool('get_file', { name: 'Lan', id: fid }), /Đã lưu tra-loi\.txt \(2 B/);
  assert.equal(fs.readFileSync(path.join(work, 'tra-loi.txt'), 'utf8'), 'ok');
  assert.match(await b.tool('get_file', { name: 'Lan', id: fid }), /không ghi đè/);
  assert.match(await b.tool('get_file', { name: 'Lan', id: fid, path: '../ra-ngoai.txt' }), /Không kết nối được|chỉ dùng được/);
});
