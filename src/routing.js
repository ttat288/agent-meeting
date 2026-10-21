'use strict';

// Pure catalog queries. Capability claims never establish runtime access.
const BASE = require('./defaults/routing.json');
const SCHEMA = 'agent-meeting/routing@1';
const MAX_BYTES = 32768;
const HANDOFF_FIELDS = Object.freeze([...BASE.handoff.requiredFields]);
const TIERS = { low: 1, medium: 2, high: 3 };
const clone = value => JSON.parse(JSON.stringify(value));
function fail(message) { throw new TypeError(`Routing: ${message}`); }
function object(value, label) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`); }
function str(value, label, max = 2000) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label} must be a nonempty string <= ${max}`); }
function strings(value, label, max = 100) { if (!Array.isArray(value) || value.length > max) fail(`${label} must be a bounded array`); value.forEach(x => str(x, label)); }
function bool(value, label) { if (typeof value !== 'boolean') fail(`${label} must be boolean`); }
function defaults() { return clone(BASE); }
function source(value, label) {
  object(value, label); str(value.kind, `${label}.kind`);
  if (!['hypothesis', 'user-configured', 'documented', 'observed'].includes(value.confidence)) fail(`${label}.confidence invalid`);
  if (value.checkedAt !== null && (typeof value.checkedAt !== 'string' || !Number.isFinite(Date.parse(value.checkedAt)))) fail(`${label}.checkedAt invalid`);
}
function validate(config) {
  object(config, 'config');
  if (config.schema !== SCHEMA) fail('unsupported schema');
  if (!Number.isSafeInteger(config.revision) || config.revision < 1) fail('revision must be positive integer');
  if (Buffer.byteLength(JSON.stringify(config)) > 524288) fail('config exceeds 512 KiB');
  const ids = {};
  for (const key of ['models', 'runtimes', 'profiles']) {
    if (!Array.isArray(config[key]) || config[key].length > 100) fail(`${key} must be array <= 100`);
    ids[key] = new Set();
    for (const entry of config[key]) {
      object(entry, key); str(entry.id, `${key}.id`, 80); str(entry.label, `${key}.label`, 160);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.id) || ids[key].has(entry.id)) fail(`duplicate or invalid ${key} id`);
      ids[key].add(entry.id);
    }
  }
  for (const m of config.models) {
    bool(m.enabled, 'model.enabled'); str(m.provider, 'model.provider', 80);
    if (!['unverified', 'verified'].includes(m.verification)) fail('invalid model verification');
    if (m.providerModelId !== null) str(m.providerModelId, 'providerModelId', 160);
    if (m.enabled && (m.verification !== 'verified' || !m.providerModelId)) fail('enabled model needs verified providerModelId');
    for (const field of ['capabilities', 'roles', 'modalities', 'strengths', 'limitations', 'outputContract']) strings(m[field], `model.${field}`);
    if (!(Object.hasOwn(TIERS, m.costTier))) fail('invalid costTier');
    source(m.source, 'model.source');
    if (m.verification === 'verified' && (!m.source.checkedAt || m.source.confidence === 'hypothesis')) fail('verified model needs dated evidence');
  }
  for (const r of config.runtimes) { strings(r.capabilities, 'runtime.capabilities'); source(r.source, 'runtime.source'); }
  for (const p of config.profiles) {
    bool(p.enabled, 'profile.enabled'); strings(p.roles, 'profile.roles');
    if (!ids.models.has(p.modelId) || !ids.runtimes.has(p.runtimeId)) fail('profile references unknown model/runtime');
  }
  object(config.policy, 'policy'); const policy = config.policy;
  if (policy.leadProfileId !== null && !ids.profiles.has(policy.leadProfileId)) fail('unknown leadProfileId');
  if (!Number.isInteger(policy.maxCandidates) || policy.maxCandidates < 1 || policy.maxCandidates > 5) fail('maxCandidates must be 1..5');
  for (const field of ['allowDelegation', 'retainContext', 'noSilentFallback', 'requireEvidence', 'noConcurrentOverlappingWrites']) bool(policy[field], `policy.${field}`);
  strings(policy.reviewRequiredFor, 'reviewRequiredFor'); object(policy.budget, 'policy.budget');
  if (policy.budget.maxCostTier !== null && !(Object.hasOwn(TIERS, policy.budget.maxCostTier))) fail('invalid policy budget');
  object(config.handoff, 'handoff'); strings(config.handoff.requiredFields, 'handoff.requiredFields');
  if (!HANDOFF_FIELDS.every(f => config.handoff.requiredFields.includes(f))) fail('handoff required fields missing');
  object(config.source, 'source'); str(config.source.path, 'source.path');
  if (!/^[a-f0-9]{64}$/.test(config.source.sha256)) fail('source sha256 invalid');
  return config;
}
function bounded(result) {
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_BYTES) fail('response exceeds 32 KiB; request smaller page/profile');
  return result;
}
function pageNumber(value, fallback, max) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0 || value > max) fail('invalid pagination');
  return value;
}
function summary(config, profile) {
  const m = config.models.find(x => x.id === profile.modelId);
  return { id: profile.id, label: profile.label, modelId: m.id, runtimeId: profile.runtimeId, enabled: profile.enabled && m.enabled, roles: profile.roles, capabilities: m.capabilities, verification: m.verification, access: 'unknown', unknowns: ['runtime-access', 'quota', 'tools', 'permissions'] };
}
function listProfiles(config, { offset, limit } = {}) {
  validate(config); offset = pageNumber(offset, 0, 100); limit = pageNumber(limit, 3, 10);
  if (limit < 1) fail('limit must be >= 1');
  const items = config.profiles.slice(offset, offset + limit).map(p => summary(config, p));
  return bounded({ schema: SCHEMA, revision: config.revision, items, total: config.profiles.length, offset, limit, truncated: offset + items.length < config.profiles.length, nextOffset: offset + items.length < config.profiles.length ? offset + items.length : null });
}
function getProfile(config, id) {
  validate(config); str(id, 'profile id', 80); const p = config.profiles.find(x => x.id === id);
  if (!p) return { schema: SCHEMA, revision: config.revision, found: false, id };
  return bounded({ schema: SCHEMA, revision: config.revision, found: true, profile: clone(p), model: clone(config.models.find(x => x.id === p.modelId)), runtime: clone(config.runtimes.find(x => x.id === p.runtimeId)), access: 'unknown', unknowns: ['runtime-access', 'quota', 'tools', 'permissions'] });
}
function pathOverlaps(a, b) {
  const norm = x => x.replace(/\\/g, '/').replace(/\/+$/, ''); a = norm(a); b = norm(b);
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
}
function validateTask(task) {
  object(task, 'task');
  for (const f of ['requiredCapabilities', 'requiredModalities', 'requiredTools', 'requiredPermissions', 'writePaths', 'reviewReasons']) if (task[f] !== undefined) strings(task[f], `task.${f}`, 30);
  for (const f of ['kind', 'currentProfileId', 'lockedProfileId', 'revision', 'hostId', 'workspaceId', 'taskId']) if (task[f] !== undefined) str(task[f], `task.${f}`, 160);
  for (const path of task.writePaths || []) if (path.split(/[\\/]/).includes('..') || path.includes('\0')) fail('writePaths must not contain parent traversal or NUL');
  if (task.budget !== undefined) { object(task.budget, 'task.budget'); if (task.budget.maxCostTier !== undefined && !(Object.hasOwn(TIERS, task.budget.maxCostTier))) fail('invalid task budget'); }
}
function recommend(config, task, environment = []) {
  validate(config); validateTask(task);
  if (!Array.isArray(environment) || environment.length > 100) fail('environment must be array <= 100');
  const candidates = [], rejected = [], unknowns = [];
  const required = f => task[f] || [];
  const reviewReasons = [...new Set([...(task.reviewReasons || []), ...(task.risk === 'high' ? ['high-error-cost'] : []), ...(task.scope === 'large' ? ['large-scope'] : [])])].filter(x => config.policy.reviewRequiredFor.includes(x));
  const budgets = [config.policy.budget.maxCostTier, task.budget?.maxCostTier].filter(Boolean).map(x => TIERS[x]);
  const ceiling = budgets.length ? Math.min(...budgets) : 3;
  for (const p of config.profiles) {
    const m = config.models.find(x => x.id === p.modelId); const r = config.runtimes.find(x => x.id === p.runtimeId);
    const e = environment.find(x => x && x.profileId === p.id); const reasons = [], missing = [];
    if (!p.enabled || !m.enabled) reasons.push('disabled');
    if (m.verification !== 'verified' || !m.providerModelId) reasons.push('model-unverified');
    if (task.lockedProfileId && p.id !== task.lockedProfileId) reasons.push('selection-locked');
    for (const modality of required('requiredModalities')) if (!m.modalities.includes(modality)) reasons.push(`modality-missing:${modality}`);
    if (TIERS[m.costTier] > ceiling) reasons.push('budget-exceeded');
    for (const cap of required('requiredCapabilities')) if (!m.capabilities.includes(cap) && !r.capabilities.includes(cap)) reasons.push(`capability-missing:${cap}`);
    if (!e) { missing.push('runtime-access', 'quota', 'tools', 'permissions'); reasons.push('environment-unknown'); }
    else {
      if (task.hostId && e.hostId !== task.hostId) reasons.push('host-mismatch');
      if (task.workspaceId && e.workspace?.id !== task.workspaceId) reasons.push('workspace-mismatch');
      if (e.available !== true) { reasons.push('runtime-unavailable'); if (e.available === undefined) missing.push('runtime-access'); }
      if (e.modelVerified !== true || e.providerModelId !== m.providerModelId) { reasons.push('model-access-unverified'); missing.push('model-access'); }
      if (e.quotaAvailable !== true) { reasons.push('quota-unavailable'); if (e.quotaAvailable === undefined) missing.push('quota'); }
      if (!e.checkedAt || !Number.isFinite(Date.parse(e.checkedAt))) { reasons.push('environment-undated'); missing.push('checkedAt'); }
      for (const tool of required('requiredTools')) if (!Array.isArray(e.tools) || !e.tools.includes(tool)) reasons.push(`tool-missing:${tool}`);
      for (const perm of required('requiredPermissions')) if (!Array.isArray(e.permissions) || !e.permissions.includes(perm)) reasons.push(`permission-missing:${perm}`);
      if (required('writePaths').length) {
        if (!e.workspace || !Array.isArray(e.workspace.writePaths)) reasons.push('workspace-unknown');
        else for (const path of task.writePaths) if (!e.workspace.writePaths.some(allowed => path === allowed || path.startsWith(allowed.replace(/\/$/, '') + '/'))) reasons.push(`write-denied:${path}`);
        if (!task.revision || e.workspace?.revision !== task.revision) reasons.push('revision-mismatch');
        if (!Array.isArray(e.locks)) reasons.push('locks-unknown');
        else for (const lock of e.locks) if (lock && typeof lock.path === 'string' && !(task.taskId && lock.owner === task.taskId) && task.writePaths.some(path => pathOverlaps(path, lock.path))) reasons.push(`write-conflict:${lock.path}`);
      }
    }
    if (missing.length) unknowns.push({ profileId: p.id, fields: missing });
    if (reasons.length) { rejected.push({ profileId: p.id, reasons: [...new Set(reasons)] }); continue; }
    const direct = p.id === task.currentProfileId && config.policy.retainContext;
    const kindMatch = m.capabilities.includes(task.kind) || p.roles.includes(task.kind);
    candidates.push({ profileId: p.id, modelId: m.id, providerModelId: m.providerModelId, runtimeId: p.runtimeId, score: (direct ? 100 : 0) + (kindMatch ? 20 : 0) + (4 - TIERS[m.costTier]), reasons: [direct ? 'retain-context' : 'eligible', ...(kindMatch ? ['task-fit-from-source-hypothesis'] : [])], checkedAt: e.checkedAt, reviewRequired: reviewReasons.length > 0, claimConfidence: m.source.confidence });
  }
  candidates.sort((a, b) => b.score - a.score || a.profileId.localeCompare(b.profileId));
  const limit = config.policy.maxCandidates; const selected = candidates.slice(0, limit);
  let outcome = selected.length ? selected[0].profileId === task.currentProfileId ? 'retain-direct' : 'candidates' : 'no-candidate';
  if (config.policy.allowDelegation === false && outcome === 'candidates') { selected.length = 0; outcome = 'no-candidate'; }
  return bounded({ schema: SCHEMA, revision: config.revision, outcome, candidates: selected, totalEligible: candidates.length, truncated: candidates.length > limit, rejected, unknowns, classificationUnknown: !task.kind || !config.models.some(m => m.capabilities.includes(task.kind)) && !config.profiles.some(p => p.roles.includes(task.kind)), review: { required: reviewReasons.length > 0, reasons: reviewReasons, independent: reviewReasons.length > 0 }, fallback: 'explicit-decision-required' });
}
function validateHandoff(value) {
  object(value, 'handoff');
  for (const field of HANDOFF_FIELDS) {
    if (!(field in value)) fail(`handoff missing ${field}`);
    if (['objective', 'scope'].includes(field)) str(value[field], `handoff.${field}`, 4000);
    else if (!Array.isArray(value[field]) || value[field].length > 100) fail(`handoff.${field} must be bounded array`);
  }
  if (Buffer.byteLength(JSON.stringify(value)) > MAX_BYTES) fail('handoff exceeds 32 KiB; reference original artifacts');
  return value;
}
module.exports = { SCHEMA, MAX_BYTES, HANDOFF_FIELDS, defaults, validate, listProfiles, getProfile, recommend, validateTask, validateHandoff };
