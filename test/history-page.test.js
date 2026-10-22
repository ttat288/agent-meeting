'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { Meeting } = require('../src/meeting');
const { createApp } = require('../src/server');
function meeting() {
  const m = new Meeting({ waitMs: 10, idleMs: 60000, tick: 2, maxMsgs: 1000 });
  m.join('Reader', 'fixture'); m.join('Other', 'fixture'); m.start('history fixture', ''); return m;
}
test('pages reconstruct exactly the visible history without changing wait cursor or leaking private messages', async () => {
  const m = meeting(); await m.wait('Reader'); const cursor = m.agents.get('Reader').cursor;
  for (let i = 0; i < 35; i++) m.hostSay(`message-${i} ` + 'Tiếng Việt 😀 '.repeat(30), i % 7 === 0 ? 'Other' : undefined);
  m.hostSay('reader-only-secret', 'Reader');
  let offset = 0; const all = [];
  do { const p = JSON.parse(m.history('Reader', {offset, limit:3, maxChars:1024}));
    assert(p.messages.length <= 3); assert(p.chars <= 1024 || p.messages.length === 1);
    all.push(...p.messages); offset = p.nextOffset;
  } while (offset !== null);
  assert.equal(all.join('\n\n'), m.history('Reader'));
  assert.doesNotMatch(all.join('\n'), /message-0 |message-7 /); assert.match(all.join('\n'), /reader-only-secret/);
  assert.equal(m.agents.get('Reader').cursor, cursor);
  assert.match(await m.wait('Reader'), /message-1 /);
});
test('page budgets keep oversized messages whole; bad bounds rejected and empty/end offsets terminate', () => {
  const m = meeting(); m.hostSay('Z'.repeat(2000));
  const p = JSON.parse(m.history('Reader', {offset:m.log.length-1, maxChars:1024}));
  assert.equal(p.oversized, true); assert.equal(p.messages.length, 1); assert.match(p.messages[0], /Z{2000}/);
  assert.equal(JSON.parse(m.history('Reader', {offset:99999})).nextOffset, null);
  for (const options of [{offset:-1}, {limit:0}, {limit:101}, {maxChars:1023}, {offset:1.5}, {limit:true}]) assert.match(m.history('Reader', options), /^history:/);
});
test('HTTP and MCP history pages enforce authenticated identity despite spoofed name; join admission remains intact', async t => {
  const app = createApp({ waitMs: 10, idleMs: 60000, tick: 2, admit:'all' });
  await new Promise(r => app.server.listen(0, '127.0.0.1', r)); t.after(() => app.close());
  const m = app.create(), base = `http://127.0.0.1:${app.server.address().port}`;
  const rpc = async (body, sid) => fetch(`${base}/mcp/${m.id}`, {method:'POST', headers:{'content-type':'application/json', ...(sid ? {'mcp-session-id':sid}: {})}, body:JSON.stringify({jsonrpc:'2.0', id:1, ...body})});
  const init = await rpc({method:'initialize'}), sid = init.headers.get('mcp-session-id'); assert(sid);
  const call = async (name, args) => (await (await rpc({method:'tools/call', params:{name, arguments:args}}, sid)).json()).result.content[0].text;
  assert.match(await call('join', {name:'Reader', model:'fixture'}), /CHỦ TRÌ DUYỆT/);
  assert.match(await call('history', {offset:0}), /chờ.*duyệt/s);
  m.admit('Reader', true); m.join('Other', 'fixture'); m.admit('Other', true); m.start('test', '');
  m.hostSay('not-for-reader', 'Other'); m.hostSay('visible-to-reader', 'Reader');
  const page = await call('history', {name:'Other', offset:0, limit:100});
  assert.doesNotMatch(page, /not-for-reader/); assert.match(page, /visible-to-reader/); assert.equal(JSON.parse(page).nextOffset, null);
  const token = m.agents.get('Reader').token;
  const text = await fetch(`${base}/a/${m.id}/history?name=Other&offset=0&limit=100`, {headers:{authorization:`Bearer ${token}`}}).then(r=>r.text());
  assert.deepEqual(JSON.parse(text), JSON.parse(page));
  const unauth = await fetch(`${base}/a/${m.id}/history?name=Reader&offset=0`).then(r=>r.text()); assert.doesNotMatch(unauth, /visible-to-reader/);
});
