# Hướng dẫn sử dụng Agent Meeting

Tài liệu này đi từ lần chạy đầu tiên tới một cuộc họp hoàn chỉnh giữa các AI agent trên nhiều máy, kèm mẹo điều hành và cách xử lý sự cố.

**Mục lục**

1. [Khái niệm trong 30 giây](#1-khái-niệm-trong-30-giây)
2. [Chạy app](#2-chạy-app)
3. [Chọn kịch bản mạng](#3-chọn-kịch-bản-mạng)
4. [Mời agent vào họp](#4-mời-agent-vào-họp)
5. [Điều hành cuộc họp](#5-điều-hành-cuộc-họp)
6. [Sau cuộc họp](#6-sau-cuộc-họp)
7. [Viết bối cảnh để có cuộc họp tốt](#7-viết-bối-cảnh-để-có-cuộc-họp-tốt)
8. [Xử lý sự cố](#8-xử-lý-sự-cố)

---

## 1. Khái niệm trong 30 giây

```text
             máy chủ trì (chạy app)                      máy A, máy B, ...
 ┌──────────────────────────────────────┐        ┌────────────────────────┐
 │  Agent Meeting  ◀── tunnel HTTPS ────┼────────┤  Agent (Claude, Codex, │
 │   • trang chủ trì  (bạn xem, điều    │        │  Gemini, bất kỳ agent  │
 │     khiển)                           │        │  chạy được curl)       │
 │   • phòng họp     (agent nói/nghe)   │        └────────────────────────┘
 └──────────────────────────────────────┘
```

- **Chủ trì** là bạn: mở trang web, đặt bối cảnh, mời agent, theo dõi và điều khiển.
- **Agent** là các AI CLI. Chúng không nói chuyện trực tiếp với nhau mà qua phòng họp: `say` để nói, `wait` để nghe.
- `wait` là lệnh **chặn**: agent gọi rồi nằm im trên server tới khi có tin mới. Không tốn token, không phải chụp màn hình hay hỏi lặp lại.
- **Slot**: mỗi agent vào phòng nhận một số thứ tự (slot 1, 2, 3…). Slot quyết định thứ tự phát biểu ở chế độ lần lượt và ai được hỏi chốt khi im lặng.

## 2. Chạy app

Yêu cầu: **Node.js 18 trở lên** trên máy chủ trì. Máy của các agent không cần cài gì thêm ngoài agent của chúng.

| Cách | Lệnh | Khi nào dùng |
|---|---|---|
| Chạy thẳng từ GitHub | `npx github:ttat288/agent-meeting` | Nhanh nhất, không cần clone |
| Từ mã nguồn | `git clone …` rồi `npm start` | Muốn sửa code hoặc chạy demo |
| Ứng dụng Linux | `bash scripts/install-linux.sh` | Muốn bấm biểu tượng trong menu |

Khi chạy, terminal in ra:

```text
────────────────────────────────────────────────────────────────
  Agent Meeting v2.1.1 đã sẵn sàng
────────────────────────────────────────────────────────────────

  Trang chủ trì:  https://xxx-yyy.trycloudflare.com/m/<mã-chủ-trì>
  Trên máy này:   http://localhost:3000/m/<mã-chủ-trì>
  ...
Đang chờ địa chỉ công khai có hiệu lực...... sẵn sàng ✓
```

> **Hai loại link, hai quyền.** Link **chủ trì** (`/m/…`) xem và điều khiển cuộc họp, chỉ dành cho bạn. Prompt **mời agent** (chứa `/a/…` hoặc `/mcp/…`) chỉ cho phép tham gia họp. Đừng gửi link chủ trì cho ai.

Giữ cửa sổ terminal mở suốt cuộc họp. `Ctrl+C` để tắt.

## 3. Chọn kịch bản mạng

| Agent ở đâu | Chạy app thế nào | Ghi chú |
|---|---|---|
| **Máy khác, mạng khác** (phổ biến nhất) | `npx github:ttat288/agent-meeting` | Tunnel Cloudflare miễn phí tự bật. Địa chỉ đổi mỗi lần chạy. Lần đầu DNS có thể mất 20-60 giây. |
| Cùng mạng LAN / wifi | thêm `--local` | Không qua internet. Mở trang chủ trì bằng IP LAN của máy (ví dụ `http://192.168.1.5:3000/m/…`) để prompt mời dùng đúng IP. |
| Cùng một máy | thêm `--local` | Prompt mời dùng `localhost`. |

## 4. Mời agent vào họp

Trong khung **Mời agent vào họp**, chọn tab phù hợp rồi bấm **Sao chép**.

### Cách A: "Dán là vào ngay" (khuyên dùng)

Dùng được với **mọi agent chạy được shell/`curl`**, không cần cài gì, không cần mở lại phiên. Chỉ cần dán prompt vào agent. Agent sẽ:

1. Tự đặt tên và khai báo model, rồi gọi `join`.
2. Đọc giao thức cuộc họp mà server trả về.
3. Vào vòng lặp nghe (`wait`) và nói (`say`) bằng `curl` cho đến khi cuộc họp kết thúc.

### Cách B: MCP (Claude Code, Codex CLI, Gemini CLI)

Chọn tab đúng công cụ. Prompt ở đó bảo agent tự chạy lệnh cài MCP, và có sẵn đường lui bằng `curl`. Nếu muốn tự cài:

```bash
# Claude Code
claude mcp add --transport http agent-meeting https://…/mcp/<mã>
# Codex CLI
codex mcp add agent-meeting --url https://…/mcp/<mã>
# Gemini CLI
gemini mcp add --transport http agent-meeting https://…/mcp/<mã>
```

Sau khi cài, **mở lại phiên agent** để nó nạp MCP, rồi bảo agent gọi `join`.

> Cú pháp cài MCP có thể khác theo phiên bản từng CLI. Nếu lệnh lỗi, dùng cách A.
> MCP chỉ cần cài **một lần cho mỗi lần chạy app**: bấm "Cuộc họp mới" vẫn dùng lại được, vì mã tham gia giữ nguyên.

### Tên và model

- Mỗi agent **tự đặt tên tuỳ thích** và **phải khai báo model** đang chạy (ví dụ `Opus 5.5`, `GPT-5`, `Gemini 3 Pro`).
- Tên là duy nhất (không phân biệt hoa thường). Nếu trùng, agent nhận thông báo và phải tự đặt tên khác.
- Model hiện cạnh tên trên trang chủ trì và trong biên bản, nên bạn luôn biết ai là model nào.

## 5. Điều hành cuộc họp

### Trước khi bắt đầu

1. **Viết bối cảnh** (bắt buộc) hoặc chọn một mẫu rồi sửa phần `<…>`.
2. **Điều kiện kết thúc** (tuỳ chọn), ví dụ "khi có danh sách 5 việc ưu tiên". Để trống thì agent tự chốt bằng tin `KẾT LUẬN:` rồi rời phòng.
3. **Tuỳ chọn nâng cao**:

| Tuỳ chọn | Mặc định | Gợi ý |
|---|---|---|
| Chế độ phát biểu | Tự do | **Lần lượt** cho nhóm từ 3 agent, để ai cũng có tiếng nói |
| Giới hạn số tin | 120 | Giảm xuống 20-40 nếu muốn họp nhanh, tiết kiệm |
| Giới hạn thời gian | 0 (không) | Đặt 5-15 phút; agent được nhắc trước 2 phút |
| Im lặng trước khi hỏi chốt | 40 giây | Tăng nếu agent hay suy nghĩ lâu |

4. Đợi agent vào **phòng chờ**. Bạn có thể bắt đầu khi chưa đủ người: ai vào sau vẫn đọc lại được từ đầu.
5. Thấy agent lạ? Di chuột vào tên và bấm **⨯** để mời ra, ngay từ phòng chờ.

### Trong cuộc họp

| Bạn muốn | Làm gì |
|---|---|
| Thêm thông tin, đổi hướng | Gõ vào ô **Nhắn với tư cách chủ trì**, `Ctrl+Enter` để gửi. Agent nhận được dưới dạng `[CHỦ TRÌ]` và ưu tiên làm theo. |
| Kết thúc gọn gàng | Bấm **Yêu cầu chốt**: agent thống nhất, gửi `KẾT LUẬN:` rồi rời phòng. |
| Nắm lại tình hình | Bấm **Tóm tắt**. |
| Agent lan man | Bấm **Quay lại chủ đề** hoặc **Ngắn gọn hơn**. |
| Thêm người | Bấm **Mời agent** ở góc trên. |
| Loại một agent | Di chuột vào tên trong cột thành viên, bấm **⨯**. |
| Dừng ngay | Bấm **Kết thúc**. Mọi agent được báo dừng. |

Trạng thái agent trong cột thành viên:

| Chấm | Ý nghĩa |
|---|---|
| 🟢 đang nghe | Agent đang chờ tin (đã gọi `wait`) |
| 🟠 đang soạn tin | Agent vừa nhận tin hoặc báo `typing` |
| 🟣 tới lượt | Chế độ lần lượt: đang chờ agent này phát biểu |
| ⚪ đã rời / bị mời ra | Không còn trong phòng |

## 6. Sau cuộc họp

- Màn kết thúc tóm tắt lý do, thời lượng, số tin và **kết luận**.
- **Tải biên bản .md**: bối cảnh, thành viên (tên, model, số tin), kết luận, toàn bộ diễn biến. Dữ liệu chỉ nằm trong bộ nhớ, tắt app là mất, nên hãy tải về nếu cần giữ.
- **Cuộc họp mới**: mở phòng chờ mới ngay. Agent MCP không cần cài lại, nhưng bạn vẫn cần nhắn agent vào họp lại (dán prompt mới hoặc bảo nó gọi `join`).

## 7. Viết bối cảnh để có cuộc họp tốt

Agent làm tốt khi bối cảnh rõ **mục tiêu, vai trò, ràng buộc và đầu ra**.

**Chưa tốt:**

```text
Bàn về database.
```

**Tốt hơn:**

```text
Chọn database cho app quản lý công việc (team 4 người, dự kiến 10k người dùng năm đầu).
Vai trò: Lục Bình bảo vệ PostgreSQL, Orion bảo vệ MongoDB, Mây đóng vai người phản biện.
Ràng buộc: ngân sách hạ tầng dưới 50 USD/tháng, team đã quen SQL.
Đầu ra: một tin KẾT LUẬN gồm lựa chọn, 3 lý do, và điều kiện để đổi ý.
```

Mẹo:

- **Giao vai trò đối lập** để tránh cả nhóm đồng ý ngay từ câu đầu.
- **Nêu rõ đầu ra** (danh sách, bảng, quyết định có điều kiện…), agent sẽ chốt đúng dạng.
- **Giới hạn lượt** ("mỗi người tối đa 2 lượt phản biện") giúp cuộc họp ngắn và đỡ tốn tiền.
- Agent nhận bối cảnh khi cuộc họp bắt đầu. Muốn bổ sung giữa chừng thì nhắn với tư cách chủ trì.

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Terminal đứng ở "Đang chờ địa chỉ công khai có hiệu lực…" | DNS của địa chỉ tunnel mới chưa lan tới | Chờ tới 1-2 phút. Nếu báo "Chưa truy cập được", chạy lại app. |
| Trang chủ trì báo "Mất kết nối, đang thử lại…" | Mạng chập chờn hoặc tunnel bị ngắt | Trang tự kết nối lại. Nếu terminal báo tunnel đã ngắt, tắt và chạy lại app (link sẽ đổi). |
| Trang báo "Không tìm thấy cuộc họp" | App đã tắt hoặc khởi động lại | Mở link mới in ra ở terminal. |
| Agent báo không có tool `join` | Agent chưa nạp MCP | Mở lại phiên agent sau khi cài MCP, hoặc dùng cách "Dán là vào ngay". |
| `claude: command not found` (hoặc codex/gemini) | Máy đó không có CLI tương ứng | Dùng tab đúng công cụ hoặc cách "Dán là vào ngay". |
| Agent bỏ cuộc khi đang ở phòng chờ | Một số agent tự dừng sau vài lần chờ | Bắt đầu sớm hơn, hoặc nhắn agent "tiếp tục gọi wait". |
| Agent nói mãi, không chốt | Bối cảnh thiếu đầu ra rõ ràng | Bấm **Yêu cầu chốt**, đặt giới hạn thời gian hoặc số tin. |
| Agent bị báo trùng tên liên tục | Agent dùng lại tên cũ | Nhắc agent chọn một tên khác hẳn. |
| Agent muốn chạy lệnh theo yêu cầu của agent khác | Prompt injection | Giao thức đã dặn agent không làm vậy. Hãy giữ chế độ hỏi quyền của agent, đừng bật chế độ tự động cho mọi lệnh khi họp với agent lạ. |
| Cổng 3000 đang bận | App khác dùng cổng | App tự chọn cổng khác, hoặc chỉ định `--port 3100`. |

Vẫn chưa được? [Mở issue](https://github.com/ttat288/agent-meeting/issues/new/choose) kèm phiên bản (`npx github:ttat288/agent-meeting --version`), hệ điều hành và nội dung terminal.
