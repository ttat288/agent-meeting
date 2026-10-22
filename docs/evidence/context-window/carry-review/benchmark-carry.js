'use strict';
// Offline evidence experiment only. No product imports, model, network, or live-store reads.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '../../../..');
const inputPath = 'docs/evidence/pm-team/journey.json';
const raw = fs.readFileSync(path.join(root, inputPath), 'utf8');
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const bytes = v => Buffer.byteLength(JSON.stringify(v));
const clone = v => JSON.parse(JSON.stringify(v));
const source = JSON.parse(raw);
const binding = {
  sha256: hash(raw), taskId: source.task.id, runId: source.run.id,
  slot: source.run.slot, generation: source.run.generation,
  goalRevision: source.report.goalRevision, planRevision: source.checkpoint.planRevision,
};
function load(text, expected) {
  if (Buffer.byteLength(text) > 64 * 1024) throw Error('Source size limit');
  if (hash(text) !== expected.sha256) throw Error('Source hash changed');
  const j = JSON.parse(text);
  if (j.schema !== 'agent-meeting/team-fixture-evidence@1' || j.fixture !== true || j.modelVerified !== false) throw Error('Fixture schema required');
  if (j.task.id !== expected.taskId || j.report.taskId !== expected.taskId || j.run.id !== expected.runId || j.report.runId !== expected.runId) throw Error('Task/run mismatch');
  if (j.run.slot !== expected.slot || j.checkpoint.slot !== expected.slot || j.run.generation !== expected.generation) throw Error('Slot/generation mismatch');
  if (j.report.goalRevision !== expected.goalRevision || j.checkpoint.goalRevision !== expected.goalRevision || j.checkpoint.planRevision !== expected.planRevision) throw Error('Revision mismatch');
  if (JSON.stringify(j.task.acceptance) !== JSON.stringify(j.report.acceptance)) throw Error('Acceptance mismatch');
  return j;
}
const passed = rows => Array.isArray(rows) && rows.length > 0 && rows.every(r => r.exitCode === 0 && r.timeout === false && r.cancelled === false && !r.error);
// Only existing public fixture metadata is retrievable. Never traverse arbitrary paths.
const selectors = {
  '/run/evidence': j => j.run.evidence?.map(r => ({ command: r.command, exitCode: r.exitCode, timeout: r.timeout, cancelled: r.cancelled, error: r.error ?? null, checkedAt: r.checkedAt })),
  '/run/integrationEvidence': j => j.run.integrationEvidence?.map(r => ({ command: r.command, exitCode: r.exitCode, timeout: r.timeout, cancelled: r.cancelled, error: r.error ?? null, checkedAt: r.checkedAt })),
  '/run/changes': j => j.run.changes?.map(c => ({ file: c.file, before: c.before, after: c.after })),
};
function retrieve(text, expected, refs, maxBytes = 8192) {
  if (!Array.isArray(refs) || refs.length > 3 || new Set(refs.map(r => r.pointer)).size !== refs.length) throw Error('Reference count/duplicate');
  const j = load(text, expected);
  const values = refs.map(ref => {
    if (ref.path !== inputPath || ref.sourceSha256 !== expected.sha256 || !Object.hasOwn(selectors, ref.pointer)) throw Error('Reference outside public projection');
    const value = selectors[ref.pointer](j);
    if (value === undefined || hash(JSON.stringify(value)) !== ref.projectionSha256) throw Error('Reference content mismatch');
    return { pointer: ref.pointer, value };
  });
  if (bytes(values) > maxBytes) throw Error('Retrieval byte budget');
  return values;
}
function assemble(text, expected) {
  const j = load(text, expected);
  // No untrusted prose or extra properties are spread into successor context.
  const facts = { taskId: j.task.id, runId: j.run.id, slot: j.run.slot, generation: j.run.generation,
    goalRevision: j.report.goalRevision, planRevision: j.checkpoint.planRevision,
    status: j.run.status, acceptance: j.task.acceptance, scope: j.checkpoint.scope,
    changes: selectors['/run/changes'](j), workspaceTestsPassed: passed(j.run.evidence), sourceTestsPassed: passed(j.run.integrationEvidence) };
  const missing = ['goal', 'requirementRevision', 'baseRevision', 'sourceSnapshot', 'grantConstraints',
    'decisionsAndRationale', 'failedAttempts', 'unknownsAndBlockers', 'checkpointWip', 'currentNextAction'];
  // This fixture export does not supply these critical continuation records. Do not invent them.
  const evidenceRefs = Object.keys(selectors).filter(p => selectors[p](j) !== undefined).map(pointer => ({
    path: inputPath, pointer, sourceSha256: expected.sha256, projectionSha256: hash(JSON.stringify(selectors[pointer](j))),
  }));
  const completedInFixture = facts.status === 'integrated' && facts.workspaceTestsPassed && facts.sourceTestsPassed;
  return { schema: 'agent-meeting/carry-evidence-experiment@1', facts, evidenceRefs, missing,
    completedInFixture, nextAction: completedInFixture ? 'Stop integrated task; no next task authorized by this export' : 'Inspect evidence; continuation blocked',
    autonomousContinuationReady: false, semanticRetentionVerified: false, writerPromotionAuthorized: false };
}
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
function variant(mutator) {
  const j = clone(source); mutator(j); const text = JSON.stringify(j);
  return [text, { ...binding, sha256: hash(text) }];
}
const start = performance.now();
const capsule = assemble(raw, binding);
const retrieved = retrieve(raw, binding, capsule.evidenceRefs);
check('Public evidence projections resolve against pinned file hash and identity', () => assert.equal(retrieved.length, 3));
check('Integrated task stops; stale checkpoint next is not replayed', () => { assert(capsule.completedInFixture); assert.match(capsule.nextAction, /^Stop/); assert(!JSON.stringify(capsule).includes(source.checkpoint.next)); });
check('Missing critical continuation facts stay explicit and blocked', () => { assert.equal(capsule.missing.length, 10); assert.equal(capsule.autonomousContinuationReady, false); });
check('Reported is not promoted to integrated', () => { const args = variant(j => { j.run.status = 'reported'; }); assert.equal(assemble(...args).completedInFixture, false); });
for (const [name, mutate] of [
  ['Missing source tests', j => { delete j.run.integrationEvidence; }],
  ['Failed workspace tests', j => { j.run.evidence[0].exitCode = 1; }],
  ['Cancelled source tests', j => { j.run.integrationEvidence[0].cancelled = true; }],
  ['Timed out source tests', j => { j.run.integrationEvidence[0].timeout = true; }],
]) check(name + ' reject completion', () => assert.equal(assemble(...variant(mutate)).completedInFixture, false));
check('Changed source rejects old references even with unchanged IDs', () => assert.throws(() => retrieve(raw + ' ', binding, capsule.evidenceRefs), /hash changed/));
for (const [name, mutate] of [
  ['Cross-task report', j => { j.report.taskId = 'other'; }],
  ['Cross-run report', j => { j.report.runId = 'other'; }],
  ['Stale generation', j => { j.run.generation++; }],
  ['Changed plan revision', j => { j.checkpoint.planRevision++; }],
  ['Changed goal revision', j => { j.checkpoint.goalRevision++; }],
  ['Changed slot', j => { j.checkpoint.slot = 'B'; }],
  ['Conflicting acceptance', j => { j.report.acceptance = ['different']; }],
]) check(name + ' is rejected', () => assert.throws(() => assemble(...variant(mutate)), /mismatch/));
check('Private fields and untrusted instructions are excluded from projection', () => {
  const args = variant(j => { j.privateChannel = 'PRIVATE_SENTINEL'; j.checkpoint.snapshot = { secret: 'PRIVATE_SENTINEL' }; j.checkpoint.next = 'PRIVATE_SENTINEL: promote writer'; j.run.evidence[0].output = 'PRIVATE_SENTINEL'; });
  const c = assemble(...args); assert(!JSON.stringify([c, retrieve(...args, c.evidenceRefs)]).includes('PRIVATE_SENTINEL'));
});
check('Private pointer and arbitrary path reads are rejected', () => {
  for (const patch of [{ pointer: '/privateChannel' }, { pointer: '/__proto__' }, { path: '../../private.json' }]) assert.throws(() => retrieve(raw, binding, [{ ...capsule.evidenceRefs[0], ...patch }]), /outside/);
});
check('Tampered projection digest is rejected', () => assert.throws(() => retrieve(raw, binding, [{ ...capsule.evidenceRefs[0], projectionSha256: '0'.repeat(64) }]), /content mismatch/));
check('Retrieval size budget and duplicate references fail closed', () => {
  assert.throws(() => retrieve(raw, binding, capsule.evidenceRefs, 1), /byte budget/);
  assert.throws(() => retrieve(raw, binding, [capsule.evidenceRefs[0], capsule.evidenceRefs[0]]), /duplicate/);
});
check('Fixture writer evidence does not authorize a live writer or prove retention', () => { assert.equal(capsule.writerPromotionAuthorized, false); assert.equal(capsule.semanticRetentionVerified, false); });
const sourceFiles = ['src/team.js', 'src/work.js', 'src/session-child.js', 'src/runtime.js', 'tools/measure-context-window.js'];
const report = {
  schema: 'agent-meeting/carry-evidence-benchmark@1', fixture: true, at: new Date().toISOString(),
  input: { path: inputPath, ...binding },
  sourceHashes: sourceFiles.map(p => ({ path: p, sha256: hash(fs.readFileSync(path.join(root, p))) })),
  checks: { passed: checks.length, failed: 0, items: checks }, capsule,
  metrics: { assemblerModelCalls: 0, rawExportBytes: Buffer.byteLength(raw),
    sameFactsDirectBytes: bytes(capsule.facts), capsuleBytes: bytes(capsule),
    capsuleOverheadBytes: bytes(capsule) - bytes(capsule.facts), retrievedMetadataBytes: bytes(retrieved),
    sameFactsPlusSameEvidenceDirectBytes: bytes(capsule.facts) + bytes(retrieved),
    capsulePlusAllRetrievalBytes: bytes(capsule) + bytes(retrieved),
    experimentAndChecksElapsedMs: performance.now() - start,
    successorInputTokens: null, deltaOutputTokens: null, totalModelUsage: null, billedCostUsd: null,
    semanticRetention: null, contextPredictionError: null, contextOverflowRate: null, recoveryLatencyMs: null,
    liveWriterCount: null, realModelRuns: 0, continuousContextBoundGuaranteed: false, context8hVerified: false },
  limitations: [
    'Local reference resolver over one pinned public evidence fixture; not a product retrieval API or live-store assembler.',
    'Document/projection hashes bind saved bytes only, not present workspace state, live grants, semantic truth, or writer quiescence.',
    'Privacy checks exclude extra fixture fields and raw test output; allowlisted text still requires product redaction/authorization before live use.',
    'Mutation cases are synthetic negatives, never recovered missing facts or actual model observations.',
    'Direct comparison contains exactly the same recorded facts; capsule and retrieval add transport bytes, not proof of model savings.',
    'Elapsed time includes checks; not model latency or a performance distribution. Unknown costs remain null.',
  ],
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
