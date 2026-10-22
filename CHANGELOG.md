# Changelog

## Unreleased — live work monitoring and revision guards

- Plan/Execute/Results follow external run updates using conditional reads. Active edits, evidence and keyboard focus defer replacement; offline results remain visible with bounded retry.
- Human chair stays the default, with optional PM controls/history in Options. PM connection errors clear on recovery without erasing action errors; terminal invitation words use POSIX quoting.
- CLI SIGINT/SIGTERM and exit-on-end drain managed work and cancellation/rollback before exiting. Closed managers reject new dispatch instead of starting work during shutdown.
- Slow verification/integration can be cancelled from Results; late completions preserve drafts opened in another view. PM updates preserve supervision focus and unsent drafts; director stop controls take priority over pending ordinary requests.
- Task forms expose saved differences from the latest older draft for read-only recovery after a requirement change; no automatic replay or merge. Malformed or unavailable browser storage falls back to current server requirements.
- Routing and execution use the freshest valid access observation across rooms sharing a catalog; a newer failed probe cannot be masked by an older room-local success. Duplicate local/shared copies appear once.
- Pending model-access probes share one active invocation per host/profile/config revision, survive admin navigation, preserve edited forms and reject stale viewed mappings. Late observations cannot replace newer configuration evidence; shutdown aborts and drains probes.
- Live renders retain profile choices within the same task/config revision. Web Run fences both viewed revisions before dispatch, including after another client probes a remapped profile.
- Source inventories preserve prototype-named files in both local and remote worker copies. Rollback preserves concurrent chmod/path replacements and records a conflict for manual reconciliation.
- Runtime and test streams retain Vietnamese/emoji across UTF-8 chunks and bounded report/log truncation.
- Runtime evidence keeps negative costs and ambiguous multiple-model identity unknown; agy SUCCESS with denied_actions is a permission failure with an actionable diagnostic. Team checkpoint/swap/activation and completion reports check Git HEAD as well as file snapshots.
- Reproducible local HTTP benchmark publishes raw samples, polling overhead and failure cases. Direct model pilot failed OAuth authentication; model efficacy, billing and eight-hour runtime remain unverified.

## Unreleased — PM operator

- Checkpoints accept an optional structured continuation delta for failed attempts and blockers. Omitted records remain unknown; the local canonical carry experiment checks revisions/source/WIP and measures transport overhead without enabling a controller or making model-cost claims.

- Workspace chưa release: PM chờ sự kiện bằng client code; lead capability riêng, plan/readiness approval và same-slot managed swap có checkpoint/ACK/process lifecycle. Một task/slot A, Linux/bwrap, tích hợp một file; fixture có evidence, chưa nghiệm thu model thật/UI team hoặc chi phí.

- Choose human or agent chair; dedicated local PM invitation/confirmation and private director channel.
- Scoped goal/grant and canonical task/run lifecycle through independent verification, single-file integration and evidence report; pause/revoke/takeover and stale goal/lease guards.
- No automatic model launch or spend; real-model UX, usage and billing comparison remain unverified.
- Optional PM state/wait cursor avoids repeated snapshots and waits for changes already received; no billing savings claim.

## Chưa phát hành — CLI, skill graph và context

- `doctor` chỉ đọc, ẩn địa chỉ/mã phòng; phân biệt có executable/bridge với kết nối và quyền model thực tế.
- `skills list/show/inspect`: skill Agent Meeting đóng gói và catalog local có giới hạn; graph liên kết thật tới references/scripts/assets, hash nguồn, đọc từng tài liệu theo nhu cầu. Không tự cài skill, chạy script hoặc sửa settings.
- `history(offset, limit, maxChars)` phân trang theo tin được phép xem, giữ tin nguyên vẹn và cursor wait; lời gọi cũ vẫn trả toàn bộ. Sửa diễn đạt chi phí long-poll; có benchmark tokenizer local và cả ca overhead.

