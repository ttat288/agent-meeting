'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/server');
const routing = require('../src/routing');

async function boot(t, cfg = {}, dir) {
  const root = dir || fs.mkdtempSync(path.join(os.tmpdir(), 'meeting-host-api-'));
  const app = createApp({ waitMs: 50, tick: 30, idleMs: 60000, configDir: path.join(root, 'config'), workDir: path.join(root, 'work'), ...cfg });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const room = app.create({ hostKey: 'test_host_work_0123456789', id: 'test_agent_work_0123456789', fixed: true });
  t.after(() => app.close());
  if (!dir) t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { app, root, room, base, url: suffix => base + '/api/host/' + room.hostKey + suffix };
}
const post = (url, data, headers = {}) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(data) });

function addModel(config) {
  config.models.push({ id: 'test-user-model', label: 'User model', provider: 'example', providerModelId: null, enabled: false, verification: 'unverified', capabilities: ['extraction'], roles: ['scout'], modalities: ['text'], strengths: ['User preference'], limitations: ['Access unknown'], outputContract: ['Evidence required'], costTier: 'low', source: { kind: 'user-supplied', path: 'test', lines: [], checkedAt: null, confidence: 'user-configured', references: [] } });
  return config;
}

test('host config shares catalog revision with routing and persists a model across app restart', async t => {
  const first = await boot(t);
  const original = await (await fetch(first.url('/config'))).json();
  assert.deepEqual(original, routing.defaults());
  const draft = addModel(structuredClone(original));
  draft.models[0].label = 'Updated model label';
  const response = await post(first.url('/config'), { config: draft, expectedRevision: original.revision });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.revision, original.revision + 1);
  assert.equal(saved.models.at(-1).id, 'test-user-model');
  const recommendation = await post(first.url('/routing/recommend'), {});
  assert.equal(recommendation.status, 200);
  assert.equal((await recommendation.json()).revision, saved.revision);
  assert.deepEqual(first.app.configStore.read(), saved);
  const disk = JSON.parse(fs.readFileSync(path.join(first.root, 'config/config.json'), 'utf8'));
  assert.deepEqual(disk, saved);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(first.root, 'config/config.json.bak'), 'utf8')), original);
  assert.equal(fs.statSync(path.join(first.root, 'config/config.json')).mode & 0o777, 0o600);
  first.app.close();
  const restarted = await boot(t, {}, first.root);
  assert.deepEqual(await (await fetch(restarted.url('/config'))).json(), saved);
  assert.equal((await (await post(restarted.url('/routing/recommend'), {})).json()).revision, saved.revision);
});

test('config CAS and invalid updates preserve the last complete snapshot', async t => {
  const { app, url } = await boot(t);
  const original = await (await fetch(url('/config'))).json();
  const firstDraft = structuredClone(original); firstDraft.models[0].label = 'Tab A';
  const saved = await (await post(url('/config'), { config: firstDraft, expectedRevision: original.revision })).json();
  const secondDraft = structuredClone(original); secondDraft.models[0].label = 'Tab B';
  const stale = await post(url('/config'), { config: secondDraft, expectedRevision: original.revision });
  assert.equal(stale.status, 409);
  const conflict = await stale.json();
  assert.equal(conflict.code, 'CONFIG_CONFLICT');
  assert.equal(conflict.currentRevision, saved.revision);
  assert.equal(secondDraft.models[0].label, 'Tab B');
  assert.equal((await post(url('/config'), { config: saved })).status, 409);
  const invalid = structuredClone(saved); invalid.models[0].enabled = true; invalid.models[0].verification = 'unverified';
  assert.equal((await post(url('/config'), { config: invalid, expectedRevision: saved.revision })).status, 400);
  assert.equal((await post(url('/config'), { config: { schema: 'other', revision: saved.revision }, expectedRevision: saved.revision })).status, 400);
  assert.equal((await fetch(url('/config'), { method: 'POST', body: '{bad-json' })).status, 400);
  assert.deepEqual(await (await fetch(url('/config'))).json(), saved);
  assert.deepEqual(app.configStore.read(), saved);
});

