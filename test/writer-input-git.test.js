'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const {initializeFrozenGit}=require('../tools/reproduce-writer-input');
function repository(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'am-writer-git-test-')),source=path.join(root,'source');fs.mkdirSync(source);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const git=args=>execFileSync('git',['-C',source,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git(['init','-q']);fs.writeFileSync(path.join(source,'sum.js'),'base input: a-b\n');git(['add','sum.js']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base']);const base=git(['rev-parse','HEAD']);
 fs.writeFileSync(path.join(source,'sum.js'),'future answer: a+b\n');git(['add','sum.js']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','future answer']);const future=git(['rev-parse','HEAD']);
 return{root,source,base,future,git};
}
test('frozen arm contains only the requested base commit and cannot read a later answer object',t=>{
 const f=repository(t),arm=path.join(f.root,'arm');initializeFrozenGit(arm,f.base,f.source);
 const git=args=>execFileSync('git',['-C',arm,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 assert.equal(git(['rev-parse','HEAD']),f.base);assert.equal(fs.readFileSync(path.join(arm,'sum.js'),'utf8'),'base input: a-b\n');
 const commits=git(['cat-file','--batch-all-objects','--batch-check=%(objectname) %(objecttype)']).split('\n').filter(line=>line.endsWith(' commit')).map(line=>line.split(' ')[0]);assert.deepEqual(commits,[f.base]);assert.notEqual(spawnSync('git',['-C',arm,'cat-file','-e',f.future+'^{commit}'],{stdio:'pipe'}).status,0);
 assert.equal(git(['remote']), '');assert.equal(fs.existsSync(path.join(arm,'.git','FETCH_HEAD')),false);assert.equal(f.git(['rev-parse','HEAD']),f.future,'The source repository must remain unchanged');
});
test('invalid revision arguments are rejected before creating an arm',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'am-writer-git-invalid-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const arm=path.join(root,'arm');assert.throws(()=>initializeFrozenGit(arm,'--upload-pack=unexpected',root),/full commit hash/);assert.equal(fs.existsSync(arm),false);
});
test('an absent base fails without changing the source repository',t=>{
 const f=repository(t);assert.throws(()=>initializeFrozenGit(path.join(f.root,'arm'),'0'.repeat(40),f.source));assert.equal(f.git(['rev-parse','HEAD']),f.future);assert.equal(fs.readFileSync(path.join(f.source,'sum.js'),'utf8'),'future answer: a+b\n');
});
test('unexpected history from an inherited Git template fails the frozen-store check',t=>{
 const f=repository(t),template=path.join(f.root,'template');fs.mkdirSync(template);fs.cpSync(path.join(f.source,'.git','objects'),path.join(template,'objects'),{recursive:true});
 const previous=process.env.GIT_TEMPLATE_DIR;process.env.GIT_TEMPLATE_DIR=template;
 try{assert.throws(()=>initializeFrozenGit(path.join(f.root,'arm'),f.base,f.source),/commits beyond the requested base/);}finally{if(previous===undefined)delete process.env.GIT_TEMPLATE_DIR;else process.env.GIT_TEMPLATE_DIR=previous;}
 assert.equal(f.git(['rev-parse','HEAD']),f.future);
});
