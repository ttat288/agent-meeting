#!/usr/bin/env node
'use strict';
// Capture the real Foxul UI from disposable local APIs, then record the local motion composition.
// No model, network service, system install or product runtime dependency is used.
// PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_BIN=/path/to/chromium node tools/record-foxul-video.js [output-dir]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createApp } = require('../src/server');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'docs', 'showcase'));
const reuseVideo = process.argv.includes('--reuse-video');
const composition = path.join(__dirname, 'foxul-video');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'foxul-video-'));
const captureDir = path.join(temp, 'capture');
const qaDir = path.join(temp, 'qa');
const logo = path.join(root, 'assets', 'brand', 'foxul.png');
const videoOut = path.join(output, 'foxul-demo.webm');
const posterOut = path.join(output, 'foxul-demo-poster.png');
const manifestOut = path.join(output, 'foxul-demo-manifest.json');
const subtitleOut = path.join(output, 'foxul-demo.vi.vtt');
for (const dir of [output, captureDir, qaDir]) fs.mkdirSync(dir, { recursive: true });

const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const postForm = async (base, url, data, token) => {
  const response = await fetch(base + url, {
    method: 'POST',
    headers: token ? { authorization: 'Bearer ' + token } : {},
    body: new URLSearchParams(data)
  });
  assert.ok(response.ok, 'HTTP ' + response.status + ' ' + url);
  return response.text();
};
const contentType = file => file.endsWith('.html') ? 'text/html; charset=utf-8'
  : file.endsWith('.css') ? 'text/css; charset=utf-8'
  : file.endsWith('.js') ? 'text/javascript; charset=utf-8'
  : file.endsWith('.png') ? 'image/png'
  : file.endsWith('.vtt') ? 'text/vtt; charset=utf-8'
  : file.endsWith('.webm') ? 'video/webm' : 'application/octet-stream';
const serveFile = (res, file) => {
  const stat = fs.statSync(file);
  res.writeHead(200, { 'content-type': contentType(file), 'content-length': stat.size, 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  fs.createReadStream(file).pipe(res);
};
const serveVideo = (req, res, file) => {
  const size = fs.statSync(file).size;
  const range = req.headers.range;
  if (!range) return serveFile(res, file);
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end(); }
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= size) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end(); }
  res.writeHead(206, { 'content-type': 'video/webm', 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  fs.createReadStream(file, { start, end }).pipe(res);
};

async function encodeComposition(page, outputFile) {
  const ffmpeg = process.env.FFMPEG_BIN || '/home/theo/.cache/ms-playwright/ffmpeg-1013/ffmpeg-linux';
  assert.ok(fs.existsSync(ffmpeg), 'Missing local FFmpeg encoder: ' + ffmpeg);
  const fps = 30, duration = 46, frames = fps * duration;
  const processHandle = spawn(ffmpeg, ['-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0', '-y', '-an', '-r', String(fps), '-c:v', 'libvpx-vp9', '-crf', '29', '-b:v', '0', '-deadline', 'realtime', '-cpu-used', '7', '-threads', '4', '-pix_fmt', 'yuv420p', outputFile], { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  processHandle.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-12000); });
  const write = buffer => new Promise((resolve, reject) => {
    if (processHandle.stdin.write(buffer)) return resolve();
    const cleanup = () => { processHandle.stdin.off('drain', onDrain); processHandle.stdin.off('error', onError); };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = error => { cleanup(); reject(error); };
    processHandle.stdin.once('drain', onDrain);
    processHandle.stdin.once('error', onError);
  });
  for (let frame = 0; frame < frames; frame++) {
    await page.evaluate(time => window.renderAt(time), frame / fps);
    await write(await page.screenshot({ type: 'jpeg', quality: 92 }));
  }
  processHandle.stdin.end();
  const result = await new Promise(resolve => processHandle.once('close', (code, signal) => resolve({ code, signal })));
  assert.equal(result.code, 0, 'FFmpeg failed: ' + JSON.stringify(result) + '\n' + stderr);
  return { fps, duration, frames, encoder: ffmpeg };
}

