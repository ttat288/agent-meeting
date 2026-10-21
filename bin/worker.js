#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { runWorkerOnce } = require('../src/worker');
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { process.stdout.write('Usage: node bin/worker.js --config <private-file.json> --once\nConfig: serverUrl, hostId, token, workspace, workspaceId, workDir, allowedModels[], adapters[].\n'); return; }
  if (args.length !== 3 || args[0] !== '--config' || !args[1] || args[2] !== '--once') throw new Error('Usage: node bin/worker.js --config <private-file.json> --once');
  const file = args[1], stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077) throw new Error('Worker config must be a private regular file (mode 600)');
  if (stat.size > 16384) throw new Error('Worker config is too large');
  let config; try { config = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw new Error('Invalid worker config JSON'); }
  const result = await runWorkerOnce(config);
  process.stdout.write(JSON.stringify({ status: result.status, runId: result.runId, generation: result.generation }) + '\n');
}
main().catch(() => { process.stderr.write('Worker stopped. Check private receipts and reconcile the assignment before retrying.\n'); process.exitCode = 1; });
