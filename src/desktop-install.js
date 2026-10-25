'use strict';
// Per-user launchers for the existing Node/browser app. No runtime downloads,
// elevated permissions, PATH changes, background services or client settings.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');
const SCHEMA = 'agent-meeting/desktop-install@1';
const MARKER = '.agent-meeting-install.json';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sh = value => "'" + value.replace(/'/g, "'\\''") + "'";
const xml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const desktop = value => ('"' + value.replace(/[%\\"`$]/g, c => c === '%' ? '%%' : '\\' + c) + '"').replace(/\\/g, '\\\\');
const safe = value => { if (typeof value !== 'string' || !value || /[\x00-\x1f\x7f]/.test(value)) throw Error('Invalid installation path'); return value; };
function lexists(file) { try { fs.lstatSync(file); return true; } catch(e) { if(e.code==='ENOENT')return false; throw e; } }
function absolute(value, api) { safe(value); if (!api.isAbsolute(value)) throw Error('Installation paths must be absolute'); return api.normalize(value); }
function makePlan({ platform = process.platform, home = os.homedir(), env = process.env, node = process.execPath } = {}) {
  if (!['linux','darwin','win32'].includes(platform)) throw Error('Desktop installation supports Linux, macOS and Windows.');
  const p = platform === 'win32' ? path.win32 : path.posix;
  home = absolute(home, p); node = absolute(node, p);
  if(platform==='linux' && node.includes('='))throw Error('The Linux desktop executable path cannot contain an equals sign.');
  const join = (...parts) => p.join(...parts);
  let root, app, files = [], shortcut;
  if (platform === 'linux') {
    const data = absolute(env.XDG_DATA_HOME || join(home,'.local','share'), p);
    root = join(data,'agent-meeting'); app = root;
    shortcut = join(data,'applications','agent-meeting.desktop');
    const bin = join(home,'.local','bin','agent-meeting');
    files = [
      {path:shortcut, mode:0o644, text:'[Desktop Entry]\nType=Application\nName=Foxul\nComment=Multiple agents. One clear outcome.\nExec='+desktop(node)+' '+desktop(join(app,'bin','cli.js'))+'\nIcon='+join(app,'assets','icon.svg').replace(/\\/g,'\\\\')+'\nTerminal=true\nCategories=Development;Network;\n'},
      {path:bin, mode:0o755, text:'#!/bin/sh\nexec '+sh(node)+' '+sh(join(app,'bin','cli.js'))+' "$@"\n'},
    ];
  } else if (platform === 'darwin') {
    root = join(home,'Applications','Agent Meeting.app'); app = join(root,'Contents','Resources','app');
    shortcut = root;
    files = [
      {path:join(root,'Contents','Info.plist'), mode:0o644, text:'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>CFBundleName</key><string>Foxul</string><key>CFBundleDisplayName</key><string>Foxul</string><key>CFBundleIdentifier</key><string>dev.ttat288.agentmeeting</string><key>CFBundleVersion</key><string>'+xml(pkg.version)+'</string><key>CFBundleShortVersionString</key><string>'+xml(pkg.version)+'</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleExecutable</key><string>AgentMeeting</string><key>CFBundleIconFile</key><string>AgentMeeting.icns</string></dict></plist>\n'},
      {path:join(root,'Contents','MacOS','AgentMeeting'), mode:0o755, text:'#!/bin/sh\nexec /usr/bin/open -a Terminal '+sh(join(root,'Contents','Resources','Start Agent Meeting.command'))+'\n'},
      {path:join(root,'Contents','Resources','Start Agent Meeting.command'), mode:0o755, text:'#!/bin/sh\nexec '+sh(node)+' '+sh(join(app,'bin','cli.js'))+'\n'},
      {path:join(home,'.local','bin','agent-meeting'), mode:0o755, text:'#!/bin/sh\nexec '+sh(node)+' '+sh(join(app,'bin','cli.js'))+' "$@"\n'},
    ];
  } else {
    root = join(absolute(env.LOCALAPPDATA || join(home,'AppData','Local'),p),'Programs','Agent Meeting'); app = root;
    shortcut = join(absolute(env.APPDATA || join(home,'AppData','Roaming'),p),'Microsoft','Windows','Start Menu','Programs','Agent Meeting.lnk');
    files = [{path:join(root,'agent-meeting.cmd'),mode:0o644,text:'@echo off\r\n"'+node.replace(/%/g,'%%')+'" "'+join(app,'bin','cli.js').replace(/%/g,'%%')+'" %*\r\n'}];
  }
  return {schema:SCHEMA,version:pkg.version,platform,root,app,node,shortcut,files,marker:join(root,MARKER),home};
}
function readTree(root) {
  const result=[];
  function visit(dir, relative='') {
    for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
      const rel=relative ? relative+'/'+item.name : item.name, file=path.join(dir,item.name);
      if(item.isSymbolicLink()) throw Error('Refusing symlink in app payload: '+rel);
      if(item.isDirectory()) visit(file,rel);
      else if(item.isFile()) result.push({rel,file});
      else throw Error('Unsupported app payload entry: '+rel);
    }
  }
  visit(root);return result;
}
function writeFile(file, bytes, mode=0o644) {
  const rejectLink=()=>{if(lexists(file) && fs.lstatSync(file).isSymbolicLink())throw Error('Refusing to overwrite symlink: '+file);};
  rejectLink();fs.mkdirSync(path.dirname(file),{recursive:true});
  const temporary=file+'.write-'+crypto.randomBytes(8).toString('hex');
  try {
    fs.writeFileSync(temporary,bytes,{mode,flag:'wx'});fs.chmodSync(temporary,mode);
    rejectLink();fs.renameSync(temporary,file);
  } finally {fs.rmSync(temporary,{force:true});}
}

function copyPayload(source, destination) {
  for(const name of ['bin','src','assets','scripts']) {
    const from=path.join(source,name);
    if(fs.lstatSync(from).isSymbolicLink()) throw Error('Refusing symlink payload directory');
    for(const entry of readTree(from)) writeFile(path.join(destination,name,...entry.rel.split('/')),fs.readFileSync(entry.file),fs.statSync(entry.file).mode & 0o777);
  }
  for(const name of ['package.json','LICENSE']) {
    const from=path.join(source,name);if(fs.lstatSync(from).isSymbolicLink())throw Error('Refusing symlink payload file');
    writeFile(path.join(destination,name),fs.readFileSync(from));
  }
}
const POWERSHELL_SHORTCUT = '$ErrorActionPreference="Stop"; $p=Get-Content -LiteralPath $env:AGENT_MEETING_SHORTCUT_PLAN -Encoding UTF8 -Raw | ConvertFrom-Json; $s=(New-Object -ComObject WScript.Shell).CreateShortcut($p.path); $s.TargetPath=$p.node; $s.Arguments=$p.arguments; $s.WorkingDirectory=$p.cwd; $s.IconLocation=$p.icon; $s.Description="Foxul local server and browser"; $s.Save();';
function windowsShortcut(plan, destination) {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agent-meeting-shortcut-'));
  try {
    const file=path.join(temp,'plan.json'),created=path.join(temp,'created.lnk');
    writeFile(file,JSON.stringify({path:created,node:plan.node,arguments:'"'+path.win32.join(plan.app,'bin','cli.js')+'"',cwd:plan.app,icon:path.win32.join(plan.app,'assets','brand','app.ico')}),0o600);
    const shell=path.win32.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
    const result=spawnSync(shell,['-NoLogo','-NoProfile','-NonInteractive','-Command',POWERSHELL_SHORTCUT],{encoding:'utf8',timeout:15000,windowsHide:true,env:{...process.env,AGENT_MEETING_SHORTCUT_PLAN:file}});
    if(result.error || result.status!==0 || !fs.existsSync(created)) throw Error('Unable to create Start menu shortcut: '+(result.error?.message || result.stderr || 'PowerShell failed'));
    writeFile(destination,fs.readFileSync(created));
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
}
function readManifest(plan) {
  try { const data=JSON.parse(fs.readFileSync(plan.marker,'utf8')); if(data.schema!==SCHEMA || data.platform!==plan.platform || data.root!==plan.root || !Array.isArray(data.files))throw Error('Invalid installation manifest'); return data; }
  catch(e) { if(e.code==='ENOENT')return null;throw e; }
}
function installUnlocked(plan, {source=path.join(__dirname,'..'), beforeWrite}={}) {
  if(plan.platform!==process.platform)throw Error('A foreign platform plan can only be previewed.');
  if(Number(process.versions.node.split('.')[0])<18)throw Error('Node.js 18+ is required.');
  if(!fs.existsSync(plan.node))throw Error('The selected Node executable does not exist.');
  const info=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8'));
  if(info.name!=='agent-meeting')throw Error('Invalid app source.');
  let previous=null;
  if(lexists(plan.root)) {
    if(fs.lstatSync(plan.root).isSymbolicLink())throw Error('Refusing symlink installation directory.');
    previous=readManifest(plan);
    // Migrate the historical Linux installer only after identifying its package.
    const legacy=plan.platform==='linux' && fs.existsSync(path.join(plan.root,'package.json')) && JSON.parse(fs.readFileSync(path.join(plan.root,'package.json'),'utf8')).name==='agent-meeting' && fs.existsSync(path.join(plan.root,'bin','cli.js'));
    if(!previous && !legacy)throw Error('Destination exists and is not a managed Foxul install.');
  }
  const external=plan.files.filter(f=>!f.path.startsWith(plan.root+path.sep));
  const allowed=new Set((previous?.external || []).map(f=>f.path));
  const candidates=[...external,...(plan.platform==='win32'?[{path:plan.shortcut}]:[])];
  for(const file of candidates)if(lexists(file.path)) {
    if(fs.lstatSync(file.path).isSymbolicLink())throw Error('Refusing symlink launcher: '+file.path);
    if(!allowed.has(file.path)) {
      const legacy=plan.platform==='linux' && !previous && fs.existsSync(plan.root) && file.path===plan.shortcut && fs.readFileSync(file.path,'utf8').includes(path.join(plan.root,'bin','cli.js'));
      if(!legacy)throw Error('Existing unrelated launcher is preserved: '+file.path);
    } else {
      const old=previous.external.find(f=>f.path===file.path);
      if(sha(fs.readFileSync(file.path))!==old.sha256)throw Error('Launcher has local edits; preserving it: '+file.path);
    }
  }
  fs.mkdirSync(path.dirname(plan.root),{recursive:true});
  const stage=fs.mkdtempSync(plan.root+'.stage-'), journal=[];
  const backup=lexists(plan.root) ? plan.root+'.backup-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex') : null;
  let activated=false, moved=false;
  try {
    const stagedApp=path.join(stage,path.relative(plan.root,plan.app));
    copyPayload(source,stagedApp);
    const internal=plan.files.filter(f=>f.path.startsWith(plan.root+path.sep));
    for(const file of internal)writeFile(path.join(stage,path.relative(plan.root,file.path)),file.text,file.mode);
    if(plan.platform==='darwin')writeFile(path.join(stage,'Contents','Resources','AgentMeeting.icns'),fs.readFileSync(path.join(source,'assets','brand','app.icns')));
    if(backup){fs.renameSync(plan.root,backup);moved=true;}
    fs.renameSync(stage,plan.root);activated=true;
    for(const file of external) {
      journal.push({path:file.path,bytes:fs.existsSync(file.path)?fs.readFileSync(file.path):null,mode:fs.existsSync(file.path)?fs.statSync(file.path).mode & 0o777:null});
      beforeWrite?.(file.path);writeFile(file.path,file.text,file.mode);
    }
    if(plan.platform==='win32') {
      if(fs.existsSync(plan.shortcut) && !allowed.has(plan.shortcut))throw Error('Existing unrelated Start menu shortcut is preserved.');
      journal.push({path:plan.shortcut,bytes:fs.existsSync(plan.shortcut)?fs.readFileSync(plan.shortcut):null,mode:0o644});
      fs.mkdirSync(path.dirname(plan.shortcut),{recursive:true});beforeWrite?.(plan.shortcut);windowsShortcut(plan,plan.shortcut);
    }
    const ownedExternal=[...external.map(f=>f.path),...(plan.platform==='win32'?[plan.shortcut]:[])].map(file=>({path:file,sha256:sha(fs.readFileSync(file))}));
    const files=readTree(plan.root).map(f=>({path:f.rel,sha256:sha(fs.readFileSync(f.file))}));
    writeFile(plan.marker,JSON.stringify({schema:SCHEMA,platform:plan.platform,version:pkg.version,root:plan.root,node:plan.node,files,external:ownedExternal,installedAt:new Date().toISOString()},null,2)+'\n',0o600);
    return {installed:true,root:plan.root,shortcut:plan.shortcut,backup,node:plan.node};
  } catch(e) {
    const recovery=[];
    for(const entry of journal.reverse()) { try { if(entry.bytes===null)fs.rmSync(entry.path,{force:true});else writeFile(entry.path,entry.bytes,entry.mode); } catch(restoreError){recovery.push(restoreError.message);} }
    try { if(activated)fs.rmSync(plan.root,{recursive:true,force:true});if(moved)fs.renameSync(backup,plan.root); } catch(restoreError){recovery.push(restoreError.message);}
    if(recovery.length)throw Error(e.message+'; recovery needs manual attention: '+recovery.join('; ')+(backup?'; backup: '+backup:''));
    throw e;
  } finally { fs.rmSync(stage,{recursive:true,force:true}); }
}
function uninstallUnlocked(plan) {
  if(plan.platform!==process.platform)throw Error('A foreign platform plan can only be previewed.');
  if(lexists(plan.root) && fs.lstatSync(plan.root).isSymbolicLink())throw Error('Refusing symlink installation directory.');
  const manifest=readManifest(plan);if(!manifest)return {removed:false,message:'No managed installation found. Legacy installs must be upgraded before managed uninstall.'};
  const allowed=new Set(plan.files.filter(f=>!f.path.startsWith(plan.root+path.sep)).map(f=>f.path));
  if(plan.platform==='win32')allowed.add(plan.shortcut);
  if(!Array.isArray(manifest.external) || manifest.external.some(file=>!allowed.has(file.path)))throw Error('Invalid launcher path in installation manifest.');
  const preserved=[];
  for(const file of manifest.external) {
    if(lexists(file.path)) {
      if(fs.lstatSync(file.path).isSymbolicLink() || sha(fs.readFileSync(file.path))!==file.sha256)preserved.push(file.path);
      else fs.unlinkSync(file.path);
    }
  }
  const expected=new Map(manifest.files.map(f=>[f.path,f.sha256]));
  let edited=false;
  try { for(const f of readTree(plan.root))if(f.rel!==MARKER && (!expected.has(f.rel) || sha(fs.readFileSync(f.file))!==expected.get(f.rel)))edited=true; }
  catch { edited=true; }
  if(edited)preserved.push(plan.root);else fs.rmSync(plan.root,{recursive:true});
  return {removed:!preserved.length,preserved,message:'Meeting/config/work data, MCP registrations and previous install backups are preserved.'};
}
function withLock(plan, action) {
  if(plan.platform!==process.platform)throw Error('A foreign platform plan can only be previewed.');
  fs.mkdirSync(path.dirname(plan.root),{recursive:true});
  const file=plan.root+'.install-lock';let fd;
  try { fd=fs.openSync(file,'wx',0o600); }
  catch(e) { if(e.code==='EEXIST')throw Error('Another install/uninstall may be in progress. Inspect the lock before retrying: '+file);throw e; }
  try { fs.writeFileSync(fd,JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}));return action(); }
  finally {fs.closeSync(fd);fs.unlinkSync(file);}
}
function install(plan, options) { return withLock(plan,()=>installUnlocked(plan,options)); }
function uninstall(plan) { return withLock(plan,()=>uninstallUnlocked(plan)); }
function runCLI(args) {
  const action=args[0], dry=args.includes('--dry-run'), json=args.includes('--json');
  const i=args.indexOf('--platform'), platform=i>=0?args[i+1]:process.platform;
  const known=new Set([action,'--dry-run','--json','--platform',...(i>=0?[platform]:[]),'--help','-h']);
  if(args.some(a=>!known.has(a)))throw Error('Unknown installer option. Use '+action+' --help.');
  if(args.includes('--help') || args.includes('-h')) {console.log('agent-meeting '+action+' [--dry-run] [--json]\n  --platform linux|darwin|win32  Preview only; requires --dry-run.\nPer-user app launcher. Requires Node.js 18+. No PATH, login service or AI-client settings are changed.');return 0;}
  if(i>=0 && !['linux','darwin','win32'].includes(platform))throw Error('Expected --platform linux|darwin|win32.');
  if(i>=0 && !dry)throw Error('--platform requires --dry-run.');
  const options={platform};
  if(platform==='win32' && process.platform!=='win32'){options.home='C:\\Users\\YourName';options.node='C:\\Program Files\\nodejs\\node.exe';options.env={};}
  if(platform==='darwin' && process.platform!=='darwin'){options.home='/Users/YourName';options.node='/usr/local/bin/node';options.env={};}
  if(platform==='linux' && process.platform!=='linux'){options.home='/home/yourname';options.node='/usr/bin/node';options.env={};}
  const plan=makePlan(options);
  if(dry) {console.log(json?JSON.stringify({...plan,operation:action},null,2):['Preview '+action+' only; nothing was written.', 'Platform: '+plan.platform,'App: '+plan.root,'Launcher: '+plan.shortcut,'Node: '+plan.node,...plan.files.map(f=>'File: '+f.path)].join('\n'));return 0;}
  const result=action==='install'?install(plan):uninstall(plan);
  console.log(json?JSON.stringify(result,null,2):[action==='install'?'Installed Foxul '+pkg.version:result.removed?'Removed managed app files':'Some files were preserved',...(result.root?['App: '+result.root]:[]),...(result.shortcut?['Open: '+result.shortcut]:[]),...(result.backup?['Previous app backup: '+result.backup]:[]),...(result.message?[result.message]:[]),...(result.preserved || []).map(f=>'Preserved: '+f),'Node must remain available at '+plan.node+'. The launcher opens a local console and your browser.'].join('\n'));
  return 0;
}
module.exports={makePlan,install,uninstall,runCLI,MARKER};
