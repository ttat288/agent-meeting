#!/usr/bin/env node
'use strict';
// Preparation only: freeze the dirty input and two isolated copies. Never invokes a model.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { safeFile } = require('../src/work');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
const acceptance = `'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {parseOutput} = require('../src/runtime');
const result = extra => JSON.stringify({type:'result',subtype:'success',result:'Done',...extra});
test('billing evidence accepts only finite nonnegative numeric costs, with unknown preserved',()=>{
  for (const cost of [-1,-0.01,'0.2',null,{},true])
    assert.equal(parseOutput('claude',result({total_cost_usd:cost})).costUsd,null,JSON.stringify(cost));
  for (const cost of [0,0.02,123]) assert.equal(parseOutput('claude',result({total_cost_usd:cost})).costUsd,cost);
  assert.equal(parseOutput('claude',result({})).costUsd,null);
});
test('multiple machine model usage entries cannot be hidden by a single model label',()=>{
  assert.equal(parseOutput('claude',result({model:'expected',modelUsage:{expected:{},other:{}}})).reportedModel,'unknown');
  assert.equal(parseOutput('claude',result({model:'fallback',modelUsage:{actual:{}}})).reportedModel,'actual');
  assert.equal(parseOutput('claude',result({model:'fallback'})).reportedModel,'fallback');
  assert.equal(parseOutput('claude',result({})).reportedModel,'unknown');
});
`;
function prepare() {
  const started = Date.now(), baseRevision = git('rev-parse', 'HEAD').trim();
  // Match managed source inputs, including untracked and dirty files, excluding protected paths.
  const names = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean).sort();
  const files = [], buffers = new Map(); let bytes = 0;
  for (const name of names) {
    if (/(^|\/)(\.git|\.env[^/]*|\.ssh|\.claude|\.codex|node_modules)(\/|$)/i.test(name)) continue;
    const file = safeFile(root, name);
    if (!fs.existsSync(file)) continue;
    if (!fs.statSync(file).isFile()) throw Error('Not a regular source file: ' + name);
    const b = fs.readFileSync(file); bytes += b.length;
    if (b.length > 8*1024*1024 || bytes > 64*1024*1024 || files.length >= 10000) throw Error('Managed copy limits exceeded');
    files.push({path:name,sha256:sha(b),bytes:b.length}); buffers.set(name,b);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'am-pm-pilot-')); fs.chmodSync(dir,0o700);
  const testFile = 'test/pm-pilot-acceptance.test.js';
  if (buffers.has(testFile)) throw Error('Pilot acceptance path already exists');
  const task = {
    id:'runtime-evidence', goal:'Repair runtime cost and model evidence parsing without changing successful-result behavior or public contracts.',
    observed:'Local repro: total_cost_usd=-2 survives as costUsd=-2; modelUsage with two entries plus model=expected returns expected. No production incident established.',
    acceptance:[
      'Finite nonnegative numeric costs, including zero, survive; negative, missing and nonnumeric costs stay unknown (null).',
      'Multiple modelUsage entries must remain ambiguous (unknown), even when model is set. One usage entry is authoritative; absent usage may use explicit model.',
      'Existing runtime tests pass, test sources and unrelated files unchanged; report limitations and evidence.'
    ],
    writePaths:['src/runtime.js'], testFiles:['test/runtime.test.js',testFile], baseRevision,
    sources:['AGENTS.md','docs/HANDOFF.md','CONTRIBUTING.md','SECURITY.md','docs/SECURITY-DESIGN.md','src/runtime.js','test/runtime.test.js',testFile],
    rules:['Only change src/runtime.js. No commit/push/install/deploy/global settings/port3000/secrets.',
      'Use native coding context and tools within the same scope; no paid subagents or extra models.',
      'Run supplied tests and inspect the diff; give one concise result/evidence/limitations report. No mandatory questions per tool.',
      'No hidden answer, solution patch or output from the other arm is available. Do not read the other arm.'],
    limits:{writerAttempts:1,technicalRetries:0,fixLoops:0,writerTimeoutMs:120000,testTimeoutMs:30000,concurrency:1}
  };
  try {
  for (const arm of ['direct','pm']) {
    const dest=path.join(dir,arm);
    execFileSync('git',['clone','-q','--no-hardlinks','--no-checkout',root,dest],{timeout:30000});
    // Populate the same frozen bytes, not HEAD-only files; no checkout hooks or commits.
    execFileSync('git',['-C',dest,'read-tree',baseRevision],{timeout:5000});
    for (const [name,b] of buffers) {const file=path.join(dest,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}
    fs.writeFileSync(path.join(dest,testFile),acceptance);
  }
  const manifest = {schema:'agent-meeting/pm-pilot-input@1',createdAt:new Date().toISOString(),baseRevision,
    sourceDigest:sha(JSON.stringify(files)),files,acceptance:{path:testFile,sha256:sha(acceptance)},task,
    taskDigest:sha(JSON.stringify(task)),preparationElapsedMs:Date.now()-started,modelCalls:0,
    executionAuthorized:false,model:null,cliVersion:null,budgetUsd:null,
    caveats:['No model efficacy measured. Preparation elapsed excludes human planning and this Codex session.',
      'Copies preserve source bytes, not executable mode metadata. Case only writes JavaScript.',
      'Freeze model/version/budget and recheck hashes before execution. Never feed one arm the other result.']};
  fs.writeFileSync(path.join(dir,'input.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'task.json'),JSON.stringify(task,null,2)+'\n');
  const ledger={schema:'agent-meeting/pm-pilot-ledger@1',inputDigest:manifest.sourceDigest,taskDigest:manifest.taskDigest,
    authorization:{granted:false,model:null,cliVersion:null,profileId:'opus-claude',budgetUsd:null,monetaryHardCap:false},
    order:['direct','pm'],primaryThresholdPercent:20,secondaryIncreaseLimitPercent:10,
    sharedSetup:{humanActiveMs:null,elapsedMs:manifest.preparationElapsedMs,decisions:null,maintenanceMs:null,usage:null,costUsd:null,provenance:null},
    runs:['direct','pm'].map(arm=>({id:'runtime-evidence-'+arm+'-01',arm,status:'not-run',inputDigest:manifest.sourceDigest,
      taskDigest:manifest.taskDigest,requestedModel:null,actualModels:null,cliVersion:null,
      quality:{acceptance:null,regression:null,scope:null,review:null,artifacts:[]},
      elapsedMs:null,director:{activeMs:null,actions:null,decisions:null,events:[]},
      setup:{elapsedMs:null,directorActiveMs:null},recoveryMs:null,maintenanceMs:null,
      calls:[], // Each probe/direct/PM/worker/review/retry call: id, role, usage, costUsd, raw artifact/hash.
      completeCallInventory:false,totalCostUsd:null,costProvenance:null,notes:[]}))};
  fs.writeFileSync(path.join(dir,'ledger.json'),JSON.stringify(ledger,null,2)+'\n');
  return {directory:dir,baseRevision,sourceDigest:manifest.sourceDigest,taskDigest:manifest.taskDigest,
    files:files.length,bytes,modelCalls:0,executionAuthorized:false};
  } catch (error) { fs.rmSync(dir,{recursive:true,force:true}); throw error; }
}
if (require.main===module) {try {console.log(JSON.stringify(prepare(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepare};
