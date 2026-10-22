'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');

test('PM terminal words round-trip through a POSIX shell without interpolation', { skip: process.platform === 'win32' ? 'PM managed terminal commands use POSIX shell syntax on Linux' : false }, () => {
  // Exercise the actual browser helper against the shell parser. No duplicate
  // implementation or full browser DOM mock; fail if the helper is moved.
  const line = fs.readFileSync(path.join(__dirname, '../src/ui/pm-ui.js'), 'utf8').split('\n').find(l => l.trim().startsWith('function shellWord('));
  assert(line, 'Browser command quoting helper is required');
  const shellWord = new Function('return (' + line.trim() + ')')();
  for (const value of ['', 'simple', '/tmp/space here/pm.js', "/tmp/it's here/pm.js", '/tmp/$(printf injected)/pm.js', '`printf injected`', '"$USER"', 'line\nbreak', 'Tiếng Việt']) {
    const output = execFileSync('/bin/sh', ['-c', 'printf %s ' + shellWord(value)], { encoding: 'utf8', timeout: 3000 });
    assert.equal(output, value);
  }
});