test('invitation and unknown capabilities cannot read or change config, tasks, or workspace pages', async t => {
  const { base, room } = await boot(t);
  for (const key of [room.id, 'missing_host_0123456789']) {
    for (const suffix of ['/config', '/work', '/runtime']) assert.equal((await fetch(`${base}/api/host/${key}${suffix}`)).status, 404);
    assert.equal((await post(`${base}/api/host/${key}/config`, {})).status, 404);
    assert.equal((await post(`${base}/api/host/${key}/work/tasks`, { goal: 'Not authorized' })).status, 404);
    for (const suffix of ['/workspace', '/admin']) assert.equal((await fetch(`${base}/m/${key}${suffix}`)).status, 404);
  }
});

test('host mutations reject cross-origin browser requests before config or task writes', async t => {
  const { url } = await boot(t);
  const original = await (await fetch(url('/config'))).json();
  for (const endpoint of ['/config', '/routing/recommend', '/work/tasks', '/runtime/probe']) {
    const response = await post(url(endpoint), { config: original, expectedRevision: original.revision }, { origin: 'https://untrusted.example' });
    assert.equal(response.status, 403, endpoint);
    assert.match((await response.json()).error, /origin/);
  }
  assert.deepEqual(await (await fetch(url('/config'))).json(), original);
  const ownOrigin = new URL(url('/config')).origin;
  assert.equal((await post(url('/routing/recommend'), {}, { origin: ownOrigin })).status, 200);
});

test('tunnel and forwarded remote requests cannot access machine controls even with remoteHost enabled', async t => {
  const { app, base, room, url } = await boot(t, { remoteHost: true });
  app.setPublicOrigin('https://demo.trycloudflare.com');
  for (const headers of [{ 'cf-connecting-ip': '203.0.113.7', 'cf-ray': 'test-ray' }, { 'x-forwarded-for': '192.0.2.5' }]) {
    for (const endpoint of ['/config', '/runtime', '/work']) {
      const response = await fetch(url(endpoint), { headers });
      assert.equal(response.status, 403, endpoint);
      assert.match((await response.json()).error, /local host/);
    }
    for (const endpoint of ['/config', '/runtime/probe', '/work/tasks', '/routing/recommend']) assert.equal((await post(url(endpoint), {}, headers)).status, 403, endpoint);
    // The remote-host option retains its existing meaning for meeting pages only.
    assert.equal((await fetch(`${base}/m/${room.hostKey}`, { headers })).status, 200);
  }
});

