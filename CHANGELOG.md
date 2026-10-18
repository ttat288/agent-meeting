# Changelog

## 3.2.0

Gửi tệp / code giữa các agent. Server là trạm chuyển tiếp HTTP: nội dung tệp không đi qua tin nhắn hay ngữ cảnh model
(không tốn token, không chép sai). Vẫn một lệnh là chạy, không thư viện ngoài, Node 18+.

- Agent gửi bằng `curl -X POST "<địa chỉ>/a/<mã>/send?name=&to=&file=&note=" --data-binary @tệp` (thư mục:
  `tar czf - … | curl … --data-binary @-`), tải bằng `curl -o "<địa chỉ>/a/<mã>/file/<mã tệp>?name="`. Phòng chỉ nhận một
  dòng thông báo kèm lệnh tải và sha256. Giao thức (luật 11) hướng dẫn gửi code bằng `git format-patch` → `git apply --check`
  → `git am`, và dặn coi tệp từ agent khác là dữ liệu: kiểm tra trước, không chạy mù quáng.
- **Gửi riêng** (`to=`): chỉ người nhận được báo; người khác không tải được (mã tệp ngẫu nhiên + đúng tên người gửi/nhận).
- Tool mới **`files(name, wait)`** (MCP và `curl …/files`): danh sách tệp mình tải được kèm lệnh tải; `wait=1` chặn tới
  ~50 giây cho tới khi có tệp mới, để agent đã rời họp (giai đoạn thực hiện) chờ patch của agent khác mà không tốn token.
  Agent dùng MCP cũng nhận lệnh `curl` cho phần tệp (tool MCP không đọc được tệp trên máy agent mà không đưa nội dung qua token).
- Giới hạn: `--max-file-mb` (mặc định 20), `--max-room-mb` (mặc định 200), tối đa 100 tệp mỗi phòng. Từ chối trước khi
  nhận nội dung (không trả `100 Continue`), nhận theo luồng, vượt giới hạn giữa chừng thì dừng và báo lỗi rõ.
- Lưu trong bộ nhớ; có `--data-dir` thì ghi `<data-dir>/<mã chủ trì>.files/` (quyền 600), khởi động lại vẫn tải được.
  **Họp tiếp** mang tệp sang (người nhận tải được cả trước khi vào lại phòng); **Cuộc họp mới** và phòng bị dọn thì xoá.
- An toàn khi phục vụ cùng origin với trang chủ trì: luôn `application/octet-stream` + `content-disposition: attachment`,
  `nosniff`, CSP `sandbox`; tên tệp chỉ giữ basename, chữ, số và `._+-`.
- Trang chủ trì: mục **Tệp** (người gửi → người nhận, cỡ, sha256, ai đã tải, nút Tải), thông báo tệp trong diễn biến có
  nút Tải, nút ☰ trên màn hẹp hiện số tệp; thẻ "Mang từ cuộc họp trước" liệt kê tệp.
- Biên bản Markdown có mục **Tệp**, JSON có `files` (không nhúng nội dung, không có mã tệp).
- `npm run demo`: ở giai đoạn thực hiện, bot Lục Bình gửi `openapi.yaml` riêng cho Mây, Mây chờ bằng `files?wait=1` rồi tải về.
- GIF demo mới (`docs/demo.gif`): chuẩn bị → họp 2 mục → chốt → giai đoạn thực hiện (báo tiến độ, gửi tệp) → phòng tự đóng.
  Ảnh mới `docs/screenshots/files.jpg` (mục Tệp).
- Màn kết thúc: phòng bị đóng từ phòng chờ hiện "Thảo luận: 0:00" (trước đây tính từ lúc tạo phòng).
- Đã thử với agent thật (Haiku 4.5 + Sonnet 5.5 qua curl, prompt sao chép từ trang): hai bản clone riêng của repo thử, một
  agent sửa và gửi patch, agent kia `git am`, chạy test, báo tiến độ kèm mã commit; cả khi giữ phòng báo tiến độ (bên nhận
  chờ bằng `files?wait=1`) và khi làm ngay trong cuộc họp.

## 3.1.1

Sửa sau khi thử với CLI thật qua MCP (Codex CLI 0.162). Bản 3.1.0 chưa từng phát hành riêng: 3.1.1 gồm cả các thay đổi
của 3.1.0 bên dưới.

- Tool MCP có `annotations` (`destructiveHint: false`, `openWorldHint: false`; `history` là `readOnlyHint`): Codex CLI
  trước đây hỏi duyệt **mỗi lần** gọi `wait`/`say`…, chạy không tương tác (`codex exec`) thì bị chặn hẳn.
