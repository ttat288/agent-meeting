#!/usr/bin/env node
'use strict';
// Explicitly opt-in model benchmark. Preparation never invokes a model.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { execFileSync, spawn } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const runtime = require('../src/runtime'), routing = require('../src/routing');
const { ConfigStore } = require('../src/config-store'), { WorkManager, sourceInventory } = require('../src/work');
const root = path.resolve(__dirname, '..'), model = 'claude-opus-4-6-thinking';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const result = extra => ({ type: 'result', subtype: 'success', result: 'Done', ...extra });
const cases = [
  { id: 'negative-cost', adapter: 'claude', output: result({ total_cost_usd: -2, model: 'expected' }) },
  { id: 'string-cost', adapter: 'claude', output: result({ total_cost_usd: '0.2' }) },
  { id: 'zero-cost', adapter: 'claude', output: result({ total_cost_usd: 0 }) },
  { id: 'multiple-models', adapter: 'claude', output: result({ model: 'expected', modelUsage: { expected: {}, other: {} } }) },
  { id: 'single-model', adapter: 'claude', output: result({ model: 'fallback', modelUsage: { actual: {} } }) },
  { id: 'missing-model', adapter: 'claude', output: result({}) },
  { id: 'agy-error', adapter: 'agy', output: { status: 'ERROR', error: 'Access denied' } },
  { id: 'empty-success', adapter: 'claude', output: result({ result: '' }) },
];
const task = { id: 'readonly-runtime-audit-v1', goal: 'Audit the supplied runtime parser: predict its current behavior for every case in task.json, identify evidence problems and recommend minimal remedies.',
  acceptance: ['Read src/runtime.js and task.json without changing any input.', 'Predict actual current behavior, including existing defects; do not substitute desired fixed behavior.', 'Return only JSON: {predictions:[{id,valid,reportedModel,costUsd}],remedies:[{issue,change}],limits:[string]}. Include exactly all eight case IDs, no duplicate predictions.', 'Give concise remedies for negative cost and ambiguous multiple-model evidence; report limitations.'], cases,
  rules: ['Read only this input checkout. Do not access user files, settings, another arm, credentials or network via tools.', 'No file writes, extra models/subagents, commit/push/install/deploy or configuration changes.', 'Native tools and context management remain available; you may execute the supplied parser with Node to check your predictions. Do not alter it.', 'Do not claim your prose model identity as machine evidence. No private reasoning is requested.'] };
