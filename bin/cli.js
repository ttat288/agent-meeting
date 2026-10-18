#!/usr/bin/env node
'use strict';
// Một lệnh: chạy server + (tuỳ chọn) tunnel Cloudflare + tạo cuộc họp + mở trình duyệt cho chủ trì.
const { spawn, execSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');
const { createApp } = require('../src/server');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const opts = (n) => args.flatMap((a, i) => a === n && args[i + 1] ? [args[i + 1]] : []);
const env = process.env;

if (flag('-v') || flag('--version')) { console.log(require('../package.json').version); process.exit(0); }
if (flag('-h') || flag('--help')) {
  console.log(`agent-meeting — phòng họp cho nhiều AI agent

Dùng:  npx github:ttat288/agent-meeting [tuỳ chọn]

Mạng
  --local               Không bật tunnel (chỉ máy này / cùng mạng LAN)
  --public-url <url>    Địa chỉ công khai cố định (server công ty, reverse proxy, domain riêng);
                        không bật tunnel, prompt mời dùng địa chỉ này
  --port <n>            Cổng server (mặc định 3000 hoặc biến PORT; bận thì tự chọn cổng khác)

Cuộc họp (mặc định, đổi được trên web trước khi bắt đầu)
  --max <n>             Giới hạn số tin (mặc định 120)
  --idle <giây>         Im lặng bao lâu thì hỏi 1 agent có muốn kết thúc (mặc định 40)
  --time-limit <phút>   Giới hạn thời gian (mặc định 0 = không giới hạn)
  --turns               Chế độ phát biểu lần lượt

Lưu và chia sẻ kết quả
  --minutes-dir <thư mục>  Tự lưu biên bản .md + .json khi mỗi cuộc họp kết thúc
  --webhook <url>          Gửi tóm tắt (quyết định, việc cần làm) khi kết thúc; dùng nhiều lần được.
                           Hỗ trợ Slack, Discord, Google Chat; URL khác nhận JSON đầy đủ

Tự động hoá (chạy không cần người)
  --context <văn bản>      Bối cảnh cuộc họp
  --context-file <file>    Bối cảnh đọc từ file
  --end-condition <văn bản> Điều kiện kết thúc
  --agenda-file <file>     Chương trình họp, mỗi dòng một mục
  --auto-start <n>         Tự bắt đầu khi đủ n agent trong phòng chờ (cần --context/--context-file)
  --exit-on-end            Thoát chương trình khi cuộc họp kết thúc (sau khi lưu biên bản, gửi webhook)

Khác
  --no-open             Không tự mở trình duyệt
  -v, --version         In phiên bản

Biến môi trường tương đương: PORT, AGENT_MEETING_MINUTES_DIR, AGENT_MEETING_WEBHOOK (nhiều URL cách nhau bởi dấu phẩy),
AGENT_MEETING_PUBLIC_URL.`);
  process.exit(0);
}

const num = (n, d) => { const v = Number(opt(n, d)); return Number.isFinite(v) && v > 0 ? v : d; };
const readFile = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { console.error(`Lỗi: không đọc được file ${f}: ${e.message}`); process.exit(1); } };
const publicUrl = (opt('--public-url') || env.AGENT_MEETING_PUBLIC_URL || '').replace(/\/+$/, '');
const webhooks = [...opts('--webhook'), ...(env.AGENT_MEETING_WEBHOOK || '').split(',')].map(x => x.trim()).filter(Boolean);
const auto = {
  context: opt('--context-file') ? readFile(opt('--context-file')).trim() : (opt('--context') || ''),
  endCondition: opt('--end-condition') || '',
  agenda: opt('--agenda-file') ? readFile(opt('--agenda-file')) : undefined,
  startAt: num('--auto-start', 0),
};
for (const u of [publicUrl, ...webhooks].filter(Boolean)) if (!/^https?:\/\//.test(u)) { console.error(`Lỗi: "${u}" không phải URL http(s).`); process.exit(1); }
if (auto.startAt && !auto.context) { console.error('Lỗi: --auto-start cần --context hoặc --context-file.'); process.exit(1); }
const cfg = {
  maxMsgs: num('--max', 120), idleMs: num('--idle', 40) * 1000, timeLimitMin: num('--time-limit', 0),
  mode: flag('--turns') ? 'turns' : 'free',
  minutesDir: opt('--minutes-dir') || env.AGENT_MEETING_MINUTES_DIR || '',
  webhooks,
  log: (x) => console.log(x),
};
const dir = path.join(os.homedir(), '.agent-meeting');
const exe = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';

function download(url, dest) {
  return new Promise((ok, fail) => https.get(url, { headers: { 'user-agent': 'agent-meeting' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400) return download(r.headers.location, dest).then(ok, fail);
    if (r.statusCode !== 200) return fail(new Error('HTTP ' + r.statusCode));
    r.pipe(fs.createWriteStream(dest)).on('finish', ok).on('error', fail);
  }).on('error', fail));
}

async function findCloudflared() {
  try { execSync((process.platform === 'win32' ? 'where ' : 'command -v ') + 'cloudflared', { stdio: 'ignore' }); return 'cloudflared'; } catch {}
  const local = path.join(dir, exe);
  if (fs.existsSync(local)) return local;
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  const base = 'https://github.com/cloudflare/cloudflared/releases/latest/download/';
  fs.mkdirSync(dir, { recursive: true });
  console.log('Đang tải cloudflared từ GitHub của Cloudflare (một lần, ~40MB)...');
  if (process.platform === 'darwin') {
    const tgz = path.join(dir, 'cf.tgz');
    await download(`${base}cloudflared-darwin-${arch}.tgz`, tgz);
    execSync(`tar -xzf "${tgz}" -C "${dir}"`); fs.unlinkSync(tgz);
  } else if (process.platform === 'win32') await download(`${base}cloudflared-windows-${arch}.exe`, local);
  else await download(`${base}cloudflared-linux-${arch}`, local);
  fs.chmodSync(local, 0o755);
  return local;
}

function open(url) {
  try {
    const [cmd, a] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
    spawn(cmd, a, { stdio: 'ignore', detached: true }).unref();
  } catch {}
}

function listen(server, port) {
  return new Promise((ok, fail) => {
    server.once('error', (e) => e.code === 'EADDRINUSE' && port !== 0 ? listen(server, 0).then(ok, fail) : fail(e));
    server.listen(port, () => ok(server.address().port));
  });
}

(async () => {
  const app = createApp(cfg);
  const port = await listen(app.server, +opt('--port', env.PORT || 3000));
  const meeting = app.create();
  if (auto.agenda !== undefined) meeting.configure({ agenda: auto.agenda });
  let origin = `http://localhost:${port}`, tunnel = null;

  if (publicUrl) { origin = publicUrl; app.setPublicOrigin(origin); }
  else if (!flag('--local')) {
    const bin = await findCloudflared();
    const cf = tunnel = spawn(bin, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], { stdio: ['ignore', 'ignore', 'pipe'] });
    process.on('exit', () => cf.kill());
    console.log('Đang bật tunnel công khai...');
    origin = await new Promise((ok, fail) => {
      let buf = ''; const t = setTimeout(() => fail(new Error('Tunnel không lên được sau 40s')), 40000);
      cf.stderr.on('data', d => { buf += d; const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) { clearTimeout(t); ok(m[0]); } });
      cf.on('exit', () => fail(new Error('cloudflared đã thoát')));
    });
    app.setPublicOrigin(origin);
  }
  ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { console.log('\nĐã tắt Agent Meeting.'); process.exit(0); }));

  const host = `${origin}/m/${meeting.hostKey}`;
  const line = '─'.repeat(64);
  console.log(`\n${line}\n  Agent Meeting v${require('../package.json').version} đã sẵn sàng\n${line}\n
  Trang chủ trì:  ${host}${origin.startsWith('https') ? `\n  Trên máy này:   http://localhost:${port}/m/${meeting.hostKey}` : ''}

  1. Mở trang chủ trì, viết bối cảnh cuộc họp.
  2. Bấm "Sao chép" prompt mời và dán cho từng agent.
  3. Khi agent đã vào phòng chờ, bấm "Bắt đầu cuộc họp".

  Mời agent (dán cho agent chạy được curl):
    ${origin}/a/${meeting.id}/join   (gửi kèm name=<tên> và model=<model>)
  MCP (Streamable HTTP):  ${origin}/mcp/${meeting.id}
${cfg.minutesDir ? `\n  Biên bản sẽ tự lưu vào: ${path.resolve(cfg.minutesDir)}` : ''}${webhooks.length ? `\n  Gửi tóm tắt tới ${webhooks.length} webhook khi kết thúc` : ''}${auto.startAt ? `\n  Tự bắt đầu khi đủ ${auto.startAt} agent trong phòng chờ` : ''}

  Giữ cửa sổ này mở suốt cuộc họp. Ctrl+C để tắt.
  Link chủ trì chứa mã bí mật: đừng chia sẻ.\n${line}`);

  // Tự động hoá: tự bắt đầu khi đủ người, tự thoát khi kết thúc
  if (auto.startAt) {
    const check = () => {
      if (meeting.state !== 'LOBBY') return meeting.ev.off('change', check);
      const n = meeting.snapshot().agents.filter(a => a.status !== 'left' && a.status !== 'kicked').length;
      if (n >= auto.startAt) {
        meeting.ev.off('change', check);
        meeting.start(auto.context, auto.endCondition);
        console.log(`▶ Đã tự bắt đầu cuộc họp với ${n} agent.`);
      }
    };
    meeting.ev.on('change', check);
  }
  if (flag('--exit-on-end')) app.ev.on('ended', () => { console.log('Cuộc họp đã kết thúc, thoát.'); setTimeout(() => process.exit(0), 200); });
  if (tunnel) {
    // Địa chỉ tunnel mới cần một lúc để DNS nhận ra; chờ ở đây rồi mới mở trình duyệt
    process.stdout.write('\nĐang chờ địa chỉ công khai có hiệu lực');
    let ok = false;
    for (let i = 0; i < 60 && !ok; i++) {
      try { ok = (await fetch(origin + '/healthz')).ok; } catch {}
      if (!ok) { process.stdout.write('.'); await new Promise(r => setTimeout(r, 2000)); }
    }
    console.log(ok ? ' sẵn sàng ✓' : '\nChưa truy cập được qua mạng. Thử mở link sau ít phút; nếu vẫn lỗi, chạy lại chương trình.');
    tunnel.on('exit', () => console.error('\n⚠ Tunnel Cloudflare đã ngắt: máy khác không vào được nữa. Hãy tắt (Ctrl+C) và chạy lại để có link mới.'));
  }
  if (!flag('--no-open') && !auto.startAt) open(host);
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
