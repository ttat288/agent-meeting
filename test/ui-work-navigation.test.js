'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/ui/workspace.js'),'utf8');
function fixture(){
 const resolvers=[],rejectors=[],errors=[],accepted=[];let renders=0,focuses=0;
 const elements={workView:{hidden:false,scrollTop:20},sessionNav:{querySelectorAll:()=>[]},sessionAdmin:{href:''},page:{},workTitle:{focus:()=>{focuses++;}}};
 const context=vm.createContext({navigationVersion:0,pendingWork:null,pollEtag:'old',location:{hash:'#plan'},document:{body:{dataset:{}}},meetingUrl:'/m/private-fixture',lang:'en',loaded:true,tab:'plan',$:id=>elements[id],api:()=>new Promise((resolve,reject)=>{resolvers.push(resolve);rejectors.push(reject);}),acceptWork:next=>accepted.push(next),renderDaily:()=>{renders++;},errorBox:(page,error)=>errors.push(error.message)});
 const start=source.indexOf('    const navigate = async () => {'),end=source.indexOf('    let summaryVersion =',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 return{context,elements,resolvers,rejectors,errors,accepted,renders:()=>renders,focuses:()=>focuses,navigate:()=>vm.runInContext('navigate()',context)};
}
test('a superseded navigation error cannot attach to the newer Results view',async()=>{
 const f=fixture(),old=f.navigate();f.context.location.hash='#results';const current=f.navigate();f.resolvers[1]({id:'current-results'});await current;f.rejectors[0](new Error('Old Plan read failed'));await old;
 assert.deepEqual(f.errors,[]);assert.deepEqual(f.accepted,[{id:'current-results'}]);assert.equal(f.renders(),1);
});
test('a navigation error after returning to conversation cannot create a hidden alert',async()=>{
 const f=fixture(),old=f.navigate();f.context.location.hash='#conversation';await f.navigate();f.rejectors[0](new Error('Old read failed'));await old;assert.equal(f.elements.workView.hidden,true);assert.deepEqual(f.errors,[]);assert.equal(f.renders(),0);
});
test('the active navigation failure remains visible and never renders success',async()=>{
 const f=fixture(),pending=f.navigate();f.rejectors[0](new Error('Current read failed'));await pending;assert.deepEqual(f.errors,['Current read failed']);assert.equal(f.accepted.length,0);assert.equal(f.renders(),0);
});
test('a superseded success cannot rewind current work or focus',async()=>{
 const f=fixture(),old=f.navigate();f.context.location.hash='#results';const current=f.navigate();f.resolvers[1]({id:'new'});await current;f.resolvers[0]({id:'old'});await old;assert.deepEqual(f.accepted,[{id:'new'}]);assert.equal(f.renders(),1);assert.equal(f.focuses(),1);
});

test('current navigation moves focus to its newly rendered heading',async()=>{
 const f=fixture(),pending=f.navigate();f.resolvers[0]({id:'new'});await pending;assert.equal(f.focuses(),1);
});

function updateFixture({focus='title',editing=false}={}){
 let renders=0,focuses=0;const body={},outside={},oldTitle={},nextTitle={focus:options=>{focuses++;context.document.activeElement=nextTitle;context.focusOptions=options;}};
 const elements={workView:{scrollTop:123},workTitle:oldTitle,page:{getAttribute:()=>null,querySelector:()=>null},taskList:{contains:()=>editing,querySelector:()=>null}};
 const context=vm.createContext({pendingWork:{work:{revision:4,metrics:{runs:0}},remote:{revision:2}},work:{revision:3},remote:{revision:1},metrics:null,metricsError:null,remoteError:null,$:id=>elements[id],document:{activeElement:focus==='title'?oldTitle:outside},renderDaily:()=>{renders++;if(context.document.activeElement===oldTitle)context.document.activeElement=body;elements.workTitle=nextTitle;},window:{dispatchEvent:()=>{}},CustomEvent:class {}});
 const start=source.indexOf('  function applyWorkUpdate('),end=source.indexOf('  async function refreshWork(',start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
 return{context,elements,oldTitle,nextTitle,outside,renders:()=>renders,focuses:()=>focuses};
}
test('background work updates restore focus only when replacing the focused heading',()=>{
 const f=updateFixture();f.context.applyWorkUpdate();assert.equal(f.renders(),1);assert.equal(f.context.document.activeElement,f.nextTitle);assert.equal(f.focuses(),1);assert.equal(f.context.focusOptions.preventScroll,true);assert.equal(f.elements.workView.scrollTop,123);
});
test('background work updates never pull focus from an outside navigation control',()=>{
 const f=updateFixture({focus:'outside'});f.context.applyWorkUpdate();assert.equal(f.renders(),1);assert.equal(f.context.document.activeElement,f.outside);assert.equal(f.focuses(),0);
});
test('an active edit still defers background updates instead of replacing its heading or input',()=>{
 const f=updateFixture({editing:true});f.context.applyWorkUpdate();assert.equal(f.renders(),0);assert.equal(f.context.document.activeElement,f.oldTitle);assert.equal(f.focuses(),0);assert.equal(f.context.pendingWork.work.revision,4);
});
test('explicitly showing updates focuses the new heading once',()=>{
 const f=updateFixture({focus:'outside'});f.context.applyWorkUpdate(true);assert.equal(f.focuses(),1);assert.equal(f.context.document.activeElement,f.nextTitle);
});

test('initial work load focuses the active view heading',async()=>{
 const f=fixture();f.context.loaded=false;f.context.load=async()=>{f.context.loaded=true;};await f.navigate();assert.equal(f.focuses(),1);
});
test('an initial load completing after return to conversation cannot take focus',async()=>{
 const f=fixture();let done;f.context.loaded=false;f.context.load=()=>new Promise(resolve=>{done=resolve;});const pending=f.navigate();f.context.location.hash='#conversation';await f.navigate();done();await pending;assert.equal(f.focuses(),0);
});

function installLoader(f,{failConfigOnce=false}={}){
 let configReads=0,workReads=0,draws=0,release,retryButton;const waiting=new Promise(resolve=>{release=resolve;}),heading=f.elements.workTitle;
 f.context.loaded=false;f.context.loading=null;f.context.admin=false;f.context.adminTab='models';f.context.workVisitedKey='fixture:visited';f.context.localStorage={setItem:()=>{}};f.context.node=()=>({});f.context.button=(label,callback)=>({label,callback});f.context.heading=()=>[];f.context.t=(vi,en)=>en;
 f.elements.page.replaceChildren=()=>{delete f.elements.workTitle;};f.elements.page.append=button=>{retryButton=button;};
 f.context.api=async endpoint=>{if(endpoint==='/config'){configReads++;if(failConfigOnce&&configReads===1)throw Error('Controlled config read failure');return{revision:1};}workReads++;return{tasks:[],runs:[]};};
 f.context.loadAuxiliary=()=>waiting;f.context.renderDaily=()=>{draws++;f.elements.workTitle=heading;};
 const at=source.indexOf('function load() {'),start=source.lastIndexOf('\n',at)+1,end=source.indexOf('  if (embedded) {',at);assert(at>=0&&end>start);vm.runInContext(source.slice(start,end),f.context);
 return{release,configReads:()=>configReads,workReads:()=>workReads,draws:()=>draws,retry:()=>retryButton.callback()};
}
test('concurrent initial-load consumers wait for readiness without duplicate reads',async()=>{
 const f=fixture(),l=installLoader(f);let secondReady=false;const first=f.context.load(),second=f.context.load().then(()=>{secondReady=true;});await new Promise(resolve=>setImmediate(resolve));assert.equal(secondReady,false,'A later caller must await the in-flight load');assert.equal(l.configReads(),1);assert.equal(l.workReads(),1);l.release();await Promise.all([first,second]);assert.equal(l.draws(),1);assert.equal(f.context.loaded,true);
});
test('the latest initial work navigation focuses only after the shared load renders its heading',async()=>{
 const f=fixture(),l=installLoader(f),old=f.navigate();await new Promise(resolve=>setImmediate(resolve));f.context.location.hash='#results';const current=f.navigate();l.release();await Promise.all([old,current]);assert.equal(f.focuses(),1);assert.equal(f.context.tab,'results');assert.equal(l.configReads(),1);assert.equal(l.workReads(),1);assert.equal(l.draws(),1);
});
test('failed initial load releases its pending state so an explicit retry can recover',async()=>{
 const f=fixture(),l=installLoader(f,{failConfigOnce:true});await f.context.load();assert.equal(f.context.loaded,false);assert.equal(Boolean(f.context.loading),false);assert.deepEqual(f.errors,['Controlled config read failure']);f.context.document.activeElement=f.context.document.body;const retry=l.retry();l.release();await retry;assert.equal(f.context.loaded,true);assert.equal(l.configReads(),2);assert.equal(l.workReads(),1);assert.equal(l.draws(),1);assert.equal(f.focuses(),1);
});

test('retry recovery does not pull focus from a newer outside interaction',async()=>{
 const f=fixture(),l=installLoader(f,{failConfigOnce:true});await f.context.load();const retry=l.retry(),outside={};f.context.document.activeElement=outside;l.release();await retry;assert.equal(f.context.loaded,true);assert.equal(f.focuses(),0);assert.equal(f.context.document.activeElement,outside);
});