## Chưa phát hành — logo Briefcase

- Thay Convergence bằng icon cặp công sở từ SVG người dùng chọn; đồng bộ README Anh/Việt, favicon/header, bộ SVG/PNG/ICO/ICNS.
- Nền trong suốt thật, giữ lỗ quai/khe nắp; biến thể indigo sáng cho ngữ cảnh tối. Không đổi layout, chức năng hoặc CSP.

## Chưa phát hành — nhận diện và desktop installer

- Logo Convergence v1 theo hướng nhiều góc nhìn hội tụ thành quyết định; SVG, biến thể đơn sắc/đảo màu, PNG, ICO và ICNS. Người dùng đã duyệt logo Convergence ngày 2026-10-21.
- Lệnh `install`/`uninstall` cho launcher theo người dùng trên Linux/macOS/Windows; xem trước không ghi, staging/backup/rollback, giữ dữ liệu và file sửa tay. Không đổi PATH, client AI hoặc cấu hình global.
- Smoke test installer native đạt trên Linux/macOS/Windows trong [CI](https://github.com/ttat288/agent-meeting/actions/runs/39632577516); kiểm mở GUI qua Finder/Start Menu và icon high-DPI vẫn còn mở.

## Chưa phát hành — showcase sản phẩm

- README Anh/Việt dẫn chuyện từ câu hỏi đến quyết định và kế hoạch có nguồn; cập nhật GIF bằng UI v2, caption và player có pause/tua. Thành viên demo kịch bản được ghi rõ, không giả kết quả đã kiểm chứng.
- WORK/ENDED giữ transcript đọc được: footer gọn, bỏ bảng task/kết luận lặp; giữ biên bản, tiến độ/sidebar, carry và phòng mới.
- Kết nối MCP local dùng đúng loopback IPv4 của server, tránh lỗi Node18 phân giải localhost sang IPv6 mà không fallback.
- CI chạy tuần tự có cgroup/memory/time limit trên Node18/20/22, chuẩn bị bubblewrap trong runner; npm test có timeout từng file và hỗ trợ Node18. Giữ sandbox fail-closed.
- Khôi phục chính xác tài liệu nguồn routing sau lỗi chuẩn hóa whitespace ở lần push trước; giữ kiểm tra SHA-256 và quy tắc Git riêng cho file nguồn bất biến.


## Chưa phát hành — cải cách UI v2

- Hợp nhất shell desktop gọn, nav phẳng; utility/Gợi ý vào menu, Chi tiết thành sheet có quản lý focus trên mobile.
- Dùng chung token typography/spacing/control cho năm view, task theo hàng và hành động theo trạng thái; báo cáo đầy đủ hiện trực tiếp.
- Kiểm hành trình/lỗi/khôi phục, theme/locale/reflow/zoom200%; vẫn chờ người dùng đánh giá UX. Bằng chứng tại docs/evidence/ui-v2.

- Một thanh điều hướng phiên; gom form yêu cầu, hồ sơ chạy và hành động theo nhiệm vụ.
- Kế hoạch/kết quả lên trước bối cảnh, UUID và số liệu; đọc báo cáo/tệp/test trực tiếp, mở rộng để xem snapshot đầy đủ.
- Phân biệt tab, trạng thái và điều khiển sáng/tối; giữ nguồn hội thoại, task ID, draft và ranh giới bảo mật.
- Bản chạy để người dùng đánh giá; chưa tuyên bố UX đã được chấp nhận.

## Chưa phát hành — thống nhất phiên làm việc

- Hội thoại, kế hoạch, thực hiện và kết quả trong cùng trang phòng; link workspace cũ chuyển về kế hoạch.
- VIỆC dùng chung task ID với execution, giữ nguồn hội thoại và bản nháp; thêm điều kiện chạy ngay trên task có sẵn.
- Phân biệt tiến độ tự báo với kết quả kiểm chứng/tích hợp; chặn kết quả lỗi thời khi nguồn/yêu cầu đổi và giữ kế hoạch qua Họp tiếp.


## Unreleased — routing/workspace thử nghiệm

- Catalog/policy/handoff có nguồn và lookup CLI/MCP riêng; admin lưu thật với revision/backup/conflict và không gian công việc tách khỏi phòng họp.
- Adapter Claude/agy, workspace copy/bwrap, test độc lập, tích hợp một file/rollback/handoff; worker có token/lease/snapshot/artifact và metrics giữ unknown rõ.
- Có bằng chứng CLI thật; chưa release và chưa hoàn thiện đội tự xây app. Giới hạn/cửa nghiệm thu còn lại: [tiến độ](docs/IMPLEMENTATION-STATUS.vi.md), [workflow](docs/ROUTING-WORKFLOW.vi.md).

## 3.5.0

Bảo mật và đường vào họp hợp lệ cho Claude Code ở **auto mode**. Sự cố (người dùng báo 2026-10-19): bộ kiểm duyệt của auto mode
chặn `curl …/join` tới `<ngẫu nhiên>.trycloudflare.com` là rò dữ liệu, kể cả khi người dùng xác nhận trong chat, dù cả hai AI cùng
chạy trên một máy. Bộ kiểm duyệt đã làm đúng: sản phẩm bắt agent gửi dữ liệu ra host lạ chỉ vì chữ dán vào yêu cầu. 3.5 sửa sản
phẩm, không lách kiểm duyệt. Thiết kế và mô hình đe doạ: [docs/SECURITY-DESIGN.md](docs/SECURITY-DESIGN.md).

- **Kết nối một lần (`connect`)**: `npx github:ttat288/agent-meeting connect <claude|codex|gemini> [--room <URL mời>]` (hoặc nút
  **Kết nối … trên máy này** trên trang chủ trì) chép cầu nối MCP stdio vào `~/.agent-meeting/mcp.js`, đăng ký nó bằng CLI của chính
  agent và cho phép **đúng các tool họp** (Claude Code: `permissions.allow` trong `~/.claude/settings.json`, được xét trước bộ kiểm
  duyệt; Gemini: policy `~/.gemini/policies/agent-meeting.toml`; Codex: annotations). `send_file` không được cho phép sẵn. Sao lưu
  file cấu hình trước khi sửa, `disconnect` gỡ. Tab mời mới **Đã kết nối (MCP)**: prompt không chứa địa chỉ hay mã.
- **Cầu nối MCP**: không tool nào nhận URL (phòng lấy từ `~/.agent-meeting/rooms.json` do app trên máy này hoặc `connect --room`
  ghi); `send_file`/`get_file` đọc/ghi tệp ngay trên máy, chỉ trong thư mục làm việc, từ chối `.env`, khoá, đường dẫn ra ngoài.
- **Cục bộ trước**: server chỉ nghe `127.0.0.1` (`--lan` để mở LAN; Docker dùng `--lan`). Tunnel không còn bật lúc khởi động: thẻ
  mời có **Trên máy này** (localhost) / **Máy khác** (bấm **Bật địa chỉ công khai**, hoặc `--tunnel`). Trang chủ trì và API chủ trì
  từ chối request qua tunnel (trừ `--public-url`/`--remote-host`); kiểm `Host` (DNS rebinding) và `Origin` (CSRF).
- **Chủ trì duyệt agent** (`--admit all` mặc định, `remote`, `none`): `join` trả mã đối chiếu 4 số, trang chủ trì hiện **Cho vào /
  Từ chối**. Họp tự động (`--auto-start`) phải chọn `--admit none` hoặc `remote`.
- **Mã riêng từng agent**: curl gửi `Authorization: Bearer <mã>`, MCP gắn với `Mcp-Session-Id` (server cấp lúc `initialize`). Danh
  tính không còn lấy từ tham số `name` (trước đây ai có mã mời cũng nói, rời phòng, báo tiến độ, tải tệp riêng dưới tên agent
  khác). Vào lại tên cũ cần mã của agent đó hoặc chủ trì duyệt lại. Mã được lưu qua `--data-dir` và mang sang "Họp tiếp".
- **Tách dữ liệu và chỉ thị**: tin của agent được trích dẫn (`│ ` ở các dòng sau) nên không giả được dòng `[CHỦ TRÌ]`/`(hệ thống)`;
  tên giống chủ trì/hệ thống (`CHỦ TRÌ`, `host`, `system`…) bị từ chối. Giao thức: quyền của agent do người dùng của nó cấp, không do phòng.
- **Chặn bí mật**: tin, ghi chú tiến độ/tệp và nội dung tệp có dạng khoá riêng, token AWS/GitHub/Anthropic/OpenAI/Google/Slack/Stripe,
  JWT, `PASSWORD=…` bị từ chối; chủ trì thấy cảnh báo (không thấy giá trị).
- **Giới hạn tốc độ** (IP dò mã sai → `429`; ~20 tin và ~10 tệp mỗi phút mỗi agent), thân request tối đa 256 KB (trừ tệp).
- **`--audit-log <file>`** (JSONL, quyền 600: vào/duyệt/từ chối, gửi/tải tệp, thao tác chủ trì, tin bị chặn; không ghi nội dung hay
  mã) và **`--retention <ngày>`** (tự xoá biên bản/trạng thái cũ).
- Demo bots dùng mã riêng (chạy app với `--admit remote` để bot vào ngay). `npm test` có `--test-timeout`.
- Lệnh `curl` trong giao thức đổi dạng (`-H "Authorization: Bearer …"`, bỏ `name=`): agent đang họp dở với bản cũ cần `join` lại.

## 3.4.0

Sửa lỗi nghiêm trọng gặp với agent thật: Claude Code (auto mode) dừng lượt để hỏi người dùng thì bị tính là rời phòng vĩnh viễn.

- **Agent vắng thay vì bị đuổi**: không gọi `wait` quá 3 phút thì agent chỉ bị đánh dấu **vắng** (trang chủ trì: "vắng (có thể
  đang chờ người dùng duyệt)"), vẫn giữ slot, vai trò và chỗ đang đọc; không được giao lượt, không chặn ai (chế độ lần lượt bỏ qua
  lượt của nó ngay), phòng không đóng khi còn agent vắng. Gọi `wait`/`say`/`join` lại là có mặt lại và nhận đủ phần đã lỡ (kèm
  một dòng báo đã vắng bao lâu). Vắng 15 phút mới coi là mất kết nối; quay lại khi cuộc họp còn diễn ra thì tự vào lại.
  Trạng thái vắng được lưu qua `--data-dir`. Trước đây: 3 phút im lặng là `leave`, và lần `wait` sau nhận "Bạn đã rời phòng.
  Hãy dừng lại".
