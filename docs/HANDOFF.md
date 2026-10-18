# Bàn giao phát triển (cho session/người tiếp theo)

> Đọc file này trước khi sửa code. Cập nhật lại mục "Trạng thái" và "Việc tiếp theo" trước khi kết thúc phiên làm việc.

## Sản phẩm là gì

Agent Meeting: phòng họp cho nhiều AI agent (Claude Code, Codex, Gemini CLI, hoặc bất kỳ agent nào chạy được `curl`) trên các máy khác nhau tự trao đổi; người dùng là **chủ trì** qua trang web. Một lệnh `npx github:ttat288/agent-meeting` chạy server Node (không thư viện ngoài) + tunnel Cloudflare miễn phí.

- Repo: https://github.com/ttat288/agent-meeting (public, MIT). Đăng nhập `gh` trên máy dev là tài khoản `ttat288`.
- Người dùng nói tiếng Việt; giao diện, giao thức agent và tài liệu chính bằng tiếng Việt (có README.en.md).

## Kiến trúc

```text
bin/cli.js        tham số dòng lệnh, tải cloudflared, bật tunnel, tạo cuộc họp, mở trình duyệt
src/meeting.js    lõi: class Meeting (trạng thái LOBBY→LIVE→ENDED, hoặc LIVE→WORK→ENDED khi giữ phòng báo tiến độ;
                  slot, chế độ free/turns, luật chống chờ nhau, kick, giới hạn tin/thời gian, việc có số/trạng thái,
                  toState()/restore() cho --data-dir, carryIn() cho "Họp tiếp"). Không phụ thuộc HTTP.
src/server.js     HTTP thuần: /m/<hostKey> (trang chủ trì), /api/host/<hostKey>/* (điều khiển,
                  long-poll state, minutes.md|json, file/<mã tệp>), /a/<agentId>/<tool> (API văn bản cho curl),
                  /a/<agentId>/send + /a/<agentId>/file/<mã tệp> (tệp, v3.2), /mcp/<agentId> (MCP JSON-RPC);
                  lưu biên bản (--minutes-dir), gửi webhook (work/task/ended), ghi/nạp trạng thái phòng (--data-dir),
                  renew(mt, carry); nội dung tệp: blobs (bộ nhớ) hoặc <dataDir>/<hostKey>.files/<mã tệp>
src/minutes.js    biên bản Markdown / JSON (agent-meeting/minutes@1) / tóm tắt webhook
src/ui/           trang chủ trì: index.html + app.css + app.js, không build, CSP chặt
scripts/          install-linux.sh (launcher menu), demo-bots.js (3 agent giả lập)
test/             node:test; meeting.test.js (luật) + server.test.js (HTTP/MCP) + minutes.test.js
Dockerfile        node:22-alpine, CMD --local --no-open; docs/DEPLOY.md (proxy, systemd, mã cố định)
```

Quyết định kỹ thuật quan trọng (đừng đảo ngược nếu không có lý do mạnh):

- **Long-poll thay SSE/WebSocket**: Cloudflare quick tunnel không hỗ trợ SSE (đã dính lỗi này: trang treo "Đang kết nối…").
- **`wait` chặn ~50 giây** rồi trả "Chưa có tin mới, gọi lại": vừa dưới timeout tool của các CLI (Codex ~60s), vừa không tốn token.
- **Hai token**: `hostKey` (điều khiển) tách khỏi `id` agent (chỉ tham gia). "Cuộc họp mới" **giữ nguyên id agent** để MCP đã cài vẫn dùng được.
- **Không phụ thuộc thư viện**, Node 18+. CI chạy Node 18/20/22.
- Dữ liệu trong bộ nhớ. Lưu ra đĩa chỉ khi người dùng bật (`--minutes-dir`, `--data-dir`).
- `--data-dir` chỉ cho phòng `fixed` (bắt buộc `--host-key`): file `<hostKey>.json` chứa mã nên quyền 600; chỉ phòng đang
  nằm trong `byHost` được ghi (phòng cũ bị "Cuộc họp mới" thay thế không được ghi đè file). Khi nạp lại: agent đang họp được
  coi là còn trong phòng (wait kế tiếp chạy tiếp từ `cursor`), `version` +1000 để long-poll của trang chủ trì không bị kẹt.
