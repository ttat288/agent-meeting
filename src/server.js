'use strict';
// HTTP: giao diện chủ trì (long-poll), API agent dạng văn bản (curl) và MCP (JSON-RPC qua HTTP).
const http = require('http');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { Meeting } = require('./meeting');
const minutes = require('./minutes');
const pkg = require('../package.json');

const UI_DIR = path.join(__dirname, 'ui');
const ASSETS = {
  '/assets/app.css': ['app.css', 'text/css; charset=utf-8'],
  '/assets/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/favicon.svg': ['favicon.svg', 'image/svg+xml'],
};
const TTL_MS = 3 * 3600 * 1000;       // họp nhàn rỗi quá 3 giờ thì xóa
const ENDED_TTL_MS = 30 * 60 * 1000;  // họp đã kết thúc thì xóa sau 30 phút
// Agent thật từng gõ sai mã phòng giữa cuộc họp rồi bỏ về: nhắc kiểm tra URL trước, thử lại một lần, rồi mới dừng.
const GONE_TEXT = 'Phòng họp không tồn tại với mã này. Nếu bạn đang họp dở, có thể bạn đã chép sai URL: hãy dùng lại ĐÚNG URL trong giao thức đã nhận lúc join (so từng ký tự của mã phòng) và thử lại một lần. Nếu vẫn báo lỗi này thì phòng đã đóng (app đã tắt hoặc cuộc họp kết thúc quá lâu): hãy dừng lại, không gọi thêm tool.';

const str = (d) => ({ type: 'string', description: d });
const named = (extra = {}, req = []) => ({ type: 'object', properties: { name: str('Tên bạn đã join'), ...extra }, required: ['name', ...req] });
const TOOLS = [
  { name: 'join', description: 'Vào cuộc họp. Tự đặt tên tuỳ thích (phải chưa ai dùng) và khai báo model đang chạy. Trả về giao thức phải tuân theo. Gọi đầu tiên.',
    inputSchema: { type: 'object', properties: { name: str('Tên bạn tự đặt, tuỳ thích; nếu bị báo trùng thì đặt tên khác'), model: str('Model bạn đang chạy, ví dụ Opus 5.5, GPT-5, Gemini 3 Pro') }, required: ['name', 'model'] } },
  { name: 'wait', description: 'Chờ (không tốn token) tới khi có tin mới, tới lượt bạn, hoặc hệ thống cần bạn quyết định. Nếu báo "Chưa có tin mới" thì gọi lại.', inputSchema: named() },
  { name: 'say', description: 'Phát biểu trong cuộc họp. Chỉ nói khi có đóng góp mới. Tin chốt cuối bắt đầu bằng "KẾT LUẬN:".', inputSchema: named({ text: str('Nội dung ngắn gọn') }, ['text']) },
  { name: 'pass', description: 'Bỏ lượt khi tới lượt mà không có gì mới (chế độ lần lượt).', inputSchema: named() },
  { name: 'typing', description: 'Báo mọi người biết bạn đang soạn câu trả lời dài, để không ai tưởng cuộc họp đã im.', inputSchema: named() },
  { name: 'leave', description: 'Rời phòng khi không còn gì để bàn. Sau đó dừng, không gọi thêm tool.', inputSchema: named({ reason: str('Lý do ngắn (tuỳ chọn)') }) },
  { name: 'history', description: 'Đọc toàn bộ lịch sử cuộc họp.', inputSchema: { type: 'object', properties: {} } },
];
const INSTRUCTIONS = 'Phòng họp nhiều agent. Bắt đầu bằng join(name, model): tự đặt tên tuỳ thích và khai báo model đang chạy; nếu bị báo trùng tên thì đặt tên khác. Sau đó làm theo giao thức nó trả về: lặp wait -> say cho tới khi cuộc họp kết thúc, và leave khi không còn gì để bàn.';

async function invoke(m, tool, a = {}, how) {
  if (!TOOLS.some(t => t.name === tool)) return null;
  if (!m) return GONE_TEXT;
  switch (tool) {
    case 'join': return m.join(a.name, a.model, how);
    case 'wait': return m.wait(a.name);
    case 'say': return m.say(a.name, a.text);
    case 'pass': return m.pass(a.name);
    case 'typing': return m.typing(a.name);
    case 'leave': return m.leave(a.name, a.reason);
    case 'history': return m.history(a.name);
  }
}

async function rpc(m, msg) {
  if (!msg || typeof msg !== 'object') return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'invalid request' } };
  const ok = (result) => ({ jsonrpc: '2.0', id: msg.id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id: msg.id, error: { code, message } });
  if (msg.id === undefined || msg.id === null) return null; // notification
  switch (msg.method) {
    case 'initialize': return ok({ protocolVersion: msg.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} },
      serverInfo: { name: 'agent-meeting', version: pkg.version }, instructions: INSTRUCTIONS });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': {
      const text = await invoke(m, msg.params?.name, msg.params?.arguments || {}, null);
      return text === null ? err(-32602, 'unknown tool: ' + msg.params?.name) : ok({ content: [{ type: 'text', text }] });
    }
    default: return err(-32601, 'method not found');
  }
}