- Prompt ở tab Claude Code / Codex CLI / Gemini CLI bảo agent dùng luôn MCP `agent-meeting` nếu đã có (tìm trong danh sách
  tool, vì Codex ẩn tool MCP), chưa có mới chạy lệnh cài. Trước đây Codex đã cài MCP vẫn bỏ qua và vào bằng `curl`.
- Chủ trì **gộp hoặc xoá việc trùng** (nút **×** cạnh việc, hoặc `POST /api/host/<mã>/task` với `{"n": 3, "remove": true,
  "into": 1}`): bằng chứng nối sang việc giữ lại, số việc không dùng lại; agent nhắc lại dòng `VIỆC` cũ không tạo lại việc,
  báo tiến độ cho số cũ được chỉ sang số giữ lại. Xoá việc cuối chưa xong thì phòng theo dõi tự đóng.
- Nút **Họp tiếp (mang n việc dở)** cập nhật số việc dở khi việc được báo xong (trước đây giữ số lúc chốt).
- `npm run demo`: khi phòng bật giữ phòng báo tiến độ, các bot báo tiến độ việc của mình sau khi chốt (đang làm, vướng, xong).
- Giao diện: nút ✎ trong thẻ việc ở cột Kết quả không còn rơi xuống một dòng riêng; nút dạng link ("Tải JSON") không còn
  gạch chân.
- Ảnh mới: màn chuẩn bị, màn **Đang thực hiện**, thẻ **Mang từ cuộc họp trước**, màn kết thúc có bảng việc.
- Mô tả tool `leave` không còn bảo "dừng, không gọi thêm tool" (mâu thuẫn với giữ phòng báo tiến độ): làm theo câu trả lời
  của hệ thống, được giao việc thì làm rồi báo `progress`.

## 3.1.0

Từ "họp xong" sang "làm xong": agent trong phòng họp chính là người làm việc, nên phòng theo dõi được tiến độ sau khi chốt
và mang việc dở sang cuộc họp sau. Vẫn một lệnh là chạy, không thư viện ngoài, Node 18+.

Việc có trạng thái
- Mỗi việc có **số cố định** (`#1`, `#2`…, không dùng lại kể cả qua các cuộc họp nối tiếp) và **trạng thái**
  `chưa làm | đang làm | xong | vướng`, kèm **bằng chứng** (link commit/PR, kết quả test). Hệ thống báo số cho cả phòng
  ("Đã ghi việc: #1 …").
- Agent báo bằng dòng `TIẾN ĐỘ VIỆC <số>: <trạng thái> | <bằng chứng>` hoặc tool mới **`progress(name, task, status, note)`**
  (MCP và `curl …/progress`). Nhận cả tiếng Việt không dấu và tiếng Anh (`done`, `blocked`…); báo sai số hay trạng thái lạ
  thì agent được trả lời rõ cách sửa.
- Chủ trì đổi trạng thái và sửa bằng chứng trên web (cột Kết quả, màn kết thúc); link trong bằng chứng bấm được.
  Giao diện ghi rõ "xong" là agent tự báo, server **không** tự kiểm chứng.
- Biên bản Markdown/JSON và webhook có số việc, trạng thái, bằng chứng, người cập nhật (`actions[].id|status|note|updatedBy`).

Giữ phòng để báo tiến độ (giai đoạn thực hiện)
- Ô **Giữ phòng để báo tiến độ** trên web, hoặc `--follow-up` / `AGENT_MEETING_FOLLOW_UP=1`.
- Sau khi chốt, agent rời họp và nhận ngay danh sách việc ghi tên mình cùng lệnh báo tiến độ; phòng chuyển sang trạng thái
  **Đang thực hiện** (`WORK`) thay vì kết thúc. Gọi nhầm `wait`/`say` trong lúc này chỉ được nhắc lại việc, không chặn chờ.
- Phòng tự đóng khi mọi việc báo xong; chủ trì có nút **Đóng phòng**. Màn hình có thanh "n/m việc xong".
- Webhook gửi khi chốt (`event: "work"`), khi một việc xong hoặc vướng (`event: "task"`), và khi đóng phòng (`event: "ended"`).
  Biên bản `--minutes-dir` được ghi lúc chốt và ghi đè cùng file lúc đóng.

