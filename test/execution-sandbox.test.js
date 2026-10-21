'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { wrapExecution, checkSandbox } = require('../src/execution-sandbox');
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'am-sandbox-test-'));
  const outsideDir = fs.mkdtempSync('/var/tmp/am-sandbox-outside-');
  const workspace = path.join(base, 'workspace'), home = path.join(base, 'home'), outside = path.join(outsideDir, 'outside.txt');
  fs.mkdirSync(workspace); fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(outside, 'original'); fs.writeFileSync(path.join(home,'.claude','settings.json'),'original-settings');
  fs.writeFileSync(path.join(home,'.claude','.credentials.json'),'fake-test-credential');
  const oldHome = process.env.HOME; process.env.HOME = home;
  t.after(() => { process.env.HOME = oldHome; fs.rmSync(base,{recursive:true,force:true}); fs.rmSync(outsideDir,{recursive:true,force:true}); });
  return { base, workspace, home, outside };
}
function execute(plan) {
  const out = spawnSync(plan.bin,plan.args,{encoding:'utf8',timeout:10000,maxBuffer:32768});
  assert.equal(out.status,0,out.stderr); return JSON.parse(out.stdout);
}
test('bubblewrap write boundary available or fails closed with explicit error', () => {
  if (process.platform !== 'linux' || !fs.existsSync('/usr/bin/bwrap')) { assert.throws(checkSandbox,/refusing unsandboxed/); return; }
  assert.deepEqual(checkSandbox(), {available:true,boundary:'filesystem-write',readIsolation:false,networkIsolation:false});
});
test('writes inside workspace succeed; outside and symlink escapes fail; scratch cleans up', t => {
  const f=fixture(t); fs.symlinkSync(f.outside,path.join(f.workspace,'escape'));
  const code=`const fs=require('fs');let inside=false,outside=false,escape=false;fs.writeFileSync('allowed.txt','ok');inside=true;try{fs.writeFileSync(${JSON.stringify(f.outside)},'bad')}catch{outside=true}try{fs.writeFileSync('escape','bad')}catch{escape=true}console.log(JSON.stringify({inside,outside,escape}));`;
  const plan=wrapExecution(process.execPath,['-e',code],{workspace:f.workspace,write:true});t.after(plan.cleanup);
  const scratch=plan.args[plan.args.indexOf('--bind')+1]; assert(fs.existsSync(scratch));
  assert.deepEqual(execute(plan),{inside:true,outside:true,escape:true});
  assert.equal(fs.readFileSync(path.join(f.workspace,'allowed.txt'),'utf8'),'ok');assert.equal(fs.readFileSync(f.outside,'utf8'),'original');
  plan.cleanup();plan.cleanup();assert.equal(fs.existsSync(scratch),false);
});
test('read-only execution rejects workspace writes; logs are isolated and settings/auth readonly', t => {
  const f=fixture(t);
  const code=`const fs=require('fs'),path=require('path');let blocked=false,settings=false,auth=false;try{fs.writeFileSync('blocked.txt','bad')}catch{blocked=true}try{fs.writeFileSync(${JSON.stringify(path.join(f.home,'.claude','settings.json'))},'bad')}catch{settings=true}try{fs.writeFileSync(${JSON.stringify(path.join(f.home,'.claude','.credentials.json'))},'bad')}catch{auth=true}fs.writeFileSync(${JSON.stringify(path.join(f.home,'.claude','debug','log'))},'isolated');fs.writeFileSync('/tmp/temp.txt','isolated');console.log(JSON.stringify({blocked,settings,auth}));`;
  const plan=wrapExecution(process.execPath,['-e',code],{workspace:f.workspace,write:false});t.after(plan.cleanup);
  assert.deepEqual(execute(plan),{blocked:true,settings:true,auth:true});
  assert.equal(fs.existsSync(path.join(f.workspace,'blocked.txt')),false);assert.equal(fs.existsSync(path.join(f.home,'.claude','debug')),false);
  assert.equal(fs.readFileSync(path.join(f.home,'.claude','settings.json'),'utf8'),'original-settings');assert.equal(fs.readFileSync(path.join(f.home,'.claude','.credentials.json'),'utf8'),'fake-test-credential');
});
test('refuses broad workspace and malformed command options',t=>{
  const f=fixture(t);
  assert.throws(()=>wrapExecution(process.execPath,[],{workspace:f.home,write:true}),/dedicated directory/);
  assert.throws(()=>wrapExecution(process.execPath,[],{workspace:'/',write:true}),/dedicated directory/);
  assert.throws(()=>wrapExecution('node',[],{workspace:f.workspace,write:true}),/structured executable/);
  assert.throws(()=>wrapExecution(process.execPath,['bad\0arg'],{workspace:f.workspace,write:true}),/structured executable/);
});
