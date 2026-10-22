'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), net = require('node:net'), crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { createApp } = require('../src/server');
const { WorkManager, inventory, changes } = require('../src/work');
const cli = path.resolve(__dirname, '../bin/cli.js');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) { for (let i=0;i<300;i++) { if (await fn()) return; await sleep(10); } throw Error('CLI condition did not become ready'); }
async function port() { const server=net.createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); const n=server.address().port; await new Promise(resolve=>server.close(resolve)); return n; }
async function fixture(t, operation) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'am-cli-shutdown-')), source=path.join(root,'source'), workspace=path.join(root,'workspace');
  let child, exited;
  t.after(async()=>{if(child && child.exitCode===null && child.signalCode===null)child.kill('SIGKILL');if(exited)await exited;fs.rmSync(root,{recursive:true,force:true});});
  fs.mkdirSync(path.join(source,'test'),{recursive:true});
  fs.writeFileSync(path.join(source,'sum.js'),'module.exports=(a,b)=>a-b;\n');
  fs.writeFileSync(path.join(source,'test/slow.test.js'),"require('node:test')('controlled slow verification',async()=>{await new Promise(r=>setTimeout(r,15000));});\n");
  execFileSync('git',['init','-q',source]);execFileSync('git',['-C',source,'add','.']);execFileSync('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  fs.cpSync(source,workspace,{recursive:true,filter:p=>path.basename(p)!=='.git'});
  const before=inventory(workspace);fs.writeFileSync(path.join(workspace,'sum.js'),'module.exports=(a,b)=>a+b;\n');
  const hostKey='host_cli_shutdown_1234', agentKey='agent_cli_shutdown_1234';
  const cfg={dataDir:path.join(root,'rooms'),configDir:path.join(root,'config'),workDir:path.join(root,'work')};
  const app=createApp(cfg), room=app.create({hostKey,id:agentKey,fixed:true});room.start('Isolated shutdown fixture','Test cancellation',{},[]);app.flush();
  const workDir=path.join(cfg.workDir,crypto.createHash('sha256').update(hostKey).digest('hex'));
  const work=new WorkManager({dir:workDir,configStore:app.configStore});
  work.update(d=>{d.tasks.push({id:'task',requirementRevision:1,status:'verifying',testFiles:['test/slow.test.js']});d.runs.push({id:'run',taskId:'task',requirementRevision:1,source,workspace,before,changes:changes(before,inventory(workspace)),status:operation==='verify'?'reported':'verified',verifiedSnapshot:operation==='integrate'?inventory(workspace):null,requestedModel:'fixture-model',reportedModel:'fixture-model',baseRevision:execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim()});});
  await work.close();await app.close();
  const listenPort=await port(), base='http://127.0.0.1:'+listenPort;
  // Explicit public-url suppresses the CLI's normal global connect-room write.
  child=spawn(process.execPath,[cli,'--local','--no-open','--port',String(listenPort),'--public-url',base,'--host-key',hostKey,'--agent-key',agentKey,'--data-dir',cfg.dataDir,'--config-dir',cfg.configDir,'--work-dir',cfg.workDir],{cwd:root,stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
  exited=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  await until(()=>output.includes('đã sẵn sàng'));
  const request=fetch(base+'/api/host/'+hostKey+'/work/runs/run/'+operation,{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).catch(e=>({connectionClosed:e.message}));
  await until(()=>JSON.parse(fs.readFileSync(path.join(workDir,'config.json'),'utf8')).runs[0].status===(operation==='verify'?'verifying':'integrating'));
  return {root,source,workDir,child,exited,request,output:()=>output};
}
for(const [operation,signal] of [['verify','SIGINT'],['integrate','SIGTERM']]) test('CLI '+signal+' drains '+operation+' before process exit',{skip:process.platform!=='linux'},async t=>{
  const f=await fixture(t,operation);
  if(operation==='integrate')assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/a\+b/);
  f.child.kill(signal);const end=await f.exited;await f.request;
  assert.deepEqual(end,{code:0,signal:null},f.output());
  const state=JSON.parse(fs.readFileSync(path.join(f.workDir,'config.json'),'utf8'));
  assert.equal(state.runs[0].status,'cancelled','CLI exit must follow persisted cancellation');
  assert.equal(state.tasks[0].status,'cancelled');
  if(operation==='integrate')assert.equal(state.runs[0].rollback,'restored');
  assert.match(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),/a-b/);
});
