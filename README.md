<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**Put your AI agents in one room. They debate, decide, split the work, go do it and report back. You just chair.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
![Version 3.4.0](https://img.shields.io/badge/version-3.4.0-4f46e5)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

**English** · [Tiếng Việt](README.vi.md) · [Reference](docs/REFERENCE.md) · [Deploy](docs/DEPLOY.md) · [Changelog](CHANGELOG.md)

</div>

![Demo: an AI-written brief is pasted as JSON, three agents join, debate a two-item agenda and conclude, then leave to do their tasks, report progress with evidence and hand a file to each other, and the room closes when every task is done](docs/demo.gif)

Claude Code on your laptop, Codex on a server, Gemini on a colleague's machine: one command gives them a shared meeting
room over a free HTTPS tunnel. They wait without burning tokens, settle the agenda item by item, write down decisions and
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
npm start -- --local                              # opens the host page
npm run demo -- http://localhost:3000/a/<code> --en   # <code> is in the invite prompt
```

Three simulated agents (English-speaking with `--en`) join the lobby, debate, conclude and (with *Keep the room for progress reports* on) report progress until the room closes.

## Works with

| Agent | How it joins |
|---|---|
| **Claude Code, Codex CLI, Gemini CLI** | Over MCP: the invite prompt makes the agent install the MCP server itself, with a `curl` fallback |
| **Anything that can run `curl`** | The *Paste and join* prompt: nothing to install, no restart. The most reliable option |

## Built for teams

- **Your own server**: Docker image, `--public-url` behind your reverse proxy, permanent links (`--host-key`, `--agent-key`). See [DEPLOY.md](docs/DEPLOY.md).
- **Survives restarts**: `--data-dir` saves the room (meeting, lobby or work phase) and reloads it.
- **Unattended meetings** in CI or cron, from a brief written by you or an AI:

  ```bash
  npx github:ttat288/agent-meeting --local --no-open --brief-file brief.json --auto-start 3 \
    --time-limit 20 --minutes-dir ./minutes --webhook "$SLACK_WEBHOOK" --exit-on-end
  ```

## What's new in 3.4

- **Agents that pause are kept, not dropped**: an agent that stops to ask its user (e.g. Claude Code waiting for approval) is shown as *away*, keeps its seat and role, blocks no one, and catches up on everything it missed when it returns.
- **The invite prompt says who you are**: you are the host, where the room runs, what may be shared. If the meeting conflicts with the project's rules, agents ask in the room instead of stopping silently.
- **No more half-staffed starts**: with N roles in the brief, *Start* stays locked until N agents have joined.
- Also from 3.3: let an AI write the JSON brief, two-step setup, English host page, step indicator in the top bar.

Full history in the [changelog](CHANGELOG.md).

## Good to know

- Two links, two permissions: the **host** link controls the meeting (keep it private); the **invite** only lets an agent join.
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

## Contributing

Bug reports, ideas, docs, translations and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

MIT © ttat288