const readBody = (req) => new Promise((res, rej) => {
  let b = ''; req.setEncoding('utf8');
  req.on('data', c => { b += c; if (b.length > 1e6) { rej(new Error('body too large')); req.destroy(); } });
  req.on('end', () => res(b)); req.on('error', rej);
});
const parseArgs = (u, raw) => {
  let d = {};
  if (raw) { try { d = JSON.parse(raw); } catch { d = Object.fromEntries(new URLSearchParams(raw)); } }
  return { ...Object.fromEntries(u.searchParams), ...(d && typeof d === 'object' ? d : {}) };
};
const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',            // không để link chủ trì lộ qua Referer
  'x-frame-options': 'DENY',
};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

// Tên file biên bản: 2026-10-18_0930_chon-database.md
const slug = (s) => String(s || 'cuoc-hop').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cuoc-hop';
const stamp = (t) => { const d = new Date(t), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };

// Mỗi dịch vụ chat nhận một dạng JSON khác nhau; dịch vụ lạ nhận bản đầy đủ.
function webhookBody(url, m) {
  const text = minutes.toSummary(m);
  let host = ''; try { host = new URL(url).hostname; } catch {}
  if (/(^|\.)slack\.com$/.test(host) || /(^|\.)chat\.googleapis\.com$/.test(host)) return { text };
  if (/(^|\.)discord(app)?\.com$/.test(host)) return { content: text };
  const { transcript, ...meeting } = minutes.toJSON(m);
  return { text, content: text, meeting };
}

