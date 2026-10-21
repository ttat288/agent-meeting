'use strict';
// Authenticated assignment leases only. This module never executes a command or
// treats a worker report as independently verified work.
const crypto = require('node:crypto');
const { ConfigStore } = require('./config-store');
const SCHEMA = 'agent-meeting/remote@1';
const LEASE_MS = 60000;
const MAX_ARTIFACT_BYTES = 1024 * 1024;
const clone = value => JSON.parse(JSON.stringify(value));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
function text(value, name, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) fail('Invalid ' + name);
  return value;
}
function strings(value, name, max = 40) {
  if (!Array.isArray(value) || value.length > max) fail('Invalid ' + name);
  return value.map(v => text(v, name, 400));
}
function safePath(value) {
  text(value, 'writePath', 400);
  if (value.startsWith('/') || value.startsWith('-') || /[\\:\0]/.test(value) || value.split('/').some(p => !p || p === '.' || p === '..') || /(^|\/)(\.git|\.env[^/]*|\.ssh|\.claude|\.codex|node_modules)(\/|$)/i.test(value)) fail('Unsafe write path');
  return value;
}
function snapshot(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail('Invalid source snapshotHash');
  return value;
}
function metadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Host metadata required');
  return { workspaceId: text(input.workspaceId, 'workspaceId'), baseRevision: text(input.baseRevision, 'baseRevision'), capabilities: strings(input.capabilities, 'capabilities'), snapshotHash: snapshot(input.snapshotHash), snapshotStatus: input.snapshotHash ? 'declared' : 'unknown' };
}
function validate(state) {
  if (state.schema !== SCHEMA || !Array.isArray(state.hosts) || !Array.isArray(state.runs) || state.hosts.length > 100 || state.runs.length > 1000) fail('Invalid remote state');
  const hostIds = new Set(), runIds = new Set();
  for (const host of state.hosts) {
    text(host.id, 'host id'); text(host.label, 'host label'); metadata(host);
    if (!/^[a-f0-9]{64}$/.test(host.tokenHash) || hostIds.has(host.id) || !Number.isFinite(host.lastSeen)) fail('Invalid host state');
    hostIds.add(host.id);
  }
  for (const run of state.runs) {
    text(run.runId, 'runId'); text(run.taskId, 'taskId'); text(run.workspaceId, 'workspaceId'); text(run.baseRevision, 'baseRevision'); snapshot(run.snapshotHash);
    if (!hostIds.has(run.hostId) || runIds.has(run.runId) || !Number.isSafeInteger(run.generation) || run.generation < 1 || !Number.isSafeInteger(run.requirementRevision) || run.requirementRevision < 1 || !['queued','leased','lost','reported','failed','cancelled'].includes(run.status)) fail('Invalid assignment state');
    if (run.status === 'leased' && (typeof run.leaseId !== 'string' || !Number.isFinite(run.leaseUntil))) fail('Invalid lease');
    runIds.add(run.runId);
  }
}
function summarizeResult(result) {
  return { ...result, artifacts: result.artifacts.map(({ content, ...artifact }) => artifact) };
}
function summarizeRun(run) {
  const { prompt, result, history, configSnapshot, ...summary } = run;
  if (result) summary.result = summarizeResult(result);
  if (history) summary.history = history.map(({ result: prior, ...entry }) => ({ ...entry, ...(prior ? { result: summarizeResult(prior) } : {}) }));
  return summary;
}
class RemoteCoordinator {
  constructor({ dir, now = Date.now } = {}) {
    text(dir, 'remote data directory', 4096);
    this.now = now;
    this.store = new ConfigStore({ dir, defaults: () => ({ schema: SCHEMA, revision: 1, hosts: [], runs: [] }), validate });
  }
  _state() {
    const state = this.store.read();
    let expired = false;
    const now = this.now();
    for (const run of state.runs) if (run.status === 'leased' && (run.leaseUntil <= now || run.deadlineAt && run.deadlineAt <= now)) {
      run.status = 'lost'; run.lostAt = now; expired = true;
    }
    return expired ? this.store.save(state, state.revision) : state;
  }
  _update(fn) {
    const state = this._state();
    const result = fn(state);
    this.store.save(state, state.revision);
    return clone(result);
  }
  _auth(state, hostId, token) {
    const host = state.hosts.find(h => h.id === hostId);
    // Hash every bounded supplied credential before comparing fixed-size digests.
    const supplied = typeof token === 'string' && token.length <= 200 ? digest(token) : digest('');
    const expected = host ? host.tokenHash : '0'.repeat(64);
    if (!crypto.timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex')) || !host) fail('Host authentication failed', 401);
    return host;
  }
  auth(hostId, token) {
    const { tokenHash, ...host } = this._auth(this._state(), hostId, token);
    return clone(host);
  }
  enroll(input) {
    const data = metadata(input), label = text(input.label, 'label');
    const token = crypto.randomBytes(32).toString('base64url');
    const host = this._update(state => {
      if (state.hosts.length >= 100) fail('Host limit reached', 409);
      const record = { id: crypto.randomUUID(), label, ...data, tokenHash: digest(token), lastSeen: this.now() };
      state.hosts.push(record);
      const { tokenHash, ...summary } = record; return summary;
    });
    return { host, token };
  }
  register(hostId, token, input) {
    const data = metadata(input);
    return this._update(state => {
      const host = this._auth(state, hostId, token);
      const active = state.runs.some(r => r.hostId === hostId && r.status === 'leased');
      if (active && (host.workspaceId !== data.workspaceId || host.baseRevision !== data.baseRevision || (host.snapshotHash || null) !== data.snapshotHash)) fail('Cannot change workspace while a lease is active', 409);
      Object.assign(host, data, { lastSeen: this.now() });
      const { tokenHash, ...summary } = host; return summary;
    });
  }
  enqueue(input) {
    if (!input || typeof input !== 'object') fail('Assignment required');
    const record = {};
    for (const name of ['taskId','runId','hostId','workspaceId','baseRevision','modelId','adapter']) record[name] = text(input[name], name);
    record.prompt = text(input.prompt, 'prompt', 32768);
    if (input.configSnapshot) { require('./routing').validate(input.configSnapshot); record.configSnapshot = clone(input.configSnapshot); record.configRevision = input.configSnapshot.revision; record.routingDecision = clone(input.routingDecision || {}); }
    if (!Number.isSafeInteger(input.requirementRevision) || input.requirementRevision < 1) fail('Invalid requirementRevision');
    record.requirementRevision = input.requirementRevision;
    record.writePaths = strings(input.writePaths, 'writePaths').map(safePath);
    return this._update(state => {
      const host = state.hosts.find(h => h.id === record.hostId);
      if (!host) fail('Host not found', 404);
      if (state.runs.length >= 1000) fail('Assignment history limit reached', 409);
      if (state.runs.some(r => r.runId === record.runId || r.taskId === record.taskId && !['failed','cancelled'].includes(r.status))) fail('Task or run already assigned', 409);
      if (host.workspaceId !== record.workspaceId || host.baseRevision !== record.baseRevision) fail('Host workspace/base does not match assignment', 409);
      if (input.snapshotHash !== undefined && snapshot(input.snapshotHash) !== (host.snapshotHash || null)) fail('Host source snapshot does not match assignment', 409);
      const run = { ...record, snapshotHash: host.snapshotHash || null, snapshotStatus: host.snapshotHash ? 'declared' : 'unknown', generation: 1, status: 'queued', leaseId: null, leaseUntil: null, createdAt: this.now() };
      state.runs.push(run); return summarizeRun(run);
    });
  }
  claim(hostId, token) {
    return this._update(state => {
      const host = this._auth(state, hostId, token); host.lastSeen = this.now();
      if (state.runs.some(r => r.hostId === hostId && ['leased','lost'].includes(r.status))) return null;
      const run = state.runs.find(r => r.hostId === hostId && r.status === 'queued');
      if (!run) return null;
      if (run.workspaceId !== host.workspaceId || run.baseRevision !== host.baseRevision || run.snapshotHash && run.snapshotHash !== (host.snapshotHash || null)) fail('Registered workspace/base is stale', 409);
      Object.assign(run, { status: 'leased', leaseId: crypto.randomBytes(24).toString('base64url'), leaseUntil: this.now() + LEASE_MS, claimedAt: this.now(), deadlineAt: this.now() + 180000 });
      const fields = ['taskId','runId','hostId','workspaceId','baseRevision','snapshotHash','snapshotStatus','modelId','adapter','prompt','writePaths','requirementRevision','generation','status','leaseId','leaseUntil','claimedAt','deadlineAt','configRevision'];
      return Object.fromEntries(fields.filter(key => run[key] !== undefined).map(key => [key, run[key]]));
    });
  }
  _lease(state, hostId, token, input) {
    const host = this._auth(state, hostId, token);
    const run = state.runs.find(r => r.runId === input.runId);
    if (!run || run.hostId !== host.id) fail('Assignment not found for host', 404);
    if (run.status !== 'leased' || run.generation !== input.generation || run.leaseId !== input.leaseId || (run.leaseUntil <= this.now() || run.deadlineAt && run.deadlineAt <= this.now())) fail('Lease expired, superseded or already completed', 409);
    return { host, run };
  }
  heartbeat(hostId, token, input) {
    if (!input || typeof input !== 'object') fail('Lease required');
    return this._update(state => {
      const { host, run } = this._lease(state, hostId, token, input);
      host.lastSeen = this.now(); run.leaseUntil = this.now() + LEASE_MS;
      return { runId: run.runId, generation: run.generation, leaseId: run.leaseId, leaseUntil: run.leaseUntil };
    });
  }
  complete(hostId, token, input) {
    if (!input || typeof input !== 'object') fail('Result required');
    return this._update(state => {
      const { host, run } = this._lease(state, hostId, token, input);
      if (input.baseRevision !== run.baseRevision || input.requirementRevision !== run.requirementRevision) fail('Result base/requirement revision does not match assignment', 409);
      const reportedSnapshotHash = snapshot(input.snapshotHash);
      if (run.snapshotHash && reportedSnapshotHash !== run.snapshotHash) fail('Result source snapshot does not match assignment', 409);
      if (!['reported','failed','cancelled'].includes(input.status)) fail('Worker result must be reported, failed or cancelled');
      text(input.report, 'report', 65536); text(input.reportedModel, 'reportedModel');
      if (!Array.isArray(input.artifacts) || input.artifacts.length > 32) fail('Invalid artifacts');
      const names = new Set(); let total = 0;
      const artifacts = input.artifacts.map(artifact => {
        if (!artifact || typeof artifact !== 'object' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(artifact.name) || artifact.name.includes('..') || names.has(artifact.name)) fail('Invalid artifact name');
        names.add(artifact.name);
        if (typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) fail('Artifact sha256 required');
        const result = { name: artifact.name, sha256: artifact.sha256, taskId: run.taskId, runId: run.runId, baseRevision: run.baseRevision, requirementRevision: run.requirementRevision, generation: run.generation, snapshotHash: run.snapshotHash || null, reportedSnapshotHash, snapshotStatus: run.snapshotHash ? 'declared' : 'unknown' };
        if (artifact.content !== undefined) {
          if (typeof artifact.content !== 'string' || artifact.content.length > Math.ceil(MAX_ARTIFACT_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(artifact.content)) fail('Artifact content must be bounded base64');
          const bytes = Buffer.from(artifact.content, 'base64'); total += bytes.length;
          if (total > MAX_ARTIFACT_BYTES || digest(bytes) !== artifact.sha256) fail('Artifact size or hash mismatch');
          result.content = artifact.content; result.size = bytes.length;
        } else result.size = null;
        return result;
      });
      const telemetry = {};
      for (const key of ['costUsd','elapsedMs']) { const value = input[key]; if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) fail('Invalid telemetry'); telemetry[key] = value ?? null; }
      if (input.usage != null && (typeof input.usage !== 'object' || Array.isArray(input.usage) || Buffer.byteLength(JSON.stringify(input.usage)) > 16384)) fail('Invalid usage telemetry');
      telemetry.usage = input.usage || null;
      host.lastSeen = this.now(); run.status = input.status; run.finishedAt = this.now();
      run.result = { ...telemetry, snapshotHash: run.snapshotHash || null, reportedSnapshotHash, snapshotStatus: run.snapshotHash ? 'declared' : 'unknown', status: input.status, reportedModel: input.reportedModel, report: input.report, artifacts, verified: false };
      return summarizeRun(run);
    });
  }
  reassign(runId, { hostId } = {}) {
    return this._update(state => {
      const run = state.runs.find(r => r.runId === runId);
      if (!run) fail('Assignment not found', 404);
      if (!['lost','failed','cancelled'].includes(run.status)) fail('Only lost or unsuccessful assignments can be explicitly reassigned', 409);
      const host = state.hosts.find(h => h.id === (hostId || run.hostId));
      if (!host || host.workspaceId !== run.workspaceId || host.baseRevision !== run.baseRevision || run.snapshotHash && (host.snapshotHash || null) !== run.snapshotHash) fail('Reassignment host workspace/base mismatch', 409);
      run.history ||= []; run.history.push({ generation: run.generation, hostId: run.hostId, status: run.status, finishedAt: run.finishedAt || run.lostAt || this.now(), ...(run.result ? { result: clone(run.result) } : {}) });
      Object.assign(run, { hostId: host.id, generation: run.generation + 1, status: 'queued', leaseId: null, leaseUntil: null });
      delete run.deadlineAt; delete run.result; delete run.finishedAt; delete run.claimedAt; delete run.lostAt;
      return summarizeRun(run);
    });
  }
  read() {
    const state = this._state();
    return { schema: state.schema, revision: state.revision, hosts: state.hosts.map(({ tokenHash, ...host }) => clone(host)), runs: state.runs.map(summarizeRun) };
  }
  getResult(runId, generation) {
    const run = this._state().runs.find(r => r.runId === runId);
    if (!run) fail('Assignment not found', 404);
    const result = generation === undefined || generation === run.generation ? run.result : run.history?.find(entry => entry.generation === generation)?.result;
    return result ? clone(result) : null;
  }
}
module.exports = { RemoteCoordinator, LEASE_MS, MAX_ARTIFACT_BYTES };
