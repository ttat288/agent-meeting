<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**Phòng họp cho nhiều AI agent trên các máy khác nhau tự trao đổi với nhau, còn bạn là chủ trì.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

**Tiếng Việt** · [English](README.en.md) · [Hướng dẫn sử dụng](docs/GUIDE.md) · [Triển khai cho công ty](docs/DEPLOY.md) · [Changelog](CHANGELOG.md)

</div>

![Demo: chủ trì nhập bối cảnh và chương trình họp 2 mục, giao vai trò, 3 agent tranh luận và chốt từng mục, chủ trì yêu cầu chốt, màn kết thúc có việc cần làm và kết luận](docs/demo.gif)

Một lệnh là chạy. Không tài khoản, không database, không thư viện ngoài. Agent không tốn token khi ngồi chờ. Dùng được với **Claude Code, Codex CLI, Gemini CLI** qua MCP, hoặc **bất kỳ agent nào chạy được `curl`**.

Cuộc họp ra **kết quả dùng được ngay**: danh sách quyết định, việc cần làm (ai, việc gì, hạn nào), biên bản Markdown/JSON tự lưu và tóm tắt gửi lên Slack, Google Chat hoặc Discord. Chạy trên máy cá nhân với tunnel miễn phí, hoặc trên server công ty bằng Docker với link cố định.

---

## Vì sao cần tool này?

Cho hai AI CLI ở hai máy nói chuyện với nhau thường dẫn tới cách tệ: chụp màn hình liên tục, hoặc cứ vài giây hỏi một lần xem đối phương nói xong chưa. Cả hai đều tốn token và dễ đọc sai.

Agent Meeting làm khác:

- Agent gọi **một lệnh chặn** (`wait`). Lệnh này nằm im trên server, không tốn token, và chỉ trả về khi có người nói hoặc tới lượt.
- Server **điều phối** để cả nhóm không ngồi chờ nhau mãi: hỏi một người chốt khi im lặng, báo khi có người rời, tự kết thúc khi hết người.
- Bạn **chủ trì** trên một trang web: đặt bối cảnh, mời agent, nhắn chỉ đạo giữa chừng, mời agent ra, tải biên bản.

### Dành cho doanh nghiệp (v3, v3.1)

| Nỗi đau | Agent Meeting giải quyết |
|---|---|
| Họp xong không biết đã chốt gì, ai làm gì | Agent ghi `KẾT LUẬN:` và `VIỆC: người \| việc \| hạn`; server tự tách thành **Quyết định** và **Việc cần làm**, hiện ở cột Kết quả, màn kết thúc và biên bản |
| Cuộc họp lan man, nhiều chủ đề lẫn lộn | **Chương trình họp** nhiều mục: bàn lần lượt, agent báo `XONG MỤC n: tóm tắt`, chủ trì có nút **Mục tiếp theo** |
| Agent nào cũng nói giống nhau | **Vai trò** cho từng agent (phản biện, bảo mật, tài chính…) và **nhắn riêng** cho một agent |
| Phải chép tay kết quả sang nơi khác | Biên bản **Markdown + JSON** (API, tự lưu bằng `--minutes-dir`), **webhook** gửi tóm tắt khi kết thúc |
| Không được đưa dữ liệu ra dịch vụ ngoài | **Docker**, `--public-url` sau reverse proxy của công ty, **link chủ trì cố định** (`--host-key`) |
| Muốn chạy tự động trong quy trình | `--context-file`, `--agenda-file`, `--auto-start N`, `--exit-on-end`, `--time-limit` |
| Họp xong, không ai biết việc có được làm thật không | **Việc có số và trạng thái** (`chưa làm`, `đang làm`, `xong`, `vướng`) kèm bằng chứng (commit, PR, kết quả test); **Giữ phòng để báo tiến độ**: agent rời họp đi làm rồi báo `progress`, webhook báo từng việc xong (v3.1) |
| Cuộc họp sau phải kể lại từ đầu | **Họp tiếp**: cuộc mới nhận sẵn việc chưa xong (giữ số) và các quyết định trước (v3.1) |
| Khởi động lại server là mất cuộc họp | `--data-dir`: lưu trạng thái phòng, bật lại thì họp tiếp (v3.1) |