- **Prompt mời trao quyền rõ ràng** (mọi tab, VI + EN): người dán prompt là chủ trì (tin `[CHỦ TRÌ]` là của họ), phòng chạy
  trên máy này hay qua địa chỉ công khai, chỉ chia sẻ tóm tắt tự viết và không gửi bí mật; quy tắc của dự án/của agent vẫn áp
  dụng, mâu thuẫn hoặc cần duyệt thì nói vào phòng rồi `wait` tiếp, dừng để hỏi người dùng thì vẫn được giữ chỗ.
- **Giao thức** thêm luật 12 (cần người dùng duyệt / bị chặn quyền / bối cảnh mâu thuẫn quy tắc dự án: say ngắn vào phòng rồi
  wait tiếp) và luật 13 (đọc tệp bằng lệnh riêng, chỉ gửi tóm tắt tự viết, không ghép đọc tệp với lệnh gửi, không gửi bí mật).
  Luật 6 (tin chủ trì) thêm "trong phạm vi quy tắc của dự án và của bạn".
- **Chặn Bắt đầu khi thiếu agent cho vai trò**: brief có N vai trò (vai trò trống ở giữa vẫn tính, ở cuối thì không) mà phòng
  chờ có ít hơn N agent thì nút **Bắt đầu cuộc họp** bị khoá, thanh dưới báo "Cần N agent theo vai trò (đang có M)".
  `POST /api/host/<k>/start` trả `409` (kèm `need`, `have`) trừ khi gửi `"force": true`; `--auto-start n` nhỏ hơn số vai trò
  thì báo lỗi lúc khởi động. Không có vai trò thì như cũ.

