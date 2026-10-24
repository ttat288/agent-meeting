'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const skills = require('../src/task-skills');
const { buildArgs } = require('../src/runtime');
const { wrapExecution } = require('../src/execution-sandbox');
function setup(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'am-task-skills-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  for (const id of ['required-guide', 'csv-guide']) {
    const dir = path.join(workspace, '.agents/skills', id);
    fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${id}\ndescription: CSV instructions\nversion: 1\n---\nKeep negations. [Rules](references/rules.md)\n`);
    fs.writeFileSync(path.join(dir, 'references/rules.md'), 'Quote double quotes and CR/LF. Do not change tests.');
  }
  const task = { id: 'task-fixture', requirementRevision: 3, workspace, skillPolicy: { catalog: 'local', required: ['required-guide'], optional: ['csv-guide'], tools: ['skill_list', 'skill_load'] } };
  task.skillSnapshot = skills.pin(task);
  return { workspace, task, context: skills.prepare(task, 'claude') };
}
test('required supply, optional metadata, bounded lookup and duplicate loads have distinct states', t => {
  const { context } = setup(t), bootstrap = skills.bootstrap(context), lookup = skills.createLookup(context);
  assert.equal(bootstrap.supplied.length, 1);
  assert.equal(bootstrap.available.find(e => e.id === 'csv-guide').state, 'available');
  assert(!JSON.stringify(bootstrap).includes('Quote double quotes and CR/LF'));
  assert.equal(lookup.call('skill_load', { id: 'required-guide' }).state, 'already-supplied');
  assert(!lookup.call('skill_load', { id: 'required-guide' }).text);
  assert.equal(lookup.call('skill_load', { id: 'csv-guide' }).state, 'supplied');
  assert.equal(lookup.call('skill_load', { id: 'csv-guide' }).state, 'already-loaded');
  const resource = lookup.call('skill_load', { id: 'csv-guide', resource: 'references/rules.md' });
  assert.match(resource.text, /Do not change tests/);
  assert.equal(resource.taskId, 'task-fixture'); assert.equal(resource.requirementRevision, 3);
  assert.equal(lookup.call('skill_load', { id: 'csv-guide', resource: 'references/rules.md' }).state, 'already-loaded');
  assert.equal(context.applied, 'not-observed');
});
test('denied tools, unselected skills, undeclared paths, bad arguments and unsupported adapters fail explicitly', t => {
  const { context, task } = setup(t), lookup = skills.createLookup(context);
  assert.throws(() => lookup.call('execute', {}), { code: 'SKILL_TOOL_DENIED' });
  assert.throws(() => lookup.call('skill_load', { id: 'not-selected' }), { code: 'SKILL_NOT_SELECTED' });
  for (const resource of ['../SKILL.md', '/etc/passwd', 'references/../../x', 'scripts/run.sh'])
    assert.throws(() => lookup.call('skill_load', { id: 'csv-guide', resource }), { code: 'SKILL_RESOURCE_DENIED' });
  assert.throws(() => lookup.call('skill_list', { root: '/etc' }), { code: 'SKILL_ARGUMENT_INVALID' });
  context.tools = ['skill_list'];
  assert.deepEqual(skills.createLookup(context).tools.map(t => t.name), ['skill_list']);
  assert.throws(() => skills.createLookup(context).call('skill_load', { id: 'csv-guide' }), { code: 'SKILL_TOOL_DENIED' });
  assert.throws(() => skills.prepare(task, 'agy'), { code: 'SKILL_TOOLS_UNSUPPORTED' });
  task.skillPolicy.tools = [];
  assert.throws(() => skills.prepare(task, 'agy'), { code: 'SKILL_TOOLS_UNSUPPORTED' });
});
test('manifest/resource edits and missing files invalidate supply/lookup until an explicit repin', t => {
  const { workspace, context, task } = setup(t), lookup = skills.createLookup(context);
  const file = path.join(workspace, '.agents/skills/csv-guide/references/rules.md');
  fs.appendFileSync(file, '\nChanged requirement.');
  assert.throws(() => skills.prepare(task, 'claude'), { code: 'SKILL_SOURCE_STALE' });
  assert.throws(() => lookup.call('skill_load', { id: 'csv-guide', resource: 'references/rules.md' }), { code: 'SKILL_SOURCE_STALE' });
  task.skillSnapshot = skills.pin(task);
  assert.match(skills.createLookup(skills.prepare(task, 'claude')).call('skill_load', { id: 'csv-guide', resource: 'references/rules.md' }).text, /Changed requirement/);
  fs.unlinkSync(file);
  assert.throws(() => lookup.call('skill_load', { id: 'csv-guide', resource: 'references/rules.md' }), { code: 'SKILL_SOURCE_STALE' });
});
test('symlink catalog/skill/resource redirection is blocked, including changes after pinning', t => {
  const { workspace, task, context } = setup(t);
  const root = path.join(workspace, '.agents/skills');
  fs.renameSync(root, root + '-moved'); fs.symlinkSync(root + '-moved', root);
  assert.throws(() => skills.pin(task), { code: 'SKILL_SOURCE_UNAVAILABLE' });
  assert.throws(() => skills.createLookup(context).call('skill_load', { id: 'csv-guide' }), { code: 'SKILL_SOURCE_STALE' });
});
test('invalid policies, credential-like content and over-limit sources are rejected before dispatch', t => {
  const { workspace, task } = setup(t);
  for (const policy of [null, {}, { ...task.skillPolicy, tools: ['shell'] }, { ...task.skillPolicy, optional: ['required-guide'] }, { ...task.skillPolicy, root: '/etc' }])
    assert.throws(() => skills.validatePolicy(policy), { code: 'SKILL_POLICY_INVALID' });
  const file = path.join(workspace, '.agents/skills/csv-guide/references/rules.md');
  fs.writeFileSync(file, 'sk-ant-' + 'sensitive-fixture-'.repeat(3));
  assert.throws(() => skills.pin(task), { code: 'SKILL_SECRET_BLOCKED' });
  fs.writeFileSync(file, 'x'.repeat(32001));
  assert.throws(() => skills.pin(task), { code: 'SKILL_SOURCE_UNAVAILABLE' });
});
test('linked scripts can only be read as data, and missing declared resources stay visibly unavailable', t => {
  const { workspace, task } = setup(t), folder = path.join(workspace, '.agents/skills/csv-guide');
  fs.mkdirSync(path.join(folder, 'scripts'));
  fs.writeFileSync(path.join(folder, 'scripts/demo.js'), 'require("fs").writeFileSync("should-not-exist", "unsafe");');
  fs.appendFileSync(path.join(folder, 'SKILL.md'), '\n[Example](scripts/demo.js) [Missing](references/missing.md)');
  task.skillSnapshot = skills.pin(task);
  const lookup = skills.createLookup(skills.prepare(task, 'claude'));
  assert.match(lookup.call('skill_load', { id: 'csv-guide', resource: 'scripts/demo.js' }).text, /writeFileSync/);
  assert(!fs.existsSync(path.join(workspace, 'should-not-exist')));
  assert.throws(() => lookup.call('skill_load', { id: 'csv-guide', resource: 'references/missing.md' }), { code: 'SKILL_RESOURCE_UNAVAILABLE' });
});
test('strict adapter MCP config contains only the fixed task server and explicit granted tools', t => {
  const { workspace, context } = setup(t), file = path.join(workspace, 'context.json');
  fs.writeFileSync(file, JSON.stringify(context));
  const args = buildArgs('claude', { modelId: 'fixture', prompt: 'Task', taskContextFile: file, write: true });
  const mcp = JSON.parse(args[args.indexOf('--mcp-config') + 1]);
  assert.deepEqual(Object.keys(mcp.mcpServers), ['task_skills']);
  assert.equal(mcp.mcpServers.task_skills.command, process.execPath);
  assert.deepEqual(mcp.mcpServers.task_skills.args, [path.resolve(__dirname, '../bin/task-skills.js'), file]);
  assert.equal(args[args.indexOf('--allowedTools') + 1], 'mcp__task_skills__skill_list,mcp__task_skills__skill_load');
  assert.equal(args[args.indexOf('--setting-sources') + 1], '');
  assert.equal(args[args.indexOf('--settings') + 1], '{"disableAllHooks":true}');
  assert(args.includes('--disable-slash-commands'));
  assert.throws(() => buildArgs('agy', { modelId: 'fixture', prompt: 'Task', taskContextFile: file }), /unsupported/);
});
test('real stdio MCP filters tool discovery and rejects forbidden calls without executing a script', t => {
  const { workspace, context } = setup(t), file = path.join(workspace, 'context.json');
  context.tools = ['skill_load']; fs.writeFileSync(file, JSON.stringify(context));
  const messages = [
    { id: 1, method: 'initialize' }, { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' }, { id: 3, method: 'tools/call', params: { name: 'skill_list' } },
    { id: 4, method: 'tools/call', params: { name: 'skill_load', arguments: { id: 'csv-guide', resource: 'references/rules.md' } } },
    { id: 5, method: 'tools/call', params: { name: 'skill_load', arguments: { id: 'csv-guide', resource: 'references/rules.md' } } },
  ];
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../bin/task-skills.js'), file], { input: messages.map(x => JSON.stringify(x)).join('\n') + '\n', encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  const out = result.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(out.length, 5); assert.deepEqual(out[1].result.tools.map(t => t.name), ['skill_load']);
  assert.equal(out[2].result.isError, true); assert.match(out[2].result.content[0].text, /SKILL_TOOL_DENIED/);
  assert.match(JSON.parse(out[3].result.content[0].text).text, /CR\/LF/);
  assert.equal(JSON.parse(out[4].result.content[0].text).state, 'already-loaded');
});
test('sandbox restores explicit /tmp context read-only without granting writes outside the worker copy', t => {
  const { workspace, context } = setup(t);
  const worker = path.join(workspace, 'worker'); fs.mkdirSync(worker);
  const file = path.join(workspace, 'context.json'); fs.writeFileSync(file, JSON.stringify(context));
  const script = `const fs=require('fs');const c=JSON.parse(fs.readFileSync(${JSON.stringify(file)},'utf8'));if(c.taskId!=='task-fixture')throw Error('context missing');try{fs.writeFileSync(${JSON.stringify(file)},'bad');throw Error('unexpected write');}catch(e){if(e.code!=='EROFS')throw e;}fs.writeFileSync('allowed.txt','ok');`;
  const wrapped = wrapExecution(process.execPath, ['-e', script], { workspace: worker, write: true, readOnlyPaths: [file, context.snapshot.root] });
  try {
    const result = spawnSync(wrapped.bin, wrapped.args, { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(worker, 'allowed.txt'), 'utf8'), 'ok');
    assert.equal(JSON.parse(fs.readFileSync(file)).taskId, 'task-fixture');
  } finally { wrapped.cleanup(); }
});

function workSetup(t, participant) {
  const { workspace, task } = setup(t), source = path.join(workspace, 'source');
  const csv = require('./fixtures/csv-retry'); csv.seed(source);
  fs.renameSync(path.join(workspace, '.agents'), path.join(source, '.agents'));
  fs.writeFileSync(path.join(source, '.gitignore'), '.agents/\n');
  const routing = require('../src/routing'), { ConfigStore } = require('../src/config-store');
  const store = new ConfigStore({ dir: path.join(workspace, 'config'), defaults: routing.defaults, validate: routing.validate });
  csv.enable(store);
  const { WorkManager } = require('../src/work');
  const prompts = [], work = new WorkManager({ dir: path.join(workspace, 'work'), configStore: store,
    runner: participant || csv.participant(prompts) });
  t.after(() => work.close());
  const input = { goal: csv.goal, purpose: 'execute', management: 'managed', workspace: source,
    acceptance: csv.acceptance, writePaths: ['csv-cell.js'], testFiles: ['test/csv-cell.test.js'], skillPolicy: task.skillPolicy };
  return { source, store, work, input, prompts };
}
test('managed task snapshots supply and grants once per attempt, retries with diagnostics, verifies and integrates', async t => {
  const { source, work, input, prompts } = workSetup(t);
  await work.probe('opus-claude');
  const task = work.createTask({ ...input, skillSnapshot: { injected: true } });
  assert(task.skillSnapshot.entries.length, 'Caller cannot inject a snapshot');
  const first = work.start(task.id, 'opus-claude'); await Promise.all([...work.pending]);
  assert.equal(prompts[0].skillContext.supplied.length, 1);
  assert.equal(prompts[0].skillContext.taskId, task.id);
  assert.equal((await work.verify(first.id)).status, 'failed');
  const second = work.start(task.id, 'opus-claude'); await Promise.all([...work.pending]);
  assert.equal(prompts[1].skillContext.supplied.length, 1);
  assert.equal(prompts[1].previousFailure.runId, first.id);
  assert.equal((await work.verify(second.id)).status, 'verified');
  assert.equal((await work.integrate(second.id)).status, 'integrated');
  const run = work.read().runs.at(-1);
  assert.equal(run.skillEvidence.applied, 'not-observed');
  assert.deepEqual(run.skillEvidence.tools, input.skillPolicy.tools);
  assert.equal(work.read().tasks[0].id, task.id); assert.equal(work.read().tasks[0].requirementRevision, 1);
  assert.equal(fs.readFileSync(path.join(source, 'csv-cell.js'), 'utf8'), require('./fixtures/csv-retry').fixed);
});
test('irrelevant task has no catalog, skill context, context file or lookup grant', async t => {
  let invocation;
  const { work, input } = workSetup(t, async args => { if (!args.prompt.includes('READY')) invocation = args; return { status: 'reported', reportedModel: args.modelId, text: 'Fixture' }; });
  delete input.skillPolicy; await work.probe('opus-claude');
  const task = work.createTask(input), run = work.start(task.id, 'opus-claude'); await Promise.all([...work.pending]);
  assert.equal(task.skillSnapshot, undefined); assert.equal(run.skillEvidence, undefined);
  assert.equal(JSON.parse(invocation.prompt).skillContext, undefined); assert.equal(invocation.taskContextFile, undefined);
});
test('changed ignored skill blocks dispatch/verification without changing the task or silently retrying', async t => {
  const { source, work, input } = workSetup(t);
  await work.probe('opus-claude'); const task = work.createTask(input);
  const file = path.join(source, '.agents/skills/csv-guide/references/rules.md');
  fs.appendFileSync(file, '\nNew rule');
  assert.throws(() => work.start(task.id, 'opus-claude'), { code: 'SKILL_SOURCE_STALE' });
  assert.equal(work.read().runs.length, 0); assert.equal(work.read().tasks[0].requirementRevision, 1);
  const updated = work.configureTask(task.id, { expectedRevision: 1, skillPolicy: input.skillPolicy });
  assert.equal(updated.requirementRevision, 2); assert.equal(work.read().runs.length, 0);
  const run = work.start(task.id, 'opus-claude'); await Promise.all([...work.pending]);
  fs.appendFileSync(file, '\nAnother rule');
  await assert.rejects(work.verify(run.id), { code: 'SKILL_SOURCE_STALE' });
  assert.equal(work.read().runs.at(-1).status, 'reported');
  assert.equal(work.read().runs.at(-1).requirementRevision, 2);
});

test('MCP accepts a burst of bounded lines crossing the buffer limit but rejects an oversized line', t => {
  const { workspace, context } = setup(t), file = path.join(workspace, 'burst-context.json');
  fs.writeFileSync(file, JSON.stringify(context));
  const message = JSON.stringify({ id: 1, method: 'ping', padding: 'x'.repeat(49000) });
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../bin/task-skills.js'), file],
    { input: (message + '\n').repeat(6), encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim().split('\n').filter(Boolean).length, 6);
  const oversized = spawnSync(process.execPath, [path.resolve(__dirname, '../bin/task-skills.js'), file],
    { input: JSON.stringify({ id: 1, method: 'ping', padding: 'x'.repeat(66000) }) + '\n', encoding: 'utf8', timeout: 10000 });
  assert.equal(oversized.stdout, '');
});

test('truncated discovery description is visible through task bootstrap and lookup metadata', t => {
  const { workspace, task } = setup(t), file = path.join(workspace, '.agents/skills/csv-guide/SKILL.md');
  fs.writeFileSync(file, '---\nname: csv-guide\ndescription: ' + 'x'.repeat(601) + '\n---\nComplete instructions remain in this manifest.\n');
  task.skillSnapshot = skills.pin(task);
  const context = skills.prepare(task, 'claude');
  assert.equal(skills.bootstrap(context).available.find(e => e.id === 'csv-guide').descriptionTruncated, true);
  assert.equal(skills.createLookup(context).call('skill_list').entries.find(e => e.id === 'csv-guide').descriptionTruncated, true);
  assert.match(skills.createLookup(context).call('skill_load', { id: 'csv-guide' }).text, /Complete instructions/);
});
