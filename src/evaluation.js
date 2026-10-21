'use strict';
// Descriptive measurements from persisted engine records. Reports never rank
// models, change routing policy, or turn agent prose into acceptance evidence.
const MAX_BYTES = 65536;
const STATUSES = ['queued', 'leased', 'lost', 'running', 'reported', 'verifying', 'verified', 'integrating', 'integrated', 'failed', 'cancelled', 'timeout', 'output-limit', 'rejected', 'interrupted', 'unknown'];
const TOKENS = ['input', 'output', 'total', 'cachedInput', 'reasoning'];
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const label = value => typeof value === 'string' && value.trim() ? value.slice(0, 160) : 'unknown';
function first(...values) { return values.map(finite).find(v => v !== null) ?? null; }
function tokens(usage) {
  const u = usage && typeof usage === 'object' ? usage : {};
  const input = first(u.input_tokens, u.inputTokens, u.prompt_tokens, u.promptTokenCount);
  const output = first(u.output_tokens, u.outputTokens, u.completion_tokens, u.candidatesTokenCount);
  return { input, output,
    total: first(u.total_tokens, u.totalTokens, u.totalTokenCount, input !== null && output !== null ? input + output : null),
    cachedInput: first(u.cache_read_input_tokens, u.cache_read_tokens, u.cacheReadInputTokens, u.cachedContentTokenCount, u.input_tokens_details?.cached_tokens, u.prompt_tokens_details?.cached_tokens),
    reasoning: first(u.reasoning_tokens, u.thinking_tokens, u.thoughtsTokenCount, u.output_tokens_details?.reasoning_tokens) };
}
function passing(evidence) {
  return Array.isArray(evidence) && evidence.length > 0 && evidence.every(e => e && typeof e === 'object' && e.exitCode === 0 && !e.error && !e.timeout && !e.cancelled);
}
function normalize(run, origin, index) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) throw new TypeError('Run must be an object');
  if (origin === 'remote') run = { ...run, ...(run.result || {}), id: run.id || (run.runId ? run.runId + ':' + (run.generation || 1) : undefined), requestedModel: run.requestedModel || run.modelId };
  const status = STATUSES.includes(run.status) ? run.status : 'unknown';
  const verified = ['verified', 'integrating', 'integrated'].includes(status) && passing(run.evidence);
  return { id: label(run.id), origin, taskId: label(run.taskId), status,
    requestedModel: label(run.requestedModel), actualModel: label(run.reportedModel),
    runtime: label(run.adapter || run.runtimeId), configRevision: Number.isSafeInteger(run.configRevision) && run.configRevision > 0 ? run.configRevision : null,
    requirementRevision: Number.isSafeInteger(run.requirementRevision) && run.requirementRevision > 0 ? run.requirementRevision : null,
    elapsedMs: finite(run.elapsedMs), usage: tokens(run.usage), costUsd: finite(run.costUsd), independentlyVerified: verified,
    accepted: status === 'integrated' && verified && passing(run.integrationEvidence),
    evidence: { runId: label(run.id), taskId: label(run.taskId), configRevision: Number.isSafeInteger(run.configRevision) && run.configRevision > 0 ? run.configRevision : null,
      verificationCount: Array.isArray(run.evidence) ? run.evidence.length : 0,
      integrationCount: Array.isArray(run.integrationEvidence) ? run.integrationEvidence.length : 0 },
    _index: index };
}
function sum(rows, get) {
  const values = rows.map(get).filter(v => v !== null);
  const known = values.length ? values.reduce((a, b) => a + b, 0) : null;
  return { total: rows.length > 0 && values.length === rows.length ? known : null, known, unknown: rows.length - values.length };
}
function summarize(rows) {
  const statuses = Object.fromEntries(STATUSES.map(status => [status, 0]));
  const taskAttempts = new Map();
  for (const row of rows) { statuses[row.status]++; const key = row.taskId === 'unknown' ? `${row.origin}:${row._index}` : row.taskId; taskAttempts.set(key, (taskAttempts.get(key) || 0) + 1); }
  const cost = sum(rows, r => r.costUsd), elapsed = sum(rows, r => r.elapsedMs);
  const acceptedTasks = new Set(rows.filter(r => r.accepted).map(r => r.taskId === 'unknown' ? `${r.origin}:${r._index}` : r.taskId)).size;
  const usage = {}, unknownUsageRuns = {};
  for (const key of TOKENS) { const value = sum(rows, r => r.usage[key]); usage[key] = value.total; unknownUsageRuns[key] = value.unknown; }
  return { attempts: rows.length, tasks: taskAttempts.size, retryAttempts: [...taskAttempts.values()].reduce((n, count) => n + Math.max(0, count - 1), 0), statuses,
    independentlyVerifiedRuns: rows.filter(r => r.independentlyVerified).length, acceptedRuns: rows.filter(r => r.accepted).length, acceptedTasks,
    acceptanceRate: taskAttempts.size ? acceptedTasks / taskAttempts.size : null,
    costUsd: cost.total, knownCostUsd: cost.known, unknownCostRuns: cost.unknown,
    elapsedMs: elapsed.total, knownElapsedMs: elapsed.known, unknownElapsedRuns: elapsed.unknown,
    averageElapsedMs: elapsed.total !== null ? elapsed.total / rows.length : null, usage, unknownUsageRuns };
}
function group(rows, get) {
  const groups = new Map();
  for (const row of rows) { const key = get(row); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([id, members]) => ({ id, ...summarize(members) }));
}
function aggregateResults({ runs = [], remoteRuns = [] } = {}, { limit = 20 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError('limit must be 1..100');
  if (![runs, remoteRuns].every(list => Array.isArray(list) && list.length <= 10000)) throw new TypeError('Run collections must contain at most 10000 records');
  const rows = [...runs.map((run, i) => normalize(run, 'local', i)), ...remoteRuns.flatMap(run => [...(run.history || []).map(prior => ({ ...run, ...prior, history: [] })), { ...run, history: [] }]).map((run, i) => normalize(run, 'remote', i))];
  const grouped = { byTask: group(rows, r => r.taskId), byModel: group(rows, r => JSON.stringify([r.requestedModel, r.actualModel])), byRuntime: group(rows, r => r.runtime) };
  grouped.byModel = grouped.byModel.map(g => { const [requestedModel, actualModel] = JSON.parse(g.id); return { ...g, requestedModel, actualModel }; });
  const items = rows.map(({ _index, ...row }) => row);
  const report = { schema: 'agent-meeting/evaluation@1', summary: summarize(rows),
    byTask: grouped.byTask.slice(0, limit), byModel: grouped.byModel.slice(0, limit), byRuntime: grouped.byRuntime.slice(0, limit), items: items.slice(0, limit),
    totals: { byTask: grouped.byTask.length, byModel: grouped.byModel.length, byRuntime: grouped.byRuntime.length, items: items.length },
    truncated: false, limit, maxBytes: MAX_BYTES, interpretation: 'descriptive-only; no automatic model ranking or causal claim' };
  const arrays = ['byTask', 'byModel', 'byRuntime', 'items'];
  while (Buffer.byteLength(JSON.stringify(report)) > MAX_BYTES) {
    const largest = arrays.reduce((a, b) => report[a].length >= report[b].length ? a : b);
    if (!report[largest].length) throw new RangeError('Evaluation summary exceeds response budget');
    report[largest].pop();
  }
  report.truncated = arrays.some(key => report[key].length < report.totals[key]);
  return report;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function compareBaseline(baseline, candidate) {
  const reasons = [];
  if (!baseline || !candidate || typeof baseline !== 'object' || typeof candidate !== 'object') throw new TypeError('Two cohorts required');
  const hashKnown = cohort => typeof cohort.taskSetHash === 'string' && cohort.taskSetHash.trim() && cohort.taskSetHash.length <= 160;
  if (!hashKnown(baseline) || !hashKnown(candidate)) reasons.push('task-set-unknown');
  else if (baseline.taskSetHash !== candidate.taskSetHash) reasons.push('task-set-mismatch');
  const budgetKey = cohort => {
    try {
      if (!cohort.budget || typeof cohort.budget !== 'object' || Array.isArray(cohort.budget) || !Object.keys(cohort.budget).length) return null;
      const key = JSON.stringify(stable(cohort.budget));
      return Buffer.byteLength(key) <= 4096 ? key : null;
    } catch { return null; }
  };
  const baselineBudget = budgetKey(baseline), candidateBudget = budgetKey(candidate);
  if (!baselineBudget || !candidateBudget) reasons.push('budget-unknown');
  else if (baselineBudget !== candidateBudget) reasons.push('budget-mismatch');
  if (reasons.length) return { comparable: false, reasons, deltas: null, causation: 'not-established' };
  const a = aggregateResults(baseline).summary, b = aggregateResults(candidate).summary;
  if (!a.attempts || !b.attempts) return { comparable: false, reasons: ['cohort-empty'], deltas: null, causation: 'not-established' };
  const delta = (x, y) => x !== null && y !== null ? y - x : null;
  return { comparable: true, reasons: [], taskSetHash: baseline.taskSetHash, budget: JSON.parse(JSON.stringify(baseline.budget)), baseline: a, candidate: b,
    deltas: { attempts: b.attempts - a.attempts, retryAttempts: b.retryAttempts - a.retryAttempts, acceptedTasks: b.acceptedTasks - a.acceptedTasks,
      acceptanceRate: delta(a.acceptanceRate, b.acceptanceRate), elapsedMs: delta(a.elapsedMs, b.elapsedMs), costUsd: delta(a.costUsd, b.costUsd), totalTokens: delta(a.usage.total, b.usage.total) },
    causation: 'not-established', interpretation: 'candidate minus baseline; observed measurements under matching declared task set and budget' };
}
module.exports = { MAX_BYTES, aggregateResults, compareBaseline };