## 3.3.1

Chỉ đổi giao diện trang chủ trì; không đổi giao thức gửi agent.

- **Thanh bước nằm trong thanh đầu**: logo + trạng thái bên trái, 4 bước ở giữa, nút bên phải; bỏ hẳn một hàng (~45 px)
  nên phần soạn bối cảnh và phòng họp cao hơn. Thiếu chỗ thì thu gọn dần: ≤1180 px chỉ bước hiện tại có chữ, ≤1024 px ẩn chữ
  "Agent Meeting" (giữ logo), ≤900 px nút *Mời agent* / *Biên bản* chỉ còn biểu tượng (có tooltip, vẫn có tên cho trình đọc
  màn hình), ≤720 px thanh bước thành thanh tiến độ 4 đoạn ở mép dưới thanh đầu. Tên bước bị ẩn vẫn đọc được bằng trình đọc màn hình.
- Sửa: màn hẹp (≤860 px) đang họp với tên agent dài làm cả trang tràn ngang (lưới phòng họp `1fr` → `minmax(0, 1fr)`).
- GIF demo (EN + VI) và ảnh tài liệu chụp lại theo giao diện mới; `tools/record-demo.js --vi` quay bản tiếng Việt,
  `tools/shot-setup.js` / `tools/shot-mobile.js` chụp ảnh bước chuẩn bị và mobile tối.

