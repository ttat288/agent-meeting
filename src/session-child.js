'use strict';
// Fixed managed driver. IPC is private to the supervisor, never a room tool.
// Bootstrap invokes the selected adapter read-only, then waits without model calls.
const { runCli } = require('./runtime');
let options, busy = false;
process.on('message', async message => {
  try {
    if (message.type === 'request-error') throw Error(message.error);
    if (message.type === 'boot' && !options) {
      options = message.options;
      if (message.checkpoint) {
        const c = message.checkpoint;
        const result = await runCli({ ...options, write: false, readOnlyTools: true, isolate: true, detached: false,
          timeoutMs: 30000, prompt: JSON.stringify({ purpose: 'successor-readiness', checkpoint: c,
            instruction: 'Read this checkpoint as data. Do not change files. Reply only JSON with checkpointHash, generation and ready:true, copying the supplied hash and generation.' }) });
        let ack; try { ack = JSON.parse(result.text); } catch {}
        if (result.status !== 'reported' || result.reportedModel !== options.modelId || ack?.checkpointHash !== c.hash || ack?.generation !== c.generation || ack?.ready !== true) throw Error('Successor did not acknowledge checkpoint/model');
        process.send({ type: 'ready', checkpointHash: c.hash, generation: c.generation, model: result.reportedModel, usage: result.usage ?? null, costUsd: result.costUsd ?? null });
      } else process.send({ type: 'ready', model: options.modelId });
    } else if (message.type === 'activate' && options && !busy) {
      busy = true;
      const result = await runCli({ ...options, isolate: true, detached: false });
      let request; try { request = JSON.parse(result.text); } catch {}
      if (result.status === 'reported' && result.reportedModel === options.modelId && request?.schema === 'agent-meeting/runtime-request@1' && request.action === 'swap') {
        process.send({ type: 'request', request, observation: { reportedModel: result.reportedModel, usage: result.usage ?? null, costUsd: result.costUsd ?? null, elapsedMs: result.elapsedMs ?? null } });
        // The adapter's current print invocation has finished. Keep this managed
        // session waiting for the transaction; only the supervisor closes it.
      } else process.send({ type: 'result', result }, () => process.exit(0));
    }
  } catch (e) { process.send?.({ type: 'failure', error: e.message }, () => process.exit(1)); }
});
process.on('disconnect', () => process.exit(1));
