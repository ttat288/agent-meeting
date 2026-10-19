'use strict';
// `agent-meeting connect <claude|codex|gemini> [--room <URL mời>]` — người dùng TỰ chạy, một lần cho mỗi máy:
//   1. chép cầu nối MCP (src/bridge.js) vào ~/.agent-meeting/mcp.js;
//   2. đăng ký nó làm MCP server "agent-meeting" bằng CLI chính chủ của agent (claude/codex/gemini mcp add);
//   3. cấp quyền HẸP đúng tên các tool hội thoại (Claude Code: permissions.allow trong ~/.claude/settings.json;
//      Gemini: ~/.gemini/policies/agent-meeting.toml). Tool gửi tệp (send_file) KHÔNG được cấp sẵn: mỗi lần gửi tệp
//      vẫn để công cụ của agent hỏi/kiểm duyệt.
// Sửa file cấu hình nào cũng sao lưu trước, ghi nguyên tử, in rõ đã đổi gì; `disconnect` gỡ đúng những thứ đã thêm.
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const { TOOLS } = require('./server');
const pkg = require('../package.json');

const NAME = 'agent-meeting';
const home = () => process.env.AGENT_MEETING_HOME || path.join(os.homedir(), '.agent-meeting');
const userHome = () => process.env.AGENT_MEETING_USER_HOME || os.homedir(); // test đặt HOME giả
const bridgePath = () => path.join(home(), 'mcp.js');
const roomsPath = () => path.join(home(), 'rooms.json');
// tool được cấp quyền sẵn: mọi tool hội thoại của server + get_file (chỉ ghi vào thư mục làm việc); KHÔNG có send_file
const ALLOWED = [...TOOLS.map(t => t.name), 'get_file'];
const AGENTS = { claude: 'Claude Code', codex: 'Codex CLI', gemini: 'Gemini CLI' };

function writeAtomic(file, text, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, { mode });
  fs.renameSync(tmp, file);
}
function backup(file, out) {
  if (!fs.existsSync(file)) return null;
  const b = `${file}.bak-agent-meeting-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(file, b);
  out(`  sao lưu ${file} -> ${b}`);
  return b;
}

// ---------- rooms.json: phòng nào cầu nối sẽ vào ----------
function readRooms() { try { const c = JSON.parse(fs.readFileSync(roomsPath(), 'utf8')); return c && typeof c === 'object' && c.rooms ? c : { rooms: {} }; } catch { return { rooms: {} }; } }
function saveRooms(c) { fs.mkdirSync(home(), { recursive: true, mode: 0o700 }); writeAtomic(roomsPath(), JSON.stringify(c, null, 2) + '\n'); }
// server trên máy này gọi khi khởi động: cầu nối của mọi agent trên máy sẽ vào phòng này
function setLocalRoom(url, room) { const c = readRooms(); c.rooms.local = { url, room }; c.current = 'local'; saveRooms(c); }
// URL mời của phòng ở máy khác: .../a/<mã>[/join] hoặc .../mcp/<mã>
function parseRoom(u) {
  let x; try { x = new URL(u); } catch { return null; }
  const m = x.pathname.match(/^\/(?:a|mcp)\/(\w+)(?:\/join)?\/?$/);
  return m && /^https?:$/.test(x.protocol) ? { url: x.origin, room: m[1] } : null;
}

// ---------- tìm CLI của agent ----------
function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
}
function newest(globDir, file) { // <globDir>/<phiên bản>/<mã>/<file>: bản Claude Code đi kèm ứng dụng desktop
  try {
    return fs.readdirSync(globDir).flatMap(v => { try { return fs.readdirSync(path.join(globDir, v)).map(h => path.join(globDir, v, h, file)); } catch { return []; } })
      .filter(f => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
  } catch { return null; }
}
function findCli(agent) {
  const env = process.env[`AGENT_MEETING_${agent.toUpperCase()}_BIN`];
  if (env) return env;
  const onPath = which(agent);
  if (onPath) return onPath;
  const h = userHome(), exe = process.platform === 'win32' ? `${agent}.exe` : agent;
  if (agent === 'claude') {
    const dirs = process.platform === 'darwin' ? [path.join(h, 'Library/Application Support/Claude/claude-code')]
      : process.platform === 'win32' ? [path.join(process.env.APPDATA || path.join(h, 'AppData/Roaming'), 'Claude/claude-code')]
      : [path.join(h, '.config/Claude/claude-code')];
    for (const d of dirs) { const f = newest(d, exe); if (f) return f; }
    const local = path.join(h, '.claude/local', exe); if (fs.existsSync(local)) return local;
  }
  if (agent === 'codex') for (const f of ['/usr/lib/chatgpt/resources/codex', '/Applications/ChatGPT.app/Contents/Resources/codex']) if (fs.existsSync(f)) return f;
  return null;
}
const q = (x) => /[\s"'$`\\]/.test(x) ? JSON.stringify(x) : x;
function run(bin, args, out) {
  out(`  $ ${[bin, ...args].map(q).join(' ')}`);
  const r = spawnSync(bin, args, { encoding: 'utf8', timeout: 60000 });
  const msg = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (msg) out(msg.split('\n').map(l => '    ' + l).join('\n'));
  return r.status === 0;
}

