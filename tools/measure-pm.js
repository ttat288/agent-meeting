#!/usr/bin/env node
'use strict';
// Deterministic comparison only. No paid model/CLI, global settings, or user checkout writes.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const { Meeting } = require('../src/meeting');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const { WorkManager, runTest } = require('../src/work');
const { PmOperator } = require('../src/pm');
const { wrapExecution } = require('../src/execution-sandbox');
async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'am-pm-compare-'));
  let work, pm;
  const objective = 'Correct sum', acceptance = ['sum(2,3)=5'], writePaths = ['sum.js'], testFiles = ['test/sum.test.js'];
  const prompt = JSON.stringify({ objective, acceptance, scope: writePaths, rules: ['Only change sum.js; do not change tests, commit, push, deploy or read secrets.'] });
  const directParts = [prompt], pmParts = [], workerParts = [];
  const createSource = name => {
    const source=path.join(dir,name);fs.mkdirSync(path.join(source,'test'),{recursive:true});
    fs.writeFileSync(path.join(source,'sum.js'),'module.exports=(a,b)=>a-b;\n');
    fs.writeFileSync(path.join(source,'test/sum.test.js'),"require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
    execFileSync('git',['init','-q',source]);execFileSync('git',['-C',source,'add','.']);execFileSync('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);return source;
  };
  const fixture = async a => {
    if(a.prompt.includes('READY')) return {status:'reported',reportedModel:'fixture-model'};
    workerParts.push(a.prompt);
    const wrapped=wrapExecution(process.execPath,['-e',"require('fs').writeFileSync('sum.js','module.exports=(a,b)=>a+b;\\n')"],{workspace:a.workspace,write:true});
    try{execFileSync(wrapped.bin,wrapped.args,{cwd:a.workspace});}finally{wrapped.cleanup();}
    return {status:'reported',reportedModel:'fixture-model',text:'Deterministic fixture corrected sum.',exitCode:0,usage:null,costUsd:null};
  };
  try {
    const directSource=createSource('direct'), pmSource=createSource('pm');
    const started=Date.now(), direct=await fixture({prompt,workspace:directSource});
    directParts.push(direct.text);
    const checked=await runTest(directSource,testFiles[0],undefined,true);if(checked.exitCode!==0)throw Error('Direct fixture failed');
    directParts.push(JSON.stringify({exitCode:checked.exitCode,output:checked.output}));
    const directElapsedMs=Date.now()-started;
    workerParts.length=0;
    const config=routing.defaults(), m=config.models.find(m=>m.id==='opus');Object.assign(m,{providerModelId:'fixture-model',enabled:true,verification:'verified',source:{...m.source,confidence:'user-configured',checkedAt:new Date().toISOString()}});config.profiles.find(p=>p.id==='opus-claude').enabled=true;
    const store=new ConfigStore({dir:path.join(dir,'config'),defaults:()=>config,validate:routing.validate});
    work=new WorkManager({dir:path.join(dir,'work'),configStore:store,runner:fixture});await work.probe('opus-claude');
    const room=new Meeting();work.syncRoom(room);pm=new PmOperator(work,room);
    const invited=pm.host('invite'), joined=await pm.command(invited.token,'join',{name:'PM fixture',model:'no-real-model'});
    pm.host('approve',{code:joined.code,generation:invited.generation});pm.host('goal',{goal:objective,acceptance});
    pm.host('grant',{goalRevision:1,generation:invited.generation,workspace:pmSource,writePaths,testFiles,profileId:'opus-claude',maxRuns:1,expiresAt:Date.now()+60000,allowUnknownCost:true});
    const operations=[];
    const command=async(action,input={})=>{const result=await pm.command(invited.token,action,input);operations.push(action);pmParts.push(JSON.stringify({action,input}),JSON.stringify(result));return result;};
    const pmStarted=Date.now(), task=await command('plan',{goalRevision:1}), run=await command('run',{goalRevision:1,taskId:task.id});
    for(let i=0;i<100&&work.active.size;i++)await new Promise(r=>setTimeout(r,10));if(work.active.size)throw Error('Fixture deadline');
    await command('state',{after:1});await command('verify',{goalRevision:1,runId:run.id});await command('integrate',{goalRevision:1,runId:run.id});
    const report=await command('report',{goalRevision:1,runId:run.id,text:'Correct sum; independent tests passed on integrated source.'});
    if(report.status!=='completed')throw Error('PM fixture not completed');
    // Same quality criterion: same fix bytes and the same immutable independent test source.
    const sameOutput=fs.readFileSync(path.join(directSource,'sum.js')).equals(fs.readFileSync(path.join(pmSource,'sum.js')));
    if(!sameOutput)throw Error('Different fixture output');
    process.stdout.write(JSON.stringify({schema:'agent-meeting/pm-fixture-comparison@1',scope:'Synthetic payload comparison, not model turns or billing. Excludes PM invitation prompt, reasoning, hidden prompts, caching, network envelopes, PM external CLI usage, runtime probe/setup, review/fix loops, retries and human time. PM token count is a lower bound on orchestration overhead, not a total cost estimate.',metrics:{sameObjective:objective,sameAcceptance:acceptance,sameOutput,direct:{workerCalls:1,independentTestRuns:1,elapsedMs:directElapsedMs},pm:{workerCalls:1,independentTestRuns:2,operations,elapsedMs:Date.now()-pmStarted},usage:null,costUsd:null,userInterventions:'Not measured: fixture scripts emulate both actors. PM removes manual run/verify/integrate controls after grant but adds invitation/confirmation/goal/grant setup. A direct coding CLI can already do this task with one goal.'},cases:[{id:'single-sum-fixture',before:directParts,after:[...pmParts,...workerParts,'Deterministic fixture corrected sum.']}]},null,2)+'\n');
  } finally {pm?.close();work?.close();fs.rmSync(dir,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