async function captureProduct(browser) {
  const appRoot = path.join(temp, 'app');
  const app = createApp({ admit: 'none', configDir: path.join(appRoot, 'config'), workDir: path.join(appRoot, 'work') });
  const room = app.create({ hostKey: 'foxul_video_host_disposable', id: 'foxul_video_invite_disposable', followUp: true });
  const names = ['Minh · Workflow', 'Lan · Quality', 'Sam · Tooling'];
  const keys = new Map();
  const errors = [];
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const agent = (index, tool, data = {}) => postForm(base, '/a/' + room.id + '/' + tool, { name: names[index], ...data }, keys.get(index));
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const shot = async name => {
    await page.locator('#toasts > *').waitFor({ state: 'hidden' });
    await page.mouse.move(1590, 890);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(captureDir, name + '.png') });
  };
  try {
    await page.goto(base + '/m/' + room.hostKey + '?lang=en');
    await page.locator('#ctx').fill('How can annotators review keypoint tracking faster without trusting interpolation blindly?\n\nStart with confirmed frames 1 and 10. Compare interpolation, independent prelabels and human corrections. Debate when to inspect frame 5, when to extend to 15, and what should stop that extension.\n\nAgree on a pilot workflow and three validation tasks. Treat confidence as a clue, not proof. This is a scripted product demo, not a validated CVAT algorithm.');
    await page.locator('#followUp').evaluate(element => { element.closest('details').open = true; });
    await page.locator('#followUp').check();
    await page.locator('#followUp').evaluate(element => { element.closest('details').open = false; });
    await shot('brief');
    await page.locator('#btnNextStep').click();
    for (let i = 0; i < names.length; i++) {
      const reply = await agent(i, 'join', { model: 'Scripted demo' });
      const match = reply.match(/Bearer ([\w-]+)/);
      assert.ok(match, 'Join must return an agent key');
      keys.set(i, match[1]);
    }
    await page.waitForFunction(() => !document.querySelector('#btnStart').disabled);
    await page.locator('#btnStart').click();
    await page.locator('#room:not([hidden])').waitFor();
    const say = async (index, text) => {
      const before = await page.locator('#feedIn .msg').count();
      await agent(index, 'say', { text });
      await page.waitForFunction(expected => document.querySelectorAll('#feedIn .msg').length > expected, before);
    };
    await say(0, 'I would start with **frames 1 → 10**. Confirm both anchors, then review frames 2–9. Only extend to 15 once this first segment passes human review.');
    await shot('perspectives');
    await say(1, 'A confidence of **0.98 at frame 10** says little about frame 5. A turn or occlusion can hide in the middle. Compare interpolation, prelabels and the human-confirmed point.');
    await say(2, 'Show a review queue with the image first, suggestions second. Flag disagreement near **frame 5** and preserve the point source and track ID.');
    await shot('challenge');
    await say(0, 'If frame 5 is wrong, add an anchor there and recheck **1 → 5** and **5 → 10**. An identity switch stops the extension.');
    await say(2, 'Keep review actions reversible. Record the prelabel version and interpolation source so every comparison can be reproduced.');
    await say(1, 'Before reviewing fewer frames, measure missed errors and review time against a full-review baseline. Keep a blind random sample; we have **no validated threshold yet**.');
    await page.locator('#hostMsg').fill('Please conclude with the pilot decision, its limits, and three tasks. No work has been implemented or verified.');
    await page.locator('#btnSend').click();
    const conclusion = 'CONCLUSION: Pilot with confirmed anchors 1 and 10; review every intermediate frame. Correct frame 5 and split the segment when needed. Extend to 15 only after human review. Keep interpolation, prelabels and corrections separate. No threshold is validated yet.\nTASK: Minh · Workflow | Map the annotator review flow and anchor corrections for frames 1 → 10 → 15 | Before pilot\nTASK: Lan · Quality | Prepare reference clips for turns, occlusion and identity switches; define independent review | Before pilot\nTASK: Sam · Tooling | Prototype a comparison queue that preserves point source, track ID and human edits | After flow review';
    await say(0, conclusion);
    await page.waitForFunction(() => document.querySelectorAll('#feedIn .msg').length >= 8);
    await shot('decision');
    await page.locator('#sessionNav a[href="#plan"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.ws-task').length === 3);
    const tasks = await page.locator('.ws-task').evaluateAll(cards => cards.map(card => ({
      id: card.dataset.taskId,
      owner: card.querySelector('.ws-task-label')?.textContent?.trim() || '',
      status: card.querySelector('.ws-pill')?.textContent?.trim() || ''
    })));
    await shot('plan');
    await page.locator('.ws-task-source > a').first().click();
    await page.locator('#room:not([hidden])').waitFor();
    assert.match(page.url(), /#message-/);
    await shot('source');
    assert.equal(tasks.length, 3);
    assert.ok(tasks.every(task => /planned/i.test(task.status)), JSON.stringify(tasks));
    assert.deepEqual(errors, []);
    return { base, consoleErrors: errors, tasks };
  } finally {
    await context.close();
    app.close();
  }
}

