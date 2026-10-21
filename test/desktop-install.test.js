'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {makePlan,install,uninstall,MARKER}=require('../src/desktop-install');
const source=path.join(__dirname,'..'),version=require('../package.json').version;
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-desktop-install-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const userDir=path.join(dir,"Nhóm annotator's space & 100% $"),plan=makePlan({home:userDir,env:{},node:process.execPath});return{dir,userDir,plan};}
function external(plan){return plan.platform==='win32'?plan.shortcut:plan.files.find(f=>!f.path.startsWith(plan.root+path.sep)).path;}
test('plans use native per-user locations and stable absolute runtime paths on all three platforms',()=>{
 const linux=makePlan({platform:'linux',home:'/home/Test User',env:{XDG_DATA_HOME:'/srv/Personal Data'},node:'/opt/Node Runtime/node'});
 assert.equal(linux.root,'/srv/Personal Data/agent-meeting');assert.equal(linux.shortcut,'/srv/Personal Data/applications/agent-meeting.desktop');assert.match(linux.files[0].text,/Terminal=true/);
 const mac=makePlan({platform:'darwin',home:'/Users/Nguyễn Minh',env:{},node:'/opt/homebrew/bin/node'});
 assert.equal(mac.root,'/Users/Nguyễn Minh/Applications/Agent Meeting.app');assert.match(mac.files.find(f=>f.path.endsWith('Info.plist')).text,/CFBundleExecutable/);assert.match(mac.files.find(f=>f.path.endsWith('/AgentMeeting')).text,/open -a Terminal/);
 const win=makePlan({platform:'win32',home:'C:\\Users\\Minh Nguyễn',env:{},node:'C:\\Program Files\\nodejs\\node.exe'});
 assert.equal(win.root,'C:\\Users\\Minh Nguyễn\\AppData\\Local\\Programs\\Agent Meeting');assert.ok(win.shortcut.endsWith('Start Menu\\Programs\\Agent Meeting.lnk'));assert.match(win.files[0].text,/"C:\\Program Files\\nodejs\\node.exe"/);
});
test('rejects unsupported platform, relative paths and newline injection before writing',()=>{
 assert.throws(()=>makePlan({platform:'freebsd'}),/supports/);assert.throws(()=>makePlan({platform:'linux',home:'relative',node:'/bin/node',env:{}}),/absolute/);
 assert.throws(()=>makePlan({platform:'linux',home:'/home/a\nExec=evil',node:'/bin/node',env:{}}),/Invalid/);
 assert.throws(()=>makePlan({platform:'linux',home:'/home/a',node:'/bin/node',env:{XDG_DATA_HOME:'relative'}}),/absolute/);
});
test('native install copies a complete runnable payload and creates its actual platform launcher',t=>{
 const{dir,plan}=fixture(t),result=install(plan);assert.equal(result.installed,true);assert.ok(fs.existsSync(plan.shortcut));
 const manifest=JSON.parse(fs.readFileSync(plan.marker));assert.equal(manifest.schema,'agent-meeting/desktop-install@1');assert.ok(manifest.files.some(f=>f.path.endsWith('assets/icon.svg')));
 const cli=spawnSync(process.execPath,[path.join(plan.app,'bin','cli.js'),'--version'],{encoding:'utf8',timeout:10000});assert.equal(cli.status,0,cli.stderr);assert.equal(cli.stdout.trim(),version);
 if(process.platform==='linux'){
  const bin=plan.files.find(f=>f.path.endsWith('/bin/agent-meeting')).path;
  const launched=spawnSync(bin,['--version'],{encoding:'utf8',timeout:10000});assert.equal(launched.status,0,launched.stderr);assert.equal(launched.stdout.trim(),version);
  if(fs.existsSync('/usr/bin/desktop-file-validate'))assert.equal(spawnSync('/usr/bin/desktop-file-validate',[plan.shortcut],{encoding:'utf8'}).status,0);
 }else if(process.platform==='darwin'){
  const plist=spawnSync('/usr/bin/plutil',['-lint',path.join(plan.root,'Contents','Info.plist')],{encoding:'utf8'});assert.equal(plist.status,0,plist.stderr);
  assert.ok(fs.statSync(path.join(plan.root,'Contents','MacOS','AgentMeeting')).mode & 0o100);const icon=path.join(plan.root,'Contents','Resources','AgentMeeting.icns');assert.ok(fs.existsSync(icon));const decoded=spawnSync('/usr/bin/iconutil',['-c','iconset','-o',path.join(dir,'roundtrip.iconset'),icon],{encoding:'utf8'});assert.equal(decoded.status,0,decoded.stderr);
 }else {
  assert.ok(fs.statSync(plan.shortcut).size>0);
  const ps=path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe');
  const read=spawnSync(ps,['-NoProfile','-NonInteractive','-Command','[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding; $s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:AGENT_MEETING_TEST_SHORTCUT); @{target=$s.TargetPath;args=$s.Arguments;icon=$s.IconLocation}|ConvertTo-Json -Compress'],{encoding:'utf8',timeout:15000,env:{...process.env,AGENT_MEETING_TEST_SHORTCUT:plan.shortcut}});
  assert.equal(read.status,0,read.stderr);const link=JSON.parse(read.stdout);assert.equal(link.target.toLowerCase(),process.execPath.toLowerCase());assert.equal(link.args,'"'+path.join(plan.app,'bin','cli.js')+'"');assert.ok(link.icon.toLowerCase().startsWith(path.join(plan.app,'assets','brand','app.ico').toLowerCase()));
 }

});
test('upgrade keeps the prior app, including local payload edits, in an explicit backup',t=>{
 const{plan}=fixture(t);install(plan);fs.writeFileSync(path.join(plan.app,'local-note.txt'),'keep my local note');
 const result=install(plan);assert.ok(result.backup);assert.equal(fs.readFileSync(path.join(result.backup,path.relative(plan.root,plan.app),'local-note.txt'),'utf8'),'keep my local note');assert.ok(!fs.existsSync(path.join(plan.app,'local-note.txt')));
});
test('a write failure restores the prior payload and launcher bytes',t=>{
 const{plan}=fixture(t);install(plan);const target=external(plan),before=fs.readFileSync(target),marker=fs.readFileSync(plan.marker);
 assert.throws(()=>install(plan,{beforeWrite:()=>{throw Error('simulated disk write failure');}}),/simulated/);
 assert.deepEqual(fs.readFileSync(target),before);assert.deepEqual(fs.readFileSync(plan.marker),marker);
});
test('fresh failure leaves no partial app or launcher',t=>{
 const{plan}=fixture(t);assert.throws(()=>install(plan,{beforeWrite:()=>{throw Error('simulated');}}),/simulated/);assert.equal(fs.existsSync(plan.root),false);assert.equal(fs.existsSync(external(plan)),false);
});
test('unrelated destinations and locally edited launchers are preserved',t=>{
 const{plan}=fixture(t);fs.mkdirSync(plan.root,{recursive:true});fs.writeFileSync(path.join(plan.root,'personal.txt'),'personal');assert.throws(()=>install(plan),/not a managed/);assert.equal(fs.readFileSync(path.join(plan.root,'personal.txt'),'utf8'),'personal');fs.rmSync(plan.root,{recursive:true});install(plan);
 const target=external(plan);fs.appendFileSync(target,'local edit');const bytes=fs.readFileSync(target);assert.throws(()=>install(plan),/local edits/);assert.deepEqual(fs.readFileSync(target),bytes);
});
test('uninstall removes only managed files and preserves meeting/config/work data',t=>{
 const{userDir,plan}=fixture(t);install(plan);const data=path.join(userDir,'.agent-meeting','work','keep.json');fs.mkdirSync(path.dirname(data),{recursive:true});fs.writeFileSync(data,'{"keep":true}');
 const result=uninstall(plan);assert.equal(result.removed,true);assert.equal(fs.existsSync(plan.root),false);assert.equal(fs.existsSync(external(plan)),false);assert.equal(fs.readFileSync(data,'utf8'),'{"keep":true}');
});
test('uninstall preserves app edits and refuses tampered external paths',t=>{
 const{plan,dir}=fixture(t);install(plan);fs.writeFileSync(path.join(plan.app,'personal.txt'),'do not delete');const result=uninstall(plan);assert.ok(result.preserved.includes(plan.root));assert.ok(fs.existsSync(path.join(plan.app,'personal.txt')));
 install(plan);const manifest=JSON.parse(fs.readFileSync(plan.marker));manifest.external.push({path:path.join(dir,'outside.txt'),sha256:'irrelevant'});fs.writeFileSync(plan.marker,JSON.stringify(manifest));assert.throws(()=>uninstall(plan),/Invalid launcher path/);assert.ok(fs.existsSync(plan.root));
});
test('the installer refuses symlink destinations on platforms with ordinary symlink permissions',{skip:process.platform==='win32'},t=>{
 const{plan,dir}=fixture(t),outside=path.join(dir,'outside');fs.mkdirSync(outside);fs.mkdirSync(path.dirname(plan.root),{recursive:true});fs.symlinkSync(outside,plan.root,'dir');assert.throws(()=>install(plan),/symlink/);assert.throws(()=>uninstall(plan),/symlink/);assert.ok(fs.existsSync(outside));
});
test('CLI dry-run and foreign-platform preview never launch a server or install files',()=>{
 for(const platform of ['linux','darwin','win32']){
  const r=spawnSync(process.execPath,['bin/cli.js','install','--dry-run','--platform',platform,'--json'],{cwd:source,encoding:'utf8',timeout:10000});assert.equal(r.status,0,r.stderr);const p=JSON.parse(r.stdout);assert.equal(p.platform,platform);assert.equal(p.operation,'install');
 }
 for(const args of [['install','--platform','win32'],['install','--platform','--dry-run'],['install','--port','3000']]){const r=spawnSync(process.execPath,['bin/cli.js',...args],{cwd:source,encoding:'utf8',timeout:10000});assert.notEqual(r.status,0);}
});

