'use strict';
// Test-only transport observation. The production driver, parser, write sandbox
// and supervisor remain in use; discovery points ONLY to our local executable.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
require('../../src/connect').findCli = () => path.join(__dirname, 'carry-cli-fixture.js');
const runtime = require('../../src/runtime'), run = runtime.runCli;
runtime.runCli = async options => {
  const prompt = JSON.parse(options.prompt), purpose = prompt.purpose || 'initial-execution';
  const log = row => fs.appendFileSync(path.join(options.workspace, '..', 'carry-transport.jsonl'), JSON.stringify({ purpose, ...row }) + '\n');
  log({ event: 'input', promptBytes: Buffer.byteLength(options.prompt), promptSha256: crypto.createHash('sha256').update(options.prompt).digest('hex'),
    checkpointBytes: prompt.checkpoint ? Buffer.byteLength(JSON.stringify(prompt.checkpoint)) : 0,
    explicitAdapterArgsBytes: Buffer.byteLength(JSON.stringify(runtime.buildArgs(options.adapter, options))) });
  const result = await run(options);
  log({ event: 'output', resultTextBytes: Buffer.byteLength(result.text || ''), status: result.status, usage: result.usage ?? null, costUsd: result.costUsd ?? null });
  return result;
};
require('../../src/session-child');
