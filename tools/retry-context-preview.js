'use strict';
// Disposable CSV recovery fixture. Never invokes model CLIs or user settings.
// AM_RETRY_ROOT=/tmp/... AM_RETRY_PORT=3181 node tools/retry-context-preview.js
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const fixture = require('../test/fixtures/csv-retry');
const appRoot = process.env.AM_RETRY_APP_ROOT || path.join(__dirname, '..');
const { createApp } = require(path.join(appRoot, 'src/server'));
const root = process.env.AM_RETRY_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'am-csv-preview-'));
const source = path.join(root, 'source'), prompts = [];
if (!fs.existsSync(source)) fixture.seed(source);
const hostKey = 'host_csv_retry_preview_1234';
const app = createApp({ configDir: root + '/config', workDir: root + '/work', dataDir: root + '/rooms', runCli: fixture.participant(prompts) });
if (app.configStore.read().revision === 1) fixture.enable(app.configStore);
const restored = app.restore(hostKey);
if (!restored) app.create({ hostKey, id: 'agent_csv_retry_preview_1234', fixed: true });
app.server.listen(Number(process.env.AM_RETRY_PORT || 3181), '127.0.0.1', async () => {
  const origin = 'http://127.0.0.1:' + app.server.address().port, base = origin + '/api/host/' + hostKey + '/';
  const post = async (endpoint, body) => {
    const response = await fetch(base + endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw Error(await response.text()); return response.json();
  };
  try {
    if (!restored) {
      await post('start', { context: fixture.goal, agenda: [] });
      await post('say', { text: 'CONCLUSION: Export CSV cells without corrupting quotes or line breaks.\nTASK: Dev | Fix CSV cell escaping | today' });
      const work = await (await fetch(base + 'work')).json(), task = work.tasks[0];
      await post('work/tasks/' + task.id + '/configure', { expectedRevision: task.requirementRevision, purpose: 'execute', management: 'managed', acceptance: fixture.acceptance, workspace: source, writePaths: ['csv-cell.js'], testFiles: ['test/csv-cell.test.js'] });
    }
    if (!restored) await post('runtime/probe', { profileId: 'opus-claude' });
    console.log(JSON.stringify({ url: origin + '/m/' + hostKey + '?lang=en#execute', root, source, appRoot, fixture: true, modelCalls: 0 }));
  } catch (error) { console.error(error); await app.close(); process.exitCode = 1; }
});
let closing = false;
async function close() { if (closing) return; closing = true; await app.close(); process.exit(0); }
process.on('SIGTERM', close); process.on('SIGINT', close);
