# Hành trình thống nhất — hợp đồng v1 (2026-10-21)

## Hiện trạng đã quan sát trước sửa

Browser trên preview 3117: phòng LOBBY có bối cảnh/mời agent; workspace có ô mục tiêu rỗng và một task riêng; admin có catalog revision 3. Phòng không biết task UUID; workspace không biết nguồn VIỆC. Đây là baseline lỗi, không phải nghiệm thu.

## Phạm vi và nguồn dữ liệu

Một trang `/m/<key>` với Hội thoại, Kế hoạch, Thực hiện, Kết quả; hash là view, giữ query ngôn ngữ. `/workspace` chuyển hướng tương thích sang `#plan`. Admin giữ riêng, có đường quay về hash trước đó.

Meeting là nguồn chuẩn bối cảnh, hội thoại, quyết định và tiến độ do agent tự báo. WorkManager là nguồn chuẩn task ID, yêu cầu execution, revision, run, bằng chứng. Adapter idempotent chiếu mỗi VIỆC thành một task, định danh ban đầu theo host + số + timestamp gốc; workKey nội bộ giữ cùng kho và UUID qua carry kể cả đổi mã phòng. Không suy số việc bằng UUID. Task hiện có không bị xoá. Việc biến mất được đánh dấu nguồn không còn hiện hành, giữ lịch sử; run đang chạy không được tích hợp nếu nguồn bị sửa/xoá. Không tự đồng bộ `done` thủ công thành `verified/integrated`. Task execution hoàn tất chỉ sau test và tích hợp. Thay nội dung VIỆC, người phụ trách hoặc bối cảnh tăng requirementRevision, bằng chứng cũ giữ lịch sử nhưng không được tích hợp. Nguồn chat dùng message seq và timestamp, giữ bối cảnh tại lúc lập task. Chưa tự sửa yêu cầu đang có run: phải hủy/xử lý run cũ trước.

## Use case

| ID | Actor, mục tiêu và điều kiện | Bước chính; dữ liệu đọc/ghi | Lỗi/khôi phục | Thành công/bằng chứng |
|---|---|---|---|---|
| UC01 | Chủ trì + invited agent; thảo luận; có host capability | S01 nhập brief một lần → S02 mời → S03 hội thoại/chốt; Meeting | Sai brief sửa tại chỗ; mất mạng long-poll retry | Không cần config/workspace/runtime; API hội thoại và browser |
| UC02 | Chủ trì; lập kế hoạch từ quyết định/VIỆC | S03 → S04; adapter ánh xạ VIỆC, nguồn chat, bối cảnh, UUID; bổ sung acceptance/dependencies | Reload không nhân đôi; sửa VIỆC tăng revision | Cùng task ID trong mọi view, quay về hội thoại nguồn |
| UC03 | Chủ trì local; thực hiện task đã có | S04 bổ sung acceptance, workspace, base, scope, tests → S05 chọn profile/chạy; không nhập lại mục tiêu | Thiếu profile/runtime/readiness trả lỗi và giữ form; không tự chạy sau lưu | Run đúng task/revision; fixture chạy thật không gọi model trả phí |
| UC04 | Chủ trì; nghiệm thu | S05 report → S06 test → tích hợp; xem artifact/handoff → S03 | Test fail/conflict giữ evidence, rebase rồi verify lại khi hợp lệ | Chỉ tích hợp thành công mới done; test trên source tích hợp |
| UC05 | Chủ trì/agent; thay yêu cầu, lỗi giữa chừng | Cập nhật VIỆC → revision mới; cancel; nguồn mất → chặn tích hợp | Interrupted chặn dispatch; chưa có reconcile tự động, hiển thị lỗi thực | Kết quả cũ không hoàn tất yêu cầu mới; assertions backend |
| UC06 | Chủ trì local; cấu hình rồi quay về | S04/S05/S06 → S07 → đúng hash cũ; draft lưu theo host/task/revision | CAS config conflict giữ draft admin theo hành vi hiện có; chưa hứa admin draft qua reload | URL quay về, task draft và ID giữ nguyên; không dispatch |
| UC07 | Chủ trì; tiếp tục | Back/Forward/reload/hash cũ; restart với dataDir + workDir | Không dataDir thì phòng không phục hồi; work history không bị xoá | ID không trùng qua đọc/restart/carry; browser navigation |
| UC08 | Chủ trì local + worker; remote/mixed | Cùng task/run card; thêm queue/lease/provenance hiện có | Không worker/profile → chặn; remote report chưa có verifier độc lập | Giữ nhãn reported; không tự coi accepted; regression API |