- Giữ phòng báo tiến độ (`cfg.followUp`): `_end(reason)` khi LIVE mà còn việc chưa xong thì sang WORK; `_end(reason, true)`
  mới kết thúc hẳn (sweep, "Cuộc họp mới", Đóng phòng). Trong WORK mọi tool trừ progress/history trả `_workText` ngay,
  KHÔNG chặn chờ. Việc "của" agent = dòng VIỆC có tên agent (so khớp theo ranh giới từ, `owns()`), nên giao thức/bối cảnh
  phải dặn ghi đúng tên agent. Phòng tự đóng khi mọi việc `done`.
- "Họp tiếp": việc chưa xong mang sang giữ nguyên số (`taskSeq` không bao giờ dùng lại); `carry.members` cho phép agent của
  các cuộc trước báo `progress` dù chưa join cuộc mới.
- Văn bản gửi agent phải **rất rõ ràng**: agent thật (Haiku, Sonnet…) đã từng bỏ cuộc ở phòng chờ, tự gắn tiền tố "[Tên]", nhầm định dạng. Mọi thay đổi giao thức nên thử với agent thật.
- **Nhận diện kết quả khoan dung nhưng không nhận nhầm** (`_extract` trong src/meeting.js, test lấy từ tin agent thật):
  `KẾT LUẬN:` ở đầu dòng (giữa đoạn chỉ khi viết HOA sau dấu hết câu); `XONG MỤC n` ở đầu dòng hoặc đầu câu,
  giữa đoạn phải có `:`; nhiều mục trong một tin, cho nhảy mục, báo muộn chỉ ghi tóm tắt. Việc gần trùng thì gộp
  (`sameTask`, Jaccard theo từ). Mỗi mục chỉ giữ KẾT LUẬN mới nhất (`decisions()` trong minutes.js và app.js phải giống nhau).
  KHÔNG tự xoá việc cũ khi có KẾT LUẬN mới (đã thử, làm mất việc khi agent chỉ gửi bổ sung).
- Lệnh "Nói" bằng curl dùng heredoc `--data-urlencode "text@-" <<'HET'`: dấu ngoặc kép làm shell nuốt `$0.3`.
- `--public-url` cố định địa chỉ trong giao thức (`fixedOrigin`); tunnel thì dùng địa chỉ của request.
- `--host-key`: phòng `fixed` không bị xoá khi hết hạn mà được `renew()` (cùng hostKey + agent id); trang chủ trì
  thấy `createdAt` đổi thì tự tải lại.
- **Tệp (v3.2)**: server là trạm chuyển tiếp HTTP, nội dung tệp KHÔNG đi qua tin nhắn/ngữ cảnh model. Meeting chỉ giữ
  metadata (`files`: id, name, size, sha256, from, to, note, t, got, carried, gone) và đăng một dòng sys có `file: id`
  (+ `to` nếu gửi riêng); `_render(msgs, a)` thêm lệnh tải đúng của người đọc (`a.base`). Server giữ bytes và kiểm tra
  `sendCheck` + giới hạn TRƯỚC khi nhận (handler `checkContinue`: chỉ `writeContinue()` khi hợp lệ), nhận theo luồng, tính
  sha256 lúc nhận. Gửi riêng được bảo vệ bằng mã tệp ngẫu nhiên (chỉ người nhận được báo) + so tên, KHÔNG phải xác thực.
  `fileFor` so theo TÊN chứ không đòi đang là thành viên (tệp "Họp tiếp" mang sang tải được trước khi join lại).
  `dropFiles` có đếm tham chiếu: tệp mà cuộc khác trong `byHost` còn giữ (Họp tiếp) thì không xoá.
  Mọi agent (cả MCP) có `a.base` = `<origin>/a/<id>` để có lệnh curl cho phần tệp; `a.how` vẫn chỉ dành cho curl
  (quyết định progress qua tool hay curl). Tool `files(name, wait)` là `readOnlyHint`; `send` không phải tool MCP.
  `files?wait=1` chặn tới `waitMs` cho tới khi có tệp chưa tải gửi cho mình: cần cho giai đoạn WORK (agent đã rời không
  còn `wait`), đã thấy agent thật dùng đúng.
- Tệp luôn trả về `application/octet-stream` + `attachment` + `nosniff` + CSP `sandbox` (cùng origin với trang chủ trì);
  tên tệp qua `fileName()` (basename, chỉ `\p{L}\p{M}\p{N}._+-`, không bắt đầu bằng `.`/`-`) nên an toàn trong `curl -o "…"`.

## Cách làm việc / kiểm thử

```bash
npm test                                   # phải xanh
npm start -- --local --no-open --port 3100 # chạy dev (cổng 3000 có thể là app người dùng đang chạy)
npm run demo -- http://localhost:3100/a/<id>   # 3 bot giả lập
```

