'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { aggregateResults, compareBaseline, MAX_BYTES } = require('../src/evaluation');
const evidence = () => [{ command: ['node', '--test', 'fixture.test.js'], exitCode: 0, checkedAt: '2026-10-21T00:00:00Z' }];
const run = (extra = {}) => ({ id: 'r1', taskId: 't1', configRevision: 3, requirementRevision: 2, requestedModel: 'requested-model', reportedModel: 'actual-model', adapter: 'claude', status: 'integrated',
  evidence: evidence(), integrationEvidence: evidence(), elapsedMs: 1000, costUsd: 0.5, usage: { input_tokens: 10, output_tokens: 5 }, ...extra });

test('statuses remain distinct and agent claims do not create accepted work', () => {
  const statuses = ['reported', 'verified', 'integrated', 'failed', 'cancelled', 'timeout', 'interrupted'];
  const runs = statuses.map((status, i) => run({ id: `r${i}`, taskId: `t${i}`, status, report: 'I verified and integrated everything' }));
  const result = aggregateResults({ runs });
  for (const status of statuses) assert.equal(result.summary.statuses[status], 1);
  assert.equal(result.summary.acceptedRuns, 1);
  assert.equal(result.summary.independentlyVerifiedRuns, 2);
  assert.equal(result.summary.acceptedTasks, 1);
  assert.equal(result.summary.acceptanceRate, 1 / statuses.length);
  assert.equal(result.summary.attempts, statuses.length);
});

test('acceptance requires integrated engine status and successful evidence at both stages', () => {
  const cases = [
    { status: 'reported' }, { status: 'verified' }, { evidence: [] }, { integrationEvidence: [] },
    { evidence: [{ exitCode: 1 }] }, { integrationEvidence: [{ exitCode: 0, timeout: true }] },
    { integrationEvidence: [{ exitCode: 0, cancelled: true }] }, { integrationEvidence: [{ exitCode: 0, error: 'failed to execute' }] },
  ];
  const result = aggregateResults({ runs: cases.map((extra, i) => run({ ...extra, id: String(i), taskId: String(i), report: 'all tests passed; done' })) });
  assert.equal(result.summary.acceptedRuns, 0);
  assert.equal(result.summary.acceptedTasks, 0);
  assert(result.items.every(item => !item.accepted));
});

test('partial and unknown cost never become a claimed complete actual total', () => {
  const result = aggregateResults({ runs: [run(), run({ id: 'r2', costUsd: null }), run({ id: 'r3', costUsd: undefined })] });
  assert.equal(result.summary.costUsd, null);
  assert.equal(result.summary.knownCostUsd, 0.5);
  assert.equal(result.summary.unknownCostRuns, 2);
  assert.equal(aggregateResults({ runs: [run({ costUsd: 0 })] }).summary.costUsd, 0);
  assert.equal(aggregateResults({ runs: [run({ costUsd: -1 })] }).summary.costUsd, null);
  assert.equal(aggregateResults({ runs: [run({ costUsd: NaN })] }).summary.costUsd, null);
  assert.equal(aggregateResults({ runs: [run({ costUsd: null })] }).summary.knownCostUsd, null);
  assert.equal(aggregateResults({}).summary.costUsd, null);
});

test('token fields normalize Claude, OpenAI and Gemini usage without double counting cache', () => {
  const runs = [
    run({ usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 4 } }),
    run({ id: 'r2', usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30, prompt_tokens_details: { cached_tokens: 8 }, output_tokens_details: { reasoning_tokens: 3 } } }),
    run({ id: 'r3', usage: { promptTokenCount: 30, candidatesTokenCount: 15, totalTokenCount: 50, cachedContentTokenCount: 12, thoughtsTokenCount: 5 } }),
    run({ id: 'r4', usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60, cacheReadInputTokens: 16 } }),
  ];
  const result = aggregateResults({ runs });
  assert.equal(result.summary.usage.input, 100);
  assert.equal(result.summary.usage.output, 50);
  assert.equal(result.summary.usage.total, 155);
  assert.equal(result.summary.usage.cachedInput, 40);
  assert.equal(result.summary.usage.reasoning, null);
  assert.equal(result.summary.unknownUsageRuns.reasoning, 2);
  assert.equal(aggregateResults({ runs: [run({ usage: null })] }).summary.usage.total, null);
});

test('attempts and retries aggregate by task while actual/requested models and runtimes stay separate', () => {
  const result = aggregateResults({ runs: [run({ status: 'failed' }), run({ id: 'r2', status: 'reported', reportedModel: 'unknown', adapter: 'agy' })],
    remoteRuns: [run({ id: 'remote-r1', taskId: 't2', adapter: 'remote-cli' })] });
  assert.equal(result.summary.attempts, 3);
  assert.equal(result.summary.tasks, 2);
  assert.equal(result.summary.retryAttempts, 1);
  assert.equal(result.byTask.find(group => group.id === 't1').attempts, 2);
  assert.equal(result.byRuntime.length, 3);
  assert(result.byModel.some(group => group.requestedModel === 'requested-model' && group.actualModel === 'unknown'));
  const item = result.items.find(item => item.origin === 'remote');
  assert.equal(item.evidence.runId, 'remote-r1');
  assert.equal(item.evidence.taskId, 't2');
  assert.equal(item.evidence.configRevision, 3);
  assert.equal(item.configRevision, 3);
  assert.equal(item.requirementRevision, 2);
});

