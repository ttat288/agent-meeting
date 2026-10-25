# Bàn giao hiện tại — Agent Meeting

Đọc cùng [AGENTS.md](../AGENTS.md). Đây là điểm vào chuẩn; chỉ đọc tài liệu bổ sung theo công việc. Lịch sử được giữ nguyên trong [archive](HANDOFF-archive-2026-10-24.md), không cần nạp toàn bộ.

## Trạng thái và việc tiếp theo

- Người dùng là **giám đốc**, agent là **PM**; PM tự phân tích, triển khai và kiểm chứng trong phạm vi đã giao. Không tự biến backlog thành yêu cầu.
- Hai lát cắt đã đạt điểm dừng: **J47 điều hướng tổng hợp công việc** và **nhất quán ngôn ngữ trên hành trình công khai**. Kế hoạch/Thực hiện/Kết quả có tổng hợp trạng thái, status rail và vùng điều khiển; mục có số lớn hơn0 dẫn bằng chuột/bàn phím tới card đầu tiên đúng nhóm, mục0 là nội dung tĩnh. Hợp đồng dữ liệu, route, thứ tự và mutation giữ nguyên.
- README/Showcase/Reference và từ điển UI tiếng Anh không còn giải thích hoặc hiển thị từ khóa tiếng Việt. Parser nhận đủ `CONCLUSION`, `TASK`, `ITEM DONE`, `TASK PROGRESS` và vẫn tương thích ngược với marker Việt. Guard mới chặn tiếng Việt lọt lại vào ba tài liệu sản phẩm tiếng Anh cùng toàn bộ giá trị dịch UI tiếng Anh.
- Kiểm hiện tại: helper J47 4/4; language/parser 10/10; full `npm test` đạt (511 test sau khi thêm 3 guard/ca parser, 45 file); `git diff --check` đạt. Browser fixture J47 cô lập 8 ca VI/EN×sáng/tối×375/1280 xác nhận Tab/Enter, focus ring, đúng task đầu tiên, không tràn ngang, thứ tự và `tasks/runs` không đổi; 0 model call. Đây là self-review/fixture, chưa phải người dùng nghiệm thu hoặc bằng chứng giảm thời gian người thật.
- **Không có nhiệm vụ phát triển tiếp theo đã được giao.** Phiên mới nạp context, kiểm Git chỉ đọc khi cần, xác nhận ngắn rồi chờ. Không tự mở filter, sắp xếp, i18n giao thức agent, adapter/model/admin hoặc backlog.

## Workspace và ranh giới quyền

- Nhánh `codex/2026-10-22-product-hardening`; baseline trước hai lát cắt là `fcdbe0120f429382ea2f6104127936ded212578f`. Toàn bộ J47, sửa nhất quán ngôn ngữ, test và tài liệu đã commit tại `8e3e15114fc39b6fcc9f480f096933b2a7522350` (`Improve work overview and language consistency`) và push thành công lên `origin/codex/2026-10-22-product-hardening` ngày 2026-10-25.
- Quyền commit/push cho yêu cầu này đã dùng xong; không suy rộng sang pull/merge/rebase/release hoặc sửa remote/OAuth/CA/settings global. Không reset/clean hoặc hoàn tác thay đổi không liên quan. Preview/receipt trong `/tmp` có thể đã mất; không mặc định dịch vụ/cổng cũ còn chạy.
- Node>=18, không dependency runtime ngoài; UI HTML/CSS/JS thuần, không build. Giữ CSP, VI/EN, theme theo hệ thống, responsive và bàn phím. Công cụ/skill local không tự thành dependency sản phẩm.

## Quyết định phải giữ

