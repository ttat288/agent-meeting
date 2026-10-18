# Bàn giao phát triển (cho session/người tiếp theo)

> Đọc file này trước khi sửa code. Cập nhật lại mục "Trạng thái" và "Việc tiếp theo" trước khi kết thúc phiên làm việc.

## Sản phẩm là gì

Agent Meeting: phòng họp cho nhiều AI agent (Claude Code, Codex, Gemini CLI, hoặc bất kỳ agent nào chạy được `curl`) trên các máy khác nhau tự trao đổi; người dùng là **chủ trì** qua trang web. Một lệnh `npx github:ttat288/agent-meeting` chạy server Node (không thư viện ngoài) + tunnel Cloudflare miễn phí.

- Repo: https://github.com/ttat288/agent-meeting (public, MIT). Đăng nhập `gh` trên máy dev là tài khoản `ttat288`.
- Người dùng nói tiếng Việt; giao diện, giao thức agent và tài liệu chính bằng tiếng Việt (có README.en.md).

## Kiến trúc

```text
bin/cli.js        tham số dòng lệnh, tải cloudflared, bật tunnel, tạo cuộc họp, mở trình duyệt
src/meeting.js    lõi: class Meeting (trạng thái LOBBY→LIVE→ENDED, slot, chế độ free/turns,
                  luật chống chờ nhau, kick, giới hạn tin/thời gian). Không phụ thuộc HTTP.
src/server.js     HTTP thuần: /m/<hostKey> (trang chủ trì), /api/host/<hostKey>/* (điều khiển,
                  long-poll state, minutes.md|json), /a/<agentId>/<tool> (API văn bản cho curl),
                  /mcp/<agentId> (MCP JSON-RPC); lưu biên bản (--minutes-dir), gửi webhook
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
- Dữ liệu trong bộ nhớ. Lưu ra đĩa chỉ khi người dùng bật (`--minutes-dir`).
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
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- Phiên bản phát hành: **v3.0.0** (bản cho doanh nghiệp, đã có GitHub Release, main). Đang làm: v3.1 (dưới).

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

## Lộ trình v3.1: từ "họp xong" sang "làm xong" (đang làm, nhánh v3.1-followup)

Nhận định (sau bài đánh giá bên ngoài v3.0.0): agent trong phòng họp CHÍNH LÀ người thực thi (Claude Code/Codex trên
máy có repo). Không cần server tự chạy agent; chỉ cần phòng họp theo dõi được tiến độ sau khi chốt và mang việc dở
sang cuộc họp sau. Giữ nguyên: một lệnh là chạy, không thư viện ngoài, Node 18+.

Làm theo thứ tự, mỗi bước có test (npm test) và thử trên trình duyệt / agent thật xong mới sang bước sau:

1. **Không mất cuộc họp khi khởi động lại.** `--data-dir <thư mục>` (env `AGENT_MEETING_DATA_DIR`): ghi trạng thái
   phòng ra `<hostKey>.json` khi có thay đổi (gom ghi, tối đa ~1 lần/giây, ghi file tạm rồi rename), nạp lại khi khởi
   động nếu dùng `--host-key`. Agent vào lại bằng đúng tên + model (đã hỗ trợ). Không lưu mã bí mật vào biên bản
   (file trạng thái thì cần mã: đặt quyền 600). Test: tắt server giữa cuộc họp, bật lại, họp tiếp, biên bản đủ.
2. **Việc có trạng thái.** Mỗi việc có số (#1, #2…), trạng thái `chưa làm | đang làm | xong | vướng`, ghi chú/bằng chứng
   (link commit, PR, kết quả test). Agent cập nhật bằng dòng `TIẾN ĐỘ VIỆC <số>: <trạng thái> | <bằng chứng>` và/hoặc
   tool mới `progress(name, task, status, note)` (MCP + curl). Chủ trì đổi trạng thái trên web. Biên bản/webhook/JSON
   có trạng thái. Ghi rõ trong UI: "xong" là agent tự báo, kèm bằng chứng, server KHÔNG tự kiểm chứng.
3. **Giai đoạn thực hiện sau khi chốt.** Tuỳ chọn "Giữ phòng để báo tiến độ" (web + `--follow-up`): sau KẾT LUẬN,
   agent rời họp để đi làm việc được giao, rồi gọi lại `progress` khi xong; phòng chuyển trạng thái riêng (ví dụ
   WORK) thay vì ENDED; webhook gửi khi một việc xong và khi tất cả xong. Giao thức phải nói rõ cho agent: làm việc
   của mình xong mới báo, không chờ nhau trong phòng.
4. **Họp tiếp mang việc dở.** "Cuộc họp mới" có lựa chọn đưa các việc chưa xong + quyết định trước vào bối cảnh cuộc
   sau (giữ số việc), để họp review tiến độ.
5. **Thử với agent thật**: Claude Code, Codex CLI, Gemini CLI qua MCP (chưa từng thử, máy dev hiện KHÔNG cài các CLI
   này: nhờ người dùng cài hoặc thử trên máy khác); subagent haiku/sonnet qua curl như trước. Mẫu kịch bản: họp chốt
   2 việc nhỏ trong một repo thử, agent làm thật, báo TIẾN ĐỘ kèm commit.
6. Tài liệu (README, README.en, GUIDE, DEPLOY, CHANGELOG 3.1.0), package.json 3.1.0, ảnh/GIF nếu UI đổi nhiều,
   rồi hỏi người dùng trước khi merge/push/release.

**Ngoài phạm vi (đừng làm):** tài khoản/phân quyền (dùng reverse proxy của công ty), server tự khởi chạy agent hay tự
merge code, nhiều phòng song song, chạy test thay agent.

## Việc tiếp theo (ý tưởng chưa làm)

- Nhiều phòng họp song song trên một server (hiện mỗi tiến trình một phòng tại một thời điểm), trang quản trị có mật khẩu.
- Chưa thử với Codex CLI / Gemini CLI thật cho các mẫu `KẾT LUẬN`/`VIỆC`/`XONG MỤC` (mới thử Claude Haiku/Sonnet).
- Webhook Microsoft Teams (Adaptive Card); hiện Teams nhận JSON chung.
- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
