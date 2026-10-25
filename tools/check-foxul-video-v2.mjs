#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/theo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.join(root,'.local-tools/video-v2/qa');fs.mkdirSync(out,{recursive:true});
const mime={'.mp4':'video/mp4','.webm':'video/webm','.vtt':'text/vtt','.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'docs','.'+rel+(rel.endsWith('/')?'index.html':''));
  if(!file.startsWith(path.join(root,'docs')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const size=fs.statSync(file).size;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
  else{res.writeHead(200,{'Content-Length':size});fs.createReadStream(file).pipe(res);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'/opt/brave.com/brave/brave',args:['--autoplay-policy=no-user-gesture-required']});
const errors=[],checks=[];
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
  await page.goto(base+'/showcase/');
  await page.evaluate(()=>{document.body.innerHTML='<video id="demo" playsinline preload="auto" style="position:fixed;inset:0;width:100vw;height:100vh;background:#0b0d12"><source src="foxul-demo.mp4" type="video/mp4"><track kind="subtitles" src="foxul-demo.vi.vtt" srclang="vi" label="Tiếng Việt" default></video>';document.body.style.margin='0';});
  await page.waitForFunction(()=>document.getElementById('demo').readyState>=3);
  const metadata=await page.evaluate(()=>{const v=document.getElementById('demo');v.textTracks[0].mode='showing';return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,playbackRate:v.playbackRate};});
  assert.equal(metadata.duration,46);assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert.equal(metadata.muted,false);
  await page.evaluate(()=>{window.playbackEvents=[];const v=document.getElementById('demo');for(const type of ['playing','waiting','stalled','ended','error'])v.addEventListener(type,()=>window.playbackEvents.push({type,time:v.currentTime}));return v.play();});
  const samples=[];
  // One uninterrupted 1x watch; no seeking. Capture regularly through the entire export.
  for(const target of [.7,4.5,8.5,12,16,20,24,28,32,36,40,43.5,45.4]){
    await page.waitForFunction(t=>document.getElementById('demo').currentTime>=t,target,{timeout:15000});
    samples.push(await page.evaluate(()=>{const v=document.getElementById('demo');return {time:v.currentTime,cue:[...v.textTracks[0].activeCues||[]].map(c=>c.text)};}));
    await page.screenshot({path:path.join(out,'watch-'+String(samples.length).padStart(2,'0')+'.png')});
  }
  await page.waitForFunction(()=>document.getElementById('demo').ended,null,{timeout:10000});
  const playback=await page.evaluate(()=>{const v=document.getElementById('demo');return {ended:v.ended,currentTime:v.currentTime,audioDecodedBytes:v.webkitAudioDecodedByteCount,videoQuality:v.getVideoPlaybackQuality().toJSON?.()||{totalVideoFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedVideoFrames:v.getVideoPlaybackQuality().droppedVideoFrames},subtitleCues:v.textTracks[0].cues.length,events:window.playbackEvents};});
  assert.ok(playback.audioDecodedBytes>0);assert.equal(playback.subtitleCues,7);assert.ok(samples.every(s=>s.cue.length));
  for(const lang of ['en','vi'])for(const width of [375,1280]){
    await page.setViewportSize({width,height:900});await page.goto(base+'/showcase/?lang='+lang);
    await page.waitForFunction(()=>!document.getElementById('next').disabled);
    await page.waitForFunction(()=>document.getElementById('demo').readyState>=1);
    const check=await page.evaluate(()=>({lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,src:document.getElementById('demo').currentSrc,duration:document.getElementById('demo').duration,tracks:[...document.getElementById('demo').textTracks].map(t=>t.language),error:!document.getElementById('error').hidden}));
    assert.equal(check.lang,lang);assert.equal(check.overflow,false);assert.equal(check.error,false);assert.ok(check.src.endsWith('.mp4'));checks.push({width,...check});
  }
  await page.setViewportSize({width:1280,height:900});await page.goto(base+'/showcase/');
  await page.evaluate(()=>{const v=document.getElementById('demo');for(const s of v.querySelectorAll('source'))s.remove();v.src='foxul-demo.webm';v.load();});
  await page.waitForFunction(()=>document.getElementById('demo').readyState>=3);
  await page.evaluate(()=>document.getElementById('demo').play());
  await page.waitForFunction(()=>document.getElementById('demo').currentTime>1);
  assert.deepEqual(errors,[]);
  const result={checkedAt:new Date().toISOString(),metadata,playback,samples,responsivePlayer:checks,webmFallbackDecoded:true,consoleErrors:errors};
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(result,null,2)+'\n');
  const file=path.join(root,'docs/showcase/foxul-demo-manifest.json');const manifest=JSON.parse(fs.readFileSync(file));
  manifest.qa={status:'technical-playback-pass-awaiting-director-creative-approval',uninterruptedNormalSpeedWatch:true,muted:false,metadata,playback,samples,responsivePlayer:checks,webmFallbackDecoded:true,consoleErrors:errors};
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
