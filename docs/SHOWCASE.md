# Agent Meeting showcase

**One decision → three owned tasks → the source behind each task.** Start with the discussion example, then try task capture in your own browser without calling a model. The separate code fixture below checks verification/integration; it does not complete the research in this example.

## Source and evidence

- **Pinned historical preview:** commit `f415cf46961ac43301083c4784fb216b68e87ac6` on branch `codex/2026-10-22-product-hardening`. The README trial deliberately selects this earlier source. [PR #1](https://github.com/ttat288/agent-meeting/pull/1) records the implementation and current review/merge status; package version `3.5.0` alone does not identify the source.
- **This checkout adds:** English `CONCLUSION:`/`TASK:` capture aliases, `tools/try-workflow.js` and bounded failure diagnostics on explicit managed retries. Use the current PR branch checkout rather than the historical pin for these additions. [Retry acceptance and limitations](evidence/retry-context/ACCEPTANCE.vi.md) distinguish scripted software checks from unproven model efficacy.
- **Discussion media:** captured on 2026-10-21 from the earlier integrated checkout, with scripted participants over real HTTP APIs. [EN manifest](showcase/en/manifest.json) · [VI manifest](showcase/vi/manifest.json) · [capture source hashes](evidence/showcase/source-hashes.txt). Later UI refinements are not pictured. The README uses scene 06, `005_plan.png`, in each language; the GIF combines ten scenes lasting 34 seconds.
- **What is not established:** model problem-solving quality, better decisions, net coordination savings, token/billing savings and new-user acceptance. Fixture assertions and self-review do not establish those outcomes. The direct deterministic code arm was faster; its full scope and unknowns are [below](#offline-result-walkthrough).

[Prior local review checks](evidence/showcase/readme-review.json) record the documentation/source hashes before the English capture fix. [English capture regression](evidence/consistency/english-capture.json) records the new parser/API verification; no new browser acceptance is implied. Older browser/CI receipts apply to their recorded sources, not automatically to later source changes. Some deep engineering documents are Vietnamese; this page gives the English explanation of the claims, measurements and material limits.

## Try the linked-task flow

Use the exact preview checkout command in the [English README](../README.md#try-it-without-a-model) or [Vietnamese README](../README.vi.md#thử-không-cần-model). Node.js 18+, Git and a browser are sufficient; bubblewrap is needed only for managed code execution, not this trial.

1. Start `node bin/cli.js --local --port 3125 --no-open`. It binds loopback; if 3125 is busy it chooses another port. Open the **printed** host URL containing `/m/`, adding `?lang=en` or `?lang=vi`. Keep it private. The CLI's instructions remain Vietnamese.
2. Enter the tracking-review question from the README as the context. Leave roles empty and use the normal form, not JSON. Choose **Next: invite agents** → **Start meeting** without inviting anyone. No model, client configuration or paid probe is needed.
3. Paste the README's four-line sample into the host message box, addressed to everyone, then **Send**. `KẾT LUẬN:` records a conclusion; each `VIỆC: owner | task | deadline` records a task. Those literal Vietnamese markers are required in the pinned preview; the newer source in this checkout also accepts `CONCLUSION:` and `TASK:` with the same meaning. This is a manually supplied conclusion, not automated reasoning or a full replay of the discussion.
4. Open **Plan**. Expect three tasks owned by Workflow, Quality and Tooling, with the sample text and deadlines, initially planned. Open a **Conversation source** link: it should return to that exact conclusion. Reload there, then use browser Back: the same task IDs and contents should remain in Plan.
5. Stop with Ctrl+C. This result is a source-linked plan, not completed work or verified code. An actual discussion adds your agents, admission and their own model/tool costs; follow the [connection reference](REFERENCE.md).

**If it does not match:** if Start is disabled, clear any role slots saved in your browser draft; roles require matching participants. If the host says the meeting has ended, begin a new meeting before sending the sample. If Plan is empty, check the literal markers and send to everyone, not a private recipient; use Retry if a network error is shown. Do not resend a successful sample: repeated task lines can create additional tasks. A missing host page usually means the server stopped or you opened the wrong port; use the current printed URL. Use the pinned preview checkout if Plan/source links are absent from another version.

**Local data:** opening Plan persists tasks/source excerpts under the configured work directory (default `~/.agent-meeting/work`); admin/routing config lives separately under `~/.agent-meeting/config`. Room state is memory-only unless `--data-dir` is enabled, so server restart is not part of this manual trial. Browser drafts can outlive a server. The CLI also registers the local room for the MCP bridge; it does not register tools with an AI client unless you explicitly run `connect`. Use `--config-dir` and `--work-dir` with disposable directories for isolated work data. [Security policy](../SECURITY.md).

## Discussion recording

The showcase follows one question: **can annotators review tracking labels faster without missing errors between keyframes?** The point of the demonstration is the meeting workflow: a proposal is challenged, refined into a decision and split into tasks that retain their source.

The interface is captured from the source checkout. Participants are **scripted**, labeled as such in the UI, and talk through the real local HTTP APIs. No AI/model CLI is invoked. The tracking approach is a pilot proposal, not a validated claim about CVAT or a finished annotation tool. All three research tasks remain planned. A blocked progress report demonstrates follow-up; it is not verification.

## Watch or read at your own pace

- [English GIF](demo.gif) · [Vietnamese GIF](demo.vi.gif): ten paced scenes, 34 seconds, captions outside the application image. This is an edited screenshot walkthrough, not a continuous real-time recording.
- [Static English scenes](showcase/en) · [Static Vietnamese scenes](showcase/vi): lossless 1280×800 application captures, without captions composited into the UI.
- The local HTML player has play/pause, previous/next, a keyboard-operable scene slider and language selection. It starts paused, including with reduced-motion enabled, and pauses when the page is hidden.

To open the player from a checkout:

```bash
python3 -m http.server 3121 --bind 127.0.0.1 --directory docs
# Open http://127.0.0.1:3121/showcase/ (or add ?lang=vi).
```

The player is a documentation artifact. It does not change the application server or its CSP. The README shows a static Plan capture first; its animation is inside an expandable section.

## The story

| Scene | What happens | Why it matters |
|---|---|---|
| 01 · Brief | The host asks for a pilot workflow, limits and three tasks. | Start with a decision, not an open-ended chat. |
| 02 · Invite | Workflow, Quality and Tooling participants join. | The room brings complementary perspectives together. |
| 03 · Challenge | Quality questions confidence at frame 10. | A second perspective exposes a hidden assumption. |
| 04 · Refine | The participants discuss split segments, human review and independent samples. | The plan improves through direct responses. |
| 05 · Decide | The host asks for a conclusion; the room records a decision and owners. | The discussion produces an explicit next step. |
| 06 · Plan | Three linked tasks appear in Plan. | Ownership and source survive the view change. |
| 07 · Source | A task opens the message that created it. | Readers can check why the work was proposed. |
| 08 · Follow-up | The meeting enters WORK with the transcript still readable. | Progress continues in the same room. |
| 09 · Provenance | Task details retain the original context; a report marks missing reference clips. | Self-reported progress is distinct from verified execution. |
| 10 · End | The host closes the room, leaving three unfinished tasks and minutes/follow-up controls. | Closing a meeting does not manufacture completed work. |

## Offline result walkthrough

Pain point addressed: a reader could watch a discussion but had no short path to a checked code result. The old README's unpinned main command also did not select the source shown in its experimental screenshots. The new local command uses the actual server/work manager with disposable state and no model:

```bash
node tools/try-workflow.js > /tmp/agent-meeting-result.json
```

Requires Node >=18, Linux and working `/usr/bin/bwrap`. No install/network service or client setup. It fails closed without the sandbox. On the historical pinned preview, use `node --test test/consistency.test.js` instead; that older test does not emit the new comparison report.

Input: `sum.js` subtracts; `test/sum.test.js` asserts `sum(2,3) === 5`. Acceptance shared with direct: fix the result, change only `sum.js`, preserve test bytes. Both deterministic arms receive the same known patch and access to Node/test, without restricting a real baseline CLI's tools. This is a machinery comparison; the strong **model** baseline remains blocked/unrun in this session, not replaced by this fixture.

| Step | Observable result |
|---|---|
| Start room and post scripted conclusion/task | One task retains decision message index and context. No AI extraction quality claim. |
| Configure the task, then save an old revision | HTTP409; read current revision and continue. |
| Fixture writer reports from its separate workspace | Original source still fails; a report alone does not integrate it. |
| Verify, then integrate | Two independent test exits0; only `sum.js` changes; direct/managed output hashes agree. |
| Close server and reopen the same temporary stores | Task/run IDs, integration evidence, source-current flag and integrated status survive. |

[Raw run](evidence/showcase/offline-workflow.json) records source hashes, input/output hashes, errors, per-request body sizes/timings and test output. The resulting file is included in `managed.output`; temporary data is removed on exit. Exit0 confirms the assertions. On failure the command prints a diagnostic and exits nonzero; it does not invent a successful report.

[Repeatability/hash checks](evidence/showcase/offline-repeat-check.json) and [5/5 existing consistency tests](evidence/showcase/offline-consistency-tests.txt) passed. The [earlier source/PR snapshot and link check](evidence/showcase/source-status.json) apply to that recorded revision; [documentation review checks](evidence/showcase/readme-review.json) cover the earlier documentation update, which changed no production source and did not rerun the full suite. Subsequent parser/retry changes have separate [454-test integrated verification](evidence/retry-context/verification.json).

One sample: **565.55 ms direct vs 1,037.21 ms managed**, 14 managed API requests, 64,804 bytes/4 files in the temporary work store. Managed includes config/conversation/conflict/restart; direct gets a tested file without linked history. Direct is faster here. Setup of the two input repos is outside both timers; direct runs first. Header/TCP bytes, total disk, human time, development/maintenance cost and model billing are unmeasured. Do not extrapolate this toy fixture to productivity or model quality.

The API fixture has separate historical [Results screenshots and capture hashes](evidence/shift-20261022/toast-burst-browser.json); the README's Plan image belongs to the discussion fixture instead. Neither image is a capture of the offline command's run. Prior [native model failures](evidence/shift-20261022/ACCEPTANCE.vi.md#benchmark-có-rawscript) remain unresolved; no calls, OAuth repair or retries were made here.

## Reproduce the recording

Development prerequisites: an existing Chromium browser, Playwright available outside the app, and Python/Pillow for GIF encoding. These are documentation tools, not runtime dependencies. No installer is invoked and no package is added to Agent Meeting. The examples below use your own paths for the external tools.

```bash
export PLAYWRIGHT_MODULE=/absolute/path/to/playwright
export BROWSER_BIN=/absolute/path/to/chromium
node tools/record-demo.js /tmp/am-demo-en
node tools/record-demo.js /tmp/am-demo-vi --vi

# Copy the generated PNG frames and manifest.json into docs/showcase/en and vi.
# Serve the player as above, then capture the separately captioned presentation:
node tools/render-showcase.js http://127.0.0.1:3121/showcase /tmp/am-captioned-en
node tools/render-showcase.js http://127.0.0.1:3121/showcase /tmp/am-captioned-vi --vi
python3 tools/make-gif.py /tmp/am-captioned-en docs/demo.gif
python3 tools/make-gif.py /tmp/am-captioned-vi docs/demo.vi.gif

# Independent checks of WORK/ENDED, including real browser zoom:
node tools/check-showcase.js /tmp/am-showcase-check
```

The recorder binds a temporary server to an OS-assigned loopback port, isolates config/work data under a temporary directory and removes it afterward. It does not use port 3000, existing meeting rooms, personal browser profiles or global settings. Frames use the current source's English/Vietnamese UI. The manifest records scene timing, responsive checks and the scripted-data disclosure.

## Verification and limits

See [browser evidence](evidence/showcase/checks.json) and [player checks](evidence/showcase/player.json). Independent checks cover long tasks and empty rooms, WORK/ENDED, both languages and system light/dark at 375/768/1280 CSS px with a 608 px viewport; keyboard disclosure controls, minutes download, task-source navigation, Back/reload and carry; browser zoom 200% in a disposable extension/profile. Test regression details: [tests](evidence/showcase/tests.json).

The earlier ENDED failure left only about 24 px of transcript with three long tasks. The revised footer keeps a state summary and Plan link, with exports/next meeting under a disclosure. In the current long-task fixture, the transcript has about 370–423 px at the tested viewport sizes; expanding the footer preserves scrolling space. [Desktop](evidence/showcase/ended-1280.png) · [Mobile](evidence/showcase/ended-375.png) · [Zoom 200%](evidence/showcase/zoom200.png).

These checks establish the recorded behavior, not user acceptance of the overall design, model quality, annotation accuracy or real remote-worker reliability. The demo does not show managed execution or integration. Their scope and limits remain in [implementation status](IMPLEMENTATION-STATUS.vi.md).

## Managed execution boundaries

The code fixture is a developer/API check, not an interactive browser tutorial. Managed execution requires Linux and working `/usr/bin/bwrap`; missing isolation fails closed. It supports guarded single-file integration, independent Node tests, cancellation and rollback conflict checks. Write isolation does not isolate host reads or network. The web writer deadline is 120 seconds and each Node check is limited to 30 seconds; cancellation/escalation can add two seconds.

Remote workers remain experimental. A tunnel supplies connectivity, not process lifecycle management or verified results. Multi-file integration, second-machine recovery and long-duration model operation have not been accepted. There is no automatic PM launcher or hard spending cap. Catalog entries and executable/version checks do not prove model access. [Implementation status](IMPLEMENTATION-STATUS.vi.md) · [Routing workflow](ROUTING-WORKFLOW.vi.md).
