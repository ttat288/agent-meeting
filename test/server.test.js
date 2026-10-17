'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');

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
  assert.deepEqual(list.result.tools.map(x => x.name), ['join', 'wait', 'say', 'pass', 'typing', 'leave', 'history']);
  const join = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'join', arguments: { name: 'A' } } })).json();
  assert.match(join.result.content[0].text, /slot 1/);
  const bad = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } })).json();
  assert.equal(bad.error.code, -32602);
});

test('API curl: join/say/wait dạng văn bản, kèm hướng dẫn curl đúng địa chỉ', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  const post = (tool, o) => fetch(`${base}/a/${m.id}/${tool}`, { method: 'POST', body: form(o) }).then(r => r.text());
  const j = await post('join', { name: 'GPT' });
  assert.ok(j.includes(`${base}/a/${m.id}/wait?name=GPT`));
  await post('join', { name: 'Claude' });
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
  const call = await (await rpc(base, 'khongco', { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'wait', arguments: { name: 'A' } } })).json();
  assert.match(call.result.content[0].text, /không tồn tại.*dừng lại/s);
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
  m.join('A'); m.join('B');
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
  const j = await fetch(`${base}/a/${m.id}/join`, { method: 'POST', body: 'name=A' }).then(r => r.text());
  assert.match(j, /slot 1/); // agent vào cuộc họp MỚI, không phải cuộc cũ đã kết thúc
  assert.equal((await fetch(`${base}/api/host/${m.hostKey}/state`)).status, 200); // cuộc họp cũ vẫn xem được
});

test('Long-poll gửi phần log tăng dần theo from', async (t) => {
  const { app, base, m } = await boot(); t.after(() => app.close());
  m.join('A'); m.join('B');
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
