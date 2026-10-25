import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
export async function exportVideo({work,output,local,run}){
  const root=path.resolve(local,'../..');
  const require=createRequire(import.meta.url);
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/theo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'/opt/brave.com/brave/brave'});
  try{
    const page=await browser.newPage({viewport:{width:1920,height:1080}});
    const logo=fs.readFileSync(path.join(root,'assets/brand/foxul.png')).toString('base64');
    await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;font-family:Arial,sans-serif;background:#0b0d12;color:#f4f3ef}.end{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}.end img{width:205px;height:205px}.name{font-size:76px;font-weight:700;letter-spacing:-3px;margin:20px 0 15px}.slogan{font-size:39px;letter-spacing:-1px}.try{margin-top:45px;font-size:20px;color:#8b93ff}.credit{position:absolute;bottom:130px;width:100%;text-align:center;font-size:20px;line-height:1.5;color:#afb5c7}</style><div class="end"><img src="data:image/png;base64,${logo}"><div class="name">Foxul</div><div class="slogan">Multiple agents. One clear outcome.</div><div class="try">Try it without a model · README</div></div><div class="credit">Music: “Tech Live” — Kevin MacLeod (incompetech.com)<br>CC BY 4.0 · creativecommons.org/licenses/by/4.0/ · excerpt + mix</div>`);
    await page.screenshot({path:path.join(work,'outro.png')});
  }finally{await browser.close();}
  const mix=path.join(local,'narration/voiceover-music.wav');
  await run(['-i',path.join(local,'narration/voiceover.wav'),'-i',path.join(output,'music/tech-live-excerpt.mp3'),'-filter_complex',"[0:a]asplit=2[voice][side];[1:a]loudnorm=I=-22:TP=-3:LRA=7,volume='if(lt(t,44.5),0.45,0.8)':eval=frame,afade=t=in:st=0:d=0.5,afade=t=out:st=44.8:d=1.2[bed];[bed][side]sidechaincompress=threshold=0.03:ratio=4:attack=15:release=250[duck];[voice][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.84:level=false[a]",'-map','[a]','-ar','48000','-ac','2',mix]);
  await run(['-loop','1','-t','3','-i',path.join(work,'outcome.png'),'-i',path.join(work,'main.mp4'),'-loop','1','-t','5','-i',path.join(work,'outro.png'),'-i',mix,'-loop','1','-i',path.join(work,'frame.png'),'-filter_complex',`[0:v]fps=30,scale=1728:972,pad=1920:1080:96:64:color=0x0B0D12,setsar=1[open];[1:v]fps=30,scale=1728:972,pad=1920:1080:96:64:color=0x0B0D12,setsar=1[body];[open][body]concat=n=2:v=1:a=0[app];[app][4:v]overlay=0:0:shortest=1[framed];[2:v]fps=30,setsar=1,fade=t=in:st=0:d=0.2[end];[framed][end]concat=n=2:v=1:a=0[v]`,'-map','[v]','-map','3:a','-t','46','-r','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-metadata','comment=Music: Tech Live by Kevin MacLeod (incompetech.com), CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ — excerpt, fades and ducking under original narration.','-movflags','+faststart',path.join(output,'foxul-demo.mp4')]);
}
// Re-export the preserved raw browser capture without repeating product actions.
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
  const local=path.join(root,'.local-tools/video-v2'),work=path.join(local,'build'),output=path.join(root,'docs/showcase');
  const require=createRequire(path.join(local,'package.json'));
  const ffmpeg=require('ffmpeg-static'),ffprobe=require('ffprobe-static').path;
  const run=args=>new Promise((resolve,reject)=>{const p=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',v=>error+=v);p.on('close',code=>code===0?resolve():reject(Error(error)));});
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  await exportVideo({work,output,local,run});
  await run(['-i',path.join(output,'foxul-demo.mp4'),'-ss','0.6','-frames:v','1',path.join(output,'foxul-demo-poster.png')]);
  await run(['-i',path.join(output,'foxul-demo.mp4'),'-c:v','libvpx-vp9','-crf','31','-b:v','0','-deadline','good','-cpu-used','4','-row-mt','1','-c:a','libopus','-b:a','128k',path.join(output,'foxul-demo.webm')]);
  const target=path.join(output,'foxul-demo-manifest.json');const m=JSON.parse(fs.readFileSync(target));
  m.reeditedAt=new Date().toISOString();m.edit.camera='Fixed frame throughout; no animated zoom or pan.';
  m.edit.music=JSON.parse(fs.readFileSync(path.join(output,'music/provenance.json')));
  m.edit.music.mix='Sidechain ducking under voice; -22 LUFS source normalization, 0.45 gain under narration, 0.8 at the tail; 0.5 s intro / 1.2 s outro fades.';
  m.source.originalCaptureFiles=m.source.files;
  m.edit.files=Object.fromEntries(['tools/record-foxul-video-v2.mjs','tools/foxul-video/export-v2.mjs'].map(f=>[f,hash(path.join(root,f))]));
  m.edit.diffSha256=crypto.createHash('sha256').update(execFileSync('git',['diff','--binary','--no-ext-diff'],{cwd:root,maxBuffer:128*1024*1024})).digest('hex');
  for(const f of Object.keys(m.output))m.output[f]={bytes:fs.statSync(path.join(output,f)).size,sha256:hash(path.join(output,f))};
  m.probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_format','-show_streams','-of','json',path.join(output,'foxul-demo.mp4')],{encoding:'utf8'}));
  m.qa={status:'pending-full-revised-export-watch'};fs.writeFileSync(target,JSON.stringify(m,null,2)+'\n');
  console.log('Fixed-frame music export complete.');
}