test('an existing install lock blocks both writers without changing the app',t=>{
 const{plan}=fixture(t);install(plan);const before=fs.readFileSync(plan.marker),lock=plan.root+'.install-lock';fs.writeFileSync(lock,'active writer');
 assert.throws(()=>install(plan),/in progress/);assert.throws(()=>uninstall(plan),/in progress/);assert.deepEqual(fs.readFileSync(plan.marker),before);fs.unlinkSync(lock);
});
test('Linux desktop execution preserves reserved filename characters instead of evaluating them',{skip:process.platform!=='linux' || !fs.existsSync('/usr/bin/gio')},t=>{
 const{dir}=fixture(t),homeDir=path.join(dir,'Space \" Backslash \\ Dollar $ Percent % Single \' Unicode Nguyễn'),plan=makePlan({home:homeDir,env:{},node:process.execPath});install(plan);
 const desktop=fs.readFileSync(plan.shortcut,'utf8').replace('Terminal=true','Terminal=false').replace(/^(Exec=.*)$/m,'$1 --version');
 const file=path.join(dir,'launch-test.desktop');fs.writeFileSync(file,desktop);
 const valid=spawnSync('/usr/bin/desktop-file-validate',[file],{encoding:'utf8'});assert.equal(valid.status,0,valid.stdout+valid.stderr);
 const launched=spawnSync('/usr/bin/gio',['launch',file],{encoding:'utf8',timeout:10000});assert.equal(launched.status,0,launched.stderr);assert.match(launched.stdout,new RegExp(version.replace(/\./g,'\\.')));
});
test('dangling symlink launchers and roots cannot redirect installation writes',{skip:process.platform==='win32'},t=>{
 const{plan,dir}=fixture(t),outside=path.join(dir,'unrelated-future-file');fs.mkdirSync(path.dirname(plan.shortcut),{recursive:true});fs.symlinkSync(outside,plan.shortcut);
 assert.throws(()=>install(plan),/symlink/);assert.equal(fs.existsSync(outside),false);assert.equal(fs.lstatSync(plan.shortcut).isSymbolicLink(),true);fs.unlinkSync(plan.shortcut);
 const target=path.join(dir,'unrelated-future-dir');fs.mkdirSync(path.dirname(plan.root),{recursive:true});fs.symlinkSync(target,plan.root,'dir');assert.throws(()=>install(plan),/symlink/);assert.throws(()=>uninstall(plan),/symlink/);assert.equal(fs.existsSync(target),false);assert.equal(fs.lstatSync(plan.root).isSymbolicLink(),true);
});
