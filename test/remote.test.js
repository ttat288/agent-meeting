'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { RemoteCoordinator, LEASE_MS, MAX_ARTIFACT_BYTES } = require('../src/remote');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const meta = { workspaceId: 'workspace-one', baseRevision: 'base-revision-1', capabilities: ['review', 'node-test'] };
function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meeting-remote-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let clock = 1000000;
  const now = () => clock;
  const remote = new RemoteCoordinator({ dir, now });
  return { remote, dir, now, advance: value => { clock += value; } };
}
const enroll = remote => remote.enroll({ label: 'Worker one', ...meta });
const enqueue = (remote, hostId, extra = {}) => remote.enqueue({ taskId: 'task-one', runId: 'run-one', hostId, ...meta, requirementRevision: 1, prompt: 'Read README and report evidence.', modelId: 'explicit-provider-model', adapter: 'claude', writePaths: ['src/example.js'], ...extra });
const result = (lease, extra = {}) => ({ runId: lease.runId, leaseId: lease.leaseId, generation: lease.generation, baseRevision: lease.baseRevision, requirementRevision: lease.requirementRevision, status: 'reported', reportedModel: 'explicit-provider-model', report: 'Worker report, verification still required.', artifacts: [], ...extra });
const status = expected => error => error.status === expected;

test('enrollment persists only token hashes; summary and restart preserve host authentication', t => {
  const { remote, dir, now } = setup(t);
  const { host, token } = enroll(remote);
  assert.ok(token.length >= 40);
  assert.equal(host.workspaceId, meta.workspaceId);
  assert.equal(remote.auth(host.id, token).id, host.id);
  assert.throws(() => remote.auth(host.id, 'wrong-token'), status(401));
  assert.throws(() => remote.auth('unknown-host', token), status(401));
  assert.throws(() => remote.auth(host.id, undefined), status(401));
  const summary = JSON.stringify(remote.read());
  assert.ok(!summary.includes(token));
  assert.ok(!summary.includes('tokenHash'));
  const saved = fs.readFileSync(path.join(dir, 'config.json'), 'utf8');
  assert.ok(!saved.includes(token));
  assert.ok(saved.includes(hash(token)));
  assert.equal(fs.statSync(path.join(dir, 'config.json')).mode & 0o777, 0o600);
  const restored = new RemoteCoordinator({ dir, now });
  assert.equal(restored.auth(host.id, token).id, host.id);
  const updated = restored.register(host.id, token, { ...meta, capabilities: ['node-test'] });
  assert.deepEqual(updated.capabilities, ['node-test']);
  assert.ok(!JSON.stringify(updated).includes('tokenHash'));
  assert.ok(!fs.readFileSync(path.join(dir, 'config.json.bak'), 'utf8').includes(token));
});

test('claim is at most once per active lease, bound to authenticated host and advertised workspace/base', t => {
  const { remote } = setup(t);
  const first = enroll(remote), other = remote.enroll({ label: 'Other worker', ...meta });
  enqueue(remote, first.host.id);
  assert.throws(() => remote.claim(first.host.id, other.token), status(401));
  assert.equal(remote.claim(other.host.id, other.token), null);
  const lease = remote.claim(first.host.id, first.token);
  assert.equal(lease.status, 'leased');
  assert.equal(lease.generation, 1);
  assert.ok(lease.leaseUntil - lease.claimedAt <= LEASE_MS);
  assert.match(lease.prompt, /README/);
  assert.equal(remote.claim(first.host.id, first.token), null);
  assert.throws(() => remote.register(first.host.id, first.token, { ...meta, baseRevision: 'different-base' }), status(409));
  assert.throws(() => remote.heartbeat(other.host.id, other.token, lease), status(404));
  assert.throws(() => remote.complete(other.host.id, other.token, result(lease)), status(404));
  assert.throws(() => enqueue(remote, first.host.id), status(409));
  assert.throws(() => enqueue(remote, first.host.id, { runId: 'run-two' }), status(409));
});

test('heartbeat renews current lease; wrong generation, lease ID, base and requirements are rejected', t => {
  const { remote, advance } = setup(t);
  const { host, token } = enroll(remote); enqueue(remote, host.id);
  const lease = remote.claim(host.id, token);
  advance(LEASE_MS - 1);
  assert.throws(() => remote.heartbeat(host.id, token, { ...lease, generation: 2 }), status(409));
  assert.throws(() => remote.heartbeat(host.id, token, { ...lease, leaseId: 'fake-lease' }), status(409));
  const renewed = remote.heartbeat(host.id, token, lease);
  assert.ok(renewed.leaseUntil > lease.leaseUntil);
  advance(2);
  assert.throws(() => remote.complete(host.id, token, result(lease, { baseRevision: 'stale-base' })), status(409));
  assert.throws(() => remote.complete(host.id, token, result(lease, { requirementRevision: 2 })), status(409));
  const done = remote.complete(host.id, token, result(lease));
  assert.equal(done.status, 'reported');
  assert.equal(done.result.verified, false);
  assert.throws(() => remote.complete(host.id, token, result(lease)), status(409));
  assert.throws(() => remote.heartbeat(host.id, token, lease), status(409));
  assert.throws(() => remote.reassign(lease.runId), status(409));
});

