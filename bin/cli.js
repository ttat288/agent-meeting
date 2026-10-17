#!/usr/bin/env node
'use strict';
// Một lệnh: chạy server + (tuỳ chọn) tunnel Cloudflare + tạo cuộc họp + mở trình duyệt cho chủ trì.
const { spawn, execSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');
const { createApp } = require('../src/server');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

if (flag('-h') || flag('--help')) {
  console.log(`agent-meeting — phòng họp cho nhiều AI agent

Dùng:  npx github:ttat288/agent-meeting [tuỳ chọn]

  --local        Không bật tunnel (chỉ máy này / cùng mạng LAN)
  --port <n>     Cổng server (mặc định 3000, bận thì tự chọn cổng khác)
  --max <n>      Giới hạn số tin nhắn của cuộc họp (mặc định 120)
  --idle <giây>  Im lặng bao lâu thì hỏi 1 agent có muốn kết thúc không (mặc định 40)
  --no-open      Không tự mở trình duyệt`);
  process.exit(0);
}

const cfg = { maxMsgs: +opt('--max', 120), idleMs: +opt('--idle', 40) * 1000 };
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
  const port = await listen(app.server, +opt('--port', 3000));
  const meeting = app.create();
  let origin = `http://localhost:${port}`;

  if (!flag('--local')) {
    const bin = await findCloudflared();
    const cf = spawn(bin, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], { stdio: ['ignore', 'ignore', 'pipe'] });
    process.on('exit', () => cf.kill());
    console.log('Đang bật tunnel công khai...');
    origin = await new Promise((ok, fail) => {
      let buf = ''; const t = setTimeout(() => fail(new Error('Tunnel không lên được sau 40s')), 40000);
      cf.stderr.on('data', d => { buf += d; const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) { clearTimeout(t); ok(m[0]); } });
      cf.on('exit', () => fail(new Error('cloudflared đã thoát')));
    });
  }
  ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => process.exit(0)));

  const host = `${origin}/m/${meeting.hostKey}`;
  console.log(`\nCuộc họp đã sẵn sàng.\n\n  Trang chủ trì:  ${host}\n\nMở trang đó, viết bối cảnh, mời agent bằng nút "Sao chép prompt", rồi bấm Bắt đầu.\nGiữ cửa sổ này mở suốt cuộc họp. Ctrl+C để tắt.\nTrang chủ trì chứa mã bí mật, đừng chia sẻ link đó.`);
  if (!flag('--local')) {
    // Địa chỉ tunnel mới cần một lúc để DNS nhận ra; chờ ở đây rồi mới mở trình duyệt
    process.stdout.write('\nĐang chờ địa chỉ công khai có hiệu lực');
    let ok = false;
    for (let i = 0; i < 60 && !ok; i++) {
      try { ok = (await fetch(origin + '/')).ok; } catch {}
      if (!ok) { process.stdout.write('.'); await new Promise(r => setTimeout(r, 2000)); }
    }
    console.log(ok ? ' sẵn sàng ✓' : '\nChưa truy cập được qua mạng. Thử mở link sau ít phút; nếu vẫn lỗi, chạy lại chương trình.');
  }
  if (!flag('--no-open')) open(host);
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