function prepare() {
  const started = performance.now(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-readonly-audit-')); fs.chmodSync(dir, 0o700);
  const source = dir + '/input'; fs.mkdirSync(source + '/src', { recursive: true });
  fs.copyFileSync(root + '/docs/evidence/shift-20261022/readonly-audit/input/src/runtime.js', source + '/src/runtime.js');
  fs.writeFileSync(source + '/task.json', JSON.stringify(task, null, 2) + '\n');
  fs.writeFileSync(source + '/AGENTS.md', '# Isolated read-only benchmark fixture\n\nRead task.json. Follow its scope and acceptance. No writes, user files, other arms, extra models, global settings or external tool requests. Native read/compute tools and context management remain enabled.\n');
  execFileSync('git', ['init','-q',source]); execFileSync('git', ['-C',source,'add','.']); execFileSync('git', ['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Freeze read-only audit input']);
  const revision = execFileSync('git', ['-C',source,'rev-parse','HEAD'], { encoding: 'utf8' }).trim();
  for (const arm of ['direct','managed']) execFileSync('git',['clone','-q','--no-hardlinks',source,dir+'/'+arm]);
  const manifest = { schema: 'agent-meeting/readonly-audit-input@1', createdAt: new Date().toISOString(), model, cliVersion: runtime.checkRuntime('agy').version, revision, files: sourceInventory(source), taskDigest: hash(JSON.stringify(task)), preparationMs: performance.now() - started, modelCalls: 0 };
  manifest.sourceDigest = hash(JSON.stringify(manifest.files)); fs.writeFileSync(dir+'/input.json',JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({ directory: dir, sourceDigest: manifest.sourceDigest, taskDigest: manifest.taskDigest, modelCalls: 0 }));
}
function nativeDirect(workspace, prompt) {
  const args = ['--print',prompt,'--model',model,'--output-format','json','--mode','plan','--sandbox','--print-timeout','120s'];
  const started = performance.now(), startedAt = new Date().toISOString();
  return new Promise(resolve => {
    const child = spawn(runtime.executable('agy'), args, { cwd: workspace, shell: false, detached: process.platform !== 'win32', stdio: ['ignore','pipe','pipe'] });
    let stdout = '', stderr = '', reason = null, killer;
    const kill = signal => { try { process.platform === 'win32' ? child.kill(signal) : process.kill(-child.pid, signal); } catch {} };
    const stop = why => { if (reason) return; reason = why; kill('SIGTERM'); killer = setTimeout(() => kill('SIGKILL'), 2000); killer.unref(); };
    const timer = setTimeout(() => stop('timeout'), 120000);
    child.stdout.on('data', b => { if (Buffer.byteLength(stdout) + b.length > 1024*1024) return stop('output-limit'); stdout += b.toString(); });
    child.stderr.on('data', b => { stderr = (stderr + b.toString()).slice(-8192); });
    child.on('error', error => { reason = error.message; });
    child.on('close', exitCode => { clearTimeout(timer); const parsed = runtime.parseOutput('agy',stdout); resolve({ ...parsed, status: reason || (exitCode === 0 && parsed.valid && !parsed.permissionDenials ? 'reported' : 'failed'), startedAt, elapsedMs: performance.now()-started, exitCode, requestedModel: model, stdout, stderr, argv: args }); });
  });
}
function evaluate(text, workspace) {
  try {
    const answer = JSON.parse(text), parser = require(workspace+'/src/runtime.js');
    if (!Array.isArray(answer.predictions) || answer.predictions.length !== cases.length || new Set(answer.predictions.map(p => p.id)).size !== cases.length) throw Error('Exactly eight unique predictions required');
    const checks = cases.map(c => { const actual = parser.parseOutput(c.adapter,JSON.stringify(c.output)), p = answer.predictions.find(p => p.id === c.id); return { id: c.id, passed: !!p && ['valid','reportedModel','costUsd'].every(k => Object.hasOwn(p,k) && p[k] === actual[k]), expected: { valid: actual.valid, reportedModel: actual.reportedModel, costUsd: actual.costUsd }, predicted: p || null }; });
    return { predictionsPassed: checks.filter(c => c.passed).length, predictionsTotal: checks.length, checks, remedies: answer.remedies, limits: answer.limits, remediesIndependentReview: 'pending', codeFixVerified: false };
  } catch (error) { return { predictionsPassed: 0, predictionsTotal: cases.length, error: error.message, codeFixVerified: false }; }
}
async function execute(dir) {
  dir = path.resolve(dir); if (fs.existsSync(dir+'/result.json')) throw Error('This prepared pilot already has a ledger; do not overwrite or reset its invocation cap'); const manifest = JSON.parse(fs.readFileSync(dir+'/input.json'));
  if (manifest.model !== model || manifest.cliVersion !== runtime.checkRuntime('agy').version) throw Error('Pinned runtime/model mismatch');
  const report = { schema: 'agent-meeting/readonly-audit-pilot@1', startedAt: new Date().toISOString(), input: manifest, model, maxInvocations: 2, calls: [], arms: {}, directorActiveMs: null, billedCostUsd: null, preparationSessionBillingUsd: null, protocolSha256: hash(fs.readFileSync(root+'/docs/evidence/shift-20261022/readonly-audit/PROTOCOL.vi.md')), sourceHashes: Object.fromEntries(['src/runtime.js','src/work.js','src/routing.js','tools/readonly-runtime-pilot.js'].map(p => [p,hash(fs.readFileSync(root+'/'+p))])) };
  const save = () => fs.writeFileSync(dir+'/result.json',JSON.stringify(report,null,2)+'\n');
  for (const arm of ['direct','managed']) if (hash(JSON.stringify(sourceInventory(dir+'/'+arm))) !== manifest.sourceDigest) throw Error('Input bytes changed');
  const prompt = JSON.stringify(task) + '\nUse your normal native read-only workflow. Return the requested JSON and no surrounding prose.';
  save(); const direct = await nativeDirect(dir+'/direct',prompt);
  fs.writeFileSync(dir+'/direct-raw.json',JSON.stringify(direct,null,2)+'\n',{mode:0o600});
  const { stdout, stderr, argv, ...receipt } = direct;
  report.calls.push({ id:'direct-01',role:'direct',...receipt,rawSha256:hash(fs.readFileSync(dir+'/direct-raw.json')),promptBytes:Buffer.byteLength(prompt),argvBytes:Buffer.byteLength(JSON.stringify(argv)),billedCostUsd:null });
  report.arms.direct = { status:direct.status,quality:evaluate(direct.text,dir+'/input'),inputUnchanged:hash(JSON.stringify(sourceInventory(dir+'/direct')))===manifest.sourceDigest }; save();
  let work;
  try {
    const setupStart=performance.now(),config=routing.defaults(),m=config.models.find(m=>m.id==='opus');
    Object.assign(m,{providerModelId:model,enabled:true,verification:'verified',source:{...m.source,confidence:'user-configured',checkedAt:new Date().toISOString(),references:['CLI metadata agy models; actual access remains receipt-derived']}});
    config.profiles.push({id:'audit-agy',label:'Read-only audit / agy',modelId:m.id,runtimeId:'agy',enabled:true,roles:['investigator']});
    const store=new ConfigStore({dir:dir+'/config',defaults:()=>config,validate:routing.validate});
    const runner=async options=>{if(report.calls.length>=2)throw Error('Invocation cap reached');const r=await runtime.runCli(options);fs.writeFileSync(dir+'/managed-raw.json',JSON.stringify(r,null,2)+'\n',{mode:0o600});const {stdout,stderr,workspace,...receipt}=r;report.calls.push({id:'managed-01',role:'managed',...receipt,rawSha256:hash(fs.readFileSync(dir+'/managed-raw.json')),promptBytes:Buffer.byteLength(options.prompt),argvBytes:Buffer.byteLength(JSON.stringify(runtime.buildArgs('agy',options))),billedCostUsd:null});save();return r;};
    work=new WorkManager({dir:dir+'/work',configStore:store,runner});
    const observed={profileId:'audit-agy',runtimeId:'agy',adapter:'agy',configRevision:store.read().revision,providerModelId:model,requestedModel:model,reportedModel:direct.reportedModel,available:direct.status==='reported',modelVerified:direct.status==='reported'&&direct.reportedModel===model,quotaAvailable:direct.status==='reported',checkedAt:new Date().toISOString(),tools:[],permissions:[],provenance:'direct-01 machine receipt reused; no separate probe'};
    work.update(d=>d.observations.push(observed));
    const t=work.createTask({goal:task.goal,acceptance:task.acceptance,purpose:'execute',topology:'local',management:'managed',workspace:dir+'/managed',baseRevision:manifest.revision,writePaths:[],testFiles:[],sources:['AGENTS.md','task.json','src/runtime.js'],facts:[JSON.stringify({cases:task.cases,rules:task.rules})],unknowns:['Billing and actual provider identity may be unknown'],risk:'low'});
    report.arms.managed={status:'preparing',accessObservation:observed,setupMs:performance.now()-setupStart}; save();
    try {
      const started=performance.now(),run=work.start(t.id,'audit-agy');await Promise.all([...work.pending]);const current=work.read().runs.find(r=>r.id===run.id);
      Object.assign(report.arms.managed,{status:current.status,elapsedMs:performance.now()-started,quality:evaluate(current.report||'',dir+'/input'),inputUnchanged:hash(JSON.stringify(sourceInventory(dir+'/managed')))===manifest.sourceDigest,runStatus:current.status});
    } catch(error) {Object.assign(report.arms.managed,{status:'blocked',error:error.message,modelCalls:0});}
  } finally {await work?.close();}
  report.finishedAt=new Date().toISOString();report.actualInvocations=report.calls.length;report.outcome=report.arms.managed.status==='blocked'?'managed-blocked-no-efficacy-comparison':'single-pair-needs-identity-quality-cost-review';report.limits=['Read-only predictions only, no code fix or integration; natural language remedies need independent review.','One case/pair, no statistics or general superiority claim.','Missing actual model/billing/human preparation cost remains unknown; direct receipt reuse is counted, not a free probe.','Development time and HTTP soak do not prove model/context8h.'];save();console.log(JSON.stringify({directory:dir,status:report.outcome,calls:report.actualInvocations,directQuality:report.arms.direct.quality.predictionsPassed,managedStatus:report.arms.managed.status,actualModel:direct.reportedModel}));
}
if (require.main === module) {
  const [mode,dir]=process.argv.slice(2);
  if(mode==='prepare')prepare();else if(mode==='--execute'&&dir)execute(dir).catch(e=>{console.error(e.message);process.exitCode=1;});else{console.error('Usage: node tools/readonly-runtime-pilot.js prepare | --execute <prepared-directory>');process.exitCode=1;}
}
module.exports = { prepare, execute, nativeDirect, evaluate };