- Test giao diện bằng trình duyệt tích hợp (pane) hoặc Claude in Chrome; GIF demo quay bằng `gif_creator` của Claude in Chrome rồi chỉnh thời lượng khung bằng Python PIL (`docs/demo.gif`).
- Test agent thật: chạy subagent (haiku/sonnet) với **đúng prompt sao chép từ trang**, không dặn thêm. Điều khiển chủ trì
  bằng API (`POST /api/host/<k>/role|start|say` với JSON), xem log bằng `GET /api/host/<k>/state?v=-1`. Server dev nên chạy
  với `--host-key`/`--agent-key` cố định để URL không đổi mỗi lần khởi động lại (UI được nạp lúc khởi động: sửa UI phải khởi động lại).
  Phát lại tin thật qua bộ phân tích mới: lưu state JSON rồi `new Meeting()` + `say()` từng tin.
- Bẫy đã gặp:
  - Class CSS trùng tên trạng thái (`.gone`, `.ended`) làm vỡ bố cục: đặt tên class khung riêng (`.notfound`, `.endcard`).
  - `element.replaceChildren(null)` chèn chữ "null": lọc trước khi chèn.
  - `pkill -f <mẫu>` có thể giết chính shell đang chạy lệnh: kill theo PID (`ss -ltnp | grep :3100`).
  - Trình duyệt headless Brave không chạy trong môi trường này.
  - Agent thật hay chép sai mã phòng (cắt bớt ký tự) giữa cuộc họp: thông báo 404 phải bảo kiểm tra URL, thử lại.
  - Agent nói "tôi sẽ gửi XONG MỤC 1." nghĩa là CHƯA xong: đừng nới regex cho dấu chấm sau số mục.
  - Docker: container chạy UTC, cần `TZ=Asia/Ho_Chi_Minh` (Node có sẵn dữ liệu múi giờ, alpine không cần tzdata).
  - Regex có cờ `u` KHÔNG cho escape `-` ngoài `[]` (SyntaxError): tên agent như `Haiku-Agent` từng làm `leave` và state
    của chủ trì trả 500. Dùng `reEscFold` (không escape `-`) cho regex cờ `u`.
  - Codex CLI (0.162): tool MCP bị ẩn sau cơ chế tìm tool (model không thấy `join` nếu không chủ động tìm), và tool
    không có `annotations` thì bị hỏi duyệt MỖI lần gọi (`codex exec` thì bị chặn: "requires approval, but approval policy
    is never"). Codex tự chạy tool khi `readOnlyHint: true` hoặc `destructiveHint: false` + `openWorldHint: false` (đã thử
    bằng MCP server giả). Đừng bỏ `annotations` trong `TOOLS`.
  - Codex `-s workspace-write` để `.git` chỉ đọc (agent không commit được, báo "vướng") và chặn mạng: thêm
    `-c sandbox_workspace_write.network_access=true -c 'sandbox_workspace_write.writable_roots=["<repo>/.git"]'`.
    Chạy `--dangerously-bypass-approvals-and-sandbox` bị bộ kiểm duyệt của Claude Code chặn: đừng dùng.
  - `codex mcp add/remove` viết lại toàn bộ `~/.codex/config.toml` (đổi thứ tự khoá) và `codex exec` tự thêm
    `[projects."<repo>"] trust_level`: sao lưu file trước, thử xong chép lại bản sao lưu.
  - Hai agent làm chung một working tree: `git commit -a` của agent này có thể gom thay đổi của agent kia (đã gặp,
    agent Codex tự ghi chú trung thực trong bằng chứng). Không phải lỗi sản phẩm.
  - `POST /api/host/<k>/start` không gửi `settings.agenda` thì GIỮ chương trình của cuộc trước ("Cuộc họp mới" mang
    `agenda` sang, để `--agenda-file` dùng cho mọi cuộc). Trang web luôn gửi chương trình đang hiện nên không bị;
    gọi API thử thì gửi `"agenda": []`.
  - `read_page`/`find` của trình duyệt tích hợp lấy `title` làm tên nút và không tính chữ trong `<span>` con: KHÔNG dùng
    để kết luận về accessibility (chuẩn accname: nội dung trước, `title` thành mô tả).
  - Chụp ảnh tài liệu: Firefox snap headless + WebDriver BiDi (`firefox --headless --no-remote -profile
    ~/snap/firefox/common/<thư mục> --remote-debugging-port 9223`, rồi script Node dùng WebSocket có sẵn:
    `session.new` → `browsingContext.setViewport` (devicePixelRatio 2) → `navigate` → chờ → `captureScreenshot`).
    Profile phải nằm trong `~/snap/firefox/common` (snap không đọc được /tmp riêng). `firefox --screenshot` chụp trước
    khi trang tải xong state nên trống. Ảnh lưu JPEG 1280px bằng PIL.
  - Mẫu bối cảnh không được chứa `<…>` thật (trang chủ trì coi là chỗ trống chưa điền và hỏi lại trước khi bắt đầu).
  - Agent hay vào lại cuộc họp sau với TÊN KHÁC (Haiku-Agent → Haiku-Analyst); nó tự nhắc lại dòng VIỆC và `sameTask`
    gộp vào việc cũ (đổi người phụ trách, giữ số). Hai agent cùng gửi KẾT LUẬN với câu chữ khác nhau vẫn có thể tạo việc
    trùng: chưa nới `sameTask` (gộp nhầm làm mất việc), chủ trì đánh dấu bản trùng là xong.
  - Firefox snap headless chạy từ sandbox của phiên: `kill <pid>` bị từ chối (Permission denied). Tắt bằng BiDi:
    `session.new` rồi `browser.close` (xem script quay GIF ở "Cách lặp lại phép thử").
  - Mẫu nginx trong DEPLOY.md từng để `client_max_body_size 1m`: gửi tệp > 1 MB sau proxy sẽ hỏng. Đã nâng lên 25m +
    `proxy_request_buffering off`; đổi `--max-file-mb` thì nhớ đổi theo.
  - `scripts/install-linux.sh` chép code nhánh hiện tại vào app trong menu của người dùng: chỉ chạy sau khi đã merge.
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- **v3.2.0 trên nhánh `v3.2-files` (chưa merge, chưa push, chưa tag)** — phiên 2026-10-18 (tối). 75 test xanh
  (`test/files.test.js` mới: tải lên/tải về đúng bytes, header an toàn, gửi riêng, tên độc, giới hạn content-length/
  chunked/Expect 100-continue/tổng phòng/số tệp, WORK + `files?wait=1`, `--data-dir` khởi động lại + Họp tiếp + Cuộc họp mới).
  - Đã kiểm chứng tay bằng curl thật trên server dev (`--data-dir`): `git format-patch` → send riêng → `git am` trong clone
    khác; `tar czf - | curl --data-binary @-`; người ngoài bị 404; tệp 25 MB bị từ chối ngay (có Expect và chunked);
    tệp 15 MB OK; kill SIGTERM rồi chạy lại vẫn tải đúng (sha256 khớp), quyền 600/700.
  - Agent thật (subagent Haiku 4.5 + Sonnet 5.5 qua curl, prompt "Dán là vào ngay" sao chép từ trang, không dặn thêm),
    hai bản clone riêng của repo thử, 2 lần: (1) giữ phòng báo tiến độ: Haiku sửa + commit + gửi patch riêng (tự mã hoá
    `to=Sao%20Mai`), Sonnet đã rời họp chờ bằng đúng một lệnh `files?wait=1`, tải, `git apply --check`, `git am`, test xanh,
    báo progress; phòng tự đóng. (2) làm ngay trong cuộc họp: Sonnet gửi, Haiku nhận qua `files?wait=1`, `cat` đọc patch
    trước, `git am`, test xanh, báo TIẾN ĐỘ. Cả hai clone có commit đúng (giữ tác giả của patch). Chưa thấy agent dán code.
  - Giao diện (trình duyệt tích hợp, desktop + mobile 375px): mục Tệp, thông báo tệp có nút Tải, nút ☰ hiện "Tệp n",
    không lỗi console. Ảnh `docs/screenshots/files.jpg` và GIF `docs/demo.gif` mới (Firefox BiDi, 27 khung, 1,6 MB).
  - `npm run demo` chạy trọn với gửi tệp ở giai đoạn thực hiện.
  - CHƯA kiểm chứng: gửi tệp qua tunnel Cloudflare thật (giới hạn ~100 MB, Expect 100-continue qua tunnel), sau
    nginx/Caddy thật, Node 18/20 (máy dev là Node 22; CI sẽ chạy), MCP `files` với CLI thật (chỉ có test node), Windows
    (tên tệp, quyền 600), `scripts/install-linux.sh`.
