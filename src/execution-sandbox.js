'use strict';
// Linux filesystem WRITE isolation. Host files remain readable and network access
// remains available for provider APIs. Credentials/settings are always read-only.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const BWRAP = '/usr/bin/bwrap';
const WRITABLE_STATE = Object.freeze(['debug', 'projects', 'todos', 'session-env', 'shell-snapshots', 'statsig', 'cache', 'backups']);
function unsafe(message) { const e = new Error(`Execution sandbox: ${message}`); e.code = 'EXECUTION_SANDBOX_UNAVAILABLE'; return e; }
function checkSandbox() {
  if (process.platform !== 'linux') throw unsafe('Linux bubblewrap is required; refusing unsandboxed execution');
  try { fs.accessSync(BWRAP, fs.constants.X_OK); } catch { throw unsafe('bubblewrap is missing; refusing unsandboxed execution'); }
  const result = spawnSync(BWRAP, ['--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc', '--unshare-pid', '--die-with-parent', '--', '/bin/true'], { encoding: 'utf8', timeout: 5000, maxBuffer: 8192 });
  if (result.status !== 0 || result.error) throw unsafe('bubblewrap namespaces are unavailable; refusing unsandboxed execution');
  return { available: true, boundary: 'filesystem-write', readIsolation: false, networkIsolation: false };
}
function within(child, parent) { return parent === path.parse(parent).root || child === parent || child.startsWith(parent + path.sep); }
function placeholder(target, source) {
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  if (fs.statSync(source).isDirectory()) fs.mkdirSync(target, { mode: 0o700 });
  else fs.closeSync(fs.openSync(target, 'wx', 0o600));
}
function wrapExecution(bin, args, { workspace, write = false } = {}) {
  checkSandbox();
  if (typeof bin !== 'string' || !path.isAbsolute(bin) || !Array.isArray(args) || args.some(a => typeof a !== 'string' || a.includes('\0'))) throw unsafe('structured executable and string arguments required');
  const executable = fs.realpathSync(bin);
  if (!fs.statSync(executable).isFile()) throw unsafe('executable must be a regular file');
  if (typeof workspace !== 'string' || !path.isAbsolute(workspace) || typeof write !== 'boolean') throw unsafe('absolute workspace and boolean write required');
  const real = fs.realpathSync(workspace), home = fs.realpathSync(os.homedir());
  if (!fs.statSync(real).isDirectory() || within(home, real)) throw unsafe('workspace must be a dedicated directory, not the home or filesystem root');
  const claude = path.join(home, '.claude');
  if (within(real, claude) || within(claude, real)) throw unsafe('workspace overlaps runtime settings');
  // Resolve the parent directory before creating scratch so host symlinks cannot
  // redirect scratch or workspace mount sources after the namespace starts.
  const scratch = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agent-meeting-sandbox-state-'));
  fs.chmodSync(scratch, 0o700);
  let cleaned = false;
  const cleanup = () => { if (!cleaned) { fs.rmSync(scratch, { recursive: true, force: true }); cleaned = true; } };
  try {
    const tmp = path.join(scratch, 'tmp'); fs.mkdirSync(tmp, { mode: 0o700 });
    // Callers spawn detached with piped stdio. Keep descendants in that
    // managed process group: --new-session would escape cancellation signals.
    const wrap = ['--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc', '--unshare-pid', '--die-with-parent', '--cap-drop', 'ALL', '--bind', tmp, '/tmp', '--setenv', 'TMPDIR', '/tmp'];
    // /tmp is hidden. Recreate workspace mount parents in the isolated /tmp
    // before mounting the original host workspace at its exact canonical path.
    if (within(real, '/tmp')) {
      let current = '/tmp';
      for (const part of path.relative('/tmp', real).split(path.sep)) { current = path.join(current, part); wrap.push('--dir', current); }
    }
    wrap.push(write ? '--bind' : '--ro-bind', real, real);
    if (fs.existsSync(claude)) {
      if (fs.lstatSync(claude).isSymbolicLink() || !fs.statSync(claude).isDirectory()) throw unsafe('Claude state directory must be a real directory');
      const state = path.join(scratch, 'claude'); fs.mkdirSync(state, { mode: 0o700 });
      const preserved = [];
      for (const name of fs.readdirSync(claude)) {
        if (WRITABLE_STATE.includes(name)) continue;
        const source = path.join(claude, name), target = path.join(state, name);
        // Existing auth, settings, plugins and skills remain read-only mounts.
        // Broken symlinks are not needed and cannot be mounted safely.
        if (!fs.existsSync(source)) continue;
        placeholder(target, source); preserved.push([source, path.join(claude, name)]);
      }
      for (const name of WRITABLE_STATE) fs.mkdirSync(path.join(state, name), { mode: 0o700 });
      if (within(claude, '/tmp')) {
        let current = '/tmp';
        for (const part of path.relative('/tmp', claude).split(path.sep)) { current = path.join(current, part); wrap.push('--dir', current); }
      }
      wrap.push('--bind', state, claude);
      for (const [source, target] of preserved) wrap.push('--ro-bind', source, target);
    }
    wrap.push('--chdir', real, '--', executable, ...args);
    return { bin: BWRAP, args: wrap, cleanup, boundary: 'filesystem-write', readIsolation: false, networkIsolation: false };
  } catch (error) { cleanup(); throw error; }
}
module.exports = { wrapExecution, checkSandbox, WRITABLE_STATE };
