# Local development value check — 24 October 2026

**Unpublished working tree**, based on `1b56f4d` plus pre-existing local changes. These results are not a release, a main-branch feature announcement, or a replacement for the older scripted showcase. The historical preview pin does not contain these new checks.

A real API defect drove this work: after a run had been integrated against requirements v1, reconfiguring the task to v2 and restarting caused its downloaded handoff to attach v2 acceptance/reference text to v1 evidence. A recipient could mistake historical evidence for acceptance of new requirements. The fix exports the executed snapshot and explicitly separates historical/current revisions and unknown legacy data.

Other reproduced failures in the same journey were corrected: restrictive umask changed original file permissions even after rollback; obsolete source refresh could change the current task; incomplete legacy runs could bypass an optional revision fence; model-access recovery confused missing machine identity with CLI access failure.

## Direct agy versus the product

All real calls requested `gemini-3.8-flash-low`; **actual machine model identity remained unknown**. No other model/provider was substituted.

Direct agy native file tools produced a patch in a separate writable source copy. Controlled comparisons hid the real checkout and prior trial outputs and used private Git objects. Failures remain published: a warning-field contract needed clarification, and a later missing-revision check required one PM code correction. A model report was not treated as verified or integrated. The original four tests and a separately labeled post-hoc case are replayed consistently.

The product arm used real config/task/probe/run APIs and the actual runtime. Both its initial probe and a new probe after the old proof expired received a CLI response without a matching machine identity; Run remained blocked. The product's agy writing and task-context MCP guards were preserved. **No completed native managed arm exists for a same-quality cost/speed comparison.**

This does not establish net coordination savings, billing savings, model quality rankings, new-user comprehension or human UX acceptance. For one clear code repair, direct CLI use remains the practical starting point here.

## Read-only safety finding

A real disposable fixture used the adapter's exact agy `write:false` CLI flags and still changed `probe.txt` from `BEFORE` to `AFTER`. The plan flag alone did not enforce filesystem read-only behavior. The outer test sandbox protected real user files throughout.

The runtime was tightened to require Linux/bubblewrap for **every agy model call**, including read-only tasks and probes. With the same request through the default runtime, the file stayed unchanged and the SDK reported a read-only filesystem error. Missing isolation rejects before agent launch. Managed agy writing/MCP support was not enabled. This is filesystem write isolation, not host-read/network isolation or control over external tool servers/user-opened CLIs.

## Evidence and reproduction

- [Final checks, source status and usage](verification.json), [model calls including failures](model-calls.json), [operations and overhead](overhead.json).
- [Actual native/file-boundary checks](readonly-mode-probe.json), [protected runtime result](readonly-runtime-probe.json), [final source hashes](source-freeze.json).
- [Browser](browser/browser.json), [extracted local package](package-verification-final.json), [complete Vietnamese report](ACCEPTANCE.vi.md).

From this **local working tree**:

```bash
node --test test/work-handoff.test.js
node tools/check-value-journey.js
systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test
```

Replay uses stored outputs without inference, preserves expected failures, and removes disposable workspaces. Browser checks use scripted participants and backdated expiry, not native models or measured human time. The final verification JSON identifies which suite/package/source was checked; older receipts do not cover later edits.

CLI token/cache counters are reported separately from explicit prompt bytes. PM tokens, SDK hidden context/tool-schema details, invoices and human time remain unknown; no cache count or byte total is converted into money. Remote trial availability could not be freshly verified because the Git TLS check failed and the API fallback was inaccessible; no certificate verification or global settings were weakened. The README now clones without depending on a topic branch while retaining the same historical commit pin, which is an ancestor of the locally verified merge.
