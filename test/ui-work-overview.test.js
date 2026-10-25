'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadSummary() {
  const source = fs.readFileSync(path.join(__dirname, '../src/ui/workspace.js'), 'utf8');
  const start = source.indexOf('  function latestWorkRun');
  const end = source.indexOf('\n  function workSummary', start);
  assert.ok(start > 0 && end > start, 'actual summary helper must remain discoverable');
  const context = { result: null, activeRun: run => ['queued', 'starting', 'running', 'verifying', 'integrating'].includes(run.status) };
  vm.runInNewContext(source.slice(start, end) + '\nresult = summarizeWorkView;', context);
  return context.result;
}

const plain = summary => Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, { ...value }]));

test('work overview separates setup, readiness, active review failure and completion', () => {
  const summarize = loadSummary();
  const tasks = [
    { id: 'setup', purpose: 'plan', requirementRevision: 1 },
    { id: 'ready', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 },
    { id: 'active', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 },
    { id: 'review', purpose: 'execute', acceptance: ['done'], requirementRevision: 2 },
    { id: 'failed', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 },
    { id: 'done', purpose: 'execute', acceptance: ['done'], requirementRevision: 1, status: 'done' }
  ];
  const runs = [
    { taskId: 'active', requirementRevision: 1, status: 'running' },
    { taskId: 'review', requirementRevision: 1, status: 'failed' },
    { taskId: 'review', requirementRevision: 2, status: 'reported' },
    { taskId: 'failed', requirementRevision: 1, status: 'failed' },
    { taskId: 'done', requirementRevision: 1, status: 'integrated' }
  ];
  assert.deepEqual(plain(summarize('plan', tasks, runs, [])), {
    setup: { count: 1, targetTaskId: 'setup' }, prepared: { count: 4, targetTaskId: 'ready' }, ready: { count: 0, targetTaskId: null },
    active: { count: 0, targetTaskId: null }, review: { count: 0, targetTaskId: null }, attention: { count: 0, targetTaskId: null }, complete: { count: 1, targetTaskId: 'done' }
  });
  assert.deepEqual(plain(summarize('results', tasks, runs, [])), {
    setup: { count: 0, targetTaskId: null }, prepared: { count: 0, targetTaskId: null }, ready: { count: 0, targetTaskId: null },
    active: { count: 1, targetTaskId: 'active' }, review: { count: 1, targetTaskId: 'review' }, attention: { count: 1, targetTaskId: 'failed' }, complete: { count: 1, targetTaskId: 'done' }
  });
});

test('work overview ignores tasks without results and stale run revisions', () => {
  const summarize = loadSummary();
  const tasks = [{ id: 'task', purpose: 'execute', acceptance: ['done'], requirementRevision: 3 }];
  assert.deepEqual(plain(summarize('results', tasks, [{ taskId: 'task', requirementRevision: 2, status: 'reported' }], [])).attention, { count: 1, targetTaskId: 'task' });
  assert.deepEqual(plain(summarize('results', tasks, [], [])).attention, { count: 0, targetTaskId: null });
});

test('work overview uses timestamp across local and remote runs and never promotes an unknown legacy revision', () => {
  const summarize = loadSummary();
  const tasks = [{ id: 'task', purpose: 'execute', acceptance: ['done'], requirementRevision: 2 }];
  const local = [{ taskId: 'task', requirementRevision: 2, status: 'reported', startedAt: '2026-10-24T09:00:00Z' }];
  const remote = [{ taskId: 'task', requirementRevision: 2, status: 'failed', startedAt: '2026-10-24T08:00:00Z' }];
  assert.deepEqual({ ...summarize('results', tasks, local, remote).review }, { count: 1, targetTaskId: 'task' });
  assert.deepEqual({ ...summarize('results', tasks, [{ taskId: 'task', status: 'reported' }], []).attention }, { count: 1, targetTaskId: 'task' });
});

test('work overview target follows task order across local and remote statuses and empty groups stay inert', () => {
  const summarize = loadSummary();
  const tasks = [
    { id: 'remote-first', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 },
    { id: 'local-second', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 },
    { id: 'ready-third', purpose: 'execute', acceptance: ['done'], requirementRevision: 1 }
  ];
  const local = [{ taskId: 'local-second', requirementRevision: 1, status: 'failed' }];
  const remote = [{ taskId: 'remote-first', requirementRevision: 1, status: 'reported' }];
  const execute = summarize('tasks', tasks, local, remote);
  assert.deepEqual({ ...execute.attention }, { count: 2, targetTaskId: 'remote-first' });
  assert.deepEqual({ ...execute.ready }, { count: 1, targetTaskId: 'ready-third' });
  assert.deepEqual({ ...execute.active }, { count: 0, targetTaskId: null });
});
