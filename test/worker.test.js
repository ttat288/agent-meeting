'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { runWorkerOnce } = require('../src/worker');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'meeting-worker-test-')), workspace = path.join(root, 'source');
  fs.mkdirSync(workspace);
  execFileSync('git', ['init', '-q', workspace]);
  fs.writeFileSync(path.join(workspace, 'README.md'), 'Original source\n');
  fs.writeFileSync(path.join(workspace, '.gitignore'), 'ignored-secret\n');
  execFileSync('git', ['-C', workspace, 'add', '.']);
  execFileSync('git', ['-C', workspace, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);
  const baseRevision = execFileSync('git', ['-C', workspace, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const config = { serverUrl: 'http://127.0.0.1:3100', hostId: 'worker-host', token: 'private-host-token', workspace, workspaceId: 'repo-one', workDir: path.join(root, 'worker-private'), allowedModels: ['explicit-model'], adapters: ['claude'] };
  const lease = { taskId: 'task-one', runId: 'run-one', hostId: config.hostId, workspaceId: config.workspaceId, baseRevision, requirementRevision: 1, generation: 1, leaseId: 'random-lease-id', leaseUntil: Date.now() + 60000, prompt: 'Perform bounded task', modelId: 'explicit-model', adapter: 'claude', writePaths: ['README.md'] };
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, config, lease };
}
function coordinator(config, lease, overrides = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    const action = url.split('/').pop(), body = JSON.parse(options.body);
    calls.push({ url, action, body, options });
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.authorization, 'Bearer ' + config.token);
    assert.equal(url, config.serverUrl + '/api/worker/' + config.hostId + '/' + action);
    if (overrides[action]) return overrides[action](body, options);
    return new Response(JSON.stringify(action === 'claim' ? lease : { ok: true }), { headers: { 'content-type': 'application/json' } });
  };
  return { calls, fetcher };
}
const reported = { status: 'reported', reportedModel: 'actual-machine-model', text: 'Changed file; needs verification.' };

test('worker preserves prototype-named source input and rejects prototype-named out-of-scope output', async t => {
  const { config, lease } = setup(t);
  fs.writeFileSync(path.join(config.workspace, '__proto__'), 'Original special source');
  const { calls, fetcher } = coordinator(config, lease);
  await assert.rejects(runWorkerOnce(config, { fetch: fetcher, runner: async ({ workspace }) => {
    assert.equal(fs.readFileSync(path.join(workspace, '__proto__'), 'utf8'), 'Original special source');
    fs.writeFileSync(path.join(workspace, '__proto__'), 'Unscoped change');
    return reported;
  } }), /outside.*scope/i);
  assert(!calls.some(c => c.action === 'complete'));
  assert.equal(fs.readFileSync(path.join(config.workspace, '__proto__'), 'utf8'), 'Original special source');
});

test('worker registers actual HEAD, executes only in a separate copy, preserves source and submits hashed provenance', async t => {
  const { config, lease } = setup(t);
  fs.writeFileSync(path.join(config.workspace, 'ignored-secret'), 'DO NOT COPY');
  fs.writeFileSync(path.join(config.workspace, '.env'), 'PRIVATE=secret');
  const { calls, fetcher } = coordinator(config, lease);
  let runnerCalls = 0;
  const result = await runWorkerOnce(config, { fetch: fetcher, runner: async options => {
    runnerCalls++;
    assert.notEqual(options.workspace, config.workspace);
    assert.ok(options.workspace.startsWith(config.workDir));
    assert.equal(options.modelId, lease.modelId);
    assert.equal(options.adapter, lease.adapter);
    assert.equal(options.write, true);
    assert.equal(fs.readFileSync(path.join(options.workspace, 'README.md'), 'utf8'), 'Original source\n');
    assert.ok(!fs.existsSync(path.join(options.workspace, '.git')));
    assert.ok(!fs.existsSync(path.join(options.workspace, '.env')));
    assert.ok(!fs.existsSync(path.join(options.workspace, 'ignored-secret')));
    fs.writeFileSync(path.join(options.workspace, 'README.md'), 'Updated in copy\n');
    return reported;
  } });
  assert.equal(runnerCalls, 1);
  assert.equal(fs.readFileSync(path.join(config.workspace, 'README.md'), 'utf8'), 'Original source\n');
  assert.equal(result.status, 'reported');
  assert.equal(calls[0].body.baseRevision, lease.baseRevision);
  const complete = calls.find(c => c.action === 'complete').body;
  assert.equal(complete.reportedModel, reported.reportedModel);
  assert.equal(complete.generation, 1);
  assert.equal(complete.requirementRevision, lease.requirementRevision);
  assert.equal(complete.baseRevision, lease.baseRevision);
  const bytes = Buffer.from(complete.artifacts[0].content, 'base64');
  assert.equal(hash(bytes), complete.artifacts[0].sha256);
  const manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.taskId, lease.taskId);
  assert.equal(manifest.runId, lease.runId);
  assert.equal(manifest.changes[0].path, 'README.md');
  assert.equal(Buffer.from(manifest.changes[0].content, 'base64').toString(), 'Updated in copy\n');
  assert.equal(fs.statSync(result.receiptFile).mode & 0o777, 0o600);
  assert.ok(!fs.readFileSync(result.receiptFile, 'utf8').includes(config.token));
});

