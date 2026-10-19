# Bàn giao phát triển (cho session/người tiếp theo)

> Đọc file này trước khi sửa code. Cập nhật lại mục "Trạng thái" và "Việc tiếp theo" trước khi kết thúc phiên làm việc.

## Sản phẩm là gì

Agent Meeting: phòng họp cho nhiều AI agent (Claude Code, Codex, Gemini CLI, hoặc bất kỳ agent nào chạy được `curl`) trên các máy khác nhau tự trao đổi; người dùng là **chủ trì** qua trang web. Một lệnh `npx github:ttat288/agent-meeting` chạy server Node (không thư viện ngoài) + tunnel Cloudflare miễn phí.

- Repo: https://github.com/ttat288/agent-meeting (public, MIT). Đăng nhập `gh` trên máy dev là tài khoản `ttat288`.
- Người dùng nói tiếng Việt; giao thức agent và tài liệu hướng dẫn (GUIDE, DEPLOY) bằng tiếng Việt. **README: tiếng Anh là bản
  chính (`README.md`), tiếng Việt ở `README.vi.md`; ngắn gọn, hấp dẫn, luôn ghi phiên bản mới nhất (badge + "What's new");
  chi tiết nằm ở `docs/REFERENCE.md` / `docs/REFERENCE.vi.md`. GIF demo phải là tiếng Anh** (người dùng yêu cầu 2026-10-18).

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
src/brief.js      bản brief JSON (agent-meeting/brief@1): parseBrief / toBrief / aiPrompt, chạy cả Node lẫn trình duyệt
                  (UMD: module.exports | window.AgentMeetingBrief), phục vụ ở /assets/brief.js (v3.3)
src/ui/           trang chủ trì: index.html + app.css + app.js + i18n.js (từ điển VI→EN, v3.3) (+ /assets/brief.js),
                  không build, CSP chặt
scripts/          install-linux.sh (launcher menu), demo-bots.js (3 agent giả lập, `--en` nói tiếng Anh)
tools/            công cụ phát triển, KHÔNG phát hành: shot.js (chụp ảnh Firefox BiDi), record-demo.js (quay GIF, --vi),
                  make-gif.py, shot-setup.js (ảnh bước 1/2 + tab JSON), shot-mobile.js (mobile tối giữa cuộc họp); BIDI_PORT=…
test/             node:test; meeting.test.js (luật) + server.test.js (HTTP/MCP) + minutes.test.js + files.test.js + brief.test.js
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
- **Bản brief (v3.3)** = đúng thân `POST /api/host/<k>/start` + `schema` + `roles`. `src/brief.js` là nguồn duy nhất cho
  kiểm tra/chuẩn hoá (UI, CLI `--brief-file`, test); `LIMITS` phải khớp `BOUNDS`/`MAX_AGENDA`/`start()` của meeting.js (có
  test so sánh). Server KHÔNG dùng parseBrief: `start()` tự kẹp/cắt như cũ. Lỗi cú pháp dùng bộ dò riêng (`syntaxError`)
  để thông báo tiếng Việt, giống nhau trên mọi engine (thông báo của `JSON.parse` khác nhau giữa Node/Chrome/Firefox).
  Trường thiếu lấy `base` (mặc định của server/CLI), KHÔNG lấy bản nháp đang có: JSON là toàn bộ sự thật.
- `roles` theo vị trí: agent có mặt thứ i (sắp theo slot, `_order()`) nhận `roles[i]` nếu chưa có vai trò giao tay
  (vai trò tay không "ăn" mất vị trí). `meeting.preset` = brief từ CLI, chỉ hiện trong snapshot khi LOBBY, lưu qua --data-dir,
  "Cuộc họp mới" mang sang (như agenda); trang chủ trì dùng làm bản nháp ban đầu khi trình duyệt chưa có nháp.
- Hai bước chuẩn bị là trạng thái TRÌNH DUYỆT (`step`, `location.hash` `#boi-canh`/`#moi-agent`, pushState + popstate);
  server vẫn chỉ có LOBBY. Bản nháp: `localStorage[agent-meeting:<hostKey>:brief]` (nháp cũ ≤3.2 theo từng ô được chuyển).
  Form ↔ JSON: đổi form → JSON viết lại (trừ khi ô JSON đang focus); JSON hợp lệ → form viết lại, KHÔNG định dạng lại chữ
  người dùng đang gõ; JSON sai thì giữ nguyên chữ để sửa tiếp.
- Prompt nhờ AI (`aiPrompt`) đã chỉnh theo agent thật, đừng nới: ví dụ KHÔNG có số liệu/chi tiết riêng (Haiku chép sang
  cuộc họp khác); dặn rõ khi `followUp` thì agenda/endCondition chỉ là phần bàn bạc; prompt không được chứa `<…>`
  (test kiểm). Đổi prompt thì thử lại bằng subagent Haiku + Sonnet với đúng prompt lấy từ trang (so sha256).
