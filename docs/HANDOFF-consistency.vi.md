# Bàn giao ưu tiên: thống nhất sản phẩm và quy trình phát triển

Ngày 2026-10-21. Đây là việc cần làm đầu tiên ở phiên kế tiếp, trước backlog mở rộng routing/worker.

## Yêu cầu mới nhất của người dùng

Người dùng thấy `/m/<key>/workspace` tái hiện chức năng đã có ở `/m/<key>`, tính năng rời rạc và quy trình phát triển chưa ổn. Yêu cầu bàn giao cho phiên tiếp theo sửa tính nhất quán, tự cải thiện cách làm, hiểu use case, screen flow và screen pool để kiểm thử UI khả thi hơn.

Phiên bàn giao này chỉ cập nhật tài liệu/hướng dẫn; **chưa sửa sự không nhất quán trong ứng dụng**. Không tạo chat mới, không commit/push/release.

## Vấn đề cần giải quyết

- Trang phòng cũ có brief, mời agent, hội thoại, quyết định, việc và tiến độ trong `Meeting` (`src/meeting.js`).
- Trang workspace mới có form mục tiêu, task/run, kiểm chứng và tích hợp trong `WorkManager` (`src/work.js`); giao diện `src/ui/workspace.*` độc lập với `src/ui/index.html`, `app.js`, `app.css`, `i18n.js`.
- Hai nơi chưa dùng chung mô hình công việc. Người dùng phải nhập mục tiêu lại, quyết định không tự nối sang kế hoạch thực hiện, trạng thái việc có thể lệch nhau. Thêm link giữa hai trang không giải quyết nguyên nhân này.
- Luồng mới ưu tiên chứng minh từng module/backend và CLI, chưa chứng minh trải nghiệm xuyên suốt. 226 test kỹ thuật và ảnh responsive trước đây không chứng minh sản phẩm đã thống nhất. Chặng C/D chưa được nghiệm thu về tính liên tục của hành trình.
- Kế hoạch gốc đã yêu cầu cùng dữ liệu, khác cách hiển thị; không duy trì hai bảng việc độc lập. Đọc lại `PLAN-routing-workspaces.vi.md` và `VISION.vi.md` trước khi thiết kế giải pháp.

## Cách bắt đầu phiên sau

1. Đọc `HANDOFF.md`, tài liệu này, `AGENTS.md`, `IMPLEMENTATION-STATUS.vi.md`, PLAN, VISION; kiểm tra Git status. Working tree có nhiều thay đổi chưa commit và cả thay đổi của người dùng; không reset/clean hoặc viết lại toàn bộ.
2. Kiểm kê code và mở cả phòng cũ/workspace/admin trên cùng một phiên. Ghi hiện trạng có bằng chứng; đừng chỉ thiết kế từ trí nhớ hoặc ảnh chụp.
3. Trước khi sửa UI, đọc skill `ui-ux-pro-max` và design system đang có trong `src/ui/app.css`; đọc cấu trúc/hành vi/bản dịch hiện tại. Giữ HTML/CSS/JS thuần, CSP, VI/EN, sáng/tối và ranh giới quyền. Chưa chọn palette/framework mới.
4. Viết use case, screen pool, screen flow, bảng trạng thái và ma trận test vào tài liệu có phiên bản trong repo. Phân biệt rõ hiện trạng, thiết kế đích và phần chưa hỗ trợ. Đây là đầu vào để triển khai và review, không phải tài liệu bổ sung sau khi code xong.
5. Chọn một lát cắt xuyên suốt, sửa cả dữ liệu/API/UI cần thiết, kiểm thử trên source tích hợp rồi mới mở rộng. Không xây thêm màn độc lập theo từng module backend.

## Use case tối thiểu cần đặc tả

Mỗi use case có actor, mục tiêu, điều kiện đầu vào, bước chính, nhánh lỗi/khôi phục, dữ liệu đọc/ghi, điều kiện thành công và bằng chứng nghiệm thu.