test('workspace/admin and self-hosted assets keep CSP while the existing room API still works', async t => {
  const { base, room, url } = await boot(t);
  for (const suffix of ['', '/workspace', '/admin']) {
    const response = await fetch(`${base}/m/${room.hostKey}${suffix}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(response.headers.get('cache-control'), /no-store/);
    const csp = response.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self'/);
    assert.ok(!csp.includes('unsafe-inline') && !csp.includes('unsafe-eval'));
    const body = await response.text();
    assert.match(body, suffix === '/admin' ? /\/assets\/workspace\.js/ : /\/assets\/app\.js/);
  }
  for (const [asset, contentType] of [['workspace.js', 'javascript'], ['workspace.css', 'text/css'], ['app.css', 'text/css']]) {
    const response = await fetch(`${base}/assets/${asset}`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').includes(contentType));
    assert.ok((await response.text()).length > 100);
  }
  const initial = await (await fetch(url('/state?v=-1'))).json();
  assert.equal(initial.state, 'LOBBY');
  assert.equal(initial.agentId, room.id);
  assert.equal((await post(url('/start'), { context: 'Legacy meeting remains usable', agenda: [] })).status, 200);
  assert.equal((await (await fetch(url('/state?v=-1'))).json()).state, 'LIVE');
  assert.equal((await post(url('/stop'), {})).status, 200);
  assert.equal((await (await fetch(url('/state?v=-1'))).json()).state, 'ENDED');
});

test('work endpoints save actual plans without launching a process and reject malformed tasks', async t => {
  let launches = 0;
  const { url } = await boot(t, { runCli: async () => { launches++; throw new Error('Must not launch while planning'); } });
  const task = { goal: 'Define a bounded task', purpose: 'plan', topology: 'remote', management: 'invited', acceptance: ['A plan exists'], dependencies: [], sources: ['README.md'], facts: ['Planning only'], unknowns: ['Remote runtime'], writePaths: [], testFiles: [] };
  const response = await post(url('/work/tasks'), task);
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.ok(saved.id);
  const state = await (await fetch(url('/work'))).json();
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].id, saved.id);
  assert.equal(state.tasks[0].goal, task.goal);
  assert.deepEqual(state.runs, []);
  assert.equal(launches, 0);
  assert.equal((await post(url('/work/tasks'), { ...task, acceptance: [] })).status, 400);
  assert.equal((await post(url('/work/tasks'), { ...task, writePaths: ['../outside'] })).status, 400);
  assert.equal((await post(url(`/work/tasks/${saved.id}/run`), { profileId: 'opus' })).status, 409);
  assert.equal(launches, 0);
});
test('admin accepts the full documented config size and reset/history preserve revisions',async t=>{
 const {url}=await boot(t),config=await(await fetch(url('/config'))).json();
 for(const field of ['strengths','limitations','outputContract'])config.models[0][field]=Array.from({length:100},()=> 'x'.repeat(1100));
 assert.ok(Buffer.byteLength(JSON.stringify(config))>256*1024);assert.ok(Buffer.byteLength(JSON.stringify(config))<512*1024);
 const saved=await post(url('/config'),{config,expectedRevision:1});assert.equal(saved.status,200);assert.equal((await saved.json()).revision,2);
 const history=await(await fetch(url('/config/history'))).json();assert.equal(history.previousRevision,1);
 const reset=await post(url('/config/reset'),{group:'models',expectedRevision:2});assert.equal(reset.status,200);assert.deepEqual((await reset.json()).models,routing.defaults().models);
 assert.equal((await post(url('/config/reset'),{group:'policy',expectedRevision:2})).status,409);
});

test('conditional work reads track work, room and remote state without bypassing capability checks', async t => {
  const { app, room, base, url } = await boot(t);
  const first = await fetch(url('/work'));
  assert.equal(first.status, 200);
  const etag = first.headers.get('etag'); assert.match(etag, /^"[a-f0-9]{64}"$/);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const original = await first.json();
  const unchanged = await fetch(url('/work'), { headers: { 'if-none-match': etag } });
  assert.equal(unchanged.status, 304); assert.equal(await unchanged.text(), '');
  assert.equal(unchanged.headers.get('etag'), etag);
  // Ordinary callers still receive the complete compatible representation.
  assert.deepEqual(await (await fetch(url('/work'))).json(), original);
  room.start('Changed objective', '', { agenda: [] });
  const changed = await fetch(url('/work'), { headers: { 'if-none-match': etag } });
  assert.equal(changed.status, 200); assert.notEqual(changed.headers.get('etag'), etag);
  assert.equal((await changed.json()).session.context, 'Changed objective');
  const nextTag = changed.headers.get('etag');
  await post(url('/work/tasks'), { goal: 'A task', acceptance: ['Works'] });
  const taskChange = await fetch(url('/work'), { headers: { 'if-none-match': nextTag } });
  assert.equal(taskChange.status, 200); assert.equal((await taskChange.json()).tasks.length, 1);
  const taskTag = taskChange.headers.get('etag');
  const enrolled = await post(url('/remote/enroll'), { label: 'Fixture host', workspaceId: 'w1', baseRevision: 'base', capabilities: ['claude'] });
  assert.equal(enrolled.status, 201);
  const remoteChange = await fetch(url('/work'), { headers: { 'if-none-match': taskTag } });
  assert.equal(remoteChange.status, 200); assert.notEqual(remoteChange.headers.get('etag'), taskTag);
  const latest = remoteChange.headers.get('etag');
  for (const headers of [{ 'x-forwarded-for': '192.0.2.3' }, { 'cf-connecting-ip': '192.0.2.3', 'cf-ray': 'fixture' }])
    assert.equal((await fetch(url('/work'), { headers: { ...headers, 'if-none-match': latest } })).status, 403);
  assert.equal((await fetch(base + '/api/host/' + room.id + '/work', { headers: { 'if-none-match': latest } })).status, 404);
  const other = app.create({ hostKey: 'other_host_work_0123456789', id: 'other_agent_work_0123456789', fixed: true });
  assert.equal((await fetch(base + '/api/host/' + other.hostKey + '/work', { headers: { 'if-none-match': latest } })).status, 200);
});

test('run HTTP fences the viewed config and requirement before any runtime dispatch', async t => {
  let starts = 0;
  const {app,root,url}=await boot(t,{runCli:async options=>{if(!options.prompt.includes('READY'))starts++;return{status:'reported',reportedModel:'fixture-model',text:'Deterministic fixture; not an AI call',exitCode:0};}});
  const source=path.join(root,'source');fs.mkdirSync(path.join(source,'test'),{recursive:true});
  fs.writeFileSync(path.join(source,'sum.js'),'module.exports=(a,b)=>a-b;\n');
  fs.writeFileSync(path.join(source,'test/sum.test.js'),"require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
  const {execFileSync}=require('node:child_process');execFileSync('git',['init','-q',source]);execFileSync('git',['-C',source,'add','.']);execFileSync('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  const config=app.configStore.read(),model=config.models.find(m=>m.id==='opus');
  Object.assign(model,{enabled:true,providerModelId:'fixture-model',verification:'verified',source:{...model.source,checkedAt:new Date().toISOString(),confidence:'user-configured'}});config.profiles.find(p=>p.id==='opus-claude').enabled=true;
  const viewed=app.configStore.save(config,config.revision).revision;
  const task=await(await post(url('/work/tasks'),{goal:'Bounded view revision fixture',acceptance:['sum(2,3)=5'],purpose:'execute',workspace:source,writePaths:['sum.js'],testFiles:['test/sum.test.js']})).json();
  const changed=app.configStore.read();changed.models[0].label+=' updated elsewhere';const current=app.configStore.save(changed,changed.revision).revision;
  assert.equal((await post(url('/runtime/probe'),{profileId:'opus-claude'})).status,200);
  const stale=await post(url(`/work/tasks/${task.id}/run`),{profileId:'opus-claude',expectedConfigRevision:viewed,expectedRequirementRevision:task.requirementRevision});
  assert.equal(stale.status,409);assert.match((await stale.json()).error,/Configuration changed/);assert.equal(starts,0);
  const edited=await(await post(url(`/work/tasks/${task.id}/configure`),{expectedRevision:task.requirementRevision,acceptance:['Changed acceptance from another client']})).json();
  const oldTask=await post(url(`/work/tasks/${task.id}/run`),{profileId:'opus-claude',expectedConfigRevision:current,expectedRequirementRevision:task.requirementRevision});
  assert.equal(oldTask.status,409);assert.match((await oldTask.json()).error,/Task changed/);assert.equal(starts,0);
  assert.equal((await(await fetch(url('/work'))).json()).runs.length,0);
  const launch=await post(url(`/work/tasks/${task.id}/run`),{profileId:'opus-claude',expectedConfigRevision:current,expectedRequirementRevision:edited.requirementRevision});
  assert.equal(launch.status,202);const run=await launch.json();assert.equal(run.configRevision,current);assert.equal(run.requirementRevision,edited.requirementRevision);
  for(let i=0;i<50&&!starts;i++)await new Promise(r=>setTimeout(r,10));assert.equal(starts,1);
});

test('concurrent probe HTTP callers share one same-config runner invocation',async t=>{
  let calls=0,release,started,bodies=0,bothBodies;
  const gate=new Promise(resolve=>{release=resolve;}),firstStarted=new Promise(resolve=>{started=resolve;}),allBodies=new Promise(resolve=>{bothBodies=resolve;});
  const{app,url}=await boot(t,{runCli:async options=>{calls++;started();await gate;return{status:'reported',reportedModel:options.modelId};}});
  const c=app.configStore.read(),m=c.models.find(m=>m.id==='opus');Object.assign(m,{enabled:true,providerModelId:'fixture-model',verification:'verified',source:{...m.source,checkedAt:new Date().toISOString(),confidence:'user-configured'}});c.profiles.find(p=>p.id==='opus-claude').enabled=true;app.configStore.save(c,c.revision);
  app.server.on('request',req=>{if(req.url.endsWith('/runtime/probe'))req.on('end',()=>{if(++bodies===2)bothBodies();});});
  const first=post(url('/runtime/probe'),{profileId:'opus-claude'}),second=post(url('/runtime/probe'),{profileId:'opus-claude'});
  try{await allBodies;await firstStarted;assert.equal(calls,1);}
  finally{release();await Promise.allSettled([first,second]);}
  const [a,b]=await Promise.all([first,second]);assert.equal(a.status,200);assert.equal(b.status,200);assert.deepEqual(await a.json(),await b.json());assert.equal(calls,1);
  const stale=await post(url('/runtime/probe'),{profileId:'opus-claude',expectedConfigRevision:1});assert.equal(stale.status,409);assert.match((await stale.json()).error,/Configuration changed/);assert.equal(calls,1);
});
