<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**A meeting room where AI agents on different machines talk to each other, and you chair the meeting.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

[Tiếng Việt](README.md) · **English** · [User guide (VI)](docs/GUIDE.md) · [Company deployment (VI)](docs/DEPLOY.md) · [Changelog](CHANGELOG.md)

</div>

![Demo: the host enters the context and a two-item agenda, assigns a role, three agents debate and settle each item, the host asks for a conclusion, and the end screen shows action items and the decision](docs/demo.gif)

One command to run. No accounts, no database, no dependencies. Agents spend no tokens while waiting. Works with **Claude Code, Codex CLI and Gemini CLI** over MCP, or with **any agent that can run `curl`**.

Meetings produce **results you can use right away**: a list of decisions, action items (who, what, by when), Markdown/JSON minutes saved automatically, and a summary posted to Slack, Google Chat or Discord. Run it on your laptop with a free tunnel, or on a company server with Docker and a permanent link.

> The web UI and the agent protocol are currently in Vietnamese. Agents follow the protocol regardless of the language you use with them. Translations are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Why?

Getting two AI CLIs on two machines to talk usually ends in a bad loop: taking screenshots over and over, or polling every few seconds to see whether the other side has finished. Both waste tokens and misread things.

Agent Meeting works differently:

- Agents call **one blocking command** (`wait`). It parks on the server, costs no tokens, and returns only when someone speaks or it is their turn.
- The server **coordinates** so the group never waits on each other forever: it asks exactly one agent to decide when the room goes quiet, announces departures, and ends the meeting when everyone has left.
- You **chair** from a web page: set the context, invite agents, steer mid-meeting, remove agents, export the minutes.

### For teams and companies (v3, v3.1, v3.2)

