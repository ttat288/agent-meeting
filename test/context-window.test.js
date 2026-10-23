'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {sample,measure,readTrace}=require('../tools/measure-context-window');
function record(extra={}){return {schema:'agent-meeting/context-sample@1',runId:'fixture',actorId:'worker',eventId:'e1',at:1,source:'claude-statusline',
  data:{session_id:'session-1',version:'fixture-version',model:{id:'fixture-model'},context_window:{context_window_size:100000,used_percentage:15,
    total_input_tokens:99999999,total_output_tokens:99999999,current_usage:{input_tokens:5000,cache_creation_input_tokens:3000,cache_read_input_tokens:7000,output_tokens:4000}}},...extra};}
test('context uses current input/cache components, not output or ambiguous total fields',()=>{
  const s=sample(record());assert.equal(s.currentInputTokens,15000);assert.equal(s.usedPercent,15);
  assert.equal(s.percentDisagreement,false);assert(!JSON.stringify(s).includes('99999999'));
});
test('missing/null post-compaction telemetry and unsupported runtime remain unknown',()=>{
  for(const mutate of [r=>r.data.context_window.current_usage=null,r=>r.data.context_window.current_usage=undefined,r=>r.source='codex-app-server',r=>r.source='model-prose']){
    const r=record();mutate(r);const s=sample(r);assert.equal(s.currentInputTokens,null);assert.equal(s.usedPercent,null);
    assert.equal(measure([r]).actors[0].status,'insufficient-telemetry');
  }
});
test('percentage-only reports stay separate from token counts and inconsistent reports invalidate observations',()=>{
  const r=record();delete r.data.context_window.current_usage.cache_read_input_tokens;
  assert.equal(sample(r).currentInputTokens,null);assert.equal(sample(r).usedPercent,15);
  const bad=record();bad.data.context_window.used_percentage=80;
  assert.equal(measure([bad]).actors[0].status,'insufficient-telemetry');
});
test('context reset never hides previous peak or proves knowledge retention',()=>{
  const first=record();first.data.context_window.current_usage.input_tokens=85000;first.data.context_window.used_percentage=95;
  const second=record({eventId:'e2',at:2});second.data.session_id='session-2';
  const m=measure([first,second]);assert.equal(m.actors[0].peakUsedPercent,95);assert.equal(m.actors[0].overBudgetSamples,1);
  assert.equal(m.actors[0].status,'observed-over-budget');assert.equal(m.actors[0].sessions.length,2);
  assert.equal(m.qualityVerified,false);assert.equal(m.continuousBoundGuaranteed,false);assert.equal(m.billedCostUsd,null);
});
test('identities, ordering, duplicates, budget and empty traces cannot manufacture a benchmark',()=>{
  assert.throws(()=>measure([record(),record()]),/Duplicate/);
  assert.throws(()=>measure([record({at:2}),record({eventId:'e2',at:1})]),/ordered/);
  assert.throws(()=>sample(record({at:-1})),/identity/);
  assert.throws(()=>measure([],{budgetPercent:0}));assert.throws(()=>measure([],{budgetPercent:101}));
  assert.equal(measure([]).verdict,'insufficient-telemetry');
});
test('offline trace reading is bounded and output does not expose unrelated statusline data',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-context-window-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'trace.jsonl'),r=record();r.data.transcript_path='private-transcript';r.data.secret='do-not-echo';
  fs.writeFileSync(file,JSON.stringify(r)+'\n');assert.equal(readTrace(file).length,1);
  assert.doesNotMatch(JSON.stringify(measure(readTrace(file))),/private-transcript|do-not-echo/);
  fs.writeFileSync(file,'x'.repeat(8*1024*1024+1));assert.throws(()=>readTrace(file),/8 MiB/);
});
