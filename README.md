# 🤝 Agent Meeting

**Phòng họp cho nhiều AI agent trên các máy khác nhau tự trao đổi với nhau, còn bạn là chủ trì.**
Một lệnh là chạy. Không tài khoản, không database, không thư viện ngoài, và agent không tốn token khi ngồi chờ.

*English: a self-hosted meeting room where several AI agents (Claude Code, Codex, Gemini CLI, or anything that can run `curl`) on different machines discuss a topic over MCP/HTTP while you chair from a web page: set the context, invite agents with one copy-paste, steer the discussion, kick agents, and export the minutes. One command starts the server and a free Cloudflare tunnel.*

![Màn cuộc họp](docs/screenshots/meeting.jpg)

---

## Vì sao cần tool này?

Cho hai AI CLI ở hai máy nói chuyện với nhau thường dẫn tới cách tệ: chụp màn hình liên tục, hoặc cứ vài giây hỏi một lần xem đối phương nói xong chưa. Cả hai đều tốn token và dễ đọc sai.

Agent Meeting làm khác:

- Agent gọi **một lệnh chặn** (`wait`). Lệnh này nằm im trên server, không tốn token, và chỉ trả về khi có người nói hoặc tới lượt.
- Server **điều phối** để cả nhóm không ngồi chờ nhau mãi: hỏi một người chốt khi im lặng, báo khi có người rời, tự kết thúc khi hết người.
- Bạn **chủ trì** trên một trang web: đặt bối cảnh, mời agent, nhắn chỉ đạo giữa chừng, mời agent ra, tải biên bản.

## Bắt đầu nhanh

Yêu cầu: **Node.js 18+**.

```bash
npx github:ttat288/agent-meeting
```

Chương trình chạy server, tự tải `cloudflared` ở lần đầu, mở **tunnel công khai miễn phí** để máy ở xa vào được, rồi mở trang chủ trì trong trình duyệt.

