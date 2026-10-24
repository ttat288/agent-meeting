'use strict';
// Bounded, read-only discovery. No network, model invocation or configuration writes.
const fs = require('fs'), path = require('path');
const crypto = require('crypto');
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_FILE = 65536, MAX_SHOW = 32000;
function read(file, metadata = false) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_FILE) throw Error('Manifest must be a regular file <= 64 KiB');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const buffer = Buffer.alloc(metadata ? 8192 : MAX_FILE + 1);
    const size = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (!metadata && size > MAX_FILE) throw Error('Manifest too large');
    return buffer.subarray(0, size).toString('utf8');
  } finally { fs.closeSync(fd); }
}
function manifest(text) {
  const header = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!header) throw Error('Missing bounded YAML frontmatter');
  const scalar = key => {
    const lines = header.split(/\r?\n/), i = lines.findIndex(l => l.startsWith(key + ':'));
    if (i < 0) return '';
    let value = lines[i].slice(key.length + 1).trim();
    if (/^[>|][-+]?$/.test(value)) {
      const body = []; for (let j = i + 1; j < lines.length && /^\s/.test(lines[j]); j++) body.push(lines[j].trim());
      value = body.join(' ');
    }
    return value.replace(/^(['"])(.*)\1$/, '$2');
  };
  const name = scalar('name'), description = scalar('description');
  if (!ID.test(name) || !description) throw Error('Missing valid name/description');
  const characters = [...description];
  return { name, description: characters.slice(0, 600).join(''),
    ...(characters.length > 600 ? { descriptionTruncated: true } : {}) };
}
function location(options) {
  return path.resolve(options.dir || (options.local ? path.join(process.cwd(), '.agents', 'skills') : path.join(__dirname, 'skills')));
}
function skillFile(root, id) {
  if (!ID.test(id || '')) throw Error('Invalid skill folder name');
  const folder = path.join(root, id), st = fs.lstatSync(folder);
  if (!st.isDirectory() || st.isSymbolicLink()) throw Error('Skill folder must be a real directory (symlinks skipped)');
  return path.join(folder, 'SKILL.md');
}
function resourceFile(root, id, resource) {
  const folder = path.dirname(skillFile(root, id));
  if (!/^(references|scripts|assets)\//.test(resource) || resource.length > 300 || resource.includes('\\')) throw Error('Invalid resource path');
  const parts = resource.split('/');
  if (parts.some(p => !p || p.startsWith('.') || p.includes(':'))) throw Error('Invalid resource path');
  let current = folder;
  for (const part of parts) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw Error('Resource symlinks are not followed');
  }
  if (!fs.statSync(current).isFile()) throw Error('Resource must be a file');
  return current;
}
function inspectSkill(id, options = {}) {
  const root = location(options), text = read(skillFile(root, id));
  const meta = manifest(text), targets = new Set();
  // Explicit Markdown links and literal resource paths: evidence, not inferred dependencies.
  for (const m of text.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)|`((?:references|scripts|assets)\/[^`\s]+)`/g)) {
    const target = (m[1] || m[2]).replace(/^\.\//, '').split('#')[0];
    if (!target || /^[a-z]+:|^\/\//i.test(target)) continue;
    targets.add(target.slice(0, 301));
    if (targets.size > 100) throw Error('Skill exceeds 100 declared resource links');
  }
  const edges = [...targets].sort().map(target => {
    try {
      const size = fs.statSync(resourceFile(root, id, target)).size;
      return { relation: 'references', target, kind: target.split('/')[0], status: 'available', bytes: size };
    } catch { return { relation: 'references', target, status: 'unavailable-or-blocked' }; }
  });
  return { schema: 'agent-meeting/skill-graph@1', id, ...meta,
    sha256: crypto.createHash('sha256').update(text).digest('hex'), edges,
    scope: 'explicit-links-only; resources not loaded; no persistent index' };
}
function listSkills(options = {}) {
  const root = location(options), offset = Number(options.offset ?? 0), limit = Number(options.limit ?? 10);
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw Error('offset >= 0; limit 1–20');
  const query = String(options.query || '').toLowerCase();
  if (query.length > 200) throw Error('Query too long');
  let entries;
  try { entries = fs.readdirSync(root).sort(); } catch (e) { if (e.code === 'ENOENT') entries = []; else throw e; }
  if (entries.length > 200) throw Error('Catalog exceeds 200 entries; select a smaller --dir');
  const items = []; let skipped = 0;
  for (const id of entries) {
    try {
      const meta = manifest(read(skillFile(root, id), true));
      const matchedResources = options.graph && query ? inspectSkill(id, options).edges.filter(e => e.status === 'available' && e.target.toLowerCase().includes(query)).map(e => e.target).slice(0, 3) : [];
      if (!query || `${id} ${meta.name} ${meta.description}`.toLowerCase().includes(query) || matchedResources.length)
        items.push({ id, ...meta, ...(matchedResources.length ? { matchedResources } : {}) });
    } catch { skipped++; }
  }
  return { schema: 'agent-meeting/skills@1', source: options.dir || options.local ? 'local' : 'bundled',
    items: items.slice(offset, offset + limit), nextOffset: offset + limit < items.length ? offset + limit : null, skipped };
}
function showSkill(id, options = {}) {
  const root = location(options);
  const entry = read(skillFile(root, id)); manifest(entry);
  if (options.resource && !inspectSkill(id, options).edges.some(e => e.target === options.resource && e.status === 'available')) throw Error('Resource is not an available declared link');
  if (options.resource && !/\.(md|txt|json|csv|tsv|ya?ml|js|mjs|cjs|py|sh|html|css)$/i.test(options.resource)) throw Error('Only text resources can be shown');
  const text = options.resource ? read(resourceFile(root, id, options.resource)) : entry;
  if (Buffer.byteLength(text) > MAX_SHOW) throw Error('Skill exceeds 32000 bytes; inspect its file directly (not truncated)');
  return text;
}
function doctor() {
  const conn = require('./connect');
  let room = 'missing';
  try {
    const c = JSON.parse(read(conn.roomsPath()));
    const r = c?.rooms?.[process.env.AGENT_MEETING_ROOM || c.current];
    if (r) { const u = new URL(r.url); room = /^https?:$/.test(u.protocol) && /^\w+$/.test(r.room) ? 'configured' : 'invalid'; }
  } catch (e) { if (e.code !== 'ENOENT') room = 'invalid'; }
  let bridge = 'missing';
  try { const st = fs.lstatSync(conn.bridgePath()); bridge = st.isFile() && !st.isSymbolicLink() ? 'present' : 'invalid'; }
  catch (e) { if (e.code !== 'ENOENT') bridge = 'unreadable'; }
  return { schema: 'agent-meeting/doctor@1', node: process.versions.node, room, bridge,
    executables: Object.fromEntries(Object.keys(conn.AGENTS).map(id => { const file = conn.findCli(id); return [id, !!file && fs.existsSync(file)]; })),
    connection: 'not-probed', modelAccess: 'unknown', permissions: 'not-checked',
    next: room !== 'configured' ? 'Start a room or ask the user to connect a room.' : bridge !== 'present' ? 'Ask the user to connect their CLI.' : 'In the connected CLI, discover join and request admission. If MCP was just configured, open a new CLI session.' };
}
function run(args) {
  if (args[0] === 'doctor') { if (args.length !== 1) throw Error('Usage: agent-meeting doctor'); console.log(JSON.stringify(doctor(), null, 2)); return; }
  const action = args[1], options = {}; let id, i = 2;
  if (action === 'show' || action === 'inspect') id = args[i++];
  if (!['list', 'show', 'inspect'].includes(action)) throw Error('Usage: skills list|show|inspect <name> [--local] [--dir <directory>]');
  for (; i < args.length; i++) {
    const key = args[i];
    if (key === '--local') { options.local = true; continue; }
    if (key === '--graph' && action === 'list') { options.graph = true; continue; }
    const allowed = action === 'list' ? ['--dir', '--query', '--offset', '--limit'] : action === 'show' ? ['--dir', '--resource'] : ['--dir'];
    if (!allowed.includes(key) || args[i + 1] === undefined || args[i + 1].startsWith('--')) throw Error('Invalid skill option: ' + key);
    options[key.slice(2)] = args[++i];
  }
  console.log(action === 'show' ? showSkill(id, options) : JSON.stringify(action === 'inspect' ? inspectSkill(id, options) : listSkills(options), null, 2));
}
module.exports = { run, listSkills, showSkill, inspectSkill, doctor };