test('duplicate generation receipt prevents automatic reexecution after worker restart', async t => {
  const { config, lease } = setup(t), { fetcher } = coordinator(config, lease);
  let count = 0;
  const deps = { fetch: fetcher, runner: async () => { count++; return reported; } };
  await runWorkerOnce(config, deps);
  await assert.rejects(runWorkerOnce(config, deps), /already has a receipt/);
  assert.equal(count, 1);
  const next = { ...lease, generation: 2, leaseId: 'replacement-lease' };
  await runWorkerOnce(config, { ...deps, fetch: coordinator(config, next).fetcher });
  assert.equal(count, 2);
});

test('model, adapter, host, workspace, base and protected scope mismatches never invoke a runner', async t => {
  const { config, lease } = setup(t);
  for (const patch of [{ modelId: 'unapproved-model' }, { adapter: 'agy' }, { hostId: 'other-host' }, { workspaceId: 'other-workspace' }, { baseRevision: 'stale' }, { writePaths: ['../escape'] }, { writePaths: ['.env'] }, { leaseUntil: Date.now() - 1 }]) {
    let calls = 0;
    const { fetcher } = coordinator(config, { ...lease, ...patch });
    await assert.rejects(runWorkerOnce(config, { fetch: fetcher, runner: async () => { calls++; return reported; } }));
    assert.equal(calls, 0);
  }
});

test('heartbeat failure aborts runtime and withholds completion without reclaiming', async t => {
  const { config, lease } = setup(t);
  let heartbeatCount = 0;
  const { calls, fetcher } = coordinator(config, lease, { heartbeat: () => { heartbeatCount++; return new Response(JSON.stringify({ error: 'lease lost' }), { status: heartbeatCount === 1 ? 200 : 409 }); } });
  let aborted = false;
  await assert.rejects(runWorkerOnce(config, { fetch: fetcher, heartbeatMs: 10, runner: async ({ signal }) => {
    await new Promise(resolve => { signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true }); });
    return { status: 'cancelled', text: 'Cancelled' };
  } }), /heartbeat failed/);
  assert.equal(aborted, true);
  assert.equal(calls.filter(c => c.action === 'claim').length, 1);
  assert.equal(calls.filter(c => c.action === 'complete').length, 0);
  const receiptName = fs.readdirSync(config.workDir).find(name => name.endsWith('.json'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(config.workDir, receiptName))).status, 'lost');
});

test('out-of-scope writes, output symlinks and oversized artifacts never submit completion', async t => {
  const { config, lease } = setup(t);
  for (const [index, mutate] of [
    workspace => fs.writeFileSync(path.join(workspace, 'unapproved.txt'), 'Unauthorized change'),
    workspace => fs.symlinkSync('/etc/passwd', path.join(workspace, 'README.md.copy')),
    workspace => fs.writeFileSync(path.join(workspace, 'README.md'), Buffer.alloc(1024 * 1024, 65))
  ].entries()) {
    const assignment = { ...lease, runId: 'run-' + index }, { calls, fetcher } = coordinator(config, assignment);
    await assert.rejects(runWorkerOnce(config, { fetch: fetcher, runner: async ({ workspace }) => { mutate(workspace); return reported; } }));
    assert.ok(!calls.some(c => c.action === 'complete'));
  }
  assert.equal(fs.readFileSync(path.join(config.workspace, 'README.md'), 'utf8'), 'Original source\n');
});

test('source symlinks are rejected before execution; protected and ignored source files are omitted', async t => {
  const { config, lease } = setup(t);
  fs.symlinkSync('/etc/passwd', path.join(config.workspace, 'linked.txt'));
  const { calls, fetcher } = coordinator(config, lease); let count = 0;
  await assert.rejects(runWorkerOnce(config, { fetch: fetcher, runner: async () => { count++; return reported; } }), /symlink/);
  assert.equal(count, 0);
  assert.ok(!calls.some(c => c.action === 'complete'));
});

