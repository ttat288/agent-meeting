'use strict';
// Offline replay of stored agy patch DATA. No model, network or application settings.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..'), evidence = path.join(repo, 'docs/evidence/value-journey');
const calls = JSON.parse(fs.readFileSync(path.join(evidence, 'model-calls.json')));
const before = JSON.parse(fs.readFileSync(path.join(evidence, 'inputs/source-before.json')));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-value-replay-'));
const results = [];
try {
  for (const [id, file, expected, mode, nativeFile, expectedLegacy] of [
    ['direct-retry', 'src/server.js', false, false],
    ['direct-full', 'src/server.js', false, false],
    ['direct-repair', 'src/server.js', true, false, null, false],
    ['mode', 'src/work.js', true, true],
    ['direct-native', 'src/server.js', true, false, 'native-server.js.txt', true],
    ['direct-native-sealed', 'src/server.js', false, false, 'native-sealed-server.js.txt', true],
    ['direct-native-sealed-repair', 'src/server.js', true, false, 'native-sealed-repair-server.js.txt', false],
    ['native-pm-corrected', 'src/server.js', true, false, 'native-pm-corrected-server.js.txt', true],
  ]) {
    const dir = path.join(root, id); fs.mkdirSync(dir);
    for (const folder of ['src', 'bin']) fs.cpSync(path.join(repo, folder), path.join(dir, folder), { recursive: true });
    fs.copyFileSync(path.join(repo, 'package.json'), path.join(dir, 'package.json'));
    for (const [name, body] of Object.entries(before)) fs.writeFileSync(path.join(dir, name), body);
    fs.mkdirSync(path.join(dir, 'test'));
    const test = mode ? 'work-cancel.test.js' : 'work-handoff.test.js';
    fs.copyFileSync(mode ? path.join(repo, 'test', test) : path.join(evidence, 'inputs/handoff-acceptance.test.js.txt'), path.join(dir, 'test', test));
    const call = calls.find(c => c.id === id);
    let source = before[file];
    if (nativeFile) source = fs.readFileSync(path.join(evidence, 'inputs', nativeFile), 'utf8');
    else {
      const body = call.response.trim().replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '');
      const patch = JSON.parse(body);
      for (const edit of patch.edits) {
        assert.equal(typeof edit.find, 'string'); assert.equal(typeof edit.replace, 'string');
        assert.equal(source.split(edit.find).length, 2, id + ': exact edit must match once');
        source = source.replace(edit.find, edit.replace);
      }
    }
    fs.writeFileSync(path.join(dir, file), source);
    const args = ['--test', ...(mode ? ['--test-name-pattern=restrictive.*umask|restrictive process umask|permission change'] : []), path.join('test', test)];
    const checked = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
    assert.equal(checked.status === 0, expected, id + '\n' + checked.stdout + checked.stderr);
    let legacy;
    if (expectedLegacy !== undefined) {
      fs.copyFileSync(path.join(evidence, 'inputs/legacy-edge.test.js.txt'), path.join(dir, 'test/legacy-edge.test.js'));
      const edge = spawnSync(process.execPath, ['--test', '--test-name-pattern=missing run revision', 'test/legacy-edge.test.js'], { cwd: dir, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
      assert.equal(edge.status === 0, expectedLegacy, id + ': post-hoc legacy case\n' + edge.stdout + edge.stderr);
      legacy = { postHoc: true, expectedPass: expectedLegacy, exitCode: edge.status, output: edge.stdout + edge.stderr };
    }
    results.push({ id, actor: id === 'native-pm-corrected' ? 'PM one-line correction; no model call' : 'stored agy output', expectedPass: expected, exitCode: checked.status, output: checked.stdout + checked.stderr, legacy });
  }
  process.stdout.write(JSON.stringify({ recordedAt: new Date().toISOString(), offlineReplay: true, modelCalls: 0, results,
    limitations: ['Stored patch data and native direct file bytes are replayed offline, not native managed agy integration.', 'The handoff contract was clarified and diagnostics manually transferred before direct-repair; this is not a blind quality ranking.', 'The lexical snapshot warning assertion was corrected to accept missing/unavailable/unknown, then the same immutable four-test file was used for all replay candidates.', 'The immutable original four checks are followed by a separate post-hoc missing-run-revision case; failures remain visible, with the same extra test on each relevant candidate.', 'Unsealed native is capability evidence; sealed runs hide the real repo and previous arm outputs. Neither adds native managed agy support.', 'This replay covers handoff and permission tasks, not subsequent rebase/UI recovery guards.'] }, null, 2) + '\n');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
