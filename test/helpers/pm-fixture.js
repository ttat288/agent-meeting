'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createApp } = require('../../src/server');
const { wrapExecution } = require('../../src/execution-sandbox');
async function setup(t, behavior = 'fix', extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-pm-test-'));
  const source = path.join(dir, 'source'); fs.mkdirSync(path.join(source, 'test'), { recursive: true });
  fs.writeFileSync(path.join(source, 'sum.js'), 'module.exports=(a,b)=>a-b;\n');
  fs.writeFileSync(path.join(source, 'test/sum.test.js'), "require('node:test')('sum',()=>require('node:assert/strict').equal(require('../sum')(2,3),5));\n");
  execFileSync('git', ['init','-q',source]); execFileSync('git', ['-C',source,'add','.']);
  execFileSync('git', ['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  let calls = 0, starts = 0;
  const cfg = { configDir: path.join(dir,'config'), workDir: path.join(dir,'work'), dataDir: path.join(dir,'rooms'), runCli: async a => {
    calls++;
    if (a.prompt.includes('READY')) return { status: 'reported', reportedModel: a.modelId };
    starts++;
    if (behavior === 'hold') return await new Promise(resolve => a.signal.addEventListener('abort', () => resolve({ status: 'cancelled', reportedModel:'fixture-model' }), { once: true }));
    if (behavior !== 'fail') {
      const wrapped = wrapExecution(process.execPath, ['-e', "require('fs').writeFileSync('sum.js','module.exports=(a,b)=>a+b;\\n')"], { workspace: a.workspace, write: true });
      try { execFileSync(wrapped.bin, wrapped.args, { cwd: a.workspace }); } finally { wrapped.cleanup(); }
    }
    return { status: 'reported', reportedModel: 'fixture-model', text: 'Deterministic subprocess fixture, not an AI model', exitCode: 0, usage: null, costUsd: null };
  }};
  Object.assign(cfg, extra);
  const app = createApp(cfg), room = app.create({hostKey:'host_pm_test_123456',id:'agent_pm_test_123456',fixed:true});
  const c = app.configStore.read(), model = c.models.find(m => m.id === 'opus');
  Object.assign(model, { providerModelId:'fixture-model',enabled:true,verification:'verified',source:{...model.source,confidence:'user-configured',checkedAt:new Date().toISOString()} });
  c.profiles.find(p => p.id === 'opus-claude').enabled = true; app.configStore.save(c,c.revision);
  await new Promise(r => app.server.listen(0,'127.0.0.1',r));
  const origin = 'http://127.0.0.1:' + app.server.address().port;
  t.after(async () => { await app.close(); fs.rmSync(dir,{recursive:true,force:true}); });
  async function request(url, body, token, headers = {}) {
    const r = await fetch(origin+url, { method: body === undefined ? 'GET' : 'POST', headers:{'content-type':'application/json',...(token ? {authorization:'Bearer '+token}:{}),...headers},body:body === undefined ? undefined : JSON.stringify(body) });
    const raw = await r.text(); let data; try {data=JSON.parse(raw);} catch {data=raw;}
    return { status:r.status,data };
  }
  const host = (op,body) => request('/api/host/'+room.hostKey+'/'+op,body);
  let token;
  const pm = (op,body={}) => request('/api/pm/'+room.id+'/'+op,body,token);
  async function join() {
    const invite = await host('pm/invite',{}); assert.equal(invite.status,200); token=invite.data.token;
    const joined = await pm('join',{name:'PM',model:'fixture-pm'}); assert.equal(joined.status,200);
    assert.equal((await host('pm/approve',{code:joined.data.code,generation:invite.data.generation})).status,200);
    return token;
  }
  const grant = (extra={}) => host('pm/grant',{goalRevision:1,generation:1,workspace:source,writePaths:['sum.js'],testFiles:['test/sum.test.js'],profileId:'opus-claude',maxRuns:1,expiresAt:Date.now()+60000,allowUnknownCost:true,...extra});
  async function ready(extra={}) { await join(); await host('pm/goal',{goal:'Correct sum',acceptance:['sum(2,3)=5']}); await host('runtime/probe',{profileId:'opus-claude'}); assert.equal((await grant(extra)).status,200); }
  async function settled(runId) { for(let i=0;i<200;i++){ const s=await pm('state'); const r=s.data.runs?.find(r=>r.id===runId); if(r&&!['running','verifying','integrating'].includes(r.status))return r; await new Promise(r=>setTimeout(r,10)); } throw Error('Fixture failed to settle'); }
  return {dir,source,app,room,cfg,origin,request,host,pm,join,ready,grant,settled,get token(){return token;},get calls(){return calls;},get starts(){return starts;}};
}
module.exports = { setup };