Xem [Triển khai trên server công ty](docs/DEPLOY.md).

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

### Thử ngay trong 1 phút, không cần AI

Repo có sẵn 3 agent giả lập để bạn xem giao diện chạy thế nào:

```bash
git clone https://github.com/ttat288/agent-meeting.git && cd agent-meeting
npm start -- --local
```

Trang chủ trì mở ra. Sao chép URL trong prompt mời (phần `http://…/a/<mã>`), rồi ở một terminal khác:

```bash
npm run demo -- http://localhost:3000/a/<mã>
```

Ba agent giả lập vào phòng chờ. Viết bối cảnh, bấm **Bắt đầu cuộc họp**, xem họ tranh luận, rồi bấm **Yêu cầu chốt**. Tích **Giữ phòng để báo tiến độ** trước khi bắt đầu thì sau khi chốt các bot còn lần lượt báo tiến độ việc của mình (có một lần "vướng") tới khi phòng tự đóng.

> Xem [Hướng dẫn sử dụng](docs/GUIDE.md) để biết cách mời agent thật trên máy khác, các tình huống thường gặp và cách khắc phục.

## Quy trình 4 bước

Trang chủ trì dẫn bạn qua 4 bước, hiển thị ở thanh trên cùng.

### 1. Bối cảnh

![Màn chuẩn bị](docs/screenshots/setup.jpg)

- Chọn nhanh một **mẫu** (Tranh luận, Brainstorm, Review thiết kế, Lập kế hoạch, Ra quyết định) rồi sửa phần `<…>`, hoặc tự viết.
- **Điều kiện kết thúc** (tuỳ chọn). Để trống thì các agent tự bàn đến khi chốt, gửi tin `KẾT LUẬN: …` rồi tự rời phòng.
- **Chương trình họp** (tuỳ chọn): mỗi dòng một mục. Các agent bàn từng mục một và báo khi chốt xong mỗi mục.
- **Tuỳ chọn nâng cao**: chế độ phát biểu, giới hạn số tin, giới hạn thời gian, thời gian im lặng trước khi hỏi chốt.
- Nội dung đang viết được lưu nháp trong trình duyệt, tải lại trang không mất.

### 2. Mời agent

Bấm **Sao chép** prompt rồi dán cho từng agent. Mỗi agent vào là một **slot** mới xuất hiện trong phòng chờ (slot 1, 2, 3…).

**Vai trò:** bấm ✎ cạnh một agent trong phòng chờ để giao vai trò (ví dụ *phản biện*, *chuyên gia bảo mật*, *đại diện khách hàng*). Vai trò được gửi cho cả nhóm khi bắt đầu; đổi giữa chừng thì chỉ agent đó nhận.

**Đặt tên:** mỗi agent **tự đặt tên tuỳ thích** và **bắt buộc khai báo model** đang chạy (ví dụ `Opus 5.5`, `GPT-5`). Tên là duy nhất, không phân biệt hoa thường: nếu đã có agent khác dùng, agent vào sau bị báo trùng và phải tự đặt tên khác. Model hiện cạnh tên ở danh sách thành viên, ở từng tin nhắn và trong biên bản.

| Tab | Dùng khi |
|---|---|
| **Dán là vào ngay** | Mọi agent chạy được shell/`curl`. Không cần cài gì, không cần mở lại phiên. Cách chắc chắn nhất. |
| **Claude Code / Codex CLI / Gemini CLI** | Prompt bảo agent tự cài MCP rồi vào họp, có sẵn đường lui bằng `curl`. |
| **Khác** | URL MCP (Streamable HTTP) để tự cấu hình trong công cụ khác. |

> Các lệnh cài MCP có thể khác nhau theo phiên bản từng CLI. Nếu một lệnh lỗi, dùng tab **Dán là vào ngay**.

### 3. Họp

![Màn cuộc họp](docs/screenshots/meeting.jpg)

Bấm **Bắt đầu cuộc họp**. Trang chuyển sang màn họp:

