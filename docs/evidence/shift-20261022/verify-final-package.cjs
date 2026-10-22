'use strict';
// Run from a checkout: node docs/evidence/shift-20261022/verify-final-package.cjs [new-output-directory]
// Local package/signal checks only. No install, native AI call or user data store.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '../../..');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const expectedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

(async () => {
  process.chdir(repo);
  const output = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'am-package-report-'));
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  for (const name of ['package-smoke.json', 'cli-shutdown-tests.txt']) {
    assert(!fs.existsSync(path.join(output, name)), 'Choose a new output directory; historical receipts are not overwritten');
  }
  const status = cp.execFileSync('git', ['status', '--porcelain', '--', 'bin', 'src', 'scripts', 'assets', 'package.json', 'README.md', 'README.vi.md', 'LICENSE', 'CHANGELOG.md'], { encoding: 'utf8' });
  assert.equal(status.trim(), '', 'Commit the package inputs before binding this receipt to HEAD');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'am-package-final-'));
  const info = JSON.parse(cp.execFileSync('npm', ['pack', '--json', '--cache', path.join(root, 'cache'), '--pack-destination', root], { encoding: 'utf8', maxBuffer: 1024 * 1024 }))[0];
  const tar = path.join(root, info.filename), packaged = path.join(root, 'package');
  cp.execFileSync('tar', ['-xzf', tar, '-C', root]);
  assert(!info.files.some(f => /^(?:\.agents|\.local-tools|docs|test|tools)\//.test(f.path)));
  const runtimeFiles = cp.execFileSync('git', ['ls-files', '-z', '--', 'bin', 'src', 'scripts', 'assets'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of runtimeFiles) assert(info.files.some(f => f.path === file), 'Runtime file missing from package: ' + file);
  for (const file of ['src/pm.js', 'src/team.js', 'src/work.js', 'src/worker.js', 'src/runtime.js', 'src/session-child.js', 'src/session-supervisor.js', 'src/cli-discovery.js', 'src/skills/agent-meeting/SKILL.md', 'bin/pm.js', 'bin/team.js']) {
    assert(info.files.some(f => f.path === file), file);
  }
  const allPackedFileHashes = Object.fromEntries(info.files.map(file => {
    const source = fs.readFileSync(path.join(repo, file.path)), packed = fs.readFileSync(path.join(packaged, file.path));
    assert.deepEqual(packed, source, file.path);
    return [file.path, sha(packed)];
  }));
  const { createApp } = require(path.join(packaged, 'src/server'));
  const app = createApp({ configDir: root + '/config', workDir: root + '/work', dataDir: root + '/rooms' });
  const room = app.create({ hostKey: 'host_packaged_final_1234', id: 'agent_packaged_final_1234', fixed: true });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + app.server.address().port, checks = [];
  try {
    const routes = ['/m/' + room.hostKey, '/m/' + room.hostKey + '/admin', '/assets/app.js', '/assets/pm-ui.js', '/assets/workspace.js', '/assets/workspace.css', '/assets/app.css', '/assets/i18n.js', '/api/host/' + room.hostKey + '/work'];
    for (const route of routes) {
      const response = await fetch(origin + route), text = await response.text();
      assert.equal(response.status, 200, route);
      if (route.startsWith('/m/')) assert.equal(response.headers.get('content-security-policy'), expectedCsp);
      if (route.startsWith('/assets/')) assert.equal(text, fs.readFileSync(path.join(repo, 'src/ui', route.split('/').pop()), 'utf8'));
      checks.push({ url: route.replace(room.hostKey, '<fixture-host>'), status: response.status, csp: response.headers.get('content-security-policy') });
    }
    const endpoint = origin + '/api/host/' + room.hostKey + '/work';
    const full = await fetch(endpoint), conditional = await fetch(endpoint, { headers: { 'if-none-match': full.headers.get('etag') } });
    assert.equal(conditional.status, 304); assert.equal(await conditional.text(), '');
    checks.push({ url: '/api/host/<fixture-host>/work', status: 304, condition: 'If-None-Match', emptyBody: true });
    const skill = JSON.parse(cp.execFileSync(process.execPath, [packaged + '/bin/cli.js', 'skills', 'list'], { cwd: root, encoding: 'utf8' }));
    assert(skill.items.some(item => item.id === 'agent-meeting'));
    fs.mkdirSync(packaged + '/test');
    fs.copyFileSync('test/cli-shutdown.test.js', packaged + '/test/cli-shutdown.test.js');
    const cli = cp.execFileSync(process.execPath, ['--test', 'test/cli-shutdown.test.js'], { cwd: packaged, encoding: 'utf8', timeout: 20000, maxBuffer: 256 * 1024 });
    for (const expected of [/^# tests 2$/m, /^# pass 2$/m, /^# fail 0$/m, /^# skipped 0$/m]) assert(expected.test(cli), String(expected));
    fs.writeFileSync(path.join(output, 'cli-shutdown-tests.txt'), cli, { flag: 'wx' });
    const report = { schema: 'agent-meeting/final-package-smoke@1', at: new Date().toISOString(), node: process.version, platform: process.platform,
      sourceCommit: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      verificationProgramSha256: sha(fs.readFileSync(__filename)), tarballSha256: sha(fs.readFileSync(tar)), tarballBytes: fs.statSync(tar).size,
      files: info.files.length, unpackedSize: info.unpackedSize, allPackedFileHashes, checks, bundledSkills: skill.items.map(item => item.id),
      cliShutdown: { pass: 2, fail: 0, skipped: 0, testSourceSha256: sha(fs.readFileSync('test/cli-shutdown.test.js')), scope: 'Test copied after packing, never shipped; real signals and isolated stores' },
      nativeModelCalls: 0, installedUserApp: false, limits: ['Local package and transport/CLI checks, not native model quality or eight-hour runtime', 'Development/CI/schema costs are not metered here'] };
    fs.writeFileSync(path.join(output, 'package-smoke.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ output, temporaryPackage: packaged, files: report.files, checks: checks.length, tarballSha256: report.tarballSha256 }));
  } finally { await app.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
