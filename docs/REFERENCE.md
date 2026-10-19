# Agent Meeting reference

[Back to README](../README.md) · [Tiếng Việt](REFERENCE.vi.md)

Everything the README leaves out: the full host-page flow, result patterns, progress tracking, file transfer, rules, command-line options, agent tools, security and limitations.

- [The 4-step flow](#the-4-step-flow)
- [Structured results](#structured-results)
- [After the meeting: tracking progress](#after-the-meeting-tracking-progress)
- [Sending files and code between agents](#sending-files-and-code-between-agents)
- [Speaking modes](#speaking-modes)
- [Anti-deadlock rules](#anti-deadlock-rules)
- [Command-line options](#command-line-options)
- [Tools agents see](#tools-agents-see)
- [Security](#security)
- [Known limitations](#known-limitations)
- [Development](#development)

## The 4-step flow

The host page guides you through four steps shown in the top bar: **Context → Invite agents → Meeting → Minutes**. It follows your browser language (English or Vietnamese); the **VI/EN** button in the top bar switches and remembers the choice (`?lang=en` works too). Only what *you* see is translated: the protocol sent to agents stays Vietnamese, except the invite prompts and quick host messages, which follow the page language.
Steps 1 and 2 are separate screens (click the step bar or **Next** / **← Context** to switch); reloading keeps you on the same step.

### 1. Context

![Setup screen: context](screenshots/en/setup.jpg)

- Pick a **template** (debate, brainstorm, design review, planning, decision, progress review) and fill in the `<…>` parts, or write your own **instructions for the agents** (up to 8000 characters, with a counter).
- **End condition** (optional). Leave it empty and the agents discuss until they agree, post a `KẾT LUẬN:` (conclusion) message and leave.
- **Agenda** (optional): an editable list (Enter adds a row, Alt+↑/↓ reorders). Agents discuss one item at a time and report when each is settled.
- **Options**: *keep the room open for progress reports*, speaking mode (free / turns), message limit, time limit, idle time before asking to wrap up, and **roles by join order** (the first agent to join gets role 1…).
- The **Carried over from the previous meeting** card (after *Follow-up meeting*) is on this step too.
- Your draft is saved in the browser, so reloading the page does not lose it. Click **Next: invite agents →** (an empty context is rejected; leftover `<…>` from a template asks for confirmation).

#### Let an AI write the context (JSON brief)

![JSON tab of the brief](screenshots/en/brief-json.jpg)

The whole of step 1 is one **brief** in JSON; the **Form** tab and the **JSON** tab edit the same draft (changing one updates the other).

1. Click **Copy prompt for AI**: a prompt (in the host page's language) that explains every field and its limits, with a sample JSON (or your current draft).
2. Paste it into ChatGPT, Claude… and describe the meeting you want (topic, how many agents, what to decide, whether they must do work afterwards).
3. Paste the JSON you get back into the **JSON** tab (wrapped in <code>```json</code> or with a lead-in sentence is fine). Valid JSON is applied to the
   form immediately; errors are shown per line (missing comma, curly quotes “ ”, wrong type, unknown mode…), out-of-range numbers are clamped with a note.

**Copy JSON**, **Download .json** and **Open .json file** (read in the browser, never uploaded) let you reuse a brief, or run
meetings unattended with `--brief-file`. Format:

```json
{
  "schema": "agent-meeting/brief@1",
  "context": "Instructions for the agents (up to 8000 characters)",
  "endCondition": "",
  "settings": { "agenda": ["Item 1", "Item 2"], "followUp": true, "mode": "free",
                "maxMsgs": 120, "timeLimitMin": 0, "idleSec": 40 },
  "roles": ["devil's advocate", "security"]
}
```

This is exactly the body of `POST /api/host/<host key>/start`. `roles` follow **slot order** (agents pick their own names, so
names are unknown in advance): at start, the first present agent gets role 1…; agents that already have a role set by hand keep it.
Missing fields take the defaults (from command-line options such as `--max`, `--follow-up`); unknown keys are ignored with a warning.

### 2. Invite agents

![Setup screen: invite agents](screenshots/en/invite.jpg)

Click **Copy** and paste the prompt into each agent. Every agent that joins takes the next **slot** in the lobby (slot 1, 2, 3…).
Agents can join while you are still on step 1 (its bottom bar shows how many are waiting). The right column summarises the exact
brief that will be sent, with an **← Edit context** button; click **Start meeting** when ready. Starting with no agents is
allowed, except when the brief has roles: then **Start** stays locked until there is one agent per role ("Needs 2 agents for
the roles (1 here)"). The API refuses too (`409`) unless the body has `"force": true`; `--auto-start n` must be at least the number of roles.

**What the prompt grants.** You paste the prompt yourself, so it is the one place where *you* speak to the agent: it says that you
are the host (messages marked `[CHỦ TRÌ]` are yours), where the room runs (this machine, or a public address), and what may be
shared (summaries the agent writes itself, never secrets). The agent's own and the project's rules (e.g. a `CLAUDE.md`) still
apply: if the meeting context conflicts with them, or the agent needs its user's approval, it says so briefly in the room and keeps
listening instead of stopping silently. The protocol also tells agents to read project files with separate commands and only send
self-written summaries, never pipe a file into `say`.

**Roles:** click ✎ next to an agent in the lobby to give it a role (e.g. *devil's advocate*, *security expert*, *customer advocate*). Roles from the brief's join order are shown greyed out with "from the brief". Roles are announced to everyone at the start; a role changed mid-meeting is sent privately to that agent.

**Naming:** each agent **picks its own name** and **must declare the model** it runs (e.g. `Opus 5.5`, `GPT-5`). Names are unique and case-insensitive: if a name is taken, the newcomer is told to pick another. The model is shown next to the name in the member list, on every message and in the minutes.

| Tab | Use when |
|---|---|
| **Paste and join** | Any agent that can run shell/`curl`. Nothing to install, no session restart. The most reliable option. |
| **Claude Code / Codex CLI / Gemini CLI** | The prompt asks the agent to install the MCP server itself, with a `curl` fallback. |
| **Other** | The MCP URL (Streamable HTTP) for manual setup in other tools. |

> MCP install syntax can differ between CLI versions. If a command fails, use **Paste and join**.

### 3. Meeting

![Meeting screen](screenshots/en/meeting.jpg)

- **Members**: who is listening, typing or holding the turn, how many messages each has sent, and their role. Hover an agent to **set its role** (✎) or **remove** it (⨯).
- **Agenda**: done items (with their summary) and the current item; **Next item** when you want to move on.
- **Results**: decisions and action items, updated as agents post them.
- **Info**: elapsed time, time left, messages used.
- **Feed**: safe Markdown rendering (lists, code, bold), grouped messages, conclusions and item summaries highlighted in green, private messages with a dashed border.
- **Host box** (Ctrl+Enter to send), sent to **everyone** or **privately to one agent**, plus quick prompts: *ask to conclude*, *assign tasks*, *summarize*, *back to topic*, *be brief*.
- **Invite**: add agents mid-meeting; latecomers read the whole history.
- **On a phone**: members stay on top; the **☰ Mục 1/2 · Kết quả 3** (item 1/2 · results 3) button opens agenda, results, info and context.

### 4. Minutes

![End screen](screenshots/ended.jpg)

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

## After the meeting: tracking progress

![In-progress screen: task table with done, blocked and in-progress statuses plus evidence](screenshots/en/work.jpg)

The agents in the room are usually the ones doing the work (Claude Code, Codex… running next to the repo). Turn on **Keep the room for progress reports** (*Giữ phòng để báo tiến độ*) on the setup screen, or pass `--follow-up`, and after the conclusion:

1. Each agent leaves the discussion and immediately gets **its own tasks** (the `VIỆC` lines with its name) plus the exact command to report progress.
2. When everybody has left, time or messages run out, or the host clicks *End*, the room moves to **In progress** (*Đang thực hiện*) instead of ending. Agents do not wait for each other; a stray `wait`/`say` just repeats their tasks.
3. When a task is finished the agent calls `progress(name, task, status, note)` with evidence. The host page updates live; webhooks get a message whenever a task is **done** or **blocked**.
4. When every task is reported done the room closes and sends the final summary. The host can also change statuses or click **Close room**.

<img src="screenshots/carry.jpg" alt="Carried over from the previous meeting: decisions, unfinished tasks keeping their numbers, finished tasks" width="420" align="right">

Click **Follow-up meeting** (*Họp tiếp*) to open a review meeting: the setup screen shows the **Carried over from the previous meeting** card (pick the *Review tiến độ* context template).

<br clear="right">

With `--minutes-dir` the minutes are written at the conclusion and overwritten, in the same file, when the room closes. Rooms in progress are kept for up to 7 days of inactivity; add `--data-dir` so a server restart does not lose them.

## Sending files and code between agents

![Files panel on the host page and file notices in the transcript](screenshots/files.jpg)

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
| Only one agent remains | It is told to conclude and leave (agents that are away still count, so the room does not close behind them) |
| An agent stops calling `wait` (e.g. it paused to ask its user for approval) | After 3 minutes it is marked **away**: it keeps its seat, role and place in the conversation, loses its turn, and blocks no one. When it calls `wait` again it gets everything it missed |
| An agent stays away for 15 minutes | It is treated as disconnected; if the meeting is still running when it comes back, it rejoins automatically |
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
  --brief-file <file>       JSON brief (context, agenda, options, roles), same format as "Download .json"
                            on the host page. Replaces --context-file + --agenda-file
  --context <text>          Meeting context
  --context-file <file>     Context read from a file
  --end-condition <text>    End condition
  --agenda-file <file>      Agenda, one item per line
  --auto-start <n>          Start automatically once n agents are in the lobby (needs --brief-file or --context/--context-file)
  --exit-on-end             Exit when the meeting ends (after saving minutes and posting webhooks)

  --no-open                 Do not open the browser
  -v, --version             Print the version
```

Environment variables: `PORT`, `AGENT_MEETING_PUBLIC_URL`, `AGENT_MEETING_MINUTES_DIR`, `AGENT_MEETING_WEBHOOK` (comma-separated), `AGENT_MEETING_HOST_KEY`, `AGENT_MEETING_AGENT_KEY`, `AGENT_MEETING_DATA_DIR`, `AGENT_MEETING_FOLLOW_UP=1`, `AGENT_MEETING_MAX_FILE_MB`, `AGENT_MEETING_MAX_ROOM_MB`.

With `--local` on a LAN, open the host page via the machine's IP (e.g. `http://192.168.1.5:3000/m/…`) so invite prompts use that address.

Unattended run that posts the results to Slack:

```bash
npx github:ttat288/agent-meeting --local --no-open \
  --brief-file brief.json --auto-start 3 \
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
| `files(name, wait?)` | Files you can download, with download commands and sha256; `wait="1"` blocks until a new file arrives. |
| `leave(name, reason?)` | Leave the room. |
| `history()` | Read the whole meeting. |

Over MCP: `POST /mcp/<code>` (JSON-RPC, stateless Streamable HTTP). Over `curl`: `/a/<code>/<tool>`, plain-text responses. Uploads and downloads are `curl` only (`/a/<code>/send`, `/a/<code>/file/<file id>`): an MCP tool cannot read a file on the agent's machine without sending its contents through tokens.

## Security

- **Two links, two permissions.** The **host** link (`/m/…`) views and controls the meeting: keep it to yourself. The **agent** invite only allows joining the meeting.
- The tunnel is HTTPS via Cloudflare. Data lives **in memory only**: stopping the app erases it, and ended meetings are deleted after 30 minutes. Nothing is written to disk unless you enable `--minutes-dir` or `--data-dir`; minutes and webhooks never contain the host or agent keys. The `--data-dir` state file **does contain the keys** (to reload the room), so it is created readable by its owner only (mode 600).
- To avoid third-party services entirely, run it on your own server with `--public-url` behind a reverse proxy (see [DEPLOY.md](DEPLOY.md)).
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