test('bounded pages preserve complete summary counts and input data stays immutable', () => {
  const runs = Array.from({ length: 250 }, (_, i) => run({ id: `r${i}`, taskId: `t${i}`, requestedModel: `m${i}`, adapter: `runtime${i}`, report: 'private prose'.repeat(1000), configSnapshot: { secret: 'excluded' } }));
  const before = JSON.stringify(runs);
  const report = aggregateResults({ runs }, { limit: 100 });
  assert.equal(report.summary.attempts, 250);
  assert.equal(report.totals.items, 250);
  assert.equal(report.truncated, true);
  assert(report.items.length <= 100);
  assert(Buffer.byteLength(JSON.stringify(report)) <= MAX_BYTES);
  assert(!JSON.stringify(report).includes('private prose'));
  assert(!JSON.stringify(report).includes('excluded'));
  assert.equal(JSON.stringify(runs), before);
  assert.throws(() => aggregateResults({ runs: {} }), /collections/);
  assert.throws(() => aggregateResults({ runs: [null] }), /Run must/);
  assert.throws(() => aggregateResults({}, { limit: 101 }), /limit/);
});

test('empty summaries and missing durations retain unknown rather than invented zero', () => {
  const empty = aggregateResults({});
  assert.equal(empty.summary.attempts, 0); assert.equal(empty.summary.acceptanceRate, null);
  assert.equal(empty.summary.elapsedMs, null); assert.equal(empty.summary.usage.total, null);
  assert.equal(empty.truncated, false);
  const result = aggregateResults({ runs: [run(), run({ id: 'other', elapsedMs: undefined })] });
  assert.equal(result.summary.elapsedMs, null); assert.equal(result.summary.knownElapsedMs, 1000);
  assert.equal(result.summary.averageElapsedMs, null); assert.equal(result.summary.unknownElapsedRuns, 1);
});

const cohort = (extra = {}) => ({ taskSetHash: 'same-task-set-hash', budget: { maxCostUsd: 2, maxRetries: 1 }, runs: [run()], ...extra });
test('baseline comparison refuses task-set and budget mismatch, missing declarations and empty cohorts', () => {
  for (const [candidate, reason] of [
    [cohort({ taskSetHash: 'different' }), 'task-set-mismatch'], [cohort({ taskSetHash: null }), 'task-set-unknown'],
    [cohort({ budget: { maxCostUsd: 3 } }), 'budget-mismatch'], [cohort({ budget: null }), 'budget-unknown'],
    [cohort({ runs: [] }), 'cohort-empty'],
  ]) {
    const result = compareBaseline(cohort(), candidate);
    assert.equal(result.comparable, false); assert(result.reasons.includes(reason)); assert.equal(result.deltas, null);
  }
});

test('matching declared cohorts yield measured deltas and no causal or model ranking claims', () => {
  const baseline = cohort();
  const candidate = cohort({ budget: { maxRetries: 1, maxCostUsd: 2 }, runs: [run({ elapsedMs: 800, costUsd: 0.25, usage: { total_tokens: 12 } })] });
  const before = JSON.stringify(candidate), result = compareBaseline(baseline, candidate);
  assert.equal(result.comparable, true);
  assert.equal(result.deltas.elapsedMs, -200);
  assert.equal(result.deltas.costUsd, -0.25);
  assert.equal(result.deltas.totalTokens, -3);
  assert.equal(result.deltas.acceptedTasks, 0);
  assert.equal(result.causation, 'not-established');
  assert.equal(result.winner, undefined);
  assert.equal(JSON.stringify(candidate), before);
});

test('comparable cohorts may have unknown costs without converting missing prices to savings', () => {
  const result = compareBaseline(cohort(), cohort({ runs: [run({ costUsd: null, elapsedMs: null, usage: null })] }));
  assert.equal(result.comparable, true);
  assert.equal(result.deltas.costUsd, null); assert.equal(result.deltas.elapsedMs, null); assert.equal(result.deltas.totalTokens, null);
  assert.equal(result.candidate.unknownCostRuns, 1);
});
test('remote coordinator records retain model identity, telemetry and prior generation attempts',()=>{
 const report=aggregateResults({remoteRuns:[{runId:'remote-run',taskId:'remote-task',modelId:'requested',adapter:'claude',generation:2,status:'reported',result:{reportedModel:'actual',usage:{input_tokens:10,output_tokens:5},elapsedMs:20,costUsd:0.01},history:[{generation:1,status:'failed',result:{reportedModel:'actual',elapsedMs:15,costUsd:null}}]}]});
 assert.equal(report.summary.attempts,2);assert.equal(report.summary.retryAttempts,1);assert.equal(report.summary.costUsd,null);assert.equal(report.summary.knownCostUsd,0.01);assert.equal(report.items.find(r=>r.status==='reported').actualModel,'actual');assert.equal(report.items.find(r=>r.status==='reported').usage.total,15);assert.equal(report.summary.acceptedRuns,0);
});
