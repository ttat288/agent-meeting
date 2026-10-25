'use strict';
const FOXUL_DEMO_DURATION = 46;
const FOXUL_DEMO_TIMELINE = [
  { id:'result', start:0, end:3, image:'plan.png', kicker:'THE OUTCOME', title:'One decision. Three owners. Every task traceable.', body:'The useful result appears before the tour.' },
  { id:'brief', start:3, end:8, image:'brief.png', kicker:'01 · BRIEF', title:'Start with the decision to make.', body:'A focused brief gives the room a finish line.' },
  { id:'perspectives', start:8, end:14, image:'perspectives.png', kicker:'02 · PERSPECTIVES', title:'Bring distinct lenses into one room.', body:'Workflow, quality and tooling respond to the same brief.' },
  { id:'challenge', start:14, end:20, image:'challenge.png', kicker:'03 · CHALLENGE', title:'Expose the hidden assumption.', body:'High confidence at frame 10 says nothing about frame 5.' },
  { id:'decision', start:20, end:26, image:'decision.png', kicker:'04 · DECIDE', title:'Make the call — with limits.', body:'The pilot keeps human review and refuses an unvalidated threshold.' },
  { id:'plan', start:26, end:35, image:'plan.png', kicker:'05 · OWN THE WORK', title:'Turn the decision into three owned tasks.', body:'Workflow, quality and tooling each leave with a concrete next step.' },
  { id:'source', start:35, end:40.5, image:'source.png', kicker:'06 · TRACE THE WHY', title:'Open the source behind any task.', body:'The exact decision stays one click away.' },
  { id:'final', start:40.5, end:46, final:true, kicker:'FOXUL', title:'Foxul', body:'Multiple agents. One clear outcome.' }
];
const sceneRoot = document.getElementById('scenes');
const progress = document.getElementById('progress');
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const ease = v => { v=clamp(v); return v*v*(3-2*v); };
const fade = (time,start,end) => {
  const intro=ease((time-start)/.55), outro=ease((end-time)/.5);
  return Math.min(intro,outro);
};
for (const item of FOXUL_DEMO_TIMELINE) {
  const section=document.createElement('section');
  section.className='scene '+item.id+(item.final?' final':'');
  section.dataset.id=item.id;
  if (item.final) {
    section.innerHTML='<div class="endmark"><img src="/logo.png" alt=""><h1>Foxul</h1><p class="slogan">Multiple agents. One clear outcome.</p><span class="try">TRY IT WITHOUT A MODEL · README</span></div>';
  } else {
    section.innerHTML='<div class="window"><img src="/capture/'+item.image+'" alt=""></div><div class="copy"><span class="kicker">'+item.kicker+'</span><h1>'+item.title+'</h1><p>'+item.body+'</p></div>';
  }
  sceneRoot.append(section);
  item.element=section;
}
function renderAt(time) {
  const t=clamp(Number(time)||0,0,FOXUL_DEMO_DURATION);
  progress.style.width=(t/FOXUL_DEMO_DURATION*100)+'%';
  for (const item of FOXUL_DEMO_TIMELINE) {
    const active=t>=item.start-.55&&t<=item.end+.5;
    const alpha=active?fade(t,item.start,item.end):0;
    item.element.style.opacity=String(alpha);
    item.element.style.zIndex=String(Math.round(alpha*10));
    const local=clamp((t-item.start)/(item.end-item.start));
    if (item.final) {
      const endmark=item.element.querySelector('.endmark');
      endmark.style.transform='translateY('+(18*(1-ease(local)))+'px) scale('+(0.965+ease(local)*.035)+')';
      endmark.style.opacity=String(ease(local/.28));
      continue;
    }
    const img=item.element.querySelector('.window img');
    const copy=item.element.querySelector('.copy');
    let scale=1.015+local*.035, x=0, y=0;
    if (item.id==='result') { scale=1.02+local*.045; x=-48*local; y=-18*local; }
    if (item.id==='brief') { scale=1.01+local*.025; y=-18*local; }
    if (item.id==='perspectives') { scale=1.01+local*.035; x=-32*local; }
    if (item.id==='challenge') { scale=1.03+local*.065; x=-70*local; y=-42*local; }
    if (item.id==='decision') { scale=1.02+local*.06; x=-56*local; y=-36*local; }
    if (item.id==='plan') { scale=1.015+local*.055; x=-28*local; y=-54*local; }
    if (item.id==='source') { scale=1.025+local*.075; x=-68*local; y=-42*local; }
    img.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';
    copy.style.transform='translateY('+(24*(1-ease(local/.2)))+'px)';
    copy.style.opacity=String(ease(local/.22));
  }
}
let startedAt=0, raf=0;
window.demoDone=false;
window.renderAt=renderAt;
window.startDemo=() => {
  cancelAnimationFrame(raf); window.demoDone=false; startedAt=performance.now();
  const step=now=>{ const t=(now-startedAt)/1000; renderAt(t); if(t<FOXUL_DEMO_DURATION) raf=requestAnimationFrame(step); else { renderAt(FOXUL_DEMO_DURATION); window.demoDone=true; } };
  raf=requestAnimationFrame(step);
};
window.addEventListener('load',()=>{ renderAt(0); document.documentElement.dataset.ready='true'; });