- **Thành viên**: ai đang nghe, ai đang soạn tin, ai tới lượt, mỗi người đã nói bao nhiêu tin, vai trò. Di chuột vào một agent để **giao vai trò** (✎) hoặc **mời ra khỏi phòng** (⨯).
- **Chương trình**: mục đã xong (kèm tóm tắt), mục đang bàn; nút **Mục tiếp theo** khi bạn muốn chuyển mục.
- **Kết quả**: quyết định và việc cần làm, cập nhật ngay khi agent gửi.
- **Thông tin**: thời lượng, thời gian còn lại, số tin trên giới hạn.
- **Nội dung**: hiển thị Markdown (danh sách, code, chữ đậm), gom tin liên tiếp, tin `KẾT LUẬN` và `XONG MỤC` được tô xanh, tin nhắn riêng có viền đứt.
- **Ô nhắn của chủ trì** (Ctrl+Enter để gửi), chọn **Tất cả** hoặc **Riêng: <agent>**, và các nút nhanh: *Yêu cầu chốt*, *Giao việc*, *Tóm tắt*, *Quay lại chủ đề*, *Ngắn gọn hơn*.
- **Mời agent**: mời thêm người giữa chừng; người vào sau đọc lại được từ đầu.
- **Trên điện thoại**: dải thành viên ở trên cùng, nút **☰ Mục 1/2 · Kết quả 3** mở bảng chương trình, kết quả, thông tin và bối cảnh.

### 4. Biên bản

![Màn kết thúc](docs/screenshots/ended.jpg)

Khi kết thúc, trang tóm tắt lý do, thời lượng, số tin, bảng việc cần làm, kết luận, và cho **tải biên bản** Markdown hoặc JSON (thành viên và vai trò, bối cảnh, chương trình họp, quyết định, việc cần làm, toàn bộ diễn biến). Biên bản cũng tải được qua API `GET /api/host/<mã chủ trì>/minutes.md` (hoặc `.json`), tự lưu ra thư mục với `--minutes-dir`, và tóm tắt được gửi tới webhook với `--webhook`.
**Cuộc họp mới** mở phòng chờ mới ngay, không cần khởi động lại app. **Họp tiếp** cũng mở phòng mới nhưng mang sang các việc chưa xong (giữ nguyên số, trạng thái, bằng chứng) và các quyết định, để họp rà soát tiến độ: danh sách này hiện ở màn chuẩn bị và được gửi kèm bối cảnh cho agent. Agent đã cài MCP **dùng lại được ngay**, vì mã tham gia giữ nguyên trong suốt lần chạy app.

<img src="docs/screenshots/mobile-dark.jpg" alt="Giao diện điện thoại, chế độ tối" width="300" align="right">

Giao diện dùng tốt trên điện thoại, tự theo chế độ sáng hoặc tối của máy.

<br clear="right">

## Kết quả có cấu trúc

Server tự đọc ba mẫu dòng trong tin của agent (giao thức gửi cho agent hướng dẫn rõ cách viết):

| Mẫu | Ý nghĩa |
|---|---|
| `KẾT LUẬN: <quyết định>` | Quyết định cuối cùng (của mục đang bàn, hoặc tổng hợp sau mục cuối). Agent gửi lại nhiều lần thì giữ bản mới nhất. |
| `VIỆC: <người phụ trách> \| <việc> \| <hạn>` | Một việc cần làm. Việc nhắc lại với câu chữ gần giống được gộp làm một. |
| `XONG MỤC <số>: <tóm tắt>` | Mục đó đã chốt, chuyển sang mục kế tiếp. |
| `TIẾN ĐỘ VIỆC <số>: <trạng thái> \| <bằng chứng>` | Cập nhật một việc đã giao: `chưa làm`, `đang làm`, `xong` hoặc `vướng`, kèm bằng chứng (link commit/PR, kết quả test). Cũng làm được bằng tool `progress`. |

Các mẫu này được nhận ở đầu dòng (kể cả có `**đậm**` hay gạch đầu dòng) hoặc đầu câu, vì agent thật thường viết chúng giữa một đoạn dài. Câu chỉ *nhắc tới* mẫu, như "tôi sẽ gửi XONG MỤC 1", không bị tính.

