// Chụp 3 ảnh bước chuẩn bị (setup, brief-json, invite; PNG 2x) bằng Firefox BiDi: node tools/shot-setup.js <thư mục ra> [en|vi] [close]
// Cần server dev :3100 như tools/record-demo.js; BIDI_PORT=… nếu Firefox không ở 9223. Ra JPEG 1280px: xem docs/HANDOFF.md.
const fs = require('fs'), path = require('path');
const [out, lang = 'en', close = ''] = process.argv.slice(2);
const ORIGIN = 'http://localhost:3100', HK = 'devhost0123456789abcdef', AK = 'devagent0123456789abcdef';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const EN = {
  context: "Node repo at /home/dev/calc: sub() in calc.js returns a + b (wrong) and there is no mul() yet.\nSplit the work: one of you fixes sub(), the other adds mul() with tests in test.js. Each of you commits separately and runs node test.js.\nThe second agent also reviews the other's commit (edge cases: negatives, zero, decimals).\nConclude with KẾT LUẬN and VIỆC lines naming the agent responsible. When done, report progress with the commit hash and the node test.js output.",
  agenda: ['Split the work: who fixes sub(), who adds mul() with tests', 'Agree on separate commits and review criteria', 'Conclude and set deadlines'],
  roles: ['fix sub() and cover it with tests', 'add mul() with tests, strict reviewer'],
};
const VI = {
  context: 'Repo Node ở /home/dev/calc: sub() trong calc.js trả về a + b (sai) và chưa có mul().\nChia việc: một bạn sửa sub(), bạn kia thêm mul() kèm test trong test.js. Mỗi bạn commit riêng và chạy node test.js.\nAgent thứ hai review luôn commit của bạn kia (trường hợp biên: số âm, số 0, số thập phân).\nChốt bằng KẾT LUẬN và các dòng VIỆC ghi đúng tên agent phụ trách. Làm xong thì báo tiến độ kèm mã commit và kết quả node test.js.',
  agenda: ['Chia việc: ai sửa sub(), ai thêm mul() kèm test', 'Thống nhất commit riêng và tiêu chí review', 'Chốt và đặt hạn'],
  roles: ['sửa sub() và viết test cho nó', 'thêm mul() kèm test, review khắt khe'],
};
const B = lang === 'en' ? EN : VI;
const brief = { schema: 'agent-meeting/brief@1', context: B.context, endCondition: '',
  settings: { agenda: B.agenda, followUp: true, mode: 'free', maxMsgs: 40, timeLimitMin: 20, idleSec: 40 }, roles: B.roles };
const ws = new WebSocket('ws://127.0.0.1:' + (process.env.BIDI_PORT || 9223) + '/session');
let id = 0; const pend = {};
const cmd = (method, params) => new Promise((res, rej) => { const i = ++id; pend[i] = { res, rej }; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { m.type === 'error' ? pend[m.id].rej(new Error(m.error + ': ' + m.message)) : pend[m.id].res(m.result); } };
let ctx;
const js = (expression) => cmd('script.evaluate', { target: { context: ctx }, expression, awaitPromise: true });
const go = async (hash) => { await cmd('browsingContext.navigate', { context: ctx, url: `${ORIGIN}/m/${HK}${hash}`, wait: 'complete' }); await sleep(2200); };
const shot = async (name) => { const { data } = await cmd('browsingContext.captureScreenshot', { context: ctx }); fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(data, 'base64')); console.log('shot', name); };
ws.onopen = async () => {
  try {
    fs.mkdirSync(out, { recursive: true });
    await fetch(`${ORIGIN}/api/host/${HK}/new`, { method: 'POST', body: '{}' });
    await cmd('session.new', { capabilities: {} });
    ctx = (await cmd('browsingContext.create', { type: 'tab' })).context;
    await cmd('browsingContext.setViewport', { context: ctx, viewport: { width: 1280, height: 860 }, devicePixelRatio: 2 });
    await go('');
    const set = async (tab) => { await cmd('browsingContext.navigate', { context: ctx, url: `${ORIGIN}/favicon.svg`, wait: 'complete' }); await js(`localStorage.clear(); localStorage.setItem('agent-meeting:lang', ${JSON.stringify(lang)}); localStorage.setItem('agent-meeting:briefTab', '${tab}'); localStorage.setItem('agent-meeting:${HK}:brief', ${JSON.stringify(JSON.stringify(brief))})`); };
    await set('form'); await go('#boi-canh');
    await shot('setup');
    for (const [name, model] of [['Sky', 'Haiku 4.5'], ['Lucas', 'Sonnet 5.5']])
      await fetch(`${ORIGIN}/a/${AK}/join?` + new URLSearchParams({ name, model }), { method: 'POST' });
    await set('json'); await go('#boi-canh');
    await shot('brief-json');
    await set('form'); await go('#moi-agent');
    await shot('invite');
    if (close) await cmd('browser.close', {}); else { await cmd('browsingContext.close', { context: ctx }); await cmd('session.end', {}); }
  } catch (e) { console.error(e); }
  process.exit(0);
};
