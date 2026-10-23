'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { setup } = require('./helpers/pm-fixture');
const { ConfigStore } = require('../src/config-store');
const { assemble, retrieve, checkpointHash, bytes } = require('../tools/carry-canonical');
const clone = v => JSON.parse(JSON.stringify(v));
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');

test('canonical carry on a test-owned store: delta, references, guards, same-writer swap and completion', async t => {
  const started = performance.now(), checks = [], measurements = [];
  const f = await setup(t, 'fix', { sessionOptions: { childPath: path.join(__dirname, 'fixtures/carry-session.js') } });
  await f.ready({ expiresAt: Date.now() + 10 * 60000, team: { durationMinutes: null, maxSwaps: 1, maxInvocations: 3, maxWakes: 4, profiles: ['opus-claude'], chair: true } });
  const invitation = await f.pm('team-invite', { goalRevision: 1 }); assert.equal(invitation.status, 200);
  let token = invitation.data.token, generation = 1;
  const call = (op, input = {}) => f.request('/api/team/' + f.room.id + '/' + op, { generation, ...input }, token);
  assert.equal((await call('join', { name: 'Lead A', model: 'fixture-model' })).status, 200);
  assert.equal((await call('propose', { summary: 'Correct sum in the canonical task; preserve WIP and verify before integration' })).status, 200);
  const grant = (await f.pm('state')).data.grant;
  assert.equal((await f.pm('approve-plan', { goalRevision: 1, planRevision: 1, grantId: grant.id })).status, 200);
  const startedRun = await call('run'); assert.equal(startedRun.status, 200);
  // Read the exact canonical store, without constructing a second WorkManager
  // (which intentionally reconciles/revokes running writers on restart).
  const store = new ConfigStore({ dir: path.join(f.cfg.workDir, fs.readdirSync(f.cfg.workDir)[0]), defaults: () => ({ revision: 1 }), validate: () => {} });
  const work = { read: () => store.read(), configStore: f.app.configStore };
  let run;
  for (let i = 0; i < 200; i++) {
    run = work.read().runs[0];
    if (fs.readFileSync(path.join(run.workspace, 'sum.js'), 'utf8').includes('WIP')) break;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.match(fs.readFileSync(path.join(run.workspace, 'sum.js'), 'utf8'), /WIP/);
  const expected = { taskId: run.taskId, runId: run.id, goalRevision: 1, planRevision: 1, requirementRevision: run.requirementRevision, baseRevision: run.baseRevision, slot: 'A', generation };
  const input = { taskId: run.taskId, requirementRevision: run.requirementRevision, planRevision: 1, baseRevision: run.baseRevision,
    decisions: 'Keep existing sum API because the independent acceptance test imports it.', unknowns: 'Actual model cost is unknown.',
    next: 'Continue the WIP in slot A, then report for independent verification.' };
  const continuation = { failedAttempts: [{ attempt: 'Original subtraction implementation', outcome: 'Independent readiness test failed sum(2,3)=5', avoid: 'Do not restore subtraction' }], blockers: [] };
  async function check(name, fn) { await t.test(name, async () => { await fn(); checks.push(name); }); }
  function measure(label, c, deltaBytes) {
    const readback = retrieve(work, c.binding, c.refs);
    // Both arms receive the same facts AND binding/next/missing/evidence, not a
    // weakened direct baseline that omits critical provenance or caller delta.
    const direct = { binding: c.binding, facts: c.facts, missing: c.missing, nextAction: c.nextAction };
    measurements.push({ label, directFactsAndBindingBytes: bytes(direct), capsuleBytes: bytes(c),
      sameEvidenceReadbackBytes: bytes(readback), callerDeltaWriteBytesBothArms: deltaBytes,
      directPlusEvidenceAndDeltaBytes: bytes(direct) + bytes(readback) + deltaBytes,
      capsulePlusEvidenceAndDeltaBytes: bytes(c) + bytes(readback) + deltaBytes,
      capsuleOverheadBytes: bytes(c) - bytes(direct), dedicatedSummaryInvocations: 0 });
    assert.deepEqual(readback.map(r => r.kind), ['evidence', 'integrationEvidence', 'changes']);
  }
  await check('Missing continuation stays unknown; legacy checkpoint API remains compatible', async () => {
    assert.equal((await call('checkpoint', input)).status, 200);
    const c = assemble(work, expected); assert.deepEqual(c.missing, ['missing-continuation']); assert.equal(c.localStateConsistent, false);
  });
  await check('Delta is validated, secret-scanned and stored atomically without summary model', async () => {
    const before = store.read();
    for (const bad of [null, {}, { failedAttempts: [], blockers: null }, { failedAttempts: [{ attempt: 'short' }], blockers: [] },
      { failedAttempts: [], blockers: [{ issue: 'ghp_' + 'A'.repeat(36), resolution: 'remove credential' }] }]) {
      assert.notEqual((await call('checkpoint', { ...input, continuation: bad })).status, 200);
      assert.equal(store.read().pm.team.checkpoint.hash, before.pm.team.checkpoint.hash);
    }
    assert.equal((await call('checkpoint', { ...input, continuation })).status, 200);
    assert.deepEqual(store.read().pm.team.checkpoint.continuation, continuation);
  });
  let wipCapsule;
  await check('Canonical WIP binds identity, source, revisions, caller delta and retrievable evidence', () => {
    wipCapsule = assemble(work, expected); assert.equal(wipCapsule.localStateConsistent, true, JSON.stringify(wipCapsule.missing));
    assert.equal(wipCapsule.facts.status, 'running'); assert.equal(wipCapsule.facts.checkpoint.wip.length, 1);
    assert.deepEqual(wipCapsule.facts.continuation.failedAttempts, continuation.failedAttempts);
    assert.equal(wipCapsule.writerPromotionAuthorized, false); assert.equal(wipCapsule.semanticRetentionVerified, false);
    measure('running-with-delta', wipCapsule, bytes({ ...input, continuation }));
  });
  // Synthetic corruption tests use only this test-created store, restore it after
  // each check, and never dispatch a run from the corrupted state.
  function mutate(fn, expectedCode) {
    const saved = store.read(), bad = clone(saved); fn(bad); store.save(bad, saved.revision);
    try { const c = assemble(work, expected); assert.equal(c.localStateConsistent, false); assert(c.missing.includes(expectedCode), JSON.stringify(c.missing)); }
    finally { const revision = store.read().revision; store.save(saved, revision); }
  }
  for (const [label, fn, code] of [
    ['goal revision', d => d.pm.goalRevision++, 'stale-goalRevision'],
    ['plan revision', d => d.pm.team.planRevision++, 'stale-planRevision'],
    ['requirement revision', d => d.tasks[0].requirementRevision++, 'stale-requirementRevision'],
    ['run generation', d => d.runs[0].runtimeGeneration++, 'stale-generation'],
    ['checkpoint generation', d => { d.pm.team.checkpoint.generation += 2; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'stale-checkpoint-generation'],
    ['base revision', d => d.tasks[0].baseRevision = 'different', 'stale-baseRevision'],
    ['slot', d => d.pm.team.slot = 'B', 'stale-slot'],
    ['task/run binding', d => d.runs[0].taskId = 'other', 'task-run-mismatch'],
    ['goal text conflict', d => d.tasks[0].goal = 'different', 'goal-conflict'],
    ['acceptance conflict', d => d.tasks[0].acceptance = ['different'], 'scope-conflict-acceptance'],
    ['source no longer current', d => d.tasks[0].sourceCurrent = false, 'stale-task-source'],
    ['grant expired', d => d.pm.grant.expiresAt = 1, 'stale-grant'],
    ['grant replaced', d => d.pm.grant.id = 'other', 'stale-grant-binding'],
    ['missing run', d => d.runs = [], 'missing-canonical-record'],
    ['missing base snapshot', d => delete d.runs[0].before, 'missing-source-snapshot'],
    ['checkpoint changed without hash', d => d.pm.team.checkpoint.next = 'tampered', 'checkpoint-hash'],
    ['WIP metadata inconsistent', d => { d.pm.team.checkpoint.wip = []; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'checkpoint-wip-mismatch'],
    ['credential in selected text', d => { d.tasks[0].goal = d.pm.goal = d.runs[0].requirementSnapshot.goal = 'ghp_' + 'A'.repeat(36); }, 'private-text'],
    ['missing next', d => { delete d.pm.team.checkpoint.next; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'missing-next'],
    ['missing decisions', d => { delete d.pm.team.checkpoint.decisions; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'missing-decisions'],
    ['missing unknowns', d => { delete d.pm.team.checkpoint.unknowns; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'missing-unknowns'],
    ['missing blocker record', d => { delete d.pm.team.checkpoint.continuation.blockers; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'missing-blockers'],
    ['missing attempt record', d => { delete d.pm.team.checkpoint.continuation.failedAttempts; d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); }, 'missing-failedAttempts'],
    ['missing grant limits', d => delete d.pm.grant.team.maxInvocations, 'missing-grant-constraints'],
    ['stale routing revision', d => d.runs[0].configRevision++, 'stale-configRevision'],
  ]) await check('Reject ' + label, () => mutate(fn, code));
  await check('Explicit unresolved blocker selects resolution instead of silently continuing', () => {
    const saved = store.read(), d = clone(saved);
    d.pm.team.checkpoint.continuation.blockers = [{ issue: 'Acceptance needs a decision', resolution: 'Director chooses expected behavior' }];
    d.pm.team.checkpoint.hash = checkpointHash(d.pm.team.checkpoint); store.save(d, saved.revision);
    try { const c = assemble(work, expected); assert.equal(c.localStateConsistent, true); assert.equal(c.nextAction, 'resolve-recorded-blockers'); }
    finally { store.save(saved, store.read().revision); }
  });
  await check('Unselected PM messages, capabilities, snapshots, reports and raw output stay private', () => {
    const saved = store.read(), d = clone(saved), marker = 'PRIVATE_SENTINEL';
    d.pm.messages.push({ text: marker }); d.pm.team.tokenHash = marker;
    d.runs[0].report = marker; d.runs[0].configSnapshot = { token: marker };
    d.runs[0].evidence = [{ command: ['node', '--test', 'test/sum.test.js'], exitCode: 1, timeout: false, cancelled: false, error: marker, checkedAt: new Date().toISOString(), output: marker }];
    store.save(d, saved.revision);
    try { const c = assemble(work, expected); assert.equal(c.localStateConsistent, true); assert.doesNotMatch(JSON.stringify([c, retrieve(work, c.binding, c.refs)]), /PRIVATE_SENTINEL|tokenHash|configSnapshot|\/tmp\//); }
    finally { store.save(saved, store.read().revision); }
  });
  await check('Reference privacy, tamper, byte/count limits and current revision are enforced', () => {
    const c = assemble(work, expected);
    for (const patch of [{ kind: '__proto__' }, { kind: '../private' }, { kind: 'messages' }, { projectionHash: 'tampered' }, { bindingHash: 'tampered' }])
      assert.throws(() => retrieve(work, c.binding, [{ ...c.refs[0], ...patch }]));
    assert.throws(() => retrieve(work, c.binding, c.refs, 1), /budget/);
    assert.throws(() => retrieve(work, c.binding, [c.refs[0], c.refs[0]]), /count/);
    const d = store.read(); store.save(d, d.revision);
    assert.throws(() => retrieve(work, c.binding, c.refs), /stale-reference/);
  });
  await check('Source dirty change and WIP change invalidate capsule/reference and existing swap fence', async () => {
    const checkpoint = store.read().pm.team.checkpoint, file = path.join(run.workspace, 'sum.js'), original = fs.readFileSync(file);
    fs.appendFileSync(file, '// post checkpoint\n');
    try {
      assert(assemble(work, expected).missing.includes('stale-wip'));
      assert.equal((await call('swap', { checkpointHash: checkpoint.hash, profileId: 'opus-claude' })).status, 409);
    } finally { fs.writeFileSync(file, original); }
    const sourceFile = path.join(f.source, 'sum.js'), sourceOriginal = fs.readFileSync(sourceFile);
    fs.appendFileSync(sourceFile, '// concurrent source edit\n');
    try {
      assert(assemble(work, expected).missing.includes('stale-source-snapshot'));
      assert.equal((await call('swap', { checkpointHash: checkpoint.hash, profileId: 'opus-claude' })).status, 409);
    } finally { fs.writeFileSync(sourceFile, sourceOriginal); }
  });
  await check('Actual Git HEAD change fails even when source bytes are identical', () => {
    const original = execFileSync('git', ['-C', f.source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    execFileSync('git', ['-C', f.source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'temporary revision']);
    try { assert(assemble(work, expected).missing.includes('stale-base-head')); }
    finally { execFileSync('git', ['-C', f.source, 'reset', '--soft', original]); } // test-owned repo only
  });
  let swapped;
  await check('Existing ACK/quiesce fence preserves same task/run/WIP and rejects old capability', async () => {
    const c = store.read().pm.team.checkpoint;
    swapped = await call('swap', { checkpointHash: c.hash, profileId: 'opus-claude' });
    assert.equal(swapped.status, 200, JSON.stringify(swapped.data)); assert.equal(swapped.data.stopped.liveWriters, 0);
    assert.equal((await call('state')).status, 401);
    token = swapped.data.token; generation = swapped.data.generation; expected.generation = generation;
    assert.equal((await f.settled(run.id)).status, 'reported');
    assert.match(fs.readFileSync(path.join(run.workspace, 'sum.js'), 'utf8'), /preserved WIP/);
  });
  await check('Reported does not imply verified/integrated; historical next is not replayed', () => {
    const c = assemble(work, expected); assert.equal(c.localStateConsistent, true, JSON.stringify(c.missing));
    assert.equal(c.facts.status, 'reported'); assert.equal(c.facts.sourcePassed, false); assert.equal(c.nextAction, 'verify-reported-result');
    assert.equal(c.facts.continuation, null); assert(!JSON.stringify(c).includes(input.next));
    assert.throws(() => retrieve(work, wipCapsule.binding, wipCapsule.refs));
  });
  await check('Independent verification and integrated source tests produce distinct canonical evidence', async () => {
    assert.equal((await call('verify', { runId: run.id })).data.run.status, 'verified');
    const verified = assemble(work, expected); assert.equal(verified.localStateConsistent, true, JSON.stringify(verified.missing));
    assert.equal(verified.nextAction, 'integrate-verified-result'); assert.equal(verified.facts.workspacePassed, true); assert.equal(verified.facts.sourcePassed, false);
    assert.equal((await call('integrate', { runId: run.id })).data.run.status, 'integrated');
    const integrated = assemble(work, expected); assert.equal(integrated.localStateConsistent, true, JSON.stringify(integrated.missing));
    assert.equal(integrated.nextAction, 'stop-integrated-task'); assert.equal(integrated.facts.taskStatus, 'done');
    assert.equal(integrated.facts.sourcePassed, true); assert.equal(integrated.facts.continuation, null);
    assert(!JSON.stringify(integrated).includes(input.next)); measure('integrated-stop', integrated, 0);
  });
  for (const [label, fn, code] of [
    ['missing integrated tests', d => delete d.runs[0].integrationEvidence, 'missing-passing-source-tests'],
    ['cancelled tests', d => d.runs[0].integrationEvidence[0].cancelled = true, 'missing-passing-source-tests'],
    ['timeout tests', d => d.runs[0].evidence[0].timeout = true, 'missing-passing-workspace-tests'],
    ['failed tests', d => d.runs[0].integrationEvidence[0].exitCode = 1, 'missing-passing-source-tests'],
    ['duplicate evidence', d => d.runs[0].integrationEvidence.push(d.runs[0].integrationEvidence[0]), 'missing-passing-source-tests'],
  ]) await check('Reject ' + label, () => mutate(fn, code));
  const transport = fs.readFileSync(path.join(run.workspace, '..', 'carry-transport.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
  await check('Actual production bootstrap/activation transport is counted, including repeated checkpoint', () => {
    const inputs = transport.filter(r => r.event === 'input');
    assert.deepEqual(inputs.map(r => r.purpose), ['initial-execution', 'successor-readiness', 'continue-same-slot']);
    assert.equal(inputs[1].checkpointBytes, inputs[2].checkpointBytes); assert(inputs[1].checkpointBytes > 0);
    assert(transport.some(r => r.purpose === 'successor-readiness' && r.event === 'output' && r.status === 'reported'));
    assert(transport.some(r => r.purpose === 'continue-same-slot' && r.event === 'output' && r.status === 'reported'));
    measurements.push({ label: 'existing-swap-transport-fixture', bootstrapInputBytes: inputs[1].promptBytes,
      activationInputBytes: inputs[2].promptBytes, checkpointBytesEachInvocation: inputs[1].checkpointBytes,
      bootstrapAndActivationInputBytes: inputs[1].promptBytes + inputs[2].promptBytes,
      explicitAdapterArgsBytesBothInvocations: inputs[1].explicitAdapterArgsBytes + inputs[2].explicitAdapterArgsBytes,
      bootstrapOutputTextBytes: transport.find(r => r.purpose === 'successor-readiness' && r.event === 'output').resultTextBytes,
      activationOutputTextBytes: transport.find(r => r.purpose === 'continue-same-slot' && r.event === 'output').resultTextBytes,
      directNativeSwapOverheadBytes: null, comparison: 'Observed existing swap transport; assembler is not wired into runtime. Direct native recovery is unmeasured.' });
  });
  if (process.env.AM_CARRY_EVIDENCE_DIR) {
    assert.equal(checks.length, 42);
    const files = ['src/team.js', 'src/work.js', 'src/session-supervisor.js', 'src/session-child.js', 'src/runtime.js', 'tools/carry-canonical.js', 'test/carry-canonical.test.js', 'test/fixtures/carry-session.js', 'test/fixtures/carry-cli-fixture.js'];
    const report = { schema: 'agent-meeting/canonical-carry-benchmark@1', fixture: true, at: new Date().toISOString(),
      sourceHashes: files.map(file => ({ path: file, sha256: sha256(fs.readFileSync(path.join(__dirname, '..', file))) })),
      checks: { passed: checks.length, items: checks }, measurements,
      protocol: { singleWriterFence: 'verified by deterministic subprocess; old capability rejected, read-only bootstrap, process group drained',
        bootstrapInvocations: 1, activationInvocations: 1, actualModelCalls: 0, assemblerModelCalls: 0, deltaWrites: 1,
        ackAndActivationInputTokens: null, ackAndActivationOutputTokens: null, toolSchemaTokens: null, modelContextTokens: null,
        totalModelUsage: null, billedCostUsd: null, semanticRetention: null, context8hVerified: false, controllerEnabled: false },
      elapsedFixtureAndChecksMs: performance.now() - started,
      limits: ['Temporary canonical store created by production API with deterministic runtime fixture. No live-user store or provider calls.',
        'Matched direct arm includes identical binding, facts, caller delta and evidence readback. Bytes are transport overhead, not tokens or billing.',
        'Actual production ACK/activation prompts, repeated checkpoint and fixture responses are measured in bytes. Provider hidden prompts and direct-native recovery are unobserved; no total cost claim.',
        'Assembler is explicit and read-only; no runtime integration or controller. Hash/presence is not semantic acceptance or writer authority.',
        'Secrets matching existing patterns are rejected; arbitrary private prose cannot be recognized semantically. Raw output and PM channels are excluded.'] };
    fs.mkdirSync(process.env.AM_CARRY_EVIDENCE_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.AM_CARRY_EVIDENCE_DIR, 'canonical-benchmark.json'), JSON.stringify(report, null, 2) + '\n');
  }
});
