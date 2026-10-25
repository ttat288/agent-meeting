'use strict';
// HTTP: giao diện chủ trì (long-poll), API agent dạng văn bản (curl) và MCP (JSON-RPC qua HTTP).
const http = require('http');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Meeting, fmtSize, findSecret } = require('./meeting');
const minutes = require('./minutes');
const { rolesNeeded } = require('./brief');
const pkg = require('../package.json');
const os = require('os');
const routing = require('./routing');
const { ConfigStore } = require('./config-store');
const { WorkManager, safeFile } = require('./work');
const { PmOperator } = require('./pm');
const runtime = require('./runtime');
const { RemoteCoordinator } = require('./remote');
const { aggregateResults } = require('./evaluation');

const UI_DIR = path.join(__dirname, 'ui');
const ASSETS = {
  '/assets/workspace.css': ['workspace.css', 'text/css; charset=utf-8'],
  '/assets/workspace.js': ['workspace.js', 'text/javascript; charset=utf-8'],
  '/assets/app.css': ['app.css', 'text/css; charset=utf-8'],
  '/assets/pm-ui.js': ['pm-ui.js', 'text/javascript; charset=utf-8'],
  '/assets/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/assets/i18n.js': ['i18n.js', 'text/javascript; charset=utf-8'],
  '/assets/brief.js': ['../brief.js', 'text/javascript; charset=utf-8'], // dùng chung với Node (src/brief.js)
  '/favicon.svg': ['favicon.svg', 'image/svg+xml'],
  '/favicon.png': ['favicon.png', 'image/png'],
  '/assets/foxul.png': ['logo.png', 'image/png'],
};
const TTL_MS = 3 * 3600 * 1000;       // họp nhàn rỗi quá 3 giờ thì xóa
const ENDED_TTL_MS = 30 * 60 * 1000;  // họp đã kết thúc thì xóa sau 30 phút
const WORK_TTL_MS = 7 * 24 * 3600 * 1000; // giai đoạn thực hiện: agent có thể mất nhiều ngày mới báo tiến độ
const MB = 1024 * 1024;
const FILE_LIMITS = { maxFileMb: 20, maxRoomMb: 200, maxFiles: 100 }; // Cloudflare quick tunnel giới hạn thân request ~100 MB
// Agent thật từng gõ sai mã phòng giữa cuộc họp rồi bỏ về: nhắc kiểm tra URL trước, thử lại một lần, rồi mới dừng.
const GONE_TEXT = 'Phòng họp không tồn tại với mã này. Nếu bạn đang họp dở, có thể bạn đã chép sai URL: hãy dùng lại ĐÚNG URL trong giao thức đã nhận lúc join (so từng ký tự của mã phòng) và thử lại một lần. Nếu vẫn báo lỗi này thì phòng đã đóng (app đã tắt hoặc cuộc họp kết thúc quá lâu): hãy dừng lại, không gọi thêm tool.';

const str = (d) => ({ type: 'string', description: d });
const named = (extra = {}, req = []) => ({ type: 'object', properties: { name: str('Tên bạn đã join'), ...extra }, required: ['name', ...req] });
// annotations: mọi tool chỉ tác động lên phòng họp (miền đóng) và không xoá gì. Codex CLI hỏi duyệt MỖI lần gọi tool
// thiếu các gợi ý này (đã thử thật với 0.162): một cuộc họp gọi wait hàng chục lần thì người dùng bị hỏi liên tục.
const CLOSED = { destructiveHint: false, openWorldHint: false };
const TOOLS = [
  { name: 'join', description: 'Gọi đầu tiên để vào phòng; đọc và theo giao thức trả về.',
    inputSchema: { type: 'object', properties: { name: str('Tên chưa ai dùng; trùng thì chọn lại'), model: str('Model bạn thực sự đang dùng') }, required: ['name', 'model'] } },
  { name: 'wait', description: 'Chờ tin mới/tới lượt, tối đa ~50s. Chưa có tin thì gọi lại. Phản hồi vẫn dùng context.', inputSchema: named() },
  { name: 'say', description: 'Phát biểu trong cuộc họp. Chỉ nói khi có đóng góp mới. Tin chốt cuối bắt đầu bằng "KẾT LUẬN:".', inputSchema: named({ text: str('Nội dung ngắn gọn') }, ['text']) },
  { name: 'pass', description: 'Bỏ lượt khi tới lượt mà không có gì mới (chế độ lần lượt).', inputSchema: named() },
  { name: 'typing', description: 'Báo đang suy nghĩ lâu để phòng chờ bạn.', inputSchema: named() },
  { name: 'progress', description: 'Báo tiến độ việc được giao, dùng được sau leave. Chỉ báo xong khi làm thật, có bằng chứng.',
    inputSchema: named({ task: str('Số việc, ví dụ 2'), status: str('đang làm | xong | vướng | chưa làm'), note: str('Bằng chứng hoặc ghi chú: link commit/PR, kết quả test, đang vướng gì') }, ['task', 'status']) },
  { name: 'files', description: 'Liệt kê tệp được phép xem, cách tải và sha256. wait="1": chờ tệp mới tới ~50s. Gửi/nhận theo giao thức.',
    inputSchema: named({ wait: str('"1" để chờ tới khi có tệp mới (tuỳ chọn)') }), annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'leave', description: 'Rời khi hết ý; theo phản hồi cuối: dừng hoặc làm việc được giao rồi progress.', inputSchema: named({ reason: str('Lý do ngắn (tuỳ chọn)') }) },
  { name: 'history', description: 'Đọc lại: offset=0, limit=20, maxChars=8000 trả JSON/nextOffset; giữ cursor wait. Bỏ tham số trả toàn bộ.',
    inputSchema: { type: 'object', properties: { offset: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 100 }, maxChars: { type: 'integer', minimum: 1024, maximum: 32000 } } }, annotations: { readOnlyHint: true, openWorldHint: false } },
].map(t => ({ ...t, annotations: t.annotations || CLOSED }));
const INSTRUCTIONS = 'Phòng họp nhiều agent. Bắt đầu bằng join(name, model): tự đặt tên tuỳ thích và khai báo model đang chạy; nếu bị báo trùng tên thì đặt tên khác. Sau đó làm theo giao thức nó trả về: lặp wait -> say cho tới khi cuộc họp kết thúc, và leave khi không còn gì để bàn. Gửi/nhận tệp bằng lệnh curl trong giao thức.';

const AUTH_TEXT = 'Server không nhận ra bạn: thiếu hoặc sai mã riêng. Hãy dùng ĐÚNG các lệnh trong giao thức bạn nhận lúc join (lệnh curl có -H "Authorization: Bearer …"; MCP thì dùng cùng phiên đã join). Nếu chưa join thì gọi join trước.';
const PENDING_TEXT = 'Bạn đang chờ chủ trì duyệt vào phòng. Hãy gọi wait để chờ (đừng dừng).';
const newToken = () => crypto.randomBytes(18).toString('base64url');
const bearer = (req) => (String(req.headers.authorization || '').match(/^Bearer\s+([\w.~+/=-]+)\s*$/i) || [])[1] || null;

