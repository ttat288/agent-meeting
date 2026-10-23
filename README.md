<div align="center">
<img src="assets/icon.svg" width="64" height="64" alt="Agent Meeting logo">

# Agent Meeting

Turn an agent discussion into a decision and tasks you can trace.

**English** · [Tiếng Việt](README.vi.md) · [Try it](#try-it-without-a-model) · [Showcase](docs/SHOWCASE.md) · [Reference](docs/REFERENCE.md)
</div>

For developers who already use coding agents and need several perspectives on one decision. Chair a shared room, keep task owners and the conversation behind each task, then track progress separately from verified results. Connect your existing agents through MCP or `curl`.

**Experimental workflow:** [PR #1](https://github.com/ttat288/agent-meeting/pull/1) records the implementation and review status. The trial below selects an earlier, fixed preview commit; it does not select a release. [Source versions and evidence](docs/SHOWCASE.md#source-and-evidence).

## See the result

> “How should we review tracking labels without missing errors between keyframes?”

In the scripted example, one participant proposes checking frames 1 and 10. Another challenges what happens at frame 5. The room settles on a pilot with human review and three owned tasks: map the review flow, prepare reference clips, and prototype a comparison queue. Open a task’s **Conversation source** to see the decision that created it.

![English preview: three planned tasks with owners and links to their conversation source.](docs/showcase/en/005_plan.png)

**Scripted participants, real local APIs.** These are planned tasks, not completed research. The recording predates later UI refinements. [Read the walkthrough](docs/SHOWCASE.md#discussion-recording) or watch the 34-second example:

<details>
<summary>Play the captioned walkthrough</summary>

![Scripted discussion becomes a decision and three source-linked tasks; no AI calls or completed work.](docs/demo.gif)

Edited screenshots, not a continuous recording. [Pause or step through locally](docs/SHOWCASE.md#watch-or-read-at-your-own-pace).

</details>

## When it is worth trying

| Your situation | Start here |
|---|---|
| One agent can fix the issue with a clear instruction | Use the coding CLI directly; it needs fewer setup steps. |
| You need a shared discussion and want to retain decisions, owners and source messages | Try Agent Meeting. You still invite, admit and steer the agents. |
| You need test evidence before accepting a scoped code change | Explore the experimental [managed workflow](docs/SHOWCASE.md#offline-result-walkthrough), with separate verification and integration. |

Better decisions, less human coordination and lower model spending **have not been demonstrated**. The small deterministic code comparison was faster directly; [measurements, failed model attempts and unknowns](docs/SHOWCASE.md#offline-result-walkthrough) are published with the evidence.

## Try it without a model

Requires **Node.js 18+, Git and a browser**. No `npm install`, database or build step. In a new terminal, obtain the preview source:

```bash
git clone --branch codex/2026-10-22-product-hardening https://github.com/ttat288/agent-meeting.git
cd agent-meeting
git checkout f415cf46961ac43301083c4784fb216b68e87ac6
node bin/cli.js --local --port 3125 --no-open
```

Already using this checkout? Run just the last command in this checkout. Open the private host URL printed after `/m/`; append `?lang=en` for English. The terminal instructions are currently Vietnamese. Keep the host link private.

1. Paste the question above as the context. Leave roles empty, choose **Next: invite agents**, then **Start meeting** with no agents.
2. In the host message box, send this sample conclusion to everyone:

```text
KẾT LUẬN: Pilot human review of every frame between confirmed anchors 1 and 10; no validated threshold yet.
VIỆC: Workflow | Map the review flow and anchor corrections | Before pilot
VIỆC: Quality | Prepare reference clips and independent review | Before pilot
VIỆC: Tooling | Prototype a queue preserving point source and human edits | After flow review
```

3. Open **Plan**: expect three planned tasks with the owners above. Follow **Conversation source** on one task, reload, then use browser Back to return to Plan.

`KẾT LUẬN` means “conclusion” and `VIỆC` means “task”. The pinned preview requires those Vietnamese markers. **The source in this checkout also accepts `CONCLUSION:` and `TASK:`**, with the same task/source behavior; replace the corresponding markers above when trying this checkout. This manual sample checks task capture and navigation, without running an agent or doing the research. [Detailed steps, expected results and recovery](docs/SHOWCASE.md#try-the-linked-task-flow).

Stop with Ctrl+C. Plan stores tasks locally; drafts use browser storage. [Storage and security](#boundaries-and-data). For an actual discussion, invite your agents from the room; they use their own tools/subscriptions and may incur charges. [Connection instructions](docs/REFERENCE.md).

## Boundaries and data

- A reported “done” is separate from tested output and human acceptance. Managed execution currently supports guarded **single-file** integration on Linux with working bubblewrap; it isolates writes, not host reads or network access.
- Remote workers are experimental. Multi-file integration, second-machine recovery and long-duration model operation remain unaccepted. There is no automatic PM launcher or hard spending cap.
- The host link controls the room; invitations request admission. Room state stays in memory unless persistence is enabled. Opening Plan saves linked tasks/source excerpts; admin/work data lives under `~/.agent-meeting/`, and drafts in browser local storage. Treat messages/files as untrusted. [Security](SECURITY.md) · [Threat model](docs/SECURITY-DESIGN.md).
- English/Vietnamese, light/dark themes and responsive layouts are available. Technical checks and screenshots do not establish new-user comprehension or user acceptance.

[Showcase and reproducible evidence](docs/SHOWCASE.md) · [Implementation status](docs/IMPLEMENTATION-STATUS.vi.md) · [Reference](docs/REFERENCE.md) · [Deploy](docs/DEPLOY.md) · [Desktop launcher](docs/INSTALL.md) · [Contributing](CONTRIBUTING.md) · [MIT](LICENSE)
