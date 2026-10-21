#!/usr/bin/env node
'use strict';
// Independent browser check of the final ENDED/WORK structure. Uses only temporary data.
// PLAYWRIGHT_MODULE=/path/to/playwright node tools/check-showcase.js /tmp/am-showcase-check
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createApp } = require('../src/server');
const out = path.resolve(process.argv[2] || '/tmp/am-showcase-check'); fs.mkdirSync(out, { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'am-showcase-check-'));
const app = createApp({ configDir: temp + '/config', workDir: temp + '/work' });
const rooms = ['ended', 'work', 'empty'].map(state => {
  const room = app.create({ hostKey: 'showcase_check_' + state, id: 'showcase_agent_' + state, fixed: true, followUp: state === 'work' });
  room.start('Stress fixture: long Vietnamese / English task names and retained source.', '', {});
  if (state !== 'empty') room.hostSay('KẾT LUẬN: Keep the source and independent evidence.\n' + [1, 2, 3].map(n => 'VIỆC: Nhóm chất lượng và workflow / Independent review team | ' + ('Kiểm nguồn nội suy và prelabel, review occlusion / Preserve source and review identity switches ' + n + ' ').repeat(3) + ' | Before independent pilot review').join('\n'));
  room.stop(); return room;
});
let browser;
(async () => {
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_BIN || '/opt/brave.com/brave/brave' });
  const page = await browser.newPage({ acceptDownloads: true }), rows = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const ready = () => page.locator('#ended:not([hidden]) h3').waitFor();
  for (const room of rooms) for (const lang of ['en', 'vi']) for (const theme of ['light', 'dark']) for (const width of [375, 768, 1280]) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 608 });
    await page.goto(base + '/m/' + room.hostKey + '?lang=' + lang + '#conversation'); await page.reload(); await ready();
    const r = await page.evaluate(() => ({ feed: document.querySelector('#feed').getBoundingClientRect().height, footer: document.querySelector('#ended').getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > innerWidth, repeatedTables: document.querySelectorAll('#ended table').length }));
    assert.ok(r.feed > 250); assert.equal(r.overflow, false); assert.equal(r.repeatedTables, 0);
    await page.locator('#ended summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#ended details').getAttribute('open'), '');
    assert.ok(await page.locator('#ended a[download]').isVisible());
    assert.ok(await page.locator('#feed').evaluate(e => e.getBoundingClientRect().height > 200));
    await page.keyboard.press('Space'); assert.equal(await page.locator('#ended details').getAttribute('open'), null);
    rows.push({ room: room.state, taskCount: room.actions.length, lang, theme, width, ...r });
    if (room === rooms[0] && lang === 'vi' && theme === 'light' && [375,1280].includes(width)) await page.screenshot({ path: out + '/ended-' + width + '.png' });
  }
  await page.setViewportSize({width:1280,height:608});
  await page.goto(base + '/m/' + rooms[0].hostKey + '?lang=en#plan');
  await page.waitForFunction(() => document.querySelectorAll('.ws-task').length === 3);
  const firstId = await page.locator('.ws-task').first().getAttribute('data-task-id');
  await page.locator('.ws-task-source > a').first().click(); await ready(); assert.ok(page.url().includes('#message-'));
  assert.ok(await page.locator('.msg.source-focus').count() || await page.locator('.msg.conclusion').isVisible());
  await page.reload(); await ready(); assert.ok(page.url().includes('#message-'));
  await page.goBack(); await page.locator('.ws-task').first().waitFor();
  assert.equal(await page.locator('.ws-task').first().getAttribute('data-task-id'), firstId);
  await page.locator('#sessionNav a[href="#conversation"]').click(); await ready();
  await page.locator('#ended summary').click();
  const downloadPromise = page.waitForEvent('download'); await page.locator('#ended a[download]').click();
  const download = await downloadPromise; await download.saveAs(out + '/minutes.json');
  assert.equal(JSON.parse(fs.readFileSync(out + '/minutes.json')).actions.length, 3);
  const carryRequest = page.waitForResponse(r => r.url().endsWith('/new') && r.request().method() === 'POST');
  await page.locator('#btnCarry').click(); assert.ok((await carryRequest).ok());
  await page.locator('#ctx').waitFor();
  const carried = await (await fetch(base + '/api/host/' + rooms[0].hostKey + '/work')).json();
  assert.equal(carried.tasks[0].id, firstId);
  // Real browser zoom in a new disposable profile and extension; no global/browser settings changed.
  await browser.close(); browser = null;
  const ext = temp + '/extension'; fs.mkdirSync(ext);
  fs.writeFileSync(ext + '/manifest.json', JSON.stringify({manifest_version:3,name:'Disposable showcase zoom check',version:'1.0',permissions:['tabs'],host_permissions:['http://127.0.0.1/*'],background:{service_worker:'background.js'}}));
  fs.writeFileSync(ext + '/background.js', 'chrome.runtime.onInstalled.addListener(()=>{});');
  const context = await chromium.launchPersistentContext(temp + '/zoom-profile',{headless:true,executablePath:process.env.BROWSER_BIN || '/opt/brave.com/brave/brave',viewport:{width:1280,height:800},args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker'); const p = await context.newPage();
    await p.goto(base + '/m/' + rooms[1].hostKey + '?lang=vi#conversation'); await p.locator('#ended:not([hidden]) h3').waitFor();
    const actualZoom = await worker.evaluate(async () => { const tabs = await chrome.tabs.query({}); const tab = tabs.find(t => t.url?.includes('/m/showcase_check_work')); await chrome.tabs.setZoom(tab.id,2); return chrome.tabs.getZoom(tab.id); });
    assert.equal(actualZoom,2); await p.waitForFunction(() => innerWidth === 640);
    const zoom = await p.evaluate(() => ({width:innerWidth,height:innerHeight,feed:document.querySelector('#feed').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(zoom.overflow,false); assert.ok(zoom.feed > 100); await p.screenshot({path:out+'/zoom200.png'});
    assert.deepEqual(errors, []);
    fs.writeFileSync(out + '/checks.json', JSON.stringify({rows,journey:['Plan → source → reload → Back preserves task ID','keyboard Enter/Space opens/closes footer','JSON minutes download contains three actions','carry retains task UUID'],zoom:{actualZoom,...zoom},errors},null,2)+'\n');
    console.log(rows.length+' layout/keyboard checks; source/reload/Back/download/carry; browser zoom '+actualZoom);
  } finally { await context.close(); }
})().catch(e => { console.error(e); process.exitCode=1; }).finally(async () => { await browser?.close(); for(const room of app.meetings.values()) room.stop('cleanup',true); app.close(); fs.rmSync(temp,{recursive:true,force:true}); });
