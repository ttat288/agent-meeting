#!/usr/bin/env node
'use strict';
// Rebuild the exact frozen writer pilot input, not a solved current checkout.
// No model, user store, settings, network, or changes to the caller's checkout.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { safeFile } = require('../src/work');
const root = path.resolve(__dirname,'..'), evidence = path.join(root,'docs/evidence/shift-20261022/writer-input');
const foundation = '805f638bdd68cb08103c8c1ca93b832be54e1a69';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
function reproduce() {
  const manifest = JSON.parse(fs.readFileSync(evidence+'/manifest.json'));
  if (manifest.sourceDigest !== '491c16573db8a4e1ceb8fd6d5752fea6624f156a06fb0bc023f6bf3128d656c0' || manifest.files.length !== 352) throw Error('Frozen manifest identity changed');
  execFileSync('git',['-C',root,'cat-file','-e',foundation+'^{commit}'],{stdio:'pipe'});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-writer-reproduced-'));fs.chmodSync(dir,0o700);
  try {
    const archive=execFileSync('git',['-C',root,'archive','--format=tar',foundation],{maxBuffer:64*1024*1024,timeout:30000});fs.writeFileSync(dir+'/foundation.tar',archive);
    for(const arm of ['direct','pm']) {
      const dest=dir+'/'+arm;
      execFileSync('git',['clone','-q','--no-hardlinks','--no-checkout',root,dest],{timeout:30000});
      execFileSync('git',['-C',dest,'checkout','-q','--detach',manifest.baseRevision],{timeout:10000});
      execFileSync('tar',['-xf',dir+'/foundation.tar','-C',dest],{timeout:30000});
      execFileSync('git',['-C',dest,'apply','--check','--unidiff-zero',evidence+'/source-delta.patch'],{timeout:5000});
      execFileSync('git',['-C',dest,'apply','--unidiff-zero',evidence+'/source-delta.patch'],{timeout:5000});
      for(const f of manifest.files) {const file=safeFile(dest,f.path),b=fs.readFileSync(file);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Frozen source mismatch: '+f.path);}
      const test=safeFile(dest,manifest.acceptance.path),body=fs.readFileSync(evidence+'/acceptance.test.js');if(sha(body)!==manifest.acceptance.sha256)throw Error('Frozen acceptance mismatch');fs.writeFileSync(test,body);
    }
    fs.unlinkSync(dir+'/foundation.tar');fs.copyFileSync(evidence+'/manifest.json',dir+'/input.json');fs.writeFileSync(dir+'/task.json',JSON.stringify(manifest.task,null,2)+'\n');
    return {directory:dir,sourceDigest:manifest.sourceDigest,taskDigest:manifest.taskDigest,sourceFiles:manifest.files.length,acceptanceSha256:manifest.acceptance.sha256,foundation,baseRevision:manifest.baseRevision,modelCalls:0,executionAuthorized:false};
  }catch(error){fs.rmSync(dir,{recursive:true,force:true});throw error;}
}
if(require.main===module){try{console.log(JSON.stringify(reproduce(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={reproduce};
