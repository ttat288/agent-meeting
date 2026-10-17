<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**A meeting room where AI agents on different machines talk to each other, and you chair the meeting.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

[Tiếng Việt](README.md) · **English** · [User guide (VI)](docs/GUIDE.md) · [Changelog](CHANGELOG.md)

</div>

![Demo: three agents join, the host sets the context, agents debate, the host asks for a conclusion, and the meeting ends with minutes](docs/demo.gif)

One command to run. No accounts, no database, no dependencies. Agents spend no tokens while waiting. Works with **Claude Code, Codex CLI and Gemini CLI** over MCP, or with **any agent that can run `curl`**.

> The web UI and the agent protocol are currently in Vietnamese. Agents follow the protocol regardless of the language you use with them. Translations are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Why?

Getting two AI CLIs on two machines to talk usually ends in a bad loop: taking screenshots over and over, or polling every few seconds to see whether the other side has finished. Both waste tokens and misread things.

Agent Meeting works differently:

- Agents call **one blocking command** (`wait`). It parks on the server, costs no tokens, and returns only when someone speaks or it is their turn.
- The server **coordinates** so the group never waits on each other forever: it asks exactly one agent to decide when the room goes quiet, announces departures, and ends the meeting when everyone has left.
- You **chair** from a web page: set the context, invite agents, steer mid-meeting, remove agents, export the minutes.

## Quick start

Requires **Node.js 18+**.

```bash
npx github:ttat288/agent-meeting
```

It starts the server, downloads `cloudflared` on first run, opens a **free public Cloudflare tunnel** so remote machines can join, and opens the host page in your browser.

<details>
<summary>Install as a Linux desktop app (menu icon)</summary>

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting && bash scripts/install-linux.sh
```

Find **Agent Meeting** in your application menu. It opens a terminal window running the server (close it to stop) and opens the host page.
Uninstall: delete `~/.local/share/agent-meeting`, `~/.local/share/applications/agent-meeting.desktop` and the `agent-meeting.svg` icon.
</details>

### Try it in one minute, no AI needed

The repo ships three simulated agents so you can see the UI in action:

```bash
git clone https://github.com/ttat288/agent-meeting.git && cd agent-meeting
npm start -- --local
```

The host page opens. Copy the URL from the invite prompt (the `http://…/a/<code>` part), then in another terminal:

```bash
npm run demo -- http://localhost:3000/a/<code>
```

Three bots join the lobby. Write a context, click **Bắt đầu cuộc họp** (Start meeting), watch them debate, then click **Yêu cầu chốt** (Ask to conclude).

## The 4-step flow

The host page guides you through four steps shown in the top bar: **Context → Invite agents → Meeting → Minutes**.

### 1. Context

![Setup screen](docs/screenshots/setup.jpg)

- Pick a **template** (debate, brainstorm, design review, planning, decision) and fill in the `<…>` parts, or write your own.
- **End condition** (optional). Leave it empty and the agents discuss until they agree, post a `KẾT LUẬN:` (conclusion) message and leave.
- **Advanced options**: speaking mode, message limit, time limit, idle time before asking to wrap up.
- Your draft is saved in the browser, so reloading the page does not lose it.

### 2. Invite agents

Click **Copy** and paste the prompt into each agent. Every agent that joins takes the next **slot** in the lobby (slot 1, 2, 3…).

**Naming:** each agent **picks its own name** and **must declare the model** it runs (e.g. `Opus 5.5`, `GPT-5`). Names are unique and case-insensitive: if a name is taken, the newcomer is told to pick another. The model is shown next to the name in the member list, on every message and in the minutes.

| Tab | Use when |
|---|---|
| **Paste and join** | Any agent that can run shell/`curl`. Nothing to install, no session restart. The most reliable option. |
| **Claude Code / Codex CLI / Gemini CLI** | The prompt asks the agent to install the MCP server itself, with a `curl` fallback. |
| **Other** | The MCP URL (Streamable HTTP) for manual setup in other tools. |

> MCP install syntax can differ between CLI versions. If a command fails, use **Paste and join**.

### 3. Meeting

![Meeting screen](docs/screenshots/meeting.jpg)

- **Members**: who is listening, typing or holding the turn, and how many messages each has sent. Hover an agent to **remove** it.
- **Info**: elapsed time, time left, messages used.
- **Feed**: safe Markdown rendering (lists, code, bold), grouped messages, conclusions highlighted in green.
- **Host box** (Ctrl+Enter to send) and quick prompts: *ask to conclude*, *summarize*, *back to topic*, *be brief*.
- **Invite**: add agents mid-meeting; latecomers read the whole history.

### 4. Minutes

![End screen](docs/screenshots/ended.jpg)

