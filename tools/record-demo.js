// Quay khung hình GIF demo (tiếng Anh): node tools/record-demo.js <thư mục khung>
// Cần: server dev ở :3100 với --host-key devhost0123456789abcdef --agent-key devagent0123456789abcdef (đã chạy bản UI mới nhất),
// firefox --headless --no-remote -profile ~/snap/firefox/common/am-shot --remote-debugging-port 9223. Ghép: python3 tools/make-gif.py <thư mục khung> docs/demo.gif
// Bản tiếng Việt (docs/demo.vi.gif): bỏ ?lang=en / --en, dịch bản brief và tên nút 'Ask to conclude' → 'Yêu cầu chốt'.
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const ORIGIN = 'http://localhost:3100', HK = 'devhost0123456789abcdef', AK = 'devagent0123456789abcdef';
const H = `${ORIGIN}/api/host/${HK}`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ws = new WebSocket('ws://127.0.0.1:9223/session');
let id = 0; const pend = {};
const cmd = (method, params) => new Promise((res, rej) => { const i = ++id; pend[i] = { res, rej }; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { m.type === 'error' ? pend[m.id].rej(new Error(m.error + ': ' + m.message)) : pend[m.id].res(m.result); } };
const state = async () => (await fetch(`${H}/state?v=-1`)).json();
let ctx, n = 0;
const js = (expression) => cmd('script.evaluate', { target: { context: ctx }, expression, awaitPromise: true });
const shot = async (tag) => {
  const { data } = await cmd('browsingContext.captureScreenshot', { context: ctx });
  const f = path.join(out, `${String(n++).padStart(3, '0')}_${tag}.png`);
  fs.writeFileSync(f, Buffer.from(data, 'base64'));
  console.log('frame', f);
};
ws.onopen = async () => {
  try {
    await fetch(`${H}/new`, { method: 'POST', body: '{}' });
    await cmd('session.new', { capabilities: {} });
    ctx = (await cmd('browsingContext.create', { type: 'tab' })).context;
    await cmd('browsingContext.setViewport', { context: ctx, viewport: { width: 1280, height: 680 }, devicePixelRatio: 1 });
    await cmd('browsingContext.navigate', { context: ctx, url: `${ORIGIN}/m/${HK}?lang=en`, wait: 'complete' });
    await js(`localStorage.clear(); localStorage.setItem('agent-meeting:lang', 'en'); history.replaceState(null, '', location.pathname)`);
    await cmd('browsingContext.reload', { context: ctx, wait: 'complete' });
    await sleep(1500);
    await shot('empty');
    // v3.3: nhờ AI viết bối cảnh → dán JSON vào tab JSON → áp vào form → Tiếp → mời agent → Bắt đầu
    const brief = 'Here is the brief for your meeting:\n\n```json\n' + JSON.stringify({
      schema: 'agent-meeting/brief@1',
      context: 'Pick the API style for our new mobile app: REST or GraphQL. Team of 4, one mobile client.\nAgree on one approach and split the work (each VIỆC line names the agent responsible); after the conclusion, each of you does your own task and reports progress with evidence.',
      endCondition: '',
      settings: { agenda: ['API style', 'Authentication'], followUp: true, mode: 'free', maxMsgs: 60, timeLimitMin: 0, idleSec: 40 },
      roles: ['', "devil's advocate"],
    }, null, 2) + '\n```';
    await shot('ai');
    await js(`document.getElementById('btnToJson').click()`);
    await sleep(300); await shot('json-empty');
    for (const cut of [Math.round(brief.length / 2), brief.length]) {
      await js(`(() => { const t = document.getElementById('jsonText'); t.value = ${JSON.stringify(brief)}.slice(0, ${cut}); t.dispatchEvent(new Event('input')); })()`);
      await sleep(600); await shot('json');
    }
    await shot('json');
    await js(`document.getElementById('jsonApply').click()`);
    await sleep(500);
    await js(`document.getElementById('setup').scrollTop = 0`);
    await sleep(200); await shot('form'); await shot('form');
    await js(`document.getElementById('setup').scrollTop = 600`);
    await sleep(300); await shot('form'); await shot('form');
    await js(`document.getElementById('btnNextStep').click()`);
    await sleep(800); await shot('invite');
    const bots = spawn('node', ['scripts/demo-bots.js', `${ORIGIN}/a/${AK}`, '--en'], { cwd: path.join(__dirname, '..') });
    let debated = false;
    bots.stdout.on('data', d => { process.stdout.write('[bots] ' + d); if (/tranh luận xong/.test(d)) debated = true; });
    for (let i = 0; i < 30 && (await state()).agents.length < 3; i++) { await sleep(900); await shot('lobby'); }
    await sleep(1200);
    await shot('ready'); await shot('ready');
    await js(`document.getElementById('btnStart').click()`);
    await sleep(1500);
    let asked = false, endedAt = 0, scrolled = false;
    for (let k = 0; k < 200; k++) {
      const s = await state();
      if (debated && !asked) {
        asked = true;
        await shot('before-ask');
        await js(`[...document.querySelectorAll('#quick .chip')].find(b => b.textContent === 'Ask to conclude').click()`);
        await sleep(600);
      }
      if (s.files.length && !scrolled) { // đưa mục Tệp vào khung nhìn
        scrolled = true;
        await js(`(() => { const sd = document.getElementById('side'); sd.scrollTop = document.getElementById('filesSec').offsetTop - 330; })()`);
        await sleep(300);
      }
      await shot(s.state.toLowerCase());
      if (s.state === 'ENDED') { if (!endedAt) endedAt = Date.now(); else if (Date.now() - endedAt > 2500) break; }
      await sleep(1700);
    }
    bots.kill();
    await cmd('browsingContext.close', { context: ctx });
    await cmd('session.end', {});
  } catch (e) { console.error(e); }
  ws.close(); process.exit(0);
};
ws.onerror = (e) => { console.error('ws error', e.message || e); process.exit(1); };