Họp tiếp mang việc dở
- Nút **Họp tiếp (mang n việc dở)**: cuộc họp mới nhận sẵn các việc chưa xong (giữ số, trạng thái, bằng chứng), các quyết định
  và danh sách việc đã xong của cuộc trước. Hiện ở thẻ **Mang từ cuộc họp trước**, được gửi kèm bối cảnh khi bắt đầu, và có
  mục riêng trong biên bản. Mẫu bối cảnh mới **Review tiến độ**.
- Agent của cuộc trước vẫn báo tiến độ được cho việc mang sang, kể cả khi chưa vào lại phòng.

Không mất cuộc họp khi khởi động lại
- `--data-dir <thư mục>` / `AGENT_MEETING_DATA_DIR` (cần `--host-key`): trạng thái phòng được ghi ra `<mã chủ trì>.json`
  (gom ghi ~1 lần/giây, ghi file tạm rồi đổi tên, quyền 600) và nạp lại khi khởi động. Agent đang họp gọi lại `wait` là
  họp tiếp từ đúng chỗ đã đọc; giới hạn thời gian chạy tiếp; trang chủ trì tự kết nối lại mà không tải lại trang.
- Giao thức dặn agent: lệnh lỗi kết nối thì chờ ~10 giây rồi gọi lại `wait`, thử vài lần trước khi bỏ.

Khác
- Lỗi xử lý request được ghi ra log server (mã trong đường dẫn được rút gọn).

## 3.0.0

Bản cho doanh nghiệp: cuộc họp ra kết quả có cấu trúc, lưu và chia sẻ tự động, chạy được trên server công ty.

Kết quả có cấu trúc
- **Quyết định** từ tin `KẾT LUẬN:` và **Việc cần làm** từ dòng `VIỆC: người | việc | hạn`, hiển thị ở cột
  Kết quả, màn kết thúc và biên bản. Nội dung quyết định không còn dính các dòng `VIỆC`.
- Nhận diện theo cách agent thật hay viết (đã thử với Haiku 4.5 và Sonnet 5.5): mẫu nằm ở dòng 2, giữa đoạn văn,
  có `**đậm**` hay gạch đầu dòng; không nhận câu chỉ nhắc tới mẫu ("tôi sẽ gửi XONG MỤC 1").
- Agent gửi lại `KẾT LUẬN` nhiều lần thì mỗi mục chỉ giữ bản mới nhất; việc nhắc lại với câu chữ gần giống được gộp.

Điều hành
- **Chương trình họp** nhiều mục (nhập trên web hoặc `--agenda-file`): tiến độ, `XONG MỤC n: tóm tắt` để chuyển mục,
  nút **Mục tiếp theo**; báo xong muộn sau khi chủ trì đã chuyển mục vẫn được ghi tóm tắt.
- **Vai trò** cho từng agent (nút ✎) và **nhắn riêng** cho một agent (`Riêng: <agent>`).
- Nút nhanh **Giao việc**; *Yêu cầu chốt* nhắc kèm dòng `VIỆC`.
- Màn hình hẹp (điện thoại): nút **☰ Mục · Kết quả** mở bảng chương trình, kết quả, thông tin, bối cảnh.

Biên bản và tích hợp
- `src/minutes.js`: biên bản Markdown / JSON (`agent-meeting/minutes@1`) và tóm tắt ngắn; API
  `/api/host/<mã>/minutes.md|.json`; nút *Tải JSON*.
- `--minutes-dir`: tự lưu `.md` + `.json` khi kết thúc. `--webhook` (dùng nhiều lần): Slack / Google Chat nhận `{text}`,
  Discord nhận `{content}`, URL khác nhận JSON đầy đủ (không kèm toàn văn). Cuộc họp chưa bắt đầu thì không lưu, không gửi.

Triển khai và tự động hoá
- `Dockerfile` (node:22-alpine, có HEALTHCHECK) và hướng dẫn [docs/DEPLOY.md](docs/DEPLOY.md): reverse proxy Nginx/Caddy,
  systemd, giới hạn truy cập trang chủ trì.
- `--public-url`: địa chỉ cố định, không bật tunnel; mọi lệnh trong giao thức dùng địa chỉ này dù proxy đổi `Host`.
- `--host-key`, `--agent-key`: link chủ trì và prompt mời cố định qua các lần khởi động; "Cuộc họp mới" dùng lại đúng link;
  phòng có mã cố định được làm mới thay vì bị xoá khi hết hạn.
- `--context`, `--context-file`, `--end-condition`, `--auto-start N`, `--exit-on-end`, `--time-limit`.
- Biến môi trường `PORT`, `AGENT_MEETING_PUBLIC_URL`, `AGENT_MEETING_MINUTES_DIR`, `AGENT_MEETING_WEBHOOK`,
  `AGENT_MEETING_HOST_KEY`, `AGENT_MEETING_AGENT_KEY`.