// ---------- quyền ----------
const claudeSettings = () => path.join(userHome(), '.claude', 'settings.json');
const claudeRules = () => ALLOWED.map(t => `mcp__${NAME}__${t}`);
function editClaudeAllow(add, out) {
  const file = claudeSettings();
  let s = {};
  if (fs.existsSync(file)) {
    try { s = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { out(`  ⚠ ${file} không phải JSON hợp lệ (${e.message}): không sửa. Tự thêm vào permissions.allow: ${claudeRules().join(', ')}`); return false; }
  }
  const allow = Array.isArray(s.permissions?.allow) ? s.permissions.allow : [];
  const rules = claudeRules(), next = add ? [...allow, ...rules.filter(r => !allow.includes(r))] : allow.filter(r => !rules.includes(r));
  if (next.length === allow.length && next.every((r, i) => r === allow[i])) { out(`  ${file}: ${add ? 'đã có đủ quyền' : 'không có quyền nào của agent-meeting'}`); return true; }
  backup(file, out);
  s.permissions = { ...(s.permissions || {}), allow: next };
  writeAtomic(file, JSON.stringify(s, null, 2) + '\n', fs.existsSync(file) ? fs.statSync(file).mode & 0o777 : 0o600);
  out(`  ${file}: ${add ? 'thêm' : 'gỡ'} permissions.allow ${rules.join(', ')}`);
  return true;
}
const geminiPolicy = () => path.join(userHome(), '.gemini', 'policies', 'agent-meeting.toml');
function writeGeminiPolicy(add, out) {
  const f = geminiPolicy();
  if (!add) { if (fs.existsSync(f)) { fs.rmSync(f); out(`  xoá ${f}`); } return true; }
  const body = `# Do "agent-meeting connect gemini" tạo: cho phép các tool hội thoại của phòng họp chạy không cần hỏi.\n# send_file (gửi tệp ra khỏi máy) KHÔNG có ở đây nên vẫn hỏi. Gỡ: agent-meeting disconnect gemini\n`
    + ALLOWED.map(t => `\n[[rule]]\nmcpName = "${NAME}"\ntoolName = "${t}"\ndecision = "allow"\npriority = 200\n`).join('');
  writeAtomic(f, body, 0o644);
  out(`  ghi ${f} (cho phép ${ALLOWED.join(', ')})`);
  return true;
}

// ---------- connect / disconnect ----------
function installBridge(out) {
  const src = fs.readFileSync(path.join(__dirname, 'bridge.js'), 'utf8')
    .replace("'__VERSION__'", JSON.stringify(pkg.version))
    .replace('/*TOOLS*/[]/*END*/', JSON.stringify(TOOLS));
  fs.mkdirSync(home(), { recursive: true, mode: 0o700 });
  writeAtomic(bridgePath(), src, 0o644);
  out(`  cầu nối MCP: ${bridgePath()}`);
}

// opts: { room?: URL mời phòng ở máy khác, out: (dòng) => void }. Trả về { ok, manual?: [lệnh người dùng tự chạy] }
function connect(agent, opts = {}) {
  const out = opts.out || console.log;
  if (!AGENTS[agent]) throw new Error(`agent phải là: ${Object.keys(AGENTS).join(', ')}`);
  out(`Kết nối ${AGENTS[agent]} với agent-meeting (một lần cho máy này):`);
  if (opts.room) {
    const r = parseRoom(opts.room);
    if (!r) throw new Error(`"${opts.room}" không phải URL mời (dạng https://…/a/<mã>/join hoặc https://…/mcp/<mã>)`);
    const c = readRooms(), key = new URL(r.url).host;
    c.rooms[key] = r; c.current = key; saveRooms(c);
    out(`  phòng: ${r.url} (lưu trong ${roomsPath()})`);
  }
  installBridge(out);
  const node = process.execPath, bin = findCli(agent);
  const add = { claude: ['mcp', 'add', '-s', 'user', NAME, '--', node, bridgePath()], codex: ['mcp', 'add', NAME, '--', node, bridgePath()],
    gemini: ['mcp', 'add', '-s', 'user', NAME, node, bridgePath()] }[agent];
  const remove = { claude: ['mcp', 'remove', '-s', 'user', NAME], codex: ['mcp', 'remove', NAME], gemini: ['mcp', 'remove', '-s', 'user', NAME] }[agent];
  let ok = true; const manual = [];
  if (bin) {
    if (agent === 'codex') backup(path.join(userHome(), '.codex', 'config.toml'), out); // codex viết lại toàn bộ file
    spawnSync(bin, remove, { encoding: 'utf8', timeout: 60000 }); // cài lại sạch (đường dẫn node/cầu nối có thể đã đổi)
    ok = run(bin, add, out);
  } else {
    ok = false;
    manual.push(`${agent} ${add.map(q).join(' ')}`);
    out(`  ⚠ Không tìm thấy lệnh "${agent}". Tự chạy lệnh này trong terminal:\n    ${manual[0]}`);
  }
  if (agent === 'claude') ok = editClaudeAllow(true, out) && ok;
  if (agent === 'gemini') ok = writeGeminiPolicy(true, out) && ok;
  out(ok ? `Xong. Mở lại phiên ${AGENTS[agent]} (MCP được nạp khi bắt đầu phiên), rồi dán prompt "Đã kết nối" trên trang chủ trì.\nGỡ: npx github:ttat288/agent-meeting disconnect ${agent}`
    : 'Chưa xong hết: làm nốt các bước ⚠ ở trên.');
  return { ok, manual };
}

function disconnect(agent, opts = {}) {
  const out = opts.out || console.log;
  if (!AGENTS[agent]) throw new Error(`agent phải là: ${Object.keys(AGENTS).join(', ')}`);
  out(`Gỡ agent-meeting khỏi ${AGENTS[agent]}:`);
  const bin = findCli(agent);
  const remove = { claude: ['mcp', 'remove', '-s', 'user', NAME], codex: ['mcp', 'remove', NAME], gemini: ['mcp', 'remove', '-s', 'user', NAME] }[agent];
  if (bin) { if (agent === 'codex') backup(path.join(userHome(), '.codex', 'config.toml'), out); run(bin, remove, out); }
  else out(`  ⚠ Không tìm thấy lệnh "${agent}": tự chạy ${agent} ${remove.join(' ')}`);
  if (agent === 'claude') editClaudeAllow(false, out);
  if (agent === 'gemini') writeGeminiPolicy(false, out);
  out('Xong.');
  return { ok: true };
}

module.exports = { connect, disconnect, setLocalRoom, readRooms, parseRoom, findCli, bridgePath, roomsPath, claudeRules, ALLOWED, AGENTS, home };
