'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {parseOutput} = require('../src/runtime');
const result = extra => JSON.stringify({type:'result',subtype:'success',result:'Done',...extra});
test('billing evidence accepts only finite nonnegative numeric costs, with unknown preserved',()=>{
  for (const cost of [-1,-0.01,'0.2',null,{},true])
    assert.equal(parseOutput('claude',result({total_cost_usd:cost})).costUsd,null,JSON.stringify(cost));
  for (const cost of [0,0.02,123]) assert.equal(parseOutput('claude',result({total_cost_usd:cost})).costUsd,cost);
  assert.equal(parseOutput('claude',result({})).costUsd,null);
});
test('multiple machine model usage entries cannot be hidden by a single model label',()=>{
  assert.equal(parseOutput('claude',result({model:'expected',modelUsage:{expected:{},other:{}}})).reportedModel,'unknown');
  assert.equal(parseOutput('claude',result({model:'fallback',modelUsage:{actual:{}}})).reportedModel,'actual');
  assert.equal(parseOutput('claude',result({model:'fallback'})).reportedModel,'fallback');
  assert.equal(parseOutput('claude',result({})).reportedModel,'unknown');
});