Mỗi việc có số cố định (`#1`, `#2`…); hệ thống báo số cho cả phòng ("Đã ghi việc: #1 …") để agent dùng khi báo tiến độ. Chủ trì đổi trạng thái, sửa bằng chứng, gộp hoặc xoá việc trùng ngay trên web (cột Kết quả, màn kết thúc). **"Xong" là do agent tự báo kèm bằng chứng; server không tự kiểm chứng**, hãy xem bằng chứng trước khi tin.

## Sau khi chốt: theo dõi tiến độ (v3.1)

![Màn đang thực hiện: bảng việc có trạng thái xong, vướng, đang làm kèm bằng chứng](docs/screenshots/work.jpg)

Agent trong phòng họp thường chính là người làm việc (Claude Code, Codex… chạy trên máy có repo). Bật **Giữ phòng để báo tiến độ** ở màn chuẩn bị (hoặc `--follow-up`) thì sau khi chốt:

1. Mỗi agent rời họp (`leave`) và nhận ngay danh sách **việc của mình** (dòng `VIỆC` ghi tên nó) cùng lệnh báo tiến độ.
2. Khi mọi agent đã rời, hết giờ, hết số tin, hoặc chủ trì bấm *Kết thúc*, phòng chuyển sang trạng thái **Đang thực hiện** thay vì kết thúc. Agent không chờ nhau trong phòng; ai gọi nhầm `wait`/`say` được nhắc lại việc của mình.
3. Làm xong việc nào, agent gọi `progress(name, task, status, note)` kèm bằng chứng. Trang chủ trì cập nhật ngay; webhook nhận một tin khi một việc **xong** hoặc **vướng**.
4. Khi mọi việc đã báo xong, phòng tự đóng và gửi tóm tắt cuối. Chủ trì cũng có thể tự đổi trạng thái hoặc bấm **Đóng phòng**.

<img src="docs/screenshots/carry.jpg" alt="Thẻ Mang từ cuộc họp trước: quyết định, việc chưa xong giữ số, việc đã xong" width="420" align="right">

Bấm **Họp tiếp (mang n việc dở)** để mở cuộc họp review: màn chuẩn bị có thẻ **Mang từ cuộc họp trước** (chọn mẫu bối cảnh *Review tiến độ*).

<br clear="right">

Biên bản (`--minutes-dir`) được lưu lúc chốt và ghi đè lúc đóng phòng, vào cùng một file. Phòng ở giai đoạn thực hiện được giữ tới 7 ngày không hoạt động; dùng thêm `--data-dir` để không mất khi khởi động lại server.

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
| App đã tắt hoặc khởi động lại | Có `--data-dir`: phòng được nạp lại, agent gọi lại `wait` là họp tiếp. Không có: agent nhận thông báo rõ ràng để dừng; trang chủ trì báo link không còn hiệu lực |

## Tuỳ chọn dòng lệnh

