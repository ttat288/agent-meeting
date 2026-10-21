#!/usr/bin/env node
'use strict';
// Standalone capability lookup: no room, no global MCP configuration changes.
const readline = require('readline');
const { ConfigStore } = require('../src/config-store');
const routing = require('../src/routing');
const { TOOLS, query } = require('../src/routing-tools');
const store = new ConfigStore({ defaults: routing.defaults, validate: routing.validate });
if (process.argv[2] !== '--stdio') {
  try { console.log(JSON.stringify(query(store, process.argv[2] || 'list_profiles', JSON.parse(process.argv[3] || '{}')), null, 2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
} else {
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  input.on('line', line => {
    if (Buffer.byteLength(line) > 65536) { input.close(); process.stdin.destroy(); return; }
    let msg;
    try {
      msg = JSON.parse(line);
      if (msg.id == null) return;
      let result;
      switch (msg.method) {
        case 'initialize': result = { protocolVersion: msg.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'agent-meeting-routing', version: '1.0.0' }, instructions: 'Read-only routing lookup. Unknown runtime access is not permission to execute.' }; break;
        case 'ping': result = {}; break;
        case 'tools/list': result = { tools: TOOLS }; break;
        case 'tools/call': result = { content: [{ type: 'text', text: JSON.stringify(query(store, msg.params?.name, msg.params?.arguments)) }] }; break;
        default: throw new Error('Unsupported method');
      }
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
    } catch (e) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32602, message: e.message } }) + '\n'); }
  });
}