async function main() {
  assert.ok(fs.existsSync(logo), 'Missing approved Foxul logo');
  assert.ok(fs.existsSync(subtitleOut), 'Missing Vietnamese subtitle track');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_BIN || '/opt/brave.com/brave/brave' });
  let server;
  try {
    const product = await captureProduct(browser);
    const routes = new Map([
      ['/', path.join(composition, 'index.html')],
      ['/index.html', path.join(composition, 'index.html')],
      ['/style.css', path.join(composition, 'style.css')],
      ['/timeline.js', path.join(composition, 'timeline.js')],
      ['/logo.png', logo],
      ['/favicon.ico', logo],
      ['/subtitles.vtt', subtitleOut]
    ]);
    server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        if (url.pathname.startsWith('/capture/')) {
          const name = path.basename(url.pathname);
          return serveFile(res, path.join(captureDir, name));
        }
        if (url.pathname === '/output/foxul-demo.webm') return serveVideo(req, res, videoOut);
        const file = routes.get(url.pathname);
        if (!file) { res.writeHead(404); return res.end('Not found'); }
        serveFile(res, file);
      } catch (error) { res.writeHead(500); res.end(error.message); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;

    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const renderErrors = [];
    page.on('pageerror', error => renderErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') renderErrors.push(message.text()); });
    await page.goto(origin + '/');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth));
    const encoded = reuseVideo && fs.existsSync(videoOut)
      ? { fps: 30, duration: 46, frames: 1380, encoder: process.env.FFMPEG_BIN || '/home/theo/.cache/ms-playwright/ffmpeg-1013/ffmpeg-linux', reusedExisting: true }
      : await encodeComposition(page, videoOut);
    await page.close();
    await context.close();
    assert.deepEqual(renderErrors, []);

    const posterContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const posterPage = await posterContext.newPage();
    await posterPage.goto(origin + '/');
    await posterPage.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    await posterPage.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth));
    await posterPage.evaluate(() => window.renderAt(1.15));
    await posterPage.screenshot({ path: posterOut });
    await posterContext.close();

    const playback = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const playbackErrors = [];
    playback.on('pageerror', error => playbackErrors.push(error.message));
    playback.on('console', message => { if (message.type() === 'error') playbackErrors.push(message.text()); });
    await playback.setContent('<video id="video" muted playsinline preload="auto" style="width:1920px;height:1080px" crossorigin="anonymous"><source src="' + origin + '/output/foxul-demo.webm" type="video/webm"><track kind="subtitles" src="' + origin + '/subtitles.vtt" srclang="vi" label="Tiếng Việt"></video>');
    const metadata = await playback.evaluate(() => new Promise((resolve, reject) => {
      const video = document.getElementById('video');
      const ready = () => resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
      video.addEventListener('loadedmetadata', ready, { once: true });
      video.addEventListener('error', () => reject(Error(video.error?.message || 'Video load failed')), { once: true });
      if (video.readyState >= 1) ready();
    }));
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.height, 1080);
    assert.ok(metadata.duration >= 45.8 && metadata.duration <= 47.5, 'Unexpected duration ' + metadata.duration);
    const qaTimes = [0.8, metadata.duration / 2, metadata.duration - 0.8];
    for (let index = 0; index < qaTimes.length; index++) {
      await playback.evaluate(time => new Promise(resolve => {
        const video = document.getElementById('video');
        video.addEventListener('seeked', resolve, { once: true });
        video.currentTime = time;
      }), qaTimes[index]);
      await playback.locator('#video').screenshot({ path: path.join(qaDir, ['start', 'middle', 'end'][index] + '.png') });
    }
    await playback.evaluate(() => { const video = document.getElementById('video'); video.currentTime = 0; return video.play(); });
    await playback.waitForFunction(() => document.getElementById('video').ended, null, { timeout: 55000 });
    await playback.evaluate(() => { document.getElementById('video').textTracks[0].mode = 'hidden'; });
    await playback.waitForFunction(() => document.getElementById('video').textTracks[0].cues?.length === 8);
    const subtitleCues = await playback.evaluate(() => document.getElementById('video').textTracks[0].cues.length);
    assert.equal(subtitleCues, 8);
    assert.deepEqual(playbackErrors, []);
    await playback.close();

    const timelineSource = fs.readFileSync(path.join(composition, 'timeline.js'), 'utf8');
    const timeline = Array.from(timelineSource.matchAll(/\{ id:'([^']+)', start:([0-9.]+), end:([0-9.]+)/g), match => ({ id: match[1], start: Number(match[2]), end: Number(match[3]) }));
    const sources = ['src/server.js', 'src/ui/index.html', 'src/ui/app.css', 'src/ui/app.js', 'src/ui/workspace.html', 'src/ui/workspace.css', 'src/ui/workspace.js', 'assets/brand/foxul.png', 'tools/record-foxul-video.js', 'tools/foxul-video/index.html', 'tools/foxul-video/style.css', 'tools/foxul-video/timeline.js'];
    const manifest = {
      schema: 'foxul/demo-video@1',
      recordedAt: new Date().toISOString(),
      language: 'English on-screen copy with Vietnamese WebVTT subtitles',
      disclosure: 'Edited demo. Scripted participants use real disposable local HTTP APIs. No AI/model calls. Three research tasks remain planned; no completed or verified research is depicted.',
      source: {
        branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
        head: git(['rev-parse', 'HEAD']),
        dirty: Boolean(git(['status', '--short', '--untracked-files=all'])),
        diffSha256: crypto.createHash('sha256').update(execFileSync('git', ['diff', '--binary', '--no-ext-diff'], { cwd: root, maxBuffer: 128 * 1024 * 1024 })).digest('hex'),
        files: Object.fromEntries(sources.map(relative => [relative, sha256(path.join(root, relative))]))
      },
      capture: { viewport: '1600x900', colorScheme: 'dark', isolatedTempRoot: true, realLocalHttpApis: true, scriptedParticipants: true, modelCalls: 0, tasks: product.tasks, consoleErrors: product.consoleErrors },
      edit: { viewport: '1920x1080', fpsTarget: 30, durationTargetSeconds: 46, renderedFrames: encoded.frames, encoder: encoded.encoder, audio: 'none', palette: { obsidian: '#0B0D12', indigo: '#4F46E5', coolIndigo: '#8B93FF', ivory: '#F4F3EF' }, timeline },
      output: {
        video: { file: 'foxul-demo.webm', codec: 'VP9/WebM via Playwright local recorder', bytes: fs.statSync(videoOut).size, sha256: sha256(videoOut), ...metadata },
        poster: { file: 'foxul-demo-poster.png', bytes: fs.statSync(posterOut).size, sha256: sha256(posterOut), width: 1920, height: 1080 },
        subtitles: { file: 'foxul-demo.vi.vtt', cues: subtitleCues, sha256: sha256(subtitleOut) }
      },
      qa: { watchedFromStartToEnded: true, startMiddleEndDecoded: true, decodedFrameHashes: Object.fromEntries(['start', 'middle', 'end'].map(name => [name, sha256(path.join(qaDir, name + '.png'))])), renderConsoleErrors: renderErrors, playbackConsoleErrors: playbackErrors }
    };
    fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + '\n');
    console.log(JSON.stringify({ video: videoOut, poster: posterOut, manifest: manifestOut, metadata, qaDir }, null, 2));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await browser.close();
    // The temp directory contains only disposable capture/profile/video intermediates created by this run.
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