- Lõi `src/meeting.js` độc lập HTTP; server ở `src/server.js`; `src/brief.js` là nguồn parse/normalize brief dùng chung; `src/work.js` quản lý task/run/verify/integrate. UI ở `src/ui/`; test dùng `node:test`.
- Giữ long-poll, không tự đổi sang SSE/WebSocket; `wait` khoảng50giây. Tách `hostKey` điều khiển và agent ID tham gia; “Cuộc họp mới” giữ agent ID. Dữ liệu phòng mặc định ở bộ nhớ; persistence chỉ khi bật, `--data-dir` yêu cầu fixed host key, file nhạy cảm0600.
- Giữ ID/trạng thái xuyên hội thoại→task→run→evidence. Run evidence thuộc requirement snapshot đã dispatch; `reported` khác `verified`, khác `integrated` và khác human acceptance. Không thay snapshot thiếu bằng yêu cầu hiện tại; run không xác định revision không được mutate/nghiệm thu.
- WORK/ENDED/carry, phân tích KẾT LUẬN/VIỆC, file transfer, brief/draft và i18n có hợp đồng chi tiết ở [quyết định kiến trúc](HANDOFF-archive-2026-10-24.md#kiến-trúc). **Trước khi sửa các phần này, đọc đúng mục đó**, cùng [hợp đồng hành trình](CONSISTENCY-JOURNEYS.vi.md); không bỏ việc cũ khi có kết luận mới, không tái dùng task sequence. File bytes đi ngoài tin nhắn/model context; metadata/hash và kiểm quyền vẫn bắt buộc.
- Runtime quản lý hiện có: Claude hỗ trợ writing với integration tự động **một file**, filesystem write isolation Linux/bwrap; không claim read/network isolation. agy adapter vẫn chặn `write:true` và task-context MCP. Mọi agy model call qua runtime, kể cả readonly/probe, cần bwrap vì plan flags đã cho native edit trong fixture thật; thiếu boundary phải fail closed.
- `agy` khác `gemini`; lỗi OAuth/UNSUPPORTED_CLIENT của Gemini không chứng minh agy hỏng. Được chủ động dùng agy requested `gemini-3.8-flash-low` cho việc phù hợp trong quyền đã giao; không đổi model/provider/ngân sách âm thầm. Đọc [workflow Gemini/agy](GEMINI-WORKFLOW.vi.md) và [routing](ROUTING-WORKFLOW.vi.md) trước khi dùng/giao việc. CLI chạy được không chứng minh actual model: mọi lượt thật ca mới nhất vẫn unknown; không fake identity hoặc gỡ guard để mở managed run.
- Skill theo task chỉ direct local managed Claude: required supplied, optional lookup với grant riêng; pin/hash/source guard; remote/team-swap/agy chưa hỗ trợ policy. `supplied` không chứng minh `applied/compliant`; UI chưa có policy editor. Caveman chỉ mẫu local để review, không cài/hook/persistence mặc định; CodeGraph chưa xác nhận runtime/index hoạt động. Chi tiết trong AGENTS và evidence task-skills.

## Kết quả local gần nhất và bằng chứng

J47 xử lý khả năng quét S04–S06: bỏ tổng số mơ hồ ở title, thêm tổng hợp theo hành động, status rail và gom footer thành vùng điều khiển. Summary có đích dùng button với nhãn VI/EN, giữ thứ tự Tab theo thị giác rồi focus/scroll tới card `tabindex=-1`; summary0 dùng span không giả disabled action. Thiết kế dùng token hiện có, nhãn chữ vẫn mang nghĩa, mobile control44px; không thêm framework/CDN/palette. Đặc tả và giới hạn ở [J47](CONSISTENCY-JOURNEYS.vi.md#j47--quét-nhanh-trạng-thái-kế-hoạch--thực-hiện--kết-quả-2026-10-24); test mới đọc helper production thay vì chép logic.

Lát cắt ngôn ngữ loại bỏ pain point người đọc README tiếng Anh phải thấy marker Việt rồi đọc thêm câu giải nghĩa. README tiếng Anh dùng marker Anh trực tiếp với snapshot main có thể tái lập; README Việt dùng nội dung mẫu Việt. Showcase/Reference, quick prompt, empty state và prompt nhờ AI đồng bộ. Parser aliases giữ tương thích dữ liệu; không lọc, ẩn, đổi thứ tự hay mutation task. Giao thức vận chuyển agent `join/wait` và một số tài liệu vận hành vẫn là tiếng Việt thuần vì contract chưa có locale; chưa tuyên bố quốc tế hoá end-to-end.

Preview tạm cổng3137 đã dừng; dữ liệu `/tmp` không phải artifact bền vững.

Đã sửa sáu điểm: **handoff lịch sử**, **permission bits integration/rollback dưới umask077**, **rebase stale/nguồn đổi trước ghi**, **recovery lỗi actual identity**, **mutator run thiếu revision**, **filesystem boundary cho agy readonly/probe**. Success và lỗi/phục hồi gồm restart, missing/restore source, canonical redirect, stale revision, explicit new attempt cùng task và rollback conflict đã kiểm.

- Source tích hợp: **504/504 tests,44file**, Node22.22.1/Linux,108.365s; API handoff9/9 và runtime/boundary21. Browser fixture **48 ca bố cục** VI/EN×sáng/tối×375/768/1280 cộng legacy409→reload→Run mới→verify→integrate, Back/reload/deep link;0 model calls. Gói local70file:95 kiểm trên bản đã giải nén; bản seal cuối chỉ đổi CHANGELOG, mã/assets/README khớp byte. Không publish; CI Node18/20/22 và human UX mới chưa chạy.
- [ACCEPTANCE ca mới nhất](evidence/value-journey/ACCEPTANCE.vi.md): failure→diagnostic→repair, task quyền file độc lập, native direct có biên ghi và trial che lời giải; giữ các thất bại và PM correction. Product API/probe thật vẫn Run409 vì actual identity unknown; không có completed native managed arm để so cùng chất lượng/chi phí. **Wow factor, tiết kiệm billing/thời gian người thật và lợi ích ròng so direct chưa chứng minh.** Khuyến nghị hiện tại: dùng agy trực tiếp cho sửa nhỏ với kiểm độc lập, giữ managed guards.
- Usage riêng ca:19 CLI calls,690090input+21712output=711802 CLI total;2770449 cache-read riêng, thinking0 được báo. Sum latency574.841s có song song, không là elapsed ca;675334 prompt UTF-8bytes không là token. PM/hidden context/billing/human time/maintenance unknown. Không cộng số ca cũ hoặc bỏ fail/retry khỏi overhead.
- Receipts: [verification](evidence/value-journey/verification.json), [model calls](evidence/value-journey/model-calls.json), [overhead](evidence/value-journey/overhead.json), [source hashes](evidence/value-journey/source-freeze.json), [preservation](evidence/value-journey/preservation.json), [browser](evidence/value-journey/browser/browser.json), [gói seal](evidence/value-journey/package-verification-sealed.json). Hash source gắn snapshot đã kiểm, không phải cam kết CI hiện tại.
- README Anh/Việt và showcase đã thu hẹp lời hứa managed adapter;91 link/anchor local đạt. Fresh remote clone **chưa xác minh** do TLS fail/web fallback không truy cập được; không bypass cert hoặc sửa CA/auth. Media/scripted fixtures không thành demo model-native. README tiếng Anh là bản chính, tiếng Việt song song.
- Ca trước: [readiness/recovery](evidence/readiness-recovery/ACCEPTANCE.vi.md), [task skills](evidence/task-skills/ACCEPTANCE.vi.md), [UI v2](evidence/ui-v2/ACCEPTANCE.vi.md). Số test/cost/clock cũ chỉ áp dụng snapshot lúc đó; không phủ lên source mới.

## Đọc thêm theo nhiệm vụ và kiểm chứng

| Công việc được giao | Đọc trước phần liên quan |
| --- | --- |
| Mã/bảo mật/API/thực thi | [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md), [SECURITY-DESIGN](SECURITY-DESIGN.md); contract/routing theo module |
| UI/UX | [HANDOFF-ui-reform](HANDOFF-ui-reform.vi.md), [CONSISTENCY-JOURNEYS](CONSISTENCY-JOURNEYS.vi.md); skill ui-ux-pro-max và tokens/layout/behavior/i18n hiện có theo AGENTS. Giữ screen pool/flow/test matrix; test xanh không thay nghiệm thu thiết kế |
| Tính nhất quán/liên kết dữ liệu | [HANDOFF-consistency](HANDOFF-consistency.vi.md), [CONSISTENCY-JOURNEYS](CONSISTENCY-JOURNEYS.vi.md); phân biệt mục lịch sử và cập nhật mới |
| Quy trình lõi/carry/files/brief/i18n hoặc bẫy dev | [Kiến trúc](HANDOFF-archive-2026-10-24.md#kiến-trúc), [Cách làm việc / kiểm thử](HANDOFF-archive-2026-10-24.md#cách-làm-việc--kiểm-thử), source/tests tương ứng; lệnh cài/settings/model trong lịch sử không tự cấp quyền |
| Giá trị sản phẩm/README/showcase | ACCEPTANCE ca mới nhất và [SHOWCASE](SHOWCASE.md); dùng skill product-readme khi sửa README. So với direct CLI cùng nhiệm vụ/chất lượng, công khai unknown/overhead |
| Truy nguyên ca cũ | Tìm heading/từ khóa trong [archive](HANDOFF-archive-2026-10-24.md) bằng `rg -n`, rồi đọc đoạn cần; không nạp toàn bộ theo mặc định |

Full regression khi thay production source, theo giới hạn đã có:

```bash
systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test
```

Kiểm phù hợp phần đổi trước; không lặp test/model vô cớ. Preview dùng loopback/temp/cổng riêng, không mặc định restart dịch vụ cũ; UI assets được nạp lúc server khởi động. Trước thử model/protocol thật phải theo đúng phạm vi/quyền và workflow. Cuối việc báo pain point đã xử lý, bằng chứng, giới hạn và bước tiếp ai làm.

## Duy trì bàn giao gọn

Cập nhật các mục hiện tại thay vì nối nhật ký mỗi ca. Giữ đây là điểm vào duy nhất, mục tiêu khoảng1–2nghìn từ; chi tiết/failure/log/hash nằm ở evidence hoặc archive và được dẫn đúng chỗ. Không xóa/thay bằng chứng cũ, không tự nâng kết quả fixture/review thành human acceptance. Khi archive thêm, giữ nguyên nội dung cũ và đường dẫn tương đối; kiểm liên kết, ràng buộc và đường tiếp tục trước khi chốt. Lần rút này chỉ đổi tài liệu, không đổi source/runtime/quyền và không chạy lại tests/model.
