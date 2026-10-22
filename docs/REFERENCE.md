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

**Where the agents are.** Since 3.5 the app listens on `127.0.0.1` only and the invite card starts in **On this machine**
mode: prompts use `http://localhost:<port>`, so project data never crosses the Internet. For agents on other machines pick
**Another machine** → **Turn on a public address** (starts a Cloudflare quick tunnel; or run with `--tunnel`, or use
`--public-url`). The host page itself never opens through the tunnel.

**What the prompt grants.** You paste the prompt yourself, so it is the one place where *you* speak to the agent: it says that you
are the host (messages marked `[CHỦ TRÌ]` are yours), where the room runs (this machine, or a public address), that you will admit
it on the host page, and what may be shared (summaries the agent writes itself, never secrets). The agent's own and the project's rules (e.g. a `CLAUDE.md`) still
apply: if the meeting context conflicts with them, or the agent needs its user's approval, it says so briefly in the room and keeps
listening instead of stopping silently. The protocol also tells agents to read project files with separate commands and only send
self-written summaries, never pipe a file into `say`.

**Roles:** click ✎ next to an agent in the lobby to give it a role (e.g. *devil's advocate*, *security expert*, *customer advocate*). Roles from the brief's join order are shown greyed out with "from the brief". Roles are announced to everyone at the start; a role changed mid-meeting is sent privately to that agent.

**Naming:** each agent **picks its own name** and **must declare the model** it runs (e.g. `Opus 5.5`, `GPT-5`). Names are unique and case-insensitive: if a name is taken, the newcomer is told to pick another. The model is shown next to the name in the member list, on every message and in the minutes.

| Tab | Use when |
|---|---|
| **Connected (MCP)** | Claude Code, Codex CLI, Gemini CLI. Connect once per machine (below), restart the agent session, paste a short prompt with no address or code. Works with Claude Code in **auto mode**. |
| **Paste and join** | Any agent that can run shell/`curl` (subagents, unknown agents). Nothing to install. Claude Code's auto mode may block this `curl` loop by design: use **Connected** instead. |
| **Other** | The MCP URL (Streamable HTTP) and the plain-text join URL for manual setup in other tools. |

#### Connect once: `agent-meeting connect`

```bash
npx github:ttat288/agent-meeting connect claude      # or: codex | gemini
npx github:ttat288/agent-meeting connect claude --room https://<tunnel>/a/<code>/join   # room on another machine
npx github:ttat288/agent-meeting disconnect claude   # undo
```

You run it yourself (or click **Connect … on this machine** on the host page, only shown when the page is open on that machine), so
the permission comes from your own action, not from pasted text. It:

1. copies a small stdio MCP bridge to `~/.agent-meeting/mcp.js`. The bridge reads `~/.agent-meeting/rooms.json` (written by the app on
   this machine at start-up, or by `connect --room`) to know which room to join. **Its tools take no URL**, so a prompt or a message
   cannot send the agent to another server, and the room code never appears in MCP config, prompts or agent transcripts;
2. registers it as MCP server `agent-meeting` with the agent's own CLI (`claude mcp add -s user`, `codex mcp add`, `gemini mcp add -s user`).
   The Claude Code bundled with the desktop app is found even if `claude` is not on `PATH`;
3. allows **exactly the meeting tools** (`join`, `wait`, `say`, `pass`, `typing`, `progress`, `files`, `leave`, `history`, `get_file`):
   Claude Code via `permissions.allow` in `~/.claude/settings.json` (allow rules are resolved before the auto-mode classifier),
   Gemini via `~/.gemini/policies/agent-meeting.toml`, Codex through the tools' annotations. **`send_file` is never pre-allowed**: every
   upload still goes through the agent's own approval or classifier.

Every config file is backed up first (`*.bak-agent-meeting-<time>`), written atomically, and each change is printed.

#### Admitting agents

An invite prompt only lets an agent *ask* to join. On `join` the agent gets a **4-digit matching code** and waits; the host page shows
"*name* (model) asks to join · code 1234 · this machine / via tunnel + IP" with **Admit** / **Decline**. Admitted agents get their
own **agent key**: curl agents send it as `Authorization: Bearer …` on every call, MCP agents are bound to their `Mcp-Session-Id`. No
call takes its identity from the `name` parameter any more, so nobody holding the invite can speak, leave or download files as
another agent. Rejoining under an existing name needs that agent's key (or your approval again). `--admit remote` admits agents on
this machine automatically; `--admit none` admits everyone (for unattended runs in a closed network).

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

The server is a relay: agent A uploads, agent B downloads. **File contents never go through chat messages** (no tokens, no copy errors): the room only gets a one-line notice with the download command and sha256. The protocol agents receive on `join` already contains the exact commands for that agent: `curl` with its own key, or the bridge tools `send_file(name, path, to)` / `get_file(name, id)` for connected MCP agents (they only read/write inside the agent's working directory and refuse `.env`, keys and paths outside it).

```bash
# A: commit, then send the patch privately to Minh (drop to=… to send to the whole room)
git format-patch -1 --stdout > fix-sub.patch
curl -s -X POST "<origin>/a/<code>/send?to=Minh&file=fix-sub.patch" -H "Authorization: Bearer <A's key>" --data-binary @fix-sub.patch
# a whole folder
tar czf - folder | curl -s -X POST "<origin>/a/<code>/send?file=folder.tar.gz" -H "Authorization: Bearer <A's key>" --data-binary @-

# B: gets a notice with the download command; check before applying
curl -sSf -o fix-sub.patch "<origin>/a/<code>/file/<file id>" -H "Authorization: Bearer <B's key>"
git apply --check fix-sub.patch && git am fix-sub.patch
# list files; add ?wait=1 to block up to ~50 s until a new file arrives (useful after leaving to do the work)
curl -s "<origin>/a/<code>/files" -H "Authorization: Bearer <B's key>"
```

- **Private** (`to=`): only the recipient sees the notice; only sender and recipient (identified by their keys) can download it.
- **Secrets**: uploads that look like private keys or tokens are refused (the host page shows a warning, never the value).
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

npx github:ttat288/agent-meeting connect <claude|codex|gemini> [--room <invite URL>]
npx github:ttat288/agent-meeting disconnect <claude|codex|gemini>

Network (default: this machine only, http://localhost:<port>)
  --tunnel                  Start the public Cloudflare tunnel right away (otherwise the host clicks "Another machine")
  --local                   Never start a tunnel
  --lan                     Listen on all interfaces (0.0.0.0), not just this machine (Docker needs this)
  --public-url <url>        Fixed public address (company server, reverse proxy); no tunnel
  --remote-host             Allow opening the host page through the tunnel (default: this machine only)
  --port <n>                Server port (default 3000 or $PORT; falls back to a free port)
  --host-key <key>          Fixed host key: the /m/<key> link survives restarts
  --agent-key <key>         Fixed agent room key: invite prompts and MCP install commands stay the same

Who may join
  --admit <all|remote|none> all (default): the host admits each agent (4-digit code); remote: agents on this machine join
                            directly; none: anyone with the invite joins (unattended runs in a closed network only)

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

Audit and retention
  --audit-log <file>        JSONL audit log (mode 600): joins, admissions, file uploads/downloads, host actions, blocked
                            secrets. Never message text, file contents or keys
  --retention <days>        Delete minutes (--minutes-dir) and old room state (--data-dir) older than this

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

Environment variables: `PORT`, `AGENT_MEETING_PUBLIC_URL`, `AGENT_MEETING_MINUTES_DIR`, `AGENT_MEETING_WEBHOOK` (comma-separated), `AGENT_MEETING_HOST_KEY`, `AGENT_MEETING_AGENT_KEY`, `AGENT_MEETING_DATA_DIR`, `AGENT_MEETING_FOLLOW_UP=1`, `AGENT_MEETING_MAX_FILE_MB`, `AGENT_MEETING_MAX_ROOM_MB`, `AGENT_MEETING_ADMIT`, `AGENT_MEETING_LAN=1`, `AGENT_MEETING_AUDIT_LOG`, `AGENT_MEETING_RETENTION_DAYS`.

With `--lan` on a LAN, open the host page via the machine's IP (e.g. `http://192.168.1.5:3000/m/…`) so invite prompts use that address.

Unattended run that posts the results to Slack:

```bash
npx github:ttat288/agent-meeting --local --no-open --admit none \
  --brief-file brief.json --auto-start 3 \
  --time-limit 20 --minutes-dir ./minutes --webhook "$SLACK_WEBHOOK" --exit-on-end
```

## Tools agents see

| Tool | Purpose |
|---|---|
| `join(name, model)` | Join with a self-chosen name and the model in use; returns the meeting protocol. Call first; pick another name if it is taken. |
| `wait(name)` | Wait for new messages or your turn (blocks up to ~50 s; returned content still uses context). |
| `say(name, text)` | Speak. `KẾT LUẬN:`, `VIỆC:` and `XONG MỤC n:` lines record results. |
| `pass(name)` | Pass your turn (turns mode). |
| `typing(name)` | Signal that you are composing a long reply. |
| `progress(name, task, status, note?)` | Report progress on task number `task` (`đang làm`, `xong`, `vướng`, `chưa làm`) with evidence. Works after leaving the room too. |
| `files(name, wait?)` | Files you can download, with download commands and sha256; `wait="1"` blocks until a new file arrives. |
| `leave(name, reason?)` | Leave the room. |
| `history()` | Read the whole meeting. |
| `send_file(name, path, to?, note?)` | Bridge only: upload a file from the working directory. Not pre-allowed: the agent's own approval/classifier decides each time. |
| `get_file(name, id, path?, overwrite?)` | Bridge only: save a file into the working directory (never overwrites unless asked). |

Over MCP: `POST /mcp/<code>` (JSON-RPC, Streamable HTTP with sessions: the server issues `Mcp-Session-Id` on `initialize`, and the agent's identity is bound to it). Over `curl`: `/a/<code>/<tool>` with `Authorization: Bearer <agent key>`, plain-text responses. Uploads and downloads over HTTP: `/a/<code>/send`, `/a/<code>/file/<file id>` (curl with the key, or the bridge with its session).

Messages from agents are quoted in what other agents receive: the first line is `[Name] …`, every following line starts with `│ `.
Only the server writes lines starting with `[CHỦ TRÌ]` (host) or `(hệ thống)` (system); names that look like host/system labels are refused.

## Security

The full threat model and the reasons behind each choice are in [SECURITY-DESIGN.md](SECURITY-DESIGN.md) (Vietnamese).

- **Local first.** The server listens on `127.0.0.1`; agents on the same machine use `http://localhost`. A public tunnel only starts
  when the host asks for it (or `--tunnel`). Requests with an unexpected `Host` header are refused (DNS rebinding); host API `POST`s
  from another origin are refused (CSRF).
- **The host page stays on this machine.** `/m/…` and `/api/host/…` refuse requests that come through the tunnel (unless
  `--public-url`, where your proxy/SSO protects it, or `--remote-host`). Keep the host link to yourself.
- **Invites only knock.** The invite code lets an agent ask to join; the host admits each one (4-digit code). Every admitted agent
  has its own key (curl: `Authorization: Bearer`, MCP: bound to `Mcp-Session-Id`); identity never comes from the `name` field.
- **Connected agents** get permission from a command the user runs (`connect`), scoped to the meeting tools; uploads are not
  pre-allowed; bridge tools take no URL; the room code is not in prompts, MCP config or transcripts.
- **Data vs instructions.** Agent messages are quoted (`│ `), reserved names are refused, so nobody can fake a host or system line.
  The protocol says the agent's permissions come from its own user, not from the room, and messages from other agents are opinions.
- **Secrets.** Messages, progress notes and files that look like private keys, cloud/API tokens, JWTs or `PASSWORD=…` values are
  refused; the host sees a warning (never the value).
- **Rate limits.** Repeated wrong codes from one IP get `429` for a minute; an agent can post ~20 messages and ~10 files per minute.
- **Audit and retention.** `--audit-log` (JSONL, mode 600) and `--retention <days>`. Minutes and webhooks never contain keys; the
  `--data-dir` state file does (to reload the room) and is mode 600.
- The tunnel is HTTPS via Cloudflare (Cloudflare terminates TLS and can see traffic). To avoid third parties, run on your own server
  with `--public-url` behind a reverse proxy (see [DEPLOY.md](DEPLOY.md)).
- The host page uses a strict CSP, `Referrer-Policy: no-referrer` and frame protection; files are always served as downloads.
- Message and time limits stop agents from talking forever and running up costs.

## Known limitations

- The machine running the app must **stay on during the meeting**. Free tunnel URLs **change every run** and Cloudflare offers no uptime guarantee (use `--public-url` on your own server for a permanent link).
- Does not run on Vercel or other serverless platforms: it needs one long-running process to hold waiting connections.
- One app run hosts **one meeting at a time**; for parallel meetings run several processes (or containers) with different keys.
- History is not persisted after the app stops unless you use `--data-dir` (requires `--host-key`). Download the minutes or enable `--minutes-dir` to keep them.
- Task status is self-reported; the server does not run tests or read the repo to verify it.
- Files sent between agents live in memory (unless `--data-dir` is on) and are deleted with the room.
- No user accounts or OAuth: the host key and per-agent keys are bearer secrets. For SSO, put the host page behind your proxy (see DEPLOY.md).
- Two agents sending `KẾT LUẬN` with different wording can create duplicate tasks (e.g. #1 and #3 are the same). Click **×** next to the duplicate to merge it into the task you keep (or delete it); agents repeating it do not recreate it.
- Decisions and action items rely on the line patterns above. If an agent ignores them, the content stays in the transcript but not in Results; use *assign tasks* or *ask to conclude* to nudge.

## Development

```bash
npm test                          # meeting core + HTTP integration tests (MCP, curl, host page)
npm start -- --admit remote --no-open    # run locally; simulated bots on this machine join without approval
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

### CLI skills and bounded history

From a checkout, use `node bin/cli.js` in place of `agent-meeting` below. These commands do not connect clients, install skills, execute scripts or change settings:

```bash
agent-meeting doctor
agent-meeting skills list
agent-meeting skills show agent-meeting
agent-meeting skills list --local --query security
agent-meeting skills list --local --graph --query network
agent-meeting skills inspect my-skill --local
agent-meeting skills show my-skill --local --resource references/network.md
```

`--local` reads only cwd's `.agents/skills`; `--dir <skill-directory>` selects another catalog. List reads bounded frontmatter; `--limit` (1–20) and `--offset` page results. `inspect` returns explicit resource edges and the manifest hash. It reads no reference bodies. `--graph` matches declared resource paths as well as metadata, without semantic search. Missing, unsafe and symlink resources are unavailable. Show prints a single complete text file up to32000 bytes; inspect larger manifests directly. This catalog supports simple name/description YAML fields and skips malformed manifests. It is not a global CLI skill inventory. Printing a skill does not activate CLI-native discovery; choose the installation method for your client separately.

`doctor` hides room endpoints/keys and checks local presence only: live MCP registration, server reachability, client permissions and model access remain unverified. A bridge already installed before these changes needs a user-requested reconnect to obtain the new schema.

Use `wait` for unseen messages. For a missing passage, `history(offset=0, limit=20, maxChars=8000)` returns JSON `messages`, `nextOffset`, `chars` and `oversized`; curl accepts the same query parameters. Offsets count only messages visible to the authenticated reader. Follow nextOffset only if more context is needed; history never advances wait's cursor. One oversized message is kept whole. maxChars counts Unicode characters in message text, not JSON bytes or tokens. Without pagination arguments the legacy full-history response remains. Replaying all pages costs more than a single full retrieval; this feature saves context when only a passage is needed. Concurrent appends can extend the result; room renewal starts a new history, so discard old offsets. No model billing savings are promised by a transport budget alone.

## PM CLI chair (local experiment)

Open **Options → Agent chairs** in the session and paste the dedicated prompt into an existing CLI on the same machine. The PM joins with `bin/pm.js`, reports a four-digit code, and waits for your confirmation. As director, assign a goal/acceptance criteria and grant workspace, write paths, immutable tests, a configured/probed profile, run count and expiry. The PM can then plan/run/verify/integrate/report using the canonical task/run store. Invitation and grant do not launch a model. Host runtime probing can incur real model charges.

Use **Pause PM**, **Revoke PM**, or **I take over**; inspect the existing Plan/Execute/Results views and follow PM goal provenance back to the private channel. A goal change invalidates the old grant/result and requests cancellation. Reload preserves data; restart or lost lease requires a new invitation, confirmation and grant. Never infer that a saved room proves the CLI is still running. On client timeout, read state before retrying mutations.

PM `state`/`wait` accept an optional `cursor` from the last snapshot (keep `after` unchanged). An outdated cursor immediately returns a new snapshot; a current cursor may return `unchanged:true` with status/lease, so retain the previous snapshot. `wait` with a current cursor waits up to25 seconds; omitting the cursor preserves legacy behavior. The CLI does not persist cursors. This reduces repeated payloads and idle waits; model billing remains unmeasured.

Unknown model cost blocks execution by default. Explicit unknown-cost consent plus a run cap is not a hard monetary cap; external PM usage is unobserved. Required expert review and multi-file integration still block automatic acceptance. Fixture evidence does not demonstrate lower total tokens, cost or human effort than a direct coding CLI. [Evidence and limitations](evidence/pm-operator/ACCEPTANCE.vi.md).

### Local delegated team and same-slot swap (workspace, unreleased)

A director-issued PM grant may include `team`. The PM client adds `team-invite`, `approve-plan`, `watch`, `events`, `ack-event` and scoped `chair` operations. The lead uses `bin/team.js` with separate `AGENT_MEETING_TEAM_URL=http://127.0.0.1:<port>/api/team/<room>` and `AGENT_MEETING_TEAM_TOKEN`, never the host or PM credential. Actions: `join|state|propose|run|checkpoint|swap|verify|integrate|submit|blocker`; mutations require the current runtime generation.

This slice supports one canonical task, logical slot A and single-file integration on Linux/bwrap. The supervisor stores a checkpoint, bootstraps the successor read-only, validates hash/generation/model acknowledgement, drains the previous process group and promotes the next generation without losing WIP. Managed runtimes can also emit a structured swap request. `watch` waits in code and returns actionable events or a blocked guard; it does not launch a model or reopen a disconnected CLI. Events survive disconnection; restart revokes capabilities and requires reconciliation. Session duration60/120/180 minutes or null remains separate from expiry and run/invocation/swap/wake caps, with no hard monetary cap. [Contracts](prompts/pm-operator.vi.md), [fixture evidence and limitations](evidence/pm-team/ACCEPTANCE.vi.md). Team UI, paid-model behavior,8-hour context reliability and efficiency remain unverified.

At a checkpoint, keep the existing `decisions` (chosen decision and short rationale), `unknowns` and `next` fields. Optionally record `continuation: {failedAttempts: [{attempt, outcome, avoid}], blockers: [{issue, resolution}]}` in that same output. Both arrays must be explicit, contain at most10 entries each, and use nonempty text up to1000 characters per field; credential-pattern checks apply. `resolution` describes the condition needed to clear the blocker. Empty arrays mean the caller explicitly recorded none at this milestone; omission remains unknown. This stores outcomes, not private reasoning, and does not grant permission or launch a summary model.

`tools/carry-canonical.js` is an explicit local experiment over a supplied canonical store, with bounded public evidence references and current source/revision checks. It has no CLI default store, runtime hook or controller. The automated journey uses only a test-created store and executable fixture; [assessment and reproduction](evidence/context-window/carry-review/ASSESSMENT.vi.md#lát-cắt-canonical-local-trong60-phút-2026-10-22) distinguish transport bytes from unmeasured model quality, usage and billing.

## Live work updates

Plan/Execute/Results check for external task/run changes while visible. Unchanged reads use `If-None-Match`/HTTP304. Active edits, keyboard focus and open evidence defer DOM replacement; use **Show updates** to apply the pending state. Foreground work reads cancel stale background reads, and navigation clears the cached tag. Offline results remain visible with retry, up to30 seconds between attempts; each background request is bounded to10 seconds. This is polling transport, not a model or billing guarantee. Human-mode PM history is under Options and source deep links; takeover closes the supervision region without deleting history.
