#!/usr/bin/env node
'use strict';
// Keep the default developer/CI run sequential and bounded on Node 18+.
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const supportsTestTimeout = Number(process.versions.node.split('.')[0]) >= 22;
let failed = false;
for (const file of fs.readdirSync(path.join(root, 'test')).filter(f => f.endsWith('.test.js')).sort()) {
  console.log('\n' + file);
  const result = spawnSync(process.execPath, ['--max-old-space-size=768', '--test', ...(supportsTestTimeout ? ['--test-timeout=30000'] : []), path.join('test', file)], {
    cwd: root, stdio: 'inherit', timeout: 150000, killSignal: 'SIGKILL', env: process.env,
  });
  if (result.error || result.status !== 0) { failed = true; console.error(file + ': ' + (result.error?.message || 'exit ' + result.status + (result.signal ? ' (' + result.signal + ')' : ''))); }
}
process.exitCode = failed ? 1 : 0;
