'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { aggregateResults } = require('../src/evaluation');

test('UI evidence labels agree with independent acceptance on cancellation, timeout, error and missing data', () => {
  const line = fs.readFileSync(path.join(__dirname, '../src/ui/workspace.js'), 'utf8').split('\n').find(l => l.trim().startsWith('function evidencePassed('));
  assert(line, 'UI evidence classifier must exist');
  const passed = new Function('return (' + line.trim() + ')')();
  for (const [entry, expected] of [[{ exitCode: 0 }, true], [{ exitCode: 0, timeout: true }, false], [{ exitCode: 0, cancelled: true }, false], [{ exitCode: 0, error: 'failed' }, false], [{ exitCode: 1 }, false], [{ exitCode: null }, false], [{ exitCode: '0' }, false], [{}, false], [null, false]]) {
    assert.equal(passed(entry), expected, JSON.stringify(entry));
    const result = aggregateResults({ runs: [{ id: 'fixture', taskId: 'fixture', status: 'integrated', evidence: [entry], integrationEvidence: [entry] }] });
    assert.equal(result.summary.acceptedRuns === 1, expected);
  }
});
