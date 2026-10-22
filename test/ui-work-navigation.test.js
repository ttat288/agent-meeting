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
 const f=fixture(),old=f.navigate();f.context.location.hash='#results';const current=f.navigate();f.resolvers[1]({id:'new'});await current;f.resolvers[0]({id:'old'});await old;assert.deepEqual(f.accepted,[{id:'new'}]);assert.equal(f.renders(),1);
});
