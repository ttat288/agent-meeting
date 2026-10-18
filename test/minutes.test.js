'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { Meeting } = require('../src/meeting');
const minutes = require('../src/minutes');
const { createApp } = require('../src/server');

function sample() {
  const m = new Meeting({ waitMs: 300, idleMs: 60000, tick: 30 });
  m.join('Lan', 'Opus 5.5'); m.join('Minh', 'GPT-5');
  m.setRole('Minh', 'phản biện');
  m.start('Chọn DB cho app\nchi tiết thêm', '', { agenda: ['Chọn DB', 'Chọn auth'] });
  m.say('Lan', 'Postgres hợp hơn.');
  m.say('Minh', 'XONG MỤC 1: dùng Postgres');
  m.hostSay('riêng cho Lan', 'Lan');
  m.say('Lan', 'KẾT LUẬN: Postgres + OAuth.\nVIỆC: Lan | Dựng DB | thứ 6');
  m.stop();
  return m;
}

test('JSON biên bản: đủ phần, không chứa mã bí mật', () => {
  const m = sample(), j = minutes.toJSON(m), raw = JSON.stringify(j);
  assert.equal(j.schema, 'agent-meeting/minutes@1');
  assert.deepEqual(j.agenda.map(a => [a.title, a.done, a.summary]), [['Chọn DB', true, 'dùng Postgres'], ['Chọn auth', false, null]]);
  assert.deepEqual(j.decisions.map(d => [d.item, d.text]), [[1, 'dùng Postgres'], [2, 'Postgres + OAuth.']]);
  assert.deepEqual(j.actions, [{ owner: 'Lan', task: 'Dựng DB', due: 'thứ 6', proposedBy: 'Lan', item: 2 }]);
  assert.equal(j.members.find(a => a.name === 'Minh').role, 'phản biện');
  assert.ok(!raw.includes(m.hostKey) && !raw.includes(m.id));
});

test('Quyết định không dính các dòng VIỆC (kể cả định dạng Markdown, XONG MỤC)', () => {
  const m = new Meeting({ waitMs: 300, idleMs: 60000, tick: 30 });
  m.join('Lan', 'Opus 5.5');
  m.start('x', '', { agenda: ['A', 'B'] });
  m.say('Lan', 'XONG MỤC 1: chọn A\n- VIỆC: Lan | Viết đặc tả | thứ 2');
  m.say('Lan', '**KẾT LUẬN:** Làm B trước.\n\n**VIỆC:** Minh | Dựng CI | 20/10\nLý do: rẻ hơn.');
  m.say('Lan', 'KẾT LUẬN:\nVIỆC: Lan | Gửi báo cáo | mai');
  const j = minutes.toJSON(m);
  assert.deepEqual(j.decisions.map(d => d.text), ['chọn A', 'Làm B trước.\n\nLý do: rẻ hơn.']);
  assert.deepEqual(j.actions.map(a => a.task), ['Viết đặc tả', 'Dựng CI', 'Gửi báo cáo']);
  assert.deepEqual(m.log.find(x => x.itemsDone).itemsDone, [{ item: 0, summary: 'chọn A' }]);
  assert.ok(!minutes.toMarkdown(m).split('## Việc cần làm')[0].includes('VIỆC:'));
});

test('agent gửi lại KẾT LUẬN nhiều lần: mỗi mục chỉ giữ bản mới nhất', () => {
  const m = new Meeting({ waitMs: 300, idleMs: 60000, tick: 30 });
  m.join('S', 'x'); m.join('H', 'x');
  m.start('x', '', { agenda: ['A'] });
  m.say('S', 'KẾT LUẬN: bản nháp mục 1');
  m.say('S', 'XONG MỤC 1: chọn A\nKẾT LUẬN: tổng hợp lần 1');
  m.say('S', 'KẾT LUẬN: tổng hợp lần 2');
  m.say('H', 'KẾT LUẬN: tổng hợp của H');
  assert.deepEqual(minutes.toJSON(m).decisions.map(d => [d.item, d.text, d.by]),
    [[1, 'bản nháp mục 1', 'S'], [1, 'chọn A', 'S'], [null, 'tổng hợp của H', 'H']]);
});

test('Markdown biên bản và tóm tắt webhook', () => {
  const m = sample(), md = minutes.toMarkdown(m), sum = minutes.toSummary(m);
  for (const h of ['## Thành viên', '## Chương trình họp', '## Quyết định', '## Việc cần làm', '## Diễn biến']) assert.ok(md.includes(h), h);
  assert.match(md, /1\. ✅ Chọn DB — dùng Postgres/);
  assert.match(md, /\| 1 \| Dựng DB \| Lan \| thứ 6 \| Lan \|/);
  assert.match(md, /Chủ trì → Lan \(riêng\)/);
  assert.match(sum, /^🤝 Cuộc họp agent đã kết thúc: Chọn DB cho app/);
  assert.match(sum, /📋 Việc cần làm:\n• Dựng DB — Lan \(hạn: thứ 6\)/);
  assert.ok(sum.length <= 1900);
});

test('Kết thúc: tự lưu biên bản ra thư mục và gửi webhook đúng định dạng', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'am-'));
  const got = [];
  const hook = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => { got.push(JSON.parse(b)); res.end('ok'); }); });
  await new Promise(r => hook.listen(0, r));
  const logs = [];
  const app = createApp({ minutesDir: dir, webhooks: [`http://127.0.0.1:${hook.address().port}/hook`], log: (x) => logs.push(x) });
  t.after(() => { app.close(); hook.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  await new Promise(r => app.server.listen(0, r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const m = app.create();
  m.join('Lan', 'Opus 5.5'); m.start('Chọn database', '');
  m.say('Lan', 'KẾT LUẬN: Postgres\nVIỆC: Lan | Dựng DB');
  const md = await (await fetch(`${base}/api/host/${m.hostKey}/minutes.md`)).text();
  assert.match(md, /# Biên bản cuộc họp agent/);
  const done = new Promise(r => app.ev.once('ended', r));
  m.stop(); await done;
  const files = fs.readdirSync(dir).sort();
  assert.equal(files.length, 2);
  assert.match(files[0], /^\d{4}-\d\d-\d\d_\d{4}_chon-database\.json$/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, files[0]))).actions[0].task, 'Dựng DB');
  assert.equal(got.length, 1);
  assert.match(got[0].text, /Postgres/);
  assert.equal(got[0].meeting.transcript, undefined); // webhook không gửi toàn văn
  assert.ok(logs.some(l => /Đã lưu biên bản/.test(l)) && logs.some(l => /Đã gửi tóm tắt/.test(l)));
});

test('Webhook: Slack/Google Chat nhận {text}, Discord nhận {content}, dịch vụ khác nhận bản đầy đủ', () => {
  const { webhookBody } = require('../src/server');
  const m = sample();
  assert.deepEqual(Object.keys(webhookBody('https://hooks.slack.com/services/T/B/x', m)), ['text']);
  assert.deepEqual(Object.keys(webhookBody('https://chat.googleapis.com/v1/spaces/x/messages?key=k', m)), ['text']);
  assert.deepEqual(Object.keys(webhookBody('https://discord.com/api/webhooks/1/x', m)), ['content']);
  const generic = webhookBody('https://example.com/hook', m);
  assert.deepEqual(Object.keys(generic).sort(), ['content', 'meeting', 'text']);
  assert.equal(generic.meeting.transcript, undefined);
});
