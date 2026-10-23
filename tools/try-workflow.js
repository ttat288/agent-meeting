'use strict';
// Offline, deterministic software walkthrough. Never invokes a model CLI.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const { createApp } = require('../src/server');
const { wrapExecution, checkSandbox } = require('../src/execution-sandbox');
const sha = value => createHash('sha256').update(value).digest('hex');
const initial = 'module.exports = (a,b) => a-b;\n';
const fixed = 'module.exports = (a,b) => a+b;\n';
const check = "require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n";
const context = 'Correct sum(2,3) to return 5. Change only sum.js; keep the independent test unchanged.';
const patch = "require('fs').writeFileSync('sum.js'," + JSON.stringify(fixed) + ')';
function execute(source, args, write) {
  const wrapped = wrapExecution(process.execPath, args, { workspace: source, write });
  try {
    const result = spawnSync(wrapped.bin, wrapped.args, { cwd: source, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
    if (result.error) throw result.error;
    return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
  } finally { wrapped.cleanup(); }
}
function hashes(source) {
  return Object.fromEntries(['sum.js', 'test/sum.test.js'].map(file => [file, sha(fs.readFileSync(path.join(source, file)))]));
}
function disk(dir) {
  let bytes = 0, files = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { const child = disk(file); bytes += child.bytes; files += child.files; }
    else if (entry.isFile()) { bytes += fs.statSync(file).size; files++; }
  }
  return { files, bytes };
}
async function main() {
  checkSandbox(); // Fail closed before creating anything; Linux/bwrap required.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-try-workflow-'));
  let app, origin, calls = 0;
  const http = [];
  const cfg = { configDir: path.join(root, 'config'), workDir: path.join(root, 'work'), dataDir: path.join(root, 'rooms'), runCli: async args => {
    calls++;
    if (!args.prompt.includes('READY')) assert.equal(execute(args.workspace, ['-e', patch], true).exitCode, 0);
    return { status: 'reported', reportedModel: 'fixture-model', text: 'Deterministic Node subprocess, not an AI result.', exitCode: 0, costUsd: null, usage: null };
  }};
  const report = { schema: 'agent-meeting/offline-walkthrough@1', recordedAt: new Date().toISOString(), node: process.version,
    fixture: true, modelCalls: 0, context, acceptance: ['sum(2,3)=5', 'only sum.js changes', 'test bytes unchanged'],
    provenanceChecks: ['linked task and source message', 'stale save rejected then recovered', 'verified before integration', 'same task/run/evidence after server restart'],
    appCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim(),
    sourceHashes: Object.fromEntries(['tools/try-workflow.js','src/server.js','src/meeting.js','src/work.js','src/execution-sandbox.js','src/runtime.js','src/config-store.js','src/routing.js','src/routing-tools.js'].map(file => [file, sha(fs.readFileSync(path.join(__dirname, '..', file)))])),
    humanActiveMs: null, modelTokens: null, billedCostUsd: null, http };
  const hostKey = 'host_offline_walkthrough_1234';
  async function boot() {
    app = createApp(cfg);
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    origin = 'http://127.0.0.1:' + app.server.address().port;
  }
  async function request(suffix, body, expected = 200) {
    const start = performance.now(), payload = body === undefined ? undefined : JSON.stringify(body);
    const response = await fetch(origin + '/api/host/' + hostKey + '/' + suffix, { method: payload === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json' }, body: payload, signal: AbortSignal.timeout(30000) });
    const raw = await response.text();
    http.push({ operation: suffix, status: response.status, elapsedMs: performance.now() - start, requestBodyBytes: payload ? Buffer.byteLength(payload) : 0, responseBodyBytes: Buffer.byteLength(raw) });
    assert.equal(response.status, expected, suffix + ': ' + raw);
    return JSON.parse(raw);
  }
  try {
    for (const arm of ['direct', 'managed']) {
      const source = path.join(root, arm); fs.mkdirSync(path.join(source, 'test'), { recursive: true });
      fs.writeFileSync(path.join(source, 'sum.js'), initial); fs.writeFileSync(path.join(source, 'test/sum.test.js'), check);
      execFileSync('git', ['init', '-q', source]); execFileSync('git', ['-C', source, 'add', '.']);
      execFileSync('git', ['-C', source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture']);
    }
    const direct = path.join(root, 'direct'), source = path.join(root, 'managed');
    report.inputHashes = hashes(direct); assert.deepEqual(hashes(source), report.inputHashes);
    // Both arms get the identical known patch, writable workspace, Node and test.
    // This measures machinery, not discovery/quality of a model-generated fix.
    const startDirect = performance.now();
    const directRed = execute(direct, ['--test', 'test/sum.test.js'], false); assert.equal(directRed.exitCode, 1);
    assert.equal(execute(direct, ['-e', patch], true).exitCode, 0);
    const directGreen = execute(direct, ['--test', 'test/sum.test.js'], false); assert.equal(directGreen.exitCode, 0);
    report.direct = { elapsedMs: performance.now() - startDirect, red: directRed, green: directGreen, outputHashes: hashes(direct), subprocesses: 3 };
    const startManaged = performance.now();
    const managedRed = execute(source, ['--test', 'test/sum.test.js'], false); assert.equal(managedRed.exitCode, 1);
    await boot(); app.create({ hostKey, id: 'agent_offline_walkthrough_1234', fixed: true });
    const config = app.configStore.read(), model = config.models.find(m => m.id === 'opus');
    Object.assign(model, { providerModelId: 'fixture-model', enabled: true, verification: 'verified', source: { ...model.source, confidence: 'user-configured', checkedAt: new Date().toISOString() } });
    config.profiles.find(p => p.id === 'opus-claude').enabled = true;
    await request('config', { config, expectedRevision: config.revision });
    await request('start', { context, agenda: [] });
    await request('say', { text: 'KẾT LUẬN: Correct addition; keep the test independent.\nVIỆC: Dev | Correct sum | today' });
    const plan = await request('work'), original = plan.tasks[0]; assert.equal(plan.tasks.length, 1);
    assert.equal(original.origin.context, context); assert.equal(original.origin.messageIndex, plan.session.decisions[0].messageIndex);
    const task = await request('work/tasks/' + original.id + '/configure', { expectedRevision: original.requirementRevision, purpose: 'execute', management: 'managed', acceptance: report.acceptance, workspace: source, writePaths: ['sum.js'], testFiles: ['test/sum.test.js'] });
    const conflict = await request('work/tasks/' + task.id + '/configure', { expectedRevision: original.requirementRevision, acceptance: ['stale'] }, 409);
    const recovered = await request('work'); assert.equal(recovered.tasks[0].requirementRevision, task.requirementRevision);
    await request('runtime/probe', { profileId: 'opus-claude' });
    const run = await request('work/tasks/' + task.id + '/run', { profileId: 'opus-claude', expectedRequirementRevision: task.requirementRevision, expectedConfigRevision: app.configStore.read().revision }, 202);
    let state;
    const deadline = performance.now() + 30000;
    do {
      state = await request('work');
      if (state.runs[0].status !== 'running') break;
      assert(performance.now() < deadline, 'Fixture did not settle');
      await new Promise(resolve => setTimeout(resolve, 20));
    } while (true);
    assert.equal(state.runs[0].status, 'reported', JSON.stringify(state.runs[0]));
    assert.deepEqual(hashes(source), report.inputHashes, 'Report must not alter source');
    const verified = await request('work/runs/' + run.id + '/verify', {}); assert.equal(verified.status, 'verified');
    assert.deepEqual(hashes(source), report.inputHashes, 'Verification must not alter source');
    const integrated = await request('work/runs/' + run.id + '/integrate', {}); assert.equal(integrated.status, 'integrated');
    assert.deepEqual(hashes(source), report.direct.outputHashes);
    assert.equal(hashes(source)['test/sum.test.js'], report.inputHashes['test/sum.test.js']);
    const changedPaths = execFileSync('git', ['-C', source, 'diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n'); assert.deepEqual(changedPaths, ['sum.js']);
    const beforeRestart = await request('work');
    await app.close(); app = null;
    await boot(); assert(app.restore(hostKey));
    const restored = await request('work');
    assert.equal(restored.tasks[0].id, task.id); assert.equal(restored.runs[0].id, run.id);
    assert.equal(restored.tasks[0].sourceCurrent, true); assert.equal(restored.runs[0].status, 'integrated');
    assert.deepEqual(restored.runs[0].integrationEvidence, beforeRestart.runs[0].integrationEvidence);
    report.managed = { elapsedMs: performance.now() - startManaged, red: managedRed, taskId: task.id, runId: run.id, requirementRevision: task.requirementRevision,
      sourceMessageIndex: original.origin.messageIndex, status: restored.runs[0].status, changedPaths, outputHashes: hashes(source), output: fs.readFileSync(path.join(source, 'sum.js'), 'utf8'),
      verificationExitCode: verified.evidence[0].exitCode, integrationExitCode: integrated.integrationEvidence[0].exitCode,
      staleSave: { status: 409, error: conflict.error, recovered: true }, restartPreserved: true, fixtureRunnerCalls: calls, persistentStore: disk(cfg.workDir) };
    report.limits = ['One sample, direct first; timings include warmup/order effects, not a performance benchmark.',
      'Managed timing includes config, conversation, recovery and restart; direct produces a tested file without linked history. Common code acceptance is identical; provenance is a separate managed check.',
      'Known patch supplied to both deterministic arms. No semantic model evaluation, user trial, token or billing comparison.',
      'HTTP body bytes exclude headers/TCP; disk is temporary work store only. Development, maintenance and human effort are unmeasured.',
      'Server/API walkthrough only; no new browser, remote machine, multi-file or long-duration acceptance.'];
    await app.close(); app = null;
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } finally { if (app) await app.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error('Offline walkthrough failed:', error.message); process.exitCode = 1; });