- **Hai ngôn ngữ cho trang chủ trì (v3.3)**: khoá dịch là CÂU TIẾNG VIỆT GỐC. Mọi chuỗi hiển thị trong app.js bọc
  `tr('…')` hoặc `` tr`… ${x} …` `` (khoá: `${…}` → `{0}`, `{1}`…, bản EN đổi được thứ tự); HTML tĩnh để tiếng Việt, `apply()`
  dịch từng đoạn chữ + placeholder/title/aria-label. Thêm chuỗi mới thì thêm vào `EN` trong src/ui/i18n.js, `test/i18n.test.js`
  sẽ báo nếu thiếu (kể cả chuỗi tiếng Việt quên bọc `tr`; chuỗi không dấu như `'xong'` thì test không bắt được, phải tự để ý).
  Đừng đặt biến cục bộ tên `tr`. Chữ trong CSS `content:` không dịch được: dùng `attr(data-…)`.
  Chọn ngôn ngữ: `?lang=` → localStorage `agent-meeting:lang` → `navigator.language`; nút VI/EN tải lại trang.
  Tin do server sinh có thêm `m.en` (CHỈ để hiển thị; agent, biên bản, history vẫn dùng `m.text` tiếng Việt). Giao thức gửi agent
  KHÔNG dịch. Phần theo ngôn ngữ trang mà agent nhận được: prompt mời, tin nhanh của chủ trì (giữ từ khoá KẾT LUẬN/VIỆC),
  mẫu bối cảnh, prompt nhờ AI (`aiPrompt(brief, 'en')`). Lý do kết thúc: `REASON_EN` ở meeting.js + bảng trong i18n.js.
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
  - (v3.3) Ô ẩn của công tắc/nút chọn dùng `position:absolute`: thiếu `position:relative` ở khung cha thì chúng định vị
    theo trang và kéo dài cả `body` (trang tràn, thanh dưới trôi). `.pane` trong `.setup` (flex cột) phải `flex: none`,
    không thì bị co bằng khung và nội dung tràn ra ngoài.
  - (v3.3) Luật màn hẹp `.btn span:not(:only-child) { display: none }` ẩn chữ của mọi nút có icon: nút ở thanh dưới
    (`.startbar`) phải được trả lại chữ.
  - (v3.3) Trình duyệt tích hợp: khi cửa sổ app bị ẩn, `computer` (phím/chụp ảnh) báo hết giờ; `javascript_tool`,
    `read_page` vẫn chạy. Cỡ mô phỏng (mobile/tablet) bị app xoá khi pane đổi rộng: đặt lại trước mỗi lần chụp.
  - (v3.3) Subagent đôi khi trả JSON trong `SubagentHandback` hoặc chỉ trong text trước đó và báo cáo cuối chỉ là câu tóm
    tắt: lấy đúng chữ từ transcript (`tool_use` SubagentHandback `input.message`, hoặc các khối `text` của assistant).
  - (v3.3) Heredoc không có dấu nháy (`<<EOF`) ăn mất dấu `\`: viết script JS/Python có `\n` bằng công cụ Write.
  - (3.3.1) Firefox BiDi: phiên tạo bằng `session.new` KHÔNG tự hết khi WebSocket đóng; quên `session.end` thì mọi lần sau
    báo "Maximum number of active sessions" và không đóng được Firefox đó nữa (snap: `kill` bị từ chối). Script luôn
    `session.end` (hoặc `browser.close`) kể cả khi lỗi; kẹt thì chạy Firefox khác với profile/cổng khác (`BIDI_PORT=9224`).
  - (3.3.1) Trang chủ trì ghi bản nháp/tab vào localStorage khi rời trang: đặt localStorage rồi reload sẽ bị ghi đè. Đặt từ
    một URL cùng origin không chạy app (`/favicon.svg`) rồi mới mở trang (xem `tools/shot-setup.js`).
  - (3.3.1) CSP chặn `<style>` chèn bằng script (kể cả khi chụp ảnh); chỉnh CSS lúc chạy bằng CSSOM (`el.style.x = …`).
  - (3.3.1) Ảnh tối: Firefox headless cần profile có `user.js` với
    `user_pref("layout.css.prefers-color-scheme.content-override", 0);` (shot.js `dark` đặt `data-theme`, CSS không dùng).
    Thanh cuộn headless vẫn sáng: ẩn bằng `scrollbarWidth = 'none'` trước khi chụp (`tools/shot-mobile.js`).
  - (3.3.1) Lưới `grid-template-columns: 1fr` có min = nội dung: dải thành viên ở màn hẹp kéo rộng cả trang. Dùng `minmax(0, 1fr)`.
  - (3.3.1) Header là lưới `1fr auto 1fr` (thanh bước ở giữa); `.top-l`/`.top-r` KHÔNG được `min-width: 0`, không thì cột
    phải bị ép và nút chồng lên thanh bước. Thêm nút vào header thì đo lại ở 721–1280 px (lúc LIVE có 3 nút) cả VI lẫn EN.
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- **2026-10-19, nhánh `v3.4-away` (từ `v3.3.1-header` 36a4e5a). ĐÃ PUSH cả `v3.3.1-header` và `v3.4-away` lên origin
  (người dùng yêu cầu); CHƯA merge vào main, CHƯA tag/release. App trong menu đã cài lại từ `v3.4-away` (`--version` = 3.4.0).** package 3.4.0, CHANGELOG 3.4.0,
  README (EN+VI) badge + "What's new in 3.4", GUIDE + REFERENCE (VI+EN). 106 test xanh. Đã làm bước 1–5 và 7 của lộ trình v3.4:
  - Agent VẮNG (`a.away`, `a.awaySince`; snapshot `status: 'away'` + `awaySince`): `_reap` hết `staleMs` → `_setAway` (giữ
    slot/vai trò/cursor, mất lượt ngay), vắng thêm `cfg.awayMs` (mặc định 15 phút) → `a.lost = true` + `leave('mất kết nối')`.
    `_seen(a)` (gọi từ `_agent`, `progress`, `listFiles`) bỏ vắng, hoặc cho agent `lost` vào lại nếu phòng LIVE/LOBBY; `a.back`
    = số phút im lặng, lần `wait` kế tiếp báo "Bạn đã vắng ~N phút…" (trả ngay kể cả khi không có tin mới). `_active()` (có mặt,
    không vắng) dùng cho lượt (`_advance`, lượt đầu), `passStreak`, người được hỏi chốt khi im lặng; `_present()` (tính cả vắng)
    vẫn dùng cho vai trò theo vị trí, "chỉ còn mình bạn", "mọi agent đã rời phòng". `join` cùng tên + model khi đang vắng thì vào
    lại. `changedSince` (long-poll của trang chủ trì) cũng gọi `_reap` để phát hiện vắng khi không agent nào đang `wait`.
    Đã thử trên server thật: Grok im 3 phút → "vắng" trên trang, chủ trì nhắn, Grok `wait` lại nhận đủ tin đã lỡ + giữ vai trò.
  - Giao thức: luật 6 thêm "trong phạm vi quy tắc của dự án và của chính bạn"; luật 12 (cần duyệt/mâu thuẫn: say ngắn rồi wait
    tiếp, dừng hỏi người dùng thì vẫn giữ chỗ) và 13 (tách lệnh đọc tệp với lệnh gửi, không gửi bí mật); số luật là 11/12 khi
    agent không có `a.base`.
  - Prompt mời (`perm` trong `buildInvite`, VI + EN): người dán là chủ trì, phòng chạy trên máy này / địa chỉ công khai (theo
    hostname của origin), chia sẻ gì, mâu thuẫn thì nói vào phòng. KHÔNG thêm trường `permissions` vào brief (cần hỏi người dùng).
  - Chặn Bắt đầu: `rolesNeeded(roles)` trong src/brief.js (bỏ vai trò trống ở CUỐI, "" ở giữa vẫn tính); UI khoá `#btnStart`
    (+ `title`), `#checks2` báo "Cần N agent theo vai trò (đang có M)" (class `bad`); server 409 `{error, need, have}` trừ khi
    `force: true`; CLI `--auto-start n` < số vai trò thì thoát lỗi.
  - CHƯA: bước 6 (thử với agent thật: subagent Sonnet + Haiku với workspace "build nothing", và Claude Code CLI thật ở auto mode
    qua tunnel: hỏi người dùng trước); GIF/ảnh chưa chụp lại (giao diện chỉ thêm trạng thái vắng + nút khoá).

