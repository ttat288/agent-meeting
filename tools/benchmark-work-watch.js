#!/usr/bin/env node
'use strict';
// Local HTTP transport benchmark only. No model, user store, fixed port or global settings.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const http = require('node:http'), crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');
const root = path.resolve(__dirname, '..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function read(origin, endpoint, agent, headers = {}, method = 'GET') {
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const req = http.request(origin + endpoint, { method, agent, headers }, res => {
      const chunks = [];
      res.on('data', b => chunks.push(b));
      res.on('error', reject);
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const responseHeaderBytes = Buffer.byteLength(`HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n` + Array.from({ length: res.rawHeaders.length / 2 }, (_, i) => res.rawHeaders[i * 2] + ': ' + res.rawHeaders[i * 2 + 1] + '\r\n').join('') + '\r\n');
        resolve({ status: res.statusCode, elapsedMs: performance.now() - started, bodyBytes: body.length, bodySha256: sha(body), responseHeaderBytes, conditionalRequestHeaderBytes: headers['if-none-match'] ? Buffer.byteLength('if-none-match: ' + headers['if-none-match'] + '\r\n') : 0, etag: res.headers.etag || null, body: body.toString('utf8') });
      });
    });
    req.on('error', reject); req.setTimeout(5000, () => req.destroy(new Error('Benchmark request timed out'))); req.end();
  });
}
const publicSample = ({ body, ...sample }) => sample;
function summarize(samples) {
  const sorted = samples.map(s => s.elapsedMs).sort((a, b) => a - b);
  return { samples: samples.length, medianMs: sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2, maxMs: sorted.at(-1), bodyBytes: samples.reduce((n, s) => n + s.bodyBytes, 0), responseHeaderBytes: samples.reduce((n, s) => n + s.responseHeaderBytes, 0), conditionalRequestHeaderBytes: samples.reduce((n, s) => n + s.conditionalRequestHeaderBytes, 0) };
}
async function benchmark(samples = 30) {
  assert(Number.isInteger(samples) && samples >= 5 && samples <= 100, 'Use 5–100 samples');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-work-watch-bench-'));
  const started = performance.now(), agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  let app;
  try {
    app = createApp({ configDir: dir + '/config', workDir: dir + '/work', tick: 60000, idleMs: 600000 });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + app.server.address().port;
    const cases = [];
    for (const taskCount of [1, 25, 100]) {
      const room = app.create({ hostKey: 'bench_host_' + taskCount + '_123456789', id: 'bench_agent_' + taskCount + '_123456789', fixed: true });
      room.start('Synthetic monitoring workload. These tasks have not been executed by a model. ' + 'Keep one canonical task, its source and independent acceptance. '.repeat(16), '', { agenda: [] });
      const endpoint = '/api/host/' + room.hostKey + '/work';
      // The host task API avoids meeting prose deduplication/truncation and
      // creates genuine canonical task records without private store injection.
      for (let i = 0; i < taskCount; i++) {
        const response = await fetch(origin + endpoint + '/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goal: `Verify change ${i + 1} and retain source provenance across reload`, acceptance: ['Independent tests pass', 'No changes outside the approved scope'], sources: ['src/example-' + i + '.js'], facts: ['Synthetic benchmark input; not an executed task'] }) });
        assert.equal(response.status, 201); await response.json();
      }
      const initial = await read(origin, endpoint, agent), input = JSON.parse(initial.body);
      assert.equal(input.tasks.length, taskCount);
      // Exclude equal warmup requests from the measured samples, but report count.
      for (let i = 0; i < 3; i++) { await read(origin, endpoint, agent); await read(origin, endpoint, agent, { 'if-none-match': initial.etag }); }
      const arms = { unconditional: [], conditional: [] };
      for (let i = 0; i < samples; i++) {
        for (const arm of i % 2 ? ['conditional', 'unconditional'] : ['unconditional', 'conditional']) {
          const result = await read(origin, endpoint, agent, arm === 'conditional' ? { 'if-none-match': initial.etag } : {});
          assert.equal(result.status, arm === 'conditional' ? 304 : 200);
          if (arm === 'conditional') assert.equal(result.bodyBytes, 0);
          else assert.equal(result.bodySha256, initial.bodySha256);
          arms[arm].push(publicSample(result));
        }
      }
      // Independent acceptance: a mutation invalidates the tag and both policies
      // receive byte-identical current facts, including the new source decision.
      room.hostSay('KẾT LUẬN: Retain independent tests; authenticated fixture mutation.');
      const changedConditional = await read(origin, endpoint, agent, { 'if-none-match': initial.etag });
      const changedBaseline = await read(origin, endpoint, agent);
      assert.equal(changedConditional.status, 200);
      assert.notEqual(changedConditional.etag, initial.etag);
      assert.equal(changedConditional.bodySha256, changedBaseline.bodySha256);
      assert.equal(JSON.parse(changedConditional.body).session.decisions.length, 1);
      const checks = [];
      for (const [name, url, headers, status, method] of [
        ['forwarded-denied', endpoint, { 'x-forwarded-for': '192.0.2.1' }, 403],
        ['invite-is-not-host', '/api/host/' + room.id + '/work', {}, 404],
        ['unsupported-method', endpoint, {}, 405, 'DELETE'],
      ]) {
        const r = await read(origin, url, agent, { ...headers, 'if-none-match': changedConditional.etag }, method);
        assert.equal(r.status, status); checks.push({ name, ...publicSample(r) });
      }
      cases.push({ taskCount, workload: 'Synthetic canonical tasks via host task API, no run/report/model output', initial: publicSample(initial), warmupRequests: 6,
        unchanged: { unconditional: { summary: summarize(arms.unconditional), raw: arms.unconditional }, conditional: { summary: summarize(arms.conditional), raw: arms.conditional } },
        mutation: { equalFacts: true, baseline: publicSample(changedBaseline), conditional: publicSample(changedConditional) }, errorChecks: checks });
    }
    return { schema: 'agent-meeting/work-watch-benchmark@1', createdAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch }, sourceHashes: Object.fromEntries(['src/server.js', 'src/work.js', 'src/remote.js', 'src/ui/workspace.js', 'tools/benchmark-work-watch.js'].map(p => [p, sha(fs.readFileSync(path.join(root, p)))])), elapsedMs: performance.now() - started,
      protocol: { samplesPerArmPerWorkload: samples, order: 'alternating AB/BA per sample, sequential, loopback HTTP keep-alive', timeoutMs: 5000, retries: 0, acceptance: 'Same current facts on mutation, unchanged body hash stable, 304 empty, local/host/method failures preserved' }, cases,
      limits: ['HTTP transport only, not a model A/B or native direct CLI measurement. Strong native direct model attempt failed authentication; see model-ledger.json.', 'Unconditional full read is the prior web policy when explicitly refreshed; this benchmark scripts equal request counts, not human refresh behavior.', 'Auto monitoring adds idle requests compared with a user who does not refresh. A direct CLI can stream its own result without these polling requests.', 'Body bytes and reconstructed response header bytes are separate; request base headers, TCP/IP framing and browser rendering are excluded. Conditional header overhead is included separately.', 'No human active time, tokens, billing, semantic quality or 8-hour runtime measured; modelCalls=0 does not make development free.', 'Latency samples cover short local requests only. No P95, statistical significance or remote latency claim.'] };
  } finally { agent.destroy(); await app?.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}
if (require.main === module) {
  const args = process.argv.slice(2), count = Number(args[0] || 30), output = args[1];
  benchmark(count).then(report => { const json = JSON.stringify(report, null, 2) + '\n'; if (output) fs.writeFileSync(output, json); else process.stdout.write(json); }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { benchmark };
