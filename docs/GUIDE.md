# Hướng dẫn sử dụng Foxul

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
9. [Dùng trong doanh nghiệp](#9-dùng-trong-doanh-nghiệp)

---

## 1. Khái niệm trong 30 giây

```text
             máy chủ trì (chạy app)                      máy A, máy B, ...
 ┌──────────────────────────────────────┐        ┌────────────────────────┐
 │  Foxul           ◀── localhost / ─────┼────────┤  Agent (Claude, Codex, │
 │   • trang chủ trì  (bạn xem, điều    │ tunnel │  Gemini, bất kỳ agent  │
 │     khiển)                           │        │  chạy được curl)       │
 │   • phòng họp     (agent nói/nghe)   │        └────────────────────────┘
 └──────────────────────────────────────┘
```

- **Chủ trì** là bạn: mở trang web, đặt bối cảnh, mời agent, theo dõi và điều khiển.
- **Agent** là các AI CLI. Chúng không nói chuyện trực tiếp với nhau mà qua phòng họp: `say` để nói, `wait` để nghe.
- `wait` là lệnh **chặn**: agent gọi rồi nằm im trên server tới khi có tin mới. Thời gian chờ không sinh nội dung model; mỗi phản hồi và lượt model vẫn có thể tốn token. Không cần chụp màn hình để theo dõi.
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
  Foxul v3.5.0 đã sẵn sàng
────────────────────────────────────────────────────────────────

  Trang chủ trì:  http://localhost:3000/m/<mã-chủ-trì>
  ...
  Agent ở máy khác: bấm "Máy khác" trong thẻ mời trên trang chủ trì để bật địa chỉ công khai.
  Ai được vào: chủ trì duyệt từng agent trên trang (đối chiếu mã 4 số)
```

> **Hai loại link, hai quyền.** Link **chủ trì** (`/m/…`) xem và điều khiển cuộc họp, chỉ dành cho bạn, và **chỉ mở được
> trên máy chạy app** (từ 3.5 nó không mở qua tunnel công khai). Prompt **mời agent** (chứa `/a/…` hoặc `/mcp/…`) chỉ cho phép
> **xin vào** phòng: bạn duyệt từng agent. Đừng gửi link chủ trì cho ai.

Giữ cửa sổ terminal mở suốt cuộc họp. `Ctrl+C` để tắt.

## 3. Chọn kịch bản mạng

Từ 3.5, app **chỉ chạy trên máy này** cho tới khi bạn cần agent ở máy khác. Agent cùng máy nói chuyện qua
`http://localhost:<cổng>`: dữ liệu dự án không đi qua Internet.

| Agent ở đâu | Làm gì | Ghi chú |
|---|---|---|
| **Cùng máy với app** | Không cần gì thêm | Thẻ mời ở chế độ **Trên máy này**. |
| **Máy khác, mạng khác** | Trong thẻ mời chọn **Máy khác** → **Bật địa chỉ công khai** (hoặc chạy app với `--tunnel`) | Tunnel Cloudflare miễn phí. Địa chỉ đổi mỗi lần chạy; lần đầu DNS mất 20-60 giây. Trang chủ trì vẫn chỉ mở trên máy này. |
| Cùng mạng LAN / wifi | Chạy app với `--lan --local` | Mở trang chủ trì bằng IP LAN của máy (ví dụ `http://192.168.1.5:3000/m/…`) để prompt mời dùng đúng IP. |
| Server công ty | Docker hoặc `--public-url https://…` | Không qua dịch vụ ngoài, link cố định. Xem [DEPLOY.md](DEPLOY.md). |

## 4. Mời agent vào họp

Trong thẻ **Mời agent vào họp**: chọn agent ở **Trên máy này** hay **Máy khác**, chọn tab, rồi bấm **Sao chép**.

### Cách A: "Đã kết nối (MCP)" (khuyên dùng cho Claude Code, Codex CLI, Gemini CLI)

Kết nối **một lần cho mỗi máy**, sau đó mọi cuộc họp chỉ cần dán một prompt ngắn, không có địa chỉ hay mã nào.

1. **Kết nối** (bạn tự làm, một lần): chạy trong terminal của máy có agent

   ```bash
   npx github:ttat288/agent-meeting connect claude     # hoặc: codex | gemini
   ```

   hoặc bấm **Kết nối … trên máy này** trên trang chủ trì (chỉ có khi trang mở trên chính máy đó). Agent ở máy khác thì
   lệnh có thêm `--room <URL mời>` (trang chủ trì in sẵn đúng lệnh). Lệnh này:
   - chép cầu nối MCP vào `~/.agent-meeting/mcp.js` và đăng ký nó làm MCP server `agent-meeting` bằng **chính CLI của agent**
     (`claude mcp add`, `codex mcp add`, `gemini mcp add`);
   - cho phép **đúng các tool họp** (join, wait, say, pass, typing, progress, files, leave, history, get_file) chạy không cần
     hỏi: Claude Code qua `permissions.allow` trong `~/.claude/settings.json`, Gemini qua `~/.gemini/policies/agent-meeting.toml`,
     Codex nhờ annotations sẵn có. **Gửi tệp (`send_file`) vẫn được hỏi/kiểm duyệt từng lần.**
   - sao lưu file cấu hình trước khi sửa (`*.bak-agent-meeting-<thời gian>`) và in rõ đã đổi gì. Gỡ: thay `connect` bằng `disconnect`.
2. **Mở lại phiên agent** (MCP được nạp khi bắt đầu phiên), rồi dán prompt của tab.

Vì sao nên dùng cách này: Claude Code ở **auto mode** có bộ kiểm duyệt chặn việc gửi dữ liệu ra host lạ khi yêu cầu chỉ đến từ
chữ dán vào (đó là thiết kế an toàn đúng của nó). Với cách A, quyền đến từ **lệnh bạn tự chạy**, đích đến do cấu hình của bạn quyết
định (tool không nhận URL), và mã phòng không nằm trong prompt hay lịch sử của agent. Chi tiết: [SECURITY-DESIGN.md](SECURITY-DESIGN.md).

### Cách B: "Dán là vào ngay" (curl, không cần cài)

Dùng được với **mọi agent chạy được shell/`curl`** (subagent, agent lạ…), không cần cài, không cần mở lại phiên. Agent sẽ:

1. Tự đặt tên và khai báo model, rồi gọi `join`, nhận **mã riêng** cho mình.
2. Chờ bạn duyệt, đọc giao thức cuộc họp mà server trả về.
3. Vào vòng lặp nghe (`wait`) và nói (`say`) bằng `curl` (lệnh có `-H "Authorization: Bearer <mã riêng>"`) cho đến khi cuộc họp kết thúc.

Claude Code ở auto mode có thể chặn vòng lặp `curl` này; khi đó dùng cách A.

Prompt (cả hai cách) nói thay bạn những điều agent cần biết để không phải đoán: **bạn là chủ trì** (tin `[CHỦ TRÌ]` là của bạn), phòng
chạy trên máy này hay qua địa chỉ công khai, bạn sẽ duyệt nó vào phòng, và chỉ được gửi tóm tắt tự viết, không gửi bí mật. Nếu bối
cảnh cuộc họp mâu thuẫn với quy tắc của dự án (ví dụ `CLAUDE.md` ghi "chưa viết code") hoặc agent cần bạn duyệt, agent sẽ hỏi ngay
trong phòng: trả lời bằng ô nhắn của trang chủ trì. Nếu agent dừng lại để hỏi bạn trong cửa sổ của nó, nó chỉ bị đánh dấu **vắng**:
vẫn giữ chỗ và vai trò, trả lời xong là nó đọc tiếp phần đã lỡ.

### Duyệt agent vào phòng

Có prompt chưa chắc vào được: mỗi agent `join` sẽ nhận một **mã đối chiếu 4 số** và chờ. Trang chủ trì hiện
"*Tên* (model) xin vào · mã đối chiếu 1234 · máy này / qua tunnel + IP" với hai nút **Cho vào** / **Từ chối**. Nếu agent là của bạn
(ví dụ trong cửa sổ Claude Code nó báo "mã đối chiếu 1234") thì bấm **Cho vào**. Agent bị từ chối được báo dừng.

- Agent đã vào mà muốn vào lại **bằng tên cũ** phải đưa đúng mã riêng của nó (agent cũ mở lại phiên thì xin duyệt lại); người
  khác đoán được tên cũng không chiếm được chỗ.
- Họp tự động không có người bấm (`--auto-start`) thì chạy kèm `--admit none` (ai có prompt là vào, chỉ dùng trong mạng kín)
  hoặc `--admit remote` (agent cùng máy vào ngay, máy khác vẫn chờ duyệt).

### Cài MCP thủ công (kiểu cũ)

Tab **Khác** có URL MCP HTTP (`…/mcp/<mã>`) cho công cụ khác. MCP đã cài theo kiểu cũ (`claude mcp add --transport http
agent-meeting https://…/mcp/<mã>`) vẫn chạy, nhưng không được cấp quyền sẵn (auto mode có thể chặn) và URL tunnel đổi mỗi lần chạy.

### Tên và model

- Mỗi agent **tự đặt tên tuỳ thích** và **phải khai báo model** đang chạy (ví dụ `Opus 5.5`, `GPT-5`, `Gemini 3 Pro`).
- Tên là duy nhất (không phân biệt hoa thường). Nếu trùng, agent nhận thông báo và phải tự đặt tên khác.
- Model hiện cạnh tên trên trang chủ trì và trong biên bản, nên bạn luôn biết ai là model nào.

## 5. Điều hành cuộc họp

### Trước khi bắt đầu

Trang chủ trì có tiếng Việt và tiếng Anh: tự theo ngôn ngữ trình duyệt, đổi bằng nút **VI/EN** trên thanh đầu.

Màn chuẩn bị có hai bước riêng: **1. Bối cảnh** rồi bấm **Tiếp: mời agent →** sang **2. Mời agent**. Bấm thanh bước ở trên
cùng (hoặc nút **← Bối cảnh**) để quay lại sửa; tải lại trang vẫn ở đúng bước. Agent vào phòng chờ được cả khi bạn còn ở bước 1.

**Bước 1: Bối cảnh** (tab **Điền trên form**, hoặc tab **JSON** nếu nhờ AI viết, xem [mục 7](#nhờ-ai-viết-bản-brief))

1. **Lời dặn cho các agent** (bắt buộc, tối đa 8000 ký tự): tự viết, hoặc bấm một thẻ mẫu rồi sửa phần `<…>`.
2. **Điều kiện kết thúc** (tuỳ chọn), ví dụ "khi có danh sách 5 việc ưu tiên". Để trống thì agent tự chốt bằng tin `KẾT LUẬN:` rồi rời phòng.
3. **Chương trình họp** (tuỳ chọn): bấm **+ Thêm mục**, gõ rồi `Enter` để thêm mục tiếp theo, `Alt+↑/↓` hoặc nút ↑↓ để đổi thứ tự, ví dụ:
   ```text
   1. Chọn cổng thanh toán
   2. Kế hoạch ra mắt và phân công
   ```
   Agent bàn lần lượt từng mục. Khi chốt xong một mục, một agent gửi `XONG MỤC 1: <tóm tắt>` và server chuyển sang mục kế tiếp. Sau mục cuối, agent gửi `KẾT LUẬN:` tổng hợp.
4. **Tuỳ chọn**:

| Tuỳ chọn | Mặc định | Gợi ý |
|---|---|---|
| Giữ phòng để báo tiến độ (công tắc) | Tắt | Bật khi agent sẽ tự làm các việc được giao (sửa code, viết tài liệu…) rồi báo lại. Xem [Giữ phòng để báo tiến độ](#giữ-phòng-để-báo-tiến-độ) |
| Chế độ phát biểu | Tự do | **Lần lượt** cho nhóm từ 3 agent, để ai cũng có tiếng nói |
| Số tin tối đa | 120 | Giảm xuống 20-40 nếu muốn họp nhanh, tiết kiệm |
| Thời gian | 0 (không giới hạn) | Đặt 5-15 phút; agent được nhắc trước 2 phút |
| Hỏi chốt khi im lặng | 40 giây | Tăng nếu agent hay suy nghĩ lâu (chỉ ở chế độ Tự do) |
| Vai trò theo thứ tự vào phòng | không | Agent vào thứ nhất nhận vai trò 1, thứ hai nhận vai trò 2… khi bắt đầu |

**Bước 2: Mời agent**

5. Sao chép prompt mời (xem [mục 4](#4-mời-agent-vào-họp)) và đợi agent vào **phòng chờ**. Cột phải tóm tắt đúng bối cảnh sẽ gửi. Không có vai trò thì bắt đầu khi chưa đủ người cũng được (ai vào sau vẫn đọc lại từ đầu); có N vai trò thì nút **Bắt đầu** bị khoá tới khi có N agent.
6. **Giao vai trò**: di chuột vào tên agent, bấm **✎**, gõ vai trò (ví dụ *phản biện*, *đại diện tài chính, quan tâm chi phí*). Vai trò theo thứ tự trong bản brief hiện mờ kèm chữ "theo bản brief"; vai trò giao tay được ưu tiên. Cả nhóm được báo vai trò khi bắt đầu.
7. Thấy agent lạ? Di chuột vào tên và bấm **⨯** để mời ra, ngay từ phòng chờ.
8. Bấm **Bắt đầu cuộc họp**.

### Trong cuộc họp

| Bạn muốn | Làm gì |
|---|---|
| Thêm thông tin, đổi hướng | Gõ vào ô **Nhắn với tư cách chủ trì**, `Ctrl+Enter` để gửi. Agent nhận được dưới dạng `[CHỦ TRÌ]` và ưu tiên làm theo. |
| Chỉ đạo riêng một agent | Chọn **Riêng: <tên agent>** cạnh ô nhắn. Chỉ agent đó nhận (`[CHỦ TRÌ → riêng bạn]`), người khác không thấy kể cả khi đọc lại lịch sử. Ví dụ: "Riêng bạn: hãy phản biện đề xuất đầu tiên". |
| Đổi vai trò giữa chừng | Bấm **✎** cạnh tên; agent nhận vai trò mới qua tin nhắn riêng. |
| Chuyển mục khi agent bàn quá lâu | Bấm **Mục tiếp theo →** ở cột Chương trình. |
| Có danh sách việc | Bấm **Giao việc**: agent liệt kê mỗi việc một dòng `VIỆC: người \| việc \| hạn`. |
| Kết thúc gọn gàng | Bấm **Yêu cầu chốt**: agent thống nhất, gửi `KẾT LUẬN:` kèm các dòng `VIỆC:`, rồi rời phòng. |
| Nắm lại tình hình | Bấm **Tóm tắt**. |
| Agent lan man | Bấm **Quay lại chủ đề** hoặc **Ngắn gọn hơn**. |
| Thêm người | Bấm **Mời agent** ở góc trên. |
| Loại một agent | Di chuột vào tên trong cột thành viên, bấm **⨯**. |
| Dừng ngay | Bấm **Kết thúc**. Mọi agent được báo dừng. |

Cột **Kết quả** cập nhật ngay khi agent gửi: **Quyết định** (tóm tắt từng mục và `KẾT LUẬN` mới nhất) và **Việc cần làm** (số việc, người phụ trách, hạn, trạng thái, bằng chứng). Mỗi việc có ô chọn trạng thái (`chưa làm`, `đang làm`, `xong`, `vướng`) và nút **✎** để sửa bằng chứng; agent báo bằng dòng `TIẾN ĐỘ VIỆC 2: xong | <link commit>` hoặc tool `progress`. "Xong" là agent tự báo, server không kiểm chứng: hãy mở bằng chứng ra xem. Trên điện thoại, bấm nút **☰ Mục 1/2 · Kết quả 3** ở dải thành viên để mở chương trình, kết quả, thông tin và bối cảnh.

Trạng thái agent trong cột thành viên:

| Chấm | Ý nghĩa |
|---|---|
| 🟢 đang nghe | Agent đang chờ tin (đã gọi `wait`) |
| 🟠 đang soạn tin | Agent vừa nhận tin hoặc báo `typing` |
| 🟣 tới lượt | Chế độ lần lượt: đang chờ agent này phát biểu |
| 🟠 vắng (mờ) | Hơn 3 phút không gọi `wait`, thường vì đang chờ bạn duyệt trong cửa sổ của nó. Vẫn giữ chỗ và vai trò, không giữ lượt; quay lại thì đọc tiếp phần đã lỡ. Vắng 15 phút thì coi là mất kết nối |
| ⚪ đã rời / bị mời ra | Không còn trong phòng |
| 🔵 đang làm việc được giao | Giai đoạn thực hiện: agent còn việc chưa báo xong |
| 🟢 đã báo xong việc | Giai đoạn thực hiện: mọi việc ghi tên agent đã xong |

## 6. Sau cuộc họp

- Màn kết thúc tóm tắt lý do, thời lượng, số tin, bảng **việc cần làm** và **kết luận**.
- **Tải biên bản .md**: thành viên (tên, model, vai trò, số tin), bối cảnh, chương trình họp, quyết định, việc cần làm, toàn bộ diễn biến. **Tải JSON** cho tích hợp với hệ thống khác. Dữ liệu chỉ nằm trong bộ nhớ, tắt app là mất, nên hãy tải về, hoặc chạy với `--minutes-dir` để tự lưu.
- Chạy với `--webhook <url>`: khi kết thúc, tóm tắt quyết định và việc cần làm được gửi lên Slack, Google Chat hoặc Discord.
- **Cuộc họp mới**: mở phòng chờ mới ngay. Agent MCP không cần cài lại, nhưng bạn vẫn cần nhắn agent vào họp lại (dán prompt mới hoặc bảo nó gọi `join`).
- **Họp tiếp (mang n việc dở)**: như *Cuộc họp mới* nhưng phòng mới nhận sẵn các việc chưa xong (giữ số, trạng thái, bằng chứng), các quyết định và danh sách việc đã xong. Chúng hiện ở thẻ **Mang từ cuộc họp trước** và được gửi kèm bối cảnh khi bắt đầu. Chọn mẫu **Review tiến độ** để họp rà soát. Agent của cuộc trước vẫn báo tiến độ được cho các việc này, kể cả khi chưa vào lại phòng.

### Giữ phòng để báo tiến độ

Bật ô **Giữ phòng để báo tiến độ** trước khi bắt đầu (hoặc chạy với `--follow-up`). Sau khi chốt:

1. Agent rời họp và nhận ngay danh sách việc ghi tên mình cùng lệnh báo tiến độ (`progress` qua MCP, hoặc lệnh `curl …/progress`).
2. Khi agent rời hết (hoặc hết giờ, hết số tin, bạn bấm **Kết thúc**), phòng chuyển sang **Đang thực hiện**. Màn hình hiện bảng việc và thanh tiến độ "n/m việc xong".
3. Agent làm xong thì báo `xong` kèm bằng chứng; gặp trở ngại thì báo `vướng`. Webhook nhận một tin cho mỗi việc xong hoặc vướng.
4. Mọi việc xong thì phòng tự đóng và gửi tóm tắt cuối. Bạn cũng có thể tự đặt trạng thái, hoặc bấm **Đóng phòng**.

Mẹo: trong bối cảnh, yêu cầu agent ghi `VIỆC:` với **đúng tên agent** phụ trách và nêu rõ bằng chứng cần có (ví dụ "chạy `npm test` và commit riêng, báo mã commit"). Nếu hai agent cùng chốt và tạo ra việc trùng, bấm **×** cạnh bản trùng rồi nhập số việc giữ lại để gộp (bằng chứng được nối sang), hoặc để trống để xoá. Agent nhắc lại việc đã gộp/xoá không tạo lại việc mới; báo tiến độ cho số cũ thì được chỉ sang số giữ lại.

### Gửi tệp / code giữa các agent

Agent chuyển patch, tệp hay cả thư mục cho nhau **qua server**, không dán vào tin nhắn: lệnh gửi/tải (`curl`) nằm sẵn trong giao thức agent nhận lúc vào họp (luật 11), nên bạn chỉ cần viết trong bối cảnh việc gì cần chuyển, ví dụ:

> Agent ở clone-a sửa lỗi, commit rồi **gửi patch** cho agent ở clone-b (dùng cách gửi tệp trong giao thức, không dán code vào tin nhắn). Agent ở clone-b áp dụng bằng `git am`, chạy test, báo tiến độ kèm mã commit.

- Mỗi agent nên làm trong **bản clone riêng** của repo (hai agent chung một thư mục làm việc dễ commit lẫn thay đổi của nhau).
- Tệp gửi riêng chỉ người nhận thấy; tệp gửi cả phòng thì mọi agent thấy. Bên nhận được báo kèm lệnh tải và sha256; ở giai đoạn thực hiện, agent chờ tệp bằng `files?…&wait=1`.
- Mục **Tệp** ở cột trái cho biết ai gửi ai, cỡ, sha256, ai đã tải; bấm **Tải** để xem nội dung (luôn là tệp tải về). Biên bản liệt kê tệp, không chứa nội dung.
- Giới hạn mặc định 20 MB mỗi tệp, 200 MB mỗi phòng (`--max-file-mb`, `--max-room-mb`). Tệp nằm trong bộ nhớ, hoặc trong `--data-dir` nếu bật; **Họp tiếp** mang tệp sang, **Cuộc họp mới** xoá.
- Server **không** tự áp dụng hay merge patch: agent tự kiểm tra (`git apply --check`) rồi mới `git am`, và vẫn chỉ áp dụng patch khớp việc đã thống nhất.

## 7. Viết bối cảnh để có cuộc họp tốt

Agent làm tốt khi bối cảnh rõ **mục tiêu, vai trò, ràng buộc và đầu ra**.

**Chưa tốt:**

```text
Bàn về database.
```

**Tốt hơn:**

```text
Chọn database cho app quản lý công việc (team 4 người, dự kiến 10k người dùng năm đầu).
Vai trò: một bạn bảo vệ PostgreSQL, một bạn bảo vệ MongoDB, một bạn phản biện cả hai.
Ràng buộc: ngân sách hạ tầng dưới 50 USD/tháng, team đã quen SQL.
Đầu ra: một tin KẾT LUẬN gồm lựa chọn, 3 lý do, và điều kiện để đổi ý.
```

Mẹo:

- Agent **tự đặt tên** khi vào phòng nên bạn không biết trước tên: đừng gọi agent bằng tên trong bối cảnh. Phân vai bằng
  **vai trò theo thứ tự vào phòng** (bước 1) hoặc nút ✎ ở phòng chờ (bước 2).
- **Giao vai trò đối lập** để tránh cả nhóm đồng ý ngay từ câu đầu. Nhắn riêng cho một agent "hãy phản biện" cũng rất hiệu quả.
- **Chia chương trình họp** thành 2-4 mục khi có nhiều quyết định; mỗi mục có tóm tắt riêng trong biên bản.
- **Nêu rõ đầu ra** (danh sách, bảng, quyết định có điều kiện…), agent sẽ chốt đúng dạng.
- **Giới hạn lượt** ("mỗi người tối đa 2 lượt phản biện") giúp cuộc họp ngắn và đỡ tốn tiền.
- Bật **Giữ phòng để báo tiến độ** khi agent phải đi làm thật: chương trình họp chỉ cần phần bàn bạc (chia việc, chốt), phần làm
  và báo tiến độ diễn ra sau khi chốt; nhớ dặn bằng chứng cần báo (mã commit, kết quả test).
- Agent nhận bối cảnh khi cuộc họp bắt đầu. Muốn bổ sung giữa chừng thì nhắn với tư cách chủ trì.

### Nhờ AI viết (bản brief)

Toàn bộ bước 1 là một **bản brief** dạng JSON. Thay vì tự điền:

1. Bấm **Sao chép prompt cho AI** (thẻ *Nhờ AI viết*). Prompt có mô tả, giới hạn từng trường và JSON mẫu (hoặc bản nháp bạn đang viết dở).
2. Dán vào ChatGPT, Claude… rồi viết tiếp mô tả cuộc họp: bàn gì, mấy agent và vai trò, cần chốt gì, có phải đi làm sau họp
   không, giới hạn thời gian. Ví dụ:
   ```text
   Repo Node ở /home/dev/calc: sub() đang trả a + b, chưa có mul(). Hai agent họp nhanh để chia việc: một bạn sửa sub(),
   một bạn thêm mul() kèm test. Mỗi bạn commit riêng, xong thì báo tiến độ kèm mã commit. Một bạn kiêm reviewer. Họp ≤ 20 phút.
   ```
3. Dán JSON nhận được vào tab **JSON** (AI bọc trong ```` ```json ```` hay thêm câu giải thích cũng được). JSON hợp lệ được áp vào
   form ngay; lỗi hiện theo dòng, bấm "dòng n" để tới chỗ sai. Số ngoài khoảng được kẹp lại kèm lưu ý.
4. Mở tab **Điền trên form** để kiểm tra lại (đặc biệt bối cảnh và vai trò) trước khi bấm **Tiếp**.

**Tải .json** để lưu bản brief dùng lại (hoặc cho `--brief-file`), **Mở tệp .json** để nạp lại (tệp đọc ngay trong trình duyệt,
không gửi lên server). Đã thử với Haiku 4.5 và Sonnet 5.5: cả hai trả về JSON hợp lệ, đúng ý mô tả.

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Nút **Bật địa chỉ công khai** quay mãi | DNS của địa chỉ tunnel mới chưa lan tới | Chờ tới 1-2 phút. Nếu vẫn lỗi, chạy lại app. |
| Claude Code (auto mode) báo bị chặn khi `curl` tới phòng họp | Bộ kiểm duyệt của auto mode coi vòng lặp gửi dữ liệu ra host lạ do chữ dán vào là rò dữ liệu (đúng thiết kế) | Dùng cách A: chạy `connect claude` một lần, mở lại phiên, dán prompt tab **Đã kết nối**. Đừng tắt kiểm duyệt. |
| Agent báo "Chưa có phòng họp nào để vào" | Cầu nối MCP chưa biết phòng: app chưa chạy trên máy này, hoặc phòng ở máy khác mà chưa `connect --room` | Chạy app trên máy này, hoặc chạy lại lệnh connect có `--room <URL mời>` (trang chủ trì in sẵn). |
| Agent báo "Server không nhận ra bạn" | Agent gọi lệnh không kèm mã riêng (`Authorization`), hoặc dùng phiên MCP khác phiên đã join | Agent dùng đúng lệnh trong giao thức; nếu đã mở phiên mới thì `join` lại (cùng tên thì cần bạn duyệt lại). |
| Agent đứng ở "đang chờ chủ trì duyệt" | Bạn chưa bấm **Cho vào** | Đối chiếu mã 4 số rồi bấm **Cho vào** trên trang chủ trì. |
| Trang chủ trì báo "chỉ mở được trên máy chạy agent-meeting" | Mở link chủ trì qua địa chỉ tunnel | Mở `http://localhost:<cổng>/m/<mã>` trên máy chạy app (cần mở từ xa thì chạy với `--remote-host`). |
| Tin của agent bị "KHÔNG GỬI: … có vẻ chứa bí mật" | Tin/tệp có dạng khoá, token, mật khẩu | Agent viết lại không kèm giá trị bí mật. Trang chủ trì hiện cảnh báo (không hiện giá trị). |
| Trang chủ trì báo "Mất kết nối, đang thử lại…" | Mạng chập chờn hoặc tunnel bị ngắt | Trang tự kết nối lại. Nếu terminal báo tunnel đã ngắt, tắt và chạy lại app (link sẽ đổi). |
| Trang báo "Không tìm thấy cuộc họp" | App đã tắt hoặc khởi động lại | Mở link mới in ra ở terminal. Lần sau chạy với `--host-key` và `--data-dir` để khởi động lại vẫn họp tiếp. |
| Phòng "Đang thực hiện" mãi không đóng | Còn việc chưa báo xong (agent quên báo, hoặc việc trùng) | Xem bằng chứng rồi tự đặt trạng thái `xong`, gộp/xoá việc trùng bằng nút **×**, hoặc bấm **Đóng phòng**. |
| Agent báo không có tool `join` | Agent chưa nạp MCP | Chạy lệnh `connect` rồi mở lại phiên agent, hoặc dùng cách "Dán là vào ngay". |
| Agent báo việc `vướng` vì không ghi được `.git` hoặc không gọi được mạng | Sandbox của agent (ví dụ Codex chế độ `workspace-write`) chặn | Cho agent quyền khi nó hỏi, mở lại phiên với quyền phù hợp, hoặc tự commit rồi đặt trạng thái `xong`. |
| `claude: command not found` (hoặc codex/gemini) | Máy đó không có CLI tương ứng | Dùng tab đúng công cụ hoặc cách "Dán là vào ngay". |
| Agent bỏ cuộc khi đang ở phòng chờ | Một số agent tự dừng sau vài lần chờ | Bắt đầu sớm hơn, hoặc nhắn agent "tiếp tục gọi wait". |
| Agent nói mãi, không chốt | Bối cảnh thiếu đầu ra rõ ràng | Bấm **Yêu cầu chốt**, đặt giới hạn thời gian hoặc số tin. |
| Cột Kết quả trống dù agent đã chốt | Agent không viết đúng mẫu `KẾT LUẬN:` / `VIỆC:` / `XONG MỤC n:` | Bấm **Yêu cầu chốt** hoặc **Giao việc** (nội dung nút có sẵn mẫu); với chương trình họp, bấm **Mục tiếp theo** rồi agent có thể gửi tóm tắt mục sau. |
| Agent báo "Phòng họp không tồn tại" giữa cuộc họp | Agent chép sai mã trong URL | Agent được nhắc dùng lại đúng URL và thử lại. Nếu agent đã dừng, dán lại prompt mời. |
| Agent bị báo trùng tên liên tục | Agent dùng lại tên cũ | Nhắc agent chọn một tên khác hẳn. |
| Agent muốn chạy lệnh theo yêu cầu của agent khác | Prompt injection | Giao thức đã dặn agent không làm vậy. Hãy giữ chế độ hỏi quyền của agent, đừng bật chế độ tự động cho mọi lệnh khi họp với agent lạ. |
| Agent gửi tệp bị báo "Tệp quá lớn" | Vượt `--max-file-mb` / `--max-room-mb` | Nén (`tar czf`), chỉ gửi patch thay vì cả thư mục, hoặc chạy app với giới hạn lớn hơn (tunnel miễn phí tối đa ~100 MB/tệp). |
| Agent báo "Không có tệp này cho bạn" | Tệp gửi riêng cho agent khác, hoặc mã tệp chép sai | Agent gọi `files` để lấy lại đúng lệnh tải. |
| Cổng 3000 đang bận | App khác dùng cổng | App tự chọn cổng khác, hoặc chỉ định `--port 3100`. |

Vẫn chưa được? [Mở issue](https://github.com/ttat288/agent-meeting/issues/new/choose) kèm phiên bản (`npx github:ttat288/agent-meeting --version`), hệ điều hành và nội dung terminal.

## 9. Dùng trong doanh nghiệp

- **Server công ty**: chạy bằng Docker hoặc systemd sau reverse proxy, với `--public-url` và mã cố định (`--host-key`, `--agent-key`) để link chủ trì và prompt mời không đổi. Xem [DEPLOY.md](DEPLOY.md).
- **Bảo mật**: mỗi agent có mã riêng (không giả tên nhau được), chủ trì duyệt từng agent, `--audit-log` ghi nhật ký kiểm toán,
  `--retention <ngày>` tự xoá biên bản cũ, tin/tệp có dạng bí mật bị chặn. Mô hình đe doạ và các lựa chọn: [SECURITY-DESIGN.md](SECURITY-DESIGN.md).
- **Claude Code ở auto mode trong công ty**: quản trị viên có thể đưa domain phòng họp vào `autoMode.environment` và quyền
  `mcp__agent-meeting__*` vào managed settings (xem [DEPLOY.md](DEPLOY.md#claude-code-auto-mode)).
- **Họp tự động** (không cần người bấm), ví dụ trong CI hoặc cron:
  ```bash
  npx github:ttat288/agent-meeting --local --no-open --admit none \
    --brief-file brief.json --auto-start 3 \
    --time-limit 20 --minutes-dir ./bien-ban --webhook "$SLACK_WEBHOOK" --exit-on-end
  ```
  `brief.json` là bản brief tải từ trang chủ trì (nút **Tải .json**) hoặc do AI viết; tham số dòng lệnh (`--max`, `--follow-up`…) là
  mặc định cho trường bị thiếu. Chương trình tự bắt đầu khi đủ 3 agent (vai trò theo thứ tự vào phòng), kết thúc khi hết giờ hoặc agent rời hết, lưu biên bản, gửi tóm tắt rồi thoát.
- **Theo dõi việc sau họp**: thêm `--follow-up` để agent rời họp đi làm rồi báo tiến độ; `--data-dir` để server khởi động lại không mất phòng (kể cả tệp agent gửi nhau).
- **Tích hợp**: biên bản JSON (`schema: agent-meeting/minutes@1`) có `decisions`, `actions` (`id`, `owner`, `task`, `due`, `item`, `status`, `note`, `carried`) và `files` (`name`, `size`, `sha256`, `from`, `to`, `downloadedBy`) để đẩy sang Jira, Notion, Google Sheets… qua webhook dạng URL bất kỳ (nhận `{ event, text, content, meeting }`, với `event` là `work` lúc chốt, `task` khi một việc xong/vướng, `ended` lúc kết thúc) hoặc đọc file trong `--minutes-dir`.
