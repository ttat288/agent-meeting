#!/usr/bin/env node
'use strict';
// Một lệnh: chạy server + (tuỳ chọn) tunnel Cloudflare + tạo cuộc họp + mở trình duyệt cho chủ trì.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const { createApp } = require('../src/server');
const tunnel = require('../src/tunnel');
const { parseBrief, toBrief, rolesNeeded } = require('../src/brief');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const opts = (n) => args.flatMap((a, i) => a === n && args[i + 1] ? [args[i + 1]] : []);
const env = process.env;

if (args[0] === 'skills' || args[0] === 'doctor') {
  try { require('../src/cli-discovery').run(args); }
  catch (e) { console.error('Lỗi: ' + e.message); process.exitCode = 1; }
  return;
}

if (args[0] === 'install' || args[0] === 'uninstall') {
  try { process.exit(require('../src/desktop-install').runCLI(args)); }
  catch (e) { console.error('Install error: ' + e.message); process.exit(1); }
}
if (flag('-v') || flag('--version')) { console.log(require('../package.json').version); process.exit(0); }
// agent-meeting connect|disconnect <claude|codex|gemini> [--room <URL mời>]: người dùng tự chạy, một lần cho mỗi máy
if (args[0] === 'connect' || args[0] === 'disconnect') {
  const { connect, disconnect, AGENTS } = require('../src/connect');
  const agent = args[1];
  if (!AGENTS[agent]) {
    console.error(`Dùng: npx github:ttat288/foxul ${args[0]} <${Object.keys(AGENTS).join('|')}>${args[0] === 'connect' ? ' [--room <URL mời của phòng ở máy khác>]' : ''}`);
    process.exit(1);
  }
  try { const r = (args[0] === 'connect' ? connect : disconnect)(agent, { room: opt('--room') }); process.exit(r.ok ? 0 : 2); }
  catch (e) { console.error('Lỗi: ' + e.message); process.exit(1); }
}
if (flag('-h') || flag('--help')) {
  console.log(`agent-meeting — phòng họp cho nhiều AI agent

Dùng:  npx github:ttat288/foxul [tuỳ chọn]
       npx github:ttat288/foxul connect <claude|codex|gemini> [--room <URL mời>]
       npx github:ttat288/foxul disconnect <claude|codex|gemini>
       npx github:ttat288/foxul install [--dry-run]
       npx github:ttat288/foxul uninstall [--dry-run]
       agent-meeting doctor
       agent-meeting skills list [--local] [--dir <thư mục skills>] [--query <từ>] [--graph] [--offset <n>] [--limit <n>]
       agent-meeting skills show <tên> [--local] [--dir <thư mục skills>] [--resource <file>]
       agent-meeting skills inspect <tên> [--local] [--dir <thư mục skills>]

connect: một lần cho mỗi máy, cài MCP "agent-meeting" cho agent (qua CLI của chính agent đó) và cấp quyền đúng các tool
hội thoại, để agent (cả Claude Code ở auto mode) vào họp không phải duyệt từng lệnh. Gửi tệp vẫn được hỏi từng lần.
--room: phòng ở máy khác (URL mời trên trang chủ trì của máy đó). Không có --room: phòng trên chính máy này.

Mạng (mặc định: chỉ máy này, http://localhost:<cổng>; agent cùng máy không cần Internet)
  --tunnel              Bật ngay tunnel công khai (Cloudflare) cho agent ở máy khác. Không có cờ này thì
                        chủ trì bấm "Máy khác" trên trang khi cần
  --local               Không bao giờ bật tunnel
  --lan                 Nghe cả mạng LAN (0.0.0.0), không chỉ máy này (Docker cần cờ này)
  --public-url <url>    Địa chỉ công khai cố định (server công ty, reverse proxy, domain riêng);
                        không bật tunnel, prompt mời dùng địa chỉ này
  --remote-host         Cho mở trang chủ trì qua tunnel (mặc định chỉ mở trên máy này)
  --port <n>            Cổng server (mặc định 3000 hoặc biến PORT; bận thì tự chọn cổng khác)
  --host-key <mã>       Mã chủ trì cố định: link /m/<mã> không đổi qua các lần khởi động, cuộc họp mới
                        dùng lại đúng link này (16-64 ký tự chữ, số, _; tạo bằng: openssl rand -hex 16)
  --agent-key <mã>      Mã phòng cố định cho agent: lệnh cài MCP / prompt mời không đổi khi khởi động lại

Ai được vào phòng
  --admit <all|remote|none>  all (mặc định): chủ trì duyệt từng agent (đối chiếu mã 4 số);
                        remote: chỉ duyệt agent ở máy khác; none: ai có prompt mời là vào (chỉ dùng cho họp tự động
                        trong mạng kín, ví dụ --auto-start)

Cuộc họp (mặc định, đổi được trên web trước khi bắt đầu)
  --max <n>             Giới hạn số tin (mặc định 120)
  --idle <giây>         Im lặng bao lâu thì hỏi 1 agent có muốn kết thúc (mặc định 40)
  --time-limit <phút>   Giới hạn thời gian (mặc định 0 = không giới hạn)
  --turns               Chế độ phát biểu lần lượt
  --follow-up           Giữ phòng để báo tiến độ: sau khi chốt, agent rời họp đi làm việc được giao rồi
                        báo tiến độ (progress); phòng đóng khi mọi việc đã báo xong

Lưu và chia sẻ kết quả
  --minutes-dir <thư mục>  Tự lưu biên bản .md + .json khi mỗi cuộc họp kết thúc
  --webhook <url>          Gửi tóm tắt (quyết định, việc cần làm) khi kết thúc (với --follow-up: khi chốt,
                           khi từng việc xong/vướng, khi đóng phòng); dùng nhiều lần được.
                           Hỗ trợ Slack, Discord, Google Chat; URL khác nhận JSON đầy đủ
  --config-dir <thư mục>   Cấu hình admin/routing (mặc định ~/.agent-meeting/config)
  --work-dir <thư mục>     Task/run/workspace riêng (mặc định ~/.agent-meeting/work)
  --data-dir <thư mục>     Lưu trạng thái phòng (cần --host-key): tắt/khởi động lại server giữa cuộc họp
                           thì nạp lại và họp tiếp. File chứa mã bí mật, chỉ chủ máy đọc được (quyền 600).
                           Tệp agent gửi nhau cũng được ghi ở đây (<mã chủ trì>.files/)

Kiểm toán và lưu giữ
  --audit-log <file>       Ghi nhật ký kiểm toán JSONL (quyền 600): agent vào/được duyệt/bị từ chối, gửi/tải tệp,
                           thao tác của chủ trì, tin bị chặn vì có dạng bí mật. Không ghi nội dung tin, tệp hay mã
  --retention <ngày>       Tự xoá biên bản (--minutes-dir) và trạng thái phòng cũ (--data-dir) quá số ngày này

Gửi tệp giữa các agent (curl --data-binary; nội dung không đi qua tin nhắn)
  --max-file-mb <n>        Cỡ tối đa mỗi tệp (mặc định 20; tunnel Cloudflare miễn phí giới hạn ~100)
  --max-room-mb <n>        Tổng dung lượng tệp mỗi phòng (mặc định 200), tối đa 100 tệp

Tự động hoá (chạy không cần người)
  --brief-file <file>      Bản brief JSON (bối cảnh, chương trình, tuỳ chọn, vai trò; cùng định dạng với nút
                           "Sao chép JSON" trên trang chủ trì). Thay cho --context-file + --agenda-file
  --context <văn bản>      Bối cảnh cuộc họp
  --context-file <file>    Bối cảnh đọc từ file
  --end-condition <văn bản> Điều kiện kết thúc
  --agenda-file <file>     Chương trình họp, mỗi dòng một mục
  --auto-start <n>         Tự bắt đầu khi đủ n agent trong phòng chờ (cần --brief-file hoặc --context/--context-file)
  --exit-on-end            Thoát chương trình khi cuộc họp kết thúc (sau khi lưu biên bản, gửi webhook)

Khác
  --no-open             Không tự mở trình duyệt
  -v, --version         In phiên bản

Biến môi trường tương đương: PORT, AGENT_MEETING_MINUTES_DIR, AGENT_MEETING_WEBHOOK (nhiều URL cách nhau bởi dấu phẩy),
AGENT_MEETING_PUBLIC_URL, AGENT_MEETING_HOST_KEY, AGENT_MEETING_AGENT_KEY, AGENT_MEETING_DATA_DIR, AGENT_MEETING_FOLLOW_UP=1,
AGENT_MEETING_MAX_FILE_MB, AGENT_MEETING_MAX_ROOM_MB, AGENT_MEETING_ADMIT, AGENT_MEETING_LAN=1, AGENT_MEETING_AUDIT_LOG, AGENT_MEETING_RETENTION_DAYS.`);
  process.exit(0);
}

