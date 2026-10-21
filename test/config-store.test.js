'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { ConfigStore } = require('../src/config-store');

const defaults = () => ({ schema: 'agent-meeting/routing@1', revision: 1, models: [{ id: 'a', enabled: true }], policy: { review: true } });
const validate = config => {
  if (config.schema !== 'agent-meeting/routing@1' || !Array.isArray(config.models)) throw new Error('Invalid routing schema');
};
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-meeting-config-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'config');
  return { root, dir, store: new ConfigStore({ dir, defaults, validate }) };
}

test('defaults remain in memory; successful save survives restart with private files and backup', t => {
  const { dir, store } = fixture(t);
  assert.equal(store.read().revision, 1);
  assert.equal(fs.existsSync(dir), false);
  const config = store.read();
  config.models[0].enabled = false;
  const saved = store.save(config, 1);
  assert.equal(saved.revision, 2);
  assert.deepEqual(new ConfigStore({ dir, defaults, validate }).read(), saved);
  assert.deepEqual(JSON.parse(fs.readFileSync(store.backupFile, 'utf8')), defaults());
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    for (const file of [store.file, store.backupFile]) assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  }
  const next = store.save(saved, 2);
  assert.equal(next.revision, 3);
  assert.equal(JSON.parse(fs.readFileSync(store.backupFile)).revision, 2);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['config.json', 'config.json.bak']);
});

test('two instances compare against disk revision and never overwrite stale edits', t => {
  const { dir, store } = fixture(t);
  const other = new ConfigStore({ dir, defaults, validate });
  const stale = other.read();
  store.save(store.read(), 1);
  assert.throws(() => other.save(stale, 1), { code: 'CONFIG_CONFLICT', currentRevision: 2 });
  assert.equal(other.read().revision, 2);
  assert.equal(fs.existsSync(store.lockFile), false);
});

test('read and save return independent deep copies, including defaults and old run snapshots', t => {
  const { store } = fixture(t);
  const runSnapshot = store.read();
  const edit = store.read();
  edit.models[0].id = 'edited';
  assert.equal(store.read().models[0].id, 'a');
  const saved = store.save(edit, 1);
  saved.models[0].id = 'mutated';
  edit.models[0].id = 'mutated-input';
  assert.equal(store.read().models[0].id, 'edited');
  assert.equal(runSnapshot.models[0].id, 'a');
  assert.equal(runSnapshot.revision, 1);
});

test('malformed JSON and invalid persisted schema fail closed without replacing bytes', t => {
  const { store } = fixture(t);
  store.save(store.read(), 1);
  for (const raw of ['{broken', JSON.stringify({ revision: 2, models: [] }), JSON.stringify({ ...defaults(), revision: 0 })]) {
    fs.writeFileSync(store.file, raw);
    assert.throws(() => store.read(), { code: 'CONFIG_CORRUPT' });
    assert.throws(() => store.save(defaults(), 2), { code: 'CONFIG_CORRUPT' });
    assert.equal(fs.readFileSync(store.file, 'utf8'), raw);
    assert.equal(fs.existsSync(store.lockFile), false);
  }
});

test('validation and missing expected revision fail before writing any data', t => {
  const { dir, store } = fixture(t);
  assert.throws(() => store.save({ revision: 1 }, 1), /Invalid routing schema/);
  assert.throws(() => store.save(defaults()), { code: 'CONFIG_CONFLICT' });
  assert.equal(fs.existsSync(dir), false);
});

test('lock held by another process is respected and never deleted automatically', t => {
  const { dir, store } = fixture(t);
  fs.mkdirSync(dir);
  fs.writeFileSync(store.lockFile, 'other-process\n');
  const child = spawnSync(process.execPath, ['-e', `
    const { ConfigStore } = require(${JSON.stringify(path.resolve(__dirname, '../src/config-store'))});
    const store = new ConfigStore({ dir: process.argv[1], defaults: ${defaults.toString()}, validate: ${validate.toString()} });
    try { store.save(store.read(), 1); process.exit(1); }
    catch (error) { if (error.code !== 'CONFIG_LOCKED') throw error; }
  `, dir], { encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(fs.readFileSync(store.lockFile, 'utf8'), 'other-process\n');
  assert.equal(fs.existsSync(store.file), false);
});

test('write failure before publishing leaves current configuration and no temporary file', t => {
  const { dir, store } = fixture(t);
  const saved = store.save(store.read(), 1);
  const before = fs.readFileSync(store.file, 'utf8');
  const rename = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (to === store.file) throw Object.assign(new Error('simulated disk failure'), { code: 'EIO' });
    return rename(from, to);
  };
  try { assert.throws(() => store.save(saved, 2), /simulated disk failure/); }
  finally { fs.renameSync = rename; }
  assert.equal(fs.readFileSync(store.file, 'utf8'), before);
  assert.equal(store.read().revision, 2);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['config.json', 'config.json.bak']);
});

test('failed fsync never publishes a partial snapshot', t => {
  const { dir, store } = fixture(t);
  store.save(store.read(), 1);
  const before = fs.readFileSync(store.file, 'utf8');
  const fsync = fs.fsyncSync;
  fs.fsyncSync = () => { throw Object.assign(new Error('sync failure'), { code: 'EIO' }); };
  try { assert.throws(() => store.save(store.read(), 2), /sync failure/); }
  finally { fs.fsyncSync = fsync; }
  assert.equal(fs.readFileSync(store.file, 'utf8'), before);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['config.json', 'config.json.bak']);
});

test('symlink config and directory cannot redirect writes', t => {
  const { root, dir, store } = fixture(t);
  const target = path.join(root, 'target.json');
  fs.writeFileSync(target, JSON.stringify(defaults()));
  fs.mkdirSync(dir);
  fs.symlinkSync(target, store.file);
  assert.throws(() => store.read(), { code: 'CONFIG_UNSAFE_PATH' });
  assert.throws(() => store.save(defaults(), 1), { code: 'CONFIG_UNSAFE_PATH' });
  assert.deepEqual(JSON.parse(fs.readFileSync(target)), defaults());
  fs.rmSync(dir, { recursive: true });
  const targetDir = path.join(root, 'elsewhere');
  fs.mkdirSync(targetDir);
  fs.symlinkSync(targetDir, dir, 'dir');
  assert.throws(() => store.save(defaults(), 1), { code: 'CONFIG_UNSAFE_PATH' });
  assert.deepEqual(fs.readdirSync(targetDir), []);
});

test('directory write obstruction fails without a success result or source write', t => {
  const { dir, store } = fixture(t);
  fs.writeFileSync(dir, 'not a directory');
  assert.throws(() => store.save(defaults(), 1));
  assert.equal(fs.readFileSync(dir, 'utf8'), 'not a directory');
});

test('environment config directory is honored without touching the home directory', t => {
  const { dir } = fixture(t);
  const previous = process.env.AGENT_MEETING_CONFIG_DIR;
  process.env.AGENT_MEETING_CONFIG_DIR = dir;
  try {
    const store = new ConfigStore({ defaults, validate });
    assert.equal(store.dir, dir);
    store.save(store.read(), 1);
    assert.equal(fs.existsSync(path.join(dir, 'config.json')), true);
  } finally {
    if (previous === undefined) delete process.env.AGENT_MEETING_CONFIG_DIR;
    else process.env.AGENT_MEETING_CONFIG_DIR = previous;
  }
});
