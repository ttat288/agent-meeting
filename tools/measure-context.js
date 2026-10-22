#!/usr/bin/env node
'use strict';
// Deterministic, model-free retrieval workloads. Pipe JSON into count-context-tokens.py.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert/strict');
const { Meeting } = require('../src/meeting');
const { listSkills, showSkill, inspectSkill } = require('../src/cli-discovery');
const { TOOLS } = require('../src/server');
const m = new Meeting({ maxMsgs:1000 }); m.join('Reader', 'fixture'); m.start('Review API implementation risks', '');
for (let i=0; i<100; i++) m.hostSay(`Decision ${i}: ` + 'Kiểm quyền truy cập API; giữ nguồn task và kiểm chứng kết quả trước tích hợp. '.repeat(6));
const full = m.history('Reader'), visible = m.log.length;
const page = m.history('Reader', {offset:visible-5, limit:5, maxChars:8000});
assert.match(page, /Decision 99:/); assert.doesNotMatch(page, /Decision 0:/);
let offset=0; const pages=[];
do { const p=m.history('Reader', {offset, limit:20, maxChars:8000}); pages.push(p); offset=JSON.parse(p).nextOffset; } while(offset!==null);
assert.equal(pages.flatMap(p=>JSON.parse(p).messages).join('\n\n'), full);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'am-context-fixture-'));
const cases=[
  {id:'history-last-five', scope:'Reader needs last five messages; output payload only', before:[full], after:[page], beforeParts:1, afterParts:1},
  {id:'history-all-pages', scope:'Reader needs all history: pagination adds overhead', before:[full], after:pages, beforeParts:1, afterParts:pages.length},
];
const oldTools=require('../docs/evidence/cli-skills-tokens/room-tools-before.json');
cases.push({id:'room-tool-schema',scope:'Per-session room tool definitions: baseline e292fd3 versus compact descriptions plus pagination schema',before:[JSON.stringify(oldTools)],after:[JSON.stringify(TOOLS)],beforeParts:1,afterParts:1});
try {
  const everything=[];
  for(let i=0;i<12;i++) {
    const id=`skill-${i}`, folder=path.join(dir,id); fs.mkdirSync(path.join(folder,'references'),{recursive:true});
    const entry=`---\nname: ${id}\ndescription: Review component ${i} implementation\n---\nChoose a reference for the assigned task:\n[API](references/api.md)\n[Storage](references/storage.md)\n[UI](references/ui.md)\n`;
    fs.writeFileSync(path.join(folder,'SKILL.md'),entry); everything.push(entry);
    for(const topic of ['api','storage','ui']) {
      const body=`# Component ${i}, ${topic}\n` + `Verify ${topic} behavior against the task requirements. Preserve source evidence and report unknowns.\n`.repeat(60);
      fs.writeFileSync(path.join(folder,'references',topic+'.md'),body); everything.push(body);
    }
  }
  const index=JSON.stringify(listSkills({dir,query:'component 7',graph:true}));
  const graph=JSON.stringify(inspectSkill('skill-7',{dir}));
  const selected=showSkill('skill-7',{dir,resource:'references/api.md'});
  assert.equal(selected,everything[7*4+1]);
  cases.push({id:'skill-select-one-reference',scope:'Find component 7 API guidance among 12 skills × 3 references; count list + graph + manifest + selected resource',
    before:everything,after:[index,graph,showSkill('skill-7',{dir}),selected],beforeParts:everything.length,afterParts:4});
  cases.push({id:'skill-known-short-entry',scope:'Already know a short skill: adding graph discovery is overhead',before:[everything[0]],
    after:[JSON.stringify(listSkills({dir,query:'component 0'})),JSON.stringify(inspectSkill('skill-0',{dir})),everything[0]],beforeParts:1,afterParts:3});
  console.log(JSON.stringify({schema:'agent-meeting/context-workloads@1',cases}));
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
