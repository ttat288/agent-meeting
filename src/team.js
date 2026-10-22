'use strict';
// One delegated local execution lane, on the existing canonical task/run store.
const crypto = require('crypto');
const { inventory, changes } = require('./work');
const { SessionSupervisor } = require('./session-supervisor');
const digest = v => crypto.createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
const fail = message => { throw Object.assign(Error(message), { status: 409 }); };
class TeamController {
  constructor(pm, options = {}) {
    this.pm = pm; this.work = pm.work; this.supervisor = new SessionSupervisor(options);
    this.live = null; this.pending = null; this.readiness = null; this.closed = false;
    const p = pm.read();
    if (p?.team) pm.update(p => { p.team.tokenHash = null; p.team.status = 'suspended'; p.team.approval = null; if (p.team.swap && !['completed','failed'].includes(p.team.swap.status)) p.team.swap.status = 'interrupted'; });
  }
  get() { return this.pm.read()?.team; }
  contextFor(checkpoint) {
    if (!checkpoint) return null;
    const { snapshot, ...context } = checkpoint;
    return { ...context, inputSnapshotHash: digest(snapshot) };
  }
  safe() {
    const t = this.get(); if (!t) return null;
    const { tokenHash, ...safe } = t; return { ...safe, ...(t.checkpoint ? { checkpoint: this.contextFor(t.checkpoint) } : {}) };
  }
  options(input) {
    if (!input || ![60,120,180,null].includes(input.durationMinutes) || !Number.isInteger(input.maxSwaps) || input.maxSwaps < 0 || input.maxSwaps > 2 || !Number.isInteger(input.maxInvocations) || input.maxInvocations < 1 || input.maxInvocations > 9 || !Number.isInteger(input.maxWakes) || input.maxWakes < 1 || input.maxWakes > 20) fail('Team grant needs durationMinutes (60/120/180/null), maxSwaps (0–2), maxInvocations (1–9), maxWakes (1–20)');
    if (!Array.isArray(input.profiles) || !input.profiles.length || input.profiles.length > 3 || input.profiles.some(x => typeof x !== 'string')) fail('Explicit successor profile allowlist required');
    return { durationMinutes: input.durationMinutes, maxSwaps: input.maxSwaps, maxInvocations: input.maxInvocations, maxWakes: input.maxWakes, profiles: [...new Set(input.profiles)], chair: input.chair === true };
  }
  valid() {
    this.pm.current(); const p = this.pm.read(), t = p?.team, g = p?.grant;
    if (this.closed || !p || p.status !== 'active' || !g || !g.team || !t || t.goalRevision !== p.goalRevision || t.grantId !== g.id || g.expiresAt <= this.pm.now() || t.endsAt && t.endsAt <= this.pm.now() || ['paused','suspended','expired'].includes(t.status)) fail('Team is stale, paused, expired or not granted');
    if (this.work.configStore.read().revision !== g.configRevision) fail('Routing configuration changed; new grant required');
    return { p, t, g };
  }
  auth(token, generation) {
    const v = this.valid();
    if (!token || !v.t.tokenHash || !crypto.timingSafeEqual(Buffer.from(digest(token)), Buffer.from(v.t.tokenHash))) throw Object.assign(Error('Invalid team capability'), { status: 401 });
    if (generation !== v.t.generation) fail('Runtime generation changed');
    return v;
  }
  reserve(count) {
    const { g } = this.valid();
    if (!g.allowUnknownCost) fail('Unknown model cost is not authorized');
    if ((g.usedInvocations || 0) + count > g.team.maxInvocations) fail('Team invocation cap reached');
    this.pm.update(p => { p.grant.usedInvocations = (p.grant.usedInvocations || 0) + count; });
  }
  invite() {
    const p = this.pm.read();
    if (!p?.grant?.team || this.work.active.size || this.get()?.status === 'working') fail('Team grant required and old work must be reconciled');
    const token = crypto.randomBytes(32).toString('base64url');
    this.pm.update(p => { if (p.team) { p.teamHistory ||= []; if (p.teamHistory.length >= 20) fail('Team history full; export and archive before replacing'); p.teamHistory.push(this.safe()); } p.team = { id: crypto.randomUUID(), slot: 'A', generation: 1, goalRevision: p.goalRevision, grantId: p.grant.id, tokenHash: digest(token), status: 'invited', planRevision: 0, events: [], wakeCount: 0, swapsUsed: 0, sessions: [] }; this.pm.event(p, 'team-invite', 'pm'); });
    return { token, slot: 'A', generation: 1 };
  }
  createPlan(input) {
    const { p, g } = this.valid();
    if (this.work.active.size || this.get().approval && input.expectedPlanRevision !== this.get().planRevision) fail('Cannot replace a running plan; revising approval needs expectedPlanRevision');
    const task = this.work.read().tasks.find(t => t.pmId === p.id && t.pmGoalRevision === p.goalRevision && t.sourceCurrent !== false)
      || this.work.createTask({ goal: p.goal, acceptance: p.acceptance, purpose: 'execute', topology: 'local', management: 'managed', risk: g.risk, workspace: g.workspace, baseRevision: g.baseRevision, writePaths: g.writePaths, testFiles: g.testFiles, pmId: p.id, pmGoalRevision: p.goalRevision, sourceCurrent: true, origin: { kind: 'pm-goal', pmId: p.id, goalRevision: p.goalRevision, roomCreatedAt: this.pm.room.createdAt } });
    this.pm.update(p => { const t = p.team; t.planRevision++; t.approval = null; t.plan = { summary: this.pm.text(input.summary, 4000), taskId: task.id, requirementRevision: task.requirementRevision, owner: t.slot }; t.status = 'plan-proposed'; });
    return this.view();
  }
  async approve(input) {
    const { p, t, g } = this.valid();
    if (input.planRevision !== t.planRevision || !t.plan || t.status !== 'plan-proposed' || input.grantId !== g.id) fail('Plan or grant changed');
    const task = this.work.assertCurrent(t.plan.taskId, t.plan.requirementRevision);
    this.assertScope(task, p, g);
    // Local deterministic readiness. This does not probe a model or invent access.
    const before = require('./work').sourceInventory(task.workspace);
    for (const file of task.testFiles) if (!before[file]) fail('Readiness: independent test missing');
    const profile = this.work.profile(this.work.configStore.read(), g.profileId);
    if (profile.adapter !== 'claude') fail('Managed team writing requires the Claude adapter');
    if (!this.work.environment().some(o => o.profileId === g.profileId && o.modelVerified && o.reportedModel === g.requestedModel)) fail('Readiness: model access unverified');
    require('./execution-sandbox').checkSandbox();
    if (this.readiness) fail('Readiness check already active');
    const controller = new AbortController(), evidence = []; this.readiness = controller;
    try {
      for (const file of task.testFiles) {
        this.valid();
        const result = await require('./work').runTest(task.workspace, file, controller.signal, true);
        evidence.push(result);
        if (result.timeout || result.error || result.cancelled || !Number.isInteger(result.exitCode) || result.exitCode > 1 || /MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|SyntaxError:/.test(result.output)) fail('Readiness test runner/dependency failed; resolve environment before dispatch');
      }
      this.valid();
      if (this.get().planRevision !== t.planRevision || this.get().grantId !== g.id || digest(require('./work').sourceInventory(task.workspace)) !== digest(before)) fail('Readiness plan/source changed');
    } finally {
      this.readiness = null;
      this.pm.update(p => { if (p.team?.id === t.id) p.team.readinessEvidence = evidence; });
    }
    this.pm.update(p => { p.team.approval = { planRevision: t.planRevision, goalRevision: p.goalRevision, grantId: g.id, snapshotHash: digest(before), at: this.pm.now() }; p.team.status = 'ready'; this.pm.event(p, 'team-plan-approved', 'pm', { taskId: task.id, planRevision: t.planRevision }); });
    return this.view();
  }
  assertScope(task, p, g) {
    if (task.goal !== p.goal || JSON.stringify(task.acceptance) !== JSON.stringify(p.acceptance) || ['risk','workspace','baseRevision','writePaths','testFiles'].some(k => JSON.stringify(task[k]) !== JSON.stringify(g[k]))) fail('Task scope differs from approved goal/grant');
  }
  view() {
    const { p, t, g } = this.valid();
    const task = this.work.read().tasks.find(x => x.id === t.plan?.taskId);
    const run = this.work.read().runs.find(x => x.id === t.runId);
    return { ...this.safe(), goal: p.goal, acceptance: p.acceptance, task, run: run && { id: run.id, status: run.status, changes: run.changes, evidence: run.evidence, integrationEvidence: run.integrationEvidence, requestedModel: run.requestedModel, reportedModel: run.reportedModel }, limits: { ...g.team, expiresAt: g.expiresAt, usedInvocations: g.usedInvocations || 0 }, privateChannel: undefined };
  }
  signal(kind, key, refs = {}) {
    const { t, p, g } = this.valid();
    if (!['result','blocker','director','guard'].includes(kind)) fail('Only actionable events can wake the PM');
    const id = digest([p.goalRevision, t.planRevision, kind, key]);
    const previous = t.events.find(e => e.id === id); if (previous) return previous;
    if (t.wakeCount >= g.team.maxWakes) {
      this.pm.update(p => { p.team.attention = { reason: 'Wake cap reached; director decision required', at: this.pm.now() }; p.team.status = 'needs-decision'; });
      fail('Wake cap reached; director decision required');
    }
    const event = { id, kind, key: this.pm.text(key, 1000), goalRevision: p.goalRevision, planRevision: t.planRevision, slot: t.slot, generation: t.generation, at: this.pm.now(), ...refs, acked: false };
    this.pm.update(p => { p.team.events.push(event); p.team.wakeCount++; if (kind === 'result') p.team.status = 'pm-review'; this.pm.event(p, 'team-wake', 'team', { eventId: id, kind }); });
    return event;
  }
  async wait(token, input) {
    this.pm.check(token, input.goalRevision);
    const until = Date.now() + Math.min(Math.max(Number(input.timeoutMs) || 25000, 1), 25000);
    do {
      this.pm.authenticate(token); const p = this.pm.read(), t = p.team;
      if (!t || t.goalRevision !== input.goalRevision) fail('Team goal changed');
      if (t.attention) return { events: [], blocked: true, attention: t.attention, status: t.status };
      const events = t.events.filter(e => !e.acked);
      if (events.length) return { events, goalRevision: p.goalRevision, planRevision: t.planRevision, status: t.status };
      if (Date.now() >= until) return { events: [], waiting: true, status: t.status };
      await new Promise(r => setTimeout(r, 100));
    } while (!this.closed);
    fail('Operator closed');
  }
  ack(input) {
    const { t } = this.valid(); const e = t.events.find(e => e.id === input.eventId);
    if (!e || e.goalRevision !== input.goalRevision || e.planRevision !== t.planRevision) fail('Event is stale or unknown');
    this.pm.update(p => { p.team.events.find(x => x.id === e.id).acked = true; }); return { ok: true, eventId: e.id };
  }
  async execute(options) {
    const startedAt = Date.now();
    const team = this.get(), run = this.work.read().runs.find(r => r.id === team.runId);
    const runtimeControl = { schema: 'agent-meeting/runtime-request@1', action: 'swap', taskId: run.taskId, requirementRevision: run.requirementRevision, planRevision: team.planRevision, baseRevision: run.baseRevision,
      profileId: this.pm.read().grant.profileId, decisions: 'Required: exact decisions/constraints to preserve', unknowns: 'Required: remaining unknowns', next: 'Required: next scoped action' };
    options = { ...options, prompt: JSON.stringify({ ...JSON.parse(options.prompt), runtimeControl, runtimeInstruction: 'If a fresh context/model is needed before completing, checkpoint WIP and return only the runtimeControl JSON with actual decisions, unknowns and next. This asks the supervisor for a bounded same-slot swap, never shell commands. Otherwise report the result normally.' }) };
    options.onRequest = async (request, requestingSession) => {
      if (request?.schema !== 'agent-meeting/runtime-request@1' || request.action !== 'swap' || this.live?.session !== requestingSession || requestingSession.stopped) fail('Unknown or stale runtime request');
      const checkpoint = this.checkpoint(request);
      // The private successor capability is returned to the external slot client
      // through its own swap call; runtime-driven swaps never put it in model text.
      await this.swap({ checkpointHash: checkpoint.hash, profileId: request.profileId }, { internal: true });
    };
    let session = this.supervisor.open(options); this.live = { session, options };
    const abort = () => { this.supervisor.stop(session).catch(() => {}); if (this.pending) this.supervisor.stop(this.pending).catch(() => {}); };
    options.signal?.addEventListener('abort', abort, { once: true });
    // AbortSignal is not serializable across IPC.
    try {
      for (;;) {
        const ready = await session.ready;
        if (ready.model !== this.live.options.modelId) fail('Managed runtime readiness identity mismatch');
        if (options.signal?.aborted || this.closed) { await this.supervisor.stop(session); return { status: 'cancelled', reportedModel: 'unknown' }; }
        this.valid();
        const runtimeGeneration = this.get().generation;
        const result = await this.supervisor.activate(session);
        const t = this.get();
        this.work.update(d => { const r = d.runs.find(r => r.id === t?.runId); if (r) { const entry = r.sessions.find(x => x.kind === 'execution' && x.generation === runtimeGeneration); if (entry) Object.assign(entry, { reportedModel: result.reportedModel || 'unknown', status: this.live?.replacement ? 'superseded' : result.status, usage: result.usage ?? null, costUsd: result.costUsd ?? null, finishedAt: Date.now() }); } });
        if (this.live?.replacement) {
          const replacement = this.live.replacement;
          if (replacement.waiting) await new Promise(resolve => { replacement.release = resolve; });
          if (replacement.failed) return { status: 'interrupted', reportedModel: 'unknown', error: 'Swap failed after writer quiesce; reconcile required' };
          session = replacement.session; this.live = { session, options: replacement.options }; continue;
        }
        // Whole-run billing cannot be inferred from only the final CLI. Keep each
        // invocation's observations, including killed epochs with unknown usage.
        const entries = this.work.read().runs.find(r => r.id === t?.runId)?.sessions || [];
        const totalCost = entries.length && entries.every(x => Number.isFinite(x.costUsd) && x.costUsd >= 0) ? entries.reduce((n,x) => n + x.costUsd, 0) : null;
        return { ...result, status: options.signal?.aborted ? 'cancelled' : result.status, costUsd: totalCost, usage: null, elapsedMs: Date.now() - startedAt };
      }
    } catch (e) { await this.supervisor.stop(session); return { status: options.signal?.aborted ? 'cancelled' : 'failed', reportedModel: 'unknown', error: e.message }; }
    finally { options.signal?.removeEventListener('abort', abort); this.live = null; }
  }
  start() {
    const { p, t, g } = this.valid();
    const previousRun = this.work.read().runs.find(r => r.id === t.runId);
    const retry = t.status === 'working' && previousRun && ['failed','timeout','output-limit'].includes(previousRun.status) && !this.work.active.size;
    if ((!retry && t.status !== 'ready') || !t.approval || t.approval.planRevision !== t.planRevision) fail('PM must approve this plan revision');
    const task = this.work.assertCurrent(t.plan.taskId, t.plan.requirementRevision); this.assertScope(task, p, g);
    if (digest(require('./work').sourceInventory(task.workspace)) !== t.approval.snapshotHash) fail('Readiness source changed; propose and approve again');
    if (g.usedRuns >= g.maxRuns) fail('Run cap reached');
    this.reserve(1);
    this.pm.update(p => { p.grant.usedRuns++; p.attempts++; if (!p.team.startedAt) { p.team.startedAt = this.pm.now(); p.team.endsAt = g.team.durationMinutes === null ? null : this.pm.now() + g.team.durationMinutes * 60000; } p.team.status = 'working'; });
    let run;
    try { run = this.work.start(task.id, g.profileId, { runner: options => this.execute(options), settled: id => {
      try {
        const r = this.work.read().runs.find(x => x.id === id);
        const { g } = this.valid(); if (!['reported','cancelled','integrated'].includes(r.status) && (g.usedRuns >= g.maxRuns || g.usedInvocations >= g.team.maxInvocations || ['rejected','interrupted'].includes(r.status))) this.signal('blocker', 'run-settled:' + id, { runId: id, runStatus: r.status });
      } catch {} // revocation/restart has already retained the outcome in WorkManager
    } }); } catch (e) { this.pm.update(p => { p.team.status = 'ready'; }); throw e; }
    this.work.update(d => { const r = d.runs.find(r => r.id === run.id); r.pmId = p.id; r.pmGoalRevision = p.goalRevision; r.pmGrantId = g.id; r.logicalSlot = t.slot; r.runtimeGeneration = t.generation; r.sessions = [{ generation: t.generation, model: r.requestedModel, kind: 'execution', costUsd: null, usage: null }]; });
    this.pm.update(p => { p.team.runId = run.id; p.team.sessions.push({ generation: t.generation, model: run.requestedModel, startedAt: this.pm.now() }); });
    return { runId: run.id, slot: t.slot, generation: t.generation };
  }
  checkpoint(input) {
    const { t, g } = this.valid(), run = this.work.read().runs.find(r => r.id === t.runId);
    if (!run || run.status !== 'running' || !this.live || t.swap && !['completed','failed'].includes(t.swap.status)) fail('A live managed writer and no pending swap are required');
    this.work.assertCurrent(run.taskId, run.requirementRevision);
    if (input.taskId !== run.taskId || input.requirementRevision !== run.requirementRevision || input.planRevision !== t.planRevision || input.baseRevision !== run.baseRevision) fail('Checkpoint revisions do not match');
    if (changes(run.before, require('./work').sourceInventory(run.source)).length) fail('Source changed before checkpoint');
    const snapshot = inventory(run.workspace);
    if (changes(run.before, snapshot).some(c => !g.writePaths.some(w => c.file === w || c.file.startsWith(w + '/')))) fail('Checkpoint contains changes outside scope');
    const wip = changes(run.before, snapshot);
    if (wip.length > 1) fail('This execution lane supports a single changed file; reconcile multi-file WIP manually');
    // Optional caller delta at this work milestone. Omission is unknown, while
    // explicit empty arrays mean the caller recorded no attempts/blockers.
    // These are short outcomes/decisions, never private reasoning or authority.
    let continuation;
    if (input.continuation !== undefined) {
      const value = input.continuation;
      if (!value || !['failedAttempts', 'blockers'].every(k => Array.isArray(value[k]) && value[k].length <= 10)) fail('Continuation needs explicit failedAttempts and blockers arrays (0–10)');
      continuation = {
        failedAttempts: value.failedAttempts.map(a => ({ attempt: this.pm.text(a?.attempt, 1000), outcome: this.pm.text(a?.outcome, 1000), avoid: this.pm.text(a?.avoid, 1000) })),
        blockers: value.blockers.map(b => ({ issue: this.pm.text(b?.issue, 1000), resolution: this.pm.text(b?.resolution, 1000) })),
      };
    }
    const data = { schema: 'agent-meeting/checkpoint@1', revision: (t.checkpoint?.revision || 0) + 1, wip, goalRevision: t.goalRevision, planRevision: t.planRevision, taskId: run.taskId, requirementRevision: run.requirementRevision, runId: run.id, slot: t.slot, generation: t.generation + 1, baseRevision: run.baseRevision, workspace: run.workspace, snapshot, acceptance: this.pm.read().acceptance, scope: g.writePaths,
      decisions: this.pm.text(input.decisions, 8000), unknowns: this.pm.text(input.unknowns, 4000), next: this.pm.text(input.next, 4000), ...(continuation ? { continuation } : {}), evidence: run.evidence || [], at: this.pm.now() };
    const checkpoint = { ...data, hash: digest(data) };
    this.pm.update(p => { p.team.checkpoint = checkpoint; }); return checkpoint;
  }
  async swap(input, { internal = false } = {}) {
    const { t, g } = this.valid(), c = t.checkpoint;
    if (this.pending || t.swap && !['completed','failed'].includes(t.swap.status) || !this.live || !c || c.hash !== input.checkpointHash || c.generation !== t.generation + 1 || c.planRevision !== t.planRevision || t.status !== 'working' || t.swapsUsed >= g.team.maxSwaps) fail('Invalid/stale checkpoint or swap cap');
    if (!g.team.profiles.includes(input.profileId)) fail('Successor model/profile is outside allowlist');
    const profile = this.work.profile(this.work.configStore.read(), input.profileId);
    if (profile.adapter !== 'claude' || !this.work.environment().some(o => o.profileId === input.profileId && o.modelVerified && o.reportedModel === profile.m.providerModelId)) fail('Successor readiness/model access unverified');
    const originalRun = this.work.read().runs.find(r => r.id === c.runId);
    const task = this.work.assertCurrent(originalRun.taskId, originalRun.requirementRevision);
    this.assertScope(task, this.pm.read(), g);
    const observation = this.work.environment().find(o => o.profileId === input.profileId);
    const decision = require('./routing').recommend(this.work.configStore.read(), { ...task, taskId: task.id, lockedProfileId: input.profileId, revision: originalRun.baseRevision }, [{ ...observation, tools: [], permissions: [], workspace: { revision: originalRun.baseRevision, writePaths: task.writePaths }, locks: [] }]);
    if (!decision.candidates.some(c => c.profileId === input.profileId)) fail('Routing constraints reject successor profile');
    if (originalRun.decision?.review?.required) decision.review.required = true;
    const sourceCurrent = () => !changes(originalRun.before, require('./work').sourceInventory(originalRun.source)).length;
    if (!sourceCurrent() || digest(inventory(c.workspace)) !== digest(c.snapshot)) fail('Source or workspace changed since checkpoint');
    this.reserve(2); // bootstrap and continuation, including failed bootstrap
    const token = crypto.randomBytes(32).toString('base64url');
    this.pm.update(p => { p.team.swapsUsed++; p.team.swap = { id: crypto.randomUUID(), status: 'preparing', checkpointHash: c.hash, generation: c.generation, model: profile.m.providerModelId }; });
    this.work.update(d => { d.runs.find(r => r.id === c.runId).sessions.push({ generation: c.generation, model: profile.m.providerModelId, reportedModel: 'unknown', kind: 'bootstrap', status: 'preparing', usage: null, costUsd: null, checkpointHash: c.hash }); });
    const old = this.live, nextOptions = { ...old.options, adapter: profile.adapter, modelId: profile.m.providerModelId, prompt: JSON.stringify({ purpose: 'continue-same-slot', checkpoint: this.contextFor(c), runtimeControl: { ...JSON.parse(old.options.prompt).runtimeControl, profileId: input.profileId }, runtimeInstruction: JSON.parse(old.options.prompt).runtimeInstruction, rules: ['Preserve WIP, acceptance and scope.', 'Do not commit, push, deploy or change settings.', 'Return changes and evidence for independent verification.'] }) };
    let pending, fence = false;
    try {
      const { signal } = nextOptions;
      pending = this.supervisor.open(nextOptions, this.contextFor(c)); this.pending = pending;
      const ready = await pending.ready;
      if (ready.checkpointHash !== c.hash || ready.generation !== c.generation || ready.model !== profile.m.providerModelId) fail('Successor acknowledgement mismatch');
      this.work.update(d => { const entry = d.runs.find(r => r.id === c.runId).sessions.find(x => x.kind === 'bootstrap' && x.checkpointHash === c.hash); Object.assign(entry, { status: 'ready', reportedModel: ready.model, usage: ready.usage ?? null, costUsd: ready.costUsd ?? null }); });
      this.valid();
      if (!sourceCurrent() || this.live !== old || old.session.stopped || signal?.aborted || digest(inventory(c.workspace)) !== digest(c.snapshot) || this.get().checkpoint.hash !== c.hash) fail('Writer/checkpoint changed during successor readiness');
      this.pm.update(p => { p.team.swap.status = 'quiescing'; });
      // Set the handoff fence before awaiting exit; the run loop must not report
      // the intentionally cancelled old generation as a terminal task result.
      old.replacement = { session: pending, options: nextOptions, waiting: true }; fence = true;
      const stopped = await this.supervisor.stop(old.session);
      this.work.update(d => { const entry = d.runs.find(r => r.id === c.runId).sessions.find(x => x.kind === 'bootstrap' && x.checkpointHash === c.hash); Object.assign(entry, { status: 'ready', reportedModel: ready.model, usage: ready.usage ?? null, costUsd: ready.costUsd ?? null }); });
      this.valid();
      if (!sourceCurrent() || digest(inventory(c.workspace)) !== digest(c.snapshot)) fail('Writer changed WIP while quiescing; checkpoint again after reconciliation');
      this.work.update(d => { const r = d.runs.find(r => r.id === c.runId); r.runtimeGeneration = c.generation; r.initialProfileId ||= r.profileId; r.profileId = input.profileId; r.adapter = profile.adapter; r.decision = decision; r.requestedModel = profile.m.providerModelId; r.sessions.find(x => x.kind === 'bootstrap' && x.checkpointHash === c.hash).stopped = stopped; r.sessions.push({ generation: c.generation, model: profile.m.providerModelId, reportedModel: 'unknown', kind: 'execution', usage: null, costUsd: null }); });
      this.pm.update(p => { const t = p.team; t.generation = c.generation; if (!internal) t.tokenHash = digest(token); t.swap.status = 'completed'; t.swap.stopped = stopped; t.sessions.push({ generation: t.generation, model: profile.m.providerModelId, checkpointHash: c.hash, startedAt: this.pm.now() }); this.pm.event(p, 'team-swap', 'supervisor', { slot: t.slot, runtimeGeneration: t.generation }); });
      old.replacement.waiting = false; old.replacement.release?.();
      this.pending = null;
      return { token, slot: t.slot, generation: c.generation, checkpointHash: c.hash, stopped };
    } catch (e) {
      if (pending) await this.supervisor.stop(pending);
      this.work.update(d => { const entry = d.runs.find(r => r.id === c.runId)?.sessions.find(x => x.kind === 'bootstrap' && x.checkpointHash === c.hash); if (entry) { entry.status = 'failed'; entry.error = e.message; } });
      if (fence) { old.replacement.failed = true; old.replacement.waiting = false; old.replacement.release?.(); }
      this.pm.update(p => { if (p.team?.swap) { p.team.swap.status = 'failed'; p.team.swap.error = e.message; } });
      this.pending = null; e.status ||= 409; throw e;
    }
  }
  async command(token, action, input = {}) {
    const { t } = this.auth(token, action === 'state' ? this.get()?.generation : input.generation);
    if (action === 'state') return this.view();
    if (action === 'join') {
      if (t.status !== 'invited') return this.view();
      this.pm.update(p => { p.team.identity = { name: this.pm.text(input.name, 40), model: this.pm.text(input.model, 120) }; p.team.status = 'planning'; }); return this.view();
    }
    if (action === 'propose') return this.createPlan(input);
    if (action === 'run') return this.start();
    if (action === 'checkpoint') return this.contextFor(this.checkpoint(input));
    if (action === 'swap') return this.swap(input);
    if (action === 'blocker') return this.signal('blocker', input.key);
    const run = this.work.read().runs.find(r => r.id === t.runId);
    if (['verify','integrate','submit'].includes(action)) {
      if (!run || run.id !== input.runId) fail('Run is outside this slot');
      this.work.assertCurrent(run.taskId, run.requirementRevision);
      if (action !== 'submit') {
        await this.work[action](run.id); this.valid();
        const current = this.work.read().runs.find(r => r.id === run.id);
        if (['failed','cancelled'].includes(current.status)) this.signal('blocker', action + ':' + run.id, { runId: run.id });
        return this.view();
      }
      if (run.status === 'integrated' && changes(run.verifiedSnapshot, require('./work').sourceInventory(run.source)).length) fail('Integrated source changed before result submission');
      if (run.status !== 'integrated' || !run.integrationEvidence?.length || run.integrationEvidence.some(e => e.exitCode !== 0)) fail('Result requires independent tests on integrated source');
      return this.signal('result', run.id, { runId: run.id, taskId: run.taskId, evidence: run.integrationEvidence.map(e => ({ command: e.command, exitCode: e.exitCode, checkedAt: e.checkedAt })) });
    }
    fail('Unsupported team operation');
  }
  async cancel() { this.readiness?.abort(); const sessions = [this.live?.session, this.pending].filter(Boolean); await Promise.all(sessions.map(s => this.supervisor.stop(s))); }
  close() { this.closed = true; this.readiness?.abort(); return this.supervisor.close().catch(() => {}); }
}
module.exports = { TeamController };
