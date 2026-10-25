#!/usr/bin/env node
// Project-local Argo cursor + paint-time browser recording + Kokoro narration.
// Run generate-narration.mjs first. No agent/model CLI or hosted service is used.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const local=path.join(root,'.local-tools/video-v2');
const localRequire=createRequire(path.join(local,'package.json'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/home/theo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createApp}=require('../src/server');
const {buildHumanCursorPath}=await import(path.join(local,'node_modules/@argo-video/cli/dist/human-cursor.js'));
const ffmpeg=localRequire('ffmpeg-static'), ffprobe=localRequire('ffprobe-static').path;
const output=path.join(root,'docs/showcase');
const work=path.join(local,'build'); fs.mkdirSync(work,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'foxul-video-v2-'));
const narration=JSON.parse(fs.readFileSync(path.join(root,'tools/foxul-video/narration.json')));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','ignore','pipe']});
  let err='';child.stderr.on('data',v=>err=(err+v).slice(-6000));
  child.once('close',code=>code===0?resolve():reject(Error('FFmpeg '+code+' '+err)));
});
const probe=file=>JSON.parse(execFileSync(ffprobe,['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8'}));
const brief='How should annotators review tracking labels?\n\nCompare confirmed anchors 1 and 10 with every intermediate frame. Challenge confidence at frame 10; inspect frame 5 for turns, occlusion and identity switches.\n\nDecide a pilot workflow, its limits, and three owned tasks. No threshold has been validated.';
const conclusion='CONCLUSION: Pilot with confirmed anchors 1 and 10. Review every intermediate frame. Correct frame 5 and split the segment if needed. Extend to 15 only after human review. Keep interpolation, prelabels and human corrections separate. No threshold is validated.\nTASK: Minh · Workflow | Map review flow and anchor corrections: frames 1 → 10 → 15 | Before pilot\nTASK: Lan · Quality | Define checks for turns, occlusion and identity switches | Before pilot\nTASK: Sam · Tooling | Prototype a queue preserving point source, track ID and human edits | After flow review';
const app=createApp({admit:'none',configDir:path.join(temp,'config'),workDir:path.join(temp,'work')});
const room=app.create({hostKey:'foxul_v2_disposable_host',id:'foxul_v2_disposable_invite',followUp:true});
const errors=[],marks=[];
let browser;
try {
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'/opt/brave.com/brave/brave'});
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1.5,colorScheme:'dark'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/m/'+room.hostKey+'?lang=en');
  await page.locator('#ctx').waitFor({state:'visible'});
  await page.locator('#followUp').evaluate(e=>{e.closest('details').open=true;});
  await page.locator('#followUp').check();
  await page.locator('#followUp').evaluate(e=>{e.closest('details').open=false;});
  // Argo's full cursor injects inline <style>, which the real product CSP blocks.
  // Use its seeded path generator with a capture-only glyph and Web Animations.
  // No product CSP, stylesheet or runtime source is modified.
  await page.evaluate(()=>{
    const glyph=document.createElement('div');glyph.id='foxul-editorial-cursor';
    glyph.style.cssText='position:fixed;left:920px;top:468px;width:28px;height:37px;z-index:2147483647;pointer-events:none';
    glyph.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 39" width="28" height="37"><path d="M3 2 L3 30 L10 23 L17 36 L23 33 L16 21 L27 20 Z" fill="#F4F3EF" stroke="#0B0D12" stroke-width="2"/></svg>';
    document.body.append(glyph);
  });
  let point={x:920,y:468},movement=0;
  const cursor={
    async moveTo(target,opts={}){
      await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();assert.ok(box);
      const fraction=opts.target||{x:.08,y:.72};const next={x:box.x+box.width*fraction.x,y:box.y+box.height*fraction.y};
      const points=buildHumanCursorPath(point,next,'foxul-v2-'+movement++,24);
      for(const p of points){await page.mouse.move(p.x,p.y);await page.evaluate(p=>{const g=document.getElementById('foxul-editorial-cursor');g.style.left=p.x+'px';g.style.top=p.y+'px';},p);await page.waitForTimeout((opts.durationMs||500)/points.length);}
      point=next;return {box,fraction};
    },
    async click(target,opts={}){
      const {box,fraction}=await this.moveTo(target,opts);await page.waitForTimeout(100);
      await page.evaluate(p=>{const circle=document.createElement('div');circle.style.cssText=`position:fixed;left:${p.x-15}px;top:${p.y-15}px;width:30px;height:30px;border:2px solid #8B93FF;border-radius:50%;z-index:2147483646;pointer-events:none`;document.body.append(circle);circle.animate([{transform:'scale(.6)',opacity:1},{transform:'scale(1.7)',opacity:0}],{duration:500}).finished.then(()=>circle.remove());},point);
      await target.click({position:{x:box.width*fraction.x,y:box.height*fraction.y},delay:65});await page.waitForTimeout(100);
    },
    async hide(){await page.evaluate(()=>document.getElementById('foxul-editorial-cursor').remove());}
  };
  const cdp=await context.newCDPSession(page);
  const frames=[],pending=[];
  cdp.on('Page.screencastFrame',event=>{
    const name='frame-'+String(frames.length).padStart(5,'0')+'.jpg';
    frames.push({name,timestamp:event.metadata.timestamp});
    pending.push(fs.promises.writeFile(path.join(work,name),Buffer.from(event.data,'base64')));
    cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:96,maxWidth:1920,maxHeight:1080,everyNthFrame:1});
  const started=Date.now();
  const at=async(seconds,label,action)=>{
    const wait=started+seconds*1000-Date.now(); if(wait>0)await page.waitForTimeout(wait);
    marks.push({id:label,mainSeconds:(Date.now()-started)/1000,globalSeconds:3+(Date.now()-started)/1000});
    console.log(label,marks.at(-1).mainSeconds);
    if(action)await action();
  };
  const keys=new Map(),names=['Minh · Workflow','Lan · Quality','Sam · Tooling'];
  const agent=async(i,tool,text)=>{
    const response=await fetch(base+'/a/'+room.id+'/'+tool,{method:'POST',headers:keys.has(i)?{authorization:'Bearer '+keys.get(i)}:{},body:new URLSearchParams({name:names[i],...(text?{text}:{model:'Scripted participant'})})});
    assert.ok(response.ok);return response.text();
  };
  const say=async(i,text)=>{
    const before=await page.locator('#feedIn .msg').count(); await agent(i,'say',text);
    await page.waitForFunction(n=>document.querySelectorAll('#feedIn .msg').length>n,before);
  };
  await at(.15,'type-brief',async()=>{await cursor.click(page.locator('#ctx'),{durationMs:450});await page.locator('#ctx').pressSequentially(brief,{delay:5});});
  await at(4.2,'invite',async()=>{
    await cursor.click(page.locator('#btnNextStep'),{durationMs:450});
    for(let i=0;i<3;i++){const reply=await agent(i,'join'); const key=reply.match(/Bearer ([\w-]+)/);assert.ok(key);keys.set(i,key[1]);}
  });
  await at(6.1,'start-meeting',async()=>{await cursor.click(page.locator('#btnStart'),{durationMs:400});await page.locator('#room:not([hidden])').waitFor();});
  await at(7.3,'workflow-proposal',()=>say(0,'Start with **confirmed anchors at frames 1 and 10**. Review frames 2–9. Extend to 15 only after the first segment passes human review.'));
  await at(10.1,'quality-challenge',()=>say(1,'**0.98 confidence at frame 10 says little about frame 5.** A turn or occlusion can hide in the middle. Check interpolation, prelabels and the human-confirmed point separately.'));
  await at(12.8,'tooling-response',()=>say(2,'Preserve the **point source and track ID** in the review queue. An identity switch stops extension. Keep every human correction reversible.'));
  await at(16.1,'host-asks-to-decide',async()=>{await cursor.click(page.locator('#hostMsg'),{durationMs:500});await page.locator('#hostMsg').pressSequentially('Conclude with a pilot decision, its limits, and three owned tasks.',{delay:16});await cursor.click(page.locator('#btnSend'),{durationMs:350});});
  await at(19.7,'decision',()=>say(0,conclusion));
  await at(23.2,'read-decision',async()=>{await cursor.moveTo(page.locator('#feedIn .msg').last(),{durationMs:550,target:{x:.2,y:.25}});});
  await at(24,'open-plan',async()=>{await cursor.click(page.locator('#sessionNav a[href="#plan"]'),{durationMs:500});await page.waitForFunction(()=>document.querySelectorAll('.ws-task').length===3);});
  const tasks=await page.locator('.ws-task').evaluateAll(cards=>cards.map(card=>({id:card.dataset.taskId,owner:card.querySelector('.ws-task-label')?.textContent?.trim(),status:card.querySelector('.ws-pill')?.textContent?.trim()})));
  assert.equal(tasks.length,3);assert.ok(tasks.every(t=>/planned/i.test(t.status)));
  await at(26.5,'owners',()=>cursor.moveTo(page.locator('.ws-task').nth(1),{durationMs:800,target:{x:.3,y:.42}}));
  await at(29,'third-owner',()=>cursor.moveTo(page.locator('.ws-task').nth(2),{durationMs:700,target:{x:.3,y:.42}}));
  await at(31.25,'open-source',async()=>{await cursor.click(page.locator('.ws-task-source > a').first(),{durationMs:650});await page.locator('#room:not([hidden])').waitFor();assert.match(page.url(),/#message-/);});
  await at(34,'source-highlight',()=>cursor.moveTo(page.locator('#feedIn .msg').last(),{durationMs:650,target:{x:.25,y:.18}}));
  await at(38,'end-main');
  await cdp.send('Page.stopScreencast');await Promise.all(pending);
  assert.ok(frames.length>70,'Expected actual paint-time motion frames');
  const first=frames[0].timestamp;
  fs.writeFileSync(path.join(work,'frames.ffconcat'),'ffconcat version 1.0\n'+frames.map((f,i)=>`file '${f.name}'\nduration ${Math.max(.001,(frames[i+1]?.timestamp??first+38)-f.timestamp)}\n`).join('')+`file '${frames.at(-1).name}'\n`);
  await cursor.hide();
  await page.locator('#sessionNav a[href="#plan"]').click();await page.locator('.ws-task').nth(2).waitFor();
  await page.waitForTimeout(350);await page.screenshot({path:path.join(work,'outcome.png')});
  assert.deepEqual(errors,[]);
  console.log('Captured',frames.length,'paint frames. Encoding main.');
  await run(['-safe','0','-i',path.join(work,'frames.ffconcat'),'-vf','fps=30','-t','38','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',path.join(work,'main.mp4')]);
  const overlayPage=await browser.newPage({viewport:{width:1920,height:1080}});
  const logo=fs.readFileSync(path.join(root,'assets/brand/foxul.png')).toString('base64');
  const common=`*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;font-family:Arial,sans-serif;color:#f4f3ef}body{background:#0b0d12}.brand{position:absolute;left:96px;top:9px;display:flex;align-items:center;gap:12px;font-size:25px;font-weight:700}.brand img{width:40px;height:40px}.disclosure{position:absolute;right:96px;top:26px;font-size:15px;letter-spacing:1.7px;color:#afb5c7}.foot{position:absolute;left:96px;bottom:14px;font-size:13px;letter-spacing:1.8px;color:#8b93ff}`;
  await overlayPage.setContent(`<style>${common}body{background:transparent}.edge{position:absolute;left:95px;top:63px;width:1730px;height:974px;border:1px solid #393b62;border-radius:3px}</style><div class="brand"><img src="data:image/png;base64,${logo}">Foxul</div><div class="disclosure">SCRIPTED PARTICIPANTS · REAL LOCAL APIs</div><div class="edge"></div><div class="foot">EDITED PRODUCT DEMO · TASKS REMAIN PLANNED</div>`);
  await overlayPage.screenshot({path:path.join(work,'frame.png'),omitBackground:true});
  await overlayPage.setContent(`<style>${common}.end{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}.end img{width:205px;height:205px}.name{font-size:76px;font-weight:700;letter-spacing:-3px;margin:20px 0 15px}.slogan{font-size:39px;letter-spacing:-1px}.try{margin-top:45px;font-size:20px;color:#8b93ff}</style><div class="end"><img src="data:image/png;base64,${logo}"><div class="name">Foxul</div><div class="slogan">Multiple agents. One clear outcome.</div><div class="try">Try it without a model · README</div></div>`);
  await overlayPage.screenshot({path:path.join(work,'outro.png')});
  await overlayPage.close();
  // The director requested a fixed frame: no animated zoom, pan or camera scaling.
  const {exportVideo}=await import('./foxul-video/export-v2.mjs');
  await exportVideo({work,output,local,run});
  await run(['-i',path.join(output,'foxul-demo.mp4'),'-ss','0.6','-frames:v','1',path.join(output,'foxul-demo-poster.png')]);
  await run(['-i',path.join(output,'foxul-demo.mp4'),'-c:v','libvpx-vp9','-crf','31','-b:v','0','-deadline','good','-cpu-used','4','-row-mt','1','-c:a','libopus','-b:a','96k',path.join(output,'foxul-demo.webm')]);
  const timestamp=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(Math.floor(s)%60).padStart(2,'0')}.000`;
  for(const lang of ['en','vi'])fs.writeFileSync(path.join(output,`foxul-demo.${lang}.vtt`),'WEBVTT\n\n'+narration.map(c=>`${timestamp(c.start)} --> ${timestamp(c.end)}\n${lang==='en'?c.text:c.vi}\n`).join('\n'));
  const sources=['src/server.js','src/meeting.js','src/brief.js','src/ui/index.html','src/ui/app.css','src/ui/app.js','src/ui/workspace.html','src/ui/workspace.css','src/ui/workspace.js','assets/brand/foxul.png','tools/record-foxul-video-v2.mjs','tools/foxul-video/narration.json','tools/foxul-video/generate-narration.mjs'];
  const manifest={schema:'foxul/demo-video@2',recordedAt:new Date().toISOString(),disclosure:'Edited browser recording. Scripted participants use disposable real local APIs. No participant model or agent CLI calls. Local Kokoro neural TTS supplies English narration. Three tasks remain Planned.',source:{head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['rev-parse','--abbrev-ref','HEAD'],{encoding:'utf8'}).trim(),dirty:true,diffSha256:crypto.createHash('sha256').update(execFileSync('git',['diff','--binary','--no-ext-diff'],{maxBuffer:128*1024*1024})).digest('hex'),files:Object.fromEntries(sources.map(f=>[f,hash(path.join(root,f))]))},capture:{viewport:'1280x720',deviceScaleFactor:1.5,isolatedTempRoot:true,scriptedParticipants:true,realLocalHttpApis:true,participantModelCalls:0,agentCliCalls:0,paidServiceCalls:0,paintFrames:frames.length,consoleErrors:errors,tasks,marks},edit:{duration:46,fps:30,width:1920,height:1080,mainContinuousSeconds:38,openingSeconds:3,outroSeconds:5,narration:JSON.parse(fs.readFileSync(path.join(local,'narration/provenance.json'))),toolchain:{argo:JSON.parse(fs.readFileSync(path.join(local,'node_modules/@argo-video/cli/package.json'))).version},palette:['#0B0D12','#4F46E5','#8B93FF','#F4F3EF']},output:Object.fromEntries(['foxul-demo.mp4','foxul-demo.webm','foxul-demo-poster.png','foxul-demo.vi.vtt','foxul-demo.en.vtt'].map(f=>[f,{bytes:fs.statSync(path.join(output,f)).size,sha256:hash(path.join(output,f))}])),probe:probe(path.join(output,'foxul-demo.mp4')),qa:{status:'pending-full-export-watch'}};
  manifest.edit.camera='Fixed frame throughout; no animated zoom or pan.';
  manifest.edit.music=JSON.parse(fs.readFileSync(path.join(output,'music/provenance.json')));
  manifest.edit.files={'tools/foxul-video/export-v2.mjs':hash(path.join(root,'tools/foxul-video/export-v2.mjs'))};
  fs.writeFileSync(path.join(output,'foxul-demo-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Export complete',path.join(output,'foxul-demo.mp4'));
} finally {
  if(browser)await browser.close();app.close();
  fs.rmSync(temp,{recursive:true,force:true});
}
