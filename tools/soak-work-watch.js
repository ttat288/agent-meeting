#!/usr/bin/env node
'use strict';
// Bounded synthetic HTTP reliability soak. Never invokes a model or reads user stores.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');
const minutes = Number(process.argv[2] || 10), output = path.resolve(process.argv[3] || '/tmp/am-work-soak.json');
assert(Number.isInteger(minutes) && minutes >= 1 && minutes <= 120, 'Duration must be 1–120 minutes');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-work-soak-'));
const cfg = { configDir: dir + '/config', workDir: dir + '/work', dataDir: dir + '/rooms', tick: 60000, idleMs: 600000 };
const hostKey = 'soak_host_123456789012', agentId = 'soak_agent_123456789012';
const report = { schema: 'agent-meeting/work-watch-soak@1', startedAt: new Date().toISOString(), status: 'running', requestedMinutes: minutes,
  sourceHashes: Object.fromEntries(['src/server.js','src/work.js','src/meeting.js','src/remote.js','tools/soak-work-watch.js'].map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '..', p))).digest('hex')])),
  node: process.version, protocol: { clients: ['unconditional','conditional-A','conditional-B'], cadenceMs: 3000, syntheticTasks: 100, decisionEveryRounds: 10, restartAtHalfDuration: true, timeoutMs: 5000, retriesPerRequest: 0 }, requests: [], resources: [], restarts: [], errors: [], modelCalls: 0,
  limits: ['Synthetic local HTTP/watch reliability only; no model, browser, human-effort, token or billing measurement.', 'Requests and memory/resource samples are observed at this cadence; gaps are not continuous coverage.', 'Memory includes bounded raw sample collection and growing synthetic decision history; no general no-leak claim.', 'This duration is not model runtime duration or proof of context retention. Source hashes pin this process even if the working checkout changes.'] };
let app, room, origin, wake, stopped = false, interrupted = false;
const started = performance.now(), cpuStart = process.cpuUsage();
function write(final = false) {
  report.elapsedMs = performance.now() - started;
  const file = final ? output : output + '.partial';
  fs.writeFileSync(file + '.tmp', JSON.stringify(report, null, 2) + '\n', { mode: 0o600 }); fs.renameSync(file + '.tmp', file);
}
async function open(restoring = false) {
  app = createApp(cfg); room = restoring ? app.restore(hostKey) : app.create({ hostKey, id: agentId, fixed: true });
  assert(room, 'Room must survive restart');
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + app.server.address().port;
}
async function get(client, etag) {
  const at = performance.now(), response = await fetch(origin + '/api/host/' + hostKey + '/work', { headers: etag ? { 'if-none-match': etag } : {}, signal: AbortSignal.timeout(5000) });
  const body = await response.text();
  assert([200,304].includes(response.status));
  if (response.status === 304) assert.equal(body, '');
  else {
    const data = JSON.parse(body); assert.equal(data.tasks.length, 100); assert.equal(data.runs.length, 0);
    assert.deepEqual(data.tasks.map(t => t.id).sort(), report.taskIds);
  }
  const next = response.headers.get('etag'); assert(next);
  report.requests.push({ client, atMs: at - started, elapsedMs: performance.now() - at, status: response.status, bodyBytes: Buffer.byteLength(body) });
  return next;
}
async function main() {
  await open(); room.start('Synthetic reliability soak: keep task identity and never dispatch work.', '', { agenda: [], timeLimitMin: 0 });
  for (let i = 0; i < 100; i++) {
    const response = await fetch(origin + '/api/host/' + hostKey + '/work/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goal: 'Synthetic task ' + i, acceptance: ['No run is dispatched during monitoring'] }), signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 201); await response.text();
  }
  report.taskIds = (await (await fetch(origin + '/api/host/' + hostKey + '/work', { signal: AbortSignal.timeout(5000) })).json()).tasks.map(t => t.id).sort();
  const tags = { 'conditional-A': null, 'conditional-B': null };
  let round = 0, restarted = false;
  while (!stopped && performance.now() - started < minutes * 60000) {
    const roundStart = performance.now();
    if (round && round % 10 === 0) room.hostSay('KẾT LUẬN: Synthetic decision checkpoint ' + round + '; preserve canonical identity.');
    if (!restarted && performance.now() - started >= minutes * 30000) {
      const at = performance.now(); app.flush(); await app.close(); await open(true); restarted = true;
      report.restarts.push({ atMs: at - started, elapsedMs: performance.now() - at });
    }
    for (const client of round % 2 ? ['conditional-B','conditional-A','unconditional'] : ['unconditional','conditional-A','conditional-B']) {
      const tag = await get(client, tags[client]); if (client !== 'unconditional') tags[client] = tag;
    }
    if (round % 20 === 0) {
      report.resources.push({ atMs: performance.now() - started, ...process.memoryUsage(), cpu: process.cpuUsage(cpuStart) });
      write();
    }
    round++;
    const remaining = Math.min(3000 - (performance.now() - roundStart), minutes * 60000 - (performance.now() - started));
    if (remaining > 0) await new Promise(resolve => { const timer = setTimeout(() => { wake = null; resolve(); }, remaining); wake = () => { clearTimeout(timer); wake = null; resolve(); }; });
  }
  report.status = interrupted ? 'interrupted' : 'completed';
}
process.on('SIGTERM', () => { interrupted = true; stopped = true; wake?.(); });
process.on('SIGINT', () => { interrupted = true; stopped = true; wake?.(); });
main().catch(error => { report.status = 'failed'; report.errors.push(error.message); process.exitCode = 1; }).finally(async () => { await app?.close(); write(true); fs.rmSync(dir, { recursive: true, force: true }); console.log(JSON.stringify({ status: report.status, elapsedMs: report.elapsedMs, requests: report.requests.length, output })); });
