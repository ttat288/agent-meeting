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

function hostRefreshFixture({cached=1,incoming=2,mounted=true}={}){
 let draws=0,removed=0;const notices=[];
 const context=vm.createContext({remote:{revision:cached,hosts:['newer']},remoteError:'Earlier error',api:async()=>({revision:incoming,hosts:['incoming']}),hosts:{isConnected:mounted},page:{querySelector:()=>({remove:()=>{removed++;}})},drawHosts:()=>{draws++;},notify:text=>notices.push(text),t:(vi,en)=>en,renderAdmin:()=>{throw Error('A read-only refresh must not rebuild forms');}});
 const start=source.indexOf('    async function refreshHosts()'),end=source.indexOf('    page.append(',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 return{context,notices,draws:()=>draws,removed:()=>removed};
}
test('host refresh updates only the mounted list and clears its recovered error',async()=>{
 const f=hostRefreshFixture();await f.context.refreshHosts();assert.equal(f.context.remote.revision,2);assert.equal(f.context.remoteError,null);assert.equal(f.draws(),1);assert.equal(f.removed(),1);assert.equal(f.notices.length,1);
});
test('stale host response cannot replace a newer snapshot or clear its error',async()=>{
 const f=hostRefreshFixture({cached:3,incoming:2});await f.context.refreshHosts();assert.equal(f.context.remote.revision,3);assert.equal(f.context.remoteError,'Earlier error');assert.equal(f.draws(),0);assert.equal(f.removed(),0);assert.equal(f.notices.length,0);
});
test('a host response from a detached view cannot modify the new view',async()=>{
 const f=hostRefreshFixture({mounted:false});await f.context.refreshHosts();assert.equal(f.context.remote.revision,2);assert.equal(f.draws(),0);assert.equal(f.removed(),0);assert.equal(f.notices.length,0);
});

function taskSaveFixture(){
 const calls=[],resolvers=[],rejectors=[],removed=[],notices=[];let renders=0,focuses=0;
 const context=vm.createContext({workEditVersion:0,api:(endpoint,data)=>{calls.push({endpoint,data});return new Promise((resolve,reject)=>{resolvers.push(resolve);rejectors.push(reject);});},localStorage:{removeItem:key=>removed.push(key)},taskDraftKey:task=>'draft:'+task.id+':'+task.requirementRevision,acceptWork:next=>{context.work=next;},renderTaskList:()=>{renders++;},$:()=>({focus:()=>{focuses++;}}),notify:text=>notices.push(text),t:(vi,en)=>en});
 const start=source.indexOf('  async function saveTaskRequirements('),end=source.indexOf('  const disclosure =',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 return{context,calls,resolvers,rejectors,removed,notices,renders:()=>renders,focuses:()=>focuses,task:{id:'task-a',requirementRevision:2},form:{isConnected:true,closest:()=>null}};
}
test('normal task save adopts server work and clears only its old draft key',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));
 assert.equal(f.calls[0].data.expectedRevision,2);assert.deepEqual(Array.from(f.calls[0].data.acceptance),['submitted']);f.resolvers[0]({requirementRevision:3});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls[1].endpoint,'/work');f.resolvers[1]({tasks:[{requirementRevision:3}]});assert.equal(await pending,true);assert.deepEqual(f.removed,['draft:task-a:2']);assert.equal(f.context.work.tasks[0].requirementRevision,3);assert.equal(f.renders(),1);assert.equal(f.focuses(),1);
});
test('typing during task configure preserves old revision and newer draft without another read',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.context.workEditVersion++;f.resolvers[0]({requirementRevision:3});assert.equal(await pending,false);assert.equal(f.calls.length,1);assert.equal(f.renders(),0);assert.equal(f.focuses(),0);assert.deepEqual(f.removed,[]);assert.equal(f.task.requirementRevision,2);assert.match(f.notices[0],/retained/);
});
test('typing during post-save work read still prevents late replacement',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.resolvers[0]({});await new Promise(resolve=>setImmediate(resolve));f.context.workEditVersion++;f.resolvers[1]({tasks:[{requirementRevision:3}]});assert.equal(await pending,false);assert.equal(f.renders(),0);assert.equal(f.context.work,undefined);assert.deepEqual(f.removed,[]);
});
test('task save from a replaced form never clears storage or redraws the current view',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.form.isConnected=false;f.resolvers[0]({});assert.equal(await pending,false);assert.equal(f.calls.length,1);assert.equal(f.renders(),0);assert.deepEqual(f.removed,[]);
});
test('task save conflict preserves the draft and propagates the error for recovery',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.rejectors[0](new Error('Task changed; reload before saving this draft'));await assert.rejects(pending,/Task changed/);assert.equal(f.renders(),0);assert.deepEqual(f.removed,[]);assert.equal(f.calls.length,1);
});
test('normal task save tolerates unavailable browser storage',async()=>{
 const f=taskSaveFixture();f.context.localStorage={removeItem:()=>{throw Error('Storage blocked');}};const pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.resolvers[0]({});await new Promise(resolve=>setImmediate(resolve));f.resolvers[1]({tasks:[]});assert.equal(await pending,true);assert.equal(f.renders(),1);
});

test('a task save hidden by the conversation cannot steal chat focus',async()=>{
 const f=taskSaveFixture(),pending=f.context.saveTaskRequirements(f.task,f.form,()=>({acceptance:['submitted']}));f.form.closest=()=>({hidden:true});f.resolvers[0]({});assert.equal(await pending,false);assert.equal(f.calls.length,1);assert.equal(f.renders(),0);assert.equal(f.focuses(),0);assert.deepEqual(f.removed,[]);
});