| ID | Nhu cầu | Điều cần chứng minh |
|---|---|---|
| UC01 | Chủ trì chỉ thảo luận với agent được mời | Nhập bối cảnh một lần, mời/thảo luận/chốt quyết định; không bắt cấu hình repo/runtime chạy code |
| UC02 | Lập kế hoạch từ cùng hội thoại | Giữ nguồn quyết định, task ID, tiêu chí nghiệm thu và phụ thuộc; không chép lại mục tiêu vào bảng khác |
| UC03 | Thực hiện local từ kế hoạch đã chốt | Chọn task có sẵn, bổ sung quyền/workspace còn thiếu đúng lúc; run gắn đúng task và revision |
| UC04 | Xem và nghiệm thu kết quả | Đi từ task tới run/artifact/test và quay lại đúng hội thoại; reported/verified/integrated có nghĩa nhất quán |
| UC05 | Đổi yêu cầu hoặc xử lý lỗi giữa chừng | Cancel/stale/conflict/interrupted hiển thị đúng; kết quả cũ không làm hoàn tất yêu cầu mới; khả năng chưa có phải được ghi rõ |
| UC06 | Cấu hình hệ thống rồi quay lại phiên | Admin lưu/probe dùng chung nguồn với routing; quay về giữ ngữ cảnh và bản nháp, không tự chạy task |
| UC07 | Tiếp tục phiên cũ | Reload, Back/Forward, deep link và restart theo chế độ persistence đã cấu hình không tạo việc trùng hoặc báo mất dữ liệu sai |
| UC08 | Remote hoặc mixed | Cùng task/run UI, thêm host/lease/provenance; không nhân đôi workflow; kết quả remote chưa kiểm chứng giữ đúng nhãn |

Ba trục mục đích (discuss/plan/execute), vị trí (local/remote/mixed), quản lý (invited/managed/mixed) độc lập. Lập bảng khả năng hỗ trợ từng tổ hợp; không cần thử mọi tích Descartes, nhưng phải có happy path và nhánh từ chối cho từng ràng buộc thực sự khác nhau.

## Screen pool và screen flow phải có

Screen pool là danh mục màn/view/state, không phải yêu cầu tạo từng URL riêng. Với mỗi mục: ID ổn định, mục đích, actor/quyền, route hoặc state hiện tại/đích, điểm vào/ra, nguồn dữ liệu, hành động chính, trạng thái empty/loading/error/blocked/active/completed, hành vi reload/back và use case liên quan. Cả dialog/drawer quan trọng cũng cần liên kết với màn cha.

Danh mục khởi đầu để kiểm chứng và chỉnh theo code:

| ID | Nhóm màn/view | Trách nhiệm |
|---|---|---|
| S01 | Bối cảnh/khởi tạo phiên | Mục tiêu và bản nháp duy nhất |
| S02 | Mời agent/chuẩn bị | Thành viên, vai trò, quyền và readiness |
| S03 | Hội thoại/quyết định | Bối cảnh, trao đổi và nguồn quyết định |
| S04 | Kế hoạch/công việc | Task chung, phụ thuộc, tiêu chí và revision |
| S05 | Thực hiện/chi tiết run | Readiness, dispatch, tiến độ, hủy và phục hồi |
| S06 | Kết quả/bằng chứng/bàn giao | Artifact, kiểm chứng, tích hợp và truy vết |
| S07 | Quản trị | Model, routing, runtime, host, cấu hình; quay về phiên đang làm |

Định hướng đã trao đổi: `/m/<key>` là điểm vào chính; Hội thoại → Kế hoạch → Thực hiện → Kết quả là các view cùng phiên, dùng chung dữ liệu. Admin riêng. `/workspace` trở thành đường dẫn tương thích/view nội bộ nếu còn cần; phải quyết định và test cách xử lý deep link cũ. Chưa chốt chi tiết tab/route; không coi sơ đồ này là trạng thái ứng dụng đã có.

Vẽ flow cho UC01 và UC02→UC03→UC04, kèm vòng đổi yêu cầu, lỗi readiness, test fail, conflict, cancel và quay từ admin. Mỗi mũi tên ghi hành động/điều kiện và dữ liệu được giữ. LOBBY/LIVE/WORK/ENDED của phòng và lifecycle task/run khác nhau: lập bảng ánh xạ, không ép chúng thành một trạng thái duy nhất.