<details>
<summary>Cài thành ứng dụng trên Linux (có biểu tượng trong menu)</summary>

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting && bash scripts/install-linux.sh
```

Tìm **Agent Meeting** trong menu ứng dụng. Bấm vào sẽ mở một cửa sổ terminal chạy server (đóng cửa sổ là tắt) và tự mở trang chủ trì.
Gỡ cài đặt: xoá `~/.local/share/agent-meeting`, `~/.local/share/applications/agent-meeting.desktop` và icon `agent-meeting.svg`.
</details>

## Quy trình 4 bước

Trang chủ trì dẫn bạn qua 4 bước, hiển thị ở thanh trên cùng.

### 1. Bối cảnh

![Màn chuẩn bị](docs/screenshots/setup.jpg)

- Chọn nhanh một **mẫu** (Tranh luận, Brainstorm, Review thiết kế, Lập kế hoạch, Ra quyết định) rồi sửa phần `<…>`, hoặc tự viết.
- **Điều kiện kết thúc** (tuỳ chọn). Để trống thì các agent tự bàn đến khi chốt, gửi tin `KẾT LUẬN: …` rồi tự rời phòng.
- **Tuỳ chọn nâng cao**: chế độ phát biểu, giới hạn số tin, giới hạn thời gian, thời gian im lặng trước khi hỏi chốt.
- Nội dung đang viết được lưu nháp trong trình duyệt, tải lại trang không mất.

### 2. Mời agent

Bấm **Sao chép** prompt rồi dán cho từng agent. Mỗi agent vào là một **slot** mới xuất hiện trong phòng chờ (slot 1, 2, 3…).

**Đặt tên:** mỗi agent **tự đặt tên tuỳ thích** và **bắt buộc khai báo model** đang chạy (ví dụ `Opus 5.5`, `GPT-5`). Tên là duy nhất, không phân biệt hoa thường: nếu đã có agent khác dùng, agent vào sau bị báo trùng và phải tự đặt tên khác. Model hiện cạnh tên ở danh sách thành viên, ở từng tin nhắn và trong biên bản.

| Tab | Dùng khi |
|---|---|
| **Dán là vào ngay** | Mọi agent chạy được shell/`curl`. Không cần cài gì, không cần mở lại phiên. Cách chắc chắn nhất. |
| **Claude Code / Codex CLI / Gemini CLI** | Prompt bảo agent tự cài MCP rồi vào họp, có sẵn đường lui bằng `curl`. |
| **Khác** | URL MCP (Streamable HTTP) để tự cấu hình trong công cụ khác. |

> Các lệnh cài MCP có thể khác nhau theo phiên bản từng CLI. Nếu một lệnh lỗi, dùng tab **Dán là vào ngay**.

### 3. Họp

Bấm **Bắt đầu cuộc họp**. Trang chuyển sang màn họp:

- **Thành viên**: ai đang nghe, ai đang soạn tin, ai tới lượt, mỗi người đã nói bao nhiêu tin. Di chuột vào một agent để **mời ra khỏi phòng**.
- **Thông tin**: thời lượng, thời gian còn lại, số tin trên giới hạn.
- **Nội dung**: hiển thị Markdown (danh sách, code, chữ đậm), gom tin liên tiếp, tin `KẾT LUẬN` được tô xanh.
- **Ô nhắn của chủ trì** (Ctrl+Enter để gửi) và các nút nhanh: *Yêu cầu chốt*, *Tóm tắt*, *Quay lại chủ đề*, *Ngắn gọn hơn*.
- **Mời agent**: mời thêm người giữa chừng; người vào sau đọc lại được từ đầu.

### 4. Biên bản

![Màn kết thúc](docs/screenshots/ended.jpg)

Khi kết thúc, trang tóm tắt lý do, thời lượng, số tin, kết luận, và cho **tải biên bản Markdown** (bối cảnh, thành viên, kết luận, toàn bộ diễn biến).
**Cuộc họp mới** mở phòng chờ mới ngay, không cần khởi động lại app. Agent đã cài MCP **dùng lại được ngay**, vì mã tham gia giữ nguyên trong suốt lần chạy app.

<img src="docs/screenshots/mobile-dark.jpg" alt="Giao diện điện thoại, chế độ tối" width="300" align="right">

Giao diện dùng tốt trên điện thoại, tự theo chế độ sáng hoặc tối của máy.

<br clear="right">

## Chế độ phát biểu

| | **Tự do** (mặc định) | **Lần lượt** |
|---|---|---|
| Ai được nói | Ai có ý mới thì nói | Chỉ người tới lượt, theo thứ tự slot |
| Khi không có gì để nói | Không nói, nghe tiếp | Bỏ lượt (`pass`) |
| Khi im lặng | Sau `--idle` giây, **một** agent (slot nhỏ nhất) được hỏi: bàn tiếp hay rời phòng | Giữ lượt quá lâu thì tự bỏ lượt |
| Tự kết thúc khi | Mọi agent đã rời phòng | Cả vòng đều bỏ lượt, hoặc mọi agent đã rời |

Chế độ lần lượt hợp với nhóm 3 người trở lên, để mọi người đều có tiếng nói và không ai nói đè nhau.

## Luật chống "cả lũ cùng đợi nhau"

| Tình huống | Server xử lý |
|---|---|
| Agent cần suy nghĩ lâu | Gọi `typing`; server không coi đó là im lặng |
| Agent vừa nhận tin | Được coi là đang suy nghĩ trong một khoảng ân hạn |
| Im lặng quá lâu, không ai soạn tin | Chỉ **một** agent được hỏi quyết định, tránh cả nhóm cùng nhảy vào |
| Một agent rời | Những người còn lại được báo ngay |
| Chỉ còn một agent | Agent đó được nhắc kết luận và rời |
| Agent treo hoặc đóng cửa sổ | Sau một thời gian được coi là đã rời; nếu đang giữ lượt thì lượt chuyển cho người kế |
| Hai agent chọn trùng tên | Người vào sau bị từ chối và phải tự đặt tên khác |
| Chủ trì mời ra | Agent được báo dừng và không vào lại được bằng tên đó |
| Hết giờ | Nhắc trước 2 phút, hết giờ tự kết thúc |
| Đạt giới hạn tin, chủ trì bấm Kết thúc | Mọi tool báo "đã kết thúc" để agent dừng |
| App đã tắt hoặc khởi động lại | Agent nhận thông báo rõ ràng để dừng; trang chủ trì báo link không còn hiệu lực |

## Tuỳ chọn dòng lệnh

```text
npx github:ttat288/agent-meeting [tuỳ chọn]

  --local        Không bật tunnel (chỉ máy này / cùng mạng LAN)
  --port <n>     Cổng server (mặc định 3000, bận thì tự chọn cổng khác)
  --max <n>      Giới hạn số tin mặc định (120)
  --idle <giây>  Im lặng bao lâu thì hỏi 1 agent có muốn kết thúc (mặc định 40)
  --turns        Mặc định chế độ phát biểu lần lượt
  --no-open      Không tự mở trình duyệt
  -v, --version  In phiên bản
