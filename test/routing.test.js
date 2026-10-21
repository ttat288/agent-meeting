'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const routing = require('../src/routing');
function fixture() {
  const c = routing.defaults();
  for (const m of c.models) { m.enabled = true; m.verification = 'verified'; m.providerModelId = `test-${m.id}`; m.source.checkedAt = '2026-10-21T00:00:00Z'; m.source.confidence = 'observed'; }
  for (const p of c.profiles) p.enabled = true;
  const env = c.profiles.map(p => ({ profileId: p.id, providerModelId: `test-${p.modelId}`, available: true, modelVerified: true, quotaAvailable: true, checkedAt: '2026-10-21T00:00:00Z', tools: ['shell'], permissions: ['read', 'write'], workspace: { revision: 'abc', writePaths: ['src'] }, locks: [] }));
  return { c, env };
}
test('source preserved exactly; unverified preferred model names cannot execute', () => {
  const c = routing.defaults(); assert.equal(routing.validate(c), c);
  const bytes = fs.readFileSync(path.join(__dirname, '../src/defaults/routing-source.md'));
  assert.equal(c.source.sha256, crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.equal(routing.recommend(c, {}).outcome, 'no-candidate');
  assert(c.models.every(m => !m.enabled && m.providerModelId === null && m.source.confidence === 'hypothesis'));
  assert(c.models.every(m => m.strengths.length && m.limitations.length && m.outputContract.length));
  assert.equal(c.policy.matrix.length, 12); assert.equal(c.policy.qualityRules.filter(s => /^\d+\./.test(s)).length, 10);
});
test('validation rejects unsafe activation, duplicate refs and malformed complete profiles', () => {
  const c = routing.defaults(); c.models[0].enabled = true; assert.throws(() => routing.validate(c), /verified/);
  c.models[0].enabled = false; c.profiles[0].modelId = 'unknown'; assert.throws(() => routing.validate(c), /unknown/);
  const f = fixture(); f.c.models[0].costTier = 'toString'; assert.throws(() => routing.validate(f.c), /costTier/);
  const d = routing.defaults(); delete d.models[0].limitations; assert.throws(() => routing.validate(d), /limitations/);
});
test('bounded pagination and profile provenance; defaults do not mutate', () => {
  const c = routing.defaults(); const first = routing.listProfiles(c, { limit: 2 });
  assert.equal(first.items.length, 2); assert.equal(first.nextOffset, 2); assert.equal(first.truncated, true);
  assert.equal(routing.listProfiles(c, { offset: 2 }).items.length, 1);
  assert.equal(routing.getProfile(c, 'absent').found, false);
  const p = routing.getProfile(c, 'astra-codex'); assert.equal(p.access, 'unknown'); assert.equal(p.model.source.confidence, 'hypothesis');
  p.model.label = 'changed'; assert.notEqual(routing.defaults().models[1].label, 'changed');
  assert.throws(() => routing.listProfiles(c, { limit: 100 }), /pagination/);
  assert(Buffer.byteLength(JSON.stringify(first)) < routing.MAX_BYTES);
});
test('hard runtime access checks precede capability preferences', () => {
  const { c, env } = fixture(); env[1].available = false;
  const r = routing.recommend(c, { kind: 'coding', requiredCapabilities: ['coding'] }, env);
  assert.equal(r.outcome, 'no-candidate'); assert(r.rejected.find(x => x.profileId === 'astra-codex').reasons.includes('runtime-unavailable'));
  env[1].available = true; env[1].modelVerified = false;
  assert.equal(routing.recommend(c, { requiredCapabilities: ['coding'] }, env).outcome, 'no-candidate');
  env[1].modelVerified = true; env[1].providerModelId = 'wrong-alias';
  assert.equal(routing.recommend(c, { requiredCapabilities: ['coding'] }, env).outcome, 'no-candidate');
});
test('required tools, permissions, budget, revision and shared write locks reject candidates', () => {
  const { c, env } = fixture();
  const task = { kind: 'coding', requiredCapabilities: ['coding'], requiredTools: ['shell'], requiredPermissions: ['write'], writePaths: ['src/routing.js'], revision: 'abc' };
  assert.equal(routing.recommend(c, task, env).candidates[0].profileId, 'astra-codex');
  for (const [field, value, reason] of [['tools', [], 'tool-missing:shell'], ['permissions', [], 'permission-missing:write'], ['quotaAvailable', false, 'quota-unavailable']]) {
    const altered = structuredClone(env); altered[1][field] = value;
    assert(routing.recommend(c, task, altered).rejected.find(x => x.profileId === 'astra-codex').reasons.includes(reason));
  }
  env[1].locks = [{ path: 'src', owner: 'other-task' }]; assert.equal(routing.recommend(c, task, env).outcome, 'no-candidate');
  env[1].locks = []; env[1].workspace.revision = 'old'; assert.equal(routing.recommend(c, task, env).outcome, 'no-candidate');
  assert.equal(routing.recommend(c, { requiredCapabilities: ['coding'], budget: { maxCostTier: 'low' } }, env).outcome, 'no-candidate');
});
test('retain context and lock conflicts never silently fallback; unknown classification does not exclude', () => {
  const { c, env } = fixture();
  const r = routing.recommend(c, { kind: 'not-yet-classified', currentProfileId: 'astra-codex' }, env);
  assert.equal(r.outcome, 'retain-direct'); assert.equal(r.classificationUnknown, true); assert.equal(r.candidates.length, 3);
  assert.equal(routing.recommend(c, { lockedProfileId: 'unavailable' }, env).outcome, 'no-candidate');
  const noEnv = routing.recommend(c, {}); assert.equal(noEnv.outcome, 'no-candidate'); assert(noEnv.unknowns.length);
});
test('review rules and evidence contract are explicit without claiming acceptance', () => {
  const { c, env } = fixture();
  const r = routing.recommend(c, { risk: 'high', scope: 'large', reviewReasons: ['architecture'] }, env);
  assert.equal(r.review.required, true); assert.deepEqual(r.review.reasons, ['architecture', 'high-error-cost', 'large-scope']);
  const handoff = Object.fromEntries(routing.HANDOFF_FIELDS.map(f => [f, ['objective', 'scope'].includes(f) ? 'A bounded task' : []]));
  assert.equal(routing.validateHandoff(handoff), handoff); delete handoff.evidence;
  assert.throws(() => routing.validateHandoff(handoff), /evidence/);
});
test('modality, host and workspace identity are hard constraints; parent traversal rejected', () => {
  const { c, env } = fixture();
  assert.equal(routing.recommend(c, { requiredModalities: ['video'] }, env).candidates[0].profileId, 'flash-gemini');
  assert.equal(routing.recommend(c, { hostId: 'another-host' }, env).outcome, 'no-candidate');
  assert.equal(routing.recommend(c, { workspaceId: 'another-workspace' }, env).outcome, 'no-candidate');
  assert.throws(() => routing.recommend(c, { writePaths: ['src/../secret'] }, env), /traversal/);
});