## Screen pool

Mọi view có loading/error/retry và empty; không thêm URL sản phẩm độc lập.

| ID | View, quyền, nguồn | Điểm vào/ra, trạng thái | Reload/Back |
|---|---|---|---|
| S01 | Brief, host; Meeting + local brief draft | Phòng LOBBY, empty/invalid/ready → S02 | `#boi-canh`, giữ draft cũ |
| S02 | Mời, host; thành viên/role/readiness | S01 → lobby/active → S03; drawer mời thuộc S03 | `#moi-agent`, Back về brief |
| S03 | Hội thoại, host; log/decisions/manual progress | S02 hoặc nav → active/WORK/ENDED → S04 | `#conversation`; log đầy đủ qua reload |
| S04 | Kế hoạch, host local; chung task + source | nav → empty/planned/stale; form cấu hình nằm trong card → S05 | `#plan`; draft theo task/revision |
| S05 | Thực hiện, host local; cùng task/run | nav → blocked/ready/running/cancelled/interrupted → S06 | `#execute`; refresh có chủ ý, không thay form đang sửa |
| S06 | Kết quả, host local; cùng task/run/evidence | nav → empty/reported/failed/verified/integrated → S03/S05 | `#results`; handoff/artifact giữ task ID |
| S07 | Admin, host local; ConfigStore/remote | nav ở S04–S06 → config/probe → view cũ | return hash được kiểm tra allowlist; giữ query lang |

## Flow và trạng thái

UC01: S01 --lưu brief→ S02 --start→ S03 --say/VIỆC→ quyết định và tiến độ. Không đi qua S07.

UC02–04: S03 --mở Kế hoạch, sync idempotent→ S04 --lưu yêu cầu cùng UUID→ S05 --chọn profile/run→ reported --verify→ S06 verified --integrate + test source→ done. Mọi cạnh giữ context/task/source ID; S06 --nguồn hội thoại→ S03.

Vòng lỗi: save validation → giữ draft; readiness error → cấu hình/probe S07 → S05; test fail → evidence + lần thử mới; source conflict → rebase → verify lại; cancel → cancelled; restart → interrupted (chưa có tự reconcile); sửa/xoá nguồn → chặn tích hợp kết quả cũ. Back/Forward chỉ đổi view, không tạo hoặc chạy task.

| Room | Task/run độc lập |
|---|---|
| LOBBY | Brief draft; task mang sang hoặc lịch sử giữ nguyên |
| LIVE | Có thể lập kế hoạch/thực hiện; không tự dispatch |
| WORK | Agent báo tiến độ manual; không thay kết quả verified |
| ENDED | Vẫn đọc task/run và kiểm chứng; không ép task thành done |

Khả năng: discuss/plan với invited local/remote/mixed giữ giao thức hiện có; execute local managed có adapter; execute remote/mixed managed/mixed qua worker hiện có, chỉ reported; execute invited do agent ngoài tự thực hiện và báo cáo, không tự cấp quyền process. Discuss/plan không tự chạy bất kể topology/management.

## Ma trận nghiệm thu (kết quả ghi trong evidence sau triển khai)

