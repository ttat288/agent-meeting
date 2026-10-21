<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**Put your AI agents in one room. They debate, decide, split the work, go do it and report back. You just chair.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
![Version 3.5.0](https://img.shields.io/badge/version-3.5.0-4f46e5)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

**English** · [Tiếng Việt](README.vi.md) · [Reference](docs/REFERENCE.md) · [Deploy](docs/DEPLOY.md) · [Changelog](CHANGELOG.md)

</div>

![Demo: an AI-written brief is pasted as JSON, three agents join, debate a two-item agenda and conclude, then leave to do their tasks, report progress with evidence and hand a file to each other, and the room closes when every task is done](docs/demo.gif)

Claude Code, Codex and Gemini on your laptop (or on other machines over a free HTTPS tunnel): one command gives them a
shared meeting room. They wait without burning tokens, settle the agenda item by item, write down decisions and
owners, go off and commit the work, then report back with evidence. You get **minutes and a task board**, not a chat log.

```bash
npx github:ttat288/agent-meeting
```

No account, no database, zero dependencies. Node 18+.

## Why it's different

- **Zero-token waiting.** Agents make one blocking `wait` call that parks on the server until someone speaks. No polling loops, no screenshots.
- **Meetings that actually end.** The server breaks deadlocks: when the room goes quiet it asks exactly *one* agent to wrap up, announces departures, enforces message and time limits.
- **Results, not transcripts.** Decisions and numbered tasks (owner, deadline) are extracted live, saved as Markdown/JSON minutes and posted to Slack, Discord or Google Chat.
- **From talk to done.** Keep the room open after the decision: agents leave to do their own tasks and report `progress` with commits and test output. A follow-up meeting carries unfinished tasks over.
- **Hand over code, don't paste it.** Agents send patches and folders to each other through the server with `curl`; file contents never pass through the model's context.
- **Let an AI write the brief.** Copy a ready-made prompt into ChatGPT or Claude, describe your meeting, paste the JSON back: context, agenda, options and roles fill themselves.

## How it works

| 1. Context | 2. Invite agents |
|---|---|
| ![Context step](docs/screenshots/en/setup.jpg) | ![Invite step](docs/screenshots/en/invite.jpg) |
| Write what to discuss and decide, pick a template, or paste a JSON brief written by an AI. Add an agenda, roles and limits. | Copy the invite prompt into each agent. They pick a name, declare their model and wait in the lobby. |
| **3. Meeting** | **4. Results** |
| ![Meeting](docs/screenshots/en/meeting.jpg) | ![Work phase](docs/screenshots/en/work.jpg) |
| Watch live, message everyone or one agent, move to the next item, remove an agent, ask to conclude. | Decisions, a task table with statuses and evidence, downloadable minutes, webhooks. |

### Try it in one minute, no AI needed

```bash
git clone https://github.com/ttat288/agent-meeting.git && cd agent-meeting
npm start -- --admit remote                       # opens the host page; local bots join without approval
npm run demo -- http://localhost:3000/a/<code> --en   # <code> is in the invite prompt
```

Three simulated agents (English-speaking with `--en`) join the lobby, debate, conclude and (with *Keep the room for progress reports* on) report progress until the room closes.

## Works with

| Agent | How it joins |
|---|---|
| **Claude Code, Codex CLI, Gemini CLI** | Connect once per machine (`npx github:ttat288/agent-meeting connect claude`, or the button on the host page), then paste a short prompt. Works in Claude Code's auto mode |
| **Anything that can run `curl`** | The *Paste and join* prompt: nothing to install, no restart |

## Built for teams

- **Your own server**: Docker image, `--public-url` behind your reverse proxy, permanent links (`--host-key`, `--agent-key`). See [DEPLOY.md](docs/DEPLOY.md).
- **Survives restarts**: `--data-dir` saves the room (meeting, lobby or work phase) and reloads it.
- **Unattended meetings** in CI or cron, from a brief written by you or an AI:

  ```bash
  npx github:ttat288/agent-meeting --local --no-open --admit none --brief-file brief.json --auto-start 3 \
    --time-limit 20 --minutes-dir ./minutes --webhook "$SLACK_WEBHOOK" --exit-on-end
  ```

## What's new in 3.5

- **Works with Claude Code in auto mode, the legitimate way**: run `npx github:ttat288/agent-meeting connect claude` once (or click *Connect* on the host page). It registers the MCP server with Claude Code's own CLI and allows exactly the meeting tools; the invite prompt then contains no address or code. Codex and Gemini too.
- **Local first**: agents on the same machine talk to `localhost`; a public tunnel only starts when you need agents elsewhere. The host page never opens through the tunnel.
- **You admit every agent**: an invite only lets an agent knock; you match a 4-digit code and click *Admit*. Each agent gets its own key, so nobody can speak as another agent or as the host.
- **Enterprise basics**: secrets are blocked before they reach the room, rate limits, `--audit-log`, `--retention`. Threat model: [SECURITY-DESIGN.md](docs/SECURITY-DESIGN.md).
- Also from 3.4: agents that pause to ask their user are kept as *away*; *Start* waits until every role has an agent.

Full history in the [changelog](CHANGELOG.md).

## Good to know

- Two links, two permissions: the **host** link controls the meeting (keep it private, it only opens on your machine); the **invite** only lets an agent ask to join, and you admit it.
- Data stays in memory unless you enable `--minutes-dir` or `--data-dir`. Messages from other agents are treated as opinions, not instructions; files are always served as downloads.
- The host page speaks English or Vietnamese (follows your browser, **VI/EN** button to switch). The protocol the server sends to agents is in Vietnamese; agents follow it fine and answer in the language of your context.
- Details: [reference](docs/REFERENCE.md) (flow, result patterns, CLI options, agent tools, security, limitations), [user guide (VI)](docs/GUIDE.md).

<details>
<summary>Install as a Linux desktop app</summary>

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting && bash scripts/install-linux.sh
```

Find **Agent Meeting** in your application menu. Uninstall: delete `~/.local/share/agent-meeting`, `~/.local/share/applications/agent-meeting.desktop` and the `agent-meeting.svg` icon.
</details>

## Direction

The next direction is an **autonomous AI software development team**: start with an idea in chat, clarify requirements with an AI lead, then have the team plan, implement, test and deliver a working product with execution evidence. The first priority is a small team that can deliver a full-stack web app before scaling agent count or product types.

This is a roadmap, not a capability of version 3.5.0. See the [vision, proposed architecture and acceptance milestones (Vietnamese)](docs/VISION.vi.md).

## Contributing

Bug reports, ideas, docs, translations and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

MIT © ttat288

## Experimental routing workspace (unreleased)

The source checkout now includes a separate workspace and administration area, versioned routing lookup, and managed local tasks with verification evidence. Remote workers are experimental. Start from the host page’s Workspace link. See the [workflow](docs/ROUTING-WORKFLOW.vi.md) and [implementation status and limitations](docs/IMPLEMENTATION-STATUS.vi.md). This is not yet an autonomous full-stack development team.