// ctx: { how, base, token?, sid?, via, ip, bridge } — how: { base } khi agent gọi bằng curl, null khi gọi qua MCP;
// base: địa chỉ API văn bản (lệnh gửi/tải tệp). Mọi tool trừ join chạy dưới danh tính lấy từ mã (curl) hoặc phiên (MCP),
// KHÔNG từ tham số name: ai có mã mời cũng không nói được dưới tên agent khác.
async function invoke(m, tool, a = {}, ctx = {}) {
  if (!TOOLS.some(t => t.name === tool)) return null;
  if (!m) return GONE_TEXT;
  const { how = null, base } = ctx;
  if (tool === 'join') {
    if (m.pmEnabled && !m.pmReady?.()) return 'PM must join and be approved by the director before workers join.';
    const token = newToken();
    const out = m.join(a.name, a.model, how, base, { token, presented: ctx.token, sid: ctx.sid, via: ctx.via, ip: ctx.ip, bridge: ctx.bridge });
    const id = m.identify({ token }) || m.identify({ token: ctx.token, sid: ctx.sid });
    if (id) ctx.audit?.('join', { agent: id.name, model: String(a.model || '').slice(0, 40), via: ctx.via, ip: ctx.ip, pending: !!id.pending, mcp: !how, bridge: !!ctx.bridge });
    return out;
  }
  const id = m.identify({ token: ctx.token, sid: ctx.sid });
  if (!id) { ctx.bad?.(); return m.state === 'ENDED' ? m.wait('') : AUTH_TEXT; }
  if (id.rejected) return m.rejectText();
  if (id.pending) {
    if (tool === 'wait') return m.waitAdmit(id.name);
    if (tool === 'leave') { m.pending.delete(id.name); m._changed(); return 'Đã huỷ yêu cầu vào phòng. Hãy dừng lại, không gọi thêm tool.'; }
    return PENDING_TEXT;
  }
  a = { ...a, name: id.name };
  // một agent gửi dồn dập (vòng lặp lỗi, hoặc cố tình làm ngập phòng): chặn tạm, báo rõ
  if ((tool === 'say' || tool === 'progress') && ctx.rate && !ctx.rate.take(`say:${m.id}:${id.name}`, 20, 10))
    return 'Bạn gửi quá nhanh (tối đa ~20 tin mỗi phút). Hãy chờ khoảng 30 giây, gộp ý vào một tin, rồi gửi lại.';
  switch (tool) {
    case 'wait': return m.wait(a.name);
    case 'say': return m.say(a.name, a.text);
    case 'pass': return m.pass(a.name);
    case 'typing': return m.typing(a.name);
    case 'progress': return m.progress(a.name, a.task, a.status, a.note);
    case 'leave': return m.leave(a.name, a.reason);
    case 'files': return m.listFiles(a.name, a.wait);
    case 'history': return m.history(a.name, a);
  }
}

async function rpc(m, msg, ctx) {
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
      const text = await invoke(m, msg.params?.name, msg.params?.arguments || {}, ctx);
      return text === null ? err(-32602, 'unknown tool: ' + msg.params?.name) : ok({ content: [{ type: 'text', text }] });
    }
    default: return err(-32601, 'method not found');
  }
}

