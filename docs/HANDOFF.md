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
                  long-poll state), /a/<agentId>/<tool> (API văn bản cho curl), /mcp/<agentId> (MCP JSON-RPC)
src/ui/           trang chủ trì: index.html + app.css + app.js, không build, CSP chặt
scripts/          install-linux.sh (launcher menu), demo-bots.js (3 agent giả lập)
test/             node:test; meeting.test.js (luật) + server.test.js (HTTP/MCP)
```

Quyết định kỹ thuật quan trọng (đừng đảo ngược nếu không có lý do mạnh):

- **Long-poll thay SSE/WebSocket**: Cloudflare quick tunnel không hỗ trợ SSE (đã dính lỗi này: trang treo "Đang kết nối…").
- **`wait` chặn ~50 giây** rồi trả "Chưa có tin mới, gọi lại": vừa dưới timeout tool của các CLI (Codex ~60s), vừa không tốn token.
- **Hai token**: `hostKey` (điều khiển) tách khỏi `id` agent (chỉ tham gia). "Cuộc họp mới" **giữ nguyên id agent** để MCP đã cài vẫn dùng được.
- **Không phụ thuộc thư viện**, Node 18+. CI chạy Node 18/20/22.
- Dữ liệu trong bộ nhớ. Lưu ra đĩa chỉ khi người dùng bật (`--minutes-dir`).
- Văn bản gửi agent phải **rất rõ ràng**: agent thật (Haiku, Sonnet…) đã từng bỏ cuộc ở phòng chờ, tự gắn tiền tố "[Tên]", nhầm định dạng. Mọi thay đổi giao thức nên thử với agent thật.

## Cách làm việc / kiểm thử

```bash
npm test                                   # phải xanh
npm start -- --local --no-open --port 3100 # chạy dev (cổng 3000 có thể là app người dùng đang chạy)
npm run demo -- http://localhost:3100/a/<id>   # 3 bot giả lập
```

- Test giao diện bằng trình duyệt tích hợp (pane) hoặc Claude in Chrome; GIF demo quay bằng `gif_creator` của Claude in Chrome rồi chỉnh thời lượng khung bằng Python PIL (`docs/demo.gif`).
- Test agent thật: chạy subagent (haiku/sonnet) với **đúng prompt sao chép từ trang**, không dặn thêm.
- Bẫy đã gặp:
  - Class CSS trùng tên trạng thái (`.gone`, `.ended`) làm vỡ bố cục: đặt tên class khung riêng (`.notfound`, `.endcard`).
  - `element.replaceChildren(null)` chèn chữ "null": lọc trước khi chèn.
  - `pkill -f <mẫu>` có thể giết chính shell đang chạy lệnh: kill theo PID (`ss -ltnp | grep :3100`).
  - Trình duyệt headless Brave không chạy trong môi trường này.
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- Phiên bản phát hành: v2.1.1 (đã có GitHub Release).
- Đang làm: **v3 cho doanh nghiệp** (xem dưới).

## Lộ trình v3: giải quyết nỗi đau doanh nghiệp

- [ ] Kết quả có cấu trúc: Quyết định (`KẾT LUẬN:`) + Việc cần làm (`VIỆC: người | việc | hạn`), hiển thị và xuất ra biên bản
- [ ] Biên bản do server sinh (Markdown + JSON), API tải về; `--minutes-dir` tự lưu khi kết thúc
- [ ] `--webhook` (Slack/Discord/Teams…) gửi tóm tắt khi kết thúc
- [ ] Chương trình họp nhiều mục: tiến độ, "Mục tiếp theo", agent báo `XONG MỤC n`, kết luận theo mục
- [ ] Vai trò cho từng agent + nhắn riêng cho một agent
- [ ] `--public-url` (server công ty / reverse proxy, link cố định) + Dockerfile
- [ ] Tự động hoá: `--context-file`, `--auto-start N`, `--exit-on-end`

## Việc tiếp theo (ý tưởng chưa làm)

- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
- Nhiều cuộc họp song song trên một server công ty, trang danh sách cuộc họp có mật khẩu.
