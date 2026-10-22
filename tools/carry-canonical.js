'use strict';
// Explicit local experiment over a caller-supplied WorkManager. No default store,
// endpoint, runtime hook, model call or permission to dispatch/promote a writer.
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { sourceInventory, inventory, changes, safeFile } = require('../src/work');
const { findSecret } = require('../src/meeting');
const hash = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const checkpointHash = c => { const { hash: ignored, ...data } = c; return hash(data); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const bytes = v => Buffer.byteLength(JSON.stringify(v));
const keys = ['taskId', 'runId', 'goalRevision', 'planRevision', 'requirementRevision', 'baseRevision', 'slot', 'generation'];
const fail = code => { throw Error(code); };
const present = v => typeof v === 'string' && v.trim().length > 0;
const revision = v => Number.isSafeInteger(v) && v > 0;
function check(condition, code) { if (!condition) fail(code); }
function text(value, max = 8000) {
  check(present(value) && value.length <= max, 'missing-text');
  check(!findSecret(value), 'private-text');
  return value;
}
function paths(root, values) {
  check(Array.isArray(values) && values.length > 0 && values.length <= 40, 'missing-paths');
  for (const file of values) { text(file, 4000); safeFile(root, file); }
  return values;
}
function delta(c) {
  const d = c.continuation;
  check(d, 'missing-continuation');
  for (const k of ['failedAttempts', 'blockers']) check(Array.isArray(d[k]) && d[k].length <= 10, 'missing-' + k);
  for (const k of ['decisions', 'unknowns', 'next']) check(present(c[k]), 'missing-' + k);
  return { decisions: text(c.decisions), unknowns: text(c.unknowns, 4000), next: text(c.next, 4000),
    failedAttempts: d.failedAttempts.map(a => ({ attempt: text(a?.attempt, 1000), outcome: text(a?.outcome, 1000), avoid: text(a?.avoid, 1000) })),
    blockers: d.blockers.map(b => ({ issue: text(b?.issue, 1000), resolution: text(b?.resolution, 1000) })) };
}
function evidence(entries, testFiles) {
  if (entries === undefined) return [];
  check(Array.isArray(entries) && entries.length <= 40, 'invalid-evidence');
  return entries.map(e => {
    const file = Array.isArray(e.command) ? e.command[e.command.length - 1] : null;
    check(testFiles.includes(file), 'evidence-test-mismatch');
    // Never hydrate raw output, arbitrary command argv or error prose.
    return { testFile: file, exitCode: Number.isInteger(e.exitCode) ? e.exitCode : null,
      timeout: typeof e.timeout === 'boolean' ? e.timeout : null,
      cancelled: typeof e.cancelled === 'boolean' ? e.cancelled : null,
      error: !!e.error, checkedAt: text(e.checkedAt, 100) };
  });
}
const passed = (rows, files) => rows.length === files.length && new Set(rows.map(r => r.testFile)).size === files.length &&
  rows.every(r => r.exitCode === 0 && r.timeout === false && r.cancelled === false && !r.error);
function inspect(work, expected) {
  check(expected && keys.every(k => ['taskId','runId','baseRevision','slot'].includes(k) ? present(expected[k]) : revision(expected[k])), 'missing-expected-binding');
  const d = work.read(), p = d.pm, t = p?.team, g = p?.grant;
  const task = d.tasks.find(x => x.id === expected.taskId), run = d.runs.find(x => x.id === expected.runId), c = t?.checkpoint;
  check(task && run && p && t && g && c, 'missing-canonical-record');
  check(['running','reported','verified','integrated','failed','cancelled','timeout','output-limit','rejected','interrupted'].includes(run.status), 'missing-run-status');
  check(task.sourceCurrent === true, 'stale-task-source');
  check(p.status === 'active' && !['paused','suspended','expired'].includes(t.status) && g.expiresAt > Date.now() && (!t.endsAt || t.endsAt > Date.now()), 'stale-grant');
  check(g.id === t.grantId && g.id === run.pmGrantId && g.generation === p.generation && g.configRevision === work.configStore.read().revision, 'stale-grant-binding');
  check(run.configRevision === g.configRevision, 'stale-configRevision');
  check(['low','high'].includes(g.risk) && g.risk === task.risk && g.risk === run.requirementSnapshot?.risk && revision(g.maxRuns) &&
    typeof g.allowUnknownCost === 'boolean' && g.team && [60,120,180,null].includes(g.team.durationMinutes) &&
    ['maxInvocations','maxWakes'].every(k => revision(g.team[k])) && Number.isInteger(g.team.maxSwaps) && g.team.maxSwaps >= 0, 'missing-grant-constraints');
  check(task.pmId === p.id && run.pmId === p.id, 'pm-mismatch');
  check(expected.taskId === run.taskId && expected.taskId === t.plan?.taskId && expected.taskId === c.taskId && expected.runId === t.runId && expected.runId === c.runId, 'task-run-mismatch');
  for (const [k, values] of [
    ['goalRevision', [p.goalRevision, t.goalRevision, g.goalRevision, task.pmGoalRevision, run.pmGoalRevision, c.goalRevision, t.approval?.goalRevision]],
    ['planRevision', [t.planRevision, c.planRevision, t.approval?.planRevision]],
    ['requirementRevision', [task.requirementRevision, run.requirementRevision, run.requirementSnapshot?.requirementRevision, t.plan?.requirementRevision, c.requirementRevision]],
    ['baseRevision', [task.baseRevision, run.baseRevision, g.baseRevision, c.baseRevision]],
    ['slot', [t.slot, run.logicalSlot, c.slot]], ['generation', [t.generation, run.runtimeGeneration]],
  ]) check(values.every(v => v === expected[k]), 'stale-' + k);
  check(t.approval?.grantId === g.id, 'stale-approval');
  check(c.schema === 'agent-meeting/checkpoint@1' && revision(c.revision) && c.hash === checkpointHash(c), 'checkpoint-hash');
  check(c.generation === t.generation + 1 || (c.generation === t.generation && t.swap?.status === 'completed' && t.swap.checkpointHash === c.hash), 'stale-checkpoint-generation');
  check(run.workspace === c.workspace && task.workspace === run.source && task.workspace === g.workspace, 'workspace-mismatch');
  check(p.goal === task.goal && task.goal === run.requirementSnapshot?.goal, 'goal-conflict');
  for (const [k, values] of [
    ['acceptance', [p.acceptance, c.acceptance, run.requirementSnapshot?.acceptance]],
    ['writePaths', [g.writePaths, c.scope, run.requirementSnapshot?.writePaths]],
    ['testFiles', [g.testFiles, run.requirementSnapshot?.testFiles]],
  ]) check(values.every(v => same(v, task[k])), 'scope-conflict-' + k);
  check(Array.isArray(task.acceptance) && task.acceptance.length > 0, 'missing-acceptance');
  const scope = paths(run.source, task.writePaths), testFiles = paths(run.source, task.testFiles);
  const base = execFileSync('git', ['-C', run.source, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore','pipe','pipe'] }).trim();
  check(base === expected.baseRevision, 'stale-base-head');
  check(run.before && c.snapshot && t.approval.snapshotHash === hash(run.before), 'missing-source-snapshot');
  check(testFiles.every(f => run.before[f] && c.snapshot[f]), 'missing-test-snapshot');
  const source = sourceInventory(run.source), workspace = inventory(run.workspace);
  const integrated = run.status === 'integrated';
  check(!changes(integrated ? run.verifiedSnapshot || {} : run.before, source).length, 'stale-source-snapshot');
  check(same(changes(run.before, c.snapshot), c.wip), 'checkpoint-wip-mismatch');
  check(c.wip.length <= 1 && c.wip.every(x => scope.some(w => x.file === w || x.file.startsWith(w + '/'))), 'wip-outside-scope');
  if (run.status === 'running') check(!changes(c.snapshot, workspace).length, 'stale-wip');
  const actualChanges = changes(run.before, workspace);
  check(actualChanges.length <= 1 && actualChanges.every(x => scope.some(w => x.file === w || x.file.startsWith(w + '/'))), 'workspace-outside-scope');
  if (['reported','verified','integrated'].includes(run.status)) check(same(actualChanges, run.changes), 'stale-run-changes');
  if (['verified','integrated'].includes(run.status)) check(run.verifiedSnapshot && !changes(run.verifiedSnapshot, workspace).length, 'stale-verified-workspace');
  const workspaceEvidence = evidence(run.evidence, testFiles), sourceEvidence = evidence(run.integrationEvidence, testFiles);
  const workspacePassed = passed(workspaceEvidence, testFiles), sourcePassed = passed(sourceEvidence, testFiles);
  if (['verified','integrated'].includes(run.status)) check(workspacePassed, 'missing-passing-workspace-tests');
  if (integrated) check(task.status === 'done' && sourcePassed, 'missing-passing-source-tests');
  const binding = { ...Object.fromEntries(keys.map(k => [k, expected[k]])), storeRevision: d.revision,
    checkpointHash: c.hash, checkpointRevision: c.revision, sourceSnapshotHash: hash(source), workspaceSnapshotHash: hash(workspace) };
  const projections = { evidence: workspaceEvidence, integrationEvidence: sourceEvidence, changes: actualChanges };
  check(!findSecret(JSON.stringify(projections)), 'private-projection');
  const missing = [];
  let continuation = null;
  if (run.status === 'running') {
    try { continuation = delta(c); } catch (e) { if (e.message.startsWith('missing-')) missing.push(e.message); else throw e; }
  }
  const nextAction = missing.length ? 'blocked' : integrated ? 'stop-integrated-task' : run.status === 'reported' ? 'verify-reported-result' : run.status === 'verified' ? 'integrate-verified-result' : run.status === 'running' ? (continuation.blockers.length ? 'resolve-recorded-blockers' : 'inspect-checkpoint-delta') : 'reconcile-run';
  // A historical checkpoint may be useful evidence; its old next is never a new action.
  const facts = { goal: text(task.goal), acceptance: task.acceptance.map(x => text(x, 4000)), scope, testFiles,
    status: run.status, taskStatus: task.status, workspacePassed, sourcePassed,
    constraints: { risk: text(g.risk, 40), maxRuns: g.maxRuns, expiresAt: g.expiresAt,
      allowUnknownCost: g.allowUnknownCost, team: { durationMinutes: g.team.durationMinutes,
        maxSwaps: g.team.maxSwaps, maxInvocations: g.team.maxInvocations, maxWakes: g.team.maxWakes } },
    checkpoint: { historical: run.status !== 'running', wip: c.wip, snapshotHash: hash(c.snapshot) }, continuation };
  check(!findSecret(JSON.stringify(facts)), 'private-projection');
  // A concurrent coordinator update invalidates this read, even if unrelated.
  check(work.read().revision === d.revision, 'store-changed-during-read');
  return { binding, facts, missing, nextAction, projections };
}
function assemble(work, expected) {
  try {
    const { binding, facts, missing, nextAction, projections } = inspect(work, expected);
    const refs = Object.entries(projections).map(([kind, value]) => ({ kind, bindingHash: hash(binding), projectionHash: hash(value) }));
    return { schema: 'agent-meeting/canonical-carry-experiment@1', binding, facts, missing, refs, nextAction,
      localStateConsistent: missing.length === 0, writerPromotionAuthorized: false, semanticRetentionVerified: false };
  } catch (e) {
    // Error messages from git/filesystem may contain local/private paths. Do not echo them.
    const code = /^[a-z][a-zA-Z-]+$/.test(e.message) ? e.message : 'canonical-read-failed';
    return { schema: 'agent-meeting/canonical-carry-experiment@1', binding: null, facts: null, missing: [code], refs: [], nextAction: 'blocked',
      localStateConsistent: false, writerPromotionAuthorized: false, semanticRetentionVerified: false };
  }
}
function retrieve(work, binding, refs, maxBytes = 8192) {
  check(binding && Array.isArray(refs) && refs.length <= 3 && new Set(refs.map(r => r.kind)).size === refs.length, 'reference-count');
  check(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= 8192, 'reference-budget');
  let current;
  try { current = inspect(work, binding); }
  catch (e) { fail(/^[a-z][a-zA-Z-]+$/.test(e.message) ? e.message : 'canonical-read-failed'); }
  check(same(current.binding, binding), 'stale-reference-binding');
  const result = refs.map(r => {
    check(Object.hasOwn(current.projections, r.kind) && r.bindingHash === hash(binding), 'reference-outside-projection');
    const value = current.projections[r.kind]; check(r.projectionHash === hash(value), 'reference-content-mismatch');
    return { kind: r.kind, value };
  });
  check(bytes(result) <= maxBytes, 'reference-budget');
  return result;
}
module.exports = { assemble, retrieve, hash, checkpointHash, bytes };
