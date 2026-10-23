'use strict';
// Built-in adapters only. Configuration never supplies a shell command or executable.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ADAPTERS = Object.freeze(['claude', 'agy']);
const MAX_PROMPT_BYTES = 128 * 1024;
function executable(adapter) {
  if (adapter === 'claude') return require('./connect').findCli('claude');
  if (adapter !== 'agy') return null;
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['agy'], { encoding: 'utf8', timeout: 3000 });
  return r.status === 0 ? r.stdout.trim().split(/\r?\n/)[0] : null;
}
function checkRuntime(adapter) {
  if (!ADAPTERS.includes(adapter)) throw new Error('Unsupported adapter');
  const bin = executable(adapter), checkedAt = new Date().toISOString();
  if (!bin) return { adapter, executable: false, version: null, access: 'unknown', checkedAt, resume: false };
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000, maxBuffer: 8192 });
  return { adapter, executable: r.status === 0, version: r.status === 0 ? r.stdout.trim().slice(0, 200) : null,
    access: 'unknown', checkedAt, resume: false, cancel: true, processTools: adapter === 'claude' };
}
function buildArgs(adapter, { modelId, prompt, write = false, readOnlyTools = false }) {
  if (!ADAPTERS.includes(adapter)) throw new Error('Unsupported adapter');
  if (typeof modelId !== 'string' || !/^[a-zA-Z0-9][\w.:-]{0,120}$/.test(modelId)) throw new Error('Explicit model ID required');
  if (typeof prompt !== 'string' || !prompt.trim() || Buffer.byteLength(prompt) > MAX_PROMPT_BYTES) throw new Error('Invalid prompt');
  if (adapter === 'claude') return ['--print', '--model', modelId, '--output-format', 'json', '--no-session-persistence',
    '--permission-mode', write ? 'auto' : 'plan', '--permission-prompts', 'none', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--tools', write ? 'Read,Edit,Write,Glob,Grep' : readOnlyTools ? 'Read,Glob,Grep' : ''];
  if (write) throw new Error('agy write mode is not verified; use read-only plan tasks');
  return ['--print', prompt, '--model', modelId, '--output-format', 'json', '--mode', 'plan', '--sandbox', '--disable-slash-commands'];
}
function parseOutput(adapter, stdout) {
  let obj;
  try { obj = JSON.parse(stdout); } catch { return { valid: false, reportedModel: 'unknown', text: '', usage: null, error: 'Invalid runtime JSON' }; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { valid: false, reportedModel: 'unknown', text: '', usage: null, error: 'Runtime result must be an object' };
  const text = String(obj.result ?? obj.response ?? obj.text ?? '');
  // An explicit nonempty error field overrides any success marker.
  const hasError = obj.error != null && obj.error !== false && String(obj.error).trim().length > 0;
  const success = !hasError && (adapter === 'agy' ? obj.status === 'SUCCESS' && text.trim().length > 0 : obj.type === 'result' && obj.subtype === 'success' && !obj.is_error && text.trim().length > 0);
  const models = obj.modelUsage && typeof obj.modelUsage === 'object' ? Object.keys(obj.modelUsage) : [];
  const permissionDenials = (Array.isArray(obj.permission_denials) ? obj.permission_denials.length : 0)
    + (adapter === 'agy' && Array.isArray(obj.denied_actions) ? obj.denied_actions.length : 0);
  // agy response contracts vary. Only machine fields count; prose self-identification is not evidence.
  const reportedModel = models.length === 1 ? models[0] : models.length > 1 ? 'unknown' : typeof obj.model === 'string' ? obj.model : 'unknown';
  return { valid: success, reportedModel,
    text: String(obj.result ?? obj.response ?? obj.text ?? '').slice(0, 65536).replace(/[\uD800-\uDBFF]$/, ''), usage: obj.usage || null,
    costUsd: Number.isFinite(obj.total_cost_usd) && obj.total_cost_usd >= 0 ? obj.total_cost_usd : null,
    permissionDenials,
    error: !success ? String(obj.error || obj.result || obj.subtype || obj.status || 'Missing positive success result').slice(0, 1000) : permissionDenials ? 'Runtime reported permission denials' : null };
}
function runCli(options) {
  const { adapter, workspace, timeoutMs = 120000, signal } = options;
  const args = buildArgs(adapter, options); let bin = executable(adapter);
  if (!bin) return Promise.resolve({ status: 'unavailable', reportedModel: 'unknown', error: 'Executable not found', exitCode: null });
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 600000) throw new Error('Invalid timeout');
  if (!workspace || !fs.statSync(workspace).isDirectory()) throw new Error('Workspace required');
  const cwd = fs.realpathSync(workspace), started = Date.now();
  const wrapped = options.write || options.isolate ? require('./execution-sandbox').wrapExecution(bin, args, { workspace: cwd, write: options.write === true }) : null;
  if (wrapped) bin = wrapped.bin;
  return new Promise(resolve => {
    let stdout = '', stderr = '', stdoutBytes = 0, reason = null, finished = false, closed;
    const child = spawn(bin, wrapped ? wrapped.args : args, { cwd, shell: false, detached: options.detached !== false && process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdin.on('error', () => {});
    child.stdin.end(adapter === 'claude' ? options.prompt : '');
    const stop = why => {
      if (finished || reason) return;
      reason = why;
      try { process.platform === 'win32' || options.detached === false ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM'); } catch {}
      killTimer = setTimeout(() => {
        try { process.platform === 'win32' || options.detached === false ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {}
        killTimer = null;
        if (closed) done(closed.code, closed.error);
      }, 2000);
    };
    let killTimer;
    const timer = setTimeout(() => stop('timeout'), timeoutMs);
    const abort = () => stop('cancelled');
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) stop('cancelled');
    // StringDecoder retains partial UTF-8 sequences between pipe chunks.
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', text => { const bytes = Buffer.byteLength(text); if (stdoutBytes + bytes > 1024 * 1024) return stop('output-limit'); stdoutBytes += bytes; stdout += text; });
    child.stderr.on('data', text => { stderr = (stderr + text).slice(-8192).replace(/^[\uDC00-\uDFFF]/, ''); });
    const done = (code, err) => {
      if (finished) return;
      // A silent grandchild can outlive the parent and its stdio. Keep the
      // promise and escalation timer alive until the group has been signalled.
      if (reason && killTimer) { closed ||= { code, error: err }; return; }
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      wrapped?.cleanup();
      const parsed = parseOutput(adapter, stdout);
      resolve({ adapter, requestedModel: options.modelId, ...parsed, exitCode: code,
        status: reason || (err ? 'failed' : code === 0 && parsed.valid && !parsed.permissionDenials ? 'reported' : 'failed'),
        elapsedMs: Date.now() - started, stdout, stderr, error: err?.message || parsed.error, workspace: cwd });
    };
    child.on('error', e => done(null, e)); child.on('close', code => done(code));
  });
}
module.exports = { ADAPTERS, MAX_PROMPT_BYTES, executable, checkRuntime, buildArgs, parseOutput, runCli };