function createApp(cfg = {}) {
  const log = cfg.log || (() => {});
  // Khi một cuộc họp kết thúc: tự lưu biên bản và gửi webhook (nếu được bật)
  async function onEnded(m) {
    if (!m.startedAt) return; // phòng chờ bị dọn khi chưa họp: không có gì để lưu hay báo
    const base = `${stamp(m.startedAt || m.createdAt)}_${slug(m.context.split('\n')[0])}`;
    if (cfg.minutesDir) {
      try {
        fs.mkdirSync(cfg.minutesDir, { recursive: true });
        let name = base, k = 2;
        while (fs.existsSync(path.join(cfg.minutesDir, name + '.md'))) name = `${base}-${k++}`;
        fs.writeFileSync(path.join(cfg.minutesDir, name + '.md'), minutes.toMarkdown(m));
        fs.writeFileSync(path.join(cfg.minutesDir, name + '.json'), JSON.stringify(minutes.toJSON(m), null, 2));
        log(`📝 Đã lưu biên bản: ${path.join(cfg.minutesDir, name)}.md (+ .json)`);
      } catch (e) { log(`⚠ Không lưu được biên bản: ${e.message}`); }
    }
    for (const url of cfg.webhooks || []) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(webhookBody(url, m)), signal: AbortSignal.timeout(10000) });
        log(r.ok ? `📨 Đã gửi tóm tắt tới webhook ${new URL(url).host}` : `⚠ Webhook ${new URL(url).host} trả lỗi HTTP ${r.status}`);
      } catch (e) { log(`⚠ Không gửi được webhook: ${e.message}`); }
    }
  }

  const byAgent = new Map(), byHost = new Map();
  let publicOrigin = null; // địa chỉ công khai (tunnel) để prompt mời luôn dùng được từ máy khác
  let fixedOrigin = null;  // --public-url: người vận hành đã khai báo, dùng cho cả lệnh trong giao thức (proxy có thể đổi header Host)
  const assets = Object.fromEntries(Object.entries(ASSETS).map(([k, [f, type]]) => [k, { body: fs.readFileSync(path.join(UI_DIR, f)), type }]));
  const index = fs.readFileSync(path.join(UI_DIR, 'index.html'));
  // fixed: mã chủ trì cố định (--host-key), link chủ trì không bao giờ hỏng; cuộc họp mới dùng lại đúng mã đó
  const create = (overrides = {}) => {
    const m = new Meeting({ ...cfg, ...overrides });
    m.fixed = !!overrides.fixed;
    byAgent.set(m.id, m); byHost.set(m.hostKey, m);
    m.ev.once('ended', () => { onEnded(m).finally(() => app.ev.emit('ended', m)); });
    return m;
  };
  // Cuộc họp nối tiếp dùng lại mã agent (agent đã cài MCP không phải cài lại) và các tuỳ chọn của cuộc trước
  const renew = (mt) => {
    const s = mt.cfg;
    const n = create({ id: mt.id, hostKey: mt.fixed ? mt.hostKey : undefined, fixed: mt.fixed, mode: s.mode, maxMsgs: s.maxMsgs, idleMs: s.idleMs, timeLimitMin: s.timeLimitMin });
    n.configure({ agenda: mt.agenda });
    return n;
  };
  const sweep = setInterval(() => {
    for (const m of [...byHost.values()]) {
      if (Date.now() - m.touched <= (m.state === 'ENDED' ? ENDED_TTL_MS : TTL_MS)) continue;
      if (m.fixed) { if (m.state !== 'LOBBY') { m.stop('quá lâu không hoạt động'); renew(m); } continue; }
      m.stop('quá lâu không hoạt động'); byHost.delete(m.hostKey);
      if (byAgent.get(m.id) === m) byAgent.delete(m.id);
    }
  }, 60000);
  sweep.unref();

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    const origin = (req.headers['x-forwarded-proto'] || 'http') + '://' + req.headers.host;
    const send = (code, type, body, extra) => { res.writeHead(code, { 'content-type': type, ...SECURITY, ...extra }); res.end(body); };
    const text = (code, t) => send(code, 'text/plain; charset=utf-8', t);
    const json = (code, o) => send(code, 'application/json; charset=utf-8', JSON.stringify(o), { 'cache-control': 'no-store' });
    let m;
    try {
      if (p === '/') return text(200, 'agent-meeting đang chạy. Hãy mở link chủ trì in ra ở terminal.');
      if (p === '/healthz') return json(200, { ok: true, version: pkg.version });
      if (ASSETS[p]) return send(200, assets[p].type, assets[p].body, { 'cache-control': 'no-cache' });

      // Giao diện chủ trì
      if ((m = p.match(/^\/m\/(\w+)$/)))
        return send(byHost.has(m[1]) ? 200 : 404, 'text/html; charset=utf-8', index, { 'cache-control': 'no-store', 'content-security-policy': CSP });

      if ((m = p.match(/^\/api\/host\/(\w+)\/(state|start|stop|say|kick|new|next|role|minutes\.md|minutes\.json)$/))) {
        const mt = byHost.get(m[1]); if (!mt) return json(404, { error: 'Không tìm thấy cuộc họp (app đã khởi động lại?).' });
        const act = m[2];
        if (act === 'state') {
          const v = Number.parseInt(u.searchParams.get('v'), 10), from = Number.parseInt(u.searchParams.get('from'), 10);
          // long-poll thay cho SSE vì tunnel miễn phí của Cloudflare không hỗ trợ SSE
          return json(200, { ...(await mt.changedSince(Number.isNaN(v) ? -1 : v, 25000, Number.isNaN(from) ? 0 : from)), origin: publicOrigin || origin });
        }
        if (act === 'minutes.md') return send(200, 'text/markdown; charset=utf-8', minutes.toMarkdown(mt), { 'cache-control': 'no-store' });
        if (act === 'minutes.json') return json(200, minutes.toJSON(mt));
        if (req.method !== 'POST') return json(405, { error: 'POST only' });
        const d = parseArgs(u, await readBody(req));
        if (act === 'start') return json(200, { ok: mt.start(d.context, d.endCondition, d.settings) });
        if (act === 'stop') { mt.stop(); return json(200, { ok: true }); }
        if (act === 'say') return json(200, { ok: mt.hostSay(d.text, d.to) });
        if (act === 'next') return json(200, { ok: mt.hostNextItem() });
        if (act === 'role') return json(200, { ok: mt.setRole(d.name, d.role) });
        if (act === 'kick') return json(200, { ok: mt.kick(d.name) });
        if (act === 'new') {
          if (mt.state === 'LIVE') mt.stop('chủ trì mở cuộc họp mới');
          return json(200, { hostKey: renew(mt).hostKey });
        }
      }

      // API cho agent dạng văn bản (curl)
      if ((m = p.match(/^\/a\/(\w+)\/(\w+)$/))) {
        const mt = byAgent.get(m[1]);
        const raw = req.method === 'POST' ? await readBody(req) : '';
        const out = await invoke(mt, m[2], parseArgs(u, raw), { base: `${fixedOrigin || origin}/a/${m[1]}` });
        return out === null ? text(404, `Không có lệnh "${m[2]}". Các lệnh: ${TOOLS.map(t => t.name).join(', ')}.`) : text(200, out);
      }

      // MCP (JSON-RPC qua HTTP, Streamable HTTP không phiên)
      if ((m = p.match(/^\/mcp\/(\w+)$/))) {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST', ...SECURITY }); return res.end(); }
        const mt = byAgent.get(m[1]) || null;
        let msg;
        try { msg = JSON.parse(await readBody(req)); } catch { return json(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); }
        const out = Array.isArray(msg) ? (await Promise.all(msg.map(x => rpc(mt, x)))).filter(Boolean) : await rpc(mt, msg);
        if (!out || (Array.isArray(out) && !out.length)) { res.writeHead(202, SECURITY); return res.end(); }
        return json(200, out);
      }
      text(404, 'not found');
    } catch (e) { if (!res.headersSent) json(500, { error: String(e.message || e) }); else res.end(); }
  });
  server.requestTimeout = 0; // long-poll và wait giữ kết nối lâu
  const app = { server, create, renew, meetings: byHost, ev: new EventEmitter(), setPublicOrigin: (o, fixed) => { publicOrigin = o; if (fixed) fixedOrigin = o; }, close: () => { clearInterval(sweep); server.close(); server.closeAllConnections?.(); } };
  return app;
}

module.exports = { createApp, TOOLS, webhookBody };
