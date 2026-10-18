// Chụp ảnh tài liệu bằng Firefox headless (WebDriver BiDi, cổng 9223): node tools/shot.js <url> <ra.png> [rộng cao dpr chờMs dark js]
// js (tuỳ chọn) chạy sau khi tải trang, ví dụ đặt localStorage bản nháp / ngôn ngữ rồi chụp lần hai.
const [url, out, w = 1280, h = 860, dpr = 2, waitMs = 2500, dark = '', js = ''] = process.argv.slice(2);
const fs = require('fs');
const ws = new WebSocket('ws://127.0.0.1:9223/session');
let id = 0; const pend = {};
const cmd = (method, params) => new Promise((res, rej) => { const i = ++id; pend[i] = { res, rej }; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { m.type === 'error' ? pend[m.id].rej(new Error(m.error + ': ' + m.message)) : pend[m.id].res(m.result); } };
ws.onopen = async () => {
  try {
    await cmd('session.new', { capabilities: {} });
    const { context } = await cmd('browsingContext.create', { type: 'tab' });
    await cmd('browsingContext.setViewport', { context, viewport: { width: +w, height: +h }, devicePixelRatio: +dpr });
    await cmd('browsingContext.navigate', { context, url, wait: 'complete' });
    if (dark) await cmd('script.evaluate', { target: { context }, expression: `document.documentElement.dataset.theme='dark'`, awaitPromise: false });
    await new Promise(r => setTimeout(r, +waitMs));
    if (js) { await cmd('script.evaluate', { target: { context }, expression: js, awaitPromise: false }); await new Promise(r => setTimeout(r, 800)); }
    const { data } = await cmd('browsingContext.captureScreenshot', { context });
    fs.writeFileSync(out, Buffer.from(data, 'base64'));
    await cmd('browsingContext.close', { context });
    await cmd('session.end', {});
    console.log('saved', out);
  } catch (e) { console.error(e.message); }
  ws.close(); process.exit(0);
};
ws.onerror = (e) => { console.error('ws error', e.message || e); process.exit(1); };
