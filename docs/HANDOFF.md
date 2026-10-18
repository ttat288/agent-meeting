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
                  long-poll state, minutes.md|json), /a/<agentId>/<tool> (API văn bản cho curl),
                  /mcp/<agentId> (MCP JSON-RPC); lưu biên bản (--minutes-dir), gửi webhook (work/task/ended),
                  ghi/nạp trạng thái phòng (--data-dir), renew(mt, carry)
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
  - Mẫu bối cảnh không được chứa `<…>` thật (trang chủ trì coi là chỗ trống chưa điền và hỏi lại trước khi bắt đầu).
  - Agent hay vào lại cuộc họp sau với TÊN KHÁC (Haiku-Agent → Haiku-Analyst); nó tự nhắc lại dòng VIỆC và `sameTask`
    gộp vào việc cũ (đổi người phụ trách, giữ số). Hai agent cùng gửi KẾT LUẬN với câu chữ khác nhau vẫn có thể tạo việc
    trùng: chưa nới `sameTask` (gộp nhầm làm mất việc), chủ trì đánh dấu bản trùng là xong.
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- Phiên bản phát hành: **v3.0.0** (main, đã có GitHub Release).
- **v3.1.0** đã merge vào main (2026-10-18), CHƯA tag/GitHub Release: code bước 1-4, 65 test xanh, package.json 3.1.0,
  CHANGELOG, README/README.en/GUIDE/DEPLOY đã cập nhật. Tag/release phải hỏi người dùng (nên làm sau khi thử MCP thật).
- Đã kiểm chứng (phiên 2026-10-18): toàn bộ bằng subagent Haiku 4.5 / Sonnet 5.5 qua curl với đúng prompt từ trang, server dev
  `--local --port 3100 --host-key … --agent-key … --data-dir … --minutes-dir …`, giao diện bằng trình duyệt tích hợp
  (desktop + mobile 375px). Chưa kiểm chứng: CLI thật qua MCP, webhook tới Slack/Discord/Google Chat thật (mới có server giả
  trong test), `npm run demo` sau thay đổi, `scripts/install-linux.sh`.

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
4. Khởi động lại giữa chừng: kill theo PID (`ss -ltnp | grep :3100`, SIGTERM để kịp ghi), chạy lại đúng lệnh trên.

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
kế hoạch → "Họp tiếp" → họp review → WORK → đóng. Bước 5 còn thiếu: Claude Code / Codex CLI / Gemini CLI qua MCP (máy dev
không có các CLI này; luồng MCP mới chỉ có test JSON-RPC). Ảnh/GIF chưa cập nhật cho màn WORK và bảng việc.

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
5. ◐ **Thử với agent thật**: Claude Code, Codex CLI, Gemini CLI qua MCP (chưa từng thử, máy dev hiện KHÔNG cài các CLI
   này: nhờ người dùng cài hoặc thử trên máy khác); subagent haiku/sonnet qua curl như trước. Mẫu kịch bản: họp chốt
   2 việc nhỏ trong một repo thử, agent làm thật, báo TIẾN ĐỘ kèm commit.
6. ✅ Tài liệu (README, README.en, GUIDE, DEPLOY, CHANGELOG 3.1.0), package.json 3.1.0, ảnh/GIF nếu UI đổi nhiều,
   rồi hỏi người dùng trước khi merge/push/release.

**Ngoài phạm vi (đừng làm):** tài khoản/phân quyền (dùng reverse proxy của công ty), server tự khởi chạy agent hay tự
merge code, nhiều phòng song song, chạy test thay agent.

## Việc tiếp theo

Theo thứ tự ưu tiên:

1. **Thử MCP với CLI thật** (bước 5 còn dở). Cần người dùng cài Claude Code / Codex CLI / Gemini CLI (máy dev không có).
   Kịch bản như mục "Cách lặp lại" nhưng agent vào bằng tab Claude Code / Codex CLI / Gemini CLI trên trang. Cần xem:
   agent có gọi `progress` (tool MCP) sau khi `leave` không, có tự dừng sau "Bạn đã báo xong mọi việc" không, Codex có bị
   timeout tool ~60s với `wait` không, Gemini có đọc đúng `TIẾN ĐỘ VIỆC` không. Sửa văn bản giao thức nếu agent hiểu sai.
2. **Webhook thật**: gửi thử tới Slack/Discord/Google Chat một phòng có `--follow-up` (3 loại `work`/`task`/`ended`).
3. **Ảnh/GIF**: chụp lại `docs/screenshots/` cho bảng việc có trạng thái, màn "Đang thực hiện", thẻ "Mang từ cuộc họp
   trước"; cân nhắc GIF demo mới (`npm run demo` chưa dùng `progress`/follow-up: có thể thêm vào `scripts/demo-bots.js`).
4. **Phát hành v3.1.0** (khi người dùng đồng ý; code đã ở main): tag `v3.1.0`, GitHub Release lấy nội dung từ CHANGELOG,
   `bash scripts/install-linux.sh` để cập nhật bản trong menu. Sửa gì sau khi thử MCP thì làm trên nhánh mới rồi merge.
5. **Việc trùng**: nút cho chủ trì gộp/xoá một việc trên web (hiện chỉ đánh dấu xong). Không nới `sameTask` nếu chưa có
   tin agent thật làm bằng chứng gộp đúng (gộp nhầm làm mất việc).
6. Nhỏ: tên nút có `title` làm accessible name khác chữ hiển thị ("Họp tiếp…"); có thể dùng `aria-describedby`.

Ý tưởng xa hơn (chưa lên kế hoạch):

- Nhiều phòng họp song song trên một server, trang quản trị có mật khẩu (đang nằm trong "Ngoài phạm vi" của v3.1).
- Webhook Microsoft Teams (Adaptive Card); hiện Teams nhận JSON chung.
- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
