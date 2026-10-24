'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/ui/workspace.js'),'utf8');
function fixture(){
 const calls=[];let resolve,reject;
 const document={body:{},activeElement:null};document.activeElement=document.body;
 class Element{
  constructor(tag,attrs={},...children){this.tag=tag;this.attrs=attrs;this.className=attrs.class||'';this.children=children.flat();this.isConnected=true;this.disabled=false;}
  append(...children){this.children.push(...children);}
  prepend(child){this.children.unshift(child);child.parent=this;}
  querySelector(selector){const cls=selector.slice(1);for(const c of this.children){if(c&&typeof c==='object'){if(c.className?.split(' ').includes(cls))return c;const nested=c.querySelector?.(selector);if(nested)return nested;}}return null;}
  setAttribute(name,value){this.attrs[name]=value;}
  removeAttribute(name){delete this.attrs[name];}
  replaceChildren(...children){this.children=children;}
  remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  focus(){document.activeElement=this;}
  closest(){return this.hidden?{}:null;}
 }
 const node=(tag,attrs,...children)=>new Element(tag,attrs,...children),buttons=[];
 const context=vm.createContext({document,node,button:(label,click)=>{const b=node('button',{},label);b.click=click;buttons.push(b);return b;},t:(vi,en)=>en,lang:'en',meetingUrl:'/m/fixture_host',friendlyError:text=>text,renderSyncStatus:()=>{},load:()=>{},notify:()=>{},$:()=>null,
  api:(endpoint,body)=>{calls.push({endpoint,body});return new Promise((yes,no)=>{resolve=yes;reject=no;});}});
 const start=source.indexOf('  function errorBox('),end=source.indexOf('  function checkedAction(',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 const card=node('article'),selected={id:'profile-a',label:'Selected fixture profile',configRevision:7};
 const fail=(code='MODEL_ACCESS_REQUIRED')=>context.errorBox(card,{message:'Blocked',code,executionProfile:selected});
 const text=e=>typeof e==='string'?e:(e?.children||[]).map(text).join(' ');
 return{calls,context,document,card,buttons,fail,selected,text,resolve:value=>resolve(value),reject:error=>reject(error)};
}
const confirmed={available:true,modelVerified:true,quotaAvailable:true};
test('access error offers an explicit paid CLI check and admin return without probing on render',()=>{
 const f=fixture();f.fail();assert.equal(f.calls.length,0);assert.equal(f.buttons.length,1);assert.match(f.text(f.card),/may incur cost/);assert.match(f.text(f.card),/Selected fixture profile/);
 const link=f.card.children[0].children.at(-1).children[1];assert.equal(link.attrs.href,'/m/fixture_host/admin?lang=en&section=runtime&view=execute');assert.equal(f.card.children[0].attrs.role,'alert');
});
test('successful explicit probe keeps the captured config/profile and never reruns or reloads task data',async()=>{
 const f=fixture();f.fail();const probe=f.buttons[0],pending=probe.click();assert.equal(probe.disabled,true);assert.equal(probe.textContent,'Probing model access…');assert.equal(f.calls.length,1);assert.equal(f.calls[0].endpoint,'/runtime/probe');assert.equal(f.calls[0].body.profileId,'profile-a');assert.equal(f.calls[0].body.expectedConfigRevision,7);
 f.resolve(confirmed);await pending;assert.equal(f.calls.length,1);assert.match(f.text(f.card),/no new run has started/);assert.equal(f.card.children[0].attrs.role,'status');assert.equal(probe.disabled,false);
});
for(const observed of [{...confirmed,modelVerified:false},{...confirmed,quotaAvailable:false},{...confirmed,available:false}])test('unsuccessful probe retains recovery and cannot announce confirmed access: '+JSON.stringify(observed),async()=>{
 const f=fixture();f.fail();const pending=f.buttons[0].click();f.resolve(observed);await pending;
 assert.equal(f.calls.length,1);assert.equal(f.card.children[0].attrs.role,'alert');assert.match(f.text(f.card),/could not be confirmed/);assert.doesNotMatch(f.text(f.card),/Access confirmed/);assert.match(f.text(f.card),/Probe selected profile/);
});
test('a late probe for an old configuration cannot announce success or rerun',async()=>{
 const f=fixture();f.fail();const pending=f.buttons[0].click();f.resolve({...confirmed,stale:true});await pending;assert.equal(f.calls.length,1);assert.match(f.text(f.card),/Configuration changed/);assert.doesNotMatch(f.text(f.card),/Access confirmed/);
});
for(const changed of ['outside-focus','hidden-view','detached'])test('probe completion preserves newer interaction: '+changed,async()=>{
 const f=fixture();f.fail();const box=f.card.children[0],pending=f.buttons[0].click(),outside={};
 if(changed==='outside-focus')f.document.activeElement=outside;
 if(changed==='hidden-view'){f.card.hidden=true;f.document.activeElement=outside;}
 if(changed==='detached'){box.isConnected=false;f.document.activeElement=outside;}
 f.resolve(confirmed);await pending;assert.equal(f.document.activeElement,outside);assert.equal(f.calls.length,1);
});
test('routing and revision errors do not offer a model probe',()=>{
 for(const code of ['ROUTING_REJECTED','CONFIG_CONFLICT',null]){const f=fixture();f.fail(code);assert.equal(f.buttons.length,0);assert.equal(f.calls.length,0);}
});

test('a failed late probe does not move focus away from a newer input',async()=>{
 const f=fixture();f.fail();const pending=f.buttons[0].click(),input={};f.document.activeElement=input;f.resolve({...confirmed,available:false});await pending;
 assert.equal(f.document.activeElement,input);assert.match(f.text(f.card),/could not be confirmed/);assert.equal(f.calls.length,1);
});
test('a rejected probe request preserves newer input focus and cannot rerun',async()=>{
 const f=fixture();f.fail();const pending=f.buttons[0].click(),input={};f.document.activeElement=input;f.reject(new Error('Controlled network failure'));await pending;
 assert.equal(f.document.activeElement,input);assert.match(f.text(f.card),/Controlled network failure/);assert.equal(f.calls.length,1);
});

test('a repeated expiry replaces the previous access confirmation instead of showing contradictory states',async()=>{
 const f=fixture();f.fail();const pending=f.buttons[0].click();f.resolve(confirmed);await pending;assert.match(f.text(f.card),/Access confirmed/);
 f.fail();assert.equal(f.card.children.length,1);assert.equal(f.card.children[0].attrs.role,'alert');assert.doesNotMatch(f.text(f.card),/Access confirmed/);
});

test('a responding CLI without machine identity points to model reporting instead of CLI access repair', async () => {
 const f=fixture();f.fail();const pending=f.buttons[0].click();f.resolve({...confirmed,modelVerified:false,reportedModel:'unknown'});await pending;
 assert.match(f.text(f.card),/CLI responded, but did not report the actual model/);
 assert.match(f.text(f.card),/before probing again/);assert.match(f.text(f.card),/no new run has started/);
 assert.doesNotMatch(f.text(f.card),/check CLI access/);assert.equal(f.card.children[0].attrs.role,'alert');assert.equal(f.calls.length,1);
});

test('a responding CLI with another identity points to the profile mapping', async () => {
 const f=fixture();f.fail();const pending=f.buttons[0].click();f.resolve({...confirmed,modelVerified:false,reportedModel:'different-machine-model'});await pending;
 assert.match(f.text(f.card),/CLI responded, but reported a different model/);
 assert.match(f.text(f.card),/profile mapping/);assert.doesNotMatch(f.text(f.card),/did not report the actual model/);
 assert.equal(f.card.children[0].attrs.role,'alert');assert.equal(f.calls.length,1);
});
