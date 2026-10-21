'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createApp } = require('../src/server');
const { Meeting } = require('../src/meeting');
const { WorkManager } = require('../src/work');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const tmp = t => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-consistency-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; };
const post = (url, data) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
function setup(t) {
  const dir = tmp(t), store = new ConfigStore({ dir: path.join(dir, 'config'), defaults: routing.defaults, validate: routing.validate });
  const work = new WorkManager({ dir: path.join(dir, 'work'), configStore: store });
  const room = new Meeting({ hostKey: 'consistency_host_123456', id: 'consistency_agent_123456' });
  room.start('One shared objective', '', { agenda: [] }); room.hostSay('KẾT LUẬN: Chốt kế hoạch.\nVIỆC: Dev | Correct sum | today');
  work.refreshSource = () => work.syncRoom(room); work.refreshSource();
  t.after(() => work.close()); return { dir, store, work, room };
}
test('action adapter is idempotent and preserves provenance, manual reports and carry identity', t => {
  const { work, room } = setup(t), first = work.read().tasks[0], revision = work.read().revision;
  assert.equal(first.origin.context, room.context); assert.equal(first.origin.messageIndex, room.log.find(m => m.conclusion).i);
  for (let i = 0; i < 3; i++) work.syncRoom(room);
  assert.equal(work.read().tasks.length, 1); assert.equal(work.read().revision, revision);
  room.hostTask(1, 'done', 'Manual evidence'); work.syncRoom(room);
  assert.equal(work.read().tasks[0].reportedProgress.status, 'done'); assert.equal(work.read().tasks[0].status, 'planned');
  const next = new Meeting({ hostKey: room.hostKey }); next.carryIn({ context: room.context }, room.actions, room.taskSeq); work.syncRoom(next);
  assert.equal(work.read().tasks[0].id, first.id); assert.equal(work.read().tasks.length, 1); assert.equal(work.read().tasks[0].sourceCurrent, true);
  const fresh = new Meeting({ hostKey: room.hostKey }); work.syncRoom(fresh);
  assert.equal(work.read().tasks[0].sourceCurrent, false); assert.throws(() => { work.refreshSource = () => work.syncRoom(fresh); work.assertCurrent(first.id); }, /no longer/);
});
test('edits invalidate old evidence; configure CAS retains ID and rejects cycles and active-run edits', async t => {
  const { work, room } = setup(t), task = work.read().tasks[0];
  const configured = work.configureTask(task.id, { expectedRevision: 1, acceptance: ['Works'], purpose: 'execute', management: 'managed' });
  assert.equal(configured.id, task.id); assert.equal(configured.requirementRevision, 2);
  assert.throws(() => work.configureTask(task.id, { expectedRevision: 1, acceptance: ['Changed'] }), /reload/);
  const other = work.createTask({ goal: 'Dependency', acceptance: ['Valid'], dependencies: [task.id] });
  assert.throws(() => work.configureTask(task.id, { expectedRevision: 2, dependencies: [other.id] }), /cycle/);
  work.update(d => d.runs.push({ id: 'old-run', taskId: task.id, requirementRevision: 2, status: 'verified' }));
  room.actions[0].task = 'A changed requirement'; work.syncRoom(room);
  const updated = work.read().tasks[0]; assert.equal(updated.requirementRevision, 3); assert.equal(updated.status, 'stale');
  assert.throws(() => work.assertCurrent(task.id, 2), /revision changed/);
  await assert.rejects(() => work.integrate('old-run'), /revision changed/);
  work.update(d => { d.runs[0].status = 'running'; });
  assert.throws(() => work.configureTask(task.id, { expectedRevision: 3, acceptance: ['New acceptance'] }), /Cancel or reconcile/);
});
test('HTTP room → plan → execution requirements retains one task across restart and legacy deep links', async t => {
  const root = tmp(t), cfg = { dataDir: path.join(root, 'rooms'), configDir: path.join(root, 'config'), workDir: path.join(root, 'work'), waitMs: 20 };
  let app = createApp(cfg); t.after(() => app.close());
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const room = app.create({ hostKey: 'shared_host_123456789', id: 'shared_agent_123456789', fixed: true });
  let base = 'http://127.0.0.1:' + app.server.address().port;
  let api = suffix => base + '/api/host/' + room.hostKey + suffix;
  assert.equal((await post(api('/start'), { context: 'Single objective', agenda: [] })).status, 200);
  assert.equal((await post(api('/say'), { text: 'KẾT LUẬN: Đã chốt.\nVIỆC: Dev | Fix shared task | today' })).status, 200);
  const plan = await (await fetch(api('/work'))).json(), task = plan.tasks[0];
  assert.equal(plan.session.context, 'Single objective'); assert.equal(plan.tasks.length, 1); assert.equal(plan.session.decisions.length, 1);
  const configured = await post(api('/work/tasks/' + task.id + '/configure'), { expectedRevision: 1, purpose: 'execute', management: 'managed', acceptance: ['Correct output'], writePaths: ['sum.js'], testFiles: ['test/sum.test.js'] });
  assert.equal(configured.status, 200); assert.equal((await configured.json()).id, task.id);
  assert.equal((await post(api('/work/tasks/' + task.id + '/configure'), { expectedRevision: 1, acceptance: ['stale'] })).status, 409);
  const legacy = await fetch(base + '/m/' + room.hostKey + '/workspace?lang=en', { redirect: 'manual' });
  assert.equal(legacy.status, 302); assert.equal(legacy.headers.get('location'), '/m/' + room.hostKey + '?lang=en#plan');
  const denied = await fetch(api('/work'), { headers: { 'x-forwarded-for': '203.0.113.1' } }); assert.equal(denied.status, 403);
  app.flush(); app.close(); app = createApp(cfg); assert.ok(app.restore(room.hostKey));
  await new Promise(r => app.server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + app.server.address().port;
  const restored = await (await fetch(api('/work'))).json();
  assert.equal(restored.tasks.length, 1); assert.equal(restored.tasks[0].id, task.id); assert.equal(restored.tasks[0].requirementRevision, 2);
  assert.equal(restored.tasks[0].sourceCurrent, true); assert.equal(restored.session.context, plan.session.context);
});
test('real Node subprocess fixture follows linked task through report, verification and integration', async t => {
  const { dir, work, room, store } = setup(t), source = path.join(dir, 'source'); fs.mkdirSync(path.join(source, 'test'), { recursive: true });
  fs.writeFileSync(path.join(source, 'sum.js'), 'module.exports = (a,b) => a-b;\n');
  fs.writeFileSync(path.join(source, 'test/sum.test.js'), "require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
  execFileSync('git', ['init', '-q', source]); execFileSync('git', ['-C', source, 'add', '.']);
  execFileSync('git', ['-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);
  const cfg = store.read(), model = cfg.models.find(m => m.id === 'opus');
  Object.assign(model, { providerModelId: 'fixture-model', enabled: true, verification: 'verified', source: { ...model.source, confidence: 'user-configured', checkedAt: new Date().toISOString() } }); cfg.profiles.find(p => p.id === 'opus-claude').enabled = true; store.save(cfg, cfg.revision);
  // An explicit deterministic fixture, not a paid model or evidence of model quality.
  work.runner = async args => {
    if (!args.prompt.includes('READY')) {
      const { wrapExecution } = require('../src/execution-sandbox');
      const wrapped = wrapExecution(process.execPath, ['-e', "require('fs').writeFileSync('sum.js','module.exports = (a,b) => a+b;\\n')"], { workspace: args.workspace, write: true });
      execFileSync(wrapped.bin, wrapped.args, { cwd: args.workspace });
    }
    return { status: 'reported', reportedModel: 'fixture-model', text: 'Fixture subprocess completed', exitCode: 0 };
  };
  await work.probe('opus-claude');
  const original = work.read().tasks[0], task = work.configureTask(original.id, { expectedRevision: 1, purpose: 'execute', management: 'managed', acceptance: ['2+3=5'], workspace: source, writePaths: ['sum.js'], testFiles: ['test/sum.test.js'] });
  const run = work.start(task.id, 'opus-claude');
  while (work.active.size) await new Promise(r => setTimeout(r, 10));
  assert.equal(work.read().runs[0].status, 'reported'); assert.equal(run.requirementSnapshot.origin.context, room.context);
  assert.equal((await work.verify(run.id)).status, 'verified');
  assert.equal((await work.integrate(run.id)).status, 'integrated');
  assert.equal(work.read().tasks[0].status, 'done'); assert.equal(room.actions[0].status, 'todo');
  assert.equal(work.read().runs[0].integrationEvidence[0].exitCode, 0); assert.match(fs.readFileSync(path.join(source, 'sum.js'), 'utf8'), /a\+b/);
  room.actions[0].task = 'Changed after acceptance'; work.syncRoom(room);
  assert.equal(work.read().tasks[0].status, 'stale'); await assert.rejects(() => work.integrate(run.id), /verification|revision/);
});

test('non-fixed continuation shares the plan, rejects old-room writes and invalidates changed context', async t => {
  const root = tmp(t), app = createApp({ configDir: root + '/config', workDir: root + '/work' });
  t.after(() => app.close()); await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port, room = app.create();
  room.start('Original context', '', { agenda: [] }); room.hostSay('VIỆC: Dev | Correct sum | today');
  const url = (key, suffix) => base + '/api/host/' + key + suffix;
  const first = await (await fetch(url(room.hostKey, '/work'))).json();
  room.stop('test', true); const next = app.renew(room, true);
  const carried = await (await fetch(url(next.hostKey, '/work'))).json();
  assert.notEqual(next.hostKey, room.hostKey); assert.equal(carried.tasks.length, 1); assert.equal(carried.tasks[0].id, first.tasks[0].id);
  assert.equal((await post(url(room.hostKey, '/work/tasks/' + first.tasks[0].id + '/configure'), { expectedRevision: 1, acceptance: ['Old'] })).status, 409);
  next.start('Changed context', '', { agenda: [] });
  const updated = await (await fetch(url(next.hostKey, '/work'))).json();
  assert.equal(updated.tasks[0].id, first.tasks[0].id); assert.equal(updated.tasks[0].requirementRevision, 2);
  assert.equal(updated.tasks[0].context, 'Changed context'); assert.equal(updated.tasks[0].origin.context, 'Original context');
  assert.equal(next.toState().workKey, room.workKey || require('crypto').createHash('sha256').update(room.hostKey).digest('hex'));
});
