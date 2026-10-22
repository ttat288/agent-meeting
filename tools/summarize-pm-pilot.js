#!/usr/bin/env node
'use strict';
// Offline ledger arithmetic only; missing evidence must never become a zero or a win.
const fs = require('node:fs');
const known = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
function summarize(d) {
  if (d.schema !== 'agent-meeting/pm-pilot-ledger@1') throw Error('Unsupported ledger');
  const rows=d.runs.map(r=>{
    const roles=r.arm==='pm'?['pm','worker']:['direct'];
    const calls=r.calls || [];
    const costKnown=r.completeCallInventory===true && roles.every(role=>calls.some(c=>c.role===role)) &&
      calls.every(c=>known(c.costUsd)&&c.provenance) && known(r.totalCostUsd) && r.costProvenance;
    const sum=calls.reduce((n,c)=>n+(known(c.costUsd)?c.costUsd:0),0);
    // Provider aggregate may differ from the per-call sum; require explicit reconciliation.
    const reconciled=costKnown && Math.abs(sum-r.totalCostUsd)<0.000001;
    const quality=r.status==='completed' && ['acceptance','regression','scope','review'].every(k=>r.quality?.[k]===true) && r.quality.artifacts?.length>0;
    return {id:r.id,arm:r.arm,quality,costUsd:reconciled?r.totalCostUsd:null,
      directorActiveMs:[r.director?.activeMs,r.setup?.directorActiveMs,r.recoveryMs,r.maintenanceMs].every(known)?r.director.activeMs+r.setup.directorActiveMs+r.recoveryMs+r.maintenanceMs:null,
      elapsedMs:known(r.elapsedMs)?r.elapsedMs:null,
      comparable:quality&&r.inputDigest===d.inputDigest&&r.taskDigest===d.taskDigest,
      requestedModel:r.requestedModel,actualModels:r.actualModels,cliVersion:r.cliVersion};
  });
  const direct=rows.find(r=>r.arm==='direct'), pm=rows.find(r=>r.arm==='pm');
  const shared=d.sharedSetup;
  const sharedKnown=known(shared?.humanActiveMs)&&known(shared?.elapsedMs)&&known(shared?.costUsd)&&shared?.provenance;
  const identity=direct?.requestedModel && direct.requestedModel===pm?.requestedModel && direct.cliVersion && direct.cliVersion===pm?.cliVersion &&
    [direct,pm].every(r=>r.actualModels?.length && r.actualModels.every(m=>m===r.requestedModel));
  const eligible=d.authorization?.granted===true && rows.length===2 && direct?.comparable && pm?.comparable && sharedKnown && identity;
  const savings=(a,b)=>known(a)&&known(b)&&a>0?100*(a-b)/a:null;
  // Common case preparation is included in BOTH standalone alternatives, not silently discarded.
  const withShared=(r,key,extra)=>known(r?.[key])&&known(extra)?r[key]+extra:null;
  const costSavingPercent=savings(withShared(direct,'costUsd',shared?.costUsd),withShared(pm,'costUsd',shared?.costUsd));
  const directorSavingPercent=savings(withShared(direct,'directorActiveMs',shared?.humanActiveMs),withShared(pm,'directorActiveMs',shared?.humanActiveMs));
  const observedCandidate=eligible&&costSavingPercent!==null&&directorSavingPercent!==null&&
    ((costSavingPercent>=20&&directorSavingPercent>=-10)||(directorSavingPercent>=20&&costSavingPercent>=-10));
  return {schema:'agent-meeting/pm-pilot-summary@1',rows,costSavingPercent,directorSavingPercent,
    verdict:!eligible||costSavingPercent===null||directorSavingPercent===null?'insufficient-evidence':observedCandidate?'pilot-candidate-needs-replication':'no-meaningful-saving-in-this-pilot',
    limits:['One small repository repair; no general PM efficiency claim.','No amortization without observed reuse.',
      'Token counts need provider provenance per call; not inferred from payload bytes.','Cost reduction and director effort reduction are distinct metrics.']};
}
if(require.main===module){try{console.log(JSON.stringify(summarize(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={summarize};