## Hợp nhất dữ liệu trước khi che bằng UI

- Kiểm kê `Meeting.tasks`, `WorkManager.tasks/runs`, quyết định, brief, room renewal/carry và persistence hiện tại. Chọn nguồn chuẩn cho từng thực thể, ID/liên kết và quy tắc chuyển đổi rõ ràng.
- Không mặc định task số cũ bằng UUID mới; cần mapping/migration hoặc adapter có kiểm chứng và idempotency. Xử lý duplicate, reload/restart và dữ liệu đã có; không xóa lịch sử để làm demo sạch.
- Phân biệt task được agent báo tiến độ thủ công với run có test/tích hợp thật. `done` từ lời báo không tự trở thành `verified` hoặc `integrated`.
- Quyết định phải truy được nguồn hội thoại; task/run giữ yêu cầu/config snapshot phù hợp. Chốt hành vi revise/supersede trước khi cho sửa mục tiêu đang chạy.
- Giữ hai token host/agent; execution không thêm vào allowlist tool hội thoại. Admin local-only hiện tại không bị nới khi hợp nhất điều hướng.
- Nhãn, ngôn ngữ, theme, feedback lỗi, draft và đường quay lại dùng quy ước chung; tránh giữ hai hệ thống UI chỉ giống màu.

## Ma trận kiểm thử và cửa nghiệm thu

Ma trận tối thiểu: `use case → screen/state → bước và dữ liệu đầu vào → kết quả UI → assertion API/state → bằng chứng → pass/fail/blocked`. Mỗi lỗi có bước tái hiện; screenshot riêng lẻ không thay thế kiểm tra chuyển màn và dữ liệu.

1. Từ mục tiêu đến quyết định/kế hoạch/thực hiện/kết quả trong cùng phiên, không nhập lại mục tiêu hoặc tạo task trùng. ID và trạng thái trên mọi view khớp nguồn chuẩn.
2. UC01 hoàn thành mà không yêu cầu workspace/model execution. Agent mời bên ngoài vẫn join/wait/say/progress và xem biên bản như trước.
3. Một task local thật đi hết đường có thể hỗ trợ: readiness → run → kiểm chứng → tích hợp → evidence; UI phản ánh đúng backend. Không lấy mock hoặc lời agent nói làm bằng chứng nghiệm thu sản phẩm.
4. Reload/Back/Forward/deep link giữ đúng phiên/view/draft theo đặc tả; admin quay về đúng chỗ. Skill đã tra: Back Button yêu cầu giữ navigation history; kết quả Sticky Navigation chỉ áp dụng nếu có thanh cố định che nội dung.
5. Thử validation, unavailable runtime, failed test, stale config/source, cancel và interrupted theo phạm vi sửa. Tình huống chưa hỗ trợ hiển thị giới hạn và hành động khả thi, không nút giả hoặc fallback âm thầm.
6. Browser kiểm VI/EN, system/light/dark, bàn phím/focus, 375/768/1280, không tràn ngang và không lỗi console. Kiểm hành trình chính trong các điều kiện đại diện, không chỉ chụp từng màn trống.
7. Test hồi quy API/MCP/phòng cũ, persistence/migration và quyền theo phạm vi thay đổi; đọc CONTRIBUTING/SECURITY/SECURITY-DESIGN khi sửa phần liên quan. Chạy từng file với giới hạn bộ nhớ trong HANDOFF, không chạy suite không giới hạn (đã từng OOM).

Chỉ nghiệm thu khi ma trận có kết quả và bằng chứng cho hành trình đã chọn, dữ liệu nhất quán và giới hạn được công bố đúng. Không dùng số lượng test/module/màn làm thước đo hoàn thành use case.

## Cải thiện cách làm từ phiên sau

