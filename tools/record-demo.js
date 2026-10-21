#!/usr/bin/env node
'use strict';
// Reproducible showcase on a disposable local server; no AI/model calls.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tools/record-demo.js /tmp/am-demo [--vi]
// Optional BROWSER_BIN selects an already-installed Chromium browser. Nothing is installed.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createApp } = require('../src/server');
const out = path.resolve(process.argv[2] || '/tmp/agent-meeting-demo');
const vi = process.argv.includes('--vi'), lang = vi ? 'vi' : 'en';
const text = (en, vn) => vi ? vn : en;
fs.mkdirSync(out, { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-meeting-showcase-'));
const app = createApp({ admit: 'none', configDir: path.join(temp, 'config'), workDir: path.join(temp, 'work') });
const room = app.create({ hostKey: 'showcase_host_disposable', id: 'showcase_invite_disposable', followUp: true });
const names = ['Minh · Workflow', 'Lan · Quality', 'Sam · Tooling'];
const keys = new Map(), frames = [], errors = [];
let browser;
(async () => {
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const post = async (url, data, token) => {
    const response = await fetch(base + url, { method: 'POST', headers: { ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: new URLSearchParams(data) });
    assert.ok(response.ok, 'HTTP ' + response.status + ' ' + url); return response.text();
  };
  const agent = (i, tool, data = {}) => post('/a/' + room.id + '/' + tool, { name: names[i], ...data }, keys.get(i));
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_BIN || '/opt/brave.com/brave/brave' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/m/' + room.hostKey + '?lang=' + lang);
  await page.locator('#ctx').waitFor();
  async function shot(tag, title, duration = 3000) {
    await page.locator('#toasts > *').waitFor({ state: 'hidden' });
    await page.mouse.move(1270, 790);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, String(frames.length).padStart(3, '0') + '_' + tag + '.png') });
    frames.push({ tag, title, duration });
  }
  await page.locator('#ctx').fill(text(
    'How can we help annotators review keypoint tracking faster without trusting interpolation blindly?\n\nStart with confirmed frames 1 and 10. Compare interpolation, independent prelabels and human corrections. Debate when to inspect frame 5, when to extend to 15, and what should stop that extension.\n\nAgree on a pilot workflow and three validation tasks. Treat confidence as a clue, not proof. This is a scripted product demo, not a validated CVAT algorithm.',
    'Giúp annotator kiểm tracking keypoint nhanh hơn mà không tin nội suy một cách máy móc?\n\nBắt đầu với mốc 1 và 10 đã được người xác nhận. So sánh nội suy, prelabel độc lập và điểm người sửa. Bàn khi nào kiểm frame 5, khi nào mở đến 15, và điều gì phải chặn bước tăng.\n\nChốt flow pilot và ba việc kiểm chứng. Confidence chỉ là gợi ý. Đây là demo kịch bản, chưa phải thuật toán CVAT đã kiểm nghiệm.'));
  await page.locator('#followUp').evaluate(e => e.closest('details').open = true);
  await page.locator('#followUp').check();
  await page.locator('#followUp').evaluate(e => e.closest('details').open = false);
  await shot('brief', text('01 · Give the team a decision to make', '01 · Giao một quyết định cần chốt'), 3000);
  await page.locator('#btnNextStep').click();
  for (let i = 0; i < names.length; i++) {
    const reply = await agent(i, 'join', { model: text('Scripted demo', 'Demo kịch bản') });
    const match = reply.match(/Bearer ([\w-]+)/); assert.ok(match, 'Join must return an agent key'); keys.set(i, match[1]);
  }
  await page.waitForFunction(() => !document.querySelector('#btnStart').disabled);
  await shot('invite', text('02 · Three perspectives, one room', '02 · Ba góc nhìn, một phòng họp'), 2500);
  await page.locator('#btnStart').click();
  await page.locator('#room:not([hidden])').waitFor();
  const lines = [
    [0, text('I would start with **frames 1 → 10**. Confirm both anchors, then review frames 2–9. Only extend to 15 once this first segment passes human review.', 'Bắt đầu từ **frame 1 → 10**. Xác nhận hai mốc rồi rà frame 2–9. Chỉ mở tới 15 sau khi đoạn đầu đã được người kiểm.')],
    [1, text('A confidence of **0.98 at frame 10** says little about frame 5. A turn or occlusion can hide in the middle. Compare three separate tracks: interpolation, prelabel and the human-confirmed point.', '**Confidence 0,98 ở frame 10** chưa nói lên chất lượng frame 5. Đổi hướng hay che khuất có thể nằm giữa đoạn. Phải lưu riêng nội suy, prelabel và điểm người xác nhận.')],
    [2, text('Then show a review queue with the image first, suggestions second. Flag disagreement near **frame 5** and preserve the point source and track ID. Do not silently replace a human correction.', 'Vậy hàng chờ review hiện ảnh trước, gợi ý sau. Đánh dấu sai khác gần **frame 5**, giữ nguồn điểm và track ID. Không âm thầm ghi đè điểm người sửa.')],
    [0, text('If frame 5 is wrong, the annotator adds an anchor there and rechecks **1 → 5** and **5 → 10**. If 1 → 10 passes, try 10 → 15 and inspect 11–14. An identity switch stops the extension.', 'Nếu frame 5 sai, người kiểm thêm mốc tại đó và rà lại **1 → 5**, **5 → 10**. Nếu đoạn đầu đạt, thử 10 → 15 và rà 11–14. Lệch ID phải chặn tăng bước.')],
    [2, text('Keep review actions reversible: accept a suggestion, correct a point, or flag the segment. Record the prelabel version and interpolation source so we can reproduce each comparison.', 'Giữ thao tác review có thể hoàn tác: nhận gợi ý, sửa điểm hoặc đánh dấu đoạn cần kiểm. Lưu phiên bản prelabel và nguồn nội suy để dựng lại từng phép so sánh.')],
    [1, text('We should verify these interactions in CVAT before building the tool. Disagreement can help prioritize a frame; agreement by itself does not establish that the label is correct.', 'Cần xác minh thao tác này trên CVAT trước khi xây tool. Sai khác có thể giúp ưu tiên frame; hai cách đồng ý với nhau chưa chứng minh nhãn đúng.')],
    [1, text('Agreed for the pilot. Before reviewing fewer frames, measure missed errors and review time against a full-review baseline. Keep a blind random sample; we have **no validated threshold yet**.', 'Đồng ý cho pilot. Trước khi giảm số frame cần xem, đo lỗi bỏ sót và thời gian so với rà toàn bộ. Giữ mẫu ngẫu nhiên độc lập; hiện **chưa có ngưỡng đã kiểm nghiệm**.')],
  ];
  for (let n = 0; n < lines.length; n++) {
    const [i, line] = lines[n]; await agent(i, 'say', { text: line });
    await page.waitForFunction(line => document.querySelector('#feedIn').textContent.includes(line.replace(/\*\*/g, '')), line);
    await page.waitForFunction(count => document.querySelectorAll('.msg').length >= count, n + 1);
    await page.waitForTimeout(250);
    if (n === 1 || n === lines.length - 1) await shot(n === 1 ? 'challenge' : 'debate', text(n === 1 ? '03 · Challenge the assumption' : '04 · Refine the approach together', n === 1 ? '03 · Phản biện giả định' : '04 · Cùng hoàn thiện phương án'), 4000);
  }
  await page.locator('#hostMsg').fill(text('Please conclude with the pilot decision, its limits, and three tasks. No work has been implemented or verified.', 'Chốt quyết định pilot, giới hạn và ba việc tiếp theo. Chưa triển khai hoặc kiểm chứng công việc nào.'));
  await page.locator('#btnSend').click();
  const conclusion = text(
    'KẾT LUẬN: Pilot with confirmed anchors 1 and 10; review every intermediate frame. Correct frame 5 and split the segment when needed. Extend to 15 only after human review. Keep interpolation, prelabels and corrections separate. No threshold is validated yet.\nVIỆC: Minh · Workflow | Map the annotator review flow and anchor corrections for frames 1 → 10 → 15 | Before pilot\nVIỆC: Lan · Quality | Prepare reference clips for turns, occlusion and identity switches; define independent review | Before pilot\nVIỆC: Sam · Tooling | Prototype a comparison queue that preserves point source, track ID and human edits | After flow review',
    'KẾT LUẬN: Pilot với mốc 1 và 10 đã xác nhận; rà đủ frame ở giữa. Sửa tại 5 và chia nhỏ đoạn khi cần. Chỉ mở tới 15 sau khi người kiểm duyệt. Giữ riêng nội suy, prelabel và điểm người sửa. Chưa có ngưỡng được kiểm nghiệm.\nVIỆC: Minh · Workflow | Mô tả luồng annotator review và sửa mốc cho frame 1 → 10 → 15 | Trước pilot\nVIỆC: Lan · Quality | Chuẩn bị clip tham chiếu đổi hướng, che khuất, lệch ID và quy tắc review độc lập | Trước pilot\nVIỆC: Sam · Tooling | Phác thảo hàng chờ so sánh giữ nguồn điểm, track ID và chỉnh sửa của người kiểm | Sau review flow');
  await agent(0, 'say', { text: conclusion });
  await page.waitForFunction(() => document.querySelectorAll('#feedIn .msg').length >= 9);
  await shot('decision', text('05 · A decision with owners and next steps', '05 · Quyết định có người phụ trách và việc tiếp theo'), 4000);
  await page.locator('#sessionNav a[href="#plan"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.ws-task').length === 3);
  await shot('plan', text('06 · The conversation becomes a plan', '06 · Hội thoại trở thành kế hoạch'), 4000);
  const firstTask = await page.locator('.ws-task').first().getAttribute('data-task-id');
  await page.locator('.ws-task-source > a').first().click();
  await page.locator('#room:not([hidden])').waitFor();
  assert.ok(page.url().includes('#message-'));
  await shot('source', text('07 · Every task leads back to its source', '07 · Mỗi việc dẫn về đúng nguồn hội thoại'), 3000);
  await page.locator('#btnOptions').click(); await page.locator('#btnStop').click(); await page.locator('#modalYes').click();
  await page.waitForFunction(() => !document.querySelector('#ended').hidden);
  assert.equal(room.state, 'WORK');
  await shot('followup', text('08 · Follow-up stays in the same room', '08 · Theo dõi tiếp trong cùng phòng'), 3000);
  await agent(1, 'progress', { task: '2', status: 'blocked', note: text('Demo only: waiting for independently labeled reference clips. No validation result is claimed.', 'Minh họa: đang chờ clip tham chiếu gán nhãn độc lập. Chưa có kết quả kiểm chứng.') });
  await page.locator('#sessionNav a[href="#plan"]').click(); await page.locator('.ws-task').first().waitFor();
  const card = page.locator('[data-task-id="' + firstTask + '"]');
  await card.locator('.ws-task-source details summary').click();
  await shot('provenance', text('09 · Keep context and progress honest', '09 · Giữ bối cảnh và trạng thái minh bạch'), 3500);
  // End explicitly without pretending the three research tasks have been completed.
  await page.locator('#sessionNav a[href="#conversation"]').click();
  await page.locator('#btnOptions').click(); await page.locator('#btnStop').click(); await page.locator('#modalYes').click();
  await page.waitForFunction(() => document.querySelector('#status').classList.contains('ended'));
  assert.equal(room.state, 'ENDED');
  await shot('ended', text('10 · Keep the record; carry unfinished work forward', '10 · Giữ biên bản, mang việc dở sang cuộc sau'), 3000);
  const checks = [];
  for (const locale of ['en', 'vi']) for (const theme of ['light', 'dark']) for (const width of [375, 768, 1280]) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 608 });
    await page.goto(base + '/m/' + room.hostKey + '?lang=' + locale + '#conversation');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#status').classList.contains('ended'));
    const measure = await page.evaluate(() => ({ feed: document.querySelector('#feed').getBoundingClientRect().height, footer: document.querySelector('#ended').getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > innerWidth }));
    assert.ok(measure.feed > 250, JSON.stringify(measure)); assert.equal(measure.overflow, false);
    await page.locator('#ended summary').click();
    await page.locator('#ended a[download]').waitFor();
    const expanded = await page.locator('#feed').evaluate(e => e.getBoundingClientRect().height); assert.ok(expanded > 200);
    checks.push({ locale, theme, width, height: 608, ...measure, expandedFeed: expanded });
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ language: lang, viewport: '1280×800', disclosure: 'Scripted agents over real HTTP APIs; no AI calls, completed tasks, managed runs or verified results fabricated.', frames, checks, consoleErrors: errors }, null, 2) + '\n');
  console.log(out, frames.length + ' frames', checks.length + ' responsive checks');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); app.close(); fs.rmSync(temp, { recursive: true, force: true }); });
