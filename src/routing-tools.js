'use strict';
const routing = require('./routing');
const runtime = require('./runtime');
const path = require('path');
const { ConfigStore } = require('./config-store');
function observationStore(store) {
  return new ConfigStore({ dir: path.join(store.dir, 'runtime-observations'), defaults: () => ({ schema: 'agent-meeting/observations@1', revision: 1, observations: [] }), validate: d => { if (d.schema !== 'agent-meeting/observations@1' || !Array.isArray(d.observations) || d.observations.length > 100) throw new Error('Invalid runtime observations'); } });
}
function currentEnvironment(config, observations, now = Date.now()) {
  const latest = new Map();
  for (const o of observations) {
    const profile = o && config.profiles.find(p => p.id === o.profileId);
    const checked = Date.parse(o?.checkedAt), age = now - checked;
    if (!profile || o.configRevision !== config.revision || profile.runtimeId !== o.runtimeId || !(age >= 0 && age < 30 * 60000)) continue;
    const previous = latest.get(o.profileId);
    // Callers place the shared persisted copy last, so it wins timestamp ties.
    if (!previous || checked >= Date.parse(previous.checkedAt)) latest.set(o.profileId, o);
  }
  return [...latest.values()];
}
function savedEnvironment(store, config) {
  if (!store.dir) return [];
  return currentEnvironment(config, observationStore(store).read().observations);
}
// Deliberately separate from server.TOOLS/connect.ALLOWED. No execution or writes.
const object = { type: 'object', properties: {} };
const TOOLS = [
  { name: 'list_profiles', description: 'Bounded model/runtime catalog with revision and unknown access.', inputSchema: { ...object, properties: { offset: { type: 'integer' }, limit: { type: 'integer' } } } },
  { name: 'get_profile', description: 'Read one profile and its sourced capability claims.', inputSchema: { ...object, properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'recommend_profile', description: 'Filter hard constraints before ranking; unknown access may yield no candidate. Runtime evidence comes from local saved probes, never from task input.', inputSchema: { ...object, properties: { task: { type: 'object' } }, required: ['task'] } },
  { name: 'check_runtime', description: 'Check built-in executable/version only. This does not verify model access.', inputSchema: { ...object, properties: { adapter: { type: 'string', enum: ['claude', 'agy'] } }, required: ['adapter'] } },
].map(t => ({ ...t, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } }));
function query(store, name, args = {}, environment) {
  if (name === 'check_runtime') return runtime.checkRuntime(args.adapter);
  const config = store.read();
  switch (name) {
    case 'list_profiles': return routing.listProfiles(config, args);
    case 'get_profile': return routing.getProfile(config, args.id);
    case 'recommend_profile': return routing.recommend(config, args.task || {}, environment || savedEnvironment(store, config));
    default: throw new Error('Unknown routing tool');
  }
}
module.exports = { TOOLS, query, observationStore, savedEnvironment, currentEnvironment };
