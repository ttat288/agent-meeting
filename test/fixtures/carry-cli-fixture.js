#!/usr/bin/env node
'use strict';
// No network/provider/model. Run via production Claude print parser and bwrap.
const fs = require('node:fs'), assert = require('node:assert/strict');
let raw = '';
process.stdin.on('data', b => { raw += b; });
process.stdin.on('end', () => {
  try {
    const prompt = JSON.parse(raw), model = process.argv[process.argv.indexOf('--model') + 1];
    let text;
    if (prompt.purpose === 'successor-readiness') {
      assert.match(fs.readFileSync('sum.js', 'utf8'), /WIP/);
      assert.throws(() => fs.writeFileSync('sum.js', 'illegal bootstrap write'));
      text = JSON.stringify({ checkpointHash: prompt.checkpoint.hash, generation: prompt.checkpoint.generation, ready: true });
    } else if (prompt.purpose === 'continue-same-slot') {
      assert.match(fs.readFileSync('sum.js', 'utf8'), /WIP/);
      assert.match(prompt.checkpoint.decisions, /Keep existing sum API/);
      assert.equal(prompt.checkpoint.continuation.failedAttempts.length, 1);
      fs.writeFileSync('sum.js', 'module.exports=(a,b)=>a+b; // preserved WIP\n');
      text = 'Fixture completed WIP; independent tests required.';
    } else {
      fs.writeFileSync('sum.js', 'module.exports=(a,b)=>a+b; // WIP\n');
      process.on('SIGTERM', () => {});
      setInterval(() => {}, 50);
      return;
    }
    console.log(JSON.stringify({ type: 'result', subtype: 'success', result: text, model, usage: null, total_cost_usd: null }));
  } catch (e) { console.log(JSON.stringify({ type: 'error', error: e.message })); process.exitCode = 1; }
});
