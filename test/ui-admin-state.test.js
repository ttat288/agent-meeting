'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/ui/workspace.js'),'utf8');
function fixture(revision=7){
 const calls=[],notices=[],resolvers=[],rejectors=[];let renders=0,focuses=0;
 const context=vm.createContext({config:{revision},pendingConfig:null,adminEditVersion:0,
  api:(endpoint,data)=>{calls.push({endpoint,data});return new Promise((resolve,reject)=>{resolvers.push(resolve);rejectors.push(reject);});},
  notify:text=>notices.push(text),t:(vi,en)=>en,renderAdmin:()=>{renders++;},$:()=>({focus:()=>{focuses++;}})});
 const start=source.indexOf('  async function saveConfig('),end=source.indexOf('  function renderAdmin()',start);
 assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 return {context,calls,notices,resolvers,rejectors,renders:()=>renders,focuses:()=>focuses};
}
test('unchanged connected admin save adopts the exact server revision',async()=>{
 const f=fixture(),form={isConnected:true},pending=f.context.saveConfig({revision:7},form);
 assert.equal(f.calls[0].data.expectedRevision,7);f.resolvers[0]({revision:8});
 assert.equal(await pending,true);assert.equal(f.context.config.revision,8);assert.equal(f.renders(),1);
});
test('admin fields edited while saving keep the viewed snapshot until explicit recovery',async()=>{
 const f=fixture(),pending=f.context.saveConfig({revision:7},{isConnected:true});f.context.adminEditVersion++;
 f.resolvers[0]({revision:8});await pending;
 assert.equal(f.renders(),0,'A late save must not replace newer input');assert.equal(f.context.config.revision,7);
 assert.equal(f.context.pendingConfig.revision,8);assert.equal(f.calls.length,1);
 const next=f.context.saveConfig({revision:7},{isConnected:true});assert.equal(f.calls[1].data.expectedRevision,7,'The old view must not silently adopt a new CAS revision');f.rejectors[1](new Error('Configuration changed'));await assert.rejects(next,/Configuration changed/);assert.equal(f.context.config.revision,7);assert.equal(f.renders(),0);
});
test('replaced admin form cannot redraw a newer view after its save returns',async()=>{
 const f=fixture(),form={isConnected:true},pending=f.context.saveConfig({revision:7},form);form.isConnected=false;f.resolvers[0]({revision:8});
 assert.equal(await pending,false);assert.equal(f.renders(),0);assert.equal(f.context.config.revision,7);assert.equal(f.context.pendingConfig.revision,8);
});
test('older saved response cannot rewind a newer config already loaded',async()=>{
 const f=fixture(),pending=f.context.saveConfig({revision:7},{isConnected:true});f.context.config={revision:9};f.resolvers[0]({revision:8});
 assert.equal(await pending,false);assert.equal(f.context.config.revision,9);assert.equal(f.renders(),0);assert.equal(f.context.pendingConfig,null);
});
test('out-of-order deferred saves retain the newest acknowledged snapshot',async()=>{
 const f=fixture(),form={isConnected:false},first=f.context.saveConfig({revision:7},form),second=f.context.saveConfig({revision:7},form);
 f.resolvers[1]({revision:9});await second;f.resolvers[0]({revision:8});await first;
 assert.equal(f.context.pendingConfig.revision,9);assert.equal(f.context.config.revision,7);assert.equal(f.renders(),0);
});
test('latest notice receives its full lifetime instead of an older hide timer',()=>{
 let now=0,id=0;const timers=new Map(),notice={hidden:true,textContent:''};
 const context=vm.createContext({noticeTimer:undefined,$:()=>notice,setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},clearTimeout:key=>timers.delete(key)});
 const start=source.indexOf('  function notify('),end=source.indexOf('  async function api(',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 const advance=ms=>{now+=ms;for(const [key,timer]of [...timers])if(timer.at<=now){timers.delete(key);timer.fn();}};
 context.notify('First result');advance(2000);context.notify('Newer result');advance(4000);
 assert.equal(notice.hidden,false);assert.equal(notice.textContent,'Newer result');advance(1999);assert.equal(notice.hidden,false);advance(1);assert.equal(notice.hidden,true);
});
