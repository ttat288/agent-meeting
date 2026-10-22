'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const childProcess = require('node:child_process');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Real POSIX process groups, substituted executable only. No model or settings.
for (const mode of ['cancelled', 'timeout']) test(`runtime ${mode} drains group escalation when its parent exits before a silent grandchild`, { skip: process.platform === 'win32' }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-runtime-drain-'));
  const marker = path.join(root, 'heartbeat'); let parent;
  t.after(() => { try { process.kill(-parent.pid, 'SIGKILL'); } catch {} fs.rmSync(root, { recursive: true, force: true }); });
  const grandchild = `const fs=require('node:fs');process.on('SIGTERM',()=>{});fs.writeFileSync(${JSON.stringify(marker)},'ready');setInterval(()=>fs.writeFileSync(${JSON.stringify(marker)},String(Date.now())),20);`;
  const script = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});process.stdin.resume();setInterval(()=>{},1000);`;
  const mod = { exports: {} };
  new Function('require', 'module', fs.readFileSync(path.join(__dirname, '../src/runtime.js'), 'utf8'))(name => {
    if (name === './connect') return { findCli: () => process.execPath };
    if (name === 'child_process') return { ...childProcess, spawn: (_bin, _args, options) => (parent = childProcess.spawn(process.execPath, ['-e', script], options)) };
    return require(name);
  }, mod);
  const controller = new AbortController();
  const pending = mod.exports.runCli({ adapter: 'claude', modelId: 'fixture-model', prompt: 'No AI', workspace: root, timeoutMs: mode === 'timeout' ? 5000 : 10000, signal: controller.signal });
  for (let i = 0; i < 300 && !fs.existsSync(marker); i++) await sleep(10);
  assert(fs.existsSync(marker), 'Grandchild must install its TERM handler before cancellation');
  if (mode === 'cancelled') controller.abort();
  const result = await pending;
  assert.equal(result.status, mode);
  const heartbeat = fs.readFileSync(marker, 'utf8'); await sleep(180);
  assert.equal(fs.readFileSync(marker, 'utf8'), heartbeat, 'Resolving runtime must not release ownership while a TERM-resistant grandchild is still writing');
});