test('lost connection never redispatches; explicit reassignment increments generation and rejects old results after restart', t => {
  const { remote, dir, now, advance } = setup(t);
  const first = enroll(remote), second = remote.enroll({ label: 'Replacement worker', ...meta });
  enqueue(remote, first.host.id);
  const original = remote.claim(first.host.id, first.token);
  advance(LEASE_MS);
  const restarted = new RemoteCoordinator({ dir, now });
  assert.equal(restarted.read().runs[0].status, 'lost');
  assert.equal(restarted.claim(first.host.id, first.token), null);
  assert.equal(restarted.claim(second.host.id, second.token), null);
  assert.throws(() => restarted.complete(first.host.id, first.token, result(original)), status(409));
  enqueue(restarted, first.host.id, { taskId: 'unrelated-task', runId: 'unrelated-run' });
  assert.equal(restarted.claim(first.host.id, first.token), null, 'lost process blocks additional dispatch on its host');
  const reassigned = restarted.reassign(original.runId, { hostId: second.host.id });
  assert.equal(reassigned.generation, 2);
  assert.equal(reassigned.status, 'queued');
  assert.throws(() => restarted.complete(first.host.id, first.token, result(original)), status(404));
  const nextLease = restarted.claim(second.host.id, second.token);
  assert.equal(nextLease.runId, original.runId);
  assert.equal(nextLease.generation, 2);
  assert.notEqual(nextLease.leaseId, original.leaseId);
  assert.throws(() => restarted.complete(second.host.id, second.token, result(original)), status(409));
  const completed = restarted.complete(second.host.id, second.token, result(nextLease));
  assert.equal(completed.status, 'reported');
  const final = new RemoteCoordinator({ dir, now });
  assert.equal(final.read().runs[0].status, 'reported');
  assert.throws(() => final.complete(second.host.id, second.token, result(nextLease)), status(409));
});

test('artifacts require safe unique names and exact content hashes and remain attached to run/task/revisions', t => {
  const { remote } = setup(t);
  const { host, token } = enroll(remote); enqueue(remote, host.id);
  const lease = remote.claim(host.id, token);
  const bytes = Buffer.from('Original source evidence');
  const artifact = { name: 'evidence.txt', sha256: hash(bytes), content: bytes.toString('base64') };
  for (const bad of [
    { ...artifact, name: '../outside.txt' },
    { ...artifact, name: '.env' },
    { ...artifact, sha256: '0'.repeat(64) },
    { ...artifact, content: '%%%not-base64%%%' },
    { ...artifact, sha256: undefined }
  ]) assert.throws(() => remote.complete(host.id, token, result(lease, { artifacts: [bad] })), status(400));
  assert.throws(() => remote.complete(host.id, token, result(lease, { artifacts: [artifact, artifact] })), status(400));
  assert.throws(() => remote.complete(host.id, token, result(lease, { status: 'verified' })), status(400));
  const done = remote.complete(host.id, token, result(lease, { artifacts: [artifact, { name: 'external-evidence.json', sha256: hash('external bytes') }] }));
  const evidence = done.result.artifacts[0];
  assert.equal(evidence.taskId, lease.taskId);
  assert.equal(evidence.runId, lease.runId);
  assert.equal(evidence.baseRevision, lease.baseRevision);
  assert.equal(evidence.requirementRevision, lease.requirementRevision);
  assert.equal(evidence.generation, lease.generation);
  assert.equal(evidence.size, bytes.length);
  assert.equal(evidence.content, undefined, 'summaries exclude artifact bytes');
  assert.equal(remote.getResult(lease.runId).artifacts[0].content, artifact.content);
  assert.equal(remote.read().runs[0].result.artifacts[0].content, undefined);
});

test('aggregate artifact payload is capped at 1 MiB and malformed assignment scopes cannot queue', t => {
  const { remote } = setup(t);
  const { host, token } = enroll(remote);
  for (const writePaths of [['../escape'], ['/absolute'], ['src/../../escape'], ['.env.local'], ['src\\file'], ['C:/file']]) assert.throws(() => enqueue(remote, host.id, { writePaths }), status(400));
  assert.throws(() => enqueue(remote, host.id, { baseRevision: 'wrong-base' }), status(409));
  assert.throws(() => enqueue(remote, host.id, { requirementRevision: 0 }), status(400));
  enqueue(remote, host.id);
  const lease = remote.claim(host.id, token);
  const bytes = Buffer.alloc(MAX_ARTIFACT_BYTES, 65);
  const content = bytes.toString('base64');
  assert.throws(() => remote.complete(host.id, token, result(lease, { artifacts: [{ name: 'max.bin', sha256: hash(bytes), content }, { name: 'extra.bin', sha256: hash('a'), content: Buffer.from('a').toString('base64') }] })), status(400));
  assert.equal(remote.read().runs[0].status, 'leased');
  assert.equal(remote.complete(host.id, token, result(lease, { artifacts: [{ name: 'max.bin', sha256: hash(bytes), content }] })).status, 'reported');
});

