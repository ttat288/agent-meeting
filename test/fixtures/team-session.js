'use strict';
// Deterministic protocol/process fixture. No provider/model calls.
const fs = require('fs'), path = require('path');
const { spawn, execFileSync } = require('child_process');
const { wrapExecution } = require('../../src/execution-sandbox');
let options, checkpoint;
const result = { status: 'reported', reportedModel: 'fixture-model', text: 'Fixture successor preserved WIP and acceptance', exitCode: 0, usage: null, costUsd: null };
process.on('message', m => {
  if (m.type === 'request-error') { process.send({type:'failure',error:m.error},()=>process.exit(1)); return; }
  if (m.type === 'boot') {
    options = m.options; checkpoint = m.checkpoint;
    if (checkpoint) {
      const mode = /fixture-mode:([\w-]+)/.exec(fs.readFileSync(path.join(options.workspace,'sum.js'),'utf8'))?.[1] || '';
      if (mode === 'timeout') return;
      const wrapped = wrapExecution(process.execPath, ['-e', `const fs=require('fs');const assert=require('assert');assert.match(fs.readFileSync('sum.js','utf8'),/WIP/);let denied=false;try{fs.writeFileSync('sum.js','illegal bootstrap write')}catch{denied=true}assert(denied);`], { workspace: options.workspace, write: false });
      try { execFileSync(wrapped.bin,wrapped.args,{cwd:options.workspace}); } catch (e) { process.send({type:'failure',error:e.message}); return; } finally {wrapped.cleanup();}
      if (mode === 'bad-ack') { process.send({type:'ready',checkpointHash:'wrong',generation:999,model:'fake'}); return; }
      const ready = () => process.send({ type:'ready',checkpointHash:checkpoint.hash,generation:checkpoint.generation,model:options.modelId,usage:null,costUsd:null });
      if (mode === 'delay') setTimeout(ready, 300); else ready();
    } else process.send({type:'ready',model:options.modelId});
  }
  if (m.type === 'activate') {
    const code = checkpoint
      ? `const fs=require('fs');const assert=require('assert');assert.match(fs.readFileSync('sum.js','utf8'),/WIP/);fs.writeFileSync('sum.js','module.exports=(a,b)=>a+b; // preserved WIP\\n');`
      : `const fs=require('fs');fs.writeFileSync('sum.js','module.exports=(a,b)=>a+b; // WIP\\n');console.log('WIP_READY');process.on('SIGTERM',()=>{});setInterval(()=>{},50);`;
    const wrapped = wrapExecution(process.execPath,['-e',code],{workspace:options.workspace,write:true});
    const child = spawn(wrapped.bin,wrapped.args,{cwd:options.workspace,stdio:['ignore','pipe','ignore']});
    if (!checkpoint && process.env.AM_FIXTURE_AUTO === '1') child.stdout.once('data', () => {
      process.send({type:'request',request:{...JSON.parse(options.prompt).runtimeControl, decisions:'Keep scope, WIP, sum acceptance; no commit/settings',unknowns:'Billing is unknown',next:'Continue same task and slot A'}});
    });
    child.on('close',code=>{wrapped.cleanup(); if(checkpoint)process.send({type:'result',result:{...result,reportedModel:options.modelId,exitCode:code}},()=>process.exit(0));});
  }
});
process.on('disconnect',()=>process.exit(1));