| Ca | UC/screen | Đầu vào/thao tác | UI kỳ vọng | Assertion dữ liệu |
|---|---|---|---|---|
| J01 | UC01 S01–03 | brief → start → say quyết định + VIỆC | Hội thoại dùng được độc lập | Không gọi runner/config bắt buộc |
| J02 | UC02 S03–04 | mở plan, refresh/reload | mục tiêu/VIỆC có sẵn, nguồn chat | Một UUID mỗi VIỆC; không duplicate |
| J03 | UC03 S04–05 | cấu hình task rồi run | Không nhập lại mục tiêu; run dưới task | taskId/revision đúng; scope/tests kiểm tra |
| J04 | UC04 S05–06 | real subprocess report/verify/integrate | Nhãn và evidence đúng; về nguồn | file/test source tích hợp đúng |
| J05 | UC05 S04–06 | sửa/xoá VIỆC sau run | revision/source stale hiện rõ | old run integration 409 |
| J06 | UC05 S05 | unavailable/test fail/cancel/interrupted/conflict | lỗi thực, không báo xong | state/evidence không bị nâng sai |
| J07 | UC06–07 | Back/Forward/reload/deep link/admin return | view/draft còn; không chạy ngầm | UUID/count/runner count không đổi |
| J08 | UC07 | restart/carry với persistence | lịch sử còn, source hiện hành đúng | deterministic mapping giữ UUID |
| J09 | UC08 | remote + forwarded request | reported/chặn quyền | host/agent/local boundary giữ nguyên |
| J10 | UC01–07 | VI/EN, system/light/dark, keyboard, 375/768/1280 | nhãn dịch/focus/không tràn | console/CSP sạch |

Quy trình: làm trực tiếp cho lát cắt này, không gọi worker trả phí. Nếu phân công sau: hợp đồng dữ liệu và ca nghiệm thu trên trước; writer workspace riêng; tích hợp tuần tự; kiểm browser trên source cuối. Bằng chứng module được ghi riêng với browser, mock/fixture và CLI model thật.

## Đối chiếu triển khai

Kết quả và giới hạn: [evidence/consistency/ACCEPTANCE.vi.md](evidence/consistency/ACCEPTANCE.vi.md). Danh sách VIỆC là adapter cho giao thức phòng cũ; task execution chỉ có một UUID trong kho WorkManager. Các ô trạng thái ở phòng được đổi nhãn thành tiến độ tự báo và kèm liên kết trạng thái execution. Nguồn hội thoại gốc được giữ nguyên; run lưu toàn bộ snapshot yêu cầu. Task cũ chưa có nguồn không bị tự ghép theo tên.

## Cải cách trình bày UI (2026-10-21)

Screen pool/flow/hợp đồng dữ liệu ở trên được giữ; phân cấp và tiêu chí thiết kế đích bổ sung tại [UI-REFORM.vi.md](UI-REFORM.vi.md). Chuẩn bị chỉ hiện bước bối cảnh/mời, bốn view phiên dùng một navigation; task/run không có kho/ID mới. Chi tiết nguồn/revision/snapshot vẫn đọc được qua disclosure, không xóa evidence. Kết quả browser và giới hạn nằm trong evidence/ui-reform/ACCEPTANCE.vi.md.

## UC09 — PM CLI điều hành (thiết kế đích trước triển khai, 2026-10-22)

Pain point: giám đốc phải bấm từng bước chạy/verify/integrate sau khi giao mục tiêu. Tái sử dụng S01–S06 và task/run hiện có; không tạo bảng việc thứ hai. S01 chọn Tôi/Agent → lời mời PM riêng → PM join pending/mã đối chiếu → giám đốc xác nhận → mục tiêu/acceptance và grant local giới hạn → PM tạo task → run → independent tests → integrate + tests source → báo cáo có provenance. PM không là worker, không tính quorum. Kênh riêng giám đốc–PM nằm trong cùng phiên, không đưa vào log/minutes/worker history.

Screen pool bổ sung: khối Chủ trì chung trên trang phiên, trạng thái human/invited/pending/active/paused/lost/revoked; các form mục tiêu và quyền trong disclosure, lỗi giữ dữ liệu; task/evidence vẫn S04–S06. Entry từ S01 hoặc mọi hash phiên; Back/reload chỉ đọc, không cấp lại quyền/chạy lại. Flow lỗi: thiếu grant/probe/cost consent → blocked; đổi mục tiêu → nguồn task cũ stale + cancel; pause/revoke/lost → chặn thao tác tiếp theo và yêu cầu hủy process, giữ trạng thái thực; restart → suspended, mời/xác nhận lại, không tự resume.

