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

test('Claude envelope preserves machine model, usage, cost and a permission-denial diagnostic', () => {
  const parsed = parseOutput('claude', JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
    result: 'Review report', modelUsage: { 'actual-provider-id': { inputTokens: 12 } }, usage: { input_tokens: 12 },
    total_cost_usd: 0.02, permission_denials: [{ tool_name: 'Write' }] }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.reportedModel, 'actual-provider-id');
  assert.equal(parsed.permissionDenials, 1);
  assert.equal(parsed.costUsd, 0.02);
  assert.equal(parsed.usage.input_tokens, 12);
  assert.equal(parsed.error, 'Runtime reported permission denials');
  assert.equal(parseOutput('claude', JSON.stringify({ type: 'result', subtype: 'success', result: 'Done' })).error, null);
});

test('runtime billing and model evidence stay unknown when inconsistent', () => {
  for (const adapter of ['claude', 'agy']) {
    const result = extra => JSON.stringify({ type: 'result', subtype: 'success', result: 'Done', status: 'SUCCESS', ...extra });
    for (const cost of [-1, -0.01, '0.2', null, {}, true]) assert.equal(parseOutput(adapter, result({ total_cost_usd: cost })).costUsd, null);
    for (const cost of [0, 0.02, 123]) assert.equal(parseOutput(adapter, result({ total_cost_usd: cost })).costUsd, cost);
    assert.equal(parseOutput(adapter, result({})).costUsd, null);
    assert.equal(parseOutput(adapter, result({ model: 'expected', modelUsage: { expected: {}, other: {} } })).reportedModel, 'unknown');
    assert.equal(parseOutput(adapter, result({ model: 'fallback', modelUsage: { actual: {} } })).reportedModel, 'actual');
    assert.equal(parseOutput(adapter, result({ model: 'fallback' })).reportedModel, 'fallback');
  }
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
  const clipped = parseOutput('agy', JSON.stringify({status:'SUCCESS',response:'a'.repeat(65535)+'🧪tail'}));
  assert.equal(clipped.text,'a'.repeat(65535), 'The report prefix must not end with half an emoji');
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
      queueMicrotask(() => { for (const chunk of Array.isArray(output) ? output : [output]) child.stdout.write(chunk); child.stdout.end(); child.stderr.end(); child.emit('close', exitCode); });
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

test('runtime reports preserve Vietnamese and emoji across arbitrary UTF-8 stream boundaries', async () => {
  const text = 'Đã kiểm chứng tiếng Việt và 🧪; đường dẫn không thay đổi.';
  const bytes = Buffer.from(JSON.stringify({type:'result',subtype:'success',result:text}));
  const { runtime } = fakeRuntime([...bytes].map(byte => Buffer.from([byte])));
  const result = await runtime.runCli({adapter:'claude',modelId:'test-id',prompt:'Read',workspace:__dirname,timeoutMs:1000});
  assert.equal(result.status,'reported'); assert.equal(result.text,text);
  assert.equal(result.stdout,bytes.toString('utf8'));
});

test('UTF-8 stream decoding retains the one-MiB output byte cap', async () => {
  const { runtime } = fakeRuntime([Buffer.from('ệ'.repeat(200000)),Buffer.from('ệ'.repeat(200000))]);
  const result = await runtime.runCli({adapter:'claude',modelId:'test-id',prompt:'Read',workspace:__dirname,timeoutMs:1000});
  assert.equal(result.status,'output-limit');
  assert(Buffer.byteLength(result.stdout)<=1024*1024);
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

test('agy SUCCESS with denied_actions is a permission failure, not a completed report', async () => {
  // Shape observed with agy1.4.5 in the read-only audit, no model call here.
  const output = JSON.stringify({ status: 'SUCCESS', response: 'Partial response before the requested tool was denied.', denied_actions: [{ action: 'command', display_name: 'RunCommand' }] });
  const parsed = parseOutput('agy', output);
  assert.equal(parsed.permissionDenials, 1);
  assert.equal(parsed.error, 'Runtime reported permission denials');
  assert.equal(parsed.reportedModel, 'unknown');
  const { runtime } = fakeRuntime(output);
  const result = await runtime.runCli({ adapter: 'agy', modelId: 'test-id', prompt: 'Read-only audit', workspace: __dirname, timeoutMs: 1000 });
  assert.equal(result.status, 'failed'); assert.equal(result.permissionDenials, 1);
  assert.equal(result.error, 'Runtime reported permission denials');
  assert.equal(parseOutput('agy', JSON.stringify({ status: 'SUCCESS', response: 'Complete response', denied_actions: [] })).permissionDenials, 0);
});
