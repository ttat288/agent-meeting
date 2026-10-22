'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const { setup } = require('./helpers/pm-fixture');
const { WorkManager } = require('../src/work');
const { PmOperator } = require('../src/pm');
async function teamFixture(t, limits = {}, sessionOptions = {}, grantExtra = {}, prepare = () => {}) {
  const f = await setup(t, 'fix', { sessionOptions: { childPath: path.join(__dirname,'fixtures/team-session.js'), ...sessionOptions } });
  await prepare(f);
  await f.ready({ maxRuns: 2, team: { durationMinutes: null, maxSwaps: 1, maxInvocations: 3, maxWakes: 4, profiles: ['opus-claude'], chair: true, ...limits }, ...grantExtra });
  const invitation = await f.pm('team-invite',{goalRevision:1}); assert.equal(invitation.status,200);
  let token = invitation.data.token, generation = 1;
  const call = (op, input={}) => f.request('/api/team/'+f.room.id+'/'+op,{generation,...input},token);
  assert.equal((await call('join',{name:'Lead A',model:'fixture-model'})).status,200);
  const proposed=await call('propose',{summary:'One scoped member fixes the canonical sum task; independent acceptance test then integration.'});assert.equal(proposed.status,200);
  const p=(await f.pm('state')).data;
  const approve=await f.pm('approve-plan',{goalRevision:1,planRevision:1,grantId:p.grant.id});assert.equal(approve.status,200);
  async function start() {
    const start = await call('run');assert.equal(start.status,200);
    const runId=start.data.runId;
    let run;
    for(let i=0;i<200;i++) {
      run=(await f.host('work')).data.runs.find(r=>r.id===runId);
      if(fs.readFileSync(path.join(run.workspace,'sum.js'),'utf8').includes('WIP'))return run;
      await new Promise(r=>setTimeout(r,20));
    }
    throw Error('Initial fixture did not write WIP');
  }
  async function checkpoint(run) {
    const c=await call('checkpoint',{taskId:run.taskId,requirementRevision:run.requirementRevision,planRevision:1,baseRevision:run.baseRevision,decisions:'Preserve sum acceptance and the existing WIP; no commits/settings.',unknowns:'Model billing remains unknown',next:'Continue same slot A from WIP and report for independent tests.'});
    assert.equal(c.status,200);return c.data;
  }
  return {f,call,start,checkpoint,rotate(data){token=data.token;generation=data.generation;},get token(){return token;}};
}
test('event-driven team end to end: same slot swap, one writer, WIP, independent verification, integrated evidence and PM report',async t=>{
  const s=await teamFixture(t), {f,call}=s;
  await f.host('pm/message',{text:'Private director strategy never hydrated to team'});
  assert.doesNotMatch(JSON.stringify((await call('state')).data),/Private director|tokenHash|leaseUntil|hostKey/);
  assert.equal((await f.pm('chair',{goalRevision:1,operation:'start'})).data.ok,true);
  const run=await s.start();
  assert.equal((await f.pm('run',{goalRevision:1,taskId:run.taskId})).status,409);
  // No PM request/heartbeat is needed while the team owns execution.
  const work=f.app.meetings.get(f.room.hostKey);assert(work);
  const c=await s.checkpoint(run);
  assert.match(c.hash,/^[a-f0-9]{64}$/);assert.match(c.next,/same slot A/);
  const before=(await f.pm('state')).data;
  assert.equal(before.team.events.length,0);
  const swapping=await call('swap',{checkpointHash:c.hash,profileId:'opus-claude'});
  assert.equal(swapping.status,200,JSON.stringify(swapping.data));
  assert.equal(swapping.data.slot,'A');assert.equal(swapping.data.generation,2);assert.equal(swapping.data.stopped.liveWriters,0);
  assert.equal((await call('state')).status,401);
  s.rotate(swapping.data);
  assert.equal((await f.settled(run.id)).status,'reported');
  const state=(await call('state')).data;
  assert.equal(state.run.id,run.id);assert.equal(state.task.id,run.taskId);assert.equal(state.slot,'A');assert.equal(state.events.length,0);
  assert.equal((await call('verify',{runId:run.id})).data.run.status,'verified');
  assert.equal((await call('integrate',{runId:run.id})).data.run.status,'integrated');
  // Network wait is code, not a model poll; it delivers only an actionable event.
  const waiting=f.pm('events',{goalRevision:1,timeoutMs:2000});
  const submitted=await call('submit',{runId:run.id});assert.equal(submitted.status,200);
  const event=submitted.data;
  assert.equal((await call('submit',{runId:run.id})).data.id,event.id);
  const awakened=await waiting;assert.equal(awakened.data.events.length,1);assert.equal(awakened.data.events[0].id,event.id);
  assert.equal((await f.pm('report',{goalRevision:1,runId:run.id,text:'too early'})).status,409);
  assert.equal((await f.pm('ack-event',{goalRevision:1,eventId:event.id})).status,200);
  const report=await f.pm('report',{goalRevision:1,runId:run.id,text:'Sum fixed. Independent workspace and integrated source tests passed. Model billing remains unknown.'});
  assert.equal(report.data.status,'completed');assert.deepEqual(report.data.acceptance,['sum(2,3)=5']);assert.equal(report.data.integrationEvidence[0].exitCode,0);assert.equal(report.data.runtimeSessions.length,3);assert.equal(report.data.costUsd,null);assert.equal(report.data.totalCostUsd,null);assert.equal(report.data.externalLeadCostUsd,null);
  const durable=(await f.host('work')).data;assert.equal(durable.tasks.length,1);assert.equal(durable.runs.length,1);assert.equal(durable.runs[0].runtimeGeneration,2);assert.equal(durable.pm.grant.usedInvocations,3);
  assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/preserved WIP/);
  assert.doesNotMatch(JSON.stringify((await f.host('minutes.json')).data),/Private director|checkpointHash|tokenHash/);
  assert.equal((await f.pm('events',{goalRevision:1,timeoutMs:1})).data.events.length,0);
  if (process.env.AM_TEAM_EVIDENCE_DIR) {
    fs.mkdirSync(process.env.AM_TEAM_EVIDENCE_DIR,{recursive:true});
    const r=durable.runs[0];
    fs.writeFileSync(path.join(process.env.AM_TEAM_EVIDENCE_DIR,'journey.json'),JSON.stringify({schema:'agent-meeting/team-fixture-evidence@1',fixture:true,modelVerified:false,at:new Date().toISOString(),task:{id:run.taskId,acceptance:report.data.acceptance},run:{id:r.id,status:r.status,slot:r.logicalSlot,generation:r.runtimeGeneration,changes:r.changes,sessions:r.sessions,evidence:r.evidence,integrationEvidence:r.integrationEvidence},checkpoint:{hash:c.hash,slot:c.slot,goalRevision:c.goalRevision,planRevision:c.planRevision,next:c.next,scope:c.scope},event:{id:event.id,kind:event.kind,deduplicated:true,acked:true},report:report.data,claims:{oneWriter:'Managed process group drained before promotion; pending bootstrap attempted a filesystem write and was denied',sameTask:true,sameSlot:true,workPreserved:true,paidModel:false,billing:null,context8hVerified:false}},null,2)+'\n');
  }
});
test('team requires revision approval; unknown cost, stale scopes, spoof and replay cannot dispatch or promote',async t=>{
  const s=await teamFixture(t),{f,call}=s;
  assert.equal((await f.request('/api/team/'+f.room.id+'/state',{generation:1},'spoof')).status,401);
  assert.equal((await f.request('/api/team/'+f.room.id+'/state',{generation:1},s.token,{origin:'https://evil.invalid'})).status,403);
  assert.equal((await f.pm('approve-plan',{goalRevision:1,planRevision:0,grantId:'stale'})).status,409);
  assert.equal((await call('propose',{summary:'overwrite approved'})).status,409);
  const run=await s.start(),c=await s.checkpoint(run);
  assert.equal((await call('swap',{checkpointHash:'fake',profileId:'opus-claude'})).status,409);
  assert.equal((await call('swap',{checkpointHash:c.hash,profileId:'not-allowed'})).status,409);
  assert.equal((await call('submit',{runId:run.id})).status,409);
  assert.equal((await call('run')).status,409);
  const swapped=await call('swap',{checkpointHash:c.hash,profileId:'opus-claude'});assert.equal(swapped.status,200);s.rotate(swapped.data);
  assert.equal((await call('swap',{checkpointHash:c.hash,profileId:'opus-claude'})).status,409);
  await f.settled(run.id);
  assert.equal((await f.pm('ack-event',{goalRevision:1,eventId:'fake'})).status,409);
});
for(const action of ['pause','revoke','goal','takeover'])test('team '+action+' cancels managed process, invalidates capability and prevents stale swap/result',async t=>{
  const s=await teamFixture(t),run=await s.start(),c=await s.checkpoint(run);
  assert.equal((await s.f.host('pm/'+action,action==='goal'?{goal:'Changed scope',acceptance:['different']}:{ })).status,200);
  assert.notEqual((await s.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'})).status,200);
  for(let i=0;i<200;i++) {const r=(await s.f.host('work')).data.runs[0];if(!['running','verifying','integrating'].includes(r.status))break;await new Promise(r=>setTimeout(r,20));}
  const data=(await s.f.host('work')).data;
  assert.equal(data.runs[0].status,'cancelled');assert.notEqual(data.tasks[0].status,'done');assert.match(fs.readFileSync(path.join(s.f.source,'sum.js'),'utf8'),/a-b/);
});
test('blocking events coalesce, persist unacknowledged while PM disconnected, enforce wake cap and remain private',async t=>{
  const s=await teamFixture(t,{maxWakes:1});
  const a=await s.call('blocker',{key:'Needs product decision'});assert.equal(a.status,200);
  assert.equal((await s.call('blocker',{key:'Needs product decision'})).data.id,a.data.id);
  assert.equal((await s.call('blocker',{key:'second event beyond cap'})).status,409);
  const work=(await s.f.host('work')).data;assert.equal(work.pm.team.events.length,1);assert.equal(work.pm.team.events[0].acked,false);
  const wake=await s.f.pm('events',{goalRevision:1,timeoutMs:1});assert.equal(wake.data.blocked,true);assert.match(wake.data.attention.reason,/Wake cap/);
  assert.equal((await s.f.pm('ack-event',{goalRevision:1,eventId:a.data.id})).status,200);
  assert.equal((await s.f.pm('ack-event',{goalRevision:1,eventId:a.data.id})).status,200);
});

for(const mode of ['bad-ack','timeout'])test('successor '+mode+' keeps old writer, consumes bounded reservation and never promotes',async t=>{
  const s=await teamFixture(t,{}, {readyTimeoutMs:mode==='timeout'?1200:35000}),run=await s.start();
  // Control is read from a comment in the already scoped file.
  fs.appendFileSync(path.join(run.workspace,'sum.js'),'// fixture-mode:'+mode+'\n');
  const c=await s.checkpoint(run);
  const swapped=await s.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'});
  assert.equal(swapped.status,409,JSON.stringify(swapped.data));
  const state=(await s.call('state')).data;
  assert.equal(state.generation,1);assert.equal(state.swap.status,'failed');assert.equal(state.limits.usedInvocations,3);
  assert.equal(state.run.status,'running');
  assert.equal((await s.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'})).status,409);
  await s.f.host('pm/revoke',{});
});
test('source/WIP changes make checkpoint stale and cannot be promoted or integrated',async t=>{
  const s=await teamFixture(t),run=await s.start(),c=await s.checkpoint(run);
  fs.appendFileSync(path.join(run.workspace,'sum.js'),'// after checkpoint\n');
  assert.equal((await s.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'})).status,409);
  const fresh=await s.checkpoint(run);
  fs.appendFileSync(path.join(s.f.source,'sum.js'),'// concurrent user edit\n');
  assert.equal((await s.call('swap',{checkpointHash:fresh.hash,profileId:'opus-claude'})).status,409);
  assert.equal((await s.call('checkpoint',{taskId:run.taskId,requirementRevision:1,planRevision:1,baseRevision:run.baseRevision,decisions:'keep',unknowns:'unknown',next:'continue'})).status,409);
  await s.f.host('pm/revoke',{});
});
test('PM lease can lapse during delegated work; grant/time expiry instead cancels and retains a guard event',async t=>{
  const s=await teamFixture(t),run=await s.start();
  const workDir=path.join(s.f.cfg.workDir,fs.readdirSync(s.f.cfg.workDir)[0]);
  // Do not construct another WorkManager while the live run is active: its
  // restart reconciliation intentionally interrupts active persisted runs.
  const store=new (require('../src/config-store').ConfigStore)({dir:workDir,defaults:()=>({revision:1}),validate:()=>{}});
  let d=store.read();d.pm.leaseUntil=Date.now()-10000;store.save(d,d.revision);
  assert.equal((await s.call('state')).status,200);
  d=store.read();assert.equal(d.pm.status,'active');d.pm.team.endsAt=Date.now()-1;store.save(d,d.revision);
  // Host state runs expiry synchronously; no wall clock wait required.
  const state=(await s.f.host('pm/state')).data;
  assert.equal(state.status,'lost');assert(state.team.events.some(e=>e.kind==='guard'&&!e.acked));
  assert.notEqual((await s.call('run')).status,200);
  for(let i=0;i<150;i++){if((await s.f.host('work')).data.runs[0].status==='cancelled')break;await new Promise(r=>setTimeout(r,20));}
  assert.equal((await s.f.host('work')).data.runs[0].status,'cancelled');
});
test('restart preserves pending events/checkpoint but revokes capabilities and cannot silently resume or duplicate run',async t=>{
  const s=await teamFixture(t),event=(await s.call('blocker',{key:'Unresolved decision before disconnect'})).data;
  const workDir=path.join(s.f.cfg.workDir,fs.readdirSync(s.f.cfg.workDir)[0]);
  s.f.app.close();
  const work=new WorkManager({dir:workDir,configStore:s.f.app.configStore});
  const operator=new PmOperator(work,s.f.room);t.after(()=>{operator.close();work.close();});
  assert.equal(operator.state().status,'suspended');
  assert.equal(operator.state().team.events[0].id,event.id);assert.equal(operator.state().team.events[0].acked,false);
  assert.throws(()=>operator.team.auth(s.token,1),/stale|paused|granted/);
  assert.equal(work.read().runs.length,0);
});
test('packaged watch blocks in code and returns actionable data once, without snapshots or automatic ack',async t=>{
  const s=await teamFixture(t);
  const { execFile }=require('child_process');
  const watched=require('util').promisify(execFile)(process.execPath,[path.join(__dirname,'../bin/pm.js'),'watch',JSON.stringify({goalRevision:1,maxWaitMs:4000})],{timeout:10000,env:{...process.env,AGENT_MEETING_PM_URL:s.f.origin+'/api/pm/'+s.f.room.id,AGENT_MEETING_PM_TOKEN:s.f.token}});
  await new Promise(r=>setTimeout(r,150));
  const event=(await s.call('blocker',{key:'Director decision requested'})).data;
  const {stdout}=await watched;const data=JSON.parse(stdout);assert.equal(data.events[0].id,event.id);assert.equal(data.events[0].acked,false);assert.equal(data.runs,undefined);assert.equal(data.messages,undefined);
  const {stdout:teamState}=await require('util').promisify(execFile)(process.execPath,[path.join(__dirname,'../bin/team.js'),'state','{"generation":1}'],{timeout:10000,env:{...process.env,AGENT_MEETING_TEAM_URL:s.f.origin+'/api/team/'+s.f.room.id,AGENT_MEETING_TEAM_TOKEN:s.token}});
  assert.equal(JSON.parse(teamState).slot,'A');
});
test('runtime requests its own bounded same-slot swap via structured protocol; PM performs no progress calls',async t=>{
  const s=await teamFixture(t,{}, {childPath:path.join(__dirname,'fixtures/production-session.js')}),run=await s.start();
  let r;
  for(let i=0;i<250;i++) {r=(await s.f.host('work')).data.runs[0];if(r.status!=='running')break;await new Promise(r=>setTimeout(r,20));}
  assert.equal(r.status,'reported',r.error);
  assert.equal(r.runtimeGeneration,2);assert.equal(r.logicalSlot,'A');assert.equal(r.id,run.id);
  const state=(await s.call('state')).data;assert.equal(state.generation,2);assert.equal(state.events.length,0);
  s.rotate({token:s.token,generation:2});
  assert.equal((await s.call('verify',{runId:r.id})).data.run.status,'verified');
  assert.equal((await s.call('integrate',{runId:r.id})).data.run.status,'integrated');
  assert.equal((await s.call('submit',{runId:r.id})).data.kind,'result');
});

for(const reason of ['goal','revoke','source'])test('pending successor readiness + '+reason+' never promotes a stale writer',async t=>{
  const s=await teamFixture(t),run=await s.start();
  fs.appendFileSync(path.join(run.workspace,'sum.js'),'// fixture-mode:delay\n');
  const c=await s.checkpoint(run), swapping=s.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'});
  for(let i=0;i<60;i++) {if((await s.f.host('pm/state')).data.team.swap?.status==='preparing')break;await new Promise(r=>setTimeout(r,10));}
  if(reason==='source')fs.appendFileSync(path.join(s.f.source,'sum.js'),'// concurrent source edit\n');
  else await s.f.host('pm/'+reason,reason==='goal'?{goal:'New revision during bootstrap',acceptance:['new acceptance']}:{ });
  assert.notEqual((await swapping).status,200);
  const data=(await s.f.host('work')).data;assert.equal(data.pm.team.generation,1);assert.notEqual(data.pm.team.swap.status,'completed');assert.notEqual(data.tasks[0].status,'done');
  if(reason==='source')await s.f.host('pm/revoke',{});
});
test('unknown cost and invocation budget are independent guards, neither implies a spending cap',async t=>{
  const s=await teamFixture(t,{}, {}, {allowUnknownCost:false});
  assert.equal((await s.call('run')).status,409);assert.equal((await s.f.host('work')).data.runs.length,0);
  const limited=await teamFixture(t,{maxInvocations:1});
  const run=await limited.start(),c=await limited.checkpoint(run);
  assert.equal((await limited.call('swap',{checkpointHash:c.hash,profileId:'opus-claude'})).status,409);
  assert.equal((await limited.call('state')).data.limits.usedInvocations,1);
  await limited.f.host('pm/revoke',{});
});

test('allowlisted model change preserves task/slot/WIP and records actual runtime identity per generation',async t=>{
  const s=await teamFixture(t,{profiles:['opus-claude','fixture-successor']},{},{},f=>{
    const config=f.app.configStore.read();
    const model=JSON.parse(JSON.stringify(config.models.find(m=>m.id==='opus')));model.id='fixture-successor-model';model.providerModelId='fixture-model-other';config.models.push(model);
    const profile=JSON.parse(JSON.stringify(config.profiles.find(p=>p.id==='opus-claude')));profile.id='fixture-successor';profile.modelId=model.id;config.profiles.push(profile);f.app.configStore.save(config,config.revision);
  });
  assert.equal((await s.f.host('runtime/probe',{profileId:'fixture-successor'})).status,200);
  const run=await s.start(),c=await s.checkpoint(run);
  const swapped=await s.call('swap',{checkpointHash:c.hash,profileId:'fixture-successor'});assert.equal(swapped.status,200,JSON.stringify(swapped.data));s.rotate(swapped.data);
  const reported=await s.f.settled(run.id);assert.equal(reported.reportedModel,'fixture-model-other');assert.equal(reported.requestedModel,'fixture-model-other');
  assert.equal((await s.call('verify',{runId:run.id})).data.run.status,'verified');
  assert.equal((await s.call('integrate',{runId:run.id})).data.run.status,'integrated');
  const state=(await s.f.host('work')).data;
  assert.equal(state.tasks.length,1);assert.equal(state.runs[0].logicalSlot,'A');assert.equal(state.runs[0].sessions[0].model,'fixture-model');assert.equal(state.runs[0].sessions[2].reportedModel,'fixture-model-other');
});