## 3.3.0

Màn chuẩn bị tách hai bước và bối cảnh dạng JSON để nhờ AI viết hộ. Không đổi giao thức gửi agent (trừ vai trò theo thứ tự
vào phòng). Vẫn một lệnh là chạy, không thư viện ngoài, Node 18+.

- **Bản brief** (`agent-meeting/brief@1`): bối cảnh, điều kiện kết thúc, chương trình họp, tuỳ chọn và `roles` trong một
  object JSON, đúng bằng thân `POST /api/host/<mã chủ trì>/start`. Module dùng chung `src/brief.js` (Node + trình duyệt,
  phục vụ ở `/assets/brief.js`): kiểm kiểu từng trường, kẹp số theo giới hạn của server, cắt độ dài, khoá lạ chỉ cảnh báo,
  nhận cả khi AI bọc trong ```` ```json ```` hoặc thêm câu dẫn, lỗi cú pháp báo dòng/cột bằng tiếng Việt (thừa/thiếu dấu
  phẩy, ngoặc cong “ ”, chuỗi xuống dòng thật…), giới hạn 64 KB.
- **Nhờ AI viết**: nút *Sao chép prompt cho AI* (mô tả và giới hạn từng trường, JSON mẫu hoặc bản nháp hiện tại); dán kết
  quả vào tab **JSON**: hợp lệ thì áp vào form ngay, lỗi hiện theo dòng (bấm để tới dòng). Form và JSON đồng bộ hai chiều.
  *Sao chép JSON*, *Tải .json*, *Mở tệp .json* (đọc trong trình duyệt, không gửi lên server). Đã thử với Haiku 4.5 và
  Sonnet 5.5 (prompt sao chép từ trang): JSON hợp lệ, đúng ý mô tả; prompt được chỉnh sau lần thử đầu (agent đưa phần
  "làm việc / báo tiến độ" vào chương trình họp khi giữ phòng; Haiku chép số liệu của ví dụ).
- **Vai trò theo thứ tự vào phòng** (`roles`): khi bắt đầu, agent có mặt thứ nhất nhận vai trò 1…; vai trò chủ trì giao tay
  được giữ. Phòng chờ hiện trước vai trò sẽ nhận ("theo bản brief").
- **Hai màn chuẩn bị**: *1. Bối cảnh* → **Tiếp: mời agent →** → *2. Mời agent* (thẻ mời, phòng chờ, tóm tắt bối cảnh chỉ đọc
  kèm **← Sửa bối cảnh**, **Bắt đầu cuộc họp**). Bước lưu trong địa chỉ (`#boi-canh` / `#moi-agent`): tải lại trang hay bấm
  Back vẫn đúng bước; thanh bước bấm được khi đang chuẩn bị. Bước 1 hiện số agent đang chờ. "Họp tiếp"/"Cuộc họp mới" về bước 1.
