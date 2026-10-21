'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const runtime = require('./runtime');
const COPY_BYTES = 64 * 1024 * 1024;
const ARTIFACT_BYTES = 1024 * 1024;
const RESPONSE_BYTES = 256 * 1024;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const text = (value, name, max = 400) => { if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) fail('Invalid ' + name); return value; };
const protectedPath = name => /(^|\/)(\.git|\.env[^/]*|\.ssh|\.claude|\.codex|node_modules)(\/|$)/i.test(name);
function relative(name) { return typeof name === 'string' && name.length > 0 && name.length <= 400 && !name.startsWith('-') && !/[\\:\0]/.test(name) && !name.startsWith('/') && !name.split('/').some(p => !p || p === '.' || p === '..') && !protectedPath(name); }
function safeFile(root, name) {
  if (!relative(name)) fail('Unsafe workspace path');
  let target = root;
  for (const part of name.split('/')) {
    target = path.join(target, part);
    try { if (fs.lstatSync(target).isSymbolicLink()) fail('Workspace symlinks are not supported'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return target;
}
function revision(workspace) {
  return execFileSync('git', ['-C', workspace, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 }).trim();
}
function inventory(root, source = false) {
  const files = {}; let total = 0;
  const add = name => {
    // Local CLI settings, credentials and ignored files never enter a copy.
    if (source && protectedPath(name)) return;
    if (!relative(name)) fail('Unsafe output path');
    const full = safeFile(root, name);
    if (!fs.existsSync(full)) return;
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink() || !stat.isFile()) fail('Unsupported workspace entry');
    total += stat.size;
    if (Object.keys(files).length >= 10000 || stat.size > 8 * 1024 * 1024 || total > COPY_BYTES) fail('Workspace exceeds copy limits');
    const bytes = fs.readFileSync(full);
    files[name] = { sha256: hash(bytes), size: bytes.length };
  };
  if (source) {
    const names = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', timeout: 5000, maxBuffer: 2 * 1024 * 1024 }).split('\0').filter(Boolean);
    for (const name of new Set(names)) add(name);
  } else {
    const walk = (dir, prefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const name = prefix + entry.name;
        if (!relative(name)) fail('Unsafe output path');
        if (entry.isSymbolicLink()) fail('Output contains a symlink');
        if (entry.isDirectory()) walk(path.join(dir, entry.name), name + '/');
        else add(name);
      }
    }; walk(root);
  }
  return files;
}
function futureRealPath(target) {
  let current = path.resolve(target); const suffix = [];
  while (!fs.existsSync(current)) { suffix.unshift(path.basename(current)); const parent = path.dirname(current); if (parent === current) fail('Invalid worker directory'); current = parent; }
  return path.join(fs.realpathSync(current), ...suffix);
}
function snapshotHash(files) {
  return hash(JSON.stringify(Object.keys(files).sort().map(name => [name, files[name].sha256, files[name].size])));
}
function validateConfig(config) {
  if (!config || typeof config !== 'object') fail('Worker config required');
  const url = new URL(text(config.serverUrl, 'serverUrl', 2048));
  const loop = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || url.protocol === 'http:' && loop) || url.username || url.password || url.search || url.hash || url.pathname !== '/') fail('Worker server must be an explicit HTTPS origin (loopback HTTP allowed)');
  text(config.hostId, 'hostId'); text(config.token, 'token', 200); text(config.workspaceId, 'workspaceId'); text(config.workDir, 'workDir', 4096);
  if (!Array.isArray(config.allowedModels) || !config.allowedModels.length || config.allowedModels.length > 40 || !Array.isArray(config.adapters) || !config.adapters.length || config.adapters.length > 10) fail('Explicit model and adapter allowlists required');
  config.allowedModels.forEach(x => text(x, 'allowed model'));
  if (config.adapters.some(x => !runtime.ADAPTERS.includes(x))) fail('Unsupported adapter allowlist');
  text(config.workspace, 'workspace', 4096);
  if (fs.lstatSync(config.workspace).isSymbolicLink() || !fs.statSync(config.workspace).isDirectory()) fail('Workspace must be a real directory');
  if (fs.existsSync(config.workDir) && fs.lstatSync(config.workDir).isSymbolicLink()) fail('Worker data directory must not be a symlink');
  const workspace = fs.realpathSync(config.workspace), workDir = futureRealPath(config.workDir);
  if (workDir === workspace || workDir.startsWith(workspace + path.sep)) fail('Worker receipt directory must be outside the source checkout');
  return { ...config, serverUrl: url.origin, workspace, workDir };
}
function privateDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(dir).isSymbolicLink() || !fs.statSync(dir).isDirectory()) fail('Worker data directory must be real');
  fs.chmodSync(dir, 0o700);
}
function writeReceipt(file, data, create = false) {
  const bytes = JSON.stringify(data, null, 2) + '\n';
  if (create) { const fd = fs.openSync(file, 'wx', 0o600); try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } return; }
  const temp = file + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  try { const fd = fs.openSync(temp, 'wx', 0o600); try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } fs.renameSync(temp, file); }
  finally { try { fs.unlinkSync(temp); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
}
async function responseJson(response) {
  const length = Number(response.headers.get('content-length'));
  if (length > RESPONSE_BYTES) fail('Worker response exceeds limit');
  let size = 0, chunks = [];
  const reader = response.body?.getReader();
  if (!reader) fail('Missing worker response body');
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > RESPONSE_BYTES) { await reader.cancel(); fail('Worker response exceeds limit'); } chunks.push(Buffer.from(value)); }
  } finally { reader.releaseLock(); }
  let result; try { result = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail('Invalid worker JSON response'); }
  if (!response.ok) fail('Worker endpoint rejected request (' + response.status + ')');
  return result;
}
function assignment(lease, cfg, baseRevision, sourceSnapshotHash) {
  if (!lease || typeof lease !== 'object') fail('Invalid assignment');
  for (const name of ['taskId', 'runId', 'leaseId']) text(lease[name], name);
  text(lease.prompt, 'assignment prompt', 32768);
  if (!Number.isSafeInteger(lease.generation) || lease.generation < 1 || !Number.isSafeInteger(lease.requirementRevision) || lease.requirementRevision < 1 || !Number.isFinite(lease.leaseUntil) || lease.leaseUntil <= Date.now()) fail('Invalid or expired lease');
  if (lease.hostId !== cfg.hostId || lease.workspaceId !== cfg.workspaceId || lease.baseRevision !== baseRevision) fail('Assignment host/workspace/base mismatch');
  if (lease.snapshotHash !== undefined && lease.snapshotHash !== null && (typeof lease.snapshotHash !== 'string' || !/^[a-f0-9]{64}$/.test(lease.snapshotHash) || lease.snapshotHash !== sourceSnapshotHash)) fail('Assignment source snapshot mismatch');
  if (!cfg.allowedModels.includes(lease.modelId) || !cfg.adapters.includes(lease.adapter)) fail('Assignment model/adapter is not operator-approved');
  if (!Array.isArray(lease.writePaths) || lease.writePaths.length > 40 || lease.writePaths.some(p => !relative(p))) fail('Invalid assignment write scope');
}
async function runWorkerOnce(input, dependencies = {}) {
  const cfg = validateConfig(input), fetcher = dependencies.fetch || globalThis.fetch, runner = dependencies.runner || runtime.runCli;
  const heartbeatMs = dependencies.heartbeatMs || 15000;
  if (heartbeatMs < 10 || heartbeatMs > 15000) fail('Invalid heartbeat interval');
  const request = async (action, body) => {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try { return await responseJson(await fetcher(cfg.serverUrl + '/api/worker/' + encodeURIComponent(cfg.hostId) + '/' + action, { method: 'POST', redirect: 'error', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.token }, body: JSON.stringify(body), signal: controller.signal })); }
    finally { clearTimeout(timer); }
  };
  const baseRevision = revision(cfg.workspace), registeredFiles = inventory(cfg.workspace, true), sourceSnapshotHash = snapshotHash(registeredFiles);
  if (revision(cfg.workspace) !== baseRevision) fail('Source revision changed during registration');
  await request('register', { workspaceId: cfg.workspaceId, baseRevision, snapshotHash: sourceSnapshotHash, capabilities: cfg.adapters });
  const claimed = await request('claim', {});
  const lease = claimed?.assignment === undefined ? claimed : claimed.assignment;
  if (!lease) return { status: 'idle' };
  assignment(lease, cfg, baseRevision, sourceSnapshotHash);
  privateDir(cfg.workDir);
  const receiptFile = path.join(cfg.workDir, hash(lease.runId + ':' + lease.generation) + '.json');
  const receipt = { schema: 'agent-meeting/worker-receipt@1', runId: lease.runId, taskId: lease.taskId, generation: lease.generation, baseRevision, snapshotHash: sourceSnapshotHash, requirementRevision: lease.requirementRevision, status: 'claimed', createdAt: new Date().toISOString() };
  try { writeReceipt(receiptFile, receipt, true); } catch (e) { if (e.code === 'EEXIST') fail('Assignment generation already has a receipt; reconciliation required'); throw e; }
  const runDir = fs.mkdtempSync(path.join(cfg.workDir, 'run-')), controller = new AbortController();
  const provenance = { runId: lease.runId, leaseId: lease.leaseId, generation: lease.generation, baseRevision, snapshotHash: sourceSnapshotHash, requirementRevision: lease.requirementRevision };
  let heartbeatError, heartbeatBusy = false, inFlight;
  const beat = () => {
    if (heartbeatBusy || heartbeatError) return;
    heartbeatBusy = true;
    inFlight = request('heartbeat', provenance).catch(e => { heartbeatError = e; controller.abort(); }).finally(() => { heartbeatBusy = false; });
  };
  const timer = setInterval(beat, heartbeatMs);
  try {
    const before = inventory(cfg.workspace, true);
    if (snapshotHash(before) !== sourceSnapshotHash) fail('Source snapshot changed since registration');
    for (const [name, snapshot] of Object.entries(before)) {
      const bytes = fs.readFileSync(safeFile(cfg.workspace, name));
      if (hash(bytes) !== snapshot.sha256) fail('Source changed during workspace copy');
      const target = safeFile(runDir, name); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.writeFileSync(target, bytes, { mode: 0o600, flag: 'wx' });
    }
    if (revision(cfg.workspace) !== baseRevision || JSON.stringify(inventory(cfg.workspace, true)) !== JSON.stringify(before)) fail('Source changed during workspace copy');
    await request('heartbeat', provenance);
    receipt.status = 'running'; writeReceipt(receiptFile, receipt);
    if (heartbeatError) throw heartbeatError;
    const result = await runner({ adapter: lease.adapter, modelId: lease.modelId, prompt: lease.prompt, workspace: runDir, write: lease.writePaths.length > 0, timeoutMs: 120000, signal: controller.signal });
    if (heartbeatError || controller.signal.aborted) fail('Heartbeat lost; execution stopped without reporting completion');
    const after = inventory(runDir);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(name => before[name]?.sha256 !== after[name]?.sha256);
    if (changed.some(name => !lease.writePaths.some(scope => name === scope || name.startsWith(scope + '/')))) fail('Worker modified files outside assignment scope');
    const changes = changed.map(name => ({ path: name, before: before[name]?.sha256 || null, after: after[name]?.sha256 || null, content: after[name] ? fs.readFileSync(safeFile(runDir, name)).toString('base64') : null }));
    const manifest = Buffer.from(JSON.stringify({ schema: 'agent-meeting/worker-changes@1', taskId: lease.taskId, ...provenance, changes }));
    if (manifest.length > ARTIFACT_BYTES) fail('Change manifest exceeds 1 MiB artifact limit');
    clearInterval(timer); await inFlight;
    if (heartbeatError) fail('Heartbeat lost; completion withheld');
    const report = { ...provenance, usage: result.usage || null, costUsd: result.costUsd ?? null, elapsedMs: result.elapsedMs ?? null, status: result.status === 'reported' ? 'reported' : result.status === 'cancelled' ? 'cancelled' : 'failed', reportedModel: typeof result.reportedModel === 'string' && result.reportedModel ? result.reportedModel.slice(0, 200) : 'unknown', report: String(result.text || result.error || 'No runtime report').slice(0, 65536), artifacts: [{ name: 'changes.json', sha256: hash(manifest), content: manifest.toString('base64') }] };
    await request('complete', report);
    receipt.status = report.status; receipt.finishedAt = new Date().toISOString(); receipt.artifactSha256 = hash(manifest); writeReceipt(receiptFile, receipt);
    return { status: report.status, runId: lease.runId, generation: lease.generation, receiptFile, changes: changes.map(({ content, ...change }) => change) };
  } catch (error) {
    controller.abort(); receipt.status = heartbeatError ? 'lost' : 'needs-reconciliation'; receipt.finishedAt = new Date().toISOString(); writeReceipt(receiptFile, receipt);
    // Never auto-claim or retry an uncertain generation, and never transmit raw
    // runtime errors, environment contents or credentials through a diagnostic.
    throw new Error(heartbeatError ? 'Worker heartbeat failed; reconciliation required' : error.message);
  } finally { clearInterval(timer); await inFlight; }
}
module.exports = { runWorkerOnce, validateConfig, snapshotHash };