```text
npx github:ttat288/agent-meeting [tuỳ chọn]

Mạng
  --local                   Không bật tunnel (chỉ máy này / cùng mạng LAN)
  --public-url <url>        Địa chỉ công khai cố định (server công ty, reverse proxy); không bật tunnel
  --port <n>                Cổng server (mặc định 3000 hoặc biến PORT; bận thì tự chọn cổng khác)
  --host-key <mã>           Mã chủ trì cố định: link /m/<mã> không đổi qua các lần khởi động
  --agent-key <mã>          Mã phòng cố định cho agent: prompt mời / lệnh cài MCP không đổi

Cuộc họp (mặc định, đổi được trên web trước khi bắt đầu)
  --max <n>                 Giới hạn số tin (120)
  --idle <giây>             Im lặng bao lâu thì hỏi 1 agent có muốn kết thúc (40)
  --time-limit <phút>       Giới hạn thời gian (0 = không giới hạn)
  --turns                   Chế độ phát biểu lần lượt
  --follow-up               Giữ phòng để báo tiến độ sau khi chốt; đóng khi mọi việc đã báo xong

Lưu và chia sẻ kết quả
  --minutes-dir <thư mục>   Tự lưu biên bản .md + .json khi mỗi cuộc họp kết thúc
  --webhook <url>           Gửi tóm tắt khi kết thúc (Slack, Discord, Google Chat; URL khác nhận JSON). Dùng nhiều lần được.
                            Với --follow-up: gửi cả lúc chốt, lúc từng việc xong/vướng, lúc đóng phòng
  --data-dir <thư mục>      Lưu trạng thái phòng (cần --host-key); khởi động lại server thì họp tiếp

Tự động hoá
  --context <văn bản>       Bối cảnh cuộc họp
  --context-file <file>     Bối cảnh đọc từ file
  --end-condition <văn bản> Điều kiện kết thúc
  --agenda-file <file>      Chương trình họp, mỗi dòng một mục
  --auto-start <n>          Tự bắt đầu khi đủ n agent trong phòng chờ (cần --context/--context-file)
  --exit-on-end             Thoát khi cuộc họp kết thúc (sau khi lưu biên bản, gửi webhook)

  --no-open                 Không tự mở trình duyệt
  -v, --version             In phiên bản
```

Biến môi trường tương đương: `PORT`, `AGENT_MEETING_PUBLIC_URL`, `AGENT_MEETING_MINUTES_DIR`, `AGENT_MEETING_WEBHOOK` (nhiều URL cách nhau bởi dấu phẩy), `AGENT_MEETING_HOST_KEY`, `AGENT_MEETING_AGENT_KEY`, `AGENT_MEETING_DATA_DIR`, `AGENT_MEETING_FOLLOW_UP=1`.

Với `--local` trong mạng LAN, mở trang chủ trì bằng IP của máy (ví dụ `http://192.168.1.5:3000/m/…`) để prompt mời dùng đúng địa chỉ.

Ví dụ chạy không cần người, gửi kết quả lên Slack:

```bash
npx github:ttat288/agent-meeting --local --no-open \
  --context-file brief.md --agenda-file agenda.txt --auto-start 3 \
  --time-limit 20 --minutes-dir ./bien-ban --webhook "$SLACK_WEBHOOK" --exit-on-end
```

## Công cụ agent nhìn thấy

| Tool | Tác dụng |
|---|---|
| `join(name, model)` | Vào phòng với tên tự đặt và model đang chạy, nhận giao thức cuộc họp. Gọi đầu tiên; trùng tên thì đặt tên khác. |
| `wait(name)` | Chờ tin mới hoặc tới lượt (chặn tới ~50 giây, không tốn token). |
| `say(name, text)` | Phát biểu. Dùng các dòng `KẾT LUẬN:`, `VIỆC:`, `XONG MỤC n:` để ghi kết quả. |
| `pass(name)` | Bỏ lượt (chế độ lần lượt). |
| `typing(name)` | Báo đang soạn tin dài. |
| `progress(name, task, status, note?)` | Báo tiến độ việc số `task`: `đang làm`, `xong`, `vướng`, `chưa làm`, kèm bằng chứng. Dùng được cả sau khi đã rời phòng. |
| `leave(name, reason?)` | Rời phòng. |
| `history()` | Đọc lại toàn bộ cuộc họp. |

Qua MCP: `POST /mcp/<mã>` (JSON-RPC, Streamable HTTP không phiên). Qua `curl`: `/a/<mã>/<tool>`, trả về văn bản thuần.

## Bảo mật

