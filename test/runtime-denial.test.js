'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseOutput } = require('../src/runtime');
test('explicit runtime errors override a success marker and plausible prose', () => {
 for (const [adapter, output] of [
  ['agy', {status:'SUCCESS',response:'Done',error:'Authentication failed'}],
  ['claude', {type:'result',subtype:'success',result:'Done',error:'Access denied'}],
 ]) assert.equal(parseOutput(adapter,JSON.stringify(output)).valid,false,adapter+' must preserve explicit runtime error');
});
