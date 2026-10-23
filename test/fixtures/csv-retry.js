'use strict';
// Scripted repair participant, not an AI: chooses a known patch only when
// supplied the independent failure diagnostic. No model/credentials/settings.
const fs = require('node:fs'), path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { wrapExecution } = require('../../src/execution-sandbox');
const initial = "module.exports = value => String(value);\n";
const incomplete = `module.exports = value => { const text = String(value); return text.includes(',') ? '"' + text + '"' : text; };\n`;
const fixed = `module.exports = value => { const text = String(value); return /[",\\r\\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; };\n`;
const cases = [
  ['keeps plain cells', 'plain', 'plain'],
  ['quotes delimiter', 'a,b', '"a,b"'],
  ['escapes embedded double quotes', 'say "hi"', '"say ""hi"""'],
  ['quotes line feed', 'a\nb', '"a\nb"'],
  ['quotes carriage return', 'a\rb', '"a\rb"'],
  ['keeps empty cells', '', ''],
  ['keeps unicode', 'cà phê', 'cà phê'],
  ['converts zero', 0, '0'],
];
const tests = "const test = require('node:test'), assert = require('node:assert/strict'), cell = require('../csv-cell');\n" + cases.map(([name, input, expected]) => `test(${JSON.stringify(name)}, () => assert.equal(cell(${JSON.stringify(input)}), ${JSON.stringify(expected)}));\n`).join('');
const goal = 'Fix CSV cell escaping for commas, embedded double quotes and CR/LF; preserve plain, empty, numeric and Unicode cells. Change only csv-cell.js; keep independent tests unchanged.';
const acceptance = cases.map(([name]) => name);
function seed(source) {
  fs.mkdirSync(path.join(source, 'test'), { recursive: true });
  fs.writeFileSync(path.join(source, 'csv-cell.js'), initial);
  fs.writeFileSync(path.join(source, 'test/csv-cell.test.js'), tests);
  execFileSync('git', ['init', '-q', source]);
  execFileSync('git', ['-C', source, 'add', '.']);
  execFileSync('git', ['-C', source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'CSV retry fixture']);
}
function execute(source, args, write) {
  const wrapped = wrapExecution(process.execPath, args, { workspace: source, write });
  try {
    const result = spawnSync(wrapped.bin, wrapped.args, { cwd: source, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
    if (result.error) throw result.error;
    return { exitCode: result.status, output: result.stdout + result.stderr };
  } finally { wrapped.cleanup(); }
}
const hasDiagnosis = context => JSON.stringify(context || '').includes('escapes embedded double quotes');
function patch(source, context) {
  const next = hasDiagnosis(context) ? fixed : incomplete;
  return execute(source, ['-e', 'require("fs").writeFileSync("csv-cell.js",' + JSON.stringify(next) + ')'], true);
}
function participant(prompts) {
  return async args => {
    if (args.prompt.includes('READY')) return { status: 'reported', reportedModel: args.modelId, text: 'Scripted access check, no AI call.', exitCode: 0 };
    const input = JSON.parse(args.prompt); prompts.push(input);
    const result = patch(args.workspace, input.previousFailure || input.facts);
    return { status: result.exitCode === 0 ? 'reported' : 'failed', reportedModel: args.modelId, text: 'Scripted CSV patch selected from supplied diagnostics; not model reasoning.', exitCode: result.exitCode };
  };
}
function enable(configStore) {
  const c = configStore.read(), model = c.models.find(m => m.id === 'opus');
  Object.assign(model, { providerModelId: 'fixture-csv', enabled: true, verification: 'verified', source: { ...model.source, confidence: 'user-configured', checkedAt: new Date().toISOString() } });
  c.profiles.find(p => p.id === 'opus-claude').enabled = true;
  configStore.save(c, c.revision);
}
module.exports = { initial, incomplete, fixed, tests, goal, acceptance, seed, execute, patch, participant, enable };
