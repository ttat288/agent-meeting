'use strict';
// Local clients share validation; neither endpoint accepts a shell command.
async function request(role, action, input) {
  const prefix = role === 'pm' ? 'AGENT_MEETING_PM_' : 'AGENT_MEETING_TEAM_';
  const url = new URL(process.env[prefix + 'URL'] || '');
  if (url.protocol !== 'http:' || !['127.0.0.1','localhost'].includes(url.hostname) || !new RegExp('^/api/' + role + '/\\w+/?$').test(url.pathname) || url.username || url.password || url.search || url.hash) throw Error('Operator URL must be a local HTTP /api/' + role + '/<room> endpoint');
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  if (!process.env[prefix + 'TOKEN']) throw Error(role.toUpperCase() + ' token required');
  const response = await fetch(url.href.replace(/\/$/, '') + '/' + action, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env[prefix + 'TOKEN'] }, body: JSON.stringify(input), signal: AbortSignal.timeout(65000) });
  const data = await response.json(); if (!response.ok) throw Error(data.error || 'HTTP ' + response.status); return data;
}
async function main(role, actions) {
  const [action, raw = '{}'] = process.argv.slice(2), input = JSON.parse(raw);
  if (!actions.includes(action)) throw Error('Usage: node bin/' + role + '.js ' + actions.join('|') + " '{JSON}'");
  let result;
  if (action === 'watch') {
    // Awaited by a live CLI/tool process. No heartbeat snapshots are printed or
    // passed to a model. Unacknowledged events survive exit/disconnection.
    const maxWaitMs = input.maxWaitMs ?? 3 * 3600000;
    if (!Number.isSafeInteger(maxWaitMs) || maxWaitMs < 1 || maxWaitMs > 8 * 3600000) throw Error('maxWaitMs must be 1..28800000');
    const deadline = Date.now() + maxWaitMs;
    do {
      result = await request(role, 'events', { goalRevision: input.goalRevision, timeoutMs: Math.min(25000, Math.max(1, deadline - Date.now())) });
      if (result.events?.length || result.blocked) break;
    } while (Date.now() < deadline);
  } else result = await request(role, action, input);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
module.exports = { main, request };