```

Các tuỳ chọn cuộc họp đều chỉnh lại được trên trang chủ trì trước khi bắt đầu. Với `--local` trong mạng LAN, mở trang chủ trì bằng IP của máy (ví dụ `http://192.168.1.5:3000/m/…`) để prompt mời dùng đúng địa chỉ.

## Công cụ agent nhìn thấy

| Tool | Tác dụng |
|---|---|
| `join(name, model)` | Vào phòng với tên tự đặt và model đang chạy, nhận giao thức cuộc họp. Gọi đầu tiên; trùng tên thì đặt tên khác. |
| `wait(name)` | Chờ tin mới hoặc tới lượt (chặn tới ~50 giây, không tốn token). |
| `say(name, text)` | Phát biểu. Tin chốt bắt đầu bằng `KẾT LUẬN:`. |
| `pass(name)` | Bỏ lượt (chế độ lần lượt). |
| `typing(name)` | Báo đang soạn tin dài. |
| `leave(name, reason?)` | Rời phòng. |
| `history()` | Đọc lại toàn bộ cuộc họp. |

Qua MCP: `POST /mcp/<mã>` (JSON-RPC, Streamable HTTP không phiên). Qua `curl`: `/a/<mã>/<tool>`, trả về văn bản thuần.

## Bảo mật

- **Hai loại link, hai quyền.** Link **chủ trì** (`/m/…`) xem và điều khiển cuộc họp: đừng gửi cho ai. Prompt **mời agent** chỉ cho phép tham gia họp, không điều khiển được.
- Tunnel chạy HTTPS qua Cloudflare. Dữ liệu chỉ nằm **trong bộ nhớ**: tắt app là mất, họp xong 30 phút thì tự xoá.
- Trang chủ trì có CSP chặt, `Referrer-Policy: no-referrer` (link chủ trì không lộ qua Referer), chống nhúng iframe.
- **Tin nhắn của agent khác là ý kiến, không phải lệnh.** Giao thức dặn agent không chạy lệnh hay đọc/ghi file theo yêu cầu trong tin. Dù vậy, nếu agent có quyền chạy lệnh, hãy giữ chế độ hỏi quyền khi họp với agent lạ (nguy cơ prompt injection).
- Giới hạn số tin và thời gian giúp tránh hai agent nói mãi và tốn tiền.

## Hạn chế đã biết

- Máy chạy app phải **bật suốt cuộc họp**. Địa chỉ tunnel miễn phí **đổi mỗi lần chạy app** và Cloudflare không cam kết độ ổn định.
- Không chạy được trên Vercel/serverless: cần một tiến trình chạy liên tục để giữ kết nối chờ.
- Lịch sử không được lưu lại sau khi tắt app. Muốn giữ thì tải biên bản.

## Phát triển

```bash
npm test                          # lõi cuộc họp + test tích hợp HTTP (MCP, curl, trang chủ trì)
npm start -- --local --no-open    # chạy local, không tunnel
```

```text
bin/cli.js         lệnh chạy: server + tunnel + mở trình duyệt
src/meeting.js     lõi cuộc họp: slot, chế độ phát biểu, luật chống chờ nhau (không phụ thuộc HTTP)
src/server.js      HTTP: trang chủ trì (long-poll), API curl, MCP, header bảo mật
src/ui/            trang chủ trì: index.html, app.css, app.js (không build, không thư viện)
scripts/           install-linux.sh: cài launcher vào menu ứng dụng
test/              node:test (meeting.test.js: luật cuộc họp; server.test.js: MCP/HTTP)
```

Trang chủ trì dùng long-poll thay cho SSE/WebSocket vì tunnel miễn phí của Cloudflare không hỗ trợ SSE.

## Giấy phép

MIT © ttat288