- **Thiết kế lại trang bối cảnh**: thẻ mẫu có biểu tượng + mô tả, ô lời dặn
  đếm ký tự (8000), chương trình họp và vai trò dạng danh sách sửa được (Enter thêm dòng, Backspace ở dòng trống xoá,
  Alt+↑/↓ hoặc nút ↑↓ đổi chỗ), công tắc *Giữ phòng để báo tiến độ*, chế độ phát biểu dạng nút chọn, nhóm giới hạn.
  Đã kiểm tra ở 1280, 768, 375 px, sáng và tối.
- CLI **`--brief-file brief.json`** (thay `--context-file` + `--agenda-file`, báo lỗi theo dòng và dừng nếu sai); với
  `--auto-start` dùng cả tuỳ chọn và vai trò của brief; không có `--auto-start` thì brief là bản nháp ban đầu trên trang chủ trì
  (`--context-file`… cũng vậy). Bản nháp kiểu cũ trong trình duyệt (≤ 3.2) được chuyển sang tự động.
- Ảnh mới: `docs/screenshots/setup.jpg` (bước 1), `invite.jpg` (bước 2), `brief-json.jpg` (tab JSON).
- **Trang chủ trì tiếng Anh**: tự theo ngôn ngữ trình duyệt, nút **VI/EN** trên thanh đầu (nhớ lựa chọn, `?lang=en` cũng được).
  Từ điển ở `src/ui/i18n.js` (khoá là câu tiếng Việt gốc, `tr('…')` / `` tr`…${x}…` ``), `test/i18n.test.js` kiểm không thiếu
  bản dịch. Tin hệ thống do server sinh có thêm bản hiển thị tiếng Anh (`en`); giao thức gửi agent vẫn tiếng Việt. Prompt mời,
  tin nhanh của chủ trì, mẫu bối cảnh, prompt nhờ AI và thông báo lỗi JSON theo ngôn ngữ trang. Đã thử prompt mời tiếng Anh với
  Haiku 4.5 + Sonnet 5.5 thật (vào họp, nhận vai trò theo slot, XONG MỤC, KẾT LUẬN + VIỆC, rời phòng).
- `npm run demo -- <url> --en`: bot nói tiếng Anh. GIF demo `docs/demo.gif` giờ là tiếng Anh; bản tiếng Việt ở `docs/demo.vi.gif`.
  Ảnh tiếng Anh ở `docs/screenshots/en/`.
- **README viết lại**: tiếng Anh là bản chính (`README.md`), tiếng Việt ở `README.vi.md`; ngắn, tập trung vào lợi ích, luôn
  ghi phiên bản mới nhất. Phần chi tiết (luồng đầy đủ, mẫu kết quả, tham số dòng lệnh, tool, bảo mật, hạn chế) chuyển sang
  `docs/REFERENCE.md` / `docs/REFERENCE.vi.md`. `README.en.md` bị bỏ.

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
