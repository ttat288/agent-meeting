// Ảnh mobile tối (VI, 375×812 @2x) giữa cuộc họp có 3 bot demo: BIDI_PORT=<cổng> node tools/shot-mobile.js <ra.png>
// Firefox phải chạy với profile ép tối: user.js có user_pref("layout.css.prefers-color-scheme.content-override", 0);
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const out = process.argv[2];
const ORIGIN = 'http://localhost:3100', HK = 'devhost0123456789abcdef', AK = 'devagent0123456789abcdef', H = `${ORIGIN}/api/host/${HK}`;
const REPO = path.join(__dirname, '..');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ws = new WebSocket(`ws://127.0.0.1:${process.env.BIDI_PORT || 9223}/session`);
let id = 0; const pend = {};
const cmd = (method, params) => new Promise((res, rej) => { const i = ++id; pend[i] = { res, rej }; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { m.type === 'error' ? pend[m.id].rej(new Error(m.error + ': ' + m.message)) : pend[m.id].res(m.result); } };
const state = async () => (await fetch(`${H}/state?v=-1`)).json();
ws.onopen = async () => {
  let bots;
  try {
    await fetch(`${H}/new`, { method: 'POST', body: '{}' });
    await cmd('session.new', { capabilities: {} });
    const ctx = (await cmd('browsingContext.create', { type: 'tab' })).context;
    await cmd('browsingContext.setViewport', { context: ctx, viewport: { width: 375, height: 812 }, devicePixelRatio: 2 });
    await cmd('browsingContext.navigate', { context: ctx, url: `${ORIGIN}/favicon.svg`, wait: 'complete' });
    await cmd('script.evaluate', { target: { context: ctx }, expression: `localStorage.clear(); localStorage.setItem('agent-meeting:lang', 'vi')`, awaitPromise: false });
    await cmd('browsingContext.navigate', { context: ctx, url: `${ORIGIN}/m/${HK}`, wait: 'complete' });
    bots = spawn('node', ['scripts/demo-bots.js', `${ORIGIN}/a/${AK}`], { cwd: REPO });
    for (let i = 0; i < 40 && (await state()).agents.length < 3; i++) await sleep(500);
    await fetch(`${H}/start`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      context: 'Chọn kiểu API cho app di động mới: REST hay GraphQL. Nhóm 4 người, một client di động.\nThống nhất một cách và chia việc (mỗi dòng VIỆC ghi đúng tên agent phụ trách).',
      settings: { agenda: ['Kiểu API', 'Xác thực'], followUp: true, mode: 'free', maxMsgs: 60 }, roles: ['', 'phản biện'] }) });
    for (let i = 0; i < 60; i++) { const s = await state(); if (s.agendaIndex >= 1) break; await sleep(1000); }
    await sleep(6000);
    await cmd('script.evaluate', { target: { context: ctx }, expression: `document.querySelectorAll('*').forEach(e => e.style.scrollbarWidth = 'none')`, awaitPromise: false });
    await sleep(300);
    const { data } = await cmd('browsingContext.captureScreenshot', { context: ctx });
    fs.writeFileSync(out, Buffer.from(data, 'base64')); console.log('saved', out);
    await cmd('browsingContext.close', { context: ctx });
    await cmd('session.end', {});
  } catch (e) { console.error(e); }
  if (bots) bots.kill();
  process.exit(0);
};
