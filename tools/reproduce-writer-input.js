#!/usr/bin/env node
'use strict';
// Rebuild frozen writer source bytes under preparation v2; reject later Git history.
// No model, user store, settings, network, or changes to the caller's checkout.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { safeFile } = require('../src/work');
const root = path.resolve(__dirname,'..'), evidence = path.join(root,'docs/evidence/shift-20261022/writer-input');
const foundation = '805f638bdd68cb08103c8c1ca93b832be54e1a69';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
function validateFrozenManifest(manifest) {
  const identity = manifest && Array.isArray(manifest.files) && manifest.files.length === 352 && manifest.task && typeof manifest.task === 'object'
    && manifest.sourceDigest === '491c16573db8a4e1ceb8fd6d5752fea6624f156a06fb0bc023f6bf3128d656c0'
    && manifest.taskDigest === 'a67ebf7000860fa0dba699d543138c0b1173a59be51c2b3ae90b8b5d2b2c0653'
    && manifest.baseRevision === 'e292fd3833d65152ebfa6133fc27a67285b6cab9'
    && manifest.acceptance?.path === 'test/pm-pilot-acceptance.test.js'
    && manifest.acceptance.sha256 === 'dd3558b1735ac9f11974c3c37a95062cb471be478e55e1c0dc1b3e6220526736';
  if (!identity || sha(JSON.stringify(manifest.files)) !== manifest.sourceDigest || sha(JSON.stringify(manifest.task)) !== manifest.taskDigest)
    throw Error('Frozen manifest identity changed; define a new versioned case');
}
function initializeFrozenGit(destination, baseRevision, sourceRoot = root) {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(baseRevision)) throw Error('Frozen base must be a full commit hash');
  fs.mkdirSync(destination, { mode: 0o700 });
  execFileSync('git', ['init', '-q', destination], { timeout: 10000 });
  execFileSync('git', ['-C', destination, 'fetch', '--quiet', '--no-tags', '--no-recurse-submodules', '--depth=1', '--', path.resolve(sourceRoot), baseRevision], { stdio: 'pipe', timeout: 30000 });
  execFileSync('git', ['-C', destination, 'checkout', '-q', '--detach', 'FETCH_HEAD'], { timeout: 10000 });
  fs.unlinkSync(path.join(destination, '.git', 'FETCH_HEAD'));
  const objects = execFileSync('git', ['-C', destination, 'cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)'], { encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024 });
  const commits = objects.trim().split(/\r?\n/).filter(line => line.endsWith(' commit')).map(line => line.split(' ')[0]);
  if (commits.length !== 1 || commits[0] !== baseRevision) throw Error('Frozen Git store contains commits beyond the requested base');
}
function reproduce() {
  const manifest = JSON.parse(fs.readFileSync(evidence+'/manifest.json'));
  validateFrozenManifest(manifest);
  execFileSync('git',['-C',root,'cat-file','-e',foundation+'^{commit}'],{stdio:'pipe'});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-writer-reproduced-'));fs.chmodSync(dir,0o700);
  try {
    const archive=execFileSync('git',['-C',root,'archive','--format=tar',foundation],{maxBuffer:64*1024*1024,timeout:30000});fs.writeFileSync(dir+'/foundation.tar',archive);
    for(const arm of ['direct','pm']) {
      const dest=dir+'/'+arm;
      initializeFrozenGit(dest, manifest.baseRevision);
      execFileSync('tar',['-xf',dir+'/foundation.tar','-C',dest],{timeout:30000});
      execFileSync('git',['-C',dest,'apply','--check','--unidiff-zero',evidence+'/source-delta.patch'],{timeout:5000});
      execFileSync('git',['-C',dest,'apply','--unidiff-zero',evidence+'/source-delta.patch'],{timeout:5000});
      for(const f of manifest.files) {const file=safeFile(dest,f.path),b=fs.readFileSync(file);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Frozen source mismatch: '+f.path);}
      const test=safeFile(dest,manifest.acceptance.path),body=fs.readFileSync(evidence+'/acceptance.test.js');if(sha(body)!==manifest.acceptance.sha256)throw Error('Frozen acceptance mismatch');fs.writeFileSync(test,body);
    }
    fs.unlinkSync(dir+'/foundation.tar');fs.copyFileSync(evidence+'/manifest.json',dir+'/input.json');fs.writeFileSync(dir+'/task.json',JSON.stringify(manifest.task,null,2)+'\n');
    return {preparationRevision:2,gitPolicy:'single shallow base commit; no tags, configured remote or FETCH_HEAD',gitCommitObjectsPerArm:1,directory:dir,sourceDigest:manifest.sourceDigest,taskDigest:manifest.taskDigest,sourceFiles:manifest.files.length,acceptanceSha256:manifest.acceptance.sha256,foundation,baseRevision:manifest.baseRevision,modelCalls:0,executionAuthorized:false};
  }catch(error){fs.rmSync(dir,{recursive:true,force:true});throw error;}
}
if(require.main===module){try{console.log(JSON.stringify(reproduce(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={reproduce,initializeFrozenGit,validateFrozenManifest};
