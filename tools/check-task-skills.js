'use strict';
// Matched deterministic CSV journey. No native model inference or billing claim.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), { spawnSync } = require('node:child_process'), { performance } = require('node:perf_hooks');
const csv = require('../test/fixtures/csv-retry');
const rootApp = path.resolve(__dirname, '..'), hash = text => crypto.createHash('sha256').update(text).digest('hex');
const baselineRoot = process.argv.includes('--baseline-root') ? path.resolve(process.argv[process.argv.indexOf('--baseline-root') + 1]) : null;
const sourceHashes = dir => Object.fromEntries(['csv-cell.js', 'test/csv-cell.test.js'].map(f => [f, hash(fs.readFileSync(path.join(dir, f)))]));
function catalog(source) {
  fs.writeFileSync(path.join(source, '.gitignore'), '.agents/\n');
  for (const [id, body] of [
    ['task-rules', 'Keep task ID, scope, conditions and negations, evidence, unknowns and next step in handoffs. Do not change independent tests.'],
    ['csv-guide', 'Load the CSV reference when escaping cells. [CSV rules](references/csv.md)'],
  ]) {
    const folder = path.join(source, '.agents/skills', id); fs.mkdirSync(path.join(folder, 'references'), { recursive: true });
    fs.writeFileSync(path.join(folder, 'SKILL.md'), `---\nname: ${id}\ndescription: ${id === 'task-rules' ? 'Required task handoff and scope rules' : 'CSV escaping reference; load only for CSV tasks'}\nversion: 1\n---\n${body}\n`);
    if (id === 'csv-guide') fs.writeFileSync(path.join(folder, 'references/csv.md'), 'Quote cells containing comma, double quote, CR or LF. Double embedded double quotes. Preserve Unicode, plain, empty and numeric cells. Do not change tests.\n');
  }
}
function mcp(args, messages) {
  const input = messages.map(x => JSON.stringify({ jsonrpc: '2.0', ...x })).join('\n') + '\n';
  const result = spawnSync(process.execPath, [path.join(rootApp, 'bin/task-skills.js'), args.taskContextFile], { input, encoding: 'utf8', timeout: 10000, maxBuffer: 512 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  return { responses: result.stdout.trim().split('\n').map(JSON.parse), requestBytes: Buffer.byteLength(input), responseBytes: Buffer.byteLength(result.stdout),
    schemaBytes: Buffer.byteLength(JSON.stringify(require('../src/task-skills').TOOLS)) };
}
async function arm(appRoot, baseline, root) {
  const { createApp } = require(path.join(appRoot, 'src/server'));
  const source = path.join(root, 'source'); csv.seed(source); catalog(source);
  const prompts = [], calls = [], lookups = [], http = [];
  const participant = csv.participant(prompts);
  let app, nativeCalls = 0;
  const runner = async args => {
    if (args.prompt.includes('READY')) return participant(args);
    nativeCalls++;
    const payload = JSON.parse(args.prompt);
    if (!baseline) {
      assert.equal(payload.skillContext.supplied.length, 1);
      assert.equal(payload.skillContext.available.find(e => e.id === 'csv-guide').state, 'available');
      assert(!JSON.stringify(payload.skillContext).includes('Quote cells containing comma'));
      const observed = mcp(args, [
        { id: 1, method: 'initialize' }, { id: 2, method: 'tools/list' },
        { id: 3, method: 'tools/call', params: { name: 'execute', arguments: { command: 'do-not-run' } } },
        { id: 4, method: 'tools/call', params: { name: 'skill_load', arguments: { id: 'csv-guide', resource: 'references/csv.md' } } },
        { id: 5, method: 'tools/call', params: { name: 'skill_load', arguments: { id: 'csv-guide', resource: 'references/csv.md' } } },
        { id: 6, method: 'tools/call', params: { name: 'skill_load', arguments: { id: 'task-rules' } } },
      ]);
      assert.equal(observed.responses[2].result.isError, true);
      assert.match(JSON.parse(observed.responses[3].result.content[0].text).text, /Double embedded double quotes/);
      assert.equal(JSON.parse(observed.responses[4].result.content[0].text).state, 'already-loaded');
      assert.equal(JSON.parse(observed.responses[5].result.content[0].text).state, 'already-supplied');
      lookups.push(observed);
    } else assert.equal(payload.skillContext, undefined);
    calls.push({ promptBytes: Buffer.byteLength(args.prompt), skillContextFile: !!args.taskContextFile });
    return participant(args);
  };
  const config = { configDir: root + '/config', workDir: root + '/work', dataDir: root + '/rooms', runCli: runner };
  const host = 'host_task_skills_fixture_1234';
  const boot = async () => { app = createApp(config); await new Promise(r => app.server.listen(0, '127.0.0.1', r)); };
  const request = async (endpoint, body, status = 200) => {
    const input = body === undefined ? undefined : JSON.stringify(body), start = performance.now();
    const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api/host/${host}/` + endpoint,
      { method: input === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json' }, body: input, signal: AbortSignal.timeout(30000) });
    const text = await response.text(); http.push({ endpoint, status: response.status, requestBytes: Buffer.byteLength(input || ''), responseBytes: Buffer.byteLength(text), elapsedMs: performance.now() - start });
    assert.equal(response.status, status, text); return JSON.parse(text);
  };
  const start = performance.now();
  try {
    await boot(); app.create({ hostKey: host, id: 'agent_task_skills_fixture_1234', fixed: true }); csv.enable(app.configStore);
    await request('start', { context: csv.goal, agenda: [] });
    await request('say', { text: 'CONCLUSION: Preserve CSV data.\nTASK: Dev | Fix CSV cell escaping | today' });
    const original = (await request('work')).tasks[0];
    const policy = { catalog: 'local', required: ['task-rules'], optional: ['csv-guide'], tools: ['skill_load'] };
    let task = await request(`work/tasks/${original.id}/configure`, { expectedRevision: original.requirementRevision, purpose: 'execute', management: 'managed', workspace: source,
      writePaths: ['csv-cell.js'], testFiles: ['test/csv-cell.test.js'], acceptance: csv.acceptance, skillPolicy: policy });
    const configuredRevision = task.requirementRevision;
    let transfers = 0, discoveryCommands = 0;
    if (baseline) {
      const discovery = require(path.join(appRoot, 'src/cli-discovery'));
      const options = { dir: path.join(source, '.agents/skills') };
      discovery.listSkills(options); discoveryCommands++;
      const required = discovery.showSkill('task-rules', options); discoveryCommands++;
      discovery.inspectSkill('csv-guide', options); discoveryCommands++;
      const reference = discovery.showSkill('csv-guide', { ...options, resource: 'references/csv.md' }); discoveryCommands++;
      // Concrete operator workaround: two guide bodies pasted into facts once.
      task = await request(`work/tasks/${task.id}/configure`, { expectedRevision: task.requirementRevision, facts: [required, reference] }); transfers = 2;
    }
    const params = () => ({ profileId: 'opus-claude', expectedRequirementRevision: task.requirementRevision, expectedConfigRevision: app.configStore.read().revision });
    await request('runtime/probe', { profileId: 'opus-claude' });
    const attempt = async () => {
      const run = await request(`work/tasks/${task.id}/run`, params(), 202);
      for (let i = 0; i < 300; i++) { const current = (await request('work')).runs.find(r => r.id === run.id); if (current.status !== 'running') { assert.equal(current.status, 'reported', current.error); return current; } await new Promise(r => setTimeout(r, 5)); }
      throw Error('Fixture timeout');
    };
    const first = await attempt(); assert.equal((await request(`work/runs/${first.id}/verify`, {})).status, 'failed');
    await app.close(); app = null; await boot(); assert(app.restore(host));
    const restored = await request('work'); assert.equal(restored.tasks[0].id, task.id); assert(restored.runs[0].evidence[0].output);
    const second = await attempt(); assert.equal(second.retryContext.fromRunId, first.id);
    assert.equal((await request(`work/runs/${second.id}/verify`, {})).status, 'verified');
    assert.equal((await request(`work/runs/${second.id}/integrate`, {})).status, 'integrated');
    const handoff = await request(`work/runs/${second.id}/handoff`);
    assert.equal(handoff.task.id, original.id); assert.equal(handoff.task.requirementRevision, task.requirementRevision);
    if (!baseline) { assert.equal(handoff.skillEvidence.applied, 'not-observed'); assert.equal(task.requirementRevision, configuredRevision); }
    const report = { baseline, appRoot, taskId: task.id, requirementRevision: task.requirementRevision, configuredRevision, attempts: nativeCalls,
      elapsedMs: performance.now() - start, guideBodyManualTransfers: transfers, discoveryCommands, diagnosticManualTransfers: 0,
      calls, lookups, http, status: handoff.status, inputHashes: { 'csv-cell.js': hash(csv.initial), 'test/csv-cell.test.js': hash(csv.tests) }, outputHashes: sourceHashes(source),
      checks: handoff.integrationVerification, supplied: handoff.skillEvidence || null, restartPreserved: true, modelCalls: 0, modelTokens: null, billedCostUsd: null };
    return report;
  } finally { if (app) await app.close(); }
}
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-skills-check-'));
  try {
    const arms = [];
    if (baselineRoot) arms.push(await arm(baselineRoot, true, path.join(root, 'baseline')));
    arms.push(await arm(rootApp, false, path.join(root, 'managed')));
    const direct = path.join(root, 'direct'); csv.seed(direct); const t0 = performance.now();
    csv.patch(direct); const failed = csv.execute(direct, ['--test', 'test/csv-cell.test.js'], false); assert.equal(failed.exitCode, 1);
    csv.patch(direct, failed.output); const checked = csv.execute(direct, ['--test', 'test/csv-cell.test.js'], false); assert.equal(checked.exitCode, 0);
    for (const value of arms) assert.deepEqual(value.outputHashes, sourceHashes(direct));
    console.log(JSON.stringify({ schema: 'agent-meeting/skill-journey-evidence@1', recordedAt: new Date().toISOString(), fixture: true, arms,
      direct: { elapsedMs: performance.now() - t0, processes: 4, diagnosticManualTransfers: 0, outputHashes: sourceHashes(direct), check: checked, guideRequirement: 'CSV rules supplied directly to the scripted participant; no routing/catalog wrapper' },
      limitations: ['Scripted patch selection and MCP calls, not model reasoning or agent tool choice.', 'Same CSV bytes and 8 acceptance checks. Sequential single samples; elapsed scopes differ.', 'Guide-body transfers count protocol operations, not measured human effort.', 'Bytes are UTF-8 request/output estimates, not tokens or billing. No human UX acceptance.'] }, null, 2));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
