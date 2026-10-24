'use strict';
// Offline replay of retained model-generated patches. Does not call a model.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const csv = require('../test/fixtures/csv-retry');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const dir = path.resolve(__dirname, '../docs/evidence/task-skills/agy-live');
const report = JSON.parse(fs.readFileSync(path.join(dir, 'matched.json')));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-live-replay-'));
try {
  assert.equal(new Set(report.arms.map(a => a.base)).size, 1);
  for (const arm of report.arms) {
    assert.equal(arm.sourceHash, hash(csv.incomplete));
    assert.equal(arm.testHash, hash(csv.tests));
    assert.equal(arm.failed.exitCode, 1);
    assert.equal(arm.guard, true);
    assert.equal(arm.requests.length, 1);
    assert.deepEqual(arm.requests[0].request, { tool: 'skill_load', arguments: { id: 'csv-guide', resource: 'references/csv.md' } });
    assert.equal(arm.requests[0].output.sha256, hash(arm.requests[0].output.text));
    assert.equal(arm.patch.taskId, report.facts.taskId);
    assert.equal(arm.patch.requirementRevision, 2);
    assert.equal(arm.patch.sourceSha256, arm.sourceHash);
    assert.equal(arm.patch.file, 'csv-cell.js');
    assert.equal(arm.patch.status, 'reported');
    const target = path.join(root, arm.name);
    fs.mkdirSync(path.join(target, 'test'), { recursive: true });
    fs.writeFileSync(path.join(target, 'csv-cell.js'), arm.patch.content);
    fs.writeFileSync(path.join(target, 'test/csv-cell.test.js'), csv.tests);
    const check = csv.execute(target, ['--test', 'test/csv-cell.test.js'], false);
    assert.equal(check.exitCode, 0, check.output);
    assert.equal(hash(fs.readFileSync(path.join(target, 'csv-cell.js'))), arm.outputHash);
    assert.equal(hash(fs.readFileSync(path.join(target, 'test/csv-cell.test.js'))), arm.testHash);
    assert.equal(arm.integration.exitCode, 0);
  }
  console.log(JSON.stringify({ arms: report.arms.length, checksPerArm: 8, status: 'passed', modelCalls: 0,
    scope: 'Offline replay of recorded real-model patches; not a new inference or native MCP run' }));
} finally { fs.rmSync(root, { recursive: true, force: true }); }