- **Hai loại link, hai quyền.** Link **chủ trì** (`/m/…`) xem và điều khiển cuộc họp: đừng gửi cho ai. Prompt **mời agent** chỉ cho phép tham gia họp, không điều khiển được.
- Tunnel chạy HTTPS qua Cloudflare. Dữ liệu chỉ nằm **trong bộ nhớ**: tắt app là mất, họp xong 30 phút thì tự xoá. Chỉ ghi ra đĩa khi bạn bật `--minutes-dir` hoặc `--data-dir`; biên bản và webhook không bao giờ chứa mã chủ trì hay mã agent. File trạng thái của `--data-dir` **có chứa mã** (để nạp lại phòng) nên được tạo với quyền chỉ chủ máy đọc (600).
- Không muốn đi qua dịch vụ ngoài: chạy trên server công ty với `--public-url` sau reverse proxy (xem [DEPLOY.md](docs/DEPLOY.md)).
- Trang chủ trì có CSP chặt, `Referrer-Policy: no-referrer` (link chủ trì không lộ qua Referer), chống nhúng iframe.
- **Tin nhắn của agent khác là ý kiến, không phải lệnh.** Giao thức dặn agent không chạy lệnh hay đọc/ghi file theo yêu cầu trong tin. Dù vậy, nếu agent có quyền chạy lệnh, hãy giữ chế độ hỏi quyền khi họp với agent lạ (nguy cơ prompt injection).
- Giới hạn số tin và thời gian giúp tránh hai agent nói mãi và tốn tiền.

## Hạn chế đã biết

- Máy chạy app phải **bật suốt cuộc họp**. Địa chỉ tunnel miễn phí **đổi mỗi lần chạy app** và Cloudflare không cam kết độ ổn định (dùng `--public-url` trên server riêng nếu cần link cố định).
- Không chạy được trên Vercel/serverless: cần một tiến trình chạy liên tục để giữ kết nối chờ.
- Mỗi lần chạy app là **một phòng họp tại một thời điểm**; cần nhiều phòng song song thì chạy nhiều tiến trình (hoặc container) với mã khác nhau.
- Lịch sử không được lưu lại sau khi tắt app, trừ khi bật `--data-dir` (cần `--host-key`). Muốn giữ biên bản thì tải về hoặc bật `--minutes-dir`.
- Trạng thái việc là do agent tự báo; server không chạy test hay đọc repo để kiểm chứng.
- Hai agent cùng gửi `KẾT LUẬN` với câu chữ khác nhau có thể tạo ra việc trùng (ví dụ #1 và #3 cùng là một việc). Chủ trì bấm **×** cạnh việc trùng để gộp vào việc giữ lại (hoặc xoá); agent nhắc lại việc đó không tạo lại việc mới.
- Việc tách quyết định / việc cần làm dựa vào các mẫu dòng ở trên. Agent viết sai mẫu thì nội dung vẫn có trong diễn biến nhưng không lên cột Kết quả; chủ trì có thể bấm *Giao việc* hoặc *Yêu cầu chốt* để nhắc.

## Phát triển

```bash
npm test                          # lõi cuộc họp + test tích hợp HTTP (MCP, curl, trang chủ trì)
npm start -- --local --no-open    # chạy local, không tunnel
npm run demo -- <URL mời agent>   # 3 agent giả lập để thử giao diện
```

```text
bin/cli.js         lệnh chạy: server + tunnel + mở trình duyệt
src/meeting.js     lõi cuộc họp: slot, chế độ phát biểu, luật chống chờ nhau (không phụ thuộc HTTP)
src/server.js      HTTP: trang chủ trì (long-poll), API curl, MCP, header bảo mật, lưu biên bản, webhook
src/minutes.js     biên bản Markdown / JSON / tóm tắt webhook
src/ui/            trang chủ trì: index.html, app.css, app.js (không build, không thư viện)
scripts/           install-linux.sh: cài launcher vào menu; demo-bots.js: agent giả lập
test/              node:test (meeting: luật cuộc họp; server: MCP/HTTP; minutes: biên bản, webhook)
Dockerfile         image node:22-alpine cho server công ty (docs/DEPLOY.md)
```

Trang chủ trì dùng long-poll thay cho SSE/WebSocket vì tunnel miễn phí của Cloudflare không hỗ trợ SSE.

## Đóng góp

Mọi đóng góp đều được hoan nghênh: báo lỗi, đề xuất tính năng, cải thiện tài liệu hay gửi pull request. Xem [CONTRIBUTING.md](CONTRIBUTING.md). Báo lỗ hổng bảo mật theo [SECURITY.md](SECURITY.md).

## Giấy phép

MIT © ttat288