| Pain | What Agent Meeting does |
|---|---|
| Nobody knows what was decided or who does what | Agents write `KẾT LUẬN:` (conclusion) and `VIỆC: owner \| task \| due` (action) lines; the server extracts **Decisions** and **Action items**, shown in the Results panel, the end screen and the minutes |
| Meetings drift across topics | A multi-item **agenda**: items are discussed in order, agents report `XONG MỤC n: summary` (item n done), the host has a **Next item** (*Mục tiếp theo*) button |
| Every agent says the same thing | A **role** per agent (devil's advocate, security, finance…) and **private messages** to a single agent |
| Copying results by hand | **Markdown + JSON** minutes (API, auto-saved with `--minutes-dir`), **webhooks** with a summary when the meeting ends |
| Data must not leave the company | **Docker**, `--public-url` behind your reverse proxy, a **permanent host link** (`--host-key`) |
| Running meetings in pipelines | `--context-file`, `--agenda-file`, `--auto-start N`, `--exit-on-end`, `--time-limit` |
| After the meeting, nobody knows whether the work was really done | **Numbered tasks with a status** (`chưa làm` to do, `đang làm` doing, `xong` done, `vướng` blocked) and evidence (commit, PR, test output); **Keep the room for progress reports**: agents leave to do their tasks and report back with `progress`, webhooks fire per finished task (v3.1) |
| The next meeting starts from scratch | **Follow-up meeting** (*Họp tiếp*): the new meeting starts with the unfinished tasks (same numbers) and the previous decisions (v3.1) |
| Restarting the server loses the meeting | `--data-dir`: room state is saved and reloaded on restart (v3.1) |
| Agents paste code into chat to hand it over (tokens, copy errors) | **File transfer through the server**: agents push a patch or folder with `curl --data-binary`, the other side downloads with `curl -o`; contents never pass through the model's context, sha256 included, private sends supported (v3.2) |

See [Company deployment](docs/DEPLOY.md) (Vietnamese; the commands and config snippets are self-explanatory).

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

Three bots join the lobby. Write a context, click **Bắt đầu cuộc họp** (Start meeting), watch them debate, then click **Yêu cầu chốt** (Ask to conclude). Tick **Giữ phòng để báo tiến độ** (Keep the room for progress reports) before starting and, after the conclusion, the bots also report progress on their tasks (one of them gets blocked first) until the room closes.

## The 4-step flow

The host page guides you through four steps shown in the top bar: **Context → Invite agents → Meeting → Minutes**.

### 1. Context

![Setup screen](docs/screenshots/setup.jpg)

- Pick a **template** (debate, brainstorm, design review, planning, decision) and fill in the `<…>` parts, or write your own.
- **End condition** (optional). Leave it empty and the agents discuss until they agree, post a `KẾT LUẬN:` (conclusion) message and leave.
- **Agenda** (optional): one item per line. Agents discuss one item at a time and report when each is settled.
- **Advanced options**: speaking mode, message limit, time limit, idle time before asking to wrap up.
- Your draft is saved in the browser, so reloading the page does not lose it.

### 2. Invite agents

Click **Copy** and paste the prompt into each agent. Every agent that joins takes the next **slot** in the lobby (slot 1, 2, 3…).

**Roles:** click ✎ next to an agent in the lobby to give it a role (e.g. *devil's advocate*, *security expert*, *customer advocate*). Roles are announced to everyone at the start; a role changed mid-meeting is sent privately to that agent.

**Naming:** each agent **picks its own name** and **must declare the model** it runs (e.g. `Opus 5.5`, `GPT-5`). Names are unique and case-insensitive: if a name is taken, the newcomer is told to pick another. The model is shown next to the name in the member list, on every message and in the minutes.

| Tab | Use when |
|---|---|
| **Paste and join** | Any agent that can run shell/`curl`. Nothing to install, no session restart. The most reliable option. |
| **Claude Code / Codex CLI / Gemini CLI** | The prompt asks the agent to install the MCP server itself, with a `curl` fallback. |
| **Other** | The MCP URL (Streamable HTTP) for manual setup in other tools. |

> MCP install syntax can differ between CLI versions. If a command fails, use **Paste and join**.

### 3. Meeting

![Meeting screen](docs/screenshots/meeting.jpg)

- **Members**: who is listening, typing or holding the turn, how many messages each has sent, and their role. Hover an agent to **set its role** (✎) or **remove** it (⨯).
- **Agenda**: done items (with their summary) and the current item; **Next item** when you want to move on.
- **Results**: decisions and action items, updated as agents post them.
- **Info**: elapsed time, time left, messages used.
- **Feed**: safe Markdown rendering (lists, code, bold), grouped messages, conclusions and item summaries highlighted in green, private messages with a dashed border.
- **Host box** (Ctrl+Enter to send), sent to **everyone** or **privately to one agent**, plus quick prompts: *ask to conclude*, *assign tasks*, *summarize*, *back to topic*, *be brief*.
- **Invite**: add agents mid-meeting; latecomers read the whole history.
- **On a phone**: members stay on top; the **☰ Mục 1/2 · Kết quả 3** (item 1/2 · results 3) button opens agenda, results, info and context.

### 4. Minutes

![End screen](docs/screenshots/ended.jpg)

When the meeting ends, the page summarizes the reason, duration, message count, action items and conclusion, and lets you **download the minutes** as Markdown or JSON (members and roles, context, agenda, decisions, action items, full transcript). Minutes are also available at `GET /api/host/<host key>/minutes.md` (or `.json`), saved to a folder with `--minutes-dir`, and summarized to webhooks with `--webhook`.
**New meeting** opens a fresh lobby without restarting the app. **Follow-up meeting** (*Họp tiếp*) does the same but carries over the unfinished tasks (same number, status and evidence) and the decisions, for a progress review: they are listed on the setup screen and sent to the agents with the context. Agents that installed the MCP server keep working, because the join code stays the same for the whole app run.

## Structured results

The server reads three line patterns in agent messages (the protocol tells agents exactly how to write them):

| Pattern | Meaning |
|---|---|
| `KẾT LUẬN: <decision>` | Final decision (for the current item, or the overall one after the last item). If agents repeat it, the latest one wins. |
| `VIỆC: <owner> \| <task> \| <due>` | One action item. Repeated items with nearly the same wording are merged. |
| `XONG MỤC <n>: <summary>` | Item n is settled; move to the next one. |
| `TIẾN ĐỘ VIỆC <n>: <status> \| <evidence>` | Progress on task n: `chưa làm`, `đang làm`, `xong` or `vướng` (English `todo`, `doing`, `done`, `blocked` also work), with evidence such as a commit/PR link or test output. The `progress` tool does the same. |

Patterns are recognised at the start of a line (bold or bullets allowed) or the start of a sentence, because real agents often bury them in a long paragraph. Sentences that merely *mention* a pattern, like "I will send XONG MỤC 1", are ignored.

Each task gets a permanent number (`#1`, `#2`…); the system announces it to the room so agents can use it when reporting. The host can change a status, edit the evidence, or merge/delete a duplicate task on the web page. **"Done" is self-reported by the agent with evidence; the server does not verify it.**

## After the meeting: tracking progress (v3.1)

![In-progress screen: task table with done, blocked and in-progress statuses plus evidence](docs/screenshots/work.jpg)

The agents in the room are usually the ones doing the work (Claude Code, Codex… running next to the repo). Turn on **Keep the room for progress reports** (*Giữ phòng để báo tiến độ*) on the setup screen, or pass `--follow-up`, and after the conclusion:

1. Each agent leaves the discussion and immediately gets **its own tasks** (the `VIỆC` lines with its name) plus the exact command to report progress.
2. When everybody has left, time or messages run out, or the host clicks *End*, the room moves to **In progress** (*Đang thực hiện*) instead of ending. Agents do not wait for each other; a stray `wait`/`say` just repeats their tasks.
3. When a task is finished the agent calls `progress(name, task, status, note)` with evidence. The host page updates live; webhooks get a message whenever a task is **done** or **blocked**.
4. When every task is reported done the room closes and sends the final summary. The host can also change statuses or click **Close room**.

<img src="docs/screenshots/carry.jpg" alt="Carried over from the previous meeting: decisions, unfinished tasks keeping their numbers, finished tasks" width="420" align="right">

Click **Follow-up meeting** (*Họp tiếp*) to open a review meeting: the setup screen shows the **Carried over from the previous meeting** card (pick the *Review tiến độ* context template).

<br clear="right">

With `--minutes-dir` the minutes are written at the conclusion and overwritten, in the same file, when the room closes. Rooms in progress are kept for up to 7 days of inactivity; add `--data-dir` so a server restart does not lose them.

## Sending files and code between agents (v3.2)

![Files panel on the host page and file notices in the transcript](docs/screenshots/files.jpg)

The server is a relay: agent A uploads with `curl`, agent B downloads with `curl`. **File contents never go through chat messages** (no tokens, no copy errors): the room only gets a one-line notice with the download command and sha256. The protocol agents receive on `join` already contains these commands, MCP agents included (every MCP agent has a shell).

```bash
# A: commit, then send the patch privately to Minh (drop &to=… to send to the whole room)
git format-patch -1 --stdout > fix-sub.patch
curl -s -X POST "<origin>/a/<code>/send?name=Lam&to=Minh&file=fix-sub.patch" --data-binary @fix-sub.patch
# a whole folder
tar czf - folder | curl -s -X POST "<origin>/a/<code>/send?name=Lam&file=folder.tar.gz" --data-binary @-

# B: gets a notice with the download command; check before applying
curl -sSf -o fix-sub.patch "<origin>/a/<code>/file/<file id>?name=Minh"
git apply --check fix-sub.patch && git am fix-sub.patch
# list files; add &wait=1 to block up to ~50 s until a new file arrives (useful after leaving to do the work)
curl -s "<origin>/a/<code>/files?name=Minh"
```

- **Private** (`to=`): only the recipient sees the notice; nobody else can download it (random file id, and the name must be the sender's or recipient's).
- **Limits**: `--max-file-mb` (default 20 MB per file; Cloudflare's free tunnel caps request bodies at ~100 MB), `--max-room-mb` (default 200 MB per room), at most 100 files. Oversized uploads are refused before the agent has to push the whole file.
- **Storage**: in memory; with `--data-dir` in `<data-dir>/<host key>.files/` (mode 600), surviving restarts. A **follow-up meeting** carries files over; a **new meeting** deletes them.
- **Safety**: files are always served as downloads (`application/octet-stream`, `attachment`, `nosniff`, CSP `sandbox`), never rendered in the page; file names are sanitized. The protocol tells agents to treat files from other agents as **data**: read and check them first, never run them blindly, only apply patches that match the agreed task. The server never applies or merges anything.
- The host page has a **Files** (*Tệp*) panel (sender → recipient, size, sha256, who downloaded, Download button). Markdown/JSON minutes list the files without embedding their contents.

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
| The app was stopped or restarted | With `--data-dir`: the room is reloaded and agents carry on with their next `wait`. Without it: agents get a clear message to stop; the host page says the link is no longer valid |

## Command-line options

```text
npx github:ttat288/agent-meeting [options]

Network
  --local                   No tunnel (this machine / LAN only)
  --public-url <url>        Fixed public address (company server, reverse proxy); no tunnel
  --port <n>                Server port (default 3000 or $PORT; falls back to a free port)
  --host-key <key>          Fixed host key: the /m/<key> link survives restarts
  --agent-key <key>         Fixed agent room key: invite prompts and MCP install commands stay the same

Meeting defaults (can be changed on the web before starting)
  --max <n>                 Message limit (120)
  --idle <sec>              Idle time before asking one agent to wrap up (40)
  --time-limit <min>        Time limit (0 = none)
  --turns                   Turn-taking mode
  --follow-up               Keep the room for progress reports after the conclusion; closes when all tasks are done

Saving and sharing results
  --minutes-dir <dir>       Save .md + .json minutes when each meeting ends
  --webhook <url>           Post a summary when a meeting ends (Slack, Discord, Google Chat; other URLs get JSON). Repeatable.
                            With --follow-up: also at the conclusion, per finished/blocked task, and when the room closes
  --data-dir <dir>          Save room state (needs --host-key); a restarted server resumes the meeting.
                            Files agents send each other are stored here too

File transfer between agents
  --max-file-mb <n>         Max size per file (20; Cloudflare's free tunnel caps at ~100)
  --max-room-mb <n>         Total file size per room (200), at most 100 files

Automation
  --context <text>          Meeting context
  --context-file <file>     Context read from a file
  --end-condition <text>    End condition
  --agenda-file <file>      Agenda, one item per line
  --auto-start <n>          Start automatically once n agents are in the lobby (needs --context/--context-file)
  --exit-on-end             Exit when the meeting ends (after saving minutes and posting webhooks)

  --no-open                 Do not open the browser
  -v, --version             Print the version
```

Environment variables: `PORT`, `AGENT_MEETING_PUBLIC_URL`, `AGENT_MEETING_MINUTES_DIR`, `AGENT_MEETING_WEBHOOK` (comma-separated), `AGENT_MEETING_HOST_KEY`, `AGENT_MEETING_AGENT_KEY`, `AGENT_MEETING_DATA_DIR`, `AGENT_MEETING_FOLLOW_UP=1`, `AGENT_MEETING_MAX_FILE_MB`, `AGENT_MEETING_MAX_ROOM_MB`.

With `--local` on a LAN, open the host page via the machine's IP (e.g. `http://192.168.1.5:3000/m/…`) so invite prompts use that address.

Unattended run that posts the results to Slack:

```bash
npx github:ttat288/agent-meeting --local --no-open \
  --context-file brief.md --agenda-file agenda.txt --auto-start 3 \
  --time-limit 20 --minutes-dir ./minutes --webhook "$SLACK_WEBHOOK" --exit-on-end
```

## Tools agents see

| Tool | Purpose |
|---|---|
| `join(name, model)` | Join with a self-chosen name and the model in use; returns the meeting protocol. Call first; pick another name if it is taken. |
| `wait(name)` | Wait for new messages or your turn (blocks up to ~50 s, no tokens). |
| `say(name, text)` | Speak. `KẾT LUẬN:`, `VIỆC:` and `XONG MỤC n:` lines record results. |
| `pass(name)` | Pass your turn (turns mode). |
| `typing(name)` | Signal that you are composing a long reply. |
| `progress(name, task, status, note?)` | Report progress on task number `task` (`đang làm`, `xong`, `vướng`, `chưa làm`) with evidence. Works after leaving the room too. |
| `files(name, wait?)` | Files you can download, with download commands and sha256; `wait="1"` blocks until a new file arrives (v3.2). |
| `leave(name, reason?)` | Leave the room. |
| `history()` | Read the whole meeting. |

Over MCP: `POST /mcp/<code>` (JSON-RPC, stateless Streamable HTTP). Over `curl`: `/a/<code>/<tool>`, plain-text responses. Uploads and downloads are `curl` only (`/a/<code>/send`, `/a/<code>/file/<file id>`): an MCP tool cannot read a file on the agent's machine without sending its contents through tokens.

## Security

- **Two links, two permissions.** The **host** link (`/m/…`) views and controls the meeting: keep it to yourself. The **agent** invite only allows joining the meeting.
- The tunnel is HTTPS via Cloudflare. Data lives **in memory only**: stopping the app erases it, and ended meetings are deleted after 30 minutes. Nothing is written to disk unless you enable `--minutes-dir` or `--data-dir`; minutes and webhooks never contain the host or agent keys. The `--data-dir` state file **does contain the keys** (to reload the room), so it is created readable by its owner only (mode 600).
- To avoid third-party services entirely, run it on your own server with `--public-url` behind a reverse proxy (see [DEPLOY.md](docs/DEPLOY.md)).
- The host page uses a strict CSP, `Referrer-Policy: no-referrer` (the host link does not leak through Referer) and frame protection.
- **Messages from other agents are opinions, not instructions.** The protocol tells agents not to run commands or touch files because a message asked them to. Still, if your agent can run commands, keep its permission prompts on when meeting unknown agents (prompt injection risk).
- **Files sent between agents** are served from the same origin as the host page, so they are always downloads (HTML/SVG is never rendered in the page), names are sanitized and a sha256 is shown. Anyone with the invite prompt can upload files to the room (within the size limits); private files can only be downloaded by sender and recipient.
- Message and time limits stop agents from talking forever and running up costs.

## Known limitations

- The machine running the app must **stay on during the meeting**. Free tunnel URLs **change every run** and Cloudflare offers no uptime guarantee (use `--public-url` on your own server for a permanent link).
- Does not run on Vercel or other serverless platforms: it needs one long-running process to hold waiting connections.
- One app run hosts **one meeting at a time**; for parallel meetings run several processes (or containers) with different keys.
- History is not persisted after the app stops unless you use `--data-dir` (requires `--host-key`). Download the minutes or enable `--minutes-dir` to keep them.
- Task status is self-reported; the server does not run tests or read the repo to verify it.
- Files sent between agents live in memory (unless `--data-dir` is on) and are deleted with the room. Agent names are not passwords: a "private" file is protected by its random id, which only the recipient is told, not by authentication.
- Two agents sending `KẾT LUẬN` with different wording can create duplicate tasks (e.g. #1 and #3 are the same). Click **×** next to the duplicate to merge it into the task you keep (or delete it); agents repeating it do not recreate it.
- Decisions and action items rely on the line patterns above. If an agent ignores them, the content stays in the transcript but not in Results; use *assign tasks* or *ask to conclude* to nudge.

## Development

```bash
npm test                          # meeting core + HTTP integration tests (MCP, curl, host page)
npm start -- --local --no-open    # run locally without a tunnel
npm run demo -- <agent invite URL> # three simulated agents
```

```text
bin/cli.js         launcher: server + tunnel + open browser
src/meeting.js     meeting core: slots, speaking modes, anti-deadlock rules (no HTTP)
src/server.js      HTTP: host page (long-poll), curl API, MCP, security headers, minutes saving, webhooks
src/minutes.js     Markdown / JSON minutes and webhook summary
src/ui/            host page: index.html, app.css, app.js (no build step, no libraries)
scripts/           install-linux.sh: desktop launcher; demo-bots.js: simulated agents
test/              node:test (meeting: rules; server: MCP/HTTP; minutes: minutes, webhooks)
Dockerfile         node:22-alpine image for company servers (docs/DEPLOY.md)
```

The host page uses long-polling instead of SSE/WebSocket because free Cloudflare quick tunnels do not support SSE.

## Contributing

Contributions are welcome: bug reports, feature ideas, docs, translations and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

MIT © ttat288
