'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {summarize}=require('../tools/summarize-pm-pilot');
function ledger(){return {schema:'agent-meeting/pm-pilot-ledger@1',inputDigest:'input',taskDigest:'task',authorization:{granted:true},
  sharedSetup:{humanActiveMs:10,elapsedMs:10,costUsd:0,provenance:'operator log'},
  runs:['direct','pm'].map(arm=>({id:arm,arm,status:'completed',inputDigest:'input',taskDigest:'task',requestedModel:'same',actualModels:['same'],cliVersion:'same-version',
    quality:{acceptance:true,regression:true,scope:true,review:true,artifacts:['test log + diff review']},
    director:{activeMs:100},setup:{directorActiveMs:10},recoveryMs:0,maintenanceMs:0,elapsedMs:1000,completeCallInventory:true,
    calls:(arm==='pm'?['pm','worker']:['direct']).map(role=>({role,costUsd:1,provenance:'test only'})),
    totalCostUsd:arm==='pm'?2:1,costProvenance:'test only'}))};}
test('pilot preserves PM losing rather than forcing a win',()=>{
  assert.equal(summarize(ledger()).verdict,'no-meaningful-saving-in-this-pilot');
});
test('pilot unknown billing, missing PM calls or quality cannot become a win',()=>{
  for(const change of [d=>d.runs[1].calls[0].costUsd=null,d=>d.runs[1].calls.shift(),d=>d.runs[0].quality.acceptance=false,
    d=>d.sharedSetup.humanActiveMs=null,d=>d.authorization.granted=false,d=>d.runs[1].actualModels=['different'],
    d=>d.runs[1].inputDigest='different',d=>d.runs[1].totalCostUsd=0,d=>d.runs[1].recoveryMs=null]){
    const d=ledger();change(d);assert.equal(summarize(d).verdict,'insufficient-evidence');
  }
});
test('pilot includes setup, never claims general savings, and requires replication of an observed candidate',()=>{
  const d=ledger();d.runs[0].calls[0].costUsd=4;d.runs[0].totalCostUsd=4;
  d.runs[1].director.activeMs=50;d.runs[1].setup.directorActiveMs=100;
  assert.equal(summarize(d).verdict,'no-meaningful-saving-in-this-pilot');
  d.runs[1].setup.directorActiveMs=10;
  assert.equal(summarize(d).verdict,'pilot-candidate-needs-replication');
  d.sharedSetup.costUsd=100;
  d.runs[1].director.activeMs=100;
  assert.equal(summarize(d).verdict,'no-meaningful-saving-in-this-pilot');
});
