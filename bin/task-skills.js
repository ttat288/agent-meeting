#!/usr/bin/env node
'use strict';
// Private managed stdio MCP. Not registered globally or in conversation tools.
const fs = require('node:fs');
const { createLookup } = require('../src/task-skills');
const snapshotPath = process.argv[2];
const st = fs.lstatSync(snapshotPath);
if (!st.isFile() || st.isSymbolicLink() || st.size > 512 * 1024) throw Error('Invalid task context snapshot');
const lookup = createLookup(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')));
let pending = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  pending += chunk;
  let newline;
  while ((newline = pending.indexOf('\n')) >= 0) {
    const line = pending.slice(0, newline); pending = pending.slice(newline + 1);
    if (Buffer.byteLength(line) > 65536) { process.stdin.destroy(); return; }
    let msg;
    try {
      msg = JSON.parse(line);
      if (msg.id == null) continue;
      let result;
      if (msg.method === 'initialize') result = { protocolVersion: msg.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'task-skills', version: '1.0.0' }, instructions: 'Read-only task skills. Selection and supply do not prove semantic compliance.' };
      else if (msg.method === 'ping') result = {};
      else if (msg.method === 'tools/list') result = { tools: lookup.tools };
      else if (msg.method === 'tools/call') {
        try { result = { content: [{ type: 'text', text: JSON.stringify(lookup.call(msg.params?.name, msg.params?.arguments)) }] }; }
        catch (e) { result = { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: e.code || 'SKILL_LOOKUP_FAILED', error: e.message }) }] }; }
      } else throw Error('Unsupported method');
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
    } catch (e) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32602, message: e.message } }) + '\n'); }
  }
  if (Buffer.byteLength(pending) > 65536) process.stdin.destroy();
});