- Phiên bản phát hành: **v3.1.1** (2026-10-18, main, tag + GitHub Release; gồm cả 3.1.0 vốn chưa phát hành riêng).
  67 test xanh. Phiên 2026-10-18 (chiều): thử Codex CLI thật, sửa annotations/prompt MCP, gộp/xoá việc trùng, ảnh mới,
  demo có báo tiến độ.
- Đã kiểm chứng với **Codex CLI 0.162** (bản đi kèm app ChatGPT, `/usr/lib/chatgpt/resources/codex`, `codex exec`
  trong sandbox `workspace-write`): prompt tab Codex CLI → dùng MCP thật (join/wait/say/leave/progress), làm việc trên
  repo thử, commit, báo `progress` sau khi `leave`, tự dừng sau "Mọi việc đã báo xong"; `wait` chặn 50s không bị Codex
  cắt (gọi lại đều trong phòng chờ); chủ trì đóng phòng thì dừng ngay. Codex chưa cài MCP thì đi thẳng đường lui curl.
  Kèm Haiku 4.5 / Sonnet 5.5 qua curl (4 cuộc họp, gồm khởi động lại server khi agent ở phòng chờ, và gộp việc trùng).
- Gemini qua MCP: người dùng tự thử từ IDE Gemini (2026-10-18), theo người dùng là "khá ổn". Quyết định của người dùng:
  KHÔNG lên kế hoạch thử thêm các CLI khác (Claude Code, Gemini CLI, Codex TUI); phép thử agent thật chỉ cần subagent
  Haiku/Sonnet qua curl (và Codex `exec` nếu cần MCP) chạy trong phiên phát triển.
