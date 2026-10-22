#!/usr/bin/env node
'use strict';
// A local executable fixture with Claude's result envelope. No AI/network.
const fs = require('fs'), assert = require('assert');
let raw = '';
process.stdin.on('data', b => { raw += b; });
process.stdin.on('end', () => {
  try {
    const prompt = JSON.parse(raw), model = process.argv[process.argv.indexOf('--model') + 1];
    let text;
    if (prompt.purpose === 'successor-readiness') {
      assert.match(fs.readFileSync('sum.js','utf8'), /WIP/);
      let denied = false; try { fs.writeFileSync('sum.js','bootstrap must not write'); } catch { denied = true; } assert(denied);
      text = JSON.stringify({ ready:true, checkpointHash:prompt.checkpoint.hash, generation:prompt.checkpoint.generation });
    } else if (prompt.purpose === 'continue-same-slot') {
      assert.match(fs.readFileSync('sum.js','utf8'), /WIP/);
      assert.match(prompt.checkpoint.decisions, /Preserve/);
      fs.writeFileSync('sum.js','module.exports=(a,b)=>a+b; // production driver preserved WIP\n');
      text = 'Executable fixture completed WIP; independent tests required.';
    } else {
      fs.writeFileSync('sum.js','module.exports=(a,b)=>a+b; // WIP\n');
      text = JSON.stringify({ ...prompt.runtimeControl, decisions:'Preserve acceptance, scope and WIP; no commit/settings',unknowns:'Unknown model billing',next:'Continue the same slot from checkpoint' });
    }
    console.log(JSON.stringify({type:'result',subtype:'success',result:text,model,usage:null,total_cost_usd:null}));
  } catch (e) { console.log(JSON.stringify({type:'error',error:e.message})); process.exitCode = 1; }
});
