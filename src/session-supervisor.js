'use strict';
const fs = require('fs'), path = require('path');
const { fork } = require('child_process');
// No caller-controlled executable or arguments. childPath is a constructor-only
// test seam, never loaded from HTTP, a checkpoint, routing config or a prompt.
class SessionSupervisor {
  constructor({ childPath = path.join(__dirname, 'session-child.js'), readyTimeoutMs = 35000 } = {}) { this.childPath = childPath; this.readyTimeoutMs = readyTimeoutMs; this.sessions = new Set(); }
  open(options, checkpoint) {
    const env = { ...process.env }; delete env.NODE_OPTIONS; delete env.NODE_PATH; delete env.NODE_TEST_CONTEXT;
    // Credentials used by the parent API clients are not model environment data.
    for (const k of Object.keys(env)) if (/^AGENT_MEETING_(PM|TEAM)_/.test(k)) delete env[k];
    const child = fork(this.childPath, [], { cwd: options.workspace, env, execArgv: ['--max-old-space-size=256'], detached: true, stdio: ['ignore','ignore','ignore','ipc'] });
    const s = { child, pid: child.pid, stopped: false, activated: false };
    this.sessions.add(s);
    s.closed = new Promise(resolve => { child.once('exit', (code, signal) => resolve({ code, signal })); child.once('error', e => resolve({ error: e.message })); });
    s.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Successor readiness timeout')), this.readyTimeoutMs);
      const onMessage = m => { if (m.type === 'ready') { clearTimeout(timer); resolve(m); } if (m.type === 'failure') { clearTimeout(timer); reject(Error(m.error)); } };
      child.on('message', onMessage);
      s.closed.then(() => { clearTimeout(timer); child.off('message', onMessage); reject(Error('Session exited before readiness')); });
    });
    s.result = new Promise(resolve => {
      child.on('message', m => {
        if (m.type === 'request' && s.activated && !s.stopped) {
          s.observation = m.observation;
          Promise.resolve().then(() => options.onRequest?.(m.request, s)).catch(e => { if (child.connected) child.send({ type: 'request-error', error: e.message }); });
        }
        if (m.type === 'result') { s.report = m.result; } if (m.type === 'failure') s.error = m.error; });
      s.closed.then(async () => {
        // A CLI might have left children after reporting. Reap them before
        // WorkManager is permitted to verify or another generation can write.
        try { await this.stop(s); resolve(s.report || { ...(s.observation || {}), status: 'failed', reportedModel: s.observation?.reportedModel || 'unknown', error: s.error || 'Session closed without report' }); }
        catch (e) { resolve({ status: 'interrupted', reportedModel: 'unknown', error: e.message }); }
      });
    });
    const { signal, onRequest, ...wireOptions } = options;
    child.send({ type: 'boot', options: wireOptions, checkpoint });
    return s;
  }
  activate(s) { if (s.stopped || s.activated) throw Error('Session is stopped or already active'); s.activated = true; s.child.send({ type: 'activate' }); return s.result; }
  live(pid) {
    // Linux managed writes require bwrap. Zombies cannot write and must not be
    // mistaken for a live writer while the OS reaps an orphan.
    for (const name of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(name)) continue;
      try { const stat = fs.readFileSync('/proc/' + name + '/stat','utf8'); const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' '); if (+fields[2] === pid && fields[0] !== 'Z') return true; } catch {}
    }
    return false;
  }
  stop(s) {
    if (s.stopping) return s.stopping;
    s.stopped = true;
    s.stopping = (async () => {
      const kill = signal => { if (!s.pid) return; try { process.kill(-s.pid, signal); } catch (e) { if (e.code !== 'ESRCH') throw e; } };
      kill('SIGTERM');
      const start = Date.now();
      while (this.live(s.pid)) {
        if (Date.now() - start > 200) kill('SIGKILL');
        if (Date.now() - start > 5000) throw Error('Cannot prove old process group stopped; reconcile required');
        await new Promise(r => setTimeout(r, 20));
      }
      await s.closed;
      this.sessions.delete(s);
      return { pid: s.pid, stoppedAt: Date.now(), boundary: 'managed-process-group', liveWriters: 0 };
    })();
    return s.stopping;
  }
  close() { return Promise.all([...this.sessions].map(s => this.stop(s))); }
}
module.exports = { SessionSupervisor };
