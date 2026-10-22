'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const { WorkManager, inventory, changes, runTest } = require('../src/work');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn) { for (let i = 0; i < 300; i++) { if (fn()) return; await sleep(10); } throw new Error('Condition did not become ready'); }
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-cancel-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function setup(t, testSource, sumPath = 'sum.js') {
  const root = temp(t), source = path.join(root, 'source'), workspace = path.join(root, 'workspace');
  fs.mkdirSync(source); fs.mkdirSync(path.join(source, 'test'));
  fs.mkdirSync(path.dirname(path.join(source,sumPath)),{recursive:true});
  fs.writeFileSync(path.join(source, sumPath), 'module.exports=(a,b)=>a-b;\n');
  fs.writeFileSync(path.join(source, 'test/sum.test.js'), testSource || "require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
  execFileSync('git', ['init', '-q', source]); execFileSync('git', ['-C', source, 'add', '.']);
  execFileSync('git', ['-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);
  fs.cpSync(source, workspace, { recursive: true, filter: p => path.basename(p) !== '.git' });
  const before = inventory(workspace);
  fs.writeFileSync(path.join(workspace, sumPath), 'module.exports=(a,b)=>a+b;\n');
  const config = new ConfigStore({ dir: path.join(root, 'config'), defaults: routing.defaults, validate: routing.validate });
  const work = new WorkManager({ dir: path.join(root, 'work'), configStore: config });
  t.after(() => work.close());
  const run = { id: 'run', taskId: 'task', source, workspace, before, changes: changes(before, inventory(workspace)), status: 'reported',
    requestedModel: 'actual', reportedModel: 'actual', requirementRevision: 1, baseRevision: execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() };
  work.update(d => { d.tasks.push({ id: 'task', status: 'verifying', requirementRevision: 1, testFiles: ['test/sum.test.js'] }); d.runs.push(run); });
  return { root, source, workspace, work };
}

test('already cancelled verification subprocess never starts', async t => {
  const root = temp(t), controller = new AbortController(); controller.abort();
  const result = await runTest(root, 'missing.test.js', controller.signal);
  assert.equal(result.cancelled, true); assert.equal(result.exitCode, null); assert.equal(result.elapsedMs, 0);
});

test('long Unicode test evidence retains complete characters within its tail budget', async t => {
  const root = temp(t), name = 'Việt🧪'.repeat(5000);
  fs.writeFileSync(path.join(root,'unicode.test.js'), "require('node:test')(" + JSON.stringify(name) + ",()=>{});");
  const result = await runTest(root,'unicode.test.js');
  assert.equal(result.exitCode,0); assert(result.output.length <= 32768);
  assert(!/^[\uDC00-\uDFFF]/.test(result.output), 'Evidence must not start with half an emoji');
  assert(!result.output.includes('\ufffd'), 'Streaming must preserve valid UTF-8');
  assert.match(result.output,/# pass 1/);
});

test('aborting runTest stops the test and its process group', { skip: process.platform === 'win32' }, async t => {
  const root = temp(t), marker = path.join(root, 'heartbeat'), file = 'slow.test.js';
  const grandchild = `const fs=require('fs');process.on('SIGTERM',()=>{});setInterval(()=>fs.writeFileSync(${JSON.stringify(marker)},String(Date.now())),25);`;
  fs.writeFileSync(path.join(root, file), `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'inherit'});setInterval(()=>{},1000);`);
  const controller = new AbortController(), pending = runTest(root, file, controller.signal);
  await until(() => fs.existsSync(marker)); controller.abort();
  const result = await pending; assert.equal(result.cancelled, true); assert.equal(result.timeout, false);
  const heartbeat = fs.readFileSync(marker, 'utf8'); await sleep(250);
  assert.equal(fs.readFileSync(marker, 'utf8'), heartbeat);
});

test('verify owns a cancellable controller and cannot publish verified after cancel', async t => {
  const { work } = setup(t, "require('node:test')('slow',async()=>{await new Promise(r=>setTimeout(r,15000));});\n");
  const pending = work.verify('run'); assert.equal(work.active.has('run'), true);
  assert.equal(work.read().runs[0].status, 'verifying'); work.cancel('run');
  const result = await pending;
  assert.equal(result.status, 'cancelled'); assert.equal(work.read().tasks[0].status, 'cancelled');
  assert.equal(work.active.size, 0); assert.notEqual(result.status, 'verified');
});

test('closing manager aborts verification and exceptions leave terminal failed state', async t => {
  const { work } = setup(t, "require('node:test')('slow',async()=>{await new Promise(r=>setTimeout(r,15000));});\n");
  const pending = work.verify('run'); work.close();
  assert.equal((await pending).status, 'cancelled'); assert.equal(work.active.size, 0);
});

test('source integration reruns the same tests before marking task done', async t => {
  const { work, source } = setup(t); const checked = await work.verify('run'); assert.equal(checked.status, 'verified');
  const pending = work.integrate('run'); assert.equal(work.read().tasks[0].status, 'integrating'); assert(work.active.has('run'));
  const result = await pending;
  assert.equal(result.status, 'integrated'); assert.equal(work.read().tasks[0].status, 'done');
  assert.equal(result.integrationEvidence.length, 1); assert.equal(result.integrationEvidence[0].exitCode, 0);
  assert.match(fs.readFileSync(path.join(source, 'sum.js'), 'utf8'), /a\+b/); assert.equal(work.active.size, 0);
});

test('failing integrated-source tests restore original file and record failure evidence', async t => {
  const { work, source } = setup(t, "require('node:test')('context',()=>{require('node:assert/strict').equal(require('../sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')throw Error('integration-only failure');});\n");
  assert.equal((await work.verify('run')).status, 'verified');
  const result = await work.integrate('run');
  assert.equal(result.status, 'failed', JSON.stringify(result.integrationEvidence)); assert.equal(result.rollback, 'restored');
  assert.equal(work.read().tasks[0].status, 'failed'); assert.equal(result.integrationEvidence[0].exitCode, 1);
  assert.match(fs.readFileSync(path.join(source, 'sum.js'), 'utf8'), /a-b/); assert.equal(work.active.size, 0);
});

test('cancelling integration restores original source and does not publish done', async t => {
  const slow = "require('node:test')('sum',async()=>{require('node:assert/strict').equal(require('../sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')await new Promise(r=>setTimeout(r,15000));});\n";
  const { work, source } = setup(t, slow); await work.verify('run');
  const pending = work.integrate('run'); work.cancel('run');
  const result = await pending;
  assert.equal(result.status, 'cancelled'); assert.equal(result.rollback, 'restored');
  assert.match(fs.readFileSync(path.join(source, 'sum.js'), 'utf8'), /a-b/);
  assert.notEqual(work.read().tasks[0].status, 'done');
});

test('integration rollback preserves a concurrent source permission change for manual reconciliation', async t => {
  const slow = "require('node:test')('sum',async()=>{require('node:assert/strict').equal(require('../sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')await new Promise(r=>setTimeout(r,15000));});\n";
  const { work, source } = setup(t, slow), file = path.join(source, 'sum.js');
  fs.chmodSync(file, 0o640);
  await work.verify('run');
  const pending = work.integrate('run');
  assert.match(fs.readFileSync(file, 'utf8'), /a\+b/);
  // An external editor/operator changes permissions while source tests run.
  fs.chmodSync(file, 0o600);
  work.cancel('run');
  const result = await pending;
  assert.equal(fs.statSync(file).mode & 0o777, 0o600, 'Rollback must not undo the external permission edit');
  assert.equal(result.rollback, 'conflict');
  assert.equal(result.status, 'cancelled');
  assert.match(result.error, /manual rollback required/);
  assert.match(fs.readFileSync(file, 'utf8'), /a\+b/, 'Conflicting source requires explicit manual reconciliation');
  assert.notEqual(work.read().tasks[0].status, 'done');
});

test('integration rollback preserves a concurrently installed symlink even when its bytes match', async t => {
  const slow = "require('node:test')('sum',async()=>{require('node:assert/strict').equal(require('../sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')await new Promise(r=>setTimeout(r,15000));});\n";
  const { work, root, source } = setup(t, slow), file = path.join(source, 'sum.js'), external = path.join(root, 'external.js');
  await work.verify('run');
  const pending = work.integrate('run'), bytes = fs.readFileSync(file);
  fs.writeFileSync(external, bytes);
  fs.unlinkSync(file); fs.symlinkSync(external, file);
  work.cancel('run');
  const result = await pending;
  assert(fs.lstatSync(file).isSymbolicLink(), 'Rollback must preserve the external path replacement');
  assert.deepEqual(fs.readFileSync(external), bytes);
  assert.equal(result.rollback, 'conflict');
  assert.equal(result.status, 'cancelled');
  assert.match(result.error, /manual rollback required/);
});

test('rollback never follows a source-root symlink installed while verification runs', async t => {
  const slow = "require('node:test')('sum',async()=>{require('node:assert/strict').equal(require('../sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')await new Promise(r=>setTimeout(r,15000));});\n";
  const { work, root, source } = setup(t, slow), external = path.join(root,'external-source');
  await work.verify('run');
  const pending = work.integrate('run'), bytes = fs.readFileSync(path.join(source,'sum.js'));
  fs.cpSync(source, external, {recursive:true});
  fs.renameSync(source,source+'-moved'); fs.symlinkSync(external,source,'dir');
  work.cancel('run');
  const result = await pending;
  assert.deepEqual(fs.readFileSync(path.join(external,'sum.js')),bytes,'Rollback must not write through the replaced source root');
  assert(fs.lstatSync(source).isSymbolicLink());
  assert.equal(result.rollback,'conflict'); assert.equal(result.status,'cancelled');
  assert.match(result.error,/manual rollback required/);
});

test('integration rejects a source-root symlink replacement before any source write', async t => {
  const { work, root, source } = setup(t), external = path.join(root,'external-source');
  await work.verify('run');
  const bytes = fs.readFileSync(path.join(source,'sum.js'));
  fs.cpSync(source,external,{recursive:true});
  fs.renameSync(source,source+'-moved'); fs.symlinkSync(external,source,'dir');
  await assert.rejects(work.integrate('run'),/Source checkout path changed/);
  assert.deepEqual(fs.readFileSync(path.join(external,'sum.js')),bytes);
  assert.equal(work.read().runs[0].status,'verified');
  fs.unlinkSync(source);fs.renameSync(source+'-moved',source);
  assert.equal((await work.integrate('run')).status,'integrated','Restoring the canonical source path permits an explicit retry');
  assert.deepEqual(fs.readFileSync(path.join(external,'sum.js')),bytes,'Retry must still leave the external tree unchanged');
});

test('rollback rechecks parent directories before restoring a nested source file', async t => {
  const slow = "require('node:test')('sum',async()=>{require('node:assert/strict').equal(require('../lib/sum')(2,3),5);if(require('node:path').basename(process.cwd())==='source')await new Promise(r=>setTimeout(r,15000));});\n";
  const { work, root, source } = setup(t,slow,'lib/sum.js'), external=path.join(root,'outside-lib'), parent=path.join(source,'lib');
  await work.verify('run');
  const pending=work.integrate('run'),bytes=fs.readFileSync(path.join(parent,'sum.js'));
  fs.cpSync(parent,external,{recursive:true});
  fs.renameSync(parent,parent+'-moved');fs.symlinkSync(external,parent,'dir');
  work.cancel('run');const result=await pending;
  assert.deepEqual(fs.readFileSync(path.join(external,'sum.js')),bytes,'Rollback must not traverse the substituted parent');
  assert(fs.lstatSync(parent).isSymbolicLink());
  assert.equal(result.rollback,'conflict');assert.equal(result.status,'cancelled');
  assert.match(result.error,/manual rollback required/);
});


test('verification failure records real failing test execution and releases the controller', async t => {
  const { work } = setup(t, "require('node:test')('bad',()=>{throw Error('fixture test failed');});\n");
  const result = await work.verify('run');
  assert.equal(result.status, 'failed'); assert.equal(result.evidence[0].exitCode, 1);
  assert.match(result.evidence[0].output, /fixture test failed/);
  assert.equal(work.read().tasks[0].status, 'failed'); assert.equal(work.active.size, 0);
});

test('verification sandbox blocks test writes and cannot remain verifying', async t => {
  const { work } = setup(t, "require('node:test')('mutate',()=>require('node:fs').appendFileSync(require('node:path').join(__dirname,'../sum.js'),'// mutated'));\n");
  const result = await work.verify('run');
  assert.equal(result.status, 'failed'); assert.match(result.error, /Independent verification failed/); assert.match(result.evidence[0].output, /EROFS|read-only file system/);
  assert.equal(work.read().tasks[0].status, 'failed'); assert.equal(work.active.size, 0);
});
