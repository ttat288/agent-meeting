'use strict';
// Reproduce the retry context gap and measure machinery, never model quality.
// node tools/check-retry-context.js [--app-root /path/to/baseline] [--manual-feedback] [--expect failed|integrated]
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const fixture = require('../test/fixtures/csv-retry');
const appRoot = path.resolve(process.argv.includes('--app-root') ? process.argv[process.argv.indexOf('--app-root') + 1] : path.join(__dirname, '..'));
const manual = process.argv.includes('--manual-feedback');
const expected = process.argv.includes('--expect') ? process.argv[process.argv.indexOf('--expect') + 1] : 'integrated';
assert(['failed', 'integrated'].includes(expected), 'Expected status must be failed or integrated');
const { createApp } = require(path.join(appRoot, 'src/server'));
const { checkSandbox } = require('../src/execution-sandbox');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashes = source => Object.fromEntries(['csv-cell.js', 'test/csv-cell.test.js'].map(file => [file, sha(fs.readFileSync(path.join(source, file)))]));
function disk(dir) {
  let bytes = 0, files = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { const child = disk(full); files += child.files; bytes += child.bytes; }
    else if (e.isFile()) { files++; bytes += fs.statSync(full).size; }
  }
  return { files, bytes };
}
async function main() {
  checkSandbox();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-csv-retry-')), prompts = [], http = [];
  let app;
  const cfg = { configDir: root + '/config', workDir: root + '/work', dataDir: root + '/rooms', runCli: fixture.participant(prompts) };
  const report = { schema: 'agent-meeting/retry-context-check@1', recordedAt: new Date().toISOString(), fixture: true, modelCalls: 0, node: process.version, manualFeedback: manual,
    goal: fixture.goal, acceptance: fixture.acceptance, sourceHashes: Object.fromEntries(['src/work.js', 'src/ui/workspace.js', 'src/server.js'].map(f => [f, sha(fs.readFileSync(path.join(appRoot, f)))])),
    fixtureHash: sha(fs.readFileSync(path.join(__dirname, '../test/fixtures/csv-retry.js'))), http, humanTimeMs: null, modelTokens: null, billedCostUsd: null };
  try {
    for (const arm of ['direct', 'managed']) fixture.seed(path.join(root, arm));
    const direct = root + '/direct', source = root + '/managed';
    report.inputHashes = hashes(direct); assert.deepEqual(hashes(source), report.inputHashes);
    // Strong direct baseline: native test output is returned to the same
    // scripted participant without an operator copying it or changing goals.
    const d0 = performance.now();
    assert.equal(fixture.patch(direct).exitCode, 0);
    const d1 = fixture.execute(direct, ['--test', 'test/csv-cell.test.js'], false); assert.equal(d1.exitCode, 1);
    assert.equal(fixture.patch(direct, d1.output).exitCode, 0);
    const d2 = fixture.execute(direct, ['--test', 'test/csv-cell.test.js'], false); assert.equal(d2.exitCode, 0);
    report.direct = { elapsedMs: performance.now() - d0, attempts: 2, manualDiagnosticTransfers: 0, processes: 4, firstCheck: d1, finalCheck: d2, outputHashes: hashes(direct) };
    const m0 = performance.now();
    async function boot() {
      app = createApp(cfg);
      await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    }
    await boot();
    const hostKey = 'host_csv_retry_12345678';
    app.create({ hostKey, id: 'agent_csv_retry_12345678', fixed: true });
    fixture.enable(app.configStore);
    async function request(operation, body, status = 200) {
      const payload = body === undefined ? undefined : JSON.stringify(body), started = performance.now();
      const response = await fetch('http://127.0.0.1:' + app.server.address().port + '/api/host/' + hostKey + '/' + operation, {
        method: payload === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json' }, body: payload, signal: AbortSignal.timeout(30000) });
      const text = await response.text();
      http.push({ operation, status: response.status, elapsedMs: performance.now() - started, requestBodyBytes: Buffer.byteLength(payload || ''), responseBodyBytes: Buffer.byteLength(text) });
      assert.equal(response.status, status, text); return JSON.parse(text);
    }
    await request('start', { context: fixture.goal, agenda: [] });
    await request('say', { text: 'CONCLUSION: Export CSV cells without corrupting quotes or line breaks.\nTASK: Dev | Fix CSV cell escaping | today' });
    let state = await request('work');
    // The baseline snapshot includes the already present English capture fix.
    assert.equal(state.tasks.length, 1);
    const original = state.tasks[0];
    let task = await request('work/tasks/' + original.id + '/configure', { expectedRevision: original.requirementRevision, purpose: 'execute', management: 'managed', acceptance: fixture.acceptance, workspace: source, writePaths: ['csv-cell.js'], testFiles: ['test/csv-cell.test.js'] });
    await request('runtime/probe', { profileId: 'opus-claude' });
    async function attempt() {
      const run = await request('work/tasks/' + task.id + '/run', { profileId: 'opus-claude', expectedConfigRevision: app.configStore.read().revision, expectedRequirementRevision: task.requirementRevision }, 202);
      const end = performance.now() + 30000;
      do { state = await request('work'); if (state.runs.find(r => r.id === run.id).status !== 'running') break; assert(performance.now() < end); await new Promise(r => setTimeout(r, 10)); } while (true);
      assert.deepEqual(hashes(source), report.inputHashes, 'Report cannot write source');
      return request('work/runs/' + run.id + '/verify', {});
    }
    const failed = await attempt(); assert.equal(failed.status, 'failed');
    assert.equal(failed.evidence[0].exitCode, 1); assert.match(failed.evidence[0].output, /escapes embedded double quotes/);
    assert.deepEqual(hashes(source), report.inputHashes);
    // Persisted evidence must work across an ordinary server restart.
    await app.close(); app = null; await boot(); assert(app.restore(hostKey));
    state = await request('work'); assert.equal(state.runs[0].id, failed.id); assert.equal(state.tasks[0].id, task.id);
    if (manual) task = await request('work/tasks/' + task.id + '/configure', { expectedRevision: task.requirementRevision, facts: failed.evidence[0].output.match(/[\s\S]{1,3000}/g) });
    const retried = await attempt();
    let integrated = null;
    if (retried.status === 'verified') {
      integrated = await request('work/runs/' + retried.id + '/integrate', {}); assert.equal(integrated.status, 'integrated');
      assert.equal(integrated.integrationEvidence[0].exitCode, 0); assert.deepEqual(hashes(source), report.direct.outputHashes);
      assert.equal(hashes(source)['test/csv-cell.test.js'], report.inputHashes['test/csv-cell.test.js']);
    } else { assert.equal(retried.status, 'failed'); assert.deepEqual(hashes(source), report.inputHashes); }
    state = await request('work');
    const changedPaths = execFileSync('git', ['-C', source, 'diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    assert.deepEqual(changedPaths, integrated ? ['csv-cell.js'] : []);
    report.managed = { elapsedMs: performance.now() - m0, status: integrated?.status || retried.status, attempts: prompts.length, manualDiagnosticTransfers: manual ? 1 : 0, requirementRevision: task.requirementRevision,
      taskId: task.id, sourceMessageIndex: original.origin.messageIndex, firstRunId: failed.id, retryRunId: retried.id, firstCheck: failed.evidence[0], retryCheck: retried.evidence[0], integratedCheck: integrated?.integrationEvidence[0] || null,
      retryContext: prompts[1].previousFailure || null, retryContextBytes: Buffer.byteLength(JSON.stringify(prompts[1].previousFailure || null)), promptBytes: prompts.map(p => Buffer.byteLength(JSON.stringify(p))),
      sameObjectiveScopeAcceptance: prompts.every(p => p.objective === prompts[0].objective && JSON.stringify(p.scope) === JSON.stringify(prompts[0].scope) && JSON.stringify(p.acceptance) === JSON.stringify(prompts[0].acceptance)),
      changedPaths, outputHashes: hashes(source), restartPreserved: true, storedRetryContext: state.runs.find(r => r.id === retried.id).retryContext || null, store: disk(cfg.workDir) };
    assert(report.managed.sameObjectiveScopeAcceptance);
    report.limits = ['Scripted participant selects a known patch using a known diagnostic; not evidence of AI debugging or multi-provider efficacy.',
      'Direct baseline already gets test feedback with zero manual transfers. Managed before/after can only show removal of an avoidable feedback-transfer gap.',
      'One direct-first sample; elapsed time is machinery only and includes extra managed config/conversation/restart/provenance. No human-time, model-token, billing or statistical claim.',
      'HTTP measures body bytes only; disk measures the temporary work store. Headers, TCP, CPU, source copies, development and maintenance costs are not fully measured.',
      'Source stays unchanged until independent verification and integrated tests pass. Normal restart is not crash-process reconciliation.'];
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    assert.equal(report.managed.status, expected, 'Recovery did not meet the expected outcome');
  } finally { if (app) await app.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
