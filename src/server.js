'use strict';
// HTTP: giao diện chủ trì (SSE), API agent dạng văn bản (curl) và MCP (JSON-RPC qua HTTP).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Meeting } = require('./meeting');

const UI = fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8');
const TTL_MS = 3 * 3600 * 1000;       // họp nhàn rỗi quá 3 giờ thì xóa
const ENDED_TTL_MS = 15 * 60 * 1000;  // họp đã kết thúc thì xóa sau 15 phút

const str = (d) => ({ type: 'string', description: d });
const TOOLS = [
  { name: 'join', description: 'Vào cuộc họp. Trả về giao thức bạn phải tuân theo. Gọi đầu tiên.',
    inputSchema: { type: 'object', properties: { name: str('Tên ngắn của bạn, ví dụ Claude hoặc GPT') } } },
  { name: 'wait', description: 'Chờ (không tốn token) tới khi có tin mới hoặc hệ thống cần bạn quyết định. Nếu báo "Chưa có tin mới" thì gọi lại.',
    inputSchema: { type: 'object', properties: { name: str('Tên bạn đã join') }, required: ['name'] } },
  { name: 'say', description: 'Phát biểu trong cuộc họp. Chỉ nói khi có đóng góp mới.',
    inputSchema: { type: 'object', properties: { name: str('Tên bạn đã join'), text: str('Nội dung ngắn gọn') }, required: ['name', 'text'] } },
  { name: 'typing', description: 'Báo mọi người biết bạn đang soạn câu trả lời dài, để không ai tưởng cuộc họp đã im.',
    inputSchema: { type: 'object', properties: { name: str('Tên bạn đã join') }, required: ['name'] } },
  { name: 'leave', description: 'Rời phòng khi không còn gì để bàn. Sau đó dừng, không gọi thêm tool.',
    inputSchema: { type: 'object', properties: { name: str('Tên bạn đã join'), reason: str('Lý do ngắn (tùy chọn)') }, required: ['name'] } },
  { name: 'history', description: 'Đọc toàn bộ lịch sử cuộc họp.', inputSchema: { type: 'object', properties: {} } },
];
const INSTRUCTIONS = 'Phòng họp nhiều agent. Bắt đầu bằng join(name) rồi làm theo giao thức nó trả về: lặp wait -> say cho tới khi cuộc họp kết thúc, và leave khi không còn gì để bàn.';

async function invoke(m, tool, a = {}, how) {
  switch (tool) {
    case 'join': return m.join(a.name, how);
    case 'wait': return m.wait(a.name);
    case 'say': return m.say(a.name, a.text);
    case 'typing': return m.typing(a.name);
    case 'leave': return m.leave(a.name, a.reason);
    case 'history': return m.history();
    default: return null;
  }
}

async function rpc(m, msg) {
  const ok = (result) => ({ jsonrpc: '2.0', id: msg.id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id: msg.id, error: { code, message } });
  if (msg.id === undefined) return null; // notification
  switch (msg.method) {
    case 'initialize': return ok({ protocolVersion: msg.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} },
      serverInfo: { name: 'agent-meeting', version: '1.0.0' }, instructions: INSTRUCTIONS });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': {
      const text = await invoke(m, msg.params?.name, msg.params?.arguments || {}, null);
      return text === null ? err(-32601, 'unknown tool') : ok({ content: [{ type: 'text', text }] });
    }
    default: return err(-32601, 'method not found');
  }
}

const readBody = (req) => new Promise(res => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); }); req.on('end', () => res(b)); });
const parseArgs = (u, raw) => {
  let d = {};
  if (raw) { try { d = JSON.parse(raw); } catch { d = Object.fromEntries(new URLSearchParams(raw)); } }
  return { ...Object.fromEntries(u.searchParams), ...d };
};

function createApp(cfg = {}) {
  const byAgent = new Map(), byHost = new Map();
  const create = () => { const m = new Meeting(cfg); byAgent.set(m.id, m); byHost.set(m.hostKey, m); return m; };
  const sweep = setInterval(() => {
    for (const m of byAgent.values())
      if (Date.now() - m.touched > (m.state === 'ENDED' ? ENDED_TTL_MS : TTL_MS)) { byAgent.delete(m.id); byHost.delete(m.hostKey); }
  }, 60000);
  sweep.unref();

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    const origin = (req.headers['x-forwarded-proto'] || 'http') + '://' + req.headers.host;
    const text = (code, t) => { res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' }); res.end(t); };
    const json = (code, o) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    let m;
    try {
      if (p === '/') return text(200, 'agent-meeting đang chạy. Hãy mở link chủ trì in ra ở terminal.');

      // Giao diện chủ trì
      if ((m = p.match(/^\/m\/(\w+)$/))) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(UI);
      }
      if ((m = p.match(/^\/api\/host\/(\w+)\/(events|start|stop)$/))) {
        const mt = byHost.get(m[1]); if (!mt) return json(404, { error: 'no meeting' });
        if (m[2] === 'start') { const d = parseArgs(u, await readBody(req)); return json(200, { ok: mt.start(d.context, d.endCondition) }); }
        if (m[2] === 'stop') { mt.stop(); return json(200, { ok: true }); }
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        const push = () => res.write(`data: ${JSON.stringify(mt.snapshot())}\n\n`);
        push(); mt.ev.on('change', push);
        const ka = setInterval(() => res.write(': ka\n\n'), 20000);
        req.on('close', () => { mt.ev.off('change', push); clearInterval(ka); });
        return;
      }

      // API cho agent dạng văn bản (curl)
      if ((m = p.match(/^\/a\/(\w+)\/(\w+)$/))) {
        const mt = byAgent.get(m[1]); if (!mt) return text(404, 'Phòng không tồn tại hoặc đã bị xóa.');
        const raw = req.method === 'POST' ? await readBody(req) : '';
        const out = await invoke(mt, m[2], parseArgs(u, raw), { base: `${origin}/a/${mt.id}` });
        return out === null ? text(404, 'tool không tồn tại') : text(200, out);
      }

      // MCP (JSON-RPC qua HTTP)
      if ((m = p.match(/^\/mcp\/(\w+)$/))) {
        const mt = byAgent.get(m[1]); if (!mt) return json(404, { error: 'no meeting' });
        if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
        const msg = JSON.parse(await readBody(req));
        const out = Array.isArray(msg) ? (await Promise.all(msg.map(x => rpc(mt, x)))).filter(Boolean) : await rpc(mt, msg);
        if (!out || (Array.isArray(out) && !out.length)) { res.writeHead(202); return res.end(); }
        return json(200, out);
      }
      text(404, 'not found');
    } catch (e) { if (!res.headersSent) json(500, { error: String(e) }); }
  });
  return { server, create, close: () => { clearInterval(sweep); server.close(); } };
}

module.exports = { createApp, TOOLS };