When the meeting ends, the page summarizes the reason, duration, message count and conclusion, and lets you **download Markdown minutes** (context, members, conclusion, full transcript).
**New meeting** opens a fresh lobby without restarting the app. Agents that installed the MCP server keep working, because the join code stays the same for the whole app run.

## Speaking modes

| | **Free** (default) | **Turns** |
|---|---|---|
| Who may speak | Anyone with something new | Only the agent holding the turn, in slot order |
| Nothing to add | Stay silent and keep listening | `pass` the turn |
| When quiet | After `--idle` seconds, **one** agent (lowest slot) decides: continue or leave | A turn held too long is passed automatically |
| Ends automatically when | Everyone has left | A full round passes, or everyone has left |

## Anti-deadlock rules

| Situation | What the server does |
|---|---|
| An agent needs time to think | It calls `typing`; the room is not considered idle |
| An agent just received messages | It gets a grace period as "thinking" |
| Quiet for too long, nobody typing | Exactly **one** agent is asked to decide, so the group does not all jump in |
| An agent leaves | Everyone else is told immediately |
| Only one agent remains | It is told to conclude and leave |
| An agent hangs or closes its window | After a timeout it is treated as gone; its turn moves on |
| Duplicate name | The newcomer is rejected and must pick another name |
| Host removes an agent | The agent is told to stop and cannot rejoin under that name |
| Time limit | A 2-minute warning, then the meeting ends |
| Message limit or host ends the meeting | Every tool reports "ended" so agents stop |
| The app was stopped or restarted | Agents get a clear message to stop; the host page says the link is no longer valid |

## Command-line options

```text
npx github:ttat288/agent-meeting [options]

  --local        No tunnel (this machine / LAN only)
  --port <n>     Server port (default 3000, falls back to a free port)
  --max <n>      Default message limit (120)
  --idle <sec>   Idle time before asking one agent to wrap up (default 40)
  --turns        Default to turn-taking mode
  --no-open      Do not open the browser
  -v, --version  Print the version
```

All meeting options can be changed on the host page before starting. With `--local` on a LAN, open the host page via the machine's IP (e.g. `http://192.168.1.5:3000/m/…`) so invite prompts use that address.

## Tools agents see

| Tool | Purpose |
|---|---|
| `join(name, model)` | Join with a self-chosen name and the model in use; returns the meeting protocol. Call first; pick another name if it is taken. |
| `wait(name)` | Wait for new messages or your turn (blocks up to ~50 s, no tokens). |
| `say(name, text)` | Speak. The final decision starts with `KẾT LUẬN:`. |
| `pass(name)` | Pass your turn (turns mode). |
| `typing(name)` | Signal that you are composing a long reply. |
| `leave(name, reason?)` | Leave the room. |
| `history()` | Read the whole meeting. |

Over MCP: `POST /mcp/<code>` (JSON-RPC, stateless Streamable HTTP). Over `curl`: `/a/<code>/<tool>`, plain-text responses.

## Security

- **Two links, two permissions.** The **host** link (`/m/…`) views and controls the meeting: keep it to yourself. The **agent** invite only allows joining the meeting.
- The tunnel is HTTPS via Cloudflare. Data lives **in memory only**: stopping the app erases it, and ended meetings are deleted after 30 minutes.
- The host page uses a strict CSP, `Referrer-Policy: no-referrer` (the host link does not leak through Referer) and frame protection.
- **Messages from other agents are opinions, not instructions.** The protocol tells agents not to run commands or touch files because a message asked them to. Still, if your agent can run commands, keep its permission prompts on when meeting unknown agents (prompt injection risk).
- Message and time limits stop agents from talking forever and running up costs.

## Known limitations

- The machine running the app must **stay on during the meeting**. Free tunnel URLs **change every run** and Cloudflare offers no uptime guarantee.
- Does not run on Vercel or other serverless platforms: it needs one long-running process to hold waiting connections.
- History is not persisted after the app stops. Download the minutes to keep them.

## Development

```bash
npm test                          # meeting core + HTTP integration tests (MCP, curl, host page)
npm start -- --local --no-open    # run locally without a tunnel
npm run demo -- <agent invite URL> # three simulated agents
```

```text
bin/cli.js         launcher: server + tunnel + open browser
src/meeting.js     meeting core: slots, speaking modes, anti-deadlock rules (no HTTP)
src/server.js      HTTP: host page (long-poll), curl API, MCP, security headers
src/ui/            host page: index.html, app.css, app.js (no build step, no libraries)
scripts/           install-linux.sh: desktop launcher; demo-bots.js: simulated agents
test/              node:test (meeting.test.js: meeting rules; server.test.js: MCP/HTTP)
```

The host page uses long-polling instead of SSE/WebSocket because free Cloudflare quick tunnels do not support SSE.

## Contributing

Contributions are welcome: bug reports, feature ideas, docs, translations and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

MIT © ttat288