test('queued assignment refuses stale registration and active leases survive restart without duplicate claims', t => {
  const { remote, dir, now } = setup(t);
  const { host, token } = enroll(remote); enqueue(remote, host.id);
  remote.register(host.id, token, { ...meta, workspaceId: 'other-workspace' });
  assert.throws(() => remote.claim(host.id, token), status(409));
  remote.register(host.id, token, meta);
  const lease = remote.claim(host.id, token);
  const restarted = new RemoteCoordinator({ dir, now });
  assert.equal(restarted.claim(host.id, token), null);
  assert.equal(restarted.complete(host.id, token, result(lease, { status: 'failed' })).status, 'failed');
  const retry = restarted.reassign(lease.runId);
  assert.equal(retry.generation, 2);
  assert.equal(restarted.getResult(lease.runId), null);
  assert.equal(restarted.getResult(lease.runId, 1).status, 'failed', 'previous failed report remains evidence after retry');
  assert.equal(restarted.read().runs[0].history[0].result.verified, false);
  assert.equal(restarted.claim(host.id, token).generation, 2);
});

test('source snapshot identity binds registration, lease, result and artifact even with unchanged Git HEAD', t => {
  const { remote } = setup(t), firstHash = hash('snapshot-one'), secondHash = hash('snapshot-two');
  const {host,token} = remote.enroll({label:'Snapshot worker',...meta,snapshotHash:firstHash});
  const queued = enqueue(remote,host.id); assert.equal(queued.snapshotHash,firstHash);assert.equal(queued.snapshotStatus,'declared');
  remote.register(host.id,token,{...meta,snapshotHash:secondHash});
  assert.throws(()=>remote.claim(host.id,token),status(409));
  remote.register(host.id,token,{...meta,snapshotHash:firstHash});const lease=remote.claim(host.id,token);
  assert.throws(()=>remote.register(host.id,token,{...meta,snapshotHash:secondHash}),status(409));
  assert.throws(()=>remote.complete(host.id,token,result(lease)),status(409));
  assert.throws(()=>remote.complete(host.id,token,result(lease,{snapshotHash:secondHash})),status(409));
  const bytes=Buffer.from('source evidence');const done=remote.complete(host.id,token,result(lease,{snapshotHash:firstHash,artifacts:[{name:'evidence.txt',sha256:hash(bytes),content:bytes.toString('base64')}]}));
  assert.equal(done.result.snapshotHash,firstHash);assert.equal(done.result.reportedSnapshotHash,firstHash);assert.equal(done.result.artifacts[0].snapshotHash,firstHash);assert.equal(done.result.verified,false);
});
test('legacy absent source snapshots remain unknown; reassignment requires exact known snapshot',t=>{
  const {remote,advance}=setup(t);const first=enroll(remote);enqueue(remote,first.host.id);const lease=remote.claim(first.host.id,first.token);
  const done=remote.complete(first.host.id,first.token,result(lease,{snapshotHash:hash('worker-declared')}));assert.equal(done.result.snapshotHash,null);assert.equal(done.result.snapshotStatus,'unknown');assert.equal(done.result.reportedSnapshotHash,hash('worker-declared'));
  const a=remote.enroll({label:'A',...meta,snapshotHash:hash('A')}),b=remote.enroll({label:'B',...meta,snapshotHash:hash('B')});
  enqueue(remote,a.host.id,{taskId:'task-snapshot',runId:'run-snapshot'});remote.claim(a.host.id,a.token);advance(LEASE_MS);remote.read();assert.throws(()=>remote.reassign('run-snapshot',{hostId:b.host.id}),status(409));
});
test('legacy queued unknown snapshot can be claimed after a modern worker registers without inventing an expected source',t=>{
 const {remote}=setup(t),{host,token}=enroll(remote);enqueue(remote,host.id);remote.register(host.id,token,{...meta,snapshotHash:hash('now-known')});const lease=remote.claim(host.id,token);assert.equal(lease.snapshotHash,null);assert.equal(lease.snapshotStatus,'unknown');const done=remote.complete(host.id,token,result(lease,{snapshotHash:hash('now-known')}));assert.equal(done.result.snapshotStatus,'unknown');assert.equal(done.result.reportedSnapshotHash,hash('now-known'));
});
test('claim limits worker context and heartbeat cannot extend the hard deadline indefinitely', t=>{
 const {remote,advance}=setup(t),{host,token}=enroll(remote),config=require('../src/routing').defaults();config.models[0].label='Private catalog detail';enqueue(remote,host.id,{configSnapshot:config,routingDecision:{selection:'operator-explicit'}});const lease=remote.claim(host.id,token);
 assert.equal(lease.configSnapshot,undefined);assert.equal(lease.routingDecision,undefined);assert.equal(JSON.stringify(lease).includes('Private catalog detail'),false);
 for(let i=0;i<3;i++){advance(50000);remote.heartbeat(host.id,token,lease);}advance(40000);assert.throws(()=>remote.heartbeat(host.id,token,lease),status(409));assert.equal(remote.read().runs[0].status,'lost');
});
