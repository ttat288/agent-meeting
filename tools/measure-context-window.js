#!/usr/bin/env node
'use strict';
// Offline measurement only. No model calls, transcript reads, settings writes or compaction.
const fs = require('node:fs');
const nonnegative = x => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const finite = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const id = x => typeof x === 'string' && /^[a-zA-Z0-9_.:-]{1,128}$/.test(x);
function sample(record) {
  if (record?.schema !== 'agent-meeting/context-sample@1' || !id(record.runId) || !id(record.actorId) || !id(record.eventId) || !nonnegative(record.at)) throw Error('Invalid context sample identity/time');
  const base = {runId:record.runId,actorId:record.actorId,eventId:record.eventId,at:record.at,source:record.source,
    sessionId:null,model:null,cliVersion:null,currentInputTokens:null,capacityTokens:null,usedPercent:null,
    reportedPercent:null,percentDisagreement:false,observation:'unknown'};
  // Codex app-server needs its own versioned schema adapter; do not guess from cumulative usage.
  if (record.source !== 'claude-statusline') return base;
  const d = record.data || {}, w = d.context_window || {}, u = w.current_usage;
  if (!id(d.session_id)) throw Error('Claude snapshot requires session_id');
  Object.assign(base,{sessionId:d.session_id,model:typeof d.model?.id==='string'?d.model.id.slice(0,128):null,
    cliVersion:typeof d.version==='string'?d.version.slice(0,80):null,
    capacityTokens:nonnegative(w.context_window_size)&&w.context_window_size>0?w.context_window_size:null});
  // Native docs: null before first response and just after /compact. Never call that zero.
  if (!u || typeof u!=='object' || Array.isArray(u)) return base;
  const parts=[u.input_tokens,u.cache_creation_input_tokens,u.cache_read_input_tokens];
  const total=parts.every(nonnegative)?parts.reduce((a,b)=>a+b,0):null;
  if (nonnegative(total)) base.currentInputTokens=total;
  base.reportedPercent=finite(w.used_percentage)?w.used_percentage:null;
  if (base.currentInputTokens!==null && base.capacityTokens!==null) {
    base.usedPercent=100*base.currentInputTokens/base.capacityTokens;
    base.observation='runtime-input-components';
    base.percentDisagreement=base.reportedPercent!==null&&Math.abs(base.reportedPercent-base.usedPercent)>1;
  } else if (base.reportedPercent!==null) {
    base.usedPercent=base.reportedPercent;base.observation='runtime-percentage-only';
  }
  return base;
}
function measure(records, {budgetPercent=80}={}) {
  if(!finite(budgetPercent)||budgetPercent<=0||budgetPercent>100)throw Error('budgetPercent must be >0 and <=100');
  if(!Array.isArray(records)||records.length>10000)throw Error('At most 10000 samples');
  const groups=new Map(), seen=new Set();
  for(const record of records){
    const s=sample(record), event=JSON.stringify([s.runId,s.actorId,s.eventId]);
    if(seen.has(event))throw Error('Duplicate eventId; deduplicate transport before measurement');
    seen.add(event);
    const key=JSON.stringify([s.runId,s.actorId]);
    if(!groups.has(key))groups.set(key,[]);
    const rows=groups.get(key);
    if(rows.length && s.at<rows.at(-1).at)throw Error('Actor observations must be ordered');
    rows.push(s);
  }
  const actors=[...groups.values()].map(rows=>{
    const observed=rows.filter(r=>r.usedPercent!==null&&!r.percentDisagreement);
    const unknown=rows.length-observed.length;
    const tokens=observed.map(r=>r.currentInputTokens).filter(nonnegative);
    const sessions=[...new Set(rows.map(r=>r.sessionId).filter(Boolean))];
    const over=observed.filter(r=>r.usedPercent>budgetPercent);
    return {runId:rows[0].runId,actorId:rows[0].actorId,samples:rows.length,observedSamples:observed.length,unknownSamples:unknown,
      sessions,peakCurrentInputTokens:tokens.length?Math.max(...tokens):null,
      peakUsedPercent:observed.length?Math.max(...observed.map(r=>r.usedPercent)):null,
      overBudgetSamples:over.length,percentDisagreements:rows.filter(r=>r.percentDisagreement).length,
      firstAt:rows[0].at,lastAt:rows.at(-1).at,
      status:over.length?'observed-over-budget':unknown||!observed.length?'insufficient-telemetry':'observed-within-budget',
      models:[...new Set(rows.map(r=>r.model).filter(Boolean))],cliVersions:[...new Set(rows.map(r=>r.cliVersion).filter(Boolean))]};
  });
  return {schema:'agent-meeting/context-window-measurement@1',budgetPercent,actors,
    verdict:actors.length?'sampled-observations-only':'insufficient-telemetry',
    billedCostUsd:null,continuousBoundGuaranteed:false,qualityVerified:false,
    scope:'Offline runtime-reported snapshots. Input includes cache tokens, excludes last response output. No cumulative usage, self-reported model estimates, billing or continuous-limit guarantee.',
    limits:['No runtime context control or collector is installed.',
      'Unobserved intervals, hidden overhead and future tool results may exceed sampled values.',
      'Context drops do not prove successful compaction or retained task knowledge.',
      'Eight-hour reliability requires real runtime traces, independent acceptance and full setup/recovery/cost accounting.']};
}
function readTrace(file){
  const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  try{
    const st=fs.fstatSync(fd);if(!st.isFile()||st.size>8*1024*1024)throw Error('Trace must be a regular file <=8 MiB');
    const b=Buffer.alloc(8*1024*1024+1);let used=0,n;
    while(used<b.length&&(n=fs.readSync(fd,b,used,b.length-used,null))>0)used+=n;
    if(used>8*1024*1024)throw Error('Trace exceeds 8 MiB');
    return b.subarray(0,used).toString('utf8').split(/\r?\n/).filter(s=>s.trim()).map(s=>JSON.parse(s));
  }finally{fs.closeSync(fd);}
}
if(require.main===module){try{
  const [file,budget]=process.argv.slice(2);if(!file||process.argv.length>4)throw Error('Usage: node tools/measure-context-window.js TRACE.jsonl [budgetPercent]');
  console.log(JSON.stringify(measure(readTrace(file),budget===undefined?{}:{budgetPercent:Number(budget)}),null,2));
}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={sample,measure,readTrace};