Ma trận bổ sung: P01 Tôi không hồi quy; P02 PM join trước worker, approve/mã sai/spoof; P03 mục tiêu→task→test→source→report cùng UUID/revision; P04 private không có trong history/minutes/worker; P05 scope/profile/run limit/grant expiry/cost unknown; P06 pause/revoke/goal change giữa run/test/integration; P07 restart/lost/reload/Back/deep link không dispatch trùng; P08 VI/EN/light/dark/375/768/1280/keyboard/lỗi giữ form. Fixture xác định trước; model thật và so billing cùng task cần quyền riêng, không tự chi tiền.

## UC10 — PM chủ trì đầu/cuối, team tự điều hành (thiết kế đích, chưa triển khai)

Yêu cầu mới 2026-10-22: giám đốc giao một mục tiêu → PM hỏi những quyết định quan trọng → duyệt brief/quyền/thời lượng → readiness → team đề xuất lead/kế hoạch → PM kiểm/duyệt → team thực hiện trong quyền → sự kiện cần quyết định hoặc kết quả đánh thức PM → báo cáo ngắn có evidence. Đặc tả và khoảng cách source tại [PLAN-pm-operator](PLAN-pm-operator.vi.md#định-hướng-mới-pm-giao-việc-cho-team-hoạt-động-theo-sự-kiện). UC09 mô tả khả năng hiện có; không suy nó đã đáp ứng UC10.

Screen pool đích giữ khối Chủ trì và S01–S06: kênh PM có câu hỏi/khuyến nghị, lựa chọn đồng ý/đổi + phản hồi tự do; brief revision chờ duyệt; lựa chọn1h/2h/3h/đến khi hoàn thành và mức báo cáo. S04 hiển thị plan/lead/readiness đã duyệt trên cùng task IDs. S05 phân biệt team làm việc/PM chờ sự kiện/needs-decision/paused; không ghi “PM đang theo dõi” khi runtime không kết nối. S06 báo cáo ngắn và mở evidence/đào sâu. Session wall limit không đồng nghĩa budget vô hạn; đồng hồ bắt đầu khi handoff sẵn sàng. Chưa thay UI hoặc schema trong lượt thiết kế.

Ma trận nghiệm thu đích: T01 chỉ hỏi quyết định có ảnh hưởng, từ chối không phải giải trình, không auto-consent; T02 duyệt đúng brief/plan revision và grant, private không lọt vào team; T03 readiness lỗi không dispatch hoặc đổ lỗi model; T04 team lead có quyền riêng, PM/host credential không chia sẻ; T05 progress/heartbeat không gọi model PM, sự kiện kết quả/blocker có wake/ack/dedupe thật; T06 stale/duplicate/spoof event không gọi model hoặc làm done sai; T07 hết phiên/pause/revoke/đổi goal chặn dispatch và cancel/reconcile cả lead; T08 cancel/reassign không có hai writer sống cùng scope; T09 report đúng acceptance/evidence/unknown billing, đào sâu có scope; T10 Back/reload/restart/deep link không lặp run/wake, UI VI/EN/keyboard/responsive. Fixture kỹ thuật và thử model thực/UX acceptance ghi riêng; chưa có bằng chứng các ca T đã đạt.

### UC10 — lát cắt API/CLI local đã thực thi (2026-10-22)

Nguồn chuẩn vẫn `work@1`: `pm.team` chỉ giữ delegation/plan revision/approval/event/checkpoint, trỏ cùng task/run UUID. Một execution lane/slot A làm lead và worker cho task nhỏ; không tạo task board khác, không bắt đủ đội. Grant thêm `team` với durationMinutes60/120/180/null, maxSwaps0–2, maxInvocations1–9, maxWakes1–20 và profile allowlist. Đồng hồ bắt đầu handoff; mỗi CLI có timeout và reservation riêng. PM duyệt snapshot/readiness; nguồn đổi cần chủ động propose với expectedPlanRevision và duyệt lại.

Flow hiện có: team-invite → lead join/propose → PM approve-plan → team run → checkpoint/swap trong cùng task/run → team verify/integrate/submit → PM watch/events → ack-event → report. Model driver có structured runtime request cho swap ở biên phản hồi; không tự compact theo telemetry. Bootstrap chỉ đọc, ACK exact hash/generation/model, supervisor drain process group trước promotion. Scope/source/config/grant/goal stale, deadline, cap và kết quả chưa integrated đều bị chặn. Pending event giữ khi client tắt; restart suspend/reconcile, không tự trả event cũ thành completion của goal mới.

Ma trận kỹ thuật nằm trong `test/team.test.js`: một writer, WIP/slot/task liên tục; same/different allowlisted model; readonly bootstrap; stale/ACK/timeout/replay/spoof; revoke/goal/source giữa bootstrap; PM lease vs session expiry; event cap/dedupe/ack/restart và executable watch client. [Evidence](evidence/pm-team/ACCEPTANCE.vi.md). Không sửa screen pool/UI: screen pool đích UC10 phía trên vẫn chưa nghiệm thu. Cửa browser VI/EN/theme/Back/reload mới chưa mở vì chưa triển khai UI team/swap; UI UC09 cũ chỉ giữ khả năng của nó, không giả là đã phủ UC10.

## UC11 — Theo dõi kết quả ngoài trang (ca 8 giờ, 2026-10-22)

Quan sát baseline trên preview3150: API verify trả `verified`, S06 vẫn hiện `reported` và nút verify cho tới khi Làm mới/đổi view. Backend PM/CLI và web không có cùng nhịp cập nhật; người dùng phải vận hành refresh. Đây là lỗi theo dõi trạng thái đã tái hiện bằng fixture, không là bằng chứng chất lượng model.

Đích trong screen pool hiện có: S04/S05/S06 đọc có điều kiện mỗi3 giây khi view hiện; HTTP304 khi revision không đổi, không tự dispatch. Đang nhập/chọn/đọc details hoặc có action đang chạy thì giữ DOM/focus/scroll, báo Có cập nhật và cho áp dụng có chủ ý. Mất kết nối giữ dữ liệu cuối, báo đang thử lại; backoff tối đa30 giây, mỗi request tối đa10 giây. Quay lại tab thử ngay. Hội thoại/admin không polling work mới. Bản nháp vẫn theo task/revision; revision cũ không được ghi đè yêu cầu mới.

Flow: API/CLI đổi run → conditional read đổi → hiển thị trạng thái mới; nếu đang tương tác → pending → Xem cập nhật hoặc kết thúc tương tác → cập nhật. Offline → stale có nhãn → retry → live. Back/reload/deep link giữ luồng cũ và không chạy task.

| Ca | Kết quả cần kiểm |
| --- | --- |
| J14 | Run ngoài trang reported→verified→integrated cập nhật không cần Làm mới; task/run ID giữ nguyên |
| J15 | Đang nhập draft/chọn profile/mở evidence: DOM và focus giữ nguyên, có pending; áp dụng không dispatch |
| J16 | Offline giữ dữ liệu + nhãn, phục hồi trạng thái mới; 304 không có body; local/host boundary giữ nguyên |
| J17 | VI/EN, sáng/tối,375/768/1280, keyboard/Back/reload/deep link không tràn hoặc mất context |

Kiểm kỹ thuật không thay sự chấp nhận thiết kế của người dùng; kết quả thực tế và source hash ghi trong evidence của ca.

## UC12 — Chủ trì mặc định gọn và PM recovery (ca 8 giờ)

Quan sát trên S06: khối PM mặc định human chiếm thêm một hàng52–82px (cần đo lại cùng viewport trước/sau); network error `Failed to fetch` vẫn hiện sau server restart thành công. Human mode không cần điều hành PM thường trực. Đích: lựa chọn Agent làm chủ trì trong Tùy chọn hiện có; active/pending PM vẫn có vùng giám sát; human có lịch sử mở lại từ menu hoặc deep link nguồn; không mất private history hoặc tự tạo invitation khi chỉ xem lịch sử. Không thêm screen/task store.

Flow S01/S03–S06 human → Tùy chọn → Agent làm chủ trì → PM invitation/pending/active; tiếp quản → human gọn → Tùy chọn → lịch sử PM. `#pmControl` mở đúng vùng nguồn cũ. Network error của PM chỉ giữ tới lần state fetch thành công; validation/action error không bị background poll xóa. Human idle không poll PM mỗi3s; room change làm refresh, active giữ polling có timeout/no overlap.

J18: human default không chiếm hàng PM; menu/keyboard/deep link/Back/reload có đường tới PM/history. J19: PM state fetch failure rồi recovery xóa lỗi kết nối; action failure vẫn đọc được; VI/EN/light/dark/responsive và grant/revoke/takeover semantics giữ nguyên.


J20 (bổ sung sau tái hiện trên source tích hợp): focus nút Pause/Revoke/Takeover phải giữ nguyên khi PM có tin riêng hoặc run mới nhưng status/identity không đổi. Khi trạng thái đổi thật và control cũ biến mất, chuyển focus tới summary mới; takeover vẫn về Options. Pending code chỉ dựng lại theo status/generation/identity, không giữ mã cho invitation mới. Progress/link evidence không dựng lại vì tin nhắn không liên quan. Kiểm browser fixture có thật API mutation, không là nghiệm thu PM model.


J21: Verify/Integrate từ Results phải có trạng thái chờ và nút Hủy ngay tại chỗ; sau reload hoặc thao tác ngoài trang, run verifying/integrating vẫn có nút hủy ở Results và Execute. Hủy giữ đúng task/run, đợi subprocess kết thúc rồi ghi cancelled, integration khôi phục source theo guard backend. Kết quả request cũ không dựng lại DOM của view/draft người dùng đã chuyển tới. Browser test dùng slow independent Node test và API thật; fixture adapter không phải model.


J22: PM Send chậm/nhấn lặp không xóa bản nháp chưa gửi, response thành công chỉ xóa đúng nội dung đã gửi. Pause/revoke/takeover vẫn thực thi khi request thường đang chờ; late response không thay supervision state mới. Proxy local trì hoãn response, backend API thật/no-model; giữ cùng private scope. Không nhận việc hủy HTTP là hủy thao tác server đã xử lý.


J23 (đích trước sửa): khi bản nháp vN bị409 do yêu cầu vN+1 đã đổi, áp dụng cập nhật/Back/reload phải có đường xem draft cũ trong phần Chuẩn bị của cùng task. Chỉ đọc nội dung đã lưu local theo đúng host/task, không tự merge hoặc save; current form vẫn theo revision mới, người dùng tự chép phần cần giữ. Chỉ hiện phần khôi phục khi có draft hợp lệ trước revision hiện tại; không thêm màn quản lý draft hoặc gửi nội dung này cho worker. Test browser phải kiểm both old/current acceptance cùng tồn tại, readonly, reload, backend unchanged/no run, VI/EN và local storage unavailable fallback.


J24 (S05, củng cố J15): profile đã chọn giữ khi task khác/conversation cập nhật và focus ở ngoài task, nếu requirement/config revision còn nguyên và profile còn enabled. Chọn rỗng, requirement/config đổi hoặc reload yêu cầu chọn lại; không lưu ý định chạy vào local storage. Run gửi expectedRequirementRevision/expectedConfigRevision của view; server kiểm trên snapshot dùng dispatch,409 trước runtime khi lệch kể cả probe khác client đã refresh. API cũ không gửi optional revision giữ hành vi chọn cấu hình hiện hành; PM/team guards riêng giữ nguyên. Test browser unrelated update/Back/reset-on-revision và HTTP stale/current/no-call+config/requirement snapshots.


J25 (S07 Quản trị, probe/read recovery): probe hoặc Check runtimes về muộn chỉ cập nhật vùng quan sát, không dựng lại form/model/profile đang sửa hay chuyển focus. Quay lại Runtime trong lúc cùng profile đang probe phải thấy pending/disabled; mapping chưa lưu phải Save/revert trước probe. Web probe mang config revision đã xem; backend gộp chỉ các probe cùng host/profile/config còn in-flight, không cache/replay probe đã kết thúc; config khác không gộp, late old-config result không thay quan sát mới. close() abort/drain probe đang sở hữu; không hứa dedupe qua server restart/host khác hoặc trần tiền cứng. Late error từ view đã rời dùng thông báo không xóa draft/focus. Browser fixture3s + HTTP/runner counter, stale/same/different config và close tests; không gọi model thật.