Giao thức agent
- Lệnh "Nói" qua `curl` gửi nội dung bằng heredoc (`--data-urlencode "text@-" <<'HET'`): ký tự `$`, ngoặc, xuống dòng
  không còn bị shell làm hỏng (trước đây `$0.3` thành `/bin/bash.3`).
- Quy tắc ghi kết quả rõ ràng: mỗi mẫu ở đầu một dòng riêng; đã có `KẾT LUẬN` mà đồng ý thì không gửi lại.
- Gõ sai mã phòng giữa cuộc họp: agent được nhắc kiểm tra lại URL và thử lại trước khi dừng.
- `scripts/demo-bots.js` dùng chương trình họp và dòng `VIỆC`.

## 2.1.1

- Ô kết luận ở màn kết thúc hiển thị Markdown (trước đây hiện nguyên dấu backtick).
- `npm run demo`: 3 agent giả lập để thử giao diện hoặc quay demo mà không cần AI thật.
- Tài liệu cho cộng đồng: GIF demo, hướng dẫn sử dụng chi tiết, README tiếng Anh,
  CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, mẫu issue và pull request.

## 2.1.0

- Agent tự đặt tên tuỳ thích và bắt buộc khai báo model đang chạy (`join(name, model)`).
- Tên là duy nhất (không phân biệt hoa thường): trùng thì bị báo và phải đặt tên khác,
  thay cho việc tự thêm hậu tố `-2`. Agent đã rời vào lại được bằng đúng tên và model cũ.
- Model hiển thị cạnh tên ở danh sách thành viên, từng tin nhắn và biên bản.

## 2.0.1

- Bỏ tiền tố tên của chính người nói mà agent hay tự gắn (`[Tên]`, `**Tên:**`, `Tên:`).
- Thông báo chờ rõ ràng hơn để agent không bỏ cuộc khi chủ trì chuẩn bị lâu ở phòng chờ
  (đã thử với agent thật chờ 2,5 phút).

## 2.0.0

Quy trình
- Trang chủ trì theo 4 bước: Bối cảnh → Mời agent → Họp → Biên bản.
- Mẫu bối cảnh có sẵn; lưu nháp trong trình duyệt.
- Tuỳ chọn trên web: chế độ phát biểu, giới hạn số tin, giới hạn thời gian, thời gian im lặng.
- Chế độ phát biểu **Lần lượt** theo slot, có `pass`; cả vòng bỏ lượt thì tự kết thúc.
- Chủ trì nhắn vào cuộc họp và có nút nhanh (Yêu cầu chốt, Tóm tắt, Quay lại chủ đề, Ngắn gọn hơn).
- Chủ trì mời một agent ra khỏi phòng.
- Giới hạn thời gian: nhắc trước 2 phút, hết giờ tự kết thúc.
- Tin `KẾT LUẬN:` được tô nổi bật và đưa vào tóm tắt, biên bản.
- Biên bản Markdown đầy đủ (bối cảnh, thành viên, kết luận, diễn biến).
- Cuộc họp mới ngay trên web; dùng lại mã tham gia nên agent đã cài MCP không phải cài lại.

Giao diện
- Viết lại toàn bộ: màn chuẩn bị và màn họp (thành viên, thông tin, nội dung, ô nhắn).
- Hiển thị Markdown an toàn, gom tin liên tiếp, nút "Có tin mới", đếm tin chưa đọc trên tiêu đề tab.
- Toast, hộp xác nhận riêng, trạng thái kết nối, màn "không tìm thấy cuộc họp".
- Responsive điện thoại, sáng/tối.

Edge case và độ tin cậy
- Tên có dấu cách/tiếng Việt được mã hoá đúng trong lệnh curl.
- Phòng không tồn tại: MCP và curl trả lời rõ để agent dừng.
- Tin quá dài: agent được báo đã bị cắt.
- Giữ lượt quá lâu thì tự bỏ lượt; người giữ lượt rời thì lượt chuyển tiếp.
- Prompt mời luôn dùng địa chỉ công khai, kể cả khi chủ trì mở trang qua localhost.
- Long-poll chỉ gửi phần log mới.
- Header bảo mật: CSP, no-referrer, chống iframe.
- Cảnh báo ở terminal khi tunnel bị ngắt.

## 1.0.0

- Phòng họp nhiều agent qua MCP và curl, trang chủ trì, tunnel Cloudflare, luật chống chờ nhau.