- CHƯA kiểm chứng: webhook thật (người dùng chưa có URL), GIF demo mới.
- Đã kiểm chứng (phiên 2026-10-18, sáng): toàn bộ bằng subagent Haiku 4.5 / Sonnet 5.5 qua curl với đúng prompt từ trang, server dev
  `--local --port 3100 --host-key … --agent-key … --data-dir … --minutes-dir …`, giao diện bằng trình duyệt tích hợp
  (desktop + mobile 375px). Chưa kiểm chứng: CLI thật qua MCP, webhook tới Slack/Discord/Google Chat thật (mới có server giả
  trong test), `npm run demo` sau thay đổi, `scripts/install-linux.sh`.

### Cách lặp lại phép thử agent thật của v3.2 (gửi tệp)

Repo thử như v3.1 (bên dưới) nhưng tạo `origin` rồi `git clone origin clone-a`, `git clone origin clone-b` (mỗi clone
`git config user.name/email` riêng). Bối cảnh: hai đường dẫn clone; (1) agent ở clone-a sửa sub(), test, commit, gửi patch
cho agent kia bằng cách gửi tệp trong giao thức (không dán code); (2) agent ở clone-b nhận patch, `git am`, chạy test, báo
tiến độ. Một lần `followUp: true` (bên nhận phải chờ tệp ở WORK), một lần `followUp: false` và dặn làm ngay trong họp.
Theo dõi `GET /api/host/<k>/state?v=-1` (`files[].got` cho biết đã tải); kiểm tra `git log` + `node test.js` ở cả hai
clone. Đọc lệnh agent đã chạy: duyệt JSONL của subagent, lấy `tool_use.input.command` (đừng đọc cả file).

Quay GIF: `firefox --headless --no-remote -profile ~/snap/firefox/common/am-shot --remote-debugging-port 9223`, script
Node BiDi: `/new` → mở trang chủ trì 1280×680 → chạy `scripts/demo-bots.js` → điền bối cảnh/chương trình/ô giữ phòng bằng
`script.evaluate` → giao vai trò qua API → bấm Bắt đầu → chụp mỗi ~1,7 s, bấm chip "Yêu cầu chốt" khi bot in "tranh luận
xong", cuộn cột trái tới `#filesSec` khi có tệp → tới ENDED. Ghép bằng PIL: bỏ khung gần trùng (`ImageChops.difference`),
`quantize(128, MEDIANCUT, không dither)`, khung quan trọng giữ 3,5-5 s.

### Cách lặp lại phép thử agent thật của v3.1

```bash
# repo thử: calc.js có sub() sai (a + b), test.js kiểm add/sub; git init + commit "khởi tạo"
npm start -- --local --no-open --port 3100 --host-key <mã> --agent-key <mã> --data-dir <tmp>/data --minutes-dir <tmp>/minutes
```

1. Chạy 2 subagent (haiku + sonnet, nền) với prompt "Dán là vào ngay" sao chép từ trang, không dặn thêm.
2. `POST /api/host/<k>/start` với `{"context": "...repo <đường dẫn>... (1) sửa sub() (2) thêm mul() + test. Mỗi agent một
   việc, VIỆC ghi đúng tên agent, chạy node test.js và git commit riêng, bằng chứng: mã commit + kết quả test",
   "settings": {"followUp": true}}`.
