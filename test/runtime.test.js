'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { PassThrough, Writable } = require('node:stream');
const { buildArgs, parseOutput } = require('../src/runtime');
const literal = 'Review only; $(touch /tmp/not-executed) `echo no` "$HOME"\n--permission-mode bypassPermissions';

test('adapter arguments require an explicit safe provider ID and bounded nonempty prompt', () => {
  for (const adapter of ['claude', 'agy']) {
    for (const modelId of [undefined, '', '--help', 'model;echo unsafe', 'model name', 'a'.repeat(122)])
      assert.throws(() => buildArgs(adapter, { modelId, prompt: 'Read' }), /Explicit model ID/);
    for (const prompt of ['', '  ', null, 'a'.repeat(128 * 1024 + 1)])
      assert.throws(() => buildArgs(adapter, { modelId: 'provider.model-v1:low', prompt }), /Invalid prompt/);
    assert(buildArgs(adapter, { modelId: 'provider.model-v1:low', prompt: 'Read' }).includes('provider.model-v1:low'));
  }
  assert.throws(() => buildArgs('custom-shell', { modelId: 'x', prompt: 'Read' }), /Unsupported adapter/);
});

test('agy receives the entire prompt as one literal argv value and rejects writes', () => {
  const args = buildArgs('agy', { modelId: 'test-model', prompt: literal });
  assert.equal(args[args.indexOf('--print') + 1], literal);
  assert.equal(args.filter(x => x === literal).length, 1);
  assert.equal(args[args.indexOf('--mode') + 1], 'plan');
  assert(args.includes('--sandbox'));
  assert.throws(() => buildArgs('agy', { modelId: 'test-model', prompt: literal, write: true }), /not verified/);
});

test('Claude keeps prompt out of flags, isolates MCP, and limits write tool scope', () => {
  const args = buildArgs('claude', { modelId: 'test-model', prompt: literal });
  assert(!args.includes(literal));
  assert.equal(args[args.indexOf('--tools') + 1], '');
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'plan');
  assert.equal(args[args.indexOf('--mcp-config') + 1], '{"mcpServers":{}}');
  assert(args.includes('--strict-mcp-config'));
  const write = buildArgs('claude', { modelId: 'test-model', prompt: 'Edit', write: true });
  assert.equal(write[write.indexOf('--tools') + 1], 'Read,Edit,Write,Glob,Grep');
  assert(!write.join(' ').includes('bypassPermissions'));
});

test('malformed JSON and nonobject JSON always fail without throwing', () => {
  for (const adapter of ['claude', 'agy']) for (const raw of ['', 'not-json', '{', 'null', '[]', 'true', '42', '"done"', '{}']) {
    const result = parseOutput(adapter, raw);
    assert.equal(result.valid, false, `${adapter}: ${raw}`);
    assert.equal(result.reportedModel, 'unknown');
    assert(result.error);
  }
});

test('runtime error variants and missing output cannot become successful reports', () => {
  for (const [adapter, output] of [
    ['agy', { status: 'ERROR', error: 'access denied' }],
    ['agy', { type: 'success', status: 'error', error: 'Authentication failed' }],
    ['agy', { status: 'SUCCESS', response: '   ' }],
    ['agy', { response: 'Looks complete but has no positive status' }],
    ['claude', { type: 'result', subtype: 'error_max_turns', result: 'Budget exhausted' }],
    ['claude', { type: 'result', subtype: 'success', is_error: true, result: 'access denied' }],
    ['claude', { type: 'error', error: 'No access' }],
    ['claude', { type: 'result', subtype: 'success', result: '' }],
  ]) {
    const result = parseOutput(adapter, JSON.stringify(output));
    assert.equal(result.valid, false, JSON.stringify(output));
    assert(result.error);
  }
});

test('Claude success preserves machine model, usage, permission denials and cost evidence', () => {
  const parsed = parseOutput('claude', JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
    result: 'Review report', modelUsage: { 'actual-provider-id': { inputTokens: 12 } }, usage: { input_tokens: 12 },
    total_cost_usd: 0.02, permission_denials: [{ tool_name: 'Write' }] }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.reportedModel, 'actual-provider-id');
  assert.equal(parsed.permissionDenials, 1);
  assert.equal(parsed.costUsd, 0.02);
  assert.equal(parsed.usage.input_tokens, 12);
  assert.equal(parsed.error, null);
});

test('agy success keeps self-identified prose model unknown and bounds model output', () => {
  const parsed = parseOutput('agy', JSON.stringify({ status: 'SUCCESS', response: 'I am model-X. ' + 'a'.repeat(70000), usage: { total_tokens: 15 } }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.reportedModel, 'unknown');
  assert.equal(parsed.text.length, 65536);
  assert.equal(parsed.usage.total_tokens, 15);
  assert.equal(parsed.costUsd, null);
  assert.equal(parseOutput('agy', JSON.stringify({ status: 'SUCCESS', response: 'Done', model: 'explicit-model' })).reportedModel, 'explicit-model');
  assert.equal(parseOutput('claude', JSON.stringify({ type: 'result', subtype: 'success', result: 'Done', modelUsage: { a: {}, b: {} } })).reportedModel, 'unknown');
});

// Substitute only process launch/discovery: exercise runCli without starting any
// real agent, network request, or global CLI configuration change.
function fakeRuntime(output, exitCode = 0) {
  const captured = {};
  const stub = {
    spawnSync: () => ({ status: 0, stdout: '/fake/agy\n' }),
    spawn(bin, args, options) {
      Object.assign(captured, { bin, args, options });
      const child = new EventEmitter();
      child.stdout = new PassThrough(); child.stderr = new PassThrough();
      child.stdin = new Writable({ write(chunk, encoding, cb) { captured.stdin = (captured.stdin || '') + chunk; cb(); } });
      queueMicrotask(() => { child.stdout.write(output); child.stdout.end(); child.stderr.end(); child.emit('close', exitCode); });
      return child;
    },
  };
  const mod = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src/runtime.js'), 'utf8');
  new Function('require', 'module', source)(name => name === 'child_process' ? stub : name === './connect' ? { findCli: () => '/fake/claude' } : require(name), mod);
  return { runtime: mod.exports, captured };
}

test('runCli sends Claude prompt verbatim on stdin, uses shell false and never claims verified', async () => {
  const { runtime, captured } = fakeRuntime('{"type":"result","subtype":"success","result":"Done"}');
  const result = await runtime.runCli({ adapter: 'claude', modelId: 'test-id', prompt: literal, workspace: __dirname, timeoutMs: 1000 });
  assert.equal(captured.options.shell, false);
  assert.equal(captured.options.cwd, fs.realpathSync(__dirname));
  assert.equal(captured.stdin, literal);
  assert.equal(result.status, 'reported');
  assert.equal(result.reportedModel, 'unknown');
  assert.equal(result.requestedModel, 'test-id');
});

test('runCli rejects nonzero exit, malformed result, and permission denial despite positive success JSON', async () => {
  for (const [output, code] of [
    ['{"type":"result","subtype":"success","result":"Done"}', 1],
    ['null', 0],
    ['{"type":"result","subtype":"success","result":"Done","permission_denials":[{}]}', 0],
  ]) {
    const { runtime } = fakeRuntime(output, code);
    const result = await runtime.runCli({ adapter: 'claude', modelId: 'test-id', prompt: 'Review', workspace: __dirname, timeoutMs: 1000 });
    assert.equal(result.status, 'failed');
    assert.equal(result.exitCode, code);
  }
});
