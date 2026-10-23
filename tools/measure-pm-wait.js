#!/usr/bin/env node
'use strict';
// PM transport control only. No worker, model, server port, or billing inference.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {WorkManager}=require('../src/work');
const {ConfigStore}=require('../src/config-store');
const routing=require('../src/routing');
const {Meeting}=require('../src/meeting');
const {PmOperator}=require('../src/pm');
async function measure(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-pm-wait-'));
  const configStore=new ConfigStore({dir:path.join(dir,'config'),defaults:routing.defaults,validate:routing.validate});
  const work=new WorkManager({dir:path.join(dir,'work'),configStore,runner:async()=>{throw Error('Model prohibited');}});
  const room=new Meeting();work.syncRoom(room);const pm=new PmOperator(work,room);
  let sentinel;
  try{
    const invite=pm.host('invite'),join=await pm.command(invite.token,'join',{name:'Transport control',model:'no-model'});
    pm.host('approve',{code:join.code,generation:invite.generation});
    pm.host('goal',{goal:'Observe a changed goal before waiting.',acceptance:['Receive existing changes without an idle wait.']});
    const first=await pm.command(invite.token,'state');
    const repeat=await pm.command(invite.token,'state',{cursor:first.cursor});
    pm.host('message',{text:'Change already present before wait.'});
    let start=Date.now();const changed=await pm.command(invite.token,'wait',{cursor:first.cursor});const cursorWaitMs=Date.now()-start;
    // Legacy wait has no cursor. Release it after 500ms so this control is bounded.
    sentinel=setTimeout(()=>pm.host('message',{text:'Bounded control release.'}),500);
    start=Date.now();await pm.command(invite.token,'wait');const legacyWaitMs=Date.now()-start;
    return {schema:'agent-meeting/pm-wait-control@1',modelCalls:0,usage:null,costUsd:null,
      fullStateBytes:Buffer.byteLength(JSON.stringify(first)),unchangedStateBytes:Buffer.byteLength(JSON.stringify(repeat)),
      cursorWaitMs,legacyWaitMs,changedDelivered:changed.messages.some(m=>m.text==='Change already present before wait.'),
      scope:'Transport control: legacy wait released by sentinel after 500ms; without a new revision it waits up to 25s. Payload bytes are not tokens, billed cost, or total PM efficiency.'};
  }finally{clearTimeout(sentinel);pm.close();work.close();fs.rmSync(dir,{recursive:true,force:true});}
}
measure().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