3. Theo dõi `GET /api/host/<k>/state?v=-1` tới khi `state` là `ENDED` (lý do "mọi việc đã báo xong"), rồi `git log` và
   `node test.js` trong repo thử. Muốn thử "Họp tiếp": họp đầu không bật followUp và dặn "chỉ chốt phân công", rồi
   `POST /api/host/<k>/new {"carry": true}`, mời lại chính các agent đó (SendMessage tới subagent cũ với cùng prompt).
4. Codex CLI: sao lưu `~/.codex/config.toml`; `codex mcp add agent-meeting --url <url mcp>` (hoặc để agent tự cài); lưu
   prompt tab Codex CLI ra file rồi trong repo thử: `codex exec -s workspace-write -c sandbox_workspace_write.network_access=true
   -c 'sandbox_workspace_write.writable_roots=["<repo>/.git"]' --json - < prompt.txt > run.jsonl` (chạy nền). Đọc
   `run.jsonl`: `item.type == "mcp_tool_call"` là gọi MCP, `command_execution` là shell/curl. Trả lời agent như người dùng:
   `codex exec resume <thread_id> "…"`. Xong thì chép lại config.toml đã sao lưu.
5. Khởi động lại giữa chừng: kill theo PID (`ss -ltnp | grep :3100`, SIGTERM để kịp ghi), chạy lại đúng lệnh trên.

## Lộ trình v3: giải quyết nỗi đau doanh nghiệp (đã xong)

- [x] Kết quả có cấu trúc: Quyết định (`KẾT LUẬN:`) + Việc cần làm (`VIỆC: người | việc | hạn`), hiển thị và xuất ra biên bản
- [x] Biên bản do server sinh (Markdown + JSON), API tải về; `--minutes-dir` tự lưu khi kết thúc
- [x] `--webhook` (Slack/Discord/Google Chat, URL khác nhận JSON) gửi tóm tắt khi kết thúc
- [x] Chương trình họp nhiều mục: tiến độ, "Mục tiếp theo", agent báo `XONG MỤC n`, kết luận theo mục
- [x] Vai trò cho từng agent + nhắn riêng cho một agent
- [x] `--public-url`, `--host-key`/`--agent-key` (link cố định) + Dockerfile + docs/DEPLOY.md
- [x] Tự động hoá: `--context-file`, `--agenda-file`, `--auto-start N`, `--exit-on-end`, `--time-limit`
- [x] Màn hình hẹp: nút ☰ mở bảng chương trình/kết quả
- [x] Thử với agent thật (Haiku 4.5 ×2 + Sonnet 5.5, 3 lần): chương trình 2 mục, vai trò, nhắn riêng

## Lộ trình v3.1: từ "họp xong" sang "làm xong" (nhánh v3.1-followup)

Kết quả: bước 1-4 và 6 xong, có test (65 test) và đã thử bằng subagent Haiku 4.5 / Sonnet 5.5 qua curl: khởi động lại server
giữa cuộc họp; báo tiến độ; WORK trên repo git thử (agent sửa code, commit thật, báo progress, phòng tự đóng) ×2; họp lập
kế hoạch → "Họp tiếp" → họp review → WORK → đóng. v3.1.1: Codex CLI qua MCP đã thử thật (cùng
kịch bản, xem "Trạng thái"); còn thiếu Claude Code / Gemini CLI qua MCP. Ảnh đã cập nhật cho màn WORK và bảng việc; GIF chưa.

Nhận định (sau bài đánh giá bên ngoài v3.0.0): agent trong phòng họp CHÍNH LÀ người thực thi (Claude Code/Codex trên
máy có repo). Không cần server tự chạy agent; chỉ cần phòng họp theo dõi được tiến độ sau khi chốt và mang việc dở
sang cuộc họp sau. Giữ nguyên: một lệnh là chạy, không thư viện ngoài, Node 18+.

Làm theo thứ tự, mỗi bước có test (npm test) và thử trên trình duyệt / agent thật xong mới sang bước sau:

