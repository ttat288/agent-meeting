'use strict';
// Disposable integrated browser check, including the previous access-recovery gap.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const csv = require('../test/fixtures/csv-retry'), { createApp } = require('../src/server');
const { ConfigStore } = require('../src/config-store'), { observationStore } = require('../src/routing-tools');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const output = path.resolve(process.env.AM_SKILL_EVIDENCE || path.join(__dirname, '../docs/evidence/task-skills'));
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-skill-browser-')), source = path.join(root, 'source'); csv.seed(source);
  fs.mkdirSync(path.join(source, '.agents/skills/task-rules'), { recursive: true });
  fs.writeFileSync(path.join(source, '.agents/skills/task-rules/SKILL.md'), '---\nname: task-rules\ndescription: Task handoff rules\n---\nPreserve task ID, conditions, evidence and unknowns. Do not change tests.\n');
  fs.writeFileSync(path.join(source, '.gitignore'), '.agents/\n');
  const prompts = [], calls = [], geometry = [], pageErrors = [], consoleErrors = [], native = csv.participant(prompts);
  let probeFails = false, probeIdentity = null, browser;
  const app = createApp({ configDir: root + '/config', workDir: root + '/work', dataDir: root + '/rooms', runCli: async args => {
    const probe = args.prompt.includes('READY'); calls.push(probe ? 'probe' : 'task');
    if (probe && probeIdentity) return { status: 'reported', reportedModel: probeIdentity, text: 'Scripted identity observation, not a native model call', exitCode: 0 };
    if (!probe && prompts.length >= 2) {
      prompts.push(JSON.parse(args.prompt));
      return { status: 'reported', reportedModel: args.modelId, text: 'Scripted metadata-recovery report; source unchanged, not a model call.', exitCode: 0 };
    }

    return probe && probeFails ? { status: 'failed', reportedModel: 'unknown', error: 'Fixture model access denied', exitCode: 1 } : native(args);
  } });
  const host = 'host_task_skills_browser_1234'; app.create({ hostKey: host, id: 'agent_task_skills_browser_1234', fixed: true }); csv.enable(app.configStore);
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + app.server.address().port, base = origin + '/api/host/' + host + '/';
  const request = async (endpoint, body) => { const response = await fetch(base + endpoint, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); assert(response.ok, await response.clone().text()); return response.json(); };
  const expire = () => {
    const shared = observationStore(app.configStore), saved = shared.read();
    const local = new ConfigStore({ dir: path.join(root, 'work', sha(host)), defaults: () => ({ observations: [] }), validate: () => {} }), state = local.read();
    const old = list => list.map(o => ({ ...o, checkedAt: new Date(Date.now() - 31 * 60000).toISOString() }));
    saved.observations = old(saved.observations); shared.save(saved, saved.revision);
    state.observations = old(state.observations); local.save(state, state.revision);
  };
  try {
    fs.mkdirSync(output, { recursive: true });
    await request('start', { context: csv.goal, agenda: [] }); await request('say', { text: 'CONCLUSION: Preserve CSV cells.\nTASK: Dev | Fix CSV escaping | today' });
    const initial = (await request('work')).tasks[0];
    const task = await request('work/tasks/' + initial.id + '/configure', { expectedRevision: initial.requirementRevision, purpose: 'execute', management: 'managed', workspace: source,
      writePaths: ['csv-cell.js'], testFiles: ['test/csv-cell.test.js'], acceptance: csv.acceptance,
      skillPolicy: { catalog: 'local', required: ['task-rules'], optional: [], tools: [] } });
    await request('runtime/probe', { profileId: 'opus-claude' });
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_BIN || '/opt/brave.com/brave/brave', args: ['--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 812 }, colorScheme: 'dark' });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    const url = (lang, view = 'execute') => origin + '/m/' + host + '?lang=' + lang + '#' + view;
    const run = async (lang = 'en') => {
      await page.locator('select[id^="profile-"]').selectOption('opus-claude');
      await page.getByRole('button', { name: lang === 'en' ? 'Run in isolated workspace' : 'Chạy trong workspace riêng', exact: true }).click();
    };
    const state = () => request('work');
    const waitStatus = async status => { for (let i = 0; i < 300; i++) { const s = await state(); if (s.runs.at(-1)?.status === status) return s; await new Promise(r => setTimeout(r, 10)); } throw Error('Expected run status ' + status); };
    await page.goto(url('en')); await run(); await waitStatus('reported');
    await page.getByRole('link', { name: 'Results', exact: true }).click();
    await page.getByRole('button', { name: 'Verify with Node tests', exact: true }).click(); await waitStatus('failed');
    expire();
    for (const lang of ['vi', 'en']) for (const colorScheme of ['light', 'dark']) for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 }); await page.emulateMedia({ colorScheme }); await page.goto(url(lang));
      const count = calls.length; await run(lang);
      await page.locator('.ws-access-recovery[role=alert]').waitFor(); assert.equal(calls.length, count, 'Blocked Run must not call a native runtime');
      const measured = await page.evaluate(() => {
        const box = document.querySelector('.ws-access-recovery'), r = box.getBoundingClientRect(), button = box.querySelector('button').getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth, role: box.getAttribute('role'), boxWidth: r.width, buttonWidth: button.width,
          hasRecovery: !!box.querySelector('a[href*="section=runtime"]'), text: box.innerText, focusWithin: box.contains(document.activeElement) };
      });
      assert(!measured.overflow); assert(measured.hasRecovery); assert(measured.focusWithin);
      geometry.push({ lang, colorScheme, width, ...measured });
      if (width === 375 && colorScheme === 'dark') await page.screenshot({ path: path.join(output, 'recovery-' + lang + '.png'), fullPage: true });
      await page.reload(); assert.equal((await state()).runs.length, 1); assert.equal(calls.length, count, 'Reload must not probe or run');
    }
    await page.setViewportSize({ width: 1280, height: 812 }); await page.goto(url('en')); await run();
    probeFails = true; await page.getByRole('button', { name: 'Probe selected profile access (invokes the CLI)', exact: true }).click();
    await page.getByText('Model access could not be confirmed.', { exact: false }).waitFor();
    assert.equal((await state()).runs.length, 1);
    probeFails = false;
    const identityGeometry = [];
    for (const identity of ['unknown', 'different-machine-model']) for (const lang of ['vi', 'en']) for (const colorScheme of ['light', 'dark']) for (const width of [375, 768, 1280]) {
      probeIdentity = identity;
      await page.setViewportSize({ width, height: 812 }); await page.emulateMedia({ colorScheme }); await page.goto(url(lang));
      await run(lang); await page.locator('.ws-access-recovery[role=alert]').waitFor();
      const count = calls.length;
      await page.getByRole('button', { name: lang === 'en' ? 'Probe selected profile access (invokes the CLI)' : 'Kiểm tra truy cập hồ sơ đã chọn (gọi CLI thật)', exact: true }).click();
      const expected = identity === 'unknown'
        ? (lang === 'en' ? 'CLI responded, but did not report the actual model.' : 'CLI đã phản hồi nhưng không báo model thực.')
        : (lang === 'en' ? 'CLI responded, but reported a different model.' : 'CLI đã phản hồi nhưng báo model khác.');
      await page.getByText(expected, { exact: false }).waitFor();
      assert.equal((await state()).runs.length, 1); assert.equal(calls.length, count + 1);
      assert.equal(await page.locator('.ws-access-recovery[role=status]').count(), 0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert(!overflow);
      identityGeometry.push({ identity, lang, colorScheme, width, overflow, runCount: 1, explicitFixtureProbes: 1 });
      if (width === 375 && colorScheme === 'dark') await page.screenshot({ path: path.join(output, 'identity-' + identity + '-' + lang + '.png'), fullPage: true });
    }
    probeIdentity = null;
    await run(); await page.locator('.ws-access-recovery[role=alert]').waitFor();
    probeFails = false; await page.getByRole('button', { name: 'Probe selected profile access (invokes the CLI)', exact: true }).click();
    await page.locator('.ws-access-recovery[role=status]').waitFor(); assert.equal((await state()).runs.length, 1);
    // Repeat expiry after success: the previous success must be replaced by an alert.
    expire(); await run(); await page.locator('.ws-access-recovery[role=alert]').waitFor();
    assert.equal(await page.locator('.ws-access-recovery[role=status]').count(), 0);
    await page.getByRole('button', { name: 'Probe selected profile access (invokes the CLI)', exact: true }).click();
    await page.locator('.ws-access-recovery[role=status]').waitFor();
    await run(); await waitStatus('reported');
    await page.getByRole('link', { name: 'Results', exact: true }).click();
    await page.getByRole('button', { name: 'Verify with Node tests', exact: true }).click(); await waitStatus('verified');
    await page.getByRole('button', { name: 'Integrate verified result', exact: true }).click(); await waitStatus('integrated');
    await page.locator('.ws-run [data-status=integrated]').waitFor();
    const final = await state(), handoff = await request('work/runs/' + final.runs.at(-1).id + '/handoff');
    assert.equal(final.tasks[0].id, task.id); assert.equal(final.tasks[0].requirementRevision, task.requirementRevision);
    assert.equal(handoff.skillEvidence.supplied.length, 1); assert.equal(final.runs.at(-1).retryContext.fromRunId, final.runs[0].id);
    assert.equal(fs.readFileSync(path.join(source, 'csv-cell.js'), 'utf8'), csv.fixed);
    const callCount = calls.length;
    await page.reload(); await page.locator('.ws-run [data-status=integrated]').waitFor();
    await page.getByRole('link', { name: 'Plan', exact: true }).click(); await page.goBack(); await page.locator('.ws-run [data-status=integrated]').waitFor();
    await page.goto(origin + '/m/' + host + '/admin?lang=en&section=runtime&view=results');
    await page.getByRole('heading', { name: 'Agents & runtimes', exact: true }).waitFor();
    await page.goBack(); await page.locator('.ws-run [data-status=integrated]').waitFor(); assert.equal(calls.length, callCount);
    await page.screenshot({ path: path.join(output, 'integrated-en.png'), fullPage: true });
    // A later save must not attach new criteria to the old integrated evidence.
    const revised = await request('work/tasks/' + task.id + '/configure', { expectedRevision: task.requirementRevision,
      acceptance: ['A later requirement has not been verified'], sources: ['Later reference, not used by the historical run'] });
    await page.reload();
    await page.getByText('This result belongs to an older requirement and cannot be accepted for the current revision.', { exact: true }).first().waitFor();
    await page.locator('.ws-run').first().getByText('Evidence and handoff files', { exact: true }).click();
    const handoffLink = page.getByRole('link', { name: 'Download handoff', exact: true }).first();
    const historicalHandoff = await page.request.get(new URL(await handoffLink.getAttribute('href'), origin).href).then(r => r.json());
    assert.equal(historicalHandoff.task.requirementRevision, task.requirementRevision);
    assert.deepEqual(historicalHandoff.task.acceptance, task.acceptance);
    assert.equal(historicalHandoff.currentRequirementRevision, revised.requirementRevision);
    assert.equal(historicalHandoff.requirementsCurrent, false);
    await page.getByRole('link', { name: 'Plan', exact: true }).click(); await page.goBack();
    await page.getByText('This result belongs to an older requirement and cannot be accepted for the current revision.', { exact: true }).first().waitFor();
    assert.equal(calls.length, callCount, 'Reading historical evidence cannot dispatch');
    // An older reported attempt must not offer source refresh after a new save.
    await page.goto(url('en')); await run(); await waitStatus('reported');
    await page.getByRole('link', { name: 'Results', exact: true }).click();
    await page.locator('.ws-run').first().getByText('Evidence and handoff files', { exact: true }).click();
    const refreshLabel = 'Refresh source and verify again';
    assert.equal(await page.getByRole('button', { name: refreshLabel, exact: true }).count(), 1);
    const currentRun = (await state()).runs.at(-1);
    await request('work/tasks/' + task.id + '/configure', { expectedRevision: revised.requirementRevision, acceptance: ['Newer criteria after the reported attempt'] });
    await page.reload();
    await page.locator('.ws-run').first().waitFor();
    assert.equal(await page.getByRole('button', { name: refreshLabel, exact: true }).count(), 0);
    const staleRebase = await page.request.post(base + 'work/runs/' + currentRun.id + '/rebase', { data: {} });
    assert.equal(staleRebase.status(), 409);
    assert.equal((await state()).tasks[0].status, 'ready');
    await page.reload(); assert.equal((await state()).runs.length, 3);
    assert.equal(calls.length, callCount + 1, 'Only the explicit third Run may invoke the participant');
    const historicalGeometry = [];
    for (const lang of ['vi', 'en']) for (const colorScheme of ['light', 'dark']) for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 }); await page.emulateMedia({ colorScheme });
      await page.goto(url(lang, 'results')); await page.reload();
      await page.getByText(lang === 'en' ? 'This result belongs to an older requirement and cannot be accepted for the current revision.' : 'Kết quả thuộc yêu cầu cũ; không được nghiệm thu cho revision hiện tại.', { exact: true }).first().waitFor();
      const label = lang === 'en' ? refreshLabel : 'Cập nhật nguồn và kiểm chứng lại';
      assert.equal(await page.getByRole('button', { name: label, exact: true, hidden: true }).count(), 0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert(!overflow); historicalGeometry.push({ lang, colorScheme, width, overflow, staleRefreshControls: 0 });
      const path = await page.locator('a[download="handoff.json"]').first().getAttribute('href');
      const downloaded = await page.request.get(new URL(path, origin).href).then(r => r.json());
      assert.equal(downloaded.task.requirementRevision, revised.requirementRevision);
      assert.equal(downloaded.requirementsCurrent, false); assert.equal(downloaded.status, 'reported');
      if (width === 375 && colorScheme === 'dark') await page.screenshot({ path: require('node:path').join(output, 'historical-' + lang + '.png'), fullPage: true });
    }
    assert.equal(calls.length, callCount + 1, 'Locale/theme/size/reload must not dispatch');
    // A stale page can still expose Verify when legacy storage loses its run revision.
    await page.setViewportSize({ width: 1280, height: 812 }); await page.goto(url('vi'));
    await run('vi'); await waitStatus('reported');
    await page.getByRole('link', { name: 'Kết quả', exact: true }).click();
    await page.getByRole('button', { name: 'Kiểm chứng bằng Node test', exact: true }).waitFor();
    const legacyStore = new ConfigStore({ dir: path.join(root, 'work', sha(host)), defaults: () => ({}), validate: () => {} });
    const legacyState = legacyStore.read(), legacyRunId = legacyState.runs.at(-1).id;
    delete legacyState.runs.at(-1).requirementRevision; legacyStore.save(legacyState, legacyState.revision);
    const beforeLegacy = await state(), legacyCalls = calls.length;
    await page.getByRole('button', { name: 'Kiểm chứng bằng Node test', exact: true }).click();
    await page.getByText('Không xác định được revision yêu cầu của lần chạy cũ.', { exact: false }).waitFor();
    assert.deepEqual(await state(), beforeLegacy); assert.equal(calls.length, legacyCalls);
    assert.equal(await page.getByRole('button', { name: 'Kiểm tra truy cập hồ sơ đã chọn (gọi CLI thật)', exact: true }).count(), 0);
    await page.reload(); await page.locator('.ws-run').first().waitFor();
    assert.equal(await page.getByRole('button', { name: 'Kiểm chứng bằng Node test', exact: true, hidden: true }).count(), 0);
    await page.getByRole('link', { name: 'Thực hiện', exact: true }).click();
    await run('vi'); const recovered = await waitStatus('reported');
    assert.notEqual(recovered.runs.at(-1).id, legacyRunId);
    await page.getByRole('link', { name: 'Kết quả', exact: true }).click();
    await page.getByRole('button', { name: 'Kiểm chứng bằng Node test', exact: true }).click(); await waitStatus('verified');
    await page.getByRole('button', { name: 'Tích hợp kết quả đã kiểm chứng', exact: true }).click();
    const restored = await waitStatus('integrated');
    assert.equal(restored.tasks[0].status, 'done'); assert.equal(restored.tasks[0].id, task.id);
    assert.equal(calls.length, callCount + 3, 'Only explicit fourth and fifth runs may execute during legacy recovery');
    const legacyRecovery = { fixture: true, missingFieldInjected: true, blockedRunId: legacyRunId, newRunId: restored.runs.at(-1).id,
      requirementRevision: restored.tasks[0].requirementRevision, taskId: task.id, status: 'integrated', stateUnchangedOn409: true, paidProbeOnLegacyError: false };



    assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
    assert(!consoleErrors.some(e => /Content Security Policy|Refused to|Uncaught/.test(e)), consoleErrors.join('\n'));
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify({ recordedAt: new Date().toISOString(), fixture: true, modelCalls: 0, calls, geometry, pageErrors, consoleErrors,
      taskId: task.id, requirementRevision: task.requirementRevision, status: final.runs.at(-1).status, runs: final.runs.map(r => ({ id: r.id, status: r.status, retryContext: r.retryContext, skillEvidence: r.skillEvidence })),
      checks: final.runs.at(-1).integrationEvidence, historicalHandoff, historicalGeometry, identityGeometry, legacyRecovery, currentTaskRevision: restored.tasks[0].requirementRevision, navigation: ['reload Execute with no dispatch', 'reload Results', 'Plan/Back', 'Admin runtime/Back', 'direct Results hash', 'historical warning and downloaded handoff after reconfigure/reload/Back'],
      limits: ['Self-review on scripted model-access/CSV fixture; no human UX or native model acceptance.', 'Expiry backdated in both stores, not wall-clock 30 minutes.', 'Browser checks required supply without lookup; real MCP calls are covered separately in journey.json.', 'Top requirementRevision/runs describe the initial failed-to-integrated pair; later revisions and missing-field recovery are separate historicalGeometry/legacyRecovery records.', 'After the first two CSV repair attempts, scripted metadata checks leave already-correct source unchanged; they do not test fresh model repair quality.'] }, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'passed', geometryCases: geometry.length, calls, taskId: task.id }));
  } finally { if (browser) await browser.close(); await app.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