- Trước code: mục tiêu người dùng → use case → screen/data flow → tiêu chí nghiệm thu → phạm vi lát cắt. Mọi màn mới phải có vị trí trong screen pool và lý do không dùng view hiện có.
- Trước phân công: chia theo kết quả người dùng và hợp đồng dữ liệu đã thống nhất; worker có acceptance tích hợp, không chỉ danh sách file. Nếu dùng nhiều agent, writer có workspace riêng, tích hợp tuần tự và một người chịu trách nhiệm toàn hành trình.
- Sau mỗi lát cắt: kiểm luồng bằng browser trên bản tích hợp, ghi lỗi và nguyên nhân, sửa trước khi thêm tính năng. Cập nhật screen pool/flow/test cùng code.
- Khi bàn giao: ghi rõ phần chạy thật, phần mock/blocked, regression và quyết định còn mở. Cập nhật hướng dẫn khi phát hiện một lỗi quy trình lặp lại; không tự sửa catalog/routing theo cảm tính hoặc tự nhận cải thiện model vĩnh viễn.

## Mốc kỹ thuật để tiếp tục

- Toàn bộ triển khai hiện chưa commit; base Git `556b9f69c39a1b1dd6fb9cc71d1b9ddfe5798b47`. Xem `IMPLEMENTATION-STATUS.vi.md` cho module, CLI thật, artifact và giới hạn sandbox/remote.
- Evidence trước sửa: `docs/evidence/routing-implementation/`, 226/226 test trên 21 file. Đây là baseline kỹ thuật của phiên trước, không phải kết quả test của bản sửa tiếp theo.
- Preview cô lập: `http://127.0.0.1:3117/m/host_routing_preview_1234`, `/workspace`, `/admin`; dữ liệu `/tmp/am-preview-data/`, launcher thử `/tmp/am-preview.js`. Process/file `/tmp` có thể không còn ở phiên sau. Kiểm tra trước khi dùng; không đụng app người dùng ở cổng 3000 hoặc settings global.
- UI assets nạp khi server khởi động; sửa xong phải restart đúng preview. Không dùng normal CLI mù quáng vì có thể cập nhật rooms.json. Không cần gọi CLI trả phí để chỉ lập bản đồ màn; dùng quyền đã có khi kiểm thử thực thi thật cần thiết.
- Backlog revise/reconcile, review/multi-file, remote máy thứ hai và baseline routing vẫn giữ, nhưng đặt sau việc thống nhất hành trình/dữ liệu. Không tự mở rộng tiếp để né vấn đề UX đang chặn.

## Cập nhật sau triển khai (2026-10-21)

Phần mô tả “chưa sửa” phía trên là baseline trước phiên triển khai. Hợp đồng hành trình được viết trước code tại [CONSISTENCY-JOURNEYS.vi.md](CONSISTENCY-JOURNEYS.vi.md). Phòng và workspace hiện có chung page/view, task ID, nguồn, snapshot và revision; `/workspace` là redirect tương thích. Tiến độ khai báo được phân biệt rõ với execution. Carry cả phòng fixed và không fixed giữ kho kế hoạch; phòng cũ chặn ghi.

Xem [nghiệm thu và giới hạn](evidence/consistency/ACCEPTANCE.vi.md), không dùng số test hoặc ảnh riêng lẻ thay cho hành trình. Chưa commit/push/release. Ưu tiên kế tiếp là thử hành trình mới với model thật và kiểm nhánh remote bằng browser/worker khác máy, rồi revise/reconcile/review đa file theo backlog; không mở rộng màn riêng.

## Ưu tiên mới nhất sau phản hồi UI — 2026-10-21

Người dùng chưa chấp nhận UI hiện tại: nhiều chữ thừa, bố cục chưa gọn, chưa gom nhóm hợp lý, thiếu tách nền làm chức năng chìm và giống tiêu đề không có giá trị. Phiên sau phải cải cách UI theo [HANDOFF-ui-reform.vi.md](HANDOFF-ui-reform.vi.md), trước các việc model/remote được đề xuất ở mục cập nhật cũ phía trên. Giữ kết quả nối dữ liệu đã triển khai; chưa coi UI được nghiệm thu. Phiên ghi nhận này chỉ sửa tài liệu, không sửa ứng dụng hoặc commit/push.
