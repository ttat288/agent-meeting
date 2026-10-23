'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createApp } = require('../src/server');
const { PmOperator } = require('../src/pm');
const { WorkManager } = require('../src/work');
const { wrapExecution } = require('../src/execution-sandbox');
async function setup(t, behavior = 'fix') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-pm-test-'));
  const source = path.join(dir, 'source'); fs.mkdirSync(path.join(source, 'test'), { recursive: true });
  fs.writeFileSync(path.join(source, 'sum.js'), 'module.exports=(a,b)=>a-b;\n');
  fs.writeFileSync(path.join(source, 'test/sum.test.js'), "require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
  execFileSync('git', ['init','-q',source]); execFileSync('git', ['-C',source,'add','.']);
  execFileSync('git', ['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  let calls = 0, starts = 0;
  const cfg = { configDir: path.join(dir,'config'), workDir: path.join(dir,'work'), dataDir: path.join(dir,'rooms'), runCli: async a => {
    calls++;
    if (a.prompt.includes('READY')) return { status: 'reported', reportedModel: 'fixture-model' };
    starts++;
    if (behavior === 'hold') return await new Promise(resolve => a.signal.addEventListener('abort', () => resolve({ status: 'cancelled', reportedModel:'fixture-model' }), { once: true }));
    if (behavior !== 'fail') {
      const wrapped = wrapExecution(process.execPath, ['-e', "require('fs').writeFileSync('sum.js','module.exports=(a,b)=>a+b;\\n')"], { workspace: a.workspace, write: true });
      try { execFileSync(wrapped.bin, wrapped.args, { cwd: a.workspace }); } finally { wrapped.cleanup(); }
    }
    return { status: 'reported', reportedModel: 'fixture-model', text: 'Deterministic subprocess fixture, not an AI model', exitCode: 0, usage: null, costUsd: null };
  }};
  const app = createApp(cfg), room = app.create({hostKey:'host_pm_test_123456',id:'agent_pm_test_123456',fixed:true});
  const c = app.configStore.read(), model = c.models.find(m => m.id === 'opus');
  Object.assign(model, { providerModelId:'fixture-model',enabled:true,verification:'verified',source:{...model.source,confidence:'user-configured',checkedAt:new Date().toISOString()} });
  c.profiles.find(p => p.id === 'opus-claude').enabled = true; app.configStore.save(c,c.revision);
  await new Promise(r => app.server.listen(0,'127.0.0.1',r));
  const origin = 'http://127.0.0.1:' + app.server.address().port;
  t.after(() => { app.close(); fs.rmSync(dir,{recursive:true,force:true}); });
  async function request(url, body, token, headers = {}) {
    const r = await fetch(origin+url, { method: body === undefined ? 'GET' : 'POST', headers:{'content-type':'application/json',...(token ? {authorization:'Bearer '+token}:{}),...headers},body:body === undefined ? undefined : JSON.stringify(body) });
    const raw = await r.text(); let data; try {data=JSON.parse(raw);} catch {data=raw;}
    return { status:r.status,data };
  }
  const host = (op,body) => request('/api/host/'+room.hostKey+'/'+op,body);
  let token;
  const pm = (op,body={}) => request('/api/pm/'+room.id+'/'+op,body,token);
  async function join() {
    const invite = await host('pm/invite',{}); assert.equal(invite.status,200); token=invite.data.token;
    const joined = await pm('join',{name:'PM',model:'fixture-pm'}); assert.equal(joined.status,200);
    assert.equal((await host('pm/approve',{code:joined.data.code,generation:invite.data.generation})).status,200);
    return token;
  }
  const grant = (extra={}) => host('pm/grant',{goalRevision:1,generation:1,workspace:source,writePaths:['sum.js'],testFiles:['test/sum.test.js'],profileId:'opus-claude',maxRuns:1,expiresAt:Date.now()+60000,allowUnknownCost:true,...extra});
  async function ready(extra={}) { await join(); await host('pm/goal',{goal:'Correct sum',acceptance:['sum(2,3)=5']}); await host('runtime/probe',{profileId:'opus-claude'}); assert.equal((await grant(extra)).status,200); }
  async function settled(runId) { for(let i=0;i<200;i++){ const s=await pm('state'); const r=s.data.runs?.find(r=>r.id===runId); if(r&&!['running','verifying','integrating'].includes(r.status))return r; await new Promise(r=>setTimeout(r,10)); } throw Error('Fixture failed to settle'); }
  return {dir,source,app,room,cfg,origin,request,host,pm,join,ready,grant,settled,get token(){return token;},get calls(){return calls;},get starts(){return starts;}};
}
test('PM CLI journey creates one canonical task, runs subprocess, verifies and integrates with evidence; private channel stays private',async t=>{
  const f=await setup(t); assert.deepEqual((await f.host('pm/state')).data,{status:'human'}); assert.equal(fs.existsSync(f.cfg.workDir),false);
  await f.ready(); await f.host('pm/message',{text:'private director note never for workers'});
  const task=(await f.pm('plan',{goalRevision:1})).data;
  assert.equal((await f.pm('plan',{goalRevision:1})).data.id,task.id);
  assert.equal((await f.host('work')).data.tasks.length,1);
  const run=await f.pm('run',{goalRevision:1,taskId:task.id}); assert.equal(run.status,200); assert.equal(run.data.configSnapshot,undefined);
  assert.equal((await f.settled(run.data.id)).status,'reported');
  const early=await f.pm('report',{goalRevision:1,runId:run.data.id,text:'I claim done'}); assert.equal(early.data.status,'blocked');
  assert.equal((await f.pm('verify',{goalRevision:1,runId:run.data.id})).data.status,'verified');
  assert.equal((await f.pm('integrate',{goalRevision:1,runId:run.data.id})).data.status,'integrated');
  const report=(await f.pm('report',{goalRevision:1,runId:run.data.id,text:'Correct sum; independent source tests passed.'})).data;
  assert.equal(report.status,'completed'); assert.equal(report.integrationEvidence[0].exitCode,0); assert.equal(report.actualModel,'fixture-model'); assert.equal(report.pmCostUsd,null); assert.equal(report.costUsd,null);
  assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/a\+b/); assert.equal(f.starts,1);
  assert.equal(f.room._present().length,0); assert.equal(f.room.log.some(m=>m.text.includes('private director')),false);
  for(const op of ['state','minutes.json']) assert.doesNotMatch(JSON.stringify((await f.host(op)).data),/private director note|tokenHash|fixture-pm/);
  const workerText=await f.request('/a/'+f.room.id+'/join',{name:'Worker',model:'fixture'});
  assert.doesNotMatch(JSON.stringify(workerText.data),/private director note/);
  assert.equal((await f.request('/api/pm/'+f.room.id+'/run',{goalRevision:1,taskId:task.id},'worker-token')).status,401);
});
test('PM joins before workers, confirmation is explicit, pending capability cannot read private history; spoof and remote/CSRF blocked',async t=>{
  const f=await setup(t);const invite=(await f.host('pm/invite',{})).data;
  const worker=await f.request('/a/'+f.room.id+'/join',{name:'Worker',model:'fixture'}); assert.match(worker.data,/PM must join/);
  assert.equal((await f.host('start',{context:'test'})).status,409);
  const joined=await f.request('/api/pm/'+f.room.id+'/join',{name:'PM',model:'fixture-pm'},invite.token);
  assert.equal((await f.host('pm/approve',{code:'wrong',generation:invite.generation})).status,409);
  assert.equal((await f.host('pm/approve',{code:joined.data.code,generation:invite.generation})).status,200);
  await f.host('pm/message',{text:'old private history'});
  const second=(await f.host('pm/invite',{})).data;
  const pending=await f.request('/api/pm/'+f.room.id+'/state',{},second.token);assert.equal(pending.status,200); assert.doesNotMatch(JSON.stringify(pending.data),/old private history|grant/);
  assert.equal((await f.request('/api/pm/'+f.room.id+'/state',{},invite.token)).status,401);
  assert.equal((await f.request('/api/pm/'+f.room.id+'/state',{},second.token,{origin:'https://evil.invalid'})).status,403);
  assert.equal((await f.request('/api/pm/'+f.room.id+'/state',{},second.token,{'x-forwarded-for':'203.0.113.1'})).status,403);
  assert.equal((await f.request('/api/host/'+f.room.hostKey+'/pm/invite',{},null,{origin:'https://evil.invalid'})).status,403);
});
test('PM cursor suppresses unchanged snapshots but delivers pre-wait changes and lease/auth transitions',async t=>{
  const f=await setup(t); await f.ready();
  const first=(await f.pm('state')).data;
  assert.match(first.cursor,/^[a-f0-9]{64}$/);
  for(let i=0;i<3;i++) {
    const same=(await f.pm('state',{cursor:first.cursor})).data;
    assert.equal(same.unchanged,true); assert.equal(same.messages,undefined); assert.equal(same.runs,undefined);
  }
  // Lease-only renewal must not resend the private history or task/run payload.
  const work=new WorkManager({dir:path.join(f.cfg.workDir,fs.readdirSync(f.cfg.workDir)[0]),configStore:f.app.configStore});
  t.after(()=>work.close());
  work.update(d=>{d.pm.leaseUntil=Date.now()+10000;});
  assert.equal((await f.pm('state',{cursor:first.cursor})).data.unchanged,true);
  await f.host('pm/message',{text:'Changed before wait was called'});
  // Bound a regression: old wait returns only after this later sentinel, losing 25s when idle.
  const sentinel=setTimeout(()=>f.host('pm/message',{text:'later sentinel'}).catch(()=>{}),500);
  let changed;
  try { changed=(await f.pm('wait',{cursor:first.cursor})).data; } finally {clearTimeout(sentinel);}
  assert.notEqual(changed.cursor,first.cursor);
  assert(changed.messages.some(m=>m.text==='Changed before wait was called'));
  assert(!changed.messages.some(m=>m.text==='later sentinel'));
  await f.host('pm/pause',{});
  const paused=(await f.pm('state',{cursor:changed.cursor})).data;
  assert.equal(paused.status,'paused'); assert.notEqual(paused.cursor,changed.cursor);
  await f.host('pm/revoke',{});
  assert.equal((await f.pm('state',{cursor:paused.cursor})).status,401);
});
test('no execution without goal/grant, explicit unknown cost consent, safe paths and immutable tests; no paid probe via PM',async t=>{
  const f=await setup(t); await f.join();
  assert.equal((await f.pm('plan',{goalRevision:0})).status,409);
  await f.host('pm/goal',{goal:'Correct sum',acceptance:['sum(2,3)=5']});
  assert.equal((await f.pm('plan',{goalRevision:1})).status,409);
  assert.equal((await f.grant({writePaths:['../secret']})).status,400);
  assert.equal((await f.grant({writePaths:['test']})).status,400);
  assert.equal((await f.grant({maxRuns:4})).status,400);
  assert.equal((await f.grant({goalRevision:0})).status,409);
  assert.equal((await f.grant({generation:0})).status,409);
  assert.equal((await f.grant({maxCostUsd:1})).status,400);
  assert.equal((await f.grant({allowUnknownCost:false})).status,200);
  const task=(await f.pm('plan',{goalRevision:1})).data;
  assert.equal((await f.pm('run',{goalRevision:1,taskId:task.id})).status,409); assert.equal(f.calls,0);
  assert.equal((await f.pm('probe',{profileId:'opus-claude'})).status,404);
  assert.equal((await f.grant()).status,200);
  // No verified access; a refused dispatch consumes its reservation and cannot silently retry.
  assert.equal((await f.pm('run',{goalRevision:1,taskId:task.id})).status,409);
  assert.equal((await f.pm('state')).data.grant.usedRuns,1);assert.equal(f.calls,0);
});
test('scope/profile/requirement changes cannot escape director grant; run attempts are capped',async t=>{
  const f=await setup(t,'fail');await f.ready();const task=(await f.pm('plan',{goalRevision:1})).data;
  const configured=await f.host('work/tasks/'+task.id+'/configure',{expectedRevision:1,writePaths:['other.js']});assert.equal(configured.status,200);
  assert.equal((await f.pm('run',{goalRevision:1,taskId:task.id})).status,409);
  await f.host('work/tasks/'+task.id+'/configure',{expectedRevision:2,writePaths:['sum.js']});
  const run=(await f.pm('run',{goalRevision:1,taskId:task.id,profileId:'other'})).data;await f.settled(run.id);
  assert.equal((await f.pm('verify',{goalRevision:1,runId:run.id})).data.status,'failed');
  assert.equal((await f.pm('integrate',{goalRevision:1,runId:run.id})).status,409);
  assert.equal((await f.pm('run',{goalRevision:1,taskId:task.id})).status,409);assert.equal(f.starts,1);
  assert.equal((await f.pm('report',{goalRevision:1,runId:run.id,text:'Tests failed; director decision needed'})).data.status,'blocked');
});
for(const action of ['pause','revoke','takeover','goal']) test(action+' during a run requests cancellation, blocks stale operations and preserves actual outcome',async t=>{
  const f=await setup(t,'hold');await f.ready();const task=(await f.pm('plan',{goalRevision:1})).data;
  const run=(await f.pm('run',{goalRevision:1,taskId:task.id})).data;
  await new Promise(r=>setTimeout(r,20));
  await f.host('pm/'+action,action==='goal'?{goal:'New goal',acceptance:['new acceptance']}:{});
  for(let i=0;i<100;i++){const work=(await f.host('work')).data;if(work.runs[0].status==='cancelled')break;await new Promise(r=>setTimeout(r,10));}
  const work=(await f.host('work')).data;assert.equal(work.runs[0].status,'cancelled');assert.notEqual(work.tasks[0].status,'done');
  assert.notEqual((await f.pm('integrate',{goalRevision:1,runId:run.id})).status,200);
  assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/a-b/);
  if(action==='takeover') { const history=(await f.host('pm/state')).data;assert.equal(history.status,'human');assert.equal(history.goal,'Correct sum');assert.equal(history.messages.length,1);assert.equal((await f.host('start',{context:'Human resumes'})).status,200); }
  if(action==='goal'){assert.equal(work.tasks[0].sourceCurrent,false);assert.equal(work.pm.report,null);}
});
test('lease loss, restart and old meeting cannot silently resume or dispatch duplicate work',async t=>{
  const f=await setup(t);await f.ready();const workState=(await f.host('work')).data;
  const workDir=path.join(f.cfg.workDir,fs.readdirSync(f.cfg.workDir)[0]);
  // Use a controlled clock, without waiting for a real two-minute lease.
  const work=new WorkManager({dir:workDir,configStore:f.app.configStore,runner:async()=>{throw Error('must not run');}});
  const operator=new PmOperator(work,f.room,()=>{},()=>Date.now()+180000); t.after(()=>operator.close());
  assert.equal(operator.state().status,'suspended');
  assert.throws(()=>operator.authenticate(f.token),/Invalid PM/);
  work.update(d=>{d.pm.status='active';d.pm.leaseUntil=Date.now()-1;});operator.expire(); assert.equal(operator.state().status,'lost');
  assert.equal(work.read().runs.length,0);assert.equal(workState.pm.grant.maxRuns,1);
});
test('expert review requirement cannot be bypassed by a successful PM report or passed tests',async t=>{
  const f=await setup(t);await f.ready({risk:'high'});const task=(await f.pm('plan',{goalRevision:1})).data;assert.equal(task.risk,'high');
  const run=(await f.pm('run',{goalRevision:1,taskId:task.id})).data;await f.settled(run.id);
  assert.equal((await f.pm('verify',{goalRevision:1,runId:run.id})).data.status,'verified');
  const integrate=await f.pm('integrate',{goalRevision:1,runId:run.id});assert.equal(integrate.status,409);assert.match(integrate.data.error,/review/i);
  assert.equal((await f.pm('report',{goalRevision:1,runId:run.id,text:'Tests pass but independent expert review is required'})).data.status,'blocked');
  assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/a-b/);
});
test('takeover keeps private goal history across actual room persistence and server restart',async t=>{
  const f=await setup(t);await f.join();await f.host('pm/goal',{goal:'Persist this director goal',acceptance:['History remains available after takeover']});
  await f.host('pm/takeover',{});f.app.flush();
  const saved=JSON.parse(fs.readFileSync(path.join(f.cfg.dataDir,f.room.hostKey+'.json'),'utf8'));assert.equal(saved.pmHistory,true);assert.equal(saved.pmEnabled,false);
  f.app.close();const restored=createApp(f.cfg);
  try{
    const room=restored.restore(f.room.hostKey);assert.equal(room.pmHistory,true);
    await new Promise(r=>restored.server.listen(0,'127.0.0.1',r));
    const origin='http://127.0.0.1:'+restored.server.address().port;
    const history=await(await fetch(origin+'/api/host/'+room.hostKey+'/pm/state')).json();
    assert.equal(history.status,'human');assert.equal(history.goal,'Persist this director goal');assert.equal(history.tokenHash,undefined);
    const stale=await fetch(origin+'/api/pm/'+room.id+'/state',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+f.token},body:'{}'});assert.equal(stale.status,404);
  }finally{restored.close();}
});
test('new grant cannot authorize an old reported run; replan reuses task ID with a new requirement revision',async t=>{
  const f=await setup(t);await f.ready();const task=(await f.pm('plan',{goalRevision:1})).data;
  const run=(await f.pm('run',{goalRevision:1,taskId:task.id})).data;await f.settled(run.id);
  assert.equal((await f.grant()).status,200);
  const old=await f.pm('verify',{goalRevision:1,runId:run.id});assert.equal(old.status,409);assert.match(old.data.error,/grant changed/);
  assert.equal((await f.pm('report',{goalRevision:1,runId:run.id,text:'Cannot report old run under new grant'})).status,409);
  assert.equal((await f.grant({writePaths:['other.js']})).status,200);
  const replanned=await f.pm('plan',{goalRevision:1});assert.equal(replanned.status,200);assert.equal(replanned.data.id,task.id);assert.equal(replanned.data.requirementRevision,2);assert.deepEqual(replanned.data.writePaths,['other.js']);
  const history=(await f.host('work')).data;assert.equal(history.tasks.length,1);assert.equal(history.runs[0].requirementRevision,1);
});
test('profile/model catalog revision is pinned by the grant; a config change requires new director authorization',async t=>{
  const f=await setup(t);await f.ready();const task=(await f.pm('plan',{goalRevision:1})).data;
  const config=f.app.configStore.read();config.policy.maxCandidates=2;f.app.configStore.save(config,config.revision);
  const blocked=await f.pm('run',{goalRevision:1,taskId:task.id});assert.equal(blocked.status,409);assert.match(blocked.data.error,/configuration changed/);assert.equal(f.starts,0);
});
test('packaged Node PM client reaches a localhost room without changing settings or launching a model',async t=>{
  const f=await setup(t);await f.join();
  const {stdout}=await require('node:util').promisify(require('node:child_process').execFile)(process.execPath,[path.join(__dirname,'../bin/pm.js'),'state','{}'],{encoding:'utf8',timeout:15000,env:{...process.env,AGENT_MEETING_PM_URL:f.origin.replace('127.0.0.1','localhost')+'/api/pm/'+f.room.id,AGENT_MEETING_PM_TOKEN:f.token}});
  assert.equal(JSON.parse(stdout).status,'active');assert.equal(f.calls,0);
});

test('same-byte source HEAD movement after integration cannot receive a current PM completion report', async t => {
  const f = await setup(t); await f.ready();
  const task = (await f.pm('plan', { goalRevision: 1 })).data;
  const run = (await f.pm('run', { goalRevision: 1, taskId: task.id })).data;
  await f.settled(run.id);
  assert.equal((await f.pm('verify', { goalRevision: 1, runId: run.id })).data.status, 'verified');
  assert.equal((await f.pm('integrate', { goalRevision: 1, runId: run.id })).data.status, 'integrated');
  const bytes = fs.readFileSync(path.join(f.source, 'sum.js'));
  require('child_process').execFileSync('git', ['-C', f.source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'Move HEAD after verified integration']);
  assert.deepEqual(fs.readFileSync(path.join(f.source, 'sum.js')), bytes);
  const result = await f.pm('report', { goalRevision: 1, runId: run.id, text: 'Claim current completion under old base' });
  assert.equal(result.status, 409);
  assert.match(result.data.error, /source.*changed/i);
});
