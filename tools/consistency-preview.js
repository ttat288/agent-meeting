'use strict';
// Run: node tools/consistency-preview.js. Uses port 3118 and prints its disposable source path.
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {createApp}=require('../src/server');
const {wrapExecution}=require('../src/execution-sandbox');
// Deterministic test adapter only: no AI CLI, credentials, settings or user repository.
const root=process.env.AM_PREVIEW_ROOT || fs.mkdtempSync(path.join(require('os').tmpdir(),'am-consistency-preview-'));fs.mkdirSync(root,{recursive:true});const source=path.join(root,'source');
if(!fs.existsSync(source)){fs.mkdirSync(path.join(source,'test'),{recursive:true});fs.writeFileSync(path.join(source,'sum.js'),'module.exports = (a,b) => a-b;\n');fs.writeFileSync(path.join(source,'test/sum.test.js'),"require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");execFileSync('git',['init','-q',source]);execFileSync('git',['-C',source,'add','.']);execFileSync('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);}
const app=createApp({configDir:root+'/config',workDir:root+'/work',dataDir:root+'/rooms',runCli:async a=>{
 if(!a.prompt.includes('READY') && Number(process.env.AM_PREVIEW_DELAY_MS)>0) await new Promise(resolve=>{const timer=setTimeout(resolve,Number(process.env.AM_PREVIEW_DELAY_MS));a.signal?.addEventListener('abort',()=>{clearTimeout(timer);resolve();},{once:true});});
 if(a.signal?.aborted)return{status:'cancelled',reportedModel:'fixture-model',text:'Cancelled fixture',exitCode:null};
 if(!a.prompt.includes('READY')){const w=wrapExecution(process.execPath,['-e',"require('fs').writeFileSync('sum.js','module.exports = (a,b) => a+b;\\n')"],{workspace:a.workspace,write:true});execFileSync(w.bin,w.args,{cwd:a.workspace});}
 return{status:'reported',reportedModel:'fixture-model',text:'Deterministic Node subprocess fixture; not a paid AI model.',exitCode:0};
}});
const c=app.configStore.read();if(c.revision===1){const m=c.models.find(m=>m.id==='opus');Object.assign(m,{providerModelId:'fixture-model',enabled:true,verification:'verified',source:{...m.source,confidence:'user-configured',checkedAt:new Date().toISOString()}});c.profiles.find(p=>p.id==='opus-claude').enabled=true;app.configStore.save(c,c.revision);}
const room=app.restore('host_consistency_preview_1234')||app.create({hostKey:'host_consistency_preview_1234',id:'agent_consistency_preview_1234',fixed:true});
if(process.env.AM_PREVIEW_SCENARIOS === '1') for(const key of ['host_ui_empty_preview_1234','host_ui_errors_preview_1234']) if(!app.restore(key)) app.create({hostKey:key,id:'agent_'+key,fixed:true});
const port=Number(process.env.AM_PREVIEW_PORT || 3118);
app.server.listen(port,'127.0.0.1',()=>console.log('Isolated fixture preview ready at '+port+'; source '+source));
process.on('SIGTERM',()=>{app.close();process.exit(0);});
