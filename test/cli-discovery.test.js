'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const { listSkills, showSkill } = require('../src/cli-discovery');
const root = path.resolve(__dirname, '..');
function fixture(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-skills-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function put(dir, id, description = 'Review a task', body = 'Only task-specific instructions.') {
  fs.mkdirSync(path.join(dir, id), { recursive: true });
  fs.writeFileSync(path.join(dir, id, 'SKILL.md'), `---\nname: ${id}\ndescription: ${description}\n---\n${body}\n`);
}
function cli(dir, args) { return spawnSync(process.execPath, [path.join(root, 'bin/cli.js'), ...args], { cwd: dir, encoding: 'utf8', timeout: 5000,
  env: { ...process.env, AGENT_MEETING_HOME: path.join(dir, 'home'), AGENT_MEETING_USER_HOME: path.join(dir, 'user') } }); }
test('discovery: bundled skill and local search/page/show work without room or home writes', t => {
  const dir = fixture(t), catalog = path.join(dir, '.agents', 'skills');
  put(catalog, 'alpha', 'Review code'); put(catalog, 'beta', 'Review security'); put(catalog, 'gamma', 'Draw diagrams');
  const first = listSkills({ dir: catalog, query: 'review', limit: 1 });
  assert.deepEqual(first.items.map(x => x.id), ['alpha']); assert.equal(first.nextOffset, 1);
  assert.deepEqual(listSkills({ dir: catalog, query: 'review', offset: 1 }).items.map(x => x.id), ['beta']);
  assert.match(showSkill('beta', { dir: catalog }), /Review security/);
  for (const args of [['skills', 'list'], ['skills', 'show', 'agent-meeting'], ['skills', 'list', '--local', '--query', 'security'], ['doctor']]) {
    const out = cli(dir, args); assert.equal(out.status, 0, out.stderr); assert(out.stdout.length < 8000);
  }
  assert.equal(fs.existsSync(path.join(dir, 'home')), false); assert.equal(fs.existsSync(path.join(dir, 'user')), false);
  const found = JSON.parse(cli(dir, ['skills', 'list', '--local', '--query', 'security']).stdout);
  assert.deepEqual(found.items.map(x => x.id), ['beta']);
});
test('catalog rejects traversal, links, excessive output and malformed manifests', t => {
  const dir = fixture(t); put(dir, 'good'); put(dir, 'big', 'Review', 'x'.repeat(66000));
  fs.mkdirSync(path.join(dir, 'invalid')); fs.writeFileSync(path.join(dir, 'invalid', 'SKILL.md'), 'not yaml');
  if (process.platform !== 'win32') fs.symlinkSync(path.join(dir, 'good'), path.join(dir, 'link'));
  const page = listSkills({ dir }); assert.deepEqual(page.items.map(x => x.id), ['good']); assert(page.skipped >= 2);
  for (const id of ['../good', '/tmp/evil', 'big', 'invalid']) assert.throws(() => showSkill(id, { dir }));
  for (const options of [{limit:0}, {limit:21}, {offset:-1}]) assert.throws(() => listSkills({ dir, ...options }));
  assert.equal(cli(dir, ['skills', 'show', '../good']).status, 1);
  assert.equal(cli(dir, ['skills', 'list', '--bogus']).status, 1);
  assert.equal(cli(dir, ['doctor', '--bogus']).status, 1);
});
test('doctor redacts room secrets and does not claim live connection or model permission', t => {
  const dir = fixture(t), home = path.join(dir, 'home'); fs.mkdirSync(home);
  const secret = 'must_not_appear_in_diagnostic';
  const file = path.join(home, 'rooms.json');
  fs.writeFileSync(file, JSON.stringify({ current: 'private', rooms: { private: { url: 'https://private.example', room: secret, headers: { Authorization: secret } } } }));
  const before = fs.readFileSync(file);
  const out = cli(dir, ['doctor']); assert.equal(out.status, 0, out.stderr);
  assert.doesNotMatch(out.stdout, /private\.example|must_not_appear/);
  const data = JSON.parse(out.stdout); assert.equal(data.room, 'configured'); assert.equal(data.connection, 'not-probed'); assert.equal(data.modelAccess, 'unknown');
  assert.deepEqual(fs.readFileSync(file), before); assert.deepEqual(fs.readdirSync(home), ['rooms.json']);
});
test('graph searches declared resource paths, reads only selected resources, and refreshes source hash', t => {
  const { inspectSkill } = require('../src/cli-discovery');
  const dir = fixture(t);
  put(dir, 'alpha', 'Review code', 'Read [network](references/network.md), [missing](references/missing.md) and [escape](../outside.txt). Run `scripts/check.py` only if authorized.');
  const refs = path.join(dir, 'alpha', 'references'); fs.mkdirSync(refs);
  fs.writeFileSync(path.join(refs, 'network.md'), 'Network checks only.');
  fs.mkdirSync(path.join(dir, 'alpha', 'scripts')); fs.writeFileSync(path.join(dir, 'alpha', 'scripts', 'check.py'), 'raise Exception("must never execute")');
  const before = inspectSkill('alpha', {dir});
  assert.equal(before.edges.find(e => e.target === 'references/network.md').status, 'available');
  assert.equal(before.edges.find(e => e.target === '../outside.txt').status, 'unavailable-or-blocked');
  assert.equal(before.edges.find(e => e.target === 'references/missing.md').status, 'unavailable-or-blocked');
  assert.deepEqual(listSkills({dir, query:'network', graph:true}).items.map(x=>x.id), ['alpha']);
  assert.deepEqual(listSkills({dir, query:'network'}).items, []);
  assert.equal(showSkill('alpha', {dir, resource:'references/network.md'}), 'Network checks only.');
  assert.throws(() => showSkill('alpha', {dir, resource:'../outside.txt'}));
  fs.writeFileSync(path.join(refs, 'undeclared.md'), 'Do not fetch me');
  assert.throws(() => showSkill('alpha', {dir, resource:'references/undeclared.md'}));
  if (process.platform !== 'win32') {
    fs.symlinkSync(path.join(refs, 'undeclared.md'), path.join(refs, 'linked.md'));
    fs.appendFileSync(path.join(dir, 'alpha', 'SKILL.md'), '\n[linked](references/linked.md)');
    assert.equal(inspectSkill('alpha', {dir}).edges.find(e => e.target === 'references/linked.md').status, 'unavailable-or-blocked');
  }
  fs.appendFileSync(path.join(dir, 'alpha', 'SKILL.md'), '\nSource changed');
  assert.notEqual(inspectSkill('alpha', {dir}).sha256, before.sha256);
  assert.equal(cli(dir, ['skills', 'inspect', 'alpha', '--dir', dir]).status, 0);
  assert.equal(cli(dir, ['skills', 'show', 'alpha', '--dir', dir, '--resource', 'references/network.md']).stdout.trim(), 'Network checks only.');
});
