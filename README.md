<div align="center">
<img src="assets/brand/foxul.png" width="144" height="144" alt="Foxul — the chairman fox">

# Foxul

**Multiple agents. One clear outcome.**

The moderation layer that keeps multi-agent discussions on track and drives them to a final decision.

**English** · [Vietnamese](README.vi.md) · [Try it](#try-it-without-a-model) · [Showcase](docs/SHOWCASE.md) · [Reference](docs/REFERENCE.md)
</div>

Bring your coding agents into one room. Set the brief, direct the discussion and retain the decision, its owners and the conversation behind every task. Foxul connects your existing agents through MCP or `curl`; you control admission and the final call.

Runs locally on Node.js. No runtime dependencies, database or build step. [Architecture and connection reference](docs/REFERENCE.md).

## See the result

> “How should we review tracking labels without missing errors between keyframes?”

In the scripted example, one participant proposes checking frames 1 and 10. Another challenges what happens at frame 5. The room settles on a pilot with human review and three owned tasks: map the review flow, prepare reference clips, and prototype a comparison queue. Open a task’s **Conversation source** to see the decision that created it.

[![Foxul demo: one decision becomes three owned, source-linked tasks.](docs/showcase/foxul-demo-poster.png)](docs/showcase/foxul-demo.mp4)

**[Watch the narrated 46-second demo](docs/showcase/foxul-demo.mp4)** · [Vietnamese subtitles](docs/showcase/foxul-demo.vi.vtt) · [Local player](docs/showcase/index.html) · [Source and verification](docs/SHOWCASE.md#foxul-demo-video)

Scripted participants use real local APIs; all three tasks remain **planned**, not completed or verified. The video includes English AI narration, Vietnamese subtitles and [licensed background music](docs/showcase/music/LICENSE.md). [Recording details and source hashes](docs/SHOWCASE.md#foxul-demo-video).

## When it is worth trying

| Your situation | Start here |
|---|---|
| One agent can fix the issue with a clear instruction | Use the coding CLI directly; it needs fewer setup steps. |
| You need a shared discussion and want to retain decisions, owners and source messages | Try Foxul. You still invite, admit and steer the agents. |
| You need test evidence before accepting a scoped code change | Explore the experimental [managed workflow](docs/SHOWCASE.md#offline-result-walkthrough), with separate verification and integration. |

Foxul preserves the discussion and its handoffs. Decision quality, coordination savings and lower model spending have not been established. The direct CLI was faster in the small deterministic code comparison. [Comparison and evidence](docs/SHOWCASE.md#offline-result-walkthrough).

## Try it without a model

Requires **Node.js 18+, Git and a browser**. No `npm install`, database or build step. In a new terminal:

```bash
git clone https://github.com/ttat288/foxul.git
cd foxul
node bin/cli.js --local --port 3125 --no-open
```

Already using this checkout? Run just the last command. The package and CLI retain the name `agent-meeting` for compatibility. Open the private host URL containing `/m/`; append `?lang=en` for English. Keep the host link private.

1. Paste the question above as the context. Leave roles empty, choose **Next: invite agents**, then **Start meeting** with no agents.
2. In the host message box, send this sample conclusion to everyone:

```text
CONCLUSION: Pilot human review of every frame between confirmed anchors 1 and 10; no validated threshold yet.
TASK: Workflow | Map the review flow and anchor corrections | Before pilot
TASK: Quality | Prepare reference clips and independent review | Before pilot
TASK: Tooling | Prototype a queue preserving point source and human edits | After flow review
```

3. Open **Plan**: expect three planned tasks with the owners above. Follow **Conversation source** on one task, reload, then use browser Back to return to Plan.

This manual sample checks task capture and navigation, without running an agent or doing the research. [Detailed steps, expected results and recovery](docs/SHOWCASE.md#try-the-linked-task-flow).

Stop with Ctrl+C. Plan stores tasks locally; drafts use browser storage. [Storage and security](#boundaries-and-data). For an actual discussion, invite your agents from the room; they use their own tools/subscriptions and may incur charges. [Connection instructions](docs/REFERENCE.md).

## Boundaries and data

- A reported “done” is separate from tested output and human acceptance. Managed code writing currently uses **Claude Code**, with guarded **single-file** integration on Linux and working bubblewrap. The agy adapter does not support managed code writing. These boundaries isolate filesystem writes, not host reads or network access. [Adapter limits and local direct-agy evidence](docs/SHOWCASE.md#managed-execution-boundaries).
- Remote workers are experimental. Multi-file integration, second-machine recovery and long-duration model operation remain unaccepted. There is no automatic PM launcher or hard spending cap.
- The host link controls the room; invitations request admission. Room state stays in memory unless persistence is enabled. Opening Plan saves linked tasks/source excerpts; admin/work data lives under `~/.agent-meeting/`, and drafts in browser local storage. Treat messages/files as untrusted. [Security](SECURITY.md) · [Threat model](docs/SECURITY-DESIGN.md).
- English/Vietnamese, light/dark themes and responsive layouts are available.

[Showcase and reproducible evidence](docs/SHOWCASE.md) · [Implementation status](docs/IMPLEMENTATION-STATUS.vi.md) · [Reference](docs/REFERENCE.md) · [Deploy](docs/DEPLOY.md) · [Desktop launcher](docs/INSTALL.md) · [Contributing](CONTRIBUTING.md) · [MIT](LICENSE)
