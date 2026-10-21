'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const { TOOLS, query } = require('../src/routing-tools');
const { TOOLS: conversationTools } = require('../src/server');
const { ALLOWED } = require('../src/connect');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-meeting-routing-tools-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'config');
  const store = new ConfigStore({ dir, defaults: routing.defaults, validate: routing.validate });
  const env = { ...process.env, HOME: root, AGENT_MEETING_HOME: path.join(root, 'home'),
    AGENT_MEETING_USER_HOME: root, AGENT_MEETING_CONFIG_DIR: dir, NODE_OPTIONS: '--max-old-space-size=192' };
  return { root, dir, store, env };
}
function cli(env, args = [], input) {
  return spawnSync(process.execPath, [path.join(__dirname, '../bin/routing.js'), ...args],
    { env, input, encoding: 'utf8', timeout: 10000, maxBuffer: 256 * 1024 });
}

test('routing tool registry stays separate from room tools and auto-allow permissions', () => {
  const roomNames = new Set(conversationTools.map(tool => tool.name));
  assert.deepEqual(TOOLS.map(tool => tool.name).sort(), ['check_runtime', 'get_profile', 'list_profiles', 'recommend_profile']);
  for (const tool of TOOLS) {
    assert.equal(roomNames.has(tool.name), false, tool.name);
    assert.equal(ALLOWED.includes(tool.name), false, tool.name);
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.equal(tool.annotations.openWorldHint, false);
  }
  assert.equal(ALLOWED.includes('send_file'), false);
  assert(TOOLS.every(tool => !/execute|run_cli|write_config/.test(tool.name)));
});

test('queries read the same persisted configuration and revision on each call', t => {
  const { store } = fixture(t);
  const original = query(store, 'list_profiles', { limit: 1 });
  assert.equal(original.revision, 1);
  assert.equal(original.items.length, 1);
  assert.equal(original.items[0].access, 'unknown');
  assert(original.nextOffset > 0);
  const config = store.read();
  config.profiles[0].label = 'Edited through the shared store';
  store.save(config, 1);
  const detail = query(store, 'get_profile', { id: config.profiles[0].id });
  assert.equal(detail.revision, 2);
  assert.equal(detail.profile.label, 'Edited through the shared store');
  assert.equal(detail.access, 'unknown');
  assert.equal(original.revision, 1);
  assert(Buffer.byteLength(JSON.stringify(detail)) <= routing.MAX_BYTES);
});

test('unknown access yields no candidate; task-supplied environment cannot self-authorize', t => {
  const { store } = fixture(t);
  const result = query(store, 'recommend_profile', { task: { kind: 'coding',
    environment: [{ available: true, quotaAvailable: true, modelVerified: true }] } });
  assert.equal(result.outcome, 'no-candidate');
  assert.equal(result.candidates.length, 0);
  assert.equal(result.fallback, 'explicit-decision-required');
  assert(result.unknowns.length > 0);
  assert(Buffer.byteLength(JSON.stringify(result)) <= routing.MAX_BYTES);
  assert.throws(() => query(store, 'run_cli', { adapter: 'agy' }), /Unknown routing tool/);
  assert.throws(() => query(store, 'check_runtime', { adapter: 'custom-command' }), /Unsupported adapter/);
  assert.throws(() => query(store, 'list_profiles', { limit: 1000 }), /pagination/);
});

test('standalone CLI works without a room and never creates config/default home files on lookup', t => {
  const { root, dir, env } = fixture(t);
  const result = cli(env);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.schema, routing.SCHEMA);
  assert.equal(data.revision, 1);
  assert(data.items.length <= 3);
  assert(data.items.every(item => item.access === 'unknown'));
  assert.equal(fs.existsSync(dir), false);
  assert.deepEqual(fs.readdirSync(root), []);
  const recommendation = cli(env, ['recommend_profile', '{"task":{"kind":"coding"}}']);
  assert.equal(recommendation.status, 0, recommendation.stderr);
  assert.equal(JSON.parse(recommendation.stdout).outcome, 'no-candidate');
  assert(Buffer.byteLength(recommendation.stdout) < routing.MAX_BYTES);
});

test('standalone CLI reports invalid operations without success JSON', t => {
  const { env } = fixture(t);
  for (const args of [['run_cli'], ['list_profiles', '{broken'], ['list_profiles', '{"limit":1000}']]) {
    const result = cli(env, args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert(result.stderr.trim());
  }
});

test('stdio lookup initializes, lists bounded tools, and recommends without joining a room', t => {
  const { env, dir } = fixture(t);
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_profiles', arguments: { limit: 1 } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'recommend_profile', arguments: { task: { kind: 'coding' } } } },
  ];
  const result = cli(env, ['--stdio'], requests.map(value => JSON.stringify(value)).join('\n') + '\n');
  assert.equal(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(responses.map(response => response.id), [1, 2, 3, 4]);
  assert.equal(responses[0].result.serverInfo.name, 'agent-meeting-routing');
  assert.deepEqual(responses[1].result.tools.map(tool => tool.name), TOOLS.map(tool => tool.name));
  const page = JSON.parse(responses[2].result.content[0].text);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].access, 'unknown');
  const recommendation = JSON.parse(responses[3].result.content[0].text);
  assert.equal(recommendation.outcome, 'no-candidate');
  assert.equal(recommendation.revision, page.revision);
  assert(result.stdout.length < 32 * 1024);
  assert.equal(fs.existsSync(dir), false);
});

test('stdio invalid JSON and unknown tools return errors while later requests remain usable', t => {
  const { env } = fixture(t);
  const input = '{broken\n' + JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'run_cli' } }) + '\n' +
    JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'ping' }) + '\n';
  const result = cli(env, ['--stdio'], input);
  assert.equal(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(responses[0].id, null);
  assert(responses[0].error);
  assert.equal(responses[1].id, 7);
  assert.match(responses[1].error.message, /Unknown routing tool/);
  assert.deepEqual(responses[2], { jsonrpc: '2.0', id: 8, result: {} });
});
test('saved runtime probes are shared with standalone lookup and expire on configuration revision', t => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-probe-shared-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const c = routing.defaults(), m = c.models.find(m=>m.id==='opus'); Object.assign(m,{enabled:true,verification:'verified',providerModelId:'claude-opus-5-5',source:{...m.source,checkedAt:new Date().toISOString(),confidence:'observed'}});c.profiles.find(p=>p.id==='opus-claude').enabled=true;
 const store=new ConfigStore({dir,defaults:()=>c,validate:routing.validate}); const observations=require('../src/routing-tools').observationStore(store);const snapshot=observations.read();snapshot.observations.push({profileId:'opus-claude',providerModelId:'claude-opus-5-5',runtimeId:'claude-code',configRevision:1,available:true,modelVerified:true,quotaAvailable:true,checkedAt:new Date().toISOString(),tools:[],permissions:[]});observations.save(snapshot,1);
 assert.equal(query(store,'recommend_profile',{task:{kind:'review'}}).candidates[0].profileId,'opus-claude'); const next=store.read();next.policy.maxCandidates=2;store.save(next,1);assert.equal(query(store,'recommend_profile',{task:{}}).outcome,'no-candidate');
});