const readBody = (req, limit = 256 * 1024) => new Promise((res, rej) => {
  let b = ''; req.setEncoding('utf8');
  // tin dài nhất 4000 ký tự, bản brief tối đa 64 KB: 256 KB là quá đủ
  req.on('data', c => { b += c; if (Buffer.byteLength(b) > limit) { rej(new Error('body too large')); req.destroy(); } });
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
// event: 'ended' (đóng hẳn), 'work' (đã chốt, bắt đầu theo dõi tiến độ), 'task' (một việc xong/vướng, kèm task)
function webhookBody(url, m, event = 'ended', task) {
  const text = task ? minutes.toTaskText(m, task) : minutes.toSummary(m);
  let host = ''; try { host = new URL(url).hostname; } catch {}
  if (/(^|\.)slack\.com$/.test(host) || /(^|\.)chat\.googleapis\.com$/.test(host)) return { text };
  if (/(^|\.)discord(app)?\.com$/.test(host)) return { content: text };
  const { transcript, ...meeting } = minutes.toJSON(m);
  return { event, text, content: text, ...(task ? { task: meeting.actions.find(a => a.id === task.n) } : {}), meeting };
}

// Giới hạn tốc độ kiểu token bucket, trong bộ nhớ: key -> { n: số lượt còn, t: lần nạp cuối }
function limiter() {
  const b = new Map();
  const fill = (key, perMin, burst) => {
    const now = Date.now(), x = b.get(key) || { n: burst, t: now };
    x.n = Math.min(burst, x.n + (now - x.t) * perMin / 60000); x.t = now;
    if (b.size > 10000) b.clear(); // chống phình bộ nhớ khi bị quét từ rất nhiều IP
    b.set(key, x);
    return x;
  };
  // take: dùng một lượt (false nếu hết); ok: còn lượt không (không dùng)
  const take = (key, perMin, burst) => { const x = fill(key, perMin, burst); if (x.n < 1) return false; x.n -= 1; return true; };
  const ok = (key, perMin, burst) => fill(key, perMin, burst).n >= 1;
  return { take, ok };
}

function createApp(cfg = {}) {
  const log = cfg.log || (() => {});
  const configStore = new ConfigStore({ dir: cfg.configDir, defaults: routing.defaults, validate: routing.validate });
  const workManagers = new Map(), pmOperators = new Map();
  function pmFor(room) {
    if (!pmOperators.has(room)) {
      const work = workFor(room.hostKey);
      for (const [oldRoom, operator] of pmOperators) if (operator.work === work && oldRoom !== room) { operator.close(); pmOperators.delete(oldRoom); }
      pmOperators.set(room, new PmOperator(work, room, (ev, data) => audit(ev, { room: rid(room), ...data }), Date.now, cfg.sessionOptions));
    }
    return pmOperators.get(room);
  }
  let remoteCoordinator;
  const remoteFor = () => remoteCoordinator ||= new RemoteCoordinator({ dir: cfg.remoteDir || path.join(cfg.workDir || path.join(os.homedir(), '.agent-meeting', 'work'), 'remote') });
  const workKeyFor = room => room.workKey || crypto.createHash('sha256').update(room.hostKey).digest('hex');
  function workFor(key) {
    const room = byHost.get(key), workKey = workKeyFor(room);
    if (!/^[a-f0-9]{64}$/.test(workKey)) throw Object.assign(new Error('Invalid session work identity'), { status: 409 });
    if (!workManagers.has(workKey)) workManagers.set(workKey, new WorkManager({ dir: path.join(cfg.workDir || path.join(os.homedir(), '.agent-meeting', 'work'), workKey), configStore, runner: cfg.runCli }));
    const work = workManagers.get(workKey);
    work.refreshSource = () => {
      const current = [...byHost.values()].filter(r => workKeyFor(r) === workKey).sort((a,b) => b.createdAt - a.createdAt)[0];
      if (!current || work.read().sessionCreatedAt > current.createdAt) throw Object.assign(new Error('Restore the current meeting before executing this plan'), { status: 409 });
      work.syncRoom(current);
    };
    work.refreshSource();
    return work;
  }

  // Nhật ký kiểm toán (--audit-log): JSONL, quyền 600. Ai vào/được duyệt/bị từ chối, ai gửi/tải tệp nào, chủ trì làm gì.
  // KHÔNG ghi nội dung tin nhắn, nội dung tệp hay mã bí mật.
  function audit(ev, data = {}) {
    if (!cfg.auditLog) return;
    try { fs.appendFileSync(cfg.auditLog, JSON.stringify({ t: new Date().toISOString(), ev, ...data }) + '\n', { mode: 0o600 }); }
    catch (e) { log(`⚠ Không ghi được nhật ký kiểm toán: ${e.message}`); }
  }
  const rate = limiter();
  // nhãn phòng trong nhật ký: băm mã chủ trì (không ghi mã thật)
  const rid = (m) => crypto.createHash('sha256').update(m.hostKey).digest('hex').slice(0, 8);
  // Khi cuộc họp chốt (WORK) hoặc kết thúc: tự lưu biên bản và gửi webhook (nếu được bật).
  // Phòng có giai đoạn thực hiện được lưu hai lần vào cùng một file: lúc chốt và lúc đóng hẳn.
  async function onEnded(m, event = 'ended') {
    if (!m.startedAt) return; // phòng chờ bị dọn khi chưa họp: không có gì để lưu hay báo
    if (cfg.minutesDir) {
      try {
        fs.mkdirSync(cfg.minutesDir, { recursive: true });
        if (!m.minutesName) {
          const base = `${stamp(m.startedAt || m.createdAt)}_${slug(m.context.split('\n')[0])}`;
          let name = base, k = 2;
          while (fs.existsSync(path.join(cfg.minutesDir, name + '.md'))) name = `${base}-${k++}`;
          m.minutesName = name;
        }
        const name = m.minutesName;
        fs.writeFileSync(path.join(cfg.minutesDir, name + '.md'), minutes.toMarkdown(m));
        fs.writeFileSync(path.join(cfg.minutesDir, name + '.json'), JSON.stringify(minutes.toJSON(m), null, 2));
        log(`📝 Đã lưu biên bản${event === 'work' ? ' (đã chốt, đang theo dõi tiến độ)' : ''}: ${path.join(cfg.minutesDir, name)}.md (+ .json)`);
      } catch (e) { log(`⚠ Không lưu được biên bản: ${e.message}`); }
    }
    await notify(m, event);
  }
  async function notify(m, event, task) {
    for (const url of cfg.webhooks || []) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(webhookBody(url, m, event, task)), signal: AbortSignal.timeout(10000) });
        log(r.ok ? `📨 Đã gửi ${task ? `tiến độ việc #${task.n}` : 'tóm tắt'} tới webhook ${new URL(url).host}` : `⚠ Webhook ${new URL(url).host} trả lỗi HTTP ${r.status}`);
      } catch (e) { log(`⚠ Không gửi được webhook: ${e.message}`); }
    }
  }

  const byAgent = new Map(), byHost = new Map();
  // ---------- tệp: nội dung giữ trong bộ nhớ, hoặc <dataDir>/<hostKey>.files/<mã tệp> (quyền 600) nếu phòng được lưu ----------
  const lim = { ...FILE_LIMITS, ...Object.fromEntries(Object.keys(FILE_LIMITS).filter(k => cfg[k] > 0).map(k => [k, cfg[k]])) };
  lim.maxRoomMb = Math.max(lim.maxRoomMb, lim.maxFileMb);
  const blobs = new Map(); // mã tệp -> Buffer
  const onDisk = (m) => !!(cfg.dataDir && m.fixed);
  const filesDir = (m) => path.join(cfg.dataDir, m.hostKey + '.files');
  const blobPath = (m, id) => path.join(filesDir(m), id);
  // Xoá nội dung tệp của một cuộc họp không còn dùng; tệp mà cuộc họp khác ("Họp tiếp") đã mang sang thì giữ.
  function dropFiles(m) {
    const keep = new Set([...byHost.values()].filter(x => x !== m).flatMap(x => x.files.map(f => f.id)));
    for (const f of m.files) {
      if (keep.has(f.id) || f.gone) continue;
      f.gone = true; blobs.delete(f.id);
      if (onDisk(m)) try { fs.rmSync(blobPath(m, f.id), { force: true }); } catch {}
    }
  }
  let publicOrigin = null; // địa chỉ công khai (tunnel) để prompt mời luôn dùng được từ máy khác
  let fixedOrigin = null;  // --public-url: người vận hành đã khai báo, dùng cho cả lệnh trong giao thức (proxy có thể đổi header Host)
  const assets = Object.fromEntries(Object.entries(ASSETS).map(([k, [f, type]]) => [k, { body: fs.readFileSync(path.join(UI_DIR, f)), type }]));
  const index = fs.readFileSync(path.join(UI_DIR, 'index.html'));
  const workspaceIndex = fs.readFileSync(path.join(UI_DIR, 'workspace.html'));
  // fixed: mã chủ trì cố định (--host-key), link chủ trì không bao giờ hỏng; cuộc họp mới dùng lại đúng mã đó
  const create = (overrides = {}) => {
    const m = new Meeting({ ...cfg, maxFileMb: lim.maxFileMb, ...overrides });
    m.fixed = !!overrides.fixed;
    m.pmReady = () => pmFor(m).state().status === 'active';
    byAgent.set(m.id, m); byHost.set(m.hostKey, m);
    m.ev.once('ended', () => { onEnded(m).finally(() => app.ev.emit('ended', m)); });
    m.ev.once('work', () => { onEnded(m, 'work'); });
    // giai đoạn thực hiện: báo ngay khi một việc xong hoặc bị vướng (việc cuối cùng xong thì tóm tắt cuối cũng được gửi)
    m.ev.on('task', (t) => { if (m.state === 'WORK' && (t.status === 'done' || t.status === 'blocked')) notify(m, 'task', { ...t }); });
    if (cfg.dataDir && m.fixed) m.ev.on('change', () => saveSoon(m));
    m.ev.on('blocked', (b) => audit('blocked_secret', { room: m.hostKey.slice(0, 6), agent: b.name, kind: b.kind, what: b.what }));
    return m;
  };

  // --data-dir: trạng thái phòng có link cố định được ghi ra <hostKey>.json (gom ghi, tối đa ~1 lần/giây;
  // ghi file tạm rồi rename để không bao giờ để lại file dở). File chứa mã chủ trì/agent nên chỉ chủ máy đọc được.
  const pending = new Map();
  const stateFile = (hostKey) => path.join(cfg.dataDir, hostKey + '.json');
  function save(m) {
    pending.delete(m.hostKey);
    if (byHost.get(m.hostKey) !== m) return; // cuộc họp cũ đã bị "Cuộc họp mới" thay thế dưới cùng mã
    try {
      fs.mkdirSync(cfg.dataDir, { recursive: true, mode: 0o700 });
      const f = stateFile(m.hostKey), tmp = `${f}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(m.toState()), { mode: 0o600 });
      fs.renameSync(tmp, f);
    } catch (e) { log(`⚠ Không lưu được trạng thái cuộc họp: ${e.message}`); }
  }
  function saveSoon(m) {
    if (pending.has(m.hostKey)) return;
    const t = setTimeout(() => save(m), 1000); t.unref();
    pending.set(m.hostKey, t);
  }
  const flush = () => { for (const [k, t] of [...pending]) { clearTimeout(t); const m = byHost.get(k); if (m) save(m); } };
  // Nạp lại cuộc họp đã lưu với mã chủ trì này; không có file thì trả về null
  function restore(hostKey) {
    if (!cfg.dataDir) return null;
    let s;
    try { s = JSON.parse(fs.readFileSync(stateFile(hostKey), 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') log(`⚠ Không đọc được trạng thái đã lưu (${e.message}), bắt đầu phòng mới.`); return null; }
    if (s?.schema !== 'agent-meeting/state@1' || s.hostKey !== hostKey) { log('⚠ File trạng thái không hợp lệ, bắt đầu phòng mới.'); return null; }
    const m = create({ id: s.id, hostKey, fixed: true, ...s.cfg });
    m.restore(s);
    // tệp đã ghi xong nằm trong <hostKey>.files/; tệp dở (.tmp) hoặc không có trong trạng thái thì xoá
    const ids = new Set(m.files.map(f => f.id));
    try { for (const f of fs.readdirSync(filesDir(m))) if (!ids.has(f)) fs.rmSync(path.join(filesDir(m), f), { force: true }); } catch {}
    const lost = m.files.filter(f => !f.gone && !fs.existsSync(blobPath(m, f.id)));
    if (lost.length) { lost.forEach(f => { f.gone = true; }); log(`⚠ Thiếu nội dung ${lost.length} tệp đã lưu: ${lost.map(f => f.name).join(', ')}`); }
    return m;
  }
  // Cuộc họp nối tiếp dùng lại mã agent (agent đã cài MCP không phải cài lại) và các tuỳ chọn của cuộc trước.
  // carry: "Họp tiếp" mang việc chưa xong (giữ số) + quyết định + việc đã xong sang làm bối cảnh cuộc sau.
  const renew = (mt, carry) => {
    if (mt.pmEnabled) { pmFor(mt).host('revoke'); pmOperators.get(mt)?.close(); }
    const s = mt.cfg;
    const n = create({ id: mt.id, hostKey: mt.fixed ? mt.hostKey : undefined, fixed: mt.fixed, mode: s.mode, maxMsgs: s.maxMsgs, idleMs: s.idleMs, timeLimitMin: s.timeLimitMin, followUp: s.followUp });
    if (carry) { n.workKey = workKeyFor(mt); n.createdAt = Math.max(n.createdAt, mt.createdAt + 1); }
    n.configure({ agenda: mt.agenda });
    n.preset = mt.preset;
    if (carry) n.carryIn({
      from: mt.startedAt || mt.createdAt, topic: ((t) => t.length > 120 ? t.slice(0, 119) + '…' : t)(mt.context.split('\n').find(Boolean) || ''),
      decisions: minutes.decisions(mt.log).slice(-10).map(d => ({ item: d.item, text: d.text.replace(/\s+/g, ' ').slice(0, 300), by: d.by })),
      done: mt.actions.filter(t => t.status === 'done').map(({ n: num, task, owner, note }) => ({ n: num, task, owner, note })),
      // agent cuộc trước (và các cuộc trước nữa) vẫn báo tiến độ được cho việc mang sang
      members: [...new Set([...mt.agents.keys(), ...(mt.carry?.members || [])])],
      // mã/phiên của các agent đó để họ vẫn chứng minh được danh tính khi báo tiến độ ở cuộc sau
      creds: [...[...mt.agents.values()].filter(a => a.token && !a.kicked).map(({ name, token, sids }) => ({ name, token, sids: sids || [] })), ...(mt.carry?.creds || [])].slice(0, 50),
    }, mt.actions.filter(t => t.status !== 'done').map(t => ({ ...t })), mt.taskSeq, mt.files.filter(f => !f.gone));
    else dropFiles(mt); // "Cuộc họp mới" không mang tệp sang
    return n;
  };
  const sweep = setInterval(() => {
    for (const m of [...byHost.values()]) {
      if (Date.now() - m.touched <= ({ ENDED: ENDED_TTL_MS, WORK: WORK_TTL_MS }[m.state] || TTL_MS)) continue;
      if (m.fixed) { if (m.state !== 'LOBBY') { m.stop('quá lâu không hoạt động', true); renew(m); } continue; }
      m.stop('quá lâu không hoạt động', true); byHost.delete(m.hostKey); dropFiles(m);
      if (byAgent.get(m.id) === m) byAgent.delete(m.id);
    }
  }, 60000);
  sweep.unref();

  // POST /a/<mã agent>/send?name=&to=&file=&note=, thân request là bytes thô của tệp (curl --data-binary @tệp).
  // Kiểm tra quyền và giới hạn TRƯỚC khi nhận (không gửi "100 Continue" nếu từ chối), ghi theo luồng và tính sha256 trong
  // lúc nhận; vượt giới hạn giữa chừng thì dừng ghi, báo lỗi rõ và đóng kết nối.
  async function receive(req, res, mt, q, who) {
    const reply = (code, t) => { if (res.headersSent) return; res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', ...SECURITY, ...(code >= 400 ? { connection: 'close' } : {}) }); res.end(t); };
    if (req.method !== 'POST') return reply(405, 'Gửi tệp bằng POST: curl -s -X POST "<địa chỉ>/send?name=TÊN_BẠN&to=TÊN_NGƯỜI_NHẬN&file=TÊN_TỆP" --data-binary @ĐƯỜNG_DẪN_TỆP');
    if (!mt) return reply(404, GONE_TEXT);
    if (!who || who.pending) return reply(401, who ? PENDING_TEXT : AUTH_TEXT);
    const chk = mt.sendCheck(who.name, q.to);
    if (typeof chk === 'string') return reply(400, chk);
    // chỉ tính tệp gửi thành công (tệp bị từ chối vì quá lớn… không tính)
    if (!rate.ok(`send:${mt.id}:${chk.from}`, 10, 5)) return reply(429, 'Gửi tệp quá nhanh (tối đa ~10 tệp mỗi phút). Hãy gộp các tệp (tar czf) rồi gửi lại sau ít giây.');
    const used = mt.files.reduce((n, f) => n + (f.gone ? 0 : f.size), 0);
    const room = Math.min(lim.maxFileMb * MB, lim.maxRoomMb * MB - used), len = Number(req.headers['content-length']);
    const tooBig = (n) => `Tệp quá lớn${n ? ` (${fmtSize(n)})` : ''}: tối đa ${lim.maxFileMb} MB mỗi tệp, ${lim.maxRoomMb} MB cho cả phòng (đã dùng ${fmtSize(used)}). Hãy nén (tar czf), chia nhỏ, hoặc chỉ gửi phần cần thiết (git format-patch thay vì cả thư mục).`;
    if (mt.files.filter(f => !f.gone).length >= lim.maxFiles) return reply(413, `Phòng đã có ${lim.maxFiles} tệp (tối đa). Hãy gộp các tệp lại (tar czf) trước khi gửi.`);
    if (room <= 0 || len > room) return reply(413, tooBig(len));
    if (len === 0) return reply(400, 'Tệp trống, không gửi. Kiểm tra lại đường dẫn sau --data-binary @');
    if (req.expectContinue) res.writeContinue();
    const id = crypto.randomBytes(12).toString('hex'), hash = crypto.createHash('sha256'), chunks = [];
    let size = 0, out = null, tmp = null, tail = '', secret = null;
    if (onDisk(mt)) {
      fs.mkdirSync(filesDir(mt), { recursive: true, mode: 0o700 });
      tmp = blobPath(mt, id) + '.tmp'; out = fs.createWriteStream(tmp, { mode: 0o600 });
    }
    const discard = () => { if (out) { out.destroy(); try { fs.rmSync(tmp, { force: true }); } catch {} } };
    const ok = await new Promise((resolve) => {
      req.on('data', (c) => {
        size += c.length;
        if (size > room) { // không có content-length (chunked) hoặc khai sai: dừng ghi, bỏ phần còn lại
          if (size - c.length <= room) { reply(413, tooBig(0)); resolve(false); }
          if (size > room + 8 * MB) req.destroy();
          return;
        }
        hash.update(c);
        // tệp có dạng bí mật (khoá riêng, token…): nhận nốt rồi bỏ, không lưu (quét theo từng đoạn, có phần gối đầu)
        if (!secret) { const s2 = tail + c.toString('latin1'); secret = findSecret(s2); tail = s2.slice(-200); }
        if (secret) return;
        if (!out) chunks.push(c);
        else if (!out.write(c)) { req.pause(); out.once('drain', () => req.resume()); }
      });
      req.on('end', () => resolve(size <= room));
      req.on('error', () => resolve(false)); req.on('aborted', () => resolve(false));
    });
    if (!ok) return discard();
    if (secret) { discard(); return reply(400, mt._blocked(chk.from, secret, 'tệp')); }
    if (!size) { discard(); return reply(400, 'Tệp trống, không gửi. Kiểm tra lại đường dẫn sau --data-binary @'); }
    try {
      if (out) { await new Promise((r, j) => out.end((e) => e ? j(e) : r())); fs.renameSync(tmp, blobPath(mt, id)); }
      else blobs.set(id, Buffer.concat(chunks));
    } catch (e) { discard(); log(`⚠ Không lưu được tệp: ${e.message}`); return reply(500, 'Server không lưu được tệp, thử lại sau.'); }
    const sha256 = hash.digest('hex');
    const r = mt.addFile({ id, name: q.file, size, sha256, from: chk.from, to: chk.to, note: q.note });
    if (!mt.files.some(f => f.id === id)) { blobs.delete(id); if (out) try { fs.rmSync(blobPath(mt, id), { force: true }); } catch {} return reply(400, r); }
    rate.take(`send:${mt.id}:${chk.from}`, 10, 5);
    audit('file_send', { room: rid(mt), agent: chk.from, to: chk.to || '*', file: mt.files.at(-1).name, size, sha256 });
    return reply(200, r);
  }
  // Tệp được phục vụ CÙNG origin với trang chủ trì: luôn là tải về (octet-stream + attachment + nosniff + CSP sandbox),
  // không bao giờ hiển thị HTML/SVG ngay trong trang.
  function serveFile(res, m, f, done) {
    const p = onDisk(m) ? blobPath(m, f.id) : null, buf = p ? null : blobs.get(f.id);
    if (f.gone || (p ? !fs.existsSync(p) : !buf)) {
      res.writeHead(410, { 'content-type': 'text/plain; charset=utf-8', ...SECURITY });
      return res.end('Tệp không còn trên server (cuộc họp mới đã thay cuộc họp này, hoặc phòng đã bị dọn).');
    }
    const ascii = f.name.normalize('NFD').replace(/[^\w.+-]/g, '') || 'tep';
    res.writeHead(200, { ...SECURITY, 'content-type': 'application/octet-stream', 'content-length': f.size,
      'content-disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      'content-security-policy': "sandbox; default-src 'none'", 'cache-control': 'no-store', 'x-content-sha256': f.sha256 });
    if (buf) res.end(buf, done);
    else fs.createReadStream(p).on('error', () => res.destroy()).pipe(res).on('finish', done);
  }

  const server = http.createServer(handle);
  // curl gửi "Expect: 100-continue" với thân lớn: lệnh gửi tệp chỉ trả 100 sau khi đã kiểm tra quyền và giới hạn
  server.on('checkContinue', (req, res) => { req.expectContinue = true; if (!/^\/a\/\w+\/send(\?|$)/.test(req.url)) res.writeContinue(); handle(req, res); });
  // Agent ở đâu so với server: 'local' (cùng máy, không qua tunnel/proxy), 'tunnel' (Cloudflare gắn cf-connecting-ip),
  // 'public' (sau --public-url), 'lan'. Chỉ để hiển thị cho chủ trì và cho luật duyệt 'remote'.
  const isLoop = (a) => /^(127\.|::1$|::ffff:127\.)/.test(a || '');
  function where(req) {
    const cf = req.headers['cf-connecting-ip'] || req.headers['cf-ray'];
    const loop = isLoop(req.socket.remoteAddress);
    const ip = req.headers['cf-connecting-ip'] || (loop && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '';
    const via = cf ? (fixedOrigin ? 'public' : 'tunnel') : loop && !req.headers['x-forwarded-for'] ? 'local' : fixedOrigin ? 'public' : 'lan';
    return { via, ip: String(ip).replace(/^::ffff:/, '') };
  }
  // Chống DNS rebinding: server chỉ nghe máy này (mặc định) thì chỉ nhận Host là localhost hoặc địa chỉ tunnel/--public-url
  // của chính nó. --lan (nghe cả mạng LAN) thì không kiểm (Host có thể là IP bất kỳ của máy).
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  function hostOk(req) {
    if (cfg.lan) return true;
    let h; try { h = new URL('http://' + (req.headers.host || '')).hostname; } catch { return false; }
    if (LOCAL_HOSTS.has(h) || h.endsWith('.localhost')) return true;
    return [publicOrigin, fixedOrigin].some(o => { try { return o && new URL(o).hostname === h; } catch { return false; } });
  }
  // Trang chủ trì và API chủ trì không mở qua tunnel công khai (lộ link chủ trì = mất quyền điều khiển từ bất kỳ đâu),
  // trừ khi chạy --public-url (công ty tự bảo vệ bằng proxy/SSO) hoặc --remote-host.
  const hostPageOk = (req) => cfg.remoteHost || where(req).via !== 'tunnel';
  // CSRF: request đổi trạng thái từ trình duyệt phải cùng origin với trang chủ trì
  const sameOrigin = (req) => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch { return false; } };
  let tunnelStarting = null;
  async function openTunnel() {
    if (publicOrigin) return publicOrigin;
    if (!cfg.startTunnel) throw new Error('Tunnel đã bị tắt (--local). Chạy lại không có --local, hoặc dùng --public-url.');
    tunnelStarting ||= cfg.startTunnel().then(o => { publicOrigin = o; return o; }).finally(() => { tunnelStarting = null; });
    return tunnelStarting;
  }

  // danh tính agent cho các đường tệp: mã (curl) hoặc phiên MCP (cầu nối)
  const who = (mt, req) => mt?.identify({ token: bearer(req), sid: req.headers['mcp-session-id'] }) || null;

  async function handle(req, res) {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    const origin = (req.headers['x-forwarded-proto'] || 'http') + '://' + req.headers.host;
    const send = (code, type, body, extra) => { res.writeHead(code, { 'content-type': type, ...SECURITY, ...extra }); res.end(body); };
    const text = (code, t) => send(code, 'text/plain; charset=utf-8', t);
    const json = (code, o) => send(code, 'application/json; charset=utf-8', JSON.stringify(o), { 'cache-control': 'no-store' });
    let m;
    try {
      if (!hostOk(req)) return text(421, 'Host không hợp lệ cho server này.');
      if ((p.startsWith('/m/') || p.startsWith('/api/host/')) && !hostPageOk(req))
        return text(403, 'Trang chủ trì chỉ mở được trên máy chạy agent-meeting (http://localhost:<cổng>/m/<mã>), không qua địa chỉ công khai.');
      if (p.startsWith('/api/host/') && req.method === 'POST' && !sameOrigin(req)) return json(403, { error: 'Sai origin.' });
      if (p === '/') return text(200, 'agent-meeting đang chạy. Hãy mở link chủ trì in ra ở terminal.');
      if (p === '/healthz') return json(200, { ok: true, version: pkg.version });
      if (ASSETS[p]) return send(200, assets[p].type, assets[p].body, { 'cache-control': 'no-cache' });

      // Worker tokens are scoped to a single registered host; never part of meeting tool auto-allow.
      if ((m = p.match(/^\/api\/worker\/([\w-]+)\/(register|claim|heartbeat|complete)$/))) {
        if (req.method !== 'POST') return json(405, { error: 'POST only' });
        if (!sameOrigin(req)) return json(403, { error: 'Invalid Origin' });
        if (!rate.take('worker:' + m[1], 120, 20)) return json(429, { error: 'Worker request rate exceeded' });
        try {
          const remote = remoteFor(), token = bearer(req); remote.auth(m[1], token);
          const data = JSON.parse(await readBody(req, 2 * MB));
          const result = m[2] === 'claim' ? remote.claim(m[1], token) : remote[m[2]](m[1], token, data);
          return json(200, result);
        } catch (e) { return json(e.status || 400, { error: e.message }); }
      }

      // PM has a distinct local-only capability. Never add it to conversation MCP tools.
      if ((m = p.match(/^\/api\/host\/(\w+)\/pm\/(state|invite|approve|goal|grant|message|pause|revoke|takeover)$/))) {
        const room = byHost.get(m[1]);
        if (!room) return json(404, { error: 'Meeting not found' });
        if (where(req).via !== 'local') return json(403, { error: 'PM controls require the local host' });
        try {
          if (req.method === 'GET' && m[2] === 'state') return json(200, room.pmEnabled || room.pmHistory ? pmFor(room).host('state') : { status: 'human' });
          if (req.method !== 'POST') return json(405, { error: 'POST only' });
          const body = JSON.parse(await readBody(req));
          const operator = pmFor(room), result = operator.host(m[2], body);
          if (m[2] === 'invite') result.clientPath = path.resolve(__dirname, '../bin/pm.js');
          if (m[2] === 'invite') { room.pmHistory = true; room.pmEnabled = true; room._changed(); }
          if (m[2] === 'takeover') { room.pmHistory = true; room.pmEnabled = false; room._changed(); }
          return json(200, result);
        } catch (e) { return json(e.status || 400, { error: e.message }); }
      }
      if ((m = p.match(/^\/api\/pm\/(\w+)\/(join|state|wait|message|plan|run|verify|integrate|report|team-invite|approve-plan|events|ack-event|chair)$/))) {
        const room = byAgent.get(m[1]);
        if (!room || !room.pmEnabled) return json(404, { error: 'PM meeting not found' });
        if (where(req).via !== 'local' || !sameOrigin(req)) return json(403, { error: 'PM API requires local same-origin access' });
        if (req.method !== 'POST') return json(405, { error: 'POST only' });
        if (!rate.take('pm:' + where(req).ip, 120, 120)) return json(429, { error: 'PM request limit; wait before retrying' });
        try { return json(200, await pmFor(room).command(bearer(req), m[2], JSON.parse(await readBody(req)))); }
        catch (e) { return json(e.status || 400, { error: e.message }); }
      }

      if ((m = p.match(/^\/api\/team\/(\w+)\/(join|state|propose|run|checkpoint|swap|verify|integrate|submit|blocker)$/))) {
        const room = byAgent.get(m[1]);
        if (!room || !room.pmEnabled) return json(404, { error: 'Team meeting not found' });
        if (where(req).via !== 'local' || !sameOrigin(req)) return json(403, { error: 'Team API requires local same-origin access' });
        if (req.method !== 'POST') return json(405, { error: 'POST only' });
        if (!rate.take('team:' + where(req).ip, 120, 120)) return json(429, { error: 'Team request limit' });
        try { return json(200, await pmFor(room).team.command(bearer(req), m[2], JSON.parse(await readBody(req)))); }
        catch (e) { return json(e.status || 400, { error: e.message }); }
      }

      // Host capability remains mandatory. Invitation links cannot open admin or start processes.
      if ((m = p.match(/^\/m\/(\w+)\/workspace$/)) && byHost.has(m[1]))
        return send(302, 'text/plain', '', { location: '/m/' + m[1] + u.search + '#plan', 'cache-control': 'no-store' });
      if ((m = p.match(/^\/m\/(\w+)\/(workspace|admin)$/)))
        return send(byHost.has(m[1]) ? 200 : 404, 'text/html; charset=utf-8', workspaceIndex, { 'cache-control': 'no-store', 'content-security-policy': CSP });
      if ((m = p.match(/^\/api\/host\/(\w+)\/(config(?:\/(?:reset|history))?|metrics|remote(?:\/(?:enroll|queue|reassign|artifact))?|routing\/recommend|runtime(?:\/probe)?|work(?:\/tasks(?:\/[\w-]+\/(?:run|configure))?|\/runs\/[\w-]+\/(?:cancel|verify|integrate|rebase|artifact|handoff))?)$/))) {
        if (!byHost.has(m[1])) return json(404, { error: 'Host capability not found' });
        const action = m[2];
        // Process launch, workspace writes and machine metadata are local controls even with remoteHost enabled.
        if (where(req).via !== 'local') return json(403, { error: 'Configuration and execution controls require the local host' });
        try {
          if (!['GET','POST'].includes(req.method)) return json(405, { error: 'GET or POST only' });
          if (action === 'config') {
            if (req.method === 'GET') return json(200, configStore.read());
            const body = JSON.parse(await readBody(req, 600 * 1024));
            const saved = configStore.save(body.config, body.expectedRevision); audit('config-save', { revision: saved.revision }); return json(200, saved);
          }
          if (action === 'config/history' && req.method === 'GET') {
            const current = configStore.read();
            let previous = null;
            if (fs.existsSync(configStore.backupFile)) { const stat = fs.lstatSync(configStore.backupFile); if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Unsafe config backup'); previous = JSON.parse(fs.readFileSync(configStore.backupFile, 'utf8')); routing.validate(previous); }
            return json(200, { currentRevision: current.revision, previousRevision: previous?.revision ?? null });
          }
          if (action === 'config/reset' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req)), next = configStore.read(), defaults = routing.defaults();
            if (!['models','policy','runtimes'].includes(body.group)) return json(400, { error: 'Unknown configuration group' });
            next[body.group] = defaults[body.group]; if (body.group !== 'policy') next.profiles = defaults.profiles;
            return json(200, configStore.save(next, body.expectedRevision));
          }
          const work = workFor(m[1]);
          if (req.method === 'POST' && work.read().sessionCreatedAt > byHost.get(m[1]).createdAt) return json(409, { error: 'Meeting continued; use the current session to change this plan' });
          if (action === 'metrics' && req.method === 'GET') return json(200, aggregateResults({ runs: work.read().runs, remoteRuns: remoteFor().read().runs }));

          if (action === 'remote/artifact' && req.method === 'GET') {
            const result = remoteFor().getResult(u.searchParams.get('runId'), u.searchParams.has('generation') ? Number(u.searchParams.get('generation')) : undefined);
            const artifact = result?.artifacts.find(a => a.name === u.searchParams.get('name'));
            if (!artifact?.content) return json(404, { error: 'Artifact bytes are unavailable' });
            const bytes = Buffer.from(artifact.content, 'base64');
            if (crypto.createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) return json(409, { error: 'Artifact hash mismatch' });
            return send(200, 'application/octet-stream', bytes, { 'content-disposition': 'attachment; filename="artifact.json"', 'content-security-policy': 'sandbox', 'cache-control': 'no-store' });
          }
          if (/^work\/runs\/[\w-]+\/(artifact|handoff)$/.test(action) && req.method === 'GET') {
            const parts = action.split('/'), state = work.read(), run = state.runs.find(r => r.id === parts[2]), task = run && state.tasks.find(t => t.id === run.taskId);
            if (!run) return json(404, { error: 'Run not found' });
            if (parts[3] === 'handoff') {
              // Evidence belongs to the requirements captured at dispatch, even
              // after the live task has been edited. Never reconstruct a legacy
              // snapshot from present-day criteria.
              const executedTask = run.requirementSnapshot || null;
              const requirementRevision = run.requirementRevision ?? null;
              const currentRequirementRevision = task?.requirementRevision ?? null;
              const requirementsCurrent = executedTask && requirementRevision !== null && currentRequirementRevision !== null
                ? requirementRevision === currentRequirementRevision : null;
              return json(200, { schema: 'agent-meeting/handoff@1', task: executedTask, requirementRevision, currentRequirementRevision, requirementsCurrent,
                runId: run.id, status: run.status, configRevision: run.configRevision, baseRevision: run.baseRevision, actualModel: run.reportedModel, runtime: run.adapter, changes: run.changes, verification: run.evidence, integrationVerification: run.integrationEvidence || [], usage: run.usage, costUsd: run.costUsd, ...(run.skillEvidence ? { skillEvidence: run.skillEvidence } : {}),
                limitations: ['Single-file automatic integration', 'Filesystem write isolation only',
                  ...(!executedTask ? ['Historical requirement snapshot is unavailable; current criteria are not substituted'] : []),
                  ...(requirementsCurrent === false ? ['Historical run requirements differ from the current task; this evidence does not accept its current requirements'] : []),
                  ...(run.skillEvidence ? ['Skill supply is observed; semantic application and model tool use are not established by supply metadata'] : []), ...(run.status !== 'integrated' ? ['Not accepted as completed'] : [])] });
            }
            const file = u.searchParams.get('path'), change = run.changes.find(c => c.file === file);
            if (!change?.after) return json(404, { error: 'Changed file bytes are unavailable' });
            const bytes = fs.readFileSync(safeFile(run.workspace, file));
            if (crypto.createHash('sha256').update(bytes).digest('hex') !== change.after) return json(409, { error: 'Workspace artifact changed' });
            return send(200, 'application/octet-stream', bytes, { 'content-disposition': 'attachment; filename="result.bin"; filename*=UTF-8\'\'' + encodeURIComponent(path.basename(file)), 'content-security-policy': 'sandbox', 'cache-control': 'no-store' });
          }
          if (action === 'remote' && req.method === 'GET') return json(200, remoteFor().read());
          if (action.startsWith('remote/') && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            if (action === 'remote/enroll') return json(201, remoteFor().enroll(body));
            if (action === 'remote/reassign') return json(200, remoteFor().reassign(body.runId, { hostId: body.hostId }));
            const task = work.read().tasks.find(t => t.id === body.taskId);
            if (!task || task.purpose !== 'execute' || task.topology === 'local' || task.management === 'invited') return json(409, { error: 'A remote managed execution task is required' });
            work.assertCurrent(task.id);
            if (task.skillPolicy) return json(409, { code: 'SKILL_REMOTE_UNSUPPORTED', error: 'Task skill supply and lookup are supported only by local managed runs; remote execution cannot apply this policy' });
            const config = configStore.read(), profile = config.profiles.find(p => p.id === body.profileId), model = profile && config.models.find(x => x.id === profile.modelId);
            if (!profile?.enabled || !model?.enabled || model.verification !== 'verified') return json(409, { error: 'Enable and verify the selected model/profile first' });
            const host = remoteFor().read().hosts.find(h => h.id === body.hostId);
            if (!host || Date.now() - host.lastSeen > 60000) return json(409, { error: 'Worker is offline or has not registered recently' });
            if (!task.baseRevision || task.baseRevision !== host.baseRevision) return json(409, { error: 'Remote task base revision must match the registered worker' });
            const adapter = { 'claude-code': 'claude', agy: 'agy' }[profile.runtimeId];
            if (!adapter) return json(409, { error: 'No remote adapter for this runtime' });
            // Explicit operator dispatch records unknown model access. The worker must verify its own adapter/model allowlist.
            if (!host.capabilities.includes(adapter)) return json(409, { error: 'Worker does not advertise the selected adapter' });
            routing.validateTask(task);
            const runtimeProfile = config.runtimes.find(r => r.id === profile.runtimeId);
            if ((task.requiredCapabilities || []).some(c => !model.capabilities.includes(c) && !runtimeProfile.capabilities.includes(c)) || (task.requiredModalities || []).some(c => !model.modalities.includes(c))) return json(409, { error: 'Profile cannot satisfy the required capabilities/modalities' });
            if ((task.requiredTools || []).length || (task.requiredPermissions || []).length) return json(409, { error: 'Remote tool/permission evidence is not available for this task' });
            const tiers = { low: 1, medium: 2, high: 3 };

            const ceiling = Math.min(...[config.policy.budget.maxCostTier, task.budget?.maxCostTier].filter(Boolean).map(t => tiers[t]), 3);
            if (tiers[model.costTier] > ceiling) return json(409, { error: 'Task exceeds routing budget' });
            const assignment = remoteFor().enqueue({ taskId: task.id, runId: crypto.randomUUID(), hostId: host.id, workspaceId: host.workspaceId, baseRevision: host.baseRevision, requirementRevision: task.requirementRevision, adapter, modelId: model.providerModelId, configRevision: config.revision, configSnapshot: config, routingDecision: { selection: 'operator-explicit', profileId: profile.id, unknowns: ['model-access','quota'], reviewRequired: task.risk === 'high' || task.scope === 'large' || (task.reviewReasons || []).some(r => config.policy.reviewRequiredFor.includes(r)) }, writePaths: task.writePaths, prompt: JSON.stringify({ goal: task.goal, origin: task.origin || null, acceptance: task.acceptance, sources: task.sources, facts: task.facts, unknowns: task.unknowns, scope: task.writePaths }) });
            audit('remote-queue', { runId: assignment.runId, hostId: host.id, configRevision: config.revision });
            return json(202, { ...assignment, configRevision: config.revision, selection: 'operator-explicit', access: 'unknown' });
          }

          if (action === 'runtime' && req.method === 'GET') return json(200, { observations: work.environment(), checks: runtime.ADAPTERS.map(runtime.checkRuntime) });
          if (action === 'work' && req.method === 'GET') {
            const room = byHost.get(m[1]), state = work.read(), remote = remoteFor().read();
            // Conditional reads retain the same local capability checks as full reads.
            // Include room identity/version and remote revision: work revision alone
            // misses conversation changes and worker lease expiry.
            const etag = '"' + crypto.createHash('sha256').update(JSON.stringify([m[1], room.createdAt, room.version, state.revision, remote.revision])).digest('hex') + '"';
            const headers = { 'cache-control': 'no-store', etag };
            if (req.headers['if-none-match'] === etag) return send(304, 'application/json; charset=utf-8', '', headers);
            const taskIds = new Set(state.tasks.map(t => t.id));
            return send(200, 'application/json; charset=utf-8', JSON.stringify({ ...state, metrics: aggregateResults({ runs: state.runs, remoteRuns: remote.runs.filter(r => taskIds.has(r.taskId)) }), session: { createdAt: room.createdAt, state: room.state, context: room.context || room.preset?.context || '', decisions: room.log.filter(x => x.conclusion).map(x => ({ messageIndex: x.i, text: x.text, name: x.name })) } }), headers);
          }
          if (req.method !== 'POST') return json(405, { error: 'POST only' });
          const body = JSON.parse(await readBody(req));
          if (action === 'routing/recommend') return json(200, routing.recommend(configStore.read(), body, work.environment()));
          if (action === 'runtime/probe') return json(200, await work.probe(body.profileId, body.expectedConfigRevision));
          if (action === 'work/tasks') return json(201, work.createTask(body));
          const bits = action.split('/');
          if (bits[1] === 'tasks' && bits[3] === 'configure') return json(200, work.configureTask(bits[2], body));
          if (bits[1] === 'tasks' && bits[3] === 'run') return json(202, work.start(bits[2], body.profileId, { expectedConfigRevision: body.expectedConfigRevision, expectedRequirementRevision: body.expectedRequirementRevision }));
          if (bits[1] === 'runs' && bits[3] === 'rebase') return json(200, work.rebase(bits[2]));
          if (bits[1] === 'runs' && bits[3] === 'cancel') return json(202, work.cancel(bits[2]));
          if (bits[1] === 'runs' && bits[3] === 'verify') return json(200, await work.verify(bits[2]));
          if (bits[1] === 'runs' && bits[3] === 'integrate') return json(200, await work.integrate(bits[2]));
          return json(404, { error: 'Unsupported work operation' });
        } catch (e) {
          const status = e.status || (['CONFIG_CONFLICT','CONFIG_LOCKED'].includes(e.code) ? 409 : e.code === 'CONFIG_CORRUPT' ? 500 : 400);
          return json(status, { error: e.message, code: e.code, currentRevision: e.currentRevision });
        }
      }

      // Giao diện chủ trì
      if ((m = p.match(/^\/m\/(\w+)$/)))
        return send(byHost.has(m[1]) ? 200 : 404, 'text/html; charset=utf-8', index, { 'cache-control': 'no-store', 'content-security-policy': CSP });

      if ((m = p.match(/^\/api\/host\/(\w+)\/file\/(\w+)$/))) {
        const mt = byHost.get(m[1]), f = mt?.files.find(x => x.id === m[2]);
        if (!f) return json(404, { error: 'Không tìm thấy tệp.' });
        return serveFile(res, mt, f, () => {});
      }
      if ((m = p.match(/^\/api\/host\/(\w+)\/(state|start|stop|say|kick|admit|tunnel|connect|new|next|role|task|minutes\.md|minutes\.json)$/))) {
        const mt = byHost.get(m[1]); if (!mt) return json(404, { error: 'Không tìm thấy cuộc họp (app đã khởi động lại?).' });
        const act = m[2];
        if (act === 'state') {
          const v = Number.parseInt(u.searchParams.get('v'), 10), from = Number.parseInt(u.searchParams.get('from'), 10);
          // long-poll thay cho SSE vì tunnel miễn phí của Cloudflare không hỗ trợ SSE
          // local: địa chỉ cho agent cùng máy; public: địa chỉ cho agent máy khác (tunnel hoặc --public-url), null nếu chưa bật
          const loc = where(req).via === 'local';
          return json(200, { ...(await mt.changedSince(Number.isNaN(v) ? -1 : v, 25000, Number.isNaN(from) ? 0 : from)),
            origin: fixedOrigin || (loc ? origin : publicOrigin || origin), local: loc && !fixedOrigin ? origin : null, public: fixedOrigin || publicOrigin,
            tunnel: { can: !fixedOrigin && !publicOrigin && !!cfg.startTunnel, starting: !!tunnelStarting } });
        }
        if (act === 'minutes.md') return send(200, 'text/markdown; charset=utf-8', minutes.toMarkdown(mt), { 'cache-control': 'no-store' });
        if (act === 'minutes.json') return json(200, minutes.toJSON(mt));
        if (req.method !== 'POST') return json(405, { error: 'POST only' });
        const d = parseArgs(u, await readBody(req));
        if (act === 'start') {
          if (mt.pmEnabled && !mt.pmReady()) return json(409, { error: 'Approve the PM before starting the meeting' });
          // brief có N vai trò mà chưa đủ N agent (tính cả agent vắng): không bắt đầu, trừ khi chủ trì cố ý gửi force
          const need = rolesNeeded(d.roles), have = mt.state === 'LOBBY' ? mt._present().length : need;
          if (have < need && d.force !== true && d.force !== 'true')
            return json(409, { error: `Cần ${need} agent theo vai trò (đang có ${have}). Mời thêm agent hoặc bớt vai trò; gửi "force": true để vẫn bắt đầu.`, need, have });
          const ok = mt.start(d.context, d.endCondition, d.settings, d.roles);
          if (ok) audit('start', { room: rid(mt), agents: mt._present().map(a => a.name), force: have < need });
          return json(200, { ok });
        }
        if (act === 'stop') { if (mt.pmEnabled) pmFor(mt).host('pause'); mt.stop(); audit('stop', { room: rid(mt), state: mt.state }); return json(200, { ok: true }); }
        if (act === 'say') return json(200, { ok: mt.hostSay(d.text, d.to) });
        if (act === 'next') return json(200, { ok: mt.hostNextItem() });
        if (act === 'role') return json(200, { ok: mt.setRole(d.name, d.role) });
        if (act === 'task') return json(200, { ok: d.remove === true || d.remove === 'true' ? mt.hostRemoveTask(d.n, d.into) : mt.hostTask(d.n, d.status, d.note) });
        if (act === 'kick') { const ok = mt.kick(d.name); if (ok) audit('kick', { room: rid(mt), agent: String(d.name).slice(0, 40) }); return json(200, { ok }); }
        if (act === 'tunnel') {
          try { const o = await openTunnel(); log(`🌐 Địa chỉ công khai cho agent ở máy khác: ${o}`); audit('tunnel', { room: rid(mt), origin: o }); mt._changed(); return json(200, { origin: o }); }
          catch (e) { return json(400, { error: e.message }); }
        }
        if (act === 'connect') {
          // sửa cấu hình agent trên MÁY CHẠY SERVER: chỉ khi trang chủ trì mở trên chính máy đó
          if (where(req).via !== 'local' || !cfg.connect) return json(403, { error: 'Chỉ kết nối được trên máy chạy agent-meeting (mở trang chủ trì bằng http://localhost). Ở máy khác: chạy lệnh connect trong terminal.' });
          try { const r = cfg.connect(String(d.agent || '')); audit('connect', { agent: String(d.agent), ok: !!r.ok }); return json(200, r); } catch (e) { return json(400, { error: e.message }); }
        }
        if (act === 'admit') {
          const allow = !(d.allow === false || d.allow === 'false'), p0 = mt.pending.get(String(d.name ?? '')) || [...mt.pending.values()].find(x => x.name.toLowerCase() === String(d.name ?? '').trim().toLowerCase());
          const ok = mt.admit(d.name, allow);
          if (ok) audit(allow ? 'admit' : 'reject', { room: rid(mt), agent: p0?.name, model: p0?.model, via: p0?.via, ip: p0?.ip, code: p0?.code });
          return json(200, { ok });
        }
        if (act === 'new') {
          audit('new', { room: rid(mt), carry: d.carry === true || d.carry === 'true' });
          if (mt.state === 'LIVE' || mt.state === 'WORK') mt.stop('chủ trì mở cuộc họp mới', true);
          return json(200, { hostKey: renew(mt, d.carry === true || d.carry === 'true').hostKey });
        }
      }

      // Agent: IP đã gửi quá nhiều yêu cầu sai mã (dò mã phòng / mã riêng) thì tạm chặn
      const W = where(req), bad = () => rate.take(`bad:${W.ip}`, 20, 30);
      if ((p.startsWith('/a/') || p.startsWith('/mcp/')) && !rate.ok(`bad:${W.ip}`, 20, 30)) {
        res.writeHead(429, { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '60', ...SECURITY });
        return res.end('Quá nhiều yêu cầu sai mã từ địa chỉ này. Thử lại sau 1 phút, và dùng đúng URL/lệnh trong giao thức.');
      }
      // Tệp giữa các agent: gửi (bytes thô) và tải về
      if ((m = p.match(/^\/a\/(\w+)\/send$/))) { const mt = byAgent.get(m[1]); return await receive(req, res, mt, Object.fromEntries(u.searchParams), who(mt, req)); }
      if ((m = p.match(/^\/a\/(\w+)\/file\/(\w+)$/))) {
        const mt = byAgent.get(m[1]); if (!mt) { bad(); return text(404, GONE_TEXT); }
        const id = who(mt, req); if (!id || id.pending) { if (!id) bad(); return text(401, id ? PENDING_TEXT : AUTH_TEXT); }
        const f = mt.fileFor(id.name, m[2]);
        if (typeof f === 'string') return text(404, f);
        audit('file_get', { room: rid(mt), agent: id.name, file: f.name, sha256: f.sha256, ...where(req) });
        return serveFile(res, mt, f, () => mt.gotFile(f, id.name));
      }

      // API cho agent dạng văn bản (curl)
      if ((m = p.match(/^\/a\/(\w+)\/(\w+)$/))) {
        const mt = byAgent.get(m[1]);
        if (!mt) bad();
        const raw = req.method === 'POST' ? await readBody(req) : '';
        const base = `${fixedOrigin || origin}/a/${m[1]}`;
        const out = await invoke(mt, m[2], parseArgs(u, raw), { how: { base }, base, token: bearer(req), ...W, rate, bad, audit: mt && ((ev, d) => audit(ev, { room: rid(mt), ...d })) });
        if (out === null) return text(404, `Không có lệnh "${m[2]}". Các lệnh: ${TOOLS.map(t => t.name).join(', ')}, send, file.`);
        return text(out === AUTH_TEXT ? 401 : 200, out);
      }

      // MCP (JSON-RPC qua HTTP, Streamable HTTP không phiên)
      if ((m = p.match(/^\/mcp\/(\w+)$/))) {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST', ...SECURITY }); return res.end(); }
        const mt = byAgent.get(m[1]) || null;
        if (!mt) bad();
        let msg;
        try { msg = JSON.parse(await readBody(req)); } catch { return json(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); }
        // Streamable HTTP có phiên: server cấp Mcp-Session-Id lúc initialize, client gửi lại ở mọi request; danh tính agent
        // gắn với phiên này (không với tham số name). Client gửi kèm phiên cũ thì giữ nguyên.
        const init = [].concat(msg).some(x => x?.method === 'initialize');
        let sid = req.headers['mcp-session-id'];
        if (!/^[\w-]{16,128}$/.test(sid || '')) sid = init ? crypto.randomBytes(18).toString('base64url') : null;
        const base = `${fixedOrigin || origin}/a/${m[1]}`;
        const ctx = { how: null, base, sid, bridge: req.headers['x-agent-meeting-bridge'] === '1', ...W, rate, bad, audit: mt && ((ev, d) => audit(ev, { room: rid(mt), ...d })) };
        const run = (x) => sid || x?.method === 'initialize' || x?.method === 'ping' || x?.method === 'tools/list' || x?.id === undefined || x?.id === null ? rpc(mt, x, ctx)
          : { jsonrpc: '2.0', id: x.id, error: { code: -32600, message: 'Missing Mcp-Session-Id header: initialize first' } };
        const out = Array.isArray(msg) ? (await Promise.all(msg.map(run))).filter(Boolean) : await run(msg);
        const extra = sid ? { 'mcp-session-id': sid } : {};
        if (!out || (Array.isArray(out) && !out.length)) { res.writeHead(202, { ...SECURITY, ...extra }); return res.end(); }
        return send(200, 'application/json; charset=utf-8', JSON.stringify(out), { 'cache-control': 'no-store', ...extra });
      }
      text(404, 'not found');
    } catch (e) { log(`⚠ Lỗi xử lý ${req.method} ${p.replace(/\/(\w{6})\w+/g, '/$1…')}: ${e.message || e}`); if (!res.headersSent) json(500, { error: String(e.message || e) }); else res.end(); }
  }
  server.requestTimeout = 0; // long-poll và wait giữ kết nối lâu
  const app = { configStore, server, create, renew, meetings: byHost, limits: lim, ev: new EventEmitter(), setPublicOrigin: (o, fixed) => { publicOrigin = o; if (fixed) fixedOrigin = o; }, flush, restore, close: () => { const draining = [...pmOperators.values()].map(operator => operator.close()); draining.push(...[...workManagers.values()].map(manager => manager.close())); clearInterval(sweep); flush(); server.close(); server.closeAllConnections?.(); return Promise.allSettled(draining); } };
  return app;
}

module.exports = { createApp, TOOLS, webhookBody };
