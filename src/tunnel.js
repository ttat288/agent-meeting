'use strict';
// Tunnel Cloudflare miễn phí (quick tunnel): chỉ bật khi chủ trì cần mời agent ở máy khác (nút trên trang chủ trì,
// hoặc --tunnel). Agent cùng máy dùng thẳng http://localhost:<cổng>, dữ liệu không rời máy.
const { spawn, execSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');

const home = () => process.env.AGENT_MEETING_HOME || path.join(os.homedir(), '.agent-meeting');
const exe = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';

function download(url, dest) {
  return new Promise((ok, fail) => https.get(url, { headers: { 'user-agent': 'agent-meeting' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400) return download(r.headers.location, dest).then(ok, fail);
    if (r.statusCode !== 200) return fail(new Error('HTTP ' + r.statusCode));
    r.pipe(fs.createWriteStream(dest)).on('finish', ok).on('error', fail);
  }).on('error', fail));
}

async function findCloudflared(log) {
  try { execSync((process.platform === 'win32' ? 'where ' : 'command -v ') + 'cloudflared', { stdio: 'ignore' }); return 'cloudflared'; } catch {}
  const dir = home(), local = path.join(dir, exe);
  if (fs.existsSync(local)) return local;
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  const base = 'https://github.com/cloudflare/cloudflared/releases/latest/download/';
  fs.mkdirSync(dir, { recursive: true });
  log('Đang tải cloudflared từ GitHub của Cloudflare (một lần, ~40MB)...');
  if (process.platform === 'darwin') {
    const tgz = path.join(dir, 'cf.tgz');
    await download(`${base}cloudflared-darwin-${arch}.tgz`, tgz);
    execSync(`tar -xzf "${tgz}" -C "${dir}"`); fs.unlinkSync(tgz);
  } else if (process.platform === 'win32') await download(`${base}cloudflared-windows-${arch}.exe`, local);
  else await download(`${base}cloudflared-linux-${arch}`, local);
  fs.chmodSync(local, 0o755);
  return local;
}

// Bật tunnel tới cổng local; trả về { origin, proc } khi địa chỉ công khai đã truy cập được.
async function start(port, log = () => {}) {
  const bin = await findCloudflared(log);
  const proc = spawn(bin, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], { stdio: ['ignore', 'ignore', 'pipe'] });
  process.on('exit', () => proc.kill());
  log('Đang bật tunnel công khai...');
  const origin = await new Promise((ok, fail) => {
    let buf = ''; const t = setTimeout(() => fail(new Error('Tunnel không lên được sau 40s')), 40000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) { clearTimeout(t); ok(m[0]); } });
    proc.on('exit', () => { clearTimeout(t); fail(new Error('cloudflared đã thoát')); });
  });
  // địa chỉ tunnel mới cần một lúc để DNS nhận ra
  let ok = false;
  for (let i = 0; i < 60 && !ok; i++) {
    try { ok = (await fetch(origin + '/healthz')).ok; } catch {}
    if (!ok) await new Promise(r => setTimeout(r, 2000));
  }
  if (!ok) log('⚠ Địa chỉ công khai chưa truy cập được; thử lại sau ít phút.');
  proc.on('exit', () => log('⚠ Tunnel Cloudflare đã ngắt: agent ở máy khác không vào được nữa.'));
  return { origin, proc };
}

module.exports = { start, findCloudflared, home };