const num = (n, d) => { const v = Number(opt(n, d)); return Number.isFinite(v) && v > 0 ? v : d; };
const readFile = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { console.error(`Lỗi: không đọc được file ${f}: ${e.message}`); process.exit(1); } };
const publicUrl = (opt('--public-url') || env.AGENT_MEETING_PUBLIC_URL || '').replace(/\/+$/, '');
const webhooks = [...opts('--webhook'), ...(env.AGENT_MEETING_WEBHOOK || '').split(',')].map(x => x.trim()).filter(Boolean);
const hostKey = opt('--host-key') || env.AGENT_MEETING_HOST_KEY || '';
const agentKey = opt('--agent-key') || env.AGENT_MEETING_AGENT_KEY || '';
for (const k of [hostKey, agentKey].filter(Boolean)) if (!/^\w{16,64}$/.test(k)) { console.error(`Lỗi: mã "${k}" phải dài 16-64 ký tự chữ, số hoặc _ (tạo bằng: openssl rand -hex 16).`); process.exit(1); }
if (hostKey && hostKey === agentKey) { console.error('Lỗi: --host-key và --agent-key phải khác nhau (ai có mã agent không được điều khiển cuộc họp).'); process.exit(1); }
for (const u of [publicUrl, ...webhooks].filter(Boolean)) if (!/^https?:\/\//.test(u)) { console.error(`Lỗi: "${u}" không phải URL http(s).`); process.exit(1); }
const admit = opt('--admit') || env.AGENT_MEETING_ADMIT || 'all';
if (!['all', 'remote', 'none'].includes(admit)) { console.error('Lỗi: --admit phải là all, remote hoặc none.'); process.exit(1); }
const lan = flag('--lan') || /^(1|true|yes)$/i.test(env.AGENT_MEETING_LAN || '');
const dataDir = opt('--data-dir') || env.AGENT_MEETING_DATA_DIR || '';
if (dataDir && !hostKey) { console.error('Lỗi: --data-dir cần --host-key (link chủ trì phải cố định thì mới nạp lại được cuộc họp sau khi khởi động lại).'); process.exit(1); }
const cfg = {
  maxMsgs: num('--max', 120), idleMs: num('--idle', 40) * 1000, timeLimitMin: num('--time-limit', 0),
  mode: flag('--turns') ? 'turns' : 'free',
  followUp: flag('--follow-up') || /^(1|true|yes)$/i.test(env.AGENT_MEETING_FOLLOW_UP || ''),
  minutesDir: opt('--minutes-dir') || env.AGENT_MEETING_MINUTES_DIR || '',
  dataDir,
  configDir: opt('--config-dir') || env.AGENT_MEETING_CONFIG_DIR,
  workDir: opt('--work-dir') || env.AGENT_MEETING_WORK_DIR,
  maxFileMb: num('--max-file-mb', Number(env.AGENT_MEETING_MAX_FILE_MB) || 20),
  maxRoomMb: num('--max-room-mb', Number(env.AGENT_MEETING_MAX_ROOM_MB) || 200),
  webhooks, admit, lan, remoteHost: flag('--remote-host'),
  auditLog: opt('--audit-log') || env.AGENT_MEETING_AUDIT_LOG || '',
  retentionDays: num('--retention', Number(env.AGENT_MEETING_RETENTION_DAYS) || 0),
  log: (x) => console.log(x),
};
// Bản brief (bối cảnh + tuỳ chọn dạng JSON, cùng định dạng với trang chủ trì): --brief-file, hoặc ghép từ --context-file…
// Trường thiếu trong brief lấy theo tham số dòng lệnh (--max, --follow-up…).
const base = { settings: { mode: cfg.mode, maxMsgs: cfg.maxMsgs, idleSec: cfg.idleMs / 1000, timeLimitMin: cfg.timeLimitMin, followUp: cfg.followUp } };
let brief = null;
if (opt('--brief-file')) {
  const f = opt('--brief-file'), clash = ['--context', '--context-file', '--end-condition', '--agenda-file'].filter(o => opt(o));
  if (clash.length) { console.error(`Lỗi: --brief-file đã gồm bối cảnh và chương trình họp, đừng dùng kèm ${clash.join(', ')}.`); process.exit(1); }
  const r = parseBrief(readFile(f), base);
  const at = (x) => `${f}${x.line ? ':' + x.line : ''}: ${x.msg}`;
  for (const w of r.warnings) console.warn('⚠ ' + at(w));
  if (!r.ok) { for (const e of r.errors) console.error('Lỗi: ' + at(e)); process.exit(1); }
  brief = r.brief;
} else if (opt('--context') || opt('--context-file') || opt('--end-condition') || opt('--agenda-file')) {
  brief = toBrief({
    context: opt('--context-file') ? readFile(opt('--context-file')) : (opt('--context') || ''),
    endCondition: opt('--end-condition') || '',
    agenda: opt('--agenda-file') ? readFile(opt('--agenda-file')) : [],
    ...base.settings,
  }, base);
}
const autoStart = num('--auto-start', 0);
if (autoStart && !brief?.context) { console.error('Lỗi: --auto-start cần bối cảnh (--brief-file, --context hoặc --context-file).'); process.exit(1); }
if (autoStart && admit === 'all') { console.error('Lỗi: --auto-start không có người bấm duyệt agent. Thêm --admit none (ai có prompt mời là vào, chỉ dùng trong mạng kín) hoặc --admit remote.'); process.exit(1); }
if (autoStart && autoStart < rolesNeeded(brief.roles)) { console.error(`Lỗi: bản brief có ${rolesNeeded(brief.roles)} vai trò nhưng --auto-start ${autoStart}: cần ít nhất ${rolesNeeded(brief.roles)} agent.`); process.exit(1); }
function open(url) {
  try {
    const [cmd, a] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
    spawn(cmd, a, { stdio: 'ignore', detached: true }).unref();
  } catch {}
}

// mặc định chỉ nghe máy này (127.0.0.1); --lan nghe mọi interface
function listen(server, port, host) {
  return new Promise((ok, fail) => {
    server.once('error', (e) => e.code === 'EADDRINUSE' && port !== 0 ? listen(server, 0, host).then(ok, fail) : fail(e));
    server.listen(port, host, () => ok(server.address().port));
  });
}

(async () => {
  let port;
  const conn = require('../src/connect');
  // nút "Kết nối" trên trang chủ trì (chỉ nhận từ chính máy này): chạy đúng lệnh connect như trong terminal
  cfg.connect = (agent) => { const lines = []; const r = conn.connect(agent, { out: (l) => lines.push(l) }); lines.forEach(l => console.log(l)); return { ...r, log: lines.join('\n') }; };
  // tunnel chỉ bật khi chủ trì bấm "Máy khác" (hoặc --tunnel); --local / --public-url thì không bao giờ
  if (!flag('--local') && !publicUrl) cfg.startTunnel = async () => (await tunnel.start(port, cfg.log)).origin;
  const app = createApp(cfg);
  port = await listen(app.server, +opt('--port', env.PORT || 3000), lan ? '0.0.0.0' : '127.0.0.1');
  const restored = hostKey ? app.restore(hostKey) : null;
  const meeting = restored || app.create({ hostKey: hostKey || undefined, id: agentKey || undefined, fixed: !!hostKey });
  if (restored) {
    console.log(`↻ Đã nạp lại cuộc họp đã lưu (${{ LOBBY: 'phòng chờ', LIVE: 'đang họp', ENDED: 'đã kết thúc' }[meeting.state]}, ${meeting.log.length} dòng diễn biến) từ ${path.resolve(dataDir)}`);
    if (agentKey && agentKey !== meeting.id) console.log('⚠ Cuộc họp đã lưu dùng mã agent khác --agent-key: giữ mã cũ để agent đang họp vẫn vào được.');
  }
  if (brief && !restored) { meeting.configure(brief.settings); meeting.preset = brief; }
  if (!publicUrl) try { conn.setLocalRoom(`http://localhost:${port}`, meeting.id); } catch (e) { console.log(`⚠ Không ghi được ${conn.roomsPath()}: ${e.message}`); }
  const local = `http://localhost:${port}`;
  let origin = local;
  if (publicUrl) { origin = publicUrl; app.setPublicOrigin(origin, true); }
  else if (flag('--tunnel') && cfg.startTunnel) { origin = await cfg.startTunnel(); app.setPublicOrigin(origin); }
  if (cfg.retentionDays) {
    const { prune } = require('../src/retention');
    const run = () => prune({ minutesDir: cfg.minutesDir, dataDir, days: cfg.retentionDays, keep: [...app.meetings.keys()] }, cfg.log);
    run(); setInterval(run, 6 * 3600 * 1000).unref();
  }
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\nĐang dừng tiến trình được quản lý và lưu kết quả…');
    try { await app.close(); app.flush(); console.log('Đã tắt Foxul.'); process.exit(0); }
    catch (e) { console.error('Không thể hoàn tất tắt an toàn:', e.message); process.exit(1); }
  };
  ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, shutdown));

  // trang chủ trì luôn mở trên máy này (trừ --public-url: công ty tự bảo vệ bằng proxy)
  const host = `${publicUrl || local}/m/${meeting.hostKey}`;
  const line = '─'.repeat(64);
  console.log(`\n${line}\n  Foxul v${require('../package.json').version} đã sẵn sàng\n${line}\n
  Trang chủ trì:  ${host}

  1. Mở trang chủ trì, viết bối cảnh cuộc họp.
  2. Bấm "Sao chép" prompt mời và dán cho từng agent.
  3. Khi agent đã vào phòng chờ, bấm "Bắt đầu cuộc họp".

  Mời agent (dán cho agent chạy được curl):
    ${origin}/a/${meeting.id}/join   (gửi kèm name=<tên> và model=<model>)
  MCP (Streamable HTTP):  ${origin}/mcp/${meeting.id}${origin === local && cfg.startTunnel ? `
  Agent ở máy khác: bấm "Máy khác" trong thẻ mời trên trang chủ trì để bật địa chỉ công khai.` : ''}
  Ai được vào: ${{ all: 'chủ trì duyệt từng agent trên trang (đối chiếu mã 4 số)', remote: 'agent máy này vào ngay, agent máy khác chờ chủ trì duyệt', none: 'ai có prompt mời là vào (--admit none)' }[admit]}
${cfg.auditLog ? `\n  Nhật ký kiểm toán: ${path.resolve(cfg.auditLog)}` : ''}${cfg.retentionDays ? `\n  Tự xoá biên bản/trạng thái cũ hơn ${cfg.retentionDays} ngày` : ''}${cfg.minutesDir ? `\n  Biên bản sẽ tự lưu vào: ${path.resolve(cfg.minutesDir)}` : ''}${dataDir ? `\n  Trạng thái phòng lưu ở: ${path.resolve(dataDir)} (khởi động lại thì họp tiếp)` : ''}${webhooks.length ? `\n  Gửi tóm tắt tới ${webhooks.length} webhook khi kết thúc` : ''}${cfg.followUp ? '\n  Giữ phòng để báo tiến độ sau khi chốt (--follow-up)' : ''}${autoStart ? `\n  Tự bắt đầu khi đủ ${autoStart} agent trong phòng chờ` : ''}

  Giữ cửa sổ này mở suốt cuộc họp. Ctrl+C để tắt.
  Link chủ trì chứa mã bí mật: đừng chia sẻ.\n${line}`);

  // Tự động hoá: tự bắt đầu khi đủ người, tự thoát khi kết thúc
  if (autoStart) {
    const check = () => {
      if (meeting.state !== 'LOBBY') return meeting.ev.off('change', check);
      const n = meeting.snapshot().agents.filter(a => a.status !== 'left' && a.status !== 'kicked').length;
      if (n >= autoStart) {
        meeting.ev.off('change', check);
        const b = meeting.preset || brief;
        meeting.start(b.context, b.endCondition, b.settings, b.roles);
        console.log(`▶ Đã tự bắt đầu cuộc họp với ${n} agent.`);
      }
    };
    meeting.ev.on('change', check);
  }
  if (flag('--exit-on-end')) app.ev.on('ended', () => { console.log('Cuộc họp đã kết thúc, thoát.'); setTimeout(shutdown, 200); });
  if (!flag('--no-open') && !autoStart) open(host);
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
