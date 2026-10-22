'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');
const { ConfigStore } = require('./config-store');
const routing = require('./routing');
const runtime = require('./runtime');
const { observationStore, savedEnvironment } = require('./routing-tools');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const copy = x => JSON.parse(JSON.stringify(x));
const failure = (message, status = 400) => Object.assign(new Error(message), { status });
const relative = p => typeof p === 'string' && p.length > 0 && !p.startsWith('-') && !path.isAbsolute(p) && !p.includes('\\') && !p.split('/').some(x => !x || x === '.' || x === '..') && !/(^|\/)(\.git|\.env[^/]*|\.ssh|\.claude|\.codex|node_modules)(\/|$)/i.test(p);
function safeFile(root, name) {
  if (!relative(name)) throw failure('Unsafe workspace path');
  let target = root;
  for (const bit of name.split('/')) {
    target = path.join(target, bit);
    try { if (fs.lstatSync(target).isSymbolicLink()) throw failure('Symlinks are not supported in execution workspaces'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return target;
}
function inventory(root) {
  const files = Object.create(null); let totalBytes = 0;
  function walk(dir, prefix = '') {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + item.name;
      if (!relative(name)) throw failure('Workspace output contains a protected or unsafe path: ' + name);
      if (item.isSymbolicLink()) throw failure('Workspace contains a symlink: ' + name);
      if (item.isDirectory()) walk(path.join(dir, item.name), name + '/');
      else if (item.isFile()) {
        if (Object.keys(files).length >= 10000) throw failure('Workspace exceeds 10000 files');
        const stat = fs.statSync(path.join(dir, item.name)); totalBytes += stat.size;
        if (stat.size > 8 * 1024 * 1024 || totalBytes > 64 * 1024 * 1024) throw failure('Workspace exceeds file/total byte limit');
        const b = fs.readFileSync(path.join(dir, item.name));
        if (b.length > 8 * 1024 * 1024) throw failure('Workspace file exceeds 8 MiB: ' + name);
        files[name] = { sha256: hash(b), size: b.length };
      }
    }
  }
  walk(root); return files;
}
function sourceInventory(root) {
  const names = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', timeout: 5000, maxBuffer: 2 * 1024 * 1024 }).split('\0').filter(Boolean);
  const files = Object.create(null); let total = 0;
  for (const name of names) {
    if (!relative(name)) continue;
    const full = safeFile(root, name); if (!fs.existsSync(full)) continue;
    const stat = fs.statSync(full); if (!stat.isFile()) continue;
    total += stat.size;
    if (Object.keys(files).length >= 10000 || stat.size > 8 * 1024 * 1024 || total > 64 * 1024 * 1024) throw failure('Workspace exceeds execution copy limits');
    files[name] = { sha256: hash(fs.readFileSync(full)), size: stat.size };
  }
  return files;
}
function gitRevision(root) {
  try { return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 5000 }).trim(); }
  catch { throw failure('Workspace must be a Git checkout with a base revision'); }
}
function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => before[f]?.sha256 !== after[f]?.sha256).map(file => ({ file, before: before[file]?.sha256 || null, after: after[file]?.sha256 || null }));
}
function checkTask(d) {
  if (!d || typeof d.goal !== 'string' || !d.goal.trim() || d.goal.length > 8000) throw failure('Task needs a goal of 1–8000 characters');
  for (const [k, fallback, values] of [['purpose','plan',['discuss','plan','execute']],['topology','local',['local','remote','mixed']],['management','managed',['invited','managed','mixed']]]) {
    d[k] ||= fallback; if (!values.includes(d[k])) throw failure('Invalid ' + k);
  }
  for (const k of ['acceptance', 'dependencies', 'writePaths', 'sources', 'facts', 'unknowns', 'testFiles']) {
    d[k] ||= []; if (!Array.isArray(d[k]) || d[k].length > 40 || d[k].some(s => typeof s !== 'string' || s.length > 4000)) throw failure('Invalid ' + k);
  }
  if (!d.acceptance.length || d.acceptance.some(x => !x.trim())) throw failure('Acceptance criteria required');
  if (d.writePaths.some(p => !relative(p)) || d.testFiles.some(p => !relative(p) || !/\.test\.js$/.test(p))) throw failure('Invalid write/test paths');
  if (d.testFiles.some(t => d.writePaths.some(w => t === w || t.startsWith(w + '/')))) throw failure('Verification tests must be outside agent write scope');
  if (d.risk !== undefined && !['low','medium','high'].includes(d.risk)) throw failure('Invalid risk');
  routing.validateTask(d);
  return d;
}
const ADAPTER_FOR = { 'claude-code': 'claude', agy: 'agy' };
class WorkManager {
  constructor({ dir, configStore, runner = runtime.runCli }) {
    this.dir = path.resolve(dir); this.configStore = configStore; this.runner = runner; this.active = new Map(); this.pending = new Set(); this.probes = new Map();
    this.store = new ConfigStore({ dir: this.dir, defaults: () => ({ schema: 'agent-meeting/work@1', revision: 1, tasks: [], runs: [], observations: [] }),
      validate: d => { if (d.schema !== 'agent-meeting/work@1' || !['tasks','runs','observations'].every(k => Array.isArray(d[k]))) throw failure('Invalid work data'); } });
    // A restarted server cannot prove that the old external process stopped. Never automatically reassign it.
    const old = this.store.read();
    if (old.runs.some(r => ['running','verifying','integrating'].includes(r.status))) this.update(d => {
      for (const r of d.runs) if (['running','verifying','integrating'].includes(r.status)) { r.status = 'interrupted'; r.error = 'Server restarted; reconcile the old process before starting a new task.'; const task = d.tasks.find(t => t.id === r.taskId); if (task) task.status = 'interrupted'; }
    });
  }
  read() { return this.store.read(); }
  update(fn) { const d = this.read(); fn(d); return this.store.save(d, d.revision); }
  createTask(input) {
    const d = checkTask(copy(input));
    const task = { ...d, id: crypto.randomUUID(), requirementRevision: 1, status: d.purpose === 'execute' ? 'ready' : 'planned', createdAt: new Date().toISOString() };
    this.update(state => {
      if (state.tasks.length >= 1000) throw failure('Task history is full; export and archive before creating more');
      if (task.dependencies.some(id => !state.tasks.some(t => t.id === id))) throw failure('Unknown dependency');
      state.tasks.push(task);
    }); return task;
  }
  // Meeting owns conversation/manual reports; work owns execution requirements and evidence.
  // The original action timestamp survives carry/restore; numbers alone are not identities.
  syncRoom(room) {
    const state = this.read(), before = JSON.stringify(state);
    if (state.sessionCreatedAt > room.createdAt) return state;
    state.sessionCreatedAt = room.createdAt;
    for (const task of state.tasks) if (task.origin?.kind === 'meeting-action') task.sourceCurrent = false;
    for (const action of room.actions) {
      const linked = state.tasks.find(t => t.origin?.kind === 'meeting-action' && t.origin.number === action.n && t.origin.timestamp === action.t);
      const id = linked?.id || 'meeting-' + hash(room.hostKey + ':' + action.n + ':' + action.t).slice(0, 32);
      let task = state.tasks.find(t => t.id === id);
      const context = room.context || task?.context || task?.origin?.context || room.carry?.context || '';
      if (task && task.context === undefined) task.context = task.origin?.context || context;
      if (!task) {
        if (state.tasks.length >= 1000) throw failure('Task history is full; export and archive before creating more');
        const message = action.sourceMessageIndex !== undefined
          ? action.sourceRoomCreatedAt === room.createdAt ? room.log.find(m => m.i === action.sourceMessageIndex) : null
          : [...room.log].reverse().find(m => m.t === action.t && ['host','chat'].includes(m.type) && m.text.includes(action.task));
        task = { id, context, goal: action.task, purpose: 'plan', topology: 'local', management: 'invited', acceptance: [], dependencies: [], writePaths: [], testFiles: [], sources: [], facts: [], unknowns: [], requirementRevision: 1, status: 'planned', createdAt: new Date(action.t).toISOString(),
          origin: { kind: 'meeting-action', number: action.n, timestamp: action.t, roomCreatedAt: action.sourceRoomCreatedAt || room.createdAt, messageIndex: message?.i ?? null, message: message?.text || '', context: room.context || room.carry?.context || '' } };
        state.tasks.push(task);
      } else if (task.goal !== action.task || task.owner !== undefined && task.owner !== action.owner || task.context !== undefined && task.context !== context) {
        task.goal = action.task; task.context = context; task.requirementRevision++;
        task.status = state.runs.some(r => r.taskId === id) ? 'stale' : 'planned';
      }
      task.owner = action.owner; task.sourceCurrent = true;
      task.reportedProgress = { status: action.status, note: action.note, updatedAt: action.updatedAt, updatedBy: action.updatedBy };
    }
    if (JSON.stringify(state) !== before) this.store.save(state, state.revision);
    return this.read();
  }
  assertCurrent(taskId, revision) {
    this.refreshSource?.();
    const task = this.read().tasks.find(t => t.id === taskId);
    if (!task) throw failure('Task not found', 404);
    if (task.sourceCurrent === false) throw failure('Task source is no longer in this meeting; review the current plan', 409);
    if (revision !== undefined && task.requirementRevision !== revision) throw failure('Requirement revision changed; the old result cannot be accepted', 409);
    return task;
  }
  configureTask(id, input) {
    const task = this.assertCurrent(id);
    if (task.requirementRevision !== input.expectedRevision) throw failure('Task changed; reload before saving this draft', 409);
    const state = this.read();
    if (state.runs.some(r => r.taskId === id && ['running','verifying','integrating','interrupted'].includes(r.status))) throw failure('Cancel or reconcile the existing run before changing execution requirements', 409);
    const next = copy(task);
    for (const key of ['risk','purpose','topology','management','acceptance','dependencies','writePaths','testFiles','sources','facts','unknowns','workspace','baseRevision']) if (input[key] !== undefined) next[key] = copy(input[key]);
    checkTask(next);
    if (next.dependencies.some(dep => dep === id || !state.tasks.some(t => t.id === dep))) throw failure('Unknown or self dependency');
    // Reject cycles, including those introduced by editing an existing plan.
    const reaches = (dep, seen = new Set()) => dep === id || !seen.has(dep) && (seen.add(dep), (state.tasks.find(t => t.id === dep)?.dependencies || []).some(x => reaches(x, seen)));
    if (next.dependencies.some(dep => reaches(dep))) throw failure('Dependency cycle');
    next.requirementRevision++; next.status = next.purpose === 'execute' ? 'ready' : 'planned';
    this.update(d => { d.tasks[d.tasks.findIndex(t => t.id === id)] = next; });
    return next;
  }
  profile(config, id) {
    const p = config.profiles.find(p => p.id === id), m = p && config.models.find(m => m.id === p.modelId);
    if (!p?.enabled || !m?.enabled || !m.providerModelId || m.verification !== 'verified') throw failure('Enable and verify the selected model/profile first', 409);
    const adapter = ADAPTER_FOR[p.runtimeId];
    if (!adapter) throw failure('Runtime has no execution adapter', 409);
    return { p, m, adapter };
  }
  environment() {
    const now = Date.now();
    const config = this.configStore.read();
    return [...this.read().observations, ...savedEnvironment(this.configStore, config)].filter(o => { const profile = config.profiles.find(p => p.id === o.profileId); return o.configRevision === config.revision && profile?.runtimeId === o.runtimeId && now - Date.parse(o.checkedAt) >= 0 && now - Date.parse(o.checkedAt) < 30 * 60000; });
  }
  async probe(profileId, expectedConfigRevision) {
    const config = this.configStore.read();
    if (expectedConfigRevision !== undefined && config.revision !== expectedConfigRevision) throw failure('Configuration changed; reload before probing this profile', 409);
    const { p, m, adapter } = this.profile(config, profileId);
    const key = JSON.stringify([profileId, config.revision]), existing = this.probes.get(key);
    if (existing) return copy(await existing.promise);
    const controller = new AbortController();
    const dir = path.join(this.dir, 'probes', crypto.randomUUID()); fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const pending = Promise.resolve().then(async () => {
      if (controller.signal.aborted) throw failure('Probe cancelled', 409);
      const result = await this.runner({ adapter, modelId: m.providerModelId, prompt: 'Reply only READY. No tools or file changes.', workspace: dir, timeoutMs: 60000, signal: controller.signal });
      if (controller.signal.aborted || result.status === 'cancelled') throw failure('Probe cancelled', 409);
      const observed = { profileId, runtimeId: p.runtimeId, adapter, configRevision: config.revision, providerModelId: m.providerModelId, requestedModel: m.providerModelId, reportedModel: result.reportedModel,
        available: result.status === 'reported', modelVerified: result.status === 'reported' && result.reportedModel === m.providerModelId,
        quotaAvailable: result.status === 'reported', checkedAt: new Date().toISOString(), tools: [], permissions: [], error: result.error || null };
      // A late result belongs to the config it checked, not a newer mapping.
      if (this.configStore.read().revision !== config.revision) return { ...observed, stale: true };
      this.update(d => { d.observations = d.observations.filter(x => x.profileId !== p.id); d.observations.push(observed); });
      const observations = observationStore(this.configStore), current = observations.read(); current.observations = current.observations.filter(o => o.profileId !== p.id); current.observations.push(observed); observations.save(current, current.revision);
      return observed;
    });
    const entry = { controller, promise: pending }; this.probes.set(key, entry); this.pending.add(pending);
    try { return copy(await pending); }
    finally { this.pending.delete(pending); if (this.probes.get(key) === entry) this.probes.delete(key); }
  }
  start(taskId, profileId, managed = {}) {
    if (this.active.size) throw failure('A run is active; finish or cancel it first', 409);
    this.assertCurrent(taskId);
    const state = this.read(), task = state.tasks.find(t => t.id === taskId);
    if (!task) throw failure('Task not found', 404);
    if (managed.expectedRequirementRevision !== undefined && task.requirementRevision !== managed.expectedRequirementRevision) throw failure('Task changed; refresh before running this task', 409);
    if (task.purpose !== 'execute' || task.topology !== 'local' || task.management !== 'managed') throw failure('Managed execution currently supports local execution tasks only', 409);
    if (state.runs.some(r => r.status === 'interrupted')) throw failure('An interrupted run needs reconciliation; no automatic re-dispatch', 409);
    if (state.runs.some(r => r.taskId === taskId && r.requirementRevision === task.requirementRevision && !['failed','cancelled','timeout','output-limit','rejected'].includes(r.status))) throw failure('Task already has an active or completed attempt', 409);
    checkTask(copy(task));
    if (task.dependencies.some(id => state.tasks.find(t => t.id === id)?.status !== 'done' || state.tasks.find(t => t.id === id)?.sourceCurrent === false)) throw failure('Dependencies not integrated', 409);
    const config = this.configStore.read();
    if (managed.expectedConfigRevision !== undefined && config.revision !== managed.expectedConfigRevision) throw failure('Configuration changed; refresh before selecting an execution profile', 409);
    const { m, adapter } = this.profile(config, profileId);
    const source = fs.realpathSync(task.workspace || ''), baseRevision = gitRevision(source);
    if (task.baseRevision && task.baseRevision !== baseRevision) throw failure('Base revision changed', 409);
    const observation = this.environment().find(o => o.profileId === profileId);
    const env = observation ? [{ ...observation, tools: [], permissions: [], workspace: { revision: baseRevision, writePaths: task.writePaths }, locks: [] }] : [];
    const decision = routing.recommend(config, { ...task, taskId: task.id, lockedProfileId: profileId, revision: baseRevision }, env);
    if (!decision.candidates.some(c => c.profileId === profileId)) throw failure('Runtime access is unverified or routing constraints reject this task; probe the profile first', 409);
    const id = crypto.randomUUID(), workspace = path.join(this.dir, 'runs', id, 'workspace');
    if (this.dir === source || this.dir.startsWith(source + path.sep)) throw failure('Application work directory must be outside the source checkout');
    const before = sourceInventory(source); const sourceBytes = Object.values(before).reduce((n, f) => n + f.size, 0);
    if (sourceBytes > 64 * 1024 * 1024) throw failure('Execution workspace exceeds 64 MiB');
    for (const test of task.testFiles) if (!before[test]) throw failure('Verification test does not exist: ' + test);
    fs.mkdirSync(workspace, { recursive: true, mode: 0o700 });
    for (const file of Object.keys(before)) { const dest = safeFile(workspace, file); fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 }); fs.copyFileSync(safeFile(source, file), dest); }
    const run = { id, taskId, requirementSnapshot: copy(task), requirementRevision: task.requirementRevision, status: 'running', source, workspace, baseRevision,
      configRevision: config.revision, configSnapshot: config, decision, profileId, adapter, requestedModel: m.providerModelId,
      reportedModel: 'unknown', before, startedAt: new Date().toISOString(), evidence: [], changes: [], usage: null, costUsd: null };
    this.update(d => { d.runs.push(run); d.tasks.find(t => t.id === taskId).status = 'running'; });
    const controller = new AbortController(); this.active.set(id, controller);
    const prompt = JSON.stringify({ id: task.id, objective: task.goal, context: task.context || '', origin: task.origin || null, scope: task.writePaths, acceptance: task.acceptance, sources: task.sources, facts: task.facts, unknowns: task.unknowns, baseRevision,
      rules: ['Work only in the supplied copy.', 'Only modify the listed paths.', 'Do not commit, push, deploy, read secrets or edit credentials/settings.', 'Return changed files and evidence; completion requires independent verification.'], timeoutMs: 120000 });
    const pending = Promise.resolve().then(() => (managed.runner || this.runner)({ adapter, modelId: m.providerModelId, prompt, workspace, write: task.writePaths.length > 0, timeoutMs: 120000, signal: controller.signal })).then(result => {
      const after = inventory(workspace), diff = changes(before, after);
      const outside = diff.filter(c => !task.writePaths.some(w => c.file === w || c.file.startsWith(w + '/')));
      this.update(d => { const r = d.runs.find(r => r.id === id);
        Object.assign(r, { status: outside.length ? 'rejected' : result.status, reportedModel: result.reportedModel,
          report: result.text, usage: result.usage, costUsd: result.costUsd ?? null, elapsedMs: result.elapsedMs, error: outside.length ? 'Changes outside assigned scope' : result.error,
          exitCode: result.exitCode, changes: diff, finishedAt: new Date().toISOString() });
        d.tasks.find(t => t.id === taskId).status = r.status === 'reported' ? 'verifying' : r.status;
      });
    }).catch(e => { this.update(d => { const r = d.runs.find(r => r.id === id); r.status = 'failed'; r.error = e.message; d.tasks.find(t => t.id === taskId).status = 'failed'; }); }).finally(() => { this.active.delete(id); managed.settled?.(id); this.pending.delete(pending); });
    this.pending.add(pending);
    return copy(run);
  }
  rebase(id) {
    if (this.active.size) throw failure('A run is active', 409);
    const state = this.read(), run = state.runs.find(r => r.id === id);
    if (!run || !['reported','verified'].includes(run.status)) throw failure('Only a reported or verified run can be rebased', 409);
    const current = sourceInventory(run.source);
    for (const change of run.changes) if ((current[change.file]?.sha256 || null) !== change.before) throw failure('Changed file conflicts with current source: ' + change.file, 409);
    // Preserve scoped worker changes, refresh all other inputs, then require a fresh verification.
    const changed = new Set(run.changes.map(c => c.file));
    for (const file of Object.keys(inventory(run.workspace))) if (!changed.has(file) && !current[file]) fs.unlinkSync(safeFile(run.workspace, file));
    for (const file of Object.keys(current)) if (!changed.has(file)) {
      const target = safeFile(run.workspace, file); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.copyFileSync(safeFile(run.source, file), target);
    }
    const revision = gitRevision(run.source);
    this.update(d => { const r = d.runs.find(r => r.id === id); r.rebases ||= []; r.rebases.push({ from: r.baseRevision, to: revision, checkedAt: new Date().toISOString(), evidence: r.evidence }); r.before = current; r.baseRevision = revision; r.status = 'reported'; r.evidence = []; r.verifiedSnapshot = null; d.tasks.find(t => t.id === run.taskId).status = 'verifying'; });
    return this.read().runs.find(r => r.id === id);
  }
  cancel(id) { const c = this.active.get(id); if (!c) throw failure('No managed live process for this run', 409); c.abort(); return { requested: true }; }
  async verify(id) {
    if (this.active.size) throw failure('A run is active; finish or cancel it first', 409);
    const state = this.read(), run = state.runs.find(r => r.id === id), task = run && state.tasks.find(t => t.id === run.taskId);
    if (!run || run.status !== 'reported') throw failure('Run has no report ready for verification', 409);
    this.assertCurrent(task.id, run.requirementRevision);
    if (run.reportedModel !== run.requestedModel) throw failure('Actual model identity is unknown or differs from the selected model', 409);
    const after = inventory(run.workspace), diff = changes(run.before, after);
    if (JSON.stringify(diff) !== JSON.stringify(run.changes)) throw failure('Workspace changed since report', 409);
    if (!task.testFiles.length) throw failure('Independent verification tests are required before accepting a run', 409);
    for (const file of task.testFiles) if (after[file]?.sha256 !== run.before[file]?.sha256) throw failure('Verification source changed', 409);
    const controller = new AbortController(), evidence = [];
    this.update(d => { d.runs.find(r => r.id === id).status = 'verifying'; });
    this.active.set(id, controller);
    try {
      for (const file of task.testFiles) {
        if (controller.signal.aborted) break;
        evidence.push(await runTest(run.workspace, file, controller.signal, true));
      }
      this.assertCurrent(task.id, run.requirementRevision);
      const cancelled = controller.signal.aborted || evidence.some(e => e.cancelled);
      const passed = !cancelled && evidence.length === task.testFiles.length && evidence.every(e => e.exitCode === 0 && !e.timeout && !e.error);
      if (!cancelled && changes(after, inventory(run.workspace)).length) throw failure('Workspace changed during verification', 409);
      this.update(d => {
        const r = d.runs.find(r => r.id === id);
        if (this.active.get(id) !== controller || r.status !== 'verifying') return;
        r.evidence = evidence; r.verifiedSnapshot = passed ? after : null;
        r.status = cancelled ? 'cancelled' : passed ? 'verified' : 'failed';
        r.error = cancelled ? 'Verification cancelled' : passed ? null : 'Independent verification failed';
        d.tasks.find(t => t.id === task.id).status = passed ? 'integrating' : r.status;
      });
    } catch (error) {
      this.update(d => {
        const r = d.runs.find(r => r.id === id);
        if (this.active.get(id) !== controller || r.status !== 'verifying') return;
        r.evidence = evidence; r.status = controller.signal.aborted ? 'cancelled' : 'failed'; r.error = error.message;
        d.tasks.find(t => t.id === task.id).status = r.status;
      });
    } finally { if (this.active.get(id) === controller) this.active.delete(id); }
    return this.read().runs.find(r => r.id === id);
  }
  async integrate(id) {
    if (this.active.size) throw failure('A run is active; finish or cancel it first', 409);
    const state = this.read(), run = state.runs.find(r => r.id === id), task = run && state.tasks.find(t => t.id === run.taskId);
    if (!run || run.status !== 'verified') throw failure('Run must pass verification before integration', 409);
    this.assertCurrent(task.id, run.requirementRevision);
    if (fs.realpathSync(run.source) !== run.source) throw failure('Source checkout path changed', 409);
    if (run.decision?.review?.required) throw failure('Routing requires independent review. Automatic review acceptance is not implemented; review and integrate this result manually.', 409);
    if (gitRevision(run.source) !== run.baseRevision || task.requirementRevision !== run.requirementRevision) throw failure('Base or requirement revision changed', 409);
    if (JSON.stringify(inventory(run.workspace)) !== JSON.stringify(run.verifiedSnapshot)) throw failure('Workspace changed since verification', 409);
    const current = sourceInventory(run.source);
    if (changes(run.before, current).length) throw failure('Source snapshot changed since the run; rebase and verify again', 409);
    for (const c of run.changes) {
      const target = safeFile(run.source, c.file), now = fs.existsSync(target) ? hash(fs.readFileSync(target)) : null;
      if (now !== c.before) throw failure('Source changed; integration conflict: ' + c.file, 409);
    }
    // Integration is limited to one file until a transactional multi-file integrator is implemented.
    if (run.changes.length > 1) throw failure('Multiple file integration requires manual review; download the workspace diff', 409);
    if (!task.testFiles.length) throw failure('Independent verification tests are required before integration', 409);
    const controller = new AbortController(), evidence = [];
    const change = run.changes[0], target = change && safeFile(run.source, change.file);
    const original = target && fs.existsSync(target) ? { bytes: fs.readFileSync(target), mode: fs.statSync(target).mode & 0o777 } : null;
    let applied = false, appliedMode = null;
    this.update(d => { d.runs.find(r => r.id === id).status = 'integrating'; });
    this.active.set(id, controller);
    try {
      if (change) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (change.after === null) fs.unlinkSync(target);
        else atomicReplace(target, fs.readFileSync(safeFile(run.workspace, change.file)), original?.mode);
        applied = true;
        if (change.after !== null) appliedMode = fs.statSync(target).mode & 0o777;
      }
      for (const file of task.testFiles) {
        if (controller.signal.aborted) break;
        evidence.push(await runTest(run.source, file, controller.signal, true));
      }
      this.assertCurrent(task.id, run.requirementRevision);
      if (controller.signal.aborted || evidence.some(e => e.cancelled)) throw failure('Integration verification cancelled');
      if (evidence.length !== task.testFiles.length || evidence.some(e => e.exitCode !== 0 || e.timeout || e.error)) throw failure('Integrated source verification failed');
      if (fs.realpathSync(run.source) !== run.source || gitRevision(run.source) !== run.baseRevision || changes(run.verifiedSnapshot, sourceInventory(run.source)).length) throw failure('Source changed during integration verification', 409);
      this.update(d => {
        const r = d.runs.find(r => r.id === id), currentTask = d.tasks.find(t => t.id === task.id);
        if (this.active.get(id) !== controller || r.status !== 'integrating' || currentTask.requirementRevision !== run.requirementRevision) throw failure('Integration attempt is stale', 409);
        r.integrationEvidence = evidence; r.status = 'integrated'; r.error = null; r.integratedAt = new Date().toISOString(); currentTask.status = 'done';
      });
    } catch (error) {
      let rollbackError = null;
      if (applied) {
        try {
          // Avoid overwriting unrelated edits made while verification was running.
          try {
            if (fs.realpathSync(run.source) !== run.source) throw failure('Source checkout path changed');
            safeFile(run.source, change.file);
          } catch { throw failure('Source path changed after integration; manual rollback required'); }
          let stat = null;
          try { stat = fs.lstatSync(target); } catch (e) { if (e.code !== 'ENOENT') throw e; }
          const now = stat?.isFile() ? hash(fs.readFileSync(target)) : null;
          if (stat && !stat.isFile() || now !== change.after || stat && (stat.mode & 0o777) !== appliedMode) throw failure('Source changed after integration; manual rollback required');
          if (original) atomicReplace(target, original.bytes, original.mode);
          else fs.unlinkSync(target);
        } catch (rollback) { rollbackError = rollback.message; }
      }
      this.update(d => {
        const r = d.runs.find(r => r.id === id);
        r.integrationEvidence = evidence; r.status = controller.signal.aborted ? 'cancelled' : 'failed';
        r.error = error.message + (rollbackError ? '; ' + rollbackError : ''); r.rollback = rollbackError ? 'conflict' : applied ? 'restored' : 'not-needed';
        d.tasks.find(t => t.id === task.id).status = r.status;
      });
    } finally { if (this.active.get(id) === controller) this.active.delete(id); }
    return this.read().runs.find(r => r.id === id);
  }
  close() { for (const probe of this.probes.values()) probe.controller.abort(); for (const controller of this.active.values()) controller.abort(); return Promise.allSettled([...this.pending]); }
}
function atomicReplace(target, bytes, mode = 0o600) {
  const tmp = target + '.' + crypto.randomUUID() + '.tmp';
  try { fs.writeFileSync(tmp, bytes, { mode, flag: 'wx' }); fs.renameSync(tmp, target); }
  finally { try { fs.unlinkSync(tmp); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
}
function runTest(workspace, file, signal, isolate = false) {
  // Node 18/older 20 lack this CLI option. The process-tree deadline below
  // still enforces a hard wall-clock limit on every supported Node version.
  const args = ['--max-old-space-size=256', '--test', ...(Number(process.versions.node.split('.')[0]) >= 22 ? ['--test-timeout=20000'] : []), file];
  const command = [process.execPath, ...args];
  if (signal?.aborted) return Promise.resolve({ command, exitCode: null, timeout: false, cancelled: true, output: '', elapsedMs: 0, checkedAt: new Date().toISOString() });
  return new Promise(resolve => {
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; delete env.NODE_OPTIONS; delete env.NODE_PATH;
    const wrapped = isolate ? require('./execution-sandbox').wrapExecution(process.execPath, args, { workspace, write: false }) : null;
    const started = Date.now(), child = spawn(wrapped ? wrapped.bin : process.execPath, wrapped ? wrapped.args : args, { cwd: workspace, shell: false, env, detached: process.platform !== 'win32', stdio: ['ignore','pipe','pipe'] });
    let output = '', reason = null, finished = false, killTimer, closed;
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8');
      stream.on('data', text => { output = (output + text).slice(-32768).replace(/^[\uDC00-\uDFFF]/, ''); });
    }
    const kill = kind => { try { if (process.platform === 'win32') child.kill(kind); else if (child.pid) process.kill(-child.pid, kind); } catch {} };
    const stop = why => {
      if (finished || reason) return;
      reason = why; kill('SIGTERM');
      killTimer = setTimeout(() => {
        kill('SIGKILL'); killTimer = null;
        if (closed) done(closed.exitCode, closed.error);
      }, 2000);
    };
    const timer = setTimeout(() => stop('timeout'), 30000);
    const abort = () => stop('cancelled');
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) stop('cancelled');
    const done = (exitCode, error) => {
      if (finished) return;
      // The immediate test runner can exit while a grandchild ignores SIGTERM.
      // Do not release the run lease until group escalation has been sent.
      if (reason && killTimer) { closed = { exitCode, error }; return; }
      finished = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); wrapped?.cleanup();
      resolve({ command, exitCode, timeout: reason === 'timeout', cancelled: reason === 'cancelled', output, error: error?.message, elapsedMs: Date.now() - started, checkedAt: new Date().toISOString() });
    };
    child.on('error', e => done(null, e)); child.on('close', code => done(code));
  });
}
module.exports = { WorkManager, checkTask, inventory, sourceInventory, changes, safeFile, runTest, gitRevision };