test('explicit server policy blocks insecure remote URL, embedded credentials, unsupported adapters and in-source workDir', async t => {
  const { config } = setup(t);
  const link = path.join(path.dirname(config.workspace), 'linked-source'); fs.symlinkSync(config.workspace, link);
  for (const patch of [{ workDir: path.join(link, 'receipts') }, { serverUrl: 'http://remote.example' }, { serverUrl: 'https://user:password@example.com' }, { serverUrl: 'https://example.com/path' }, { adapters: ['shell'] }, { allowedModels: [] }, { workDir: path.join(config.workspace, 'receipts') }]) {
    let count = 0;
    await assert.rejects(runWorkerOnce({ ...config, ...patch }, { fetch: async () => { count++; throw new Error('Unexpected network'); } }));
    assert.equal(count, 0);
  }
});

test('empty queue is idle and oversized or invalid endpoint responses stop before execution', async t => {
  const { config, lease } = setup(t);
  const idle = await runWorkerOnce(config, { fetch: coordinator(config, null).fetcher, runner: async () => { throw new Error('No work expected'); } });
  assert.equal(idle.status, 'idle');
  for (const response of [new Response('x'.repeat(256 * 1024 + 1)), new Response('not-json'), new Response('{}', { status: 403 })]) {
    const { fetcher } = coordinator(config, lease, { register: () => response });
    await assert.rejects(runWorkerOnce(config, { fetch: fetcher, runner: async () => { throw new Error('No run expected'); } }));
  }
});

test('stale completion rejection leaves a receipt requiring reconciliation and cannot silently rerun', async t => {
  const { config, lease } = setup(t);
  const { calls, fetcher } = coordinator(config, lease, { complete: () => new Response('{}', { status: 409 }) });
  let count = 0; const deps = { fetch: fetcher, runner: async () => { count++; return reported; } };
  await assert.rejects(runWorkerOnce(config, deps), /rejected request/);
  await assert.rejects(runWorkerOnce(config, deps), /receipt/);
  assert.equal(count, 1);
  assert.equal(calls.filter(c => c.action === 'complete').length, 1);
});

test('CLI requires a private config file and never prints credential contents', t => {
  const { root, config } = setup(t), file = path.join(root, 'config.json');
  fs.writeFileSync(file, JSON.stringify(config), { mode: 0o644 });
  const result = spawnSync(process.execPath, [path.join(__dirname, '../bin/worker.js'), '--config', file, '--once'], { encoding: 'utf8', timeout: 3000 });
  assert.equal(result.status, 1);
  assert.ok(!result.stdout.includes(config.token) && !result.stderr.includes(config.token));
  assert.match(result.stderr, /reconcile/);
});

test('worker snapshot covers dirty/untracked source and is propagated to report manifest and receipt',async t=>{
 const {config,lease}=setup(t);fs.writeFileSync(path.join(config.workspace,'dirty-extra.txt'),'uncommitted');
 const {calls,fetcher}=coordinator(config,lease);const result=await runWorkerOnce(config,{fetch:fetcher,runner:async()=>reported});
 const registered=calls.find(c=>c.action==='register').body.snapshotHash;assert.match(registered,/^[a-f0-9]{64}$/);
 const complete=calls.find(c=>c.action==='complete').body;assert.equal(complete.snapshotHash,registered);assert.equal(JSON.parse(Buffer.from(complete.artifacts[0].content,'base64')).snapshotHash,registered);assert.equal(JSON.parse(fs.readFileSync(result.receiptFile)).snapshotHash,registered);
});
test('changed source snapshot with same HEAD or lease snapshot mismatch never starts runtime',async t=>{
 const {config,lease}=setup(t);let count=0;
 const mismatch=coordinator(config,{...lease,snapshotHash:'0'.repeat(64)});await assert.rejects(runWorkerOnce(config,{fetch:mismatch.fetcher,runner:async()=>{count++;return reported}}),/snapshot mismatch/);
 const changed=coordinator(config,{...lease,runId:'changed-source'},{claim:()=>{fs.appendFileSync(path.join(config.workspace,'README.md'),'dirty after registration');return new Response(JSON.stringify({...lease,runId:'changed-source'}));}});
 await assert.rejects(runWorkerOnce(config,{fetch:changed.fetcher,runner:async()=>{count++;return reported}}),/snapshot changed since registration/);assert.equal(count,0);assert(!changed.calls.some(c=>c.action==='complete'));
});