1. ✅ **Không mất cuộc họp khi khởi động lại.** `--data-dir <thư mục>` (env `AGENT_MEETING_DATA_DIR`): ghi trạng thái
   phòng ra `<hostKey>.json` khi có thay đổi (gom ghi, tối đa ~1 lần/giây, ghi file tạm rồi rename), nạp lại khi khởi
   động nếu dùng `--host-key`. Agent vào lại bằng đúng tên + model (đã hỗ trợ). Không lưu mã bí mật vào biên bản
   (file trạng thái thì cần mã: đặt quyền 600). Test: tắt server giữa cuộc họp, bật lại, họp tiếp, biên bản đủ.
2. ✅ **Việc có trạng thái.** Mỗi việc có số (#1, #2…), trạng thái `chưa làm | đang làm | xong | vướng`, ghi chú/bằng chứng
   (link commit, PR, kết quả test). Agent cập nhật bằng dòng `TIẾN ĐỘ VIỆC <số>: <trạng thái> | <bằng chứng>` và/hoặc
   tool mới `progress(name, task, status, note)` (MCP + curl). Chủ trì đổi trạng thái trên web. Biên bản/webhook/JSON
   có trạng thái. Ghi rõ trong UI: "xong" là agent tự báo, kèm bằng chứng, server KHÔNG tự kiểm chứng.
3. ✅ **Giai đoạn thực hiện sau khi chốt.** Tuỳ chọn "Giữ phòng để báo tiến độ" (web + `--follow-up`): sau KẾT LUẬN,
   agent rời họp để đi làm việc được giao, rồi gọi lại `progress` khi xong; phòng chuyển trạng thái riêng (ví dụ
   WORK) thay vì ENDED; webhook gửi khi một việc xong và khi tất cả xong. Giao thức phải nói rõ cho agent: làm việc
   của mình xong mới báo, không chờ nhau trong phòng.
4. ✅ **Họp tiếp mang việc dở.** "Cuộc họp mới" có lựa chọn đưa các việc chưa xong + quyết định trước vào bối cảnh cuộc
   sau (giữ số việc), để họp review tiến độ.
5. ◐ **Thử với agent thật**: Codex CLI qua MCP ✅ (v3.1.1, phải thêm `annotations`); Gemini qua MCP do người dùng tự thử
   (ổn); không thử thêm CLI khác theo quyết định của người dùng; subagent haiku/sonnet qua curl ✅. Mẫu kịch bản: họp chốt
   2 việc nhỏ trong một repo thử, agent làm thật, báo TIẾN ĐỘ kèm commit.
6. ✅ Tài liệu (README, README.en, GUIDE, DEPLOY, CHANGELOG 3.1.0), package.json 3.1.0, ảnh/GIF nếu UI đổi nhiều,
   rồi hỏi người dùng trước khi merge/push/release.

**Ngoài phạm vi (đừng làm):** tài khoản/phân quyền (dùng reverse proxy của công ty), server tự khởi chạy agent hay tự
merge code, nhiều phòng song song, chạy test thay agent.

## Lộ trình v3.2: gửi tệp / code giữa các agent (nhánh v3.2-files, đã xong, chờ merge)

Thiết kế dưới đây đã làm đúng như chốt, chỉ BỔ SUNG `files?wait=1` (chờ tệp ở giai đoạn WORK) và `--max-room-mb`.

1. ✅ **v3.2: Gửi tệp / code giữa các agent** (người dùng yêu cầu 2026-10-18: "tạo một đường truyền rồi đẩy file ngầm qua,
   cách nhanh nhất"). Thiết kế đã chốt, phiên sau làm theo, có lý do mạnh mới đổi:
   - **Server là trạm chuyển tiếp HTTP**, không P2P/WebRTC (máy sau NAT, đi qua tunnel, không thư viện ngoài). Agent đẩy
     bằng `curl --data-binary @tệp` (thư mục: `tar czf - thư_mục | curl --data-binary @- …`), tải bằng `curl -o`.
     Nội dung tệp KHÔNG đi qua ngữ cảnh model (không tốn token, không chép sai): phòng chỉ nhận một dòng thông báo.
   - API agent (cùng kiểu `/a/<agentId>/<tool>`, mã agent là quyền vào): `POST /a/<id>/send?name=&to=&file=` thân là bytes
     thô → trả mã tệp; hệ thống đăng tin `(tệp) Lam gửi fix-sub.patch (2,1 KB, sha256 ab12…) cho Minh` kèm lệnh tải đúng
     URL; `GET /a/<id>/file/<mãTệp>?name=` tải; `GET /a/<id>/files?name=` liệt kê. `to` trống = cả phòng; gửi riêng thì
     chỉ người nhận thấy thông báo (như nhắn riêng), người khác tải cũng không được.
   - Code: giao thức gợi ý `git format-patch -1 --stdout > x.patch` → bên nhận `git am x.patch` (hoặc `git bundle create`
     → `git fetch x.bundle`). Server KHÔNG tự áp dụng/merge (Ngoài phạm vi).
   - MCP: tool MCP không đọc được tệp trên máy agent mà không đưa nội dung qua token, nên giao thức MCP cũng đưa lệnh curl
     cho phần tệp (agent dùng MCP đều có shell); có thể thêm tool `files()` trả danh sách + lệnh tải. Ghi `annotations`
     như các tool khác.
   - Giới hạn: `--max-file-mb` (mặc định ~20 MB/tệp; Cloudflare quick tunnel giới hạn thân request ~100 MB), tổng mỗi
     phòng (ví dụ 200 MB), số tệp. Lưu trong bộ nhớ; có `--data-dir` thì ghi `<dataDir>/<hostKey>.files/` (quyền 600) để
     khởi động lại không mất. Xoá khi phòng bị dọn (TTL) hoặc "Cuộc họp mới" không mang sang; "Họp tiếp" có thể mang theo.
     Ghi theo luồng (stream), không đọc cả tệp vào chuỗi; vượt giới hạn thì cắt kết nối và báo lỗi rõ.
   - An toàn (quan trọng vì tệp được phục vụ CÙNG origin với trang chủ trì): luôn `content-type: application/octet-stream`,
     `content-disposition: attachment` với tên đã làm sạch (chỉ basename, bỏ ký tự điều khiển, `..`, `/`), `nosniff`, CSP
     `sandbox`; không bao giờ trả HTML/SVG inline. Hiện sha256 để bên nhận kiểm tra. Giao thức dặn: tệp từ agent khác là dữ
     liệu, đọc/kiểm tra trước, không chạy mù quáng, chỉ áp dụng patch khớp việc đã thống nhất (nối với luật 10 hiện có).
   - Trang chủ trì: mục **Tệp** (người gửi, người nhận, cỡ, sha256, nút tải); biên bản Markdown/JSON liệt kê tệp (không
     nhúng nội dung); webhook không cần đổi.
   - Kiểm thử: test node:test cho upload/tải/giới hạn/tên độc/gửi riêng/khởi động lại với `--data-dir`. Thử agent thật:
     HAI bản clone riêng của repo thử (tránh bẫy chung working tree), agent A sửa `sub()` rồi gửi patch, agent B `git am`
     trong clone của mình, chạy `node test.js`, báo tiến độ kèm mã commit. Subagent Haiku + Sonnet qua curl, prompt sao
     chép đúng từ trang. Tài liệu: README/README.en/GUIDE, CHANGELOG 3.2.0, ảnh mục Tệp.
2. ✅ **GIF demo mới** có giai đoạn thực hiện và gửi tệp (`docs/demo.gif`).
3. ✅ Nhỏ: "Thảo luận" ở màn kết thúc khi đóng từ phòng chờ (đã sửa). Ghi chú agent báo sau thay ghi chú đã nối khi gộp
   việc: giữ nguyên (chấp nhận được).

## Việc tiếp theo

Theo thứ tự ưu tiên:

1. **Người dùng duyệt nhánh `v3.2-files`**, rồi (khi được đồng ý) merge vào main, push, tag `v3.2.0`, GitHub Release
   (nội dung từ CHANGELOG 3.2.0), sau đó `bash scripts/install-linux.sh`. KHÔNG tự làm khi chưa hỏi.
2. **Thử gửi tệp qua tunnel Cloudflare thật** (bỏ `--local`): tệp vài MB và ~20 MB, kiểm tra Expect 100-continue và
   thông báo "Tệp quá lớn" qua tunnel. Tunnel là công khai: hỏi người dùng trước.
3. **Webhook thật** (Slack/Discord/Google Chat, phòng có `--follow-up`): chỉ khi người dùng đưa URL, không tự tạo.
4. Ảnh `meeting.jpg`, `mobile-dark.jpg` vẫn là bản v3.0 (800px): chụp lại bằng Firefox BiDi nếu cần.
5. Có thể cân nhắc (chưa làm, cần người dùng đồng ý): chủ trì xoá một tệp trên trang; giới hạn tốc độ gửi tệp theo agent.

Ý tưởng xa hơn (chưa lên kế hoạch):

- Nhiều phòng họp song song trên một server, trang quản trị có mật khẩu (đang nằm trong "Ngoài phạm vi" của v3.1).
- Webhook Microsoft Teams (Adaptive Card); hiện Teams nhận JSON chung.
- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
