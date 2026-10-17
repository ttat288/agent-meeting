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
  assert.deepEqual(list.result.tools.map(x => x.name), ['join', 'wait', 'say', 'typing', 'leave', 'history']);
  const join = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'join', arguments: { name: 'A' } } })).json();
  assert.match(join.result.content[0].text, /slot 1/);
  const bad = await (await rpc(base, m.id, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } })).json();
  assert.equal(bad.error.code, -32601);
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
  assert.equal((await p).state, 'LIVE');
  assert.equal((await fetch(`${base}/api/host/${m.id}/stop`, { method: 'POST' })).status, 404);
  await fetch(`${base}/api/host/${m.hostKey}/stop`, { method: 'POST' });
  assert.equal(m.state, 'ENDED');
  assert.equal((await fetch(`${base}/m/${m.hostKey}`)).status, 200);
});
