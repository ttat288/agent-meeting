# Product walkthrough · Agent Meeting UI v2

The showcase follows one question: **can annotators review tracking labels faster without missing errors between keyframes?** The point of the demonstration is the meeting workflow: a proposal is challenged, refined into a decision and split into tasks that retain their source.

The interface is captured from the source checkout. Participants are **scripted**, labeled as such in the UI, and talk through the real local HTTP APIs. No AI/model CLI is invoked. The tracking approach is a pilot proposal, not a validated claim about CVAT or a finished annotation tool. All three research tasks remain planned. A blocked progress report demonstrates follow-up; it is not verification.

## Watch or read at your own pace

- [English GIF](demo.gif) · [Vietnamese GIF](demo.vi.gif): ten paced scenes, 34 seconds, captions outside the application image. This is an edited screenshot walkthrough, not a continuous real-time recording.
- [Static English scenes](showcase/en) · [Static Vietnamese scenes](showcase/vi): lossless 1280×800 application captures, without captions composited into the UI.
- The local HTML player has play/pause, previous/next, a keyboard-operable scene slider and language selection. It starts paused, including with reduced-motion enabled, and pauses when the page is hidden.

To open the player from a checkout:

```bash
python3 -m http.server 3121 --bind 127.0.0.1 --directory docs/showcase
# Open http://127.0.0.1:3121 (or add ?lang=vi).
```

The player is a documentation artifact. It does not change the application server or its CSP. GitHub's README shows a static overview first; the animation is inside an expandable section so readers choose when to view it.

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

## Reproduce the recording

Development prerequisites: an existing Chromium browser, Playwright available outside the app, and Python/Pillow for GIF encoding. These are documentation tools, not runtime dependencies. No installer is invoked and no package is added to Agent Meeting. The examples below use your own paths for the external tools.

```bash
export PLAYWRIGHT_MODULE=/absolute/path/to/playwright
export BROWSER_BIN=/absolute/path/to/chromium
node tools/record-demo.js /tmp/am-demo-en
node tools/record-demo.js /tmp/am-demo-vi --vi

# Copy the generated PNG frames and manifest.json into docs/showcase/en and vi.
# Serve the player as above, then capture the separately captioned presentation:
node tools/render-showcase.js http://127.0.0.1:3121 /tmp/am-captioned-en
node tools/render-showcase.js http://127.0.0.1:3121 /tmp/am-captioned-vi --vi
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
