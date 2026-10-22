'use strict';
// Scoped coordinator capability. WorkManager remains the only task/run/evidence store.
const crypto = require('crypto');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { checkTask, gitRevision } = require('./work');
const { findSecret } = require('./meeting');
const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const evidenceSummary = entries => (entries || []).map(({ output, ...entry }) => ({ ...entry, ...(entry.exitCode !== 0 || entry.error || entry.timeout ? { output: (output || '').slice(-4000) } : {}) }));
const text = (value, max = 8000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('Text required or too long', 400);
  if (findSecret(value)) fail('Possible secret in PM message', 400);
  return value.trim();
};
class PmOperator {
  constructor(work, room, audit = () => {}, now = Date.now, sessionOptions = {}) {
    this.text = text; this.work = work; this.room = room; this.audit = audit; this.now = now;
    const p = this.read();
    if (p && !['human','revoked'].includes(p.status)) this.update(p => { p.status = 'suspended'; p.tokenHash = null; p.grant = null; this.event(p, 'restart', 'director'); });
    this.team = new (require('./team').TeamController)(this, sessionOptions);
    this.timer = setInterval(() => { try { this.expire(); } catch { this.cancelOwned(); } }, 1000); this.timer.unref();
  }
  read() { return this.work.read().pm; }
  update(fn) { this.work.update(d => { if (!d.pm) d.pm = { id: crypto.randomUUID(), status: 'human', generation: 0, goalRevision: 0, messages: [], events: [], attempts: 0 }; fn(d.pm, d); }); this.room._changed(); }
  event(p, action, actor, extra = {}) {
    if (p.events.length >= 2000) fail('PM audit full; take over and archive this session');
    const entry = { seq: p.events.length + 1, at: this.now(), actor, action, generation: p.generation, ...extra };
    p.events.push(entry); this.audit('pm-' + action, { pmId: p.id, generation: p.generation, ...extra });
  }
  current() {
    this.work.refreshSource?.();
    if (this.work.read().sessionCreatedAt > this.room.createdAt) fail('Meeting continued; use the current session');
  }
  cancelOwned() {
    this.team?.cancel().catch(() => {});
    const p = this.read();
    for (const run of this.work.read().runs.filter(r => r.pmId === p?.id && this.work.active.has(r.id))) this.work.cancel(run.id);
  }
  suspend(status, actor = 'director') {
    this.update(p => { p.status = status; p.grant = null; if (['revoked','human','lost'].includes(status)) { p.tokenHash = null; p.generation++; } if (p.team) { p.team.status = 'paused'; p.team.tokenHash = null; p.team.approval = null; } this.event(p, status, actor); });
    this.cancelOwned();
  }
  expire() {
    const p = this.read();
    if (p?.status === 'active' && ((!p.grant?.team && p.leaseUntil <= this.now()) || p.grant && p.grant.expiresAt <= this.now() || p.team?.endsAt && p.team.endsAt <= this.now())) {
      if (p.team) this.update(p => { const t = p.team; t.events.push({ id: hash('guard:' + t.id), kind: 'guard', key: 'Session/grant expired; checkpoint and director decision required', goalRevision: p.goalRevision, planRevision: t.planRevision, at: this.now(), acked: false }); });
      this.suspend('lost', 'system');
    }
  }
  state(after = 0, forPm = false) {
    this.expire(); const p = this.read();
    if (!p) return { status: 'human' };
    const { tokenHash, ...safe } = p;
    const data = this.work.read(), tasks = data.tasks.filter(t => t.pmId === p.id && (!forPm || t.pmGoalRevision === p.goalRevision));
    const runs = data.runs.filter(r => r.pmId === p.id && (!forPm || r.pmGoalRevision === p.goalRevision)).map(r => ({ id: r.id, taskId: r.taskId, requirementRevision: r.requirementRevision, status: r.status, requestedModel: r.requestedModel, reportedModel: r.reportedModel, usage: r.usage ?? null, costUsd: r.costUsd ?? null, error: r.error || null, changes: r.changes, evidence: evidenceSummary(r.evidence), integrationEvidence: evidenceSummary(r.integrationEvidence), report: r.report, rollback: r.rollback }));
    return { ...safe, ...(p.team ? { team: this.team.safe() } : {}), ...(forPm ? { events: p.events.slice(-10) } : {}), messages: p.messages.filter(m => m.seq > after), tasks, runs, pmUsage: { usage: null, costUsd: null, provenance: 'External PM CLI; billing not observed by server' }, limits: ['Local managed execution only', 'Single-file integration', 'Independent test verification; required expert review blocks integration', 'Filesystem write isolation; no secret/network isolation', 'Run/invocation caps are not a monetary hard cap; external PM and lead CLI billing is unobserved', 'Managed team: restart invalidates capabilities; pending events remain; no automatic model resume'] };
  }
  invite() {
    this.current();
    if (!this.read()?.identity && (this.room._present().length || this.room.pending.size)) fail('PM must join before workers; use a new empty meeting');
    if (this.work.active.size) fail('Cancel or reconcile existing work first');
    const token = crypto.randomBytes(32).toString('base64url');
    this.update(p => { p.generation++; p.status = 'invited'; p.tokenHash = hash(token); p.inviteUntil = this.now() + 10 * 60000; p.grant = null; p.identity = null; this.event(p, 'invite', 'director'); });
    return { token, generation: this.read().generation };
  }
  authenticate(token, pending = false) {
    this.current(); this.expire(); const p = this.read();
    if (!token || !p?.tokenHash || !crypto.timingSafeEqual(Buffer.from(hash(token)), Buffer.from(p.tokenHash))) fail('Invalid PM capability', 401);
    if (['invited','pending'].includes(p.status) && p.inviteUntil <= this.now()) fail('PM invitation expired', 401);
    if (!pending && !['active','paused'].includes(p.status)) fail('PM is not approved', 403);
    if (p.status === 'active' && p.leaseUntil < this.now() + 90000) { this.update(p => { p.leaseUntil = this.now() + 120000; }); return this.read(); }
    return p;
  }
  join(token, input) {
    const p = this.authenticate(token, true);
    if (p.status === 'pending') return { status: p.status, code: p.code, identity: p.identity };
    if (p.status !== 'invited') fail('PM already joined; read state with the existing capability');
    const identity = { name: text(input.name, 40), model: text(input.model, 120) };
    const code = String(crypto.randomInt(1000, 10000));
    this.update(p => { p.status = 'pending'; p.identity = identity; p.code = code; this.event(p, 'join', 'pm'); });
    return { status: 'pending', code, identity };
  }
  approve(input) {
    const p = this.read();
    if (p?.status !== 'pending' || p.code !== String(input.code) || p.generation !== input.generation || p.inviteUntil <= this.now()) fail('Pending PM or confirmation code changed');
    this.update(p => { p.status = 'active'; p.leaseUntil = this.now() + 120000; this.event(p, 'approve', 'director'); });
  }
  goal(input) {
    this.current(); const objective = text(input.goal);
    if (!Array.isArray(input.acceptance) || !input.acceptance.length || input.acceptance.length > 40) fail('Acceptance criteria required', 400);
    const acceptance = input.acceptance.map(s => text(s, 4000));
    this.update((p, d) => {
      if (!['active','paused'].includes(p.status)) fail('Approve PM first');
      if (p.team) { p.team.status = 'suspended'; p.team.tokenHash = null; p.team.approval = null; }
      p.goalRevision++; p.goal = objective; p.acceptance = acceptance; p.grant = null; p.report = null;
      for (const t of d.tasks.filter(t => t.pmId === p.id)) { t.sourceCurrent = false; t.status = 'stale'; }
      this.message(p, 'director', objective); this.event(p, 'goal', 'director', { goalRevision: p.goalRevision });
    }); this.cancelOwned();
  }
  grant(input) {
    this.current(); const p = this.read();
    if (p?.status !== 'active' || !p.goalRevision) fail('An active PM and goal are required');
    if (input.goalRevision !== p.goalRevision || input.generation !== p.generation) fail('Goal or PM generation changed; reload before granting execution');
    if (this.work.active.size || this.work.read().runs.some(r => r.status === 'interrupted')) fail('Cancel or reconcile existing work before granting execution');
    const workspace = fs.realpathSync(text(input.workspace, 4096));
    const baseRevision = execFileSync('git', ['-C', workspace, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 5000 }).trim();
    const scope = { risk: input.risk || 'low', workspace, baseRevision, writePaths: input.writePaths, testFiles: input.testFiles, profileId: text(input.profileId, 120), maxRuns: input.maxRuns, allowUnknownCost: input.allowUnknownCost === true, expiresAt: input.expiresAt };
    if (!Number.isInteger(scope.maxRuns) || scope.maxRuns < 1 || scope.maxRuns > 3 || !Number.isSafeInteger(scope.expiresAt) || scope.expiresAt <= this.now() || scope.expiresAt > this.now() + 24 * 3600000) fail('Grant needs 1–3 runs and an expiry within 24 hours', 400);
    if (input.maxCostUsd != null) fail('Monetary hard cap unavailable; do not grant execution requiring a hard spending cap', 400);
    if (!['low','high'].includes(scope.risk)) fail('Invalid review risk', 400);
    checkTask({ goal: p.goal, acceptance: p.acceptance, purpose: 'execute', ...scope });
    if (!scope.writePaths?.length || !scope.testFiles?.length) fail('Explicit write paths and independent tests required', 400);
    const config = this.work.configStore.read(), selected = this.work.profile(config, scope.profileId);
    Object.assign(scope, { configRevision: config.revision, requestedModel: selected.m.providerModelId, adapter: selected.adapter });
    if (input.team !== undefined) { scope.team = this.team.options(input.team); if (!scope.team.profiles.includes(scope.profileId)) fail('Initial profile must be in team allowlist', 400); for (const id of scope.team.profiles) this.work.profile(config, id); }
    this.update(p => { if (p.team) { p.team.status = 'suspended'; p.team.tokenHash = null; p.team.approval = null; } p.grant = { ...scope, id: crypto.randomUUID(), generation: p.generation, goalRevision: p.goalRevision, usedRuns: 0 }; p.report = null; this.event(p, 'grant', 'director'); });
  }
  message(p, actor, value) {
    if (p.messages.length >= 200) fail('Private conversation full; export before continuing');
    p.messages.push({ seq: p.messages.length + 1, at: this.now(), actor, text: text(value), goalRevision: p.goalRevision });
  }
  check(token, revision, execution = false) {
    const p = this.authenticate(token);
    if (p.status !== 'active') fail('PM is paused; director must issue a new invitation to resume');
    if (revision !== p.goalRevision) fail('Goal revision changed');
    if (execution && (!p.grant || p.grant.goalRevision !== p.goalRevision || p.grant.generation !== p.generation || p.grant.expiresAt <= this.now())) fail('Execution grant required');
    return p;
  }
  async command(token, action, input = {}) {
    if (action === 'join') return this.join(token, input);
    if (action === 'events') return this.team.wait(token, input);
    if (action === 'state' || action === 'wait') {
      this.authenticate(token, true);
      const snapshot = () => {
        const p = this.read();
        if (['invited','pending'].includes(p.status)) return { status: p.status, generation: p.generation, code: p.code, identity: p.identity };
        const state = this.state(Number(input.after) || 0, true);
        // A renewed lease is transport housekeeping, not new goal/run evidence.
        const { leaseUntil, ...content } = state;
        return { ...state, cursor: hash(JSON.stringify(content)) };
      };
      let state = snapshot();
      if (action === 'wait' && (!input.cursor || input.cursor === state.cursor)) {
        const v = this.work.read().revision;
        for (let i = 0; i < 100 && this.work.read().revision === v; i++) await new Promise(r => setTimeout(r, 250));
        this.authenticate(token, true);
        state = snapshot();
      }
      if (state.cursor && input.cursor === state.cursor) return { unchanged: true, cursor: state.cursor, status: state.status, generation: state.generation, goalRevision: state.goalRevision, leaseUntil: state.leaseUntil };
      return state;
    }
    const p = this.check(token, input.goalRevision);
    if (['team-invite','approve-plan','ack-event','chair'].includes(action)) {
      this.check(token, input.goalRevision, true);
      if (action === 'team-invite') return this.team.invite();
      if (action === 'approve-plan') return this.team.approve(input);
      if (action === 'ack-event') return this.team.ack(input);
      if (!p.grant.team?.chair) fail('Chair operation not granted');
      if (input.operation === 'start') return { ok: this.room.start(p.goal, 'Team execution has independent acceptance', { followUp: true }, []) };
      if (input.operation === 'admit' && this.room.pending.has(input.name)) return { ok: this.room.admit(input.name, input.allow !== false) };
      fail('Unsupported scoped chair operation');
    }
    if (action === 'message') { this.update(p => { this.message(p, 'pm', input.text); this.event(p, 'message', 'pm'); }); return { ok: true }; }
    if (action === 'plan') {
      if (!p.goalRevision) fail('Director goal required');
      this.check(token, input.goalRevision, true);
      const existing = this.work.read().tasks.find(t => t.pmId === p.id && t.pmGoalRevision === p.goalRevision && t.sourceCurrent !== false);
      const g = p.grant;
      if (existing) {
        if (['risk','workspace','baseRevision','writePaths','testFiles'].some(key => JSON.stringify(existing[key]) !== JSON.stringify(g[key]))) {
          const task = this.work.configureTask(existing.id, { expectedRevision: existing.requirementRevision, risk: g.risk, workspace: g.workspace, baseRevision: g.baseRevision, writePaths: g.writePaths, testFiles: g.testFiles });
          this.update(p => this.event(p, 'replan', 'pm', { taskId: task.id })); return task;
        }
        return existing;
      }
      const task = this.work.createTask({ goal: p.goal, acceptance: p.acceptance, purpose: 'execute', risk: g.risk, topology: 'local', management: 'managed', workspace: g.workspace, baseRevision: g.baseRevision, writePaths: g.writePaths, testFiles: g.testFiles, pmId: p.id, pmGoalRevision: p.goalRevision, sourceCurrent: true, origin: { kind: 'pm-goal', goalRevision: p.goalRevision, pmId: p.id, roomCreatedAt: this.room.createdAt }, facts: (input.facts || []).map(s => text(s, 4000)), unknowns: (input.unknowns || []).map(s => text(s, 4000)) });
      this.update(p => this.event(p, 'plan', 'pm', { taskId: task.id })); return task;
    }
    const data = this.work.read(), task = data.tasks.find(t => t.id === input.taskId), run = data.runs.find(r => r.id === input.runId);
    if (action === 'run') {
      if (p.grant?.team) fail('Use the approved team capability for delegated execution');
      this.check(token, input.goalRevision, true);
      if (!task || task.pmId !== p.id || task.pmGoalRevision !== p.goalRevision || task.sourceCurrent === false) fail('Task is outside this PM goal');
      const g = p.grant;
      if (this.work.configStore.read().revision !== g.configRevision) fail('Routing configuration changed; director must issue a new grant');
      if (task.goal !== p.goal || JSON.stringify(task.acceptance) !== JSON.stringify(p.acceptance)) fail('Task requirements differ from director goal');
      for (const key of ['risk','workspace','baseRevision','writePaths','testFiles']) if (JSON.stringify(task[key]) !== JSON.stringify(g[key])) fail('Task scope differs from grant');
      if (!g.allowUnknownCost) fail('Model cost is unknown; director must explicitly authorize unknown cost or use a direct CLI');
      if (g.usedRuns >= g.maxRuns) fail('PM run limit reached');
      // Reserve before dispatch; a failed launch also consumes an attempt. No hidden retries.
      this.update(p => { p.grant.usedRuns++; p.attempts++; this.event(p, 'run-request', 'pm', { taskId: task.id }); });
      const started = this.work.start(task.id, g.profileId);
      this.work.update(d => { const r = d.runs.find(r => r.id === started.id); r.pmId = p.id; r.pmGoalRevision = p.goalRevision; r.pmGrantId = g.id; });
      return this.state(0, true).runs.find(r => r.id === started.id);
    }
    if (['verify','integrate','report'].includes(action)) {
      if (!run || run.pmId !== p.id || run.pmGoalRevision !== p.goalRevision) fail('Run is outside this PM goal');
      this.work.assertCurrent(run.taskId, run.requirementRevision);
      if (run.pmGrantId !== p.grant?.id) fail('Execution grant changed; the old run is not authorized under the new grant');
      if (action !== 'report') {
        this.check(token, input.goalRevision, true);
        this.update(p => this.event(p, action + '-request', 'pm', { runId: run.id }));
        await this.work[action](run.id);
        return this.state(0, true).runs.find(r => r.id === run.id);
      }
      if (p.grant?.team && !p.team?.events.some(e => e.kind === 'result' && e.runId === run.id && e.acked)) fail('Acknowledge the team result event before PM acceptance');
      const complete = run.status === 'integrated';
      if (complete && (gitRevision(run.source) !== run.baseRevision || require('./work').changes(run.verifiedSnapshot, require('./work').sourceInventory(run.source)).length)) fail('Integrated source changed before PM acceptance');
      const report = { runId: run.id, taskId: run.taskId, goalRevision: p.goalRevision, status: complete ? 'completed' : 'blocked', summary: text(input.text), acceptance: p.acceptance, runtimeSessions: run.sessions || [], elapsedMs: run.elapsedMs ?? null, evidence: evidenceSummary(run.evidence), integrationEvidence: evidenceSummary(run.integrationEvidence), requestedModel: run.requestedModel, actualModel: run.reportedModel, usage: run.usage ?? null, costUsd: run.costUsd ?? null, pmUsage: null, pmCostUsd: null, externalLeadUsage: null, externalLeadCostUsd: null, totalCostUsd: null, limitations: this.state().limits };
      this.update(p => { p.report = report; if (p.team && complete) p.team.status = 'completed'; this.message(p, 'pm', report.summary); this.event(p, 'report', 'pm', { runId: run.id, status: report.status }); }); return report;
    }
    fail('Unsupported PM operation', 404);
  }
  host(action, input = {}) {
    this.current();
    if (action === 'invite') return this.invite();
    if (action === 'approve') this.approve(input);
    else if (action === 'goal') this.goal(input);
    else if (action === 'grant') this.grant(input);
    else if (action === 'message') this.update(p => { this.message(p, 'director', input.text); this.event(p, 'message', 'director'); });
    else if (['pause','revoke','takeover'].includes(action)) this.suspend({ pause: 'paused', revoke: 'revoked', takeover: 'human' }[action]);
    else if (action !== 'state') fail('Unsupported director operation', 404);
    return this.state();
  }
  close() { clearInterval(this.timer); return this.team?.close(); }
}
module.exports = { PmOperator };