- **2026-10-19, nhánh `v3.3.1-header` (từ main bf9ee8e), CHƯA merge/push/tag.** package 3.3.1, CHANGELOG 3.3.1, README (EN+VI)
  badge + "What's new". 96 test xanh.
  - **Thanh bước lên header** (người dùng yêu cầu: "mang progress bar lên header cho rộng phần body"): `index.html` header =
    `.top-l` (logo + trạng thái) | `nav.steps` | `.top-r` (VI/EN, kết nối, nút); CSS lưới `1fr auto 1fr`. Thu gọn: ≤1180 chỉ
    bước hiện tại có chữ (chữ khác sr-only), ≤1024 ẩn chữ "Agent Meeting", ≤900 `#btnInvite`/`#btnMinutes` chỉ icon (thêm
    `title`, chữ sr-only), ≤720 thanh tiến độ 4 đoạn 3 px ở mép dưới header (nút bước sr-only). Bỏ được một hàng ~45 px.
    Sửa kèm: tràn ngang ở ≤860 px khi đang họp (`.room` `1fr` → `minmax(0, 1fr)`; lỗi có từ trước).
  - Đã kiểm tra (trình duyệt tích hợp): đo chồng lấn/tràn bằng JS ở 1280/1180/1100/1024/900/800/768/721/720/640/375, cả LIVE
    (3 nút) lẫn LOBBY, VI và EN: không chồng, không tràn ngang; ảnh 1280 sáng (bước 1, 2, kết thúc), 768 tối, 375 sáng/tối
    (LOBBY + LIVE); bấm bước 2 trên header vẫn chuyển bước + focus tiêu đề; tooltip EN đúng. Console chỉ có lỗi
    ERR_CONNECTION_REFUSED lúc khởi động lại server. CHƯA: bàn phím thật (Tab qua các bước), trình đọc màn hình, Safari/iOS.
  - GIF `docs/demo.gif` (EN) + `docs/demo.vi.gif` quay lại; ảnh `docs/screenshots/en/*` và ảnh VI `setup`, `invite`,
    `brief-json`, `meeting`, `work` (giờ 1280×680 như bản EN), `files`, `ended`, `mobile-dark` chụp lại (Firefox BiDi).
    `carry.jpg` không có header nên giữ. Công cụ mới: `tools/record-demo.js --vi`, `tools/shot-setup.js`, `tools/shot-mobile.js`,
    `BIDI_PORT` cho mọi script.
  - **"Nhờ AI viết" tiếng Anh với AI thật** (việc #2 cũ): prompt chép từ trang `?lang=en` khớp sha256 `aiPrompt(defaults(),'en')`
    (3564 ký tự). Haiku 4.5 + Sonnet 5.5 × 2 mô tả (repo calc có followUp; review bảo mật 3 agent lần lượt, chỉ bàn): 4/4 JSON
    hợp lệ, đúng ý (calc: followUp=true, agenda chỉ phần bàn; bảo mật: turns, followUp=false, 3 vai trò). Điểm yếu: Haiku (2/2)
    viết mẫu `VIỆC: [agent role] | …` thay vì dặn ghi tên agent; Haiku tự chèn đường dẫn thư mục làm việc của chính nó (môi
    trường subagent, AI chat thường không có); Sonnet viết 1 vai trò >200 ký tự (bị cắt, trang hiện cảnh báo). Chưa sửa prompt.
    Dán nguyên văn (có ```json) vào trang: form điền đúng, bước 2 tóm tắt đúng.
  - **Agent thật họp theo brief do AI viết** (việc #3 cũ): brief Haiku/calc (chỉ đổi đường dẫn repo) dán vào trang, mời
    Haiku + Sonnet bằng prompt "Paste and join" EN chép từ trang, bấm Bắt đầu trên trang. Vai trò theo slot đúng (Sonnet slot 1
    "fixer", Haiku slot 2 "implementer"), 3 mục chuyển đúng, KẾT LUẬN + 2 VIỆC ghi ĐÚNG tên agent (`Sonnet-Lan (fixer)`) dù brief
    chỉ ghi "[agent role]", Sonnet rời phòng đi làm, commit 1878595, báo progress; Haiku làm mul() ngay trong phòng rồi báo
    (fe4c81c), rời phòng → ENDED "mọi agent đã rời phòng" (không qua WORK vì đã xong hết). Repo: 2 commit, `node test.js` ok.
    Ghi nhận: bối cảnh tiếng Anh nhưng hai agent nói tiếng Việt (lần thử 2026-10-18 thì nói tiếng Anh): chấp nhận được.
  - CHƯA: tab MCP / Codex CLI tiếng Anh với Codex thật (không chạy vì dùng tài khoản ChatGPT của người dùng + sửa
    `~/.codex/config.toml`; người dùng dặn thử bằng subagent), tunnel thật, webhook thật.
  - Theo yêu cầu người dùng ("app local chưa update"): đã chạy `scripts/install-linux.sh` TỪ NHÁNH `v3.3.1-header` → bản trong
    menu là 3.3.1 (trước là 3.2.0). Thư mục app còn `src/ui.html` cũ (không dùng, để nguyên). Người dùng dùng thử bản này qua
    tunnel và gặp lỗi nghiêm trọng ở "Lộ trình v3.4".
  - Firefox headless pid 20699 (cổng 9223, profile `am-shot`) bị kẹt phiên BiDi, không kill được từ sandbox: người dùng tự đóng.
- **2026-10-18 (tối), theo yêu cầu người dùng**: README viết lại (tiếng Anh là `README.md`, tiếng Việt `README.vi.md`, chi tiết ở
  `docs/REFERENCE(.vi).md`), đã **merge v3.3-brief vào main và push** (main = 08fbb23 lúc đó). Sau đó làm thêm **trang chủ trì
  tiếng Anh** + bot demo `--en` + GIF tiếng Anh (`docs/demo.gif`; bản Việt `docs/demo.vi.gif`) + ảnh `docs/screenshots/en/`,
  rồi push lần hai (xem git log). CHƯA tag, CHƯA GitHub Release (cả v3.2.0 lẫn v3.3.0).
  - 96 test xanh (`test/i18n.test.js` mới: đủ bản dịch cho app.js/index.html, `tr` dạng tag, parseBrief/aiPrompt tiếng Anh).
  - Đã thử với agent thật: Haiku 4.5 + Sonnet 5.5 dùng ĐÚNG prompt mời tiếng Anh chép từ trang (`?lang=en`), bối cảnh tiếng Anh,
    2 mục, roles theo slot: cả hai vào họp, nhận đúng vai trò theo slot, XONG MỤC 1 → server chuyển mục 2, KẾT LUẬN + VIỆC
    được ghi (#1), rời phòng, ENDED "mọi agent đã rời phòng". Agent trả lời bằng tiếng Anh (theo bối cảnh), lý do rời phòng có
    khi viết tiếng Việt (chữ của agent, không dịch).
  - Giao diện tiếng Anh đã xem: bước 1/2, họp, thực hiện, kết thúc (desktop + 375 px tối), nút VI/EN đổi và nhớ, tiếng Việt
    vẫn như cũ. CHƯA: prompt nhờ AI tiếng Anh với AI thật (mới test bằng Node: không có `<…>`, mẫu JSON hợp lệ), MCP tab tiếng
    Anh với CLI thật (chỉ thử tab "Paste and join" qua curl).
- **v3.3.0 (nhánh `v3.3-brief`) đã merge vào main và push (2026-10-18, người dùng yêu cầu); CHƯA tag.** 92 test xanh (`test/brief.test.js`
  mới: JSON hợp lệ, bọc ```json/câu dẫn, lỗi cú pháp có dòng/cột, sai kiểu từng trường, kẹp số, cắt độ dài, khoá lạ, `<…>`,
  64 KB, roles theo slot, POST start nhận nguyên brief, preset qua toState/restore). package.json 3.3.0, CHANGELOG 3.3.0,
  README/README.en/GUIDE/DEPLOY đã cập nhật, ảnh mới `setup.jpg`, `invite.jpg`, `brief-json.jpg`, GIF `docs/demo.gif` mới
  (dán JSON do AI viết → form → Tiếp → mời agent → họp → thực hiện → đóng; 39 khung, 71 s, 2,0 MB).
  - Đã kiểm chứng trên trình duyệt tích hợp (server dev `--data-dir`): mẫu, đếm ký tự, danh sách chương trình (Enter, Alt+↑
    bằng phím thật), tab JSON (lỗi theo dòng, áp ngay, Áp dụng), Tiếp/← Bối cảnh/thanh bước/Back/tải lại giữ bước, chặn khi
    trống, hỏi lại `<…>`, phòng chờ hiện vai trò "theo bản brief", Bắt đầu gửi đúng brief (vai trò slot + vai trò tay giữ
    nguyên), ngăn kéo Mời agent lúc họp, Họp tiếp về bước 1 có thẻ mang sang. Cỡ 1280 (sáng), 768 (sáng), ~800 và 375 (tối),
    không tràn ngang, không lỗi console. Thứ tự Tab kiểm tra qua DOM (cửa sổ app bị ẩn nên không gửi được phím Tab thật).
  - "Nhờ AI viết" với agent thật: subagent Haiku 4.5 + Sonnet 5.5, đúng prompt sao chép từ trang (so sha256), 3 vòng,
    10 lần, gồm cả chế độ "đã có bản nháp": mọi JSON đều hợp lệ và đúng ý mô tả; đã sửa prompt 2 lần (xem "Quyết định").
    Kết quả dán nguyên văn vào trang (cả bản bọc ```json + đoạn giải thích phía sau): form điền đúng, bước 2 tóm tắt đúng.
  - CLI `--brief-file`: lỗi theo dòng + thoát 1, dùng kèm `--context` bị từ chối, `--auto-start` dùng settings + roles
    (đã thử với curl join), không `--auto-start` thì trang nhận brief làm bản nháp (đã xem trên trang); `--context-file` +
    `--agenda-file` cũng tạo preset (xem qua API).
  - CHƯA kiểm chứng: bàn phím thật đầy đủ (Tab/Space trên công tắc), trình đọc màn hình, Safari/iOS, Node 18/20 (CI sẽ
    chạy), bấm "Mở tệp .json" với hộp chọn tệp thật, mở tệp do "Tải .json" tải về, Docker với `--brief-file`, chế độ tối ở
    768/1280 (CSS dùng chung biến nên không khác, nhưng chưa nhìn), agent THẬT họp theo brief do AI viết (mới thử phần viết +
    dán; giao thức gửi agent không đổi trừ dòng vai trò, vốn đã có từ v3).
- **v3.2.0 đã merge vào main và push (2026-10-18, fast-forward từ `v3.2-files`); CHƯA tag, CHƯA GitHub Release.**
  Đã chạy `scripts/install-linux.sh` (bản trong menu là 3.2.0); người dùng tự mở để kiểm tra giao diện. 75 test xanh
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

### Cách lặp lại phép thử "Nhờ AI viết" (v3.3)

1. Server dev (lệnh ở dưới), mở trang chủ trì trong trình duyệt tích hợp. Lấy ĐÚNG prompt trang chép ra: bọc
   `navigator.clipboard.writeText` bằng `javascript_tool` để lưu chữ vào `window.__copied`, bấm `#btnAiPrompt`, rồi so sha256
   với `aiPrompt(...)` sinh bằng Node (bản nháp trống: `aiPrompt(defaults())`; có nháp: dựng đúng bản nháp đó).
2. Subagent haiku + sonnet (nền), prompt = chữ đó + mô tả cuộc họp như người dùng gõ, không dặn thêm. Mô tả đã dùng: repo
   calc (sửa sub, thêm mul, commit, báo tiến độ, reviewer, ≤20 phút); review bảo mật API đăng nhập (3 agent, lần lượt);
   hoàn thiện bản nháp "Review PR MoMo" (3 agent, 3 mục, ≤30 phút).
3. Kiểm `parseBrief` bằng Node, rồi dán nguyên văn vào `#jsonText` (gán `.value` + sự kiện `input`), bấm `#jsonApply`,
   đọc lại các ô form, bấm `#btnNextStep`, đọc `#briefSummary`. Xem ý nghĩa: followUp/mode/giới hạn đúng mô tả, agenda
   không chứa "làm việc/báo tiến độ" khi followUp, không chép chi tiết của ví dụ.

Ảnh tài liệu: server riêng (`--port 3101 --host-key shothost… --agent-key shotagent…`), Firefox headless như dưới,
`tools/shot.js <url> <out.png> 1280 860 2 2500 '' '<js>'` (tham số js chạy sau khi tải: đặt localStorage bản nháp/tab rồi chụp lần
hai), join agent giả bằng curl cho ảnh bước 2, PIL thu về 1280px JPEG q85. GIF (`tools/record-demo.js`, tiếng Anh; ảnh EN thêm `localStorage['agent-meeting:lang']='en'`): script quay cũ + đoạn mới: `localStorage.clear()`
và bỏ hash → bấm `#btnToJson` → dán JSON (có ```json) làm hai nhát → `#jsonApply` → cuộn → `#btnNextStep` → chạy bot → chờ đủ 3
agent → `#btnStart`; ghép: gộp khung gần trùng (bbox khác biệt < 1500 px²), live 1 s, work 1,1 s, khung chính 3,5-5 s.

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

## Lộ trình v3.2: gửi tệp / code giữa các agent (đã xong, đã merge vào main)

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

## Lộ trình v3.3: màn chuẩn bị tách 2 bước + bối cảnh dạng JSON để nhờ AI viết (nhánh v3.3-brief, đã xong)

Kết quả: 1-5 xong đúng thiết kế dưới đây (không đổi thiết kế; `roles` theo slot đã làm). Chi tiết ở "Trạng thái". Bước 2-4
làm chung một lần vì cùng một màn (làm từng bước sẽ phải viết lại màn ba lần), test riêng từng phần.

Người dùng yêu cầu 2026-10-18: tự điền bối cảnh và tuỳ chọn trên UI "hơi mệt", muốn chuyển sang JSON để gửi cho AI viết
hộ; trang bối cảnh cần thiết kế đẹp hơn; bước 1 (Bối cảnh) và bước 2 (Mời agent) đang chung một màn, phải tách ra: xong
bước 1 bấm "Tiếp" sang bước 2, chờ agent vào rồi mới Bắt đầu. Làm theo thứ tự, mỗi bước test xong mới sang bước sau.

1. **Định dạng "bản brief" JSON + module dùng chung `src/brief.js`.**
   - Một object khớp đúng thân `POST /api/host/<k>/start` để dùng lại được, thêm `schema` và (tuỳ chọn) `roles`:
     ```json
     {
       "schema": "agent-meeting/brief@1",
       "context": "Chủ đề và yêu cầu cho các agent…",
       "endCondition": "",
       "settings": { "agenda": ["Mục 1", "Mục 2"], "followUp": true, "mode": "free",
                     "maxMsgs": 120, "timeLimitMin": 0, "idleSec": 40 },
       "roles": ["phản biện", "bảo mật"]
     }
     ```
     `roles` theo THỨ TỰ SLOT (agent tự đặt tên nên không biết trước tên): khi bắt đầu, agent slot 1 nhận vai trò 1…
     (chỉ gán cho agent chưa có vai trò do chủ trì giao tay). Có lý do mạnh thì đổi, nhưng nói với người dùng trước.
   - `src/brief.js`: `parseBrief(text)` → `{ ok, brief, errors[] }` (JSON.parse; chấp nhận cả khi AI bọc trong ```json …```;
     kiểm kiểu từng trường, clamp theo `BOUNDS` như `Meeting.configure`, cắt độ dài như `start()`; khoá lạ → cảnh báo
     chứ không lỗi), `toBrief(form)`, `aiPrompt(brief)`. Viết dạng chạy được cả Node (`module.exports`) lẫn trình duyệt
     (`window.AgentMeetingBrief`), phục vụ tĩnh ở `/assets/brief.js` (thêm vào `ASSETS` trong server.js; CSP `script-src
     'self'` vẫn đúng). Test node:test `test/brief.test.js`: JSON hợp lệ, bọc ```json, sai kiểu, số ngoài khoảng, quá
     dài, khoá lạ, có `<…>` chưa điền, chuỗi rất lớn (giới hạn ~64 KB).
   - Dữ liệu dán vào là DỮ LIỆU: chỉ `JSON.parse`, gán bằng `.value`/`textContent`, không bao giờ `innerHTML`.
   - Tuỳ chọn: CLI `--brief-file brief.json` (thay cho `--context-file` + `--agenda-file`, dùng cùng `parseBrief`), cập
     nhật `--help`, README, DEPLOY (ví dụ họp tự động).

2. **"Nhờ AI viết" trên bước 1.** Hai chế độ (tab) cho cùng một bản nháp: **Điền trên form** | **JSON**.
   - Nút **Sao chép prompt cho AI**: chép một prompt tiếng Việt gồm mô tả từng trường, giới hạn, JSON mẫu (bản nháp hiện
     tại), và câu "chỉ trả về JSON". Người dùng dán vào ChatGPT/Claude kèm mô tả cuộc họp, rồi dán kết quả lại.
   - Ô **Dán JSON** + nút **Áp dụng**: hiện lỗi theo từng trường (dòng/khoá), áp vào form khi hợp lệ; form và JSON đồng bộ
     hai chiều (đổi form → JSON cập nhật; sửa JSON hợp lệ → form cập nhật). Nút **Sao chép JSON** / **Tải .json** /
     **Mở tệp .json** (FileReader, không gửi lên server).
   - Bản nháp vẫn lưu localStorage như hiện tại (`draftKey`), giờ lưu cả bản brief.
   - Thử thật: đưa prompt sao chép từ trang (không dặn thêm) + một mô tả cuộc họp cho subagent Haiku và Sonnet, dán JSON
     chúng trả về vào trang, kiểm tra form điền đúng và lỗi hiện rõ khi JSON sai.

3. **Tách bước 1 và bước 2 thành hai màn** (trạng thái server vẫn là LOBBY cho cả hai; bước là trạng thái phía trình
   duyệt, lưu trong `location.hash` (`#boi-canh` / `#moi-agent`) để tải lại trang vẫn đúng bước).
   - Bước 1 "Bối cảnh": chỉ có soạn bối cảnh (form/JSON, mẫu, chương trình họp, tuỳ chọn). Thanh dưới: **Tiếp: mời
     agent →** (chưa có bối cảnh thì báo lỗi như nút Bắt đầu hiện nay; còn `<…>` của mẫu thì hỏi lại).
   - Bước 2 "Mời agent": thẻ mời (các tab prompt), phòng chờ (giao vai trò, mời ra), tóm tắt bối cảnh chỉ đọc kèm nút
     **← Sửa bối cảnh**, nút **Bắt đầu cuộc họp** (gửi đúng bản brief của bước 1). Có thể hiện "chưa có agent: vẫn bắt
     đầu được" như hiện tại.
   - Thanh bước (`#steps`) bấm được để chuyển 1 ↔ 2 khi đang LOBBY; bước 3/4 vẫn theo trạng thái server.
   - Agent vào phòng chờ ngay cả khi chủ trì đang ở bước 1 (server đã cho phép): bước 1 nên có một chỉ báo nhỏ "n agent
     đang chờ". "Họp tiếp": thẻ "Mang từ cuộc họp trước" nằm ở bước 1.
   - Kiểm tra lại các test giao diện thủ công cũ: đổi `renderSteps()` (hiện tại bước 2 = "đã có chữ trong bối cảnh"),
     `initForm`, `renderSetup`, ngăn kéo "Mời agent" lúc đang họp (dùng lại `#invite`, đừng phá `inviteHome`).

4. **Thiết kế lại trang bối cảnh cho đẹp** (vẫn không build, không thư viện, CSP chặt, tự xử lý sáng/tối):
   - Mẫu bối cảnh thành thẻ có biểu tượng + một dòng mô tả (thay cho chip), ô bối cảnh lớn có đếm ký tự (giới hạn 8000),
     chương trình họp dạng danh sách sửa được (thêm/xoá/kéo thứ tự hoặc nút ↑↓) thay cho textarea, nhóm tuỳ chọn thành
     các khối rõ ràng (công tắc "Giữ phòng để báo tiến độ", chế độ phát biểu dạng nút chọn, giới hạn).
   - Kiểm tra ở desktop 1280, tablet 768, mobile 375, chế độ tối; không lỗi console; bàn phím (Tab/Enter) dùng được.
   - Chụp lại `docs/screenshots/setup.jpg` (+ ảnh bước 2), quay lại `docs/demo.gif` theo luồng mới (script quay ở
     "Cách lặp lại phép thử" phải sửa: bấm "Tiếp" trước khi chờ bot, rồi Bắt đầu ở bước 2).

5. Tài liệu: README/README.en (Quy trình 4 bước, phần nhờ AI viết bối cảnh, định dạng brief), GUIDE (mục 5 "Trước khi
   bắt đầu", mục 7 viết bối cảnh), CHANGELOG 3.3.0, package.json 3.3.0. Hỏi người dùng trước khi merge/push/tag/release.

Không đổi giao thức agent trong v3.3 (trừ `roles` theo slot, nếu làm). Nếu phải đổi văn bản gửi agent thì thử lại bằng
subagent Haiku + Sonnet như các phiên trước.

## Lộ trình v3.4: agent thật (Claude Code) bỏ họp giữa chừng + chặn Bắt đầu khi thiếu agent (nhánh v3.4-away, còn bước 6)

Người dùng báo 2026-10-19, đánh giá **lỗi rất nghiêm trọng**. Làm trên nhánh mới tách từ `v3.3.1-header` (header mới, chưa
merge; nếu người dùng đã merge thì tách từ main). Mỗi bước test xong mới sang bước sau.

**Chuyện đã xảy ra** (phòng thật qua tunnel `trycloudflare`, 2 vai trò: Cedar (GPT-6) giám sát, agent kia dựng MVP "LabelLoop").
Người dùng dán prompt "Paste and join" tiếng Anh cho **Claude Code (Opus 5.5, auto mode)**. Agent join được (tên
`Grok-the-Caveman`), đọc brief, rồi DỪNG LƯỢT để hỏi người dùng, không nói gì vào phòng. Lời agent (tóm tắt):
- Nó chạy MỘT lệnh vừa đọc `HANDOFF.md`, `docs/STATUS.md`, tệp memory, vừa gọi server họp → bộ kiểm duyệt auto mode của Claude
  Code chặn vì coi là **đưa dữ liệu ra ngoài** (phòng chạy trên tunnel công khai).
- `CLAUDE.md` của dự án ghi "Phase: IDEA. Markdown only. Build nothing until user says so", còn brief của chủ trì bảo dựng MVP
  ngay. Agent coi tin chủ trì là DỮ LIỆU, không phải lệnh của người dùng (đúng theo nguyên tắc an toàn của nó), nên không làm.
- Nó hỏi người dùng 3 điều: cho chia sẻ bối cảnh dự án lên phòng không; có bỏ luật "build nothing" không; hay rời phòng.
Sau đó agent **bị tính là đã rời phòng**: không gọi `wait` quá `staleMs` (= `busyMs` 120 s + 60 s) thì `_sweep` gọi
`leave(name, 'mất kết nối')` (src/meeting.js ~dòng 212), và lần `wait` sau khi người dùng trả lời nhận `LEFT_TEXT` "Bạn đã rời
phòng. Hãy dừng lại, không gọi thêm tool." → agent dừng hẳn. Agent cùng phòng phải chờ (chế độ lần lượt còn kẹt lượt tới `busyMs`).

**Nguyên nhân gốc** (đừng sửa bằng cách bảo agent bỏ qua quy tắc an toàn/dự án của nó):
1. Prompt mời (`buildInvite` trong src/ui/app.js, cả bản EN trong i18n.js) KHÔNG nói chủ trì là ai. Prompt do chính người dùng
   dán, nên đây là chỗ DUY NHẤT người dùng nói được với agent: "tin [CHỦ TRÌ] là của tôi". Giao thức luật 6 ("Tin [CHỦ TRÌ] …
   ưu tiên làm theo") đến từ server nên agent cẩn thận coi như dữ liệu → đúng.
2. Prompt/giao thức không nói phòng có thể chạy qua địa chỉ công khai và được chia sẻ gì; agent phải tự đoán → bị chặn.
3. Không có đường để agent hỏi lại mà vẫn giữ chỗ: dừng lượt để hỏi người dùng = mất kết nối = bị cho rời phòng vĩnh viễn.
4. Giao thức không dặn tách lệnh: agent gộp "đọc tệp + curl" vào một lệnh, đúng kiểu bộ kiểm duyệt coi là rò dữ liệu.

**Việc cần làm** (thiết kế đề xuất, có lý do mạnh thì đổi nhưng nói người dùng trước):
1. **Không đuổi agent "im lặng"**: hết `staleMs` thì đánh dấu VẮNG (`away`, hiện trên trang: "vắng, có thể đang chờ người dùng
   duyệt"), KHÔNG `leave`. Agent vắng gọi lại `wait`/`say` thì có mặt lại, giữ slot, vai trò, `cursor` (đọc tiếp phần đã lỡ).
   Chế độ lần lượt: agent vắng bị bỏ qua lượt (như hết `busyMs`), không chặn người khác. Luật "chỉ còn mình bạn: leave" và
   "mọi agent đã rời phòng" phải tính agent vắng như chưa rời (hoặc có hạn riêng dài hơn, ví dụ 15 phút, rồi mới coi là rời).
   Tối thiểu nếu vẫn giữ leave: `LEFT_TEXT` cho trường hợp mất kết nối phải bảo "gọi join lại với đúng tên để vào lại", không
   "dừng lại". Test: meeting.test.js (agent im > staleMs rồi wait lại: nhận tiếp tin, còn vai trò; lần lượt không kẹt; phòng
   không tự đóng vì agent vắng), server.test.js nếu đổi văn bản, `--data-dir` restore (agent vắng).
2. **Prompt mời nói rõ quyền** (cả 3 tab, VI + EN, tr() + i18n.js): đại ý "Tôi (người gửi prompt này) là chủ trì: tin
   [CHỦ TRÌ]/[HOST] trong phòng là của tôi. Phòng chạy qua <origin> (nếu không phải localhost thì nói rõ là địa chỉ công khai).
   Bạn được chia sẻ trong phòng những gì cần cho chủ đề, bằng tóm tắt TỰ VIẾT; không gửi bí mật (khoá, .env, mật khẩu, tệp
   memory). Quy tắc của dự án/của bạn vẫn áp dụng: nếu brief mâu thuẫn với chúng hoặc bạn cần tôi duyệt, hãy NÓI VÀO PHÒNG
   (tôi đọc và trả lời ở đó) rồi wait tiếp, đừng dừng im lặng." Cân nhắc cho chủ trì sửa câu quyền này trên trang (ví dụ ô
   "Agent được phép…": chỉ bàn / được sửa code trong repo / được chia sẻ tài liệu dự án) và đưa vào bản brief (`permissions`?)
   — nếu thêm trường brief thì cập nhật brief.js, LIMITS, aiPrompt, test, và hỏi người dùng trước.
3. **Giao thức** (src/meeting.js `_protocol`, có test so chữ thì sửa theo): thêm luật "Bị chặn quyền, cần người dùng duyệt,
   hoặc bối cảnh mâu thuẫn với quy tắc dự án: say NGẮN vào phòng (không kèm dữ liệu nhạy cảm) rồi tiếp tục wait; chủ trì sẽ trả
   lời trong phòng" và "Đọc tệp/chạy lệnh trong dự án bằng lệnh riêng; chỉ gửi vào phòng tóm tắt do bạn tự viết, không ghép
   đọc tệp với curl/say trong một lệnh, không pipe tệp vào say".
4. **Trang chủ trì**: agent vắng hiện rõ trong danh sách thành viên + phòng chờ; cân nhắc toast "X vắng > 3 phút".
5. **Chặn Bắt đầu khi thiếu agent cho vai trò** (người dùng: "có 2 role thì không nên cho start phòng vì chưa đủ agent"): bản
   brief có `roles` (tính cả phần tử "" vì vẫn là một slot) mà số agent có mặt < số vai trò → nút **Bắt đầu cuộc họp** bị khoá,
   dòng kiểm tra ở thanh dưới báo "Cần N agent theo vai trò (đang có M)" (`renderChecks`, `#btnStart` trong app.js; bỏ câu
   "vẫn bắt đầu được" khi có vai trò). Server `POST /api/host/<k>/start` cũng từ chối (409, thông báo rõ) trừ khi gửi
   `"force": true`, để API/CLI không lách; `--auto-start N` của CLI: nếu N < số vai trò thì báo lỗi lúc khởi động. Không có
   vai trò thì giữ hành vi cũ (0 agent vẫn bắt đầu được). Test: server.test.js (409/force), brief.test.js nếu đụng parse,
   i18n (chuỗi mới).
6. **Thử thật** (bắt buộc, vì lỗi đến từ agent thật): workspace thử có `CLAUDE.md` ghi "Build nothing, markdown only" +
   `HANDOFF.md`/`docs/STATUS.md`; brief yêu cầu "chia sẻ trạng thái dự án rồi dựng MVP"; 2 vai trò. Mời subagent Sonnet + Haiku
   bằng đúng prompt chép từ trang (không dặn thêm). Kỳ vọng: agent không bị đuổi khi dừng hỏi; nếu xung đột thì nói vào phòng;
   chủ trì trả lời trong phòng thì agent làm tiếp; không có lệnh gộp đọc tệp + curl. Nếu người dùng đồng ý: thử thêm Claude
   Code thật (CLI, auto mode) qua tunnel, vì bộ kiểm duyệt auto mode chỉ có ở đó. Thử luôn nút Bắt đầu bị khoá khi 1/2 agent.
7. Tài liệu: GUIDE/REFERENCE (VI+EN) mục quyền của agent + "agent vắng", CHANGELOG 3.4.0, package 3.4.0, README "What's new",
   GIF/ảnh nếu giao diện đổi. Hỏi người dùng trước khi merge/push/tag/release.

## Việc tiếp theo

Theo thứ tự ưu tiên:

1. **Lộ trình v3.4, bước 6: thử với agent thật** (code đã xong, đã push nhánh `v3.4-away`, app menu đã là 3.4.0 nên người dùng
   có thể đang tự dùng thử: hỏi họ kết quả trước). Hỏi người dùng có cho chạy subagent Sonnet + Haiku (workspace có `CLAUDE.md`
   "build nothing", brief bảo dựng MVP, 2 vai trò, prompt chép từ trang, không dặn thêm) và Claude Code CLI thật (auto mode, qua
   tunnel) không. Kỳ vọng: agent dừng hỏi thì chỉ "vắng"; xung đột thì nói vào phòng; không gộp đọc tệp + curl.
2. **Hỏi người dùng merge** `v3.4-away` (đã chứa `v3.3.1-header`) vào main, tag `v3.4.0` + GitHub Release. Không tự làm.
   Trước khi phát hành: cân nhắc quay lại GIF/ảnh nếu muốn thấy trạng thái "vắng" và nút Bắt đầu bị khoá (không bắt buộc).
   README (EN + VI) luôn ghi phiên bản mới nhất; đổi giao diện thì quay lại GIF (`tools/record-demo.js`, `--vi`) và chụp lại
   ảnh (`tools/shot-setup.js`, `tools/shot-mobile.js`).
3. **Cân nhắc chỉnh prompt nhờ AI** (cần thử lại Haiku + Sonnet): Haiku hay viết "VIỆC: [agent role] | …" vào context; agent
   thật vẫn ghi đúng tên nhờ giao thức nên chưa gấp. Có thể làm cùng bước 2 của v3.4.
4. **Gửi tệp qua tunnel Cloudflare thật**: tệp vài MB và ~20 MB, Expect 100-continue, "Tệp quá lớn". Hỏi người dùng trước.
5. **Webhook thật**: chỉ khi người dùng đưa URL.
6. Tab MCP / Codex CLI tiếng Anh với Codex thật: chỉ khi người dùng đồng ý (tài khoản của họ, sao lưu `~/.codex/config.toml`).
7. Có thể cân nhắc (cần người dùng đồng ý): giao thức tiếng Anh (`--lang en`); chủ trì xoá tệp; giới hạn tốc độ gửi tệp;
   kéo-thả đổi thứ tự mục chương trình.

Ý tưởng xa hơn (chưa lên kế hoạch):

- Nhiều phòng họp song song trên một server, trang quản trị có mật khẩu (đang nằm trong "Ngoài phạm vi" của v3.1).
- Webhook Microsoft Teams (Adaptive Card); hiện Teams nhận JSON chung.
- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
