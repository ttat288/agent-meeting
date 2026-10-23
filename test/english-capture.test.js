'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { Meeting, decisionText } = require('../src/meeting');
const { createApp } = require('../src/server');

test('English and Vietnamese conclusions capture the same decision and owned tasks', () => {
  for (const [conclusion, task] of [['CONCLUSION', 'TASK'], ['KẾT LUẬN', 'VIỆC']]) {
    const room = new Meeting(); room.start('Review tracking', '', { agenda: [] });
    room.hostSay(`- **${conclusion}:** Human review between anchors.\n- **${task}:** Workflow | Map anchor review | Friday\n${task}: Quality | Prepare reference clips | Monday`);
    const message = room.log.find(m => m.conclusion);
    assert.ok(message, conclusion + ' must capture a conclusion');
    assert.equal(message.decision, 'Human review between anchors.');
    assert.deepEqual(room.actions.map(a => [a.owner, a.task, a.due, a.status]), [
      ['Workflow', 'Map anchor review', 'Friday', 'todo'], ['Quality', 'Prepare reference clips', 'Monday', 'todo']
    ]);
    assert(room.actions.every(a => a.sourceMessageIndex === message.i));
  }
});

test('English aliases retain case, sentence boundaries and decision cleanup rules', () => {
  const room = new Meeting(); room.join('Reviewer', 'fixture'); room.start('Review', '', { agenda: [] });
  room.say('Reviewer', 'We need a conclusion: this is ordinary prose about a task: nothing assigned.');
  assert.equal(room.log.find(m => m.type === 'chat').conclusion, undefined);
  assert.equal(room.actions.length, 0);
  room.say('Reviewer', 'Agreed. CONCLUSION: Review every frame.\ntask: Reviewer | Inspect intermediate frames | Friday');
  const conclusion = room.log.filter(m => m.type === 'chat').at(-1);
  assert.equal(conclusion.conclusion, true);
  assert.equal(conclusion.decision, 'Review every frame.');
  assert.equal(room.actions[0].owner, 'Reviewer');
  assert.equal(decisionText('conclusion: Keep anchors.\nTASK: Dev | Fix queue | Today\nVIỆC: QA | Review | Tomorrow'), 'Keep anchors.');
});

test('English capture keeps one linked task and decision through HTTP plan reads and server restart', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-english-capture-'));
  const cfg = { configDir: path.join(root, 'config'), workDir: path.join(root, 'work'), dataDir: path.join(root, 'rooms') };
  let app, base;
  const key = 'host_english_capture_1234';
  t.after(async () => { if (app) await app.close(); fs.rmSync(root, { recursive: true, force: true }); });
  async function boot() {
    app = createApp(cfg); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + app.server.address().port;
  }
  async function request(action, body) {
    const response = await fetch(base + '/api/host/' + key + '/' + action, {
      method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    assert.equal(response.status, 200); return response.json();
  }
  await boot(); app.create({ hostKey: key, id: 'agent_english_capture_1234', fixed: true });
  await request('start', { context: 'Review intermediate frames', agenda: [] });
  await request('say', { text: 'CONCLUSION: Review between anchors.\nTASK: Quality | Prepare reference clips | Friday' });
  const first = await request('work');
  assert.equal(first.tasks.length, 1); assert.equal(first.session.decisions.length, 1);
  const task = first.tasks[0];
  assert.equal(task.origin.messageIndex, first.session.decisions[0].messageIndex);
  assert.equal(task.origin.context, 'Review intermediate frames');
  assert.equal(task.owner, 'Quality');
  assert.equal((await request('work')).tasks[0].id, task.id);
  await app.close(); app = null; await boot(); assert(app.restore(key));
  const restored = await request('work');
  assert.equal(restored.tasks.length, 1); assert.equal(restored.tasks[0].id, task.id);
  assert.equal(restored.tasks[0].requirementRevision, task.requirementRevision);
  assert.equal(restored.tasks[0].origin.messageIndex, task.origin.messageIndex);
  assert.equal(restored.tasks[0].sourceCurrent, true);
  assert.equal(restored.session.decisions[0].text, first.session.decisions[0].text);
});
