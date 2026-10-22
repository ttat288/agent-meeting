'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const { WorkManager, checkTask, safeFile } = require('../src/work');
function setup(t, runner) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-work-test-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const source=path.join(dir,'source');fs.mkdirSync(source); fs.mkdirSync(path.join(source,'test'));
 fs.writeFileSync(path.join(source,'sum.js'),'module.exports = (a,b) => a-b;\n');
 fs.writeFileSync(path.join(source,'test/sum.test.js'),"const assert=require('node:assert/strict');require('node:test')('sum',()=>assert.equal(require('../sum')(2,3),5));\n");
 execFileSync('git',['init','-q',source]);execFileSync('git',['-C',source,'add','.']);execFileSync('git',['-C',source,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture']);
 const config=routing.defaults(), m=config.models.find(m=>m.id==='opus');Object.assign(m,{providerModelId:'claude-opus-5-5',enabled:true,verification:'verified',source:{...m.source,checkedAt:new Date().toISOString(),confidence:'user-configured'}});config.profiles.find(p=>p.id==='opus-claude').enabled=true;
 const store=new ConfigStore({dir:path.join(dir,'config'),defaults:()=>config,validate:routing.validate});
 const work=new WorkManager({dir:path.join(dir,'work'),configStore:store,runner:runner||(async args=>{if(args.prompt.includes('READY'))return{status:'reported',reportedModel:'claude-opus-5-5'};fs.writeFileSync(path.join(args.workspace,'sum.js'),'module.exports = (a,b) => a+b;\n');return{status:'reported',reportedModel:'claude-opus-5-5',text:'done',exitCode:0};})});
 t.after(()=>work.close());return{dir,source,store,work};
}
const wait = async work => {for(let i=0;i<100&&work.active.size;i++)await new Promise(r=>setTimeout(r,5));assert.equal(work.active.size,0);};
const task = source => ({goal:'Correct sum',acceptance:['sum(2,3)=5'],purpose:'execute',topology:'local',management:'managed',workspace:source,writePaths:['sum.js'],testFiles:['test/sum.test.js']});
test('local run snapshots config, reports then independently tests and integrates one scoped file',async t=>{
 const {source,store,work}=setup(t);await work.probe('opus-claude');const job=work.createTask(task(source));const run=work.start(job.id,'opus-claude');
 const changed=store.read();changed.policy.maxCandidates=2;store.save(changed,changed.revision);
 await wait(work);assert.equal(work.read().runs[0].status,'reported');assert.equal(work.read().tasks[0].status,'verifying');assert.equal(run.configRevision,1);assert.equal(work.read().runs[0].configSnapshot.policy.maxCandidates,3);
 const checked=await work.verify(run.id);assert.equal(checked.status,'verified');assert.equal(checked.evidence[0].exitCode,0);
 assert.equal(fs.readFileSync(path.join(source,'sum.js'),'utf8').includes('a-b'),true);
 await work.integrate(run.id);assert.equal(work.read().tasks[0].status,'done');assert.equal(require(path.join(source,'sum.js'))(2,3),5);
 const restored=new WorkManager({dir:work.dir,configStore:store});assert.equal(restored.read().runs[0].status,'integrated');
});
test('unverified access and remote modes cannot launch; stale probe revision rejected',async t=>{
 const{source,store,work}=setup(t);const job=work.createTask(task(source));assert.throws(()=>work.start(job.id,'opus-claude'),/probe/);await work.probe('opus-claude');
 const next=store.read();next.policy.maxCandidates=2;store.save(next,1);assert.equal(work.environment().length,0);assert.throws(()=>work.start(job.id,'opus-claude'),/probe/);
 const remote=work.createTask({...task(source),topology:'remote'});assert.throws(()=>work.start(remote.id,'opus-claude'),/local/);
});
test('a stale viewed config revision cannot dispatch even after another client refreshes the probe',async t=>{
 let starts=0;
 const {source,store,work}=setup(t,async args=>{if(!args.prompt.includes('READY'))starts++;return{status:'reported',reportedModel:'claude-opus-5-5',text:'Fixture, not an AI call',exitCode:0};});
 await work.probe('opus-claude');const job=work.createTask(task(source)),viewed=store.read().revision;
 const changed=store.read();changed.models[0].label+=' updated elsewhere';store.save(changed,changed.revision);
 await work.probe('opus-claude');
 let rejected;try{work.start(job.id,'opus-claude',{expectedConfigRevision:viewed});}catch(error){rejected=error;}
 await wait(work);assert.equal(starts,0,'Stale UI config must not launch a runtime');assert.match(rejected?.message||'',/Configuration changed/);assert.equal(work.read().runs.length,0);
 const current=store.read().revision,run=work.start(job.id,'opus-claude',{expectedConfigRevision:current});await wait(work);
 assert.equal(starts,1);assert.equal(run.configRevision,current);
});
test('a stale viewed requirement revision cannot dispatch a changed task',async t=>{
 let starts=0;const{source,work}=setup(t,async args=>{if(!args.prompt.includes('READY'))starts++;return{status:'reported',reportedModel:'claude-opus-5-5',text:'Fixture',exitCode:0};});
 await work.probe('opus-claude');const job=work.createTask(task(source));work.configureTask(job.id,{expectedRevision:job.requirementRevision,acceptance:['New acceptance introduced by another client']});
 let rejected;try{work.start(job.id,'opus-claude',{expectedRequirementRevision:job.requirementRevision});}catch(error){rejected=error;}
 await wait(work);assert.equal(starts,0,'A changed task must not launch from an old view');assert.match(rejected?.message||'',/Task changed/);assert.equal(work.read().runs.length,0);
});
test('a profile remap with a fresh probe cannot silently switch the model chosen in an older view',async t=>{
 const requested=[];const{source,store,work}=setup(t,async args=>{if(!args.prompt.includes('READY'))requested.push(args.modelId);return{status:'reported',reportedModel:args.modelId,text:'Deterministic model-identity fixture',exitCode:0};});
 await work.probe('opus-claude');const job=work.createTask(task(source)),viewed=store.read().revision;
 const changed=store.read();changed.models.find(m=>m.id==='opus').providerModelId='fixture-remapped-model';const current=store.save(changed,changed.revision).revision;
 await work.probe('opus-claude');
 assert.throws(()=>work.start(job.id,'opus-claude',{expectedConfigRevision:viewed}),/Configuration changed/);assert.deepEqual(requested,[]);
 const run=work.start(job.id,'opus-claude',{expectedConfigRevision:current,expectedRequirementRevision:job.requirementRevision});await wait(work);
 assert.deepEqual(requested,['fixture-remapped-model']);assert.equal(run.requestedModel,'fixture-remapped-model');assert.equal(work.read().runs[0].reportedModel,'fixture-remapped-model');
});
test('overlapping probes of one profile and config invoke the runner only once',async t=>{
 let calls=0,release;const gate=new Promise(resolve=>{release=resolve;});
 const{work}=setup(t,async args=>{calls++;await gate;return{status:'reported',reportedModel:args.modelId};});
 const first=work.probe('opus-claude'),second=work.probe('opus-claude');
 try{await new Promise(setImmediate);assert.equal(calls,1,'Repeated same-input probes must share the in-flight runner');}
 finally{release();await Promise.allSettled([first,second]);}
 const [a,b]=await Promise.all([first,second]);assert.deepEqual(a,b);assert.equal(work.read().observations.length,1);
 await work.probe('opus-claude');assert.equal(calls,2,'A later explicit probe is a fresh invocation');
});
test('an older probe cannot overwrite a newer config observation when results arrive out of order',async t=>{
 const releases=[];const{work,store}=setup(t,args=>new Promise(resolve=>releases.push(()=>resolve({status:'reported',reportedModel:args.modelId}))));
 const older=work.probe('opus-claude');await new Promise(setImmediate);
 const config=store.read();config.models[0].label+=' newer config';const current=store.save(config,config.revision).revision;
 const newer=work.probe('opus-claude');await new Promise(setImmediate);
 try{assert.equal(releases.length,2,'Different config revisions must not share a probe');releases[1]();await newer;releases[0]();await older;assert(work.environment().some(o=>o.profileId==='opus-claude'&&o.configRevision===current),'Newer access evidence must survive the late older result');}
 finally{for(const release of releases)release();await Promise.allSettled([older,newer]);}
});
test('closing the manager aborts and drains an in-flight access probe',async t=>{
 let signal,release,ended=false;const{work}=setup(t,args=>new Promise(resolve=>{signal=args.signal;release=()=>resolve({status:'reported',reportedModel:args.modelId});signal?.addEventListener('abort',()=>setTimeout(()=>{ended=true;resolve({status:'cancelled',reportedModel:'unknown'});},20),{once:true});}));
 const pending=work.probe('opus-claude');await new Promise(setImmediate);
 try{await work.close();assert.equal(signal?.aborted,true);assert.equal(ended,true,'close must wait until the probe stops');}
 finally{release?.();await Promise.allSettled([pending]);}
});
test('a probe from a stale viewed config cannot invoke a remapped profile',async t=>{
 let calls=0;const{work,store}=setup(t,async args=>{calls++;return{status:'reported',reportedModel:args.modelId};});
 const viewed=store.read().revision,c=store.read();c.models.find(m=>m.id==='opus').providerModelId='fixture-probe-remap';const current=store.save(c,c.revision).revision;
 let error;try{await work.probe('opus-claude',viewed);}catch(e){error=e;}
 assert.equal(calls,0,'Stale probe intent must not start a provider invocation');assert.match(error?.message||'',/Configuration changed/);
 const observation=await work.probe('opus-claude',current);assert.equal(calls,1);assert.equal(observation.providerModelId,'fixture-probe-remap');
});
test('a failed probe releases its in-flight entry so an explicit retry can run',async t=>{
 let calls=0;const{work}=setup(t,async args=>{if(++calls===1)throw Error('Controlled fixture failure');return{status:'reported',reportedModel:args.modelId};});
 await assert.rejects(work.probe('opus-claude'),/Controlled fixture failure/);assert.equal(work.probes.size,0);assert.equal(work.pending.size,0);
 assert.equal((await work.probe('opus-claude')).modelVerified,true);assert.equal(calls,2);assert.equal(work.probes.size,0);
});
test('source dependency changes without HEAD change block integration',async t=>{
 const{source,work}=setup(t);await work.probe('opus-claude');const job=work.createTask(task(source)),run=work.start(job.id,'opus-claude');await wait(work);await work.verify(run.id);
 fs.appendFileSync(path.join(source,'test/sum.test.js'),'// changed\n');await assert.rejects(()=>work.integrate(run.id),/Source snapshot changed/);assert.match(fs.readFileSync(path.join(source,'sum.js'),'utf8'),/a-b/);
});
test('worker writes outside scope are rejected and not accepted',async t=>{
 const{source,work}=setup(t,async a=>{if(!a.prompt.includes('READY'))fs.writeFileSync(path.join(a.workspace,'extra.js'),'bad');return{status:'reported',reportedModel:'claude-opus-5-5',text:'done',exitCode:0};});await work.probe('opus-claude');const j=work.createTask(task(source));const r=work.start(j.id,'opus-claude');await wait(work);assert.equal(work.read().runs[0].status,'rejected');await assert.rejects(()=>work.verify(r.id),/no report/);assert.equal(fs.existsSync(path.join(source,'extra.js')),false);
});
test('prototype-named source files survive execution copy and snapshot serialization',async t=>{
 const {source,work}=setup(t,async a=>{if(!a.prompt.includes('READY'))assert.equal(fs.readFileSync(path.join(a.workspace,'__proto__'),'utf8'),'source input must survive');return{status:'reported',reportedModel:'claude-opus-5-5',text:'fixture',exitCode:0};});
 fs.writeFileSync(path.join(source,'__proto__'),'source input must survive');
 await work.probe('opus-claude');const job=work.createTask(task(source));work.start(job.id,'opus-claude');await wait(work);
 const run=work.read().runs[0];assert.equal(run.status,'reported',run.error);assert(Object.hasOwn(run.before,'__proto__'));assert.equal(run.before.__proto__.size,25);
});
test('prototype-named output cannot disappear from outside-scope rejection',async t=>{
 const {source,work}=setup(t,async a=>{if(!a.prompt.includes('READY'))fs.writeFileSync(path.join(a.workspace,'__proto__'),'outside scope');return{status:'reported',reportedModel:'claude-opus-5-5',text:'fixture',exitCode:0};});
 await work.probe('opus-claude');const job=work.createTask(task(source));work.start(job.id,'opus-claude');await wait(work);
 const run=work.read().runs[0];assert.equal(run.status,'rejected');assert.match(run.error,/outside assigned scope/);assert(run.changes.some(c=>c.file==='__proto__'));
});
test('unknown actual model cannot verify, failures and cancellation stay separate',async t=>{
 const{source,work}=setup(t,async a=>({status:'reported',reportedModel:a.prompt.includes('READY')?'claude-opus-5-5':'unknown',text:'done',exitCode:0}));await work.probe('opus-claude');const j=work.createTask(task(source)),r=work.start(j.id,'opus-claude');await wait(work);await assert.rejects(()=>work.verify(r.id),/identity/);assert.notEqual(work.read().tasks[0].status,'done');
});
test('validation rejects traversal, symlinks and mutable verification source',t=>{
 const{source}=setup(t);assert.throws(()=>checkTask({...task(source),writePaths:['../escape']}),/paths/);assert.throws(()=>checkTask({...task(source),writePaths:['test']}),/Verification/);
 fs.symlinkSync('/tmp/nonexistent-am-path',path.join(source,'link'));assert.throws(()=>safeFile(source,'link/payload'),/Symlinks/);
});
test('task budget and independent-review policy cannot be bypassed at dispatch/integration',async t=>{
 const{source,work}=setup(t);await work.probe('opus-claude');const low=work.createTask({...task(source),budget:{maxCostTier:'low'}});assert.throws(()=>work.start(low.id,'opus-claude'),/constraints/);
 const high=work.createTask({...task(source),risk:'high'}),run=work.start(high.id,'opus-claude');await wait(work);assert.equal(work.read().runs.find(r=>r.id===run.id).decision.review.required,true);await work.verify(run.id);await assert.rejects(()=>work.integrate(run.id),/independent review/);
});
test('explicit refresh invalidates verification and preserves original config while rebasing unchanged paths',async t=>{
 const{source,work}=setup(t);await work.probe('opus-claude');const job=work.createTask(task(source)),run=work.start(job.id,'opus-claude');await wait(work);await work.verify(run.id);fs.writeFileSync(path.join(source,'extra.txt'),'new context');const rebased=work.rebase(run.id);assert.equal(rebased.status,'reported');assert.deepEqual(rebased.evidence,[]);assert.equal(rebased.configRevision,1);assert.equal(fs.readFileSync(path.join(rebased.workspace,'extra.txt'),'utf8'),'new context');await work.verify(run.id);assert.equal((await work.integrate(run.id)).status,'integrated');
});
test('protected output files are rejected instead of disappearing from scope checks',async t=>{
 const{source,work}=setup(t,async a=>{if(!a.prompt.includes('READY')){fs.mkdirSync(path.join(a.workspace,'.claude'));fs.writeFileSync(path.join(a.workspace,'.claude/settings.json'),'{}');}return{status:'reported',reportedModel:'claude-opus-5-5',text:'done',exitCode:0};});await work.probe('opus-claude');const taskId=work.createTask(task(source)).id;work.start(taskId,'opus-claude');await wait(work);assert.equal(work.read().runs[0].status,'failed');assert.match(work.read().runs[0].error,/protected/);
});
