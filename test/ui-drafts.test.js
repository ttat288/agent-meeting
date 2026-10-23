'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function helpers(entries, blocked=false){
 const saved=new Map(entries), calls=[];
 const storage={get length(){if(blocked)throw Error('Storage disabled');return saved.size;},key:i=>[...saved.keys()][i],getItem:key=>{if(blocked)throw Error('Storage disabled');calls.push(key);return saved.get(key)||null;},setItem:()=>{throw Error('Recovery must be read-only');},removeItem:()=>{throw Error('Recovery must not delete drafts');}};
 // Exercise the browser helpers themselves, with storage as the only seam.
 const source=fs.readFileSync(path.join(__dirname,'../src/ui/workspace.js'),'utf8');
 const start=source.indexOf('  const draftArrayFields ='),end=source.indexOf('\n  function configureForm(task)',start);
 assert(start>=0&&end>start,'Draft helper boundary must remain reviewable');
 const api=new Function('localStorage','hostKey',source.slice(start,end)+'\nreturn {storedTaskDraft,previousTaskDraft};')(storage,'host-one');
 return {...api,calls};
}
const fields=['purpose','workspace','acceptance','writePaths'];
test('previous draft lookup stays in the host/task scope and selects the latest older valid revision',()=>{
 const h=helpers([
 ['agent-meeting:host-one:task:task-one:1',JSON.stringify({acceptance:['first']})],
 ['agent-meeting:host-two:task:task-one:8',JSON.stringify({acceptance:['other host private']})],
 ['agent-meeting:host-one:task:task-two:7',JSON.stringify({acceptance:['other task']})],
 ['agent-meeting:host-one:task:task-one:3',JSON.stringify({acceptance:['latest old'],workspace:'/tmp/fixture'})],
 ['agent-meeting:host-one:task:task-one:4','invalid JSON'],
 ['agent-meeting:host-one:task:task-one:5',JSON.stringify({acceptance:['current']})],
 ['agent-meeting:host-one:task:task-one:6',JSON.stringify({acceptance:['future']})],
 ]);
 assert.deepEqual(h.previousTaskDraft({id:'task-one',requirementRevision:5},fields),{revision:3,values:{workspace:'/tmp/fixture',acceptance:['latest old']}});
 assert(!h.calls.some(key=>key.includes('host-two')||key.includes('task-two')||key.endsWith(':5')||key.endsWith(':6')));
});
test('malformed draft fields cannot break the form or introduce fields outside the editable contract',()=>{
 const h=helpers([['draft',JSON.stringify({purpose:'execute',workspace:[],acceptance:'wrong type',writePaths:['sum.js'],goal:'must not replace server goal',extra:{}})]]);
 assert.deepEqual(h.storedTaskDraft('draft',fields),{purpose:'execute',writePaths:['sum.js']});
 assert.deepEqual(h.storedTaskDraft('missing',fields),{});
});
test('disabled local storage leaves current server requirements usable without recovery writes',()=>{
 const h=helpers([],true);
 assert.deepEqual(h.storedTaskDraft('draft',fields),{});
 assert.equal(h.previousTaskDraft({id:'task-one',requirementRevision:2},fields),null);
});
