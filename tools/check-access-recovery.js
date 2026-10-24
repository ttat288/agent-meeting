'use strict';
// Deterministic access/retry recovery with the same CSV input and checks in both
// arms. No model CLI is invoked. --app-root permits checking an archived baseline.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const fixture=require('../test/fixtures/csv-retry');
const appRoot=path.resolve(process.argv.includes('--app-root')?process.argv[process.argv.indexOf('--app-root')+1]:path.join(__dirname,'..'));
const baseline=process.argv.includes('--baseline');
const {createApp}=require(path.join(appRoot,'src/server'));
const {observationStore}=require(path.join(appRoot,'src/routing-tools'));
const {ConfigStore}=require(path.join(appRoot,'src/config-store'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashes=dir=>Object.fromEntries(['csv-cell.js','test/csv-cell.test.js'].map(f=>[f,sha(fs.readFileSync(path.join(dir,f)))]));
async function main(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'am-access-check-')),prompts=[],calls=[],http=[];
 let probeFails=false,app;
 const participant=fixture.participant(prompts);
 const cfg={configDir:root+'/config',workDir:root+'/work',dataDir:root+'/rooms',runCli:async args=>{
  const probe=args.prompt.includes('READY');calls.push({kind:probe?'probe':'task',at:new Date().toISOString()});
  if(probe&&probeFails)return{status:'failed',reportedModel:'unknown',error:'Controlled access failure, not OAuth or a model call',exitCode:1};
  return participant(args);
 }};
 const report={schema:'agent-meeting/access-recovery@1',recordedAt:new Date().toISOString(),fixture:true,nativeModelCalls:0,baseline,node:process.version,goal:fixture.goal,acceptance:fixture.acceptance,http,calls,
  sourceHashes:Object.fromEntries(['src/work.js','src/server.js','src/ui/workspace.js','src/ui/workspace.css'].map(f=>[f,sha(fs.readFileSync(path.join(appRoot,f)))])),modelTokens:null,billedCostUsd:null,humanTimeMs:null};
 const boot=async()=>{app=createApp(cfg);await new Promise(r=>app.server.listen(0,'127.0.0.1',r));};
 try{
  fixture.seed(root+'/direct');fixture.seed(root+'/managed');const source=root+'/managed';report.inputHashes=hashes(source);assert.deepEqual(hashes(root+'/direct'),report.inputHashes);
  const directStart=performance.now();assert.equal(fixture.patch(root+'/direct').exitCode,0);
  const failedCheck=fixture.execute(root+'/direct',['--test','test/csv-cell.test.js'],false);assert.equal(failedCheck.exitCode,1);
  assert.equal(fixture.patch(root+'/direct',failedCheck.output).exitCode,0);
  const directCheck=fixture.execute(root+'/direct',['--test','test/csv-cell.test.js'],false);assert.equal(directCheck.exitCode,0);
  report.direct={elapsedMs:performance.now()-directStart,processes:4,attempts:2,manualDiagnosticTransfers:0,readinessProbes:0,outputHashes:hashes(root+'/direct'),finalCheck:directCheck};
  const start=performance.now();await boot();const host='host_access_check_12345678';app.create({hostKey:host,id:'agent_access_check_12345678',fixed:true});fixture.enable(app.configStore);
  async function request(endpoint,body,status=200){
   const text=body===undefined?undefined:JSON.stringify(body),t0=performance.now();
   const response=await fetch('http://127.0.0.1:'+app.server.address().port+'/api/host/'+host+'/'+endpoint,{method:text===undefined?'GET':'POST',headers:{'content-type':'application/json'},body:text,signal:AbortSignal.timeout(30000)}),raw=await response.text();
   http.push({endpoint,status:response.status,elapsedMs:performance.now()-t0,requestBodyBytes:Buffer.byteLength(text||''),responseBodyBytes:Buffer.byteLength(raw)});assert.equal(response.status,status,raw);return JSON.parse(raw);
  }
  await request('start',{context:fixture.goal,agenda:[]});await request('say',{text:'CONCLUSION: Export CSV cells without corrupting quotes or line breaks.\nTASK: Dev | Fix CSV cell escaping | today'});
  let state=await request('work');const original=state.tasks[0];assert.equal(state.tasks.length,1);
  const task=await request('work/tasks/'+original.id+'/configure',{expectedRevision:original.requirementRevision,purpose:'execute',management:'managed',acceptance:fixture.acceptance,workspace:source,writePaths:['csv-cell.js'],testFiles:['test/csv-cell.test.js']});
  const profile={profileId:'opus-claude',expectedConfigRevision:app.configStore.read().revision,expectedRequirementRevision:task.requirementRevision};
  const probe=()=>request('runtime/probe',{profileId:profile.profileId,expectedConfigRevision:profile.expectedConfigRevision});
  const attempt=async()=>{const run=await request('work/tasks/'+task.id+'/run',profile,202);for(let i=0;i<600;i++){state=await request('work');if(state.runs.find(r=>r.id===run.id).status!=='running')return run;await new Promise(r=>setTimeout(r,10));}throw Error('Fixture run timeout');};
  await probe();const first=await attempt();const failed=await request('work/runs/'+first.id+'/verify',{});assert.equal(failed.status,'failed');assert.equal(failed.evidence[0].exitCode,1);assert.deepEqual(hashes(source),report.inputHashes);
  // Expire BOTH stores; changing only one would leave the other fresh. This is
  // a backdated fixture, separate from the wall-clock browser expiry check.
  const shared=observationStore(app.configStore),snapshot=shared.read();const expire=o=>({...o,checkedAt:new Date(Date.now()-31*60000).toISOString()});
  const workStore=new ConfigStore({dir:path.join(cfg.workDir,sha(host)),defaults:()=>({observations:[]}),validate:d=>assert(Array.isArray(d.observations))}),workState=workStore.read();
  workState.observations=workState.observations.map(expire);workStore.save(workState,workState.revision);snapshot.observations=snapshot.observations.map(expire);shared.save(snapshot,snapshot.revision);
  const callCount=calls.length;const blocked=await request('work/tasks/'+task.id+'/run',profile,409);assert.equal(calls.length,callCount,'A blocked retry cannot invoke the CLI');
  if(baseline){assert.equal(blocked.code,undefined);assert.match(blocked.error,/unverified or routing/);}else assert.equal(blocked.code,'MODEL_ACCESS_REQUIRED');
  report.blocked=blocked;
  probeFails=true;const failure=await probe();assert.equal(failure.available,false);const again=await request('work/tasks/'+task.id+'/run',profile,409);if(!baseline)assert.equal(again.code,'MODEL_ACCESS_REQUIRED');
  assert.equal((await request('work')).runs.length,1,'Failed access check cannot create a run');assert.deepEqual(hashes(source),report.inputHashes);
  await app.close();app=null;await boot();assert(app.restore(host));state=await request('work');assert.equal(state.tasks[0].id,task.id);assert.equal(state.runs[0].id,first.id);assert.equal(state.runs[0].evidence[0].output,failed.evidence[0].output);
  probeFails=false;const observed=await probe();assert.equal(observed.modelVerified,true);assert.equal((await request('work')).runs.length,1,'Successful probe cannot retry the task');
  const retried=await attempt();state=await request('work');const second=state.runs.find(r=>r.id===retried.id);assert.equal(second.retryContext.fromRunId,first.id);
  assert.equal((await request('work/runs/'+retried.id+'/verify',{})).status,'verified');const integrated=await request('work/runs/'+retried.id+'/integrate',{});assert.equal(integrated.status,'integrated');assert.equal(integrated.integrationEvidence[0].exitCode,0);
  state=await request('work');assert.equal(state.tasks[0].requirementRevision,task.requirementRevision);assert.equal(state.tasks[0].id,task.id);assert.deepEqual(hashes(source),report.direct.outputHashes);
  report.managed={elapsedMs:performance.now()-start,status:integrated.status,taskId:task.id,requirementRevision:task.requirementRevision,sourceMessageIndex:original.origin.messageIndex,firstRunId:first.id,retryRunId:retried.id,retryContext:second.retryContext,attempts:prompts.length,probes:calls.filter(c=>c.kind==='probe').length,manualDiagnosticTransfers:0,configurationsAfterInitialSave:0,restartPreserved:true,outputHashes:hashes(source),integratedCheck:integrated.integrationEvidence[0],promptBytes:prompts.map(p=>Buffer.byteLength(JSON.stringify(p)))};
  assert(prompts.every(p=>p.objective===prompts[0].objective&&JSON.stringify(p.acceptance)===JSON.stringify(prompts[0].acceptance)&&JSON.stringify(p.scope)===JSON.stringify(prompts[0].scope)));
  report.limits=['Direct is a deterministic Node subprocess participant, not a native coding CLI/model benchmark.','Both managed API arms already recover with an explicit probe; browser evidence measures the UI navigation gap.','Expiry here is backdated; it does not establish wall-clock TTL behavior.','One direct-first sample; timer scopes differ, no statistical or human-time claim.','No model tokens/billing/semantic quality/human UX acceptance; body bytes omit headers, transport, CPU, development and maintenance.'];
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
 }finally{if(app)await app.close();fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
