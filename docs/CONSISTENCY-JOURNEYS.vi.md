# Hành trình thống nhất — hợp đồng v1 (2026-10-21)

## J48 — nhận diện Foxul (2026-10-25)

Mục tiêu: người mở repo hoặc app nhận cùng tên Foxul, logo cáo do giám đốc cung cấp và slogan “Multiple agents. One clear outcome.”. S01–S07 giữ dữ liệu, quyền, trạng thái và flow hiện có; chỉ đổi nhận diện ở header/title, lời giới thiệu S01, icon, màu trung tính và tài liệu hiện hành. Giữ `agent-meeting` cho package/CLI/MCP/schema/storage/install paths; không migrate dữ liệu hoặc tự cập nhật bản đã cài. Media/evidence lịch sử giữ nguyên và ghi rõ có trước nhận diện Foxul. Đây là bản tích hợp chờ giám đốc đánh giá logo, không phải nghiệm thu thương hiệu.

Ma trận kiểm: S01/S03/S04–S07, VI/EN × sáng/tối ×375/768/1280; logo tải đủ, title đúng tên, không tràn ngang, không lỗi CSP/console; theme system/explicit giữ đúng token. Thử nhập kết luận→Kế hoạch→nguồn→reload/Back cùng task IDs; regression hiện có. Icon kiểm alpha thật và thu nhỏ16/24/64, ICO/ICNS đóng gói đủ size; native OS appearance chưa xác nhận. Bản quay mới chỉ làm sau khi giám đốc duyệt nhận diện.

## J44 — skill/tool theo task (đích trước kiểm browser, 2026-10-24)

Khoảng trống source: `skills list/show/inspect` chỉ đọc riêng; `WorkManager.start` chưa cấp skill và Claude managed khóa MCP rỗng. Lát cắt dùng task host API hiện có, không thêm screen/editor/catalog toàn cục: host lưu `skillPolicy` required/optional và grant lookup riêng → task requirementRevision + hash nguồn → explicit Run cấp required một lần, optional metadata → MCP chỉ đọc nạp đúng resource → reported → failed checks/explicit retry → verified → integrate/test source. Task không liên quan không nạp catalog/guide. Skill không cấp quyền script, available/selected/supplied không chứng minh applied/compliant.

S04 giữ task/config/draft; policy hiện chỉnh qua API host local, UI chưa có editor. S05 dùng alert lỗi nguồn stale/missing/unsupported và giữ cùng task/run; không dùng lỗi skill để gợi ý paid probe hoặc tự Run. S06 handoff kèm supply/hash/grant và applied=not-observed. S07 giữ nguyên cấu hình runtime. Remote và team/swap chưa hỗ trợ policy, phải chặn rõ; CLI ngoài đã join không được kiểm soát context/tool bởi policy này.

Ma trận: policy required/optional/none; lookup allowed/denied/missing/stale/traversal/symlink/duplicate; fail→retry giữ ID/revision/evidence; nguồn ignored đổi chặn run/verify/integrate; thay policy là revision mới và không tự dispatch. Browser trên source tích hợp khép readiness expiry→failed probe→success probe→explicit Run→failed check→retry→verified→integrated, Back/reload/deep link, VI/EN và width/theme phù hợp. Policy mới kiểm API/MCP fixture; không nhận editor/human acceptance/model efficacy. Đối chiếu cùng CSV/8 checks và ba handoff cùng facts; chỉ tính bytes nếu không có token thật.

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

Đích trong screen pool hiện có: S04/S05/S06 đọc có điều kiện mỗi3 giây khi view hiện; HTTP304 khi revision không đổi, không tự dispatch. Đang nhập/chọn/đọc details hoặc có action đang chạy thì giữ DOM/focus/scroll, báo Có cập nhật và cho áp dụng có chủ ý. Mất kết nối giữ dữ liệu cuối, báo đang thử lại; backoff tối đa30 giây, mỗi background poll tối đa10 giây. Foreground `api()` hiện chưa có deadline ứng dụng riêng; không suy timeout của poll thành bảo đảm cho initial load/admin action hoặc tự retry mutation. Quay lại tab thử ngay. Hội thoại/admin không polling work mới. Bản nháp vẫn theo task/revision; revision cũ không được ghi đè yêu cầu mới.

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

J26 (lifecycle của S05/S06, không thêm màn): khi CLI nhận SIGINT/SIGTERM hoặc --exit-on-end, chặn dispatch mới, hủy và chờ process/test đang quản lý cùng rollback hoàn tất trước exit. Run/task cancelled và evidence lưu bền vững; source khôi phục nếu guards còn đúng, concurrent changes giữ conflict/manual reconciliation. Close trả về phải có active/pending=0. Kiểm tiến trình CLI thật với config/work/data/source tạm, --public-url loopback để không ghi connect-room global; Node slow test độc lập, không native model. Không nhận graceful shutdown là SIGKILL/crash durability hoặc phục hồi tự động external writer không sở hữu.

J27 (S05/S07, observation freshness): các phòng dùng chung catalog/config phải dùng một quan sát còn hạn mới nhất cho mỗi profile. Probe thất bại mới hơn ở phòng B phải chặn routing/Run phòng A dù A còn local success cũ. Cùng timestamp ưu tiên bản shared được persist; không thêm probe tự động hoặc biến quan sát30 phút thành quyền truy cập bảo đảm. API/UI không lặp cùng access proof hai lần. Kiểm hai WorkManager chung ConfigStore và counter fixture no-dispatch, không model call.

J28 (S07 runtime, thiết kế đích trước sửa): baseline config3/one fixture access/two executable checks có9 field mở sẵn, observationTop2010px ở375 và1573px ở1280. Runtime view đích giữ Check runtimes và probe rõ, đưa trạng thái đọc được vào từng profile, chỉ mở mapping khi cần sửa; raw JSON trong diagnostic disclosure, không thành nội dung chính. Khác biệt executable/model identity/access và thời hạn30 phút phải rõ; failure/unknown/stale không tô thành đã xác minh. Chỉ cập nhật vùng đọc khi callback về, giữ input/focus và diagnostic summary đang focus/open. Ma trận:VI/EN × light/dark ×375/768/1280, unknown/success/mismatch/failure/stale, disclosure keyboard, delay/no duplicate/draft, save/revert/Back/reload. Giữ CSP/no model tự động và quyền host, không tạo screen/store mới.

J29 (S07 điều hướng/phục hồi): baseline chọn Runtime rồi đổi ngôn ngữ/reload quay về Models, tăng thao tác khi cần reload config cũ trước probe. Đích giữ subsection bằng query section chỉ nhận5 ID có sẵn; language/reload/deep link giữ section và return view/lang, Back ra phiên theo history hiện tại. Không lưu draft admin hoặc tự replay khi reload. Invalid section về Models, không đọc URL thành tool/HTML/path. Browser kiểm5 section, VI/EN/reload/Back và invalid value; không native model.

J29 bổ sung từ browser reload: chưa đọc /runtime không đồng nghĩa chưa từng probe. UI phân biệt Observations not loaded với Access untested sau khi đọc; Check runtimes đọc saved proof và executable/version, không native model call. Chuyển subsection bằng sidebar đưa focus tới main mới; Save mapping vẫn trả đúng summary. Không tự fetch/probe trên reload hoặc lưu thêm browser data.

J30 (S07 mobile navigation, đích trước sửa): width375 VI có sidebar157px/header113px, main bắt đầu270px;5 button secondary navigation chiếm nhiều hàng. Thử native section select dưới700px, cùng catalog5section/query/focus với desktop sidebar; không đổi primary session nav hoặc thêm screen. Chuyển nhóm cần mở select rồi chọn (thêm một thao tác so button trực tiếp), đổi lại vùng nội dung phải lên rõ; đo trước/sau và không nhận human-time win. Test375/768/1280 VI/EN light/dark, keyboard select/focus, reload/lang/current value/return/Back, đủ5đích, không overflow; desktop không đổi.

J31 (S07 freshness khi để mở lâu, baseline1ce861f):observation19:02:56.916 hết hạn19:32:56.916; sau19:33:33 backend loại access nhưng tab vẫn badge verified/Model matched. Tab mở từ19:09:58 (~23m35), không nhận là browser/model chạy30m hoặc8h. Đích:đến hạn tự đổi badge stale bằng local timer, không network/probe/retry; metadata/raw evidence/input/focus giữ, dừng timer khi rời view/page/hidden và tính lại khi visible/pageshow. Browser fix dùng saved observation backdated có nhãn rõ để rút thời gian chờ, không gán nó là real model/runtime duration.

J32 (S07 save recovery, baseline4c58629):Save model đã commit config6→7 nhưng ACK bị giữ; gõ label mới trong lúc chờ rồi release làm callback xóa draft/focus. Đích giữ DOM/view snapshot nếu có input mới hoặc form đã thay; không tự nâng CAS revision cho form cũ, không merge/replay. Saved snapshot chỉ áp dụng vào lần chuyển view/reload rõ ràng; stale Save409 giữ draft, người dùng sao chép trước reload như cảnh báo hiện có. Mapping Save không lấy focus khi deferred; import không xóa JSON mới, reset dùng cùng guard. Latest notice có6s tính từ thông báo mới thay vì bị timer cũ ẩn sớm. Test unit với actual UI functions và browser ACK gate:normal/new-edit/view-switch/import/reset/CAS/reload, VI/EN,0 native model.

J33 (S07 Hosts read recovery):baseline2409aca, GETremote response giữ bằng fixture gate; gõ hostLabel/workspace trong lúc chờ rồi release làm Refresh dựng lại toàn trang, xóa draft/focus. Đích chỉ cập nhật list region còn mounted, clear đúng error của refresh khi hồi phục, không chạm enrollment form hoặc view khác. Remote revision thấp hơn cache phải bỏ qua để old response không ghi đè newer snapshot. Test browser same/different view +error/recovery, unit actual callback fresh/stale/detached; không enroll/token/dispatch/native model và không nhận đã kiểm worker máy thứ hai.

J34 (S03/S04 save task recovery):baselinefc4701d Save configure ACK bị giữ; nhập acceptance mới sau submit rồi release làm mất draft, đóng form và focusworkTitle. Đích giữ newer edits/viewed requirement revision khi có input/change sau submit hoặc form đã rời; không xóa storage key cũ, không tự merge/nâng CAS. Callback /work đọc chậm cũng phải kiểm lại trước render. Normal Save vẫn reload exact saved task và không dispatch; lỗi409 giữ draft. Explicit Show updates/Refresh dùng previous-draft read-only hiện có để chép/soát trước Save revision mới. Kiểm actual helper unit +browser delay trên configure vàread, same/different view, storage thiếu vẫn giữ DOM, normal save, conflict/recovery,0model.

J35 (S03/S04 foreground refresh):baselinebe737f7 Refresh bị giữ ở GETremote; input mới được localStorage khôi phục nhưng form đóng và focusBODY sau callback. Nếu storage bị chặn không có bảo đảm khôi phục. Đích chỉ áp full snapshot khi cùng refresh button còn hiện và không input/change hoặc explicit work read mới hơn; giữ config/work snapshot cũ cùng view khi deferred, không tự nâng revision cho form cũ. Fresh refresh đưa focus tiêu đề; điều hướng Hội thoại/Results lúc chờ không bị callback thay view. Unit actual helper fresh/edited/hidden/detached/newer-read/error; browser same/different view/recovery, no model.

J36 (S03/S04 hidden action error):baseline4544951 Refresh /work503 được giữ rồi quay Hội thoại; focus/chat giữ nhưng lỗi chỉ prepend workView hidden, noticehidden=true. Đích catch action dùng errorBox chỉ khi originbutton còn mounted và không có hidden ancestor; view ẩn/rời báo notice hiện có, không kéo focus/view. Không nhận lỗi là success hoặc tự retry mutation. Unit actual action visible/hidden/detached/finally +browser delayed503/chat draft/visibleerror/recovery,0model.

J37 (S03–S06 navigation read race):actual navigate unit baseline9cc650c có2red:oldPlan reject sau newResults success vẫn gọi errorBox; reject sau quay conversation tạo hiddenerror. Browser gate2lần không bắt được alert, không tính baselinebrowser hoặc suy chắc poll đã xóa. Đích nhánh catch dùng cùng request/hash guard với success; currentreadfailure vẫn alert, supersededreadfailure bỏ qua, không đổi currentview/focus. Unit actualfunction fresherror/staleerror/stalesuccess/hiddenview; browser kiểm normalroutes/currentfailure/recovery và không nhận absence alert riêng lẻ là chứng minh race đã tái hiện.

J38 (S03–S06 notification geometry):baseline64b7ef4 VI375×812, wsnotice che9426.5px² hostMsg đangfocus, senttoast che5338.11px² draft mới. Đích dành chỗ trong bodyflex cho notices/toasts của session, không overlay composer; emptytoastcontainer cao0, không đổi focus/draft/send recipient hoặc thời hạn message. Tradeoff nội dung phiên nhỏ hơn tạm thời và reflow khi thông báo hiện/ẩn, không nhận human-time/netperformancewin. Đo rectintersection và composer fullyinside viewport tại375/768/1280 VI/EN light/dark, message→nextdraft, remote-delayednotice→chatfocus, notification hide/recovery; workview/Options/menu không bị chặn. S07admin giữ flow/stylehiện có; không claim universal WCAG/screenreader acceptance.

J39 (S04–S06 keyboard route and background focus):baseline23bd7e8 EnterPlan giữ focustab,4Tab quaExecute/Results/Options mớiRefresh; Refresh focush1 nhưng API thêm1no-dispatchtask→pollPlan3→4 thayheading làm focusBODY. Đích active navigation hoàn tất focush1, nextTabRefresh (khi không pendingupdate); stale/readfailure không focusheading mới. Backgroundapply khôi phục headingfocus chỉ nếu headingcũ đangfocus; input/evidence vẫn defer, nav/control ngoài vùng bị thay không bị kéo. Initialload chỉ focus khi request/hash còn đúng. Unit actual functions và browserVI/EN/375/1280 keyboard/Back/reload +currenttaskmutation, no model/run; không claim screenreader/human-time win hoặc semantic model quality.

J40 (S04–S06 initial load continuity):baselineac84999 freshchatdocumentchưacóworkTitle; initialPlanloadheldởremoteGET, EnterResultswhileloading, release choResultsđúngnhưngfocusBODY. Loadingbooleantrảcallerthứhaiquásớm; đíchchia sẻpromiseđangload đểcurrentnavigationchờreadinessrồifocush1, chỉ1config/workread, khôngduplicatefetch. FailurephảiclearinflightđểRetryđược; returnconversationvẫnkhôngstealfocus. Unit actualload+actualnavigate concurrentwait/latestfocus/failretry, browserfreshdocument/heldresponse/Results/chatcancel;no model/run.

J40recoverybổsung:browserRetrydữliệuđúngnhưngfocusBODY. Retryđíchfocusmain/h1chỉkhiđúnghash/subsectionvàfocusvẫnBODY, khôngkéo khỏineweroutsidecontrol; lỗi lặpvẫnalert, retrykhiđổiviewkhôngfocushiddenheading.

J41 (runtime shutdown ownership, lỗi quan trọng tìm trong giờ kiểm chứng cuối): baselinef617e3a đường runCli read-only/unwrapped (như probe) trả cancelled/timeout ngay khi cha thoát và grandchild cùng POSIX group dùng stdio ignore còn ghi heartbeat, trước timer SIGKILL bị unref. Đích giữ promise/lease và referenced timer tới khi gửi escalation sau2s; cleanup chỉ sau đó. Hai red real-process tests trước sửa,15 runtime checks sau sửa; full suite/package mới ghi riêng. Không gọi model, không đổi quyền sandbox; không bảo đảm escaped session, mọi process đã reaped, Windows descendant tree hoặc SIGKILL recovery. Tradeoff cancel/timeout/output-limit đợi grace2s, normal success không đợi.

J42 (notification burst, sửa regression khi rà cuối): source953225b dành chỗ cho toast nhưng12 admission thông báo cùng lúc làm container648px trên viewport375×568, tràn trang và vùng thông báo giao composer đang focus. Đích cap min(25dvh,160px), overflow auto trong vùng toast, cuộn riêng vùng đó để thấy message mới; không đổi focus/draft hoặc kéo cả trang. Browser3ca375×568VI/dark,640×360EN/light,1280×812VI/light:12toast, height142/90/160, composer fullyvisible, intersection0, bodyoverflowfalse; hết hạn về0height/draft/focus giữ. Tradeoff thông báo cũ có thể cần cuộn trong thời hạn2.6s hiện có; pending admission vẫn có danh sách bền trong panel. Đây là geometry checks, không benchmark byte-identical thông báo/latency hoặc nghiệm thu screenreader/UX.

## J43 — Retry nhận lỗi kiểm chứng, không nhập lại bối cảnh (đích trước sửa, 2026-10-23)

**Quan sát:** trên source local `f415cf4` + English capture chưa commit, một task sửa CSV qua HTTP/Node subprocess bị test độc lập fail. Retry nhận prompt giống hệt lần đầu, không có lỗi test; fixture tiếp tục fail. Người vận hành muốn đưa lỗi tới coding agent phải đọc output rồi chép vào Facts và Save, làm tăng requirementRevision. Direct CLI với test trong cùng luồng đã nhận output mà không cần chuyển tay; đây là gap của managed journey, chưa chứng minh lợi ích ròng so direct.

**Use case/screen pool:** UC03–05, S05 Execute (`failed → explicit retry → reported`) và S06 Results (`failed checks → Execute → verified → integrated`). Giữ task/source ID, requirementRevision; mỗi attempt có run ID riêng. Không thêm màn hình, API hoặc engine retry. S05/S06 hiện có chỉ thêm thông báo nguồn lỗi đã được kèm trong lần chạy mới; output test vẫn thuộc evidence cũ. Back/reload/restart chỉ đọc, không tự dispatch. S04 draft/config không đổi.

**Đích:** WorkManager cấp chẩn đoán từ lần thử gần nhất cùng task khi thất bại do independent verification, requirementRevision/HEAD/source snapshot khớp; giới hạn check/output, ghi provenance/hash/bytes và cờ cắt ngắn. Không lấy report tự khai, transcript riêng, cancelled/interrupted/out-of-scope hoặc nguồn cũ làm chỉ thị. Output là dữ liệu chưa tin; lọc dấu hiệu secret theo detector hiện có, không tuyên bố bộ lọc đầy đủ. Nguồn đổi thì chạy với yêu cầu hiện tại và không kèm lỗi cũ. Không tự merge/retry hoặc hạ verification/review guards.

**Ma trận:** real subprocess CSV fail→restart→explicit retry→verify→source integrate; same acceptance/test/source bytes với direct; source edit/HEAD/requirement/task mismatch không carry; latest cancelled/rejected không lùi tìm lỗi cũ; payload lớn/Unicode/secret/injection giữ bound và nhãn untrusted; UI VI/EN/light/dark/375/768/1280 hiển thị provenance đúng, source link/Back/reload không nhân đôi run, error giữ failed/không done. Đếm required diagnostic transfers/configure để đưa lỗi vào lần chạy: before1/after0 nếu acceptance đạt; đây là số bước protocol, không phải thời gian người dùng đã đo. Token/billing/model-quality/đa-provider efficacy/human acceptance unknown.

**Lỗi tích hợp tìm khi QA locale:** nút VI→EN tại URL không còn `lang` chỉ replace đúng URL hiện tại, không reload; browser vẫn VI tới khi reload tay. Đích chọn ngôn ngữ luôn đưa lựa chọn rõ vào query, giữ params/hash khác và dùng được khi localStorage bị chặn. S03–07 giữ view/ID/run; không thêm điều khiển hoặc thay design system. Kiểm hai chiều/reload/Back và3red→green actual i18n tests.

**QA guard bổ sung trong J43:** task.workspace giữ nguyên nhưng directory được chuyển qua symlink tới đường dẫn canonical khác, HEAD/bytes vẫn giống: bản đầu vẫn carry lỗi cũ. Đích chỉ carry khi canonical source path cũng khớp, cùng các guard đã chốt. Ca real Git/Node đỏ→xanh; không gọi guard này là filesystem transaction hoặc bảo vệ mọi race/inode replacement.

## UC03 — phục hồi quan sát truy cập tại task (2026-10-23)

S05 vẫn dùng cùng task/run/config: Run bị chặn vì quan sát thiếu/hết hạn/không xác nhận → cảnh báo role=alert, tên profile và nút probe có nêu gọi CLI thật/có thể tốn phí → người dùng chủ động probe → trạng thái xác nhận, chưa chạy task → người dùng chủ động Run → S06 verify→integrate. Không tự probe khi đọc trang/Back/reload, không tự retry. Lỗi routing/quyền/revision hoặc interrupted giữ guard trước dispatch; lỗi routing không gợi ý probe. Có link Admin runtime/return execute để đọc quan sát hoặc sửa cấu hình hiện có. Không thêm màn/kho dữ liệu.

Bổ sung J06/J07/J10: observation expired→block giữ run count/source/task revision; probe thất bại→không run/không reported; probe thành công→explicit Run; cấu hình đổi trong khi probe→không áp dụng; chuyển view/nhập khi chờ→không mất draft/focus; Back/reload/deep link giữ UUID/evidence và không dispatch. Fixture/subprocess/HTTP/browser là self-review; model/human acceptance ghi riêng trong evidence/readiness-recovery.

## J44 — Handoff giữ yêu cầu đã chạy; tích hợp và rollback giữ quyền file (2026-10-24)

Quan sát bằng API thật trên source local: run v1 đã integrated, sau Configure acceptance/sources/facts v2 rồi restart, handoff tải về vẫn gắn evidence v1 với task v2. S06 đã có cảnh báo yêu cầu cũ nhưng JSON tải về mâu thuẫn. Đích giữ screen pool/flow hiện có UC04/S06 → tải handoff → đọc đúng snapshot của run; không thêm màn hay thao tác. `task` trong handoff là `run.requirementSnapshot` hoặc null với dữ liệu cũ thiếu snapshot; không suy từ task hiện tại. `requirementRevision`, `currentRequirementRevision`, `requirementsCurrent` tách lịch sử khỏi yêu cầu hiện tại; currentness null nếu thiếu snapshot/task/revision, false có limitation giải thích. Không sửa status lịch sử hoặc nghiệm thu task mới.

Ma trận: current/reconfigured/restart; legacy thiếu snapshot; current task không còn; workspace sửa trước verify bị chặn. Browser nguồn tích hợp: repeated access expiry→probe fail→probe success→Run→failed check→retry→verify→integrate, sau đó đổi requirement→reload/Back→warning cũ và handoff khớp. VI/EN×light/dark×375/768/1280; không auto probe/dispatch. Fixture/self-review không là native model hoặc human acceptance.

Quan sát độc lập trong cùng recovery: original0754 dưới process umask0077 trở thành0700 sau atomic integration; rollback trả bytes nhưng quyền vẫn0700 dù báo restored. Đích tạo temp riêng tư rồi chmod đúng permission bits trước rename, cả tích hợp và rollback. Test success/fail dưới umask077 và conflict do external chmod/symlink giữ nguyên; không bỏ source guard hoặc kill escalation. Không nhận đã bảo toàn ACL/xattr/ownership hoặc hỗ trợ Windows permission semantics từ ca Linux này.

J44 bổ sung sau lỗi thực: Rebase run reported/verified của revision cũ trả200 và đổi task mới từ ready thành verifying; source bị đổi canonical path hoặc task rời hội thoại cũng không bị chặn. Đích UC04/S06 giữ bằng chứng lịch sử, không hiện source refresh cho run cũ/nguồn không còn; API kiểm open/current requirement/current source/canonical path trước chép file hoặc sửa state. Current run vẫn rebase→reported→verify→integrate; closed/stale/removed/redirected phải từ chối và giữ state/workspace. Browser kiểm nút có ở reported hiện tại, mất sau Configure; API trực tiếp vẫn409 và reload không tự chạy.

## J45 — Probe có phản hồi nhưng thiếu/khác model identity (đích trước sửa, 2026-10-24)

Quan sát thật: native agy sửa file và direct tests đạt, explicit probe qua runtime có available/quota true nhưng reportedModel unknown/modelVerified false. Run bị chặn đúng guard. S05 access recovery hiện chỉ nói kiểm CLI/quyền rồi thử lại, không nêu tầng identity; có thể dẫn người vận hành sửa auth hoặc lặp paid probe sai nguyên nhân. Không coi đây là CLI hỏng, không nới identity guard.

Đích giữ S05/S07 và button/link hiện có: sau probe với CLI phản hồi nhưng model chưa được xác nhận, phân biệt actual model không được báo với model báo lại khác mapping. Chỉ dẫn xem model reporting/mapping trong Administration trước khi probe lại; nêu chưa có run. Failure/quota/CLI unavailable vẫn theo lỗi truy cập chung; stale config giữ riêng. Không tự probe/retry/đổi profile/model hoặc vô hiệu khả năng explicit retry.

Ma trận: real probe receipt làm căn cứ, API/browser dùng participant scripted tạo cùng trạng thái identity-unknown và mismatch, không nhận fixture là lần inference mới. Unknown/mismatch không được hiện access confirmed; lỗi rolealert giữ task/draft/profile/focus và0task call. Explicit recovery sau đó mới probe→Run; VI/EN/light/dark/375/768/1280, Back/reload và metadata task/run giữ nguyên. Không thay schema/CSP/token theme hoặc thêm màn.

J44 bổ sung từ ca legacy (fixture tương thích, chưa có người dùng thật mất field): metadata đã giữ missing run revision là unknown, nhưng `assertCurrent(..., undefined)` của verify/rebase lại bỏ fence vì tham số client vốn tùy chọn. API cho old legacy attempt đổi state task mới trước khi integrate bị guard khác chặn. Đích mọi mutator của run phải có revision số nguyên dương đã biết trước khi dùng current-task fence; missing/invalid từ chối409 với hướng dẫn review task và explicit Run mới. Không suy run revision từ snapshot hoặc tự sửa kho. Test API verify/rebase/integrate không đổi state/evidence khi thiếu revision; attempt mới cùng task ID phục hồi tới source test/integrated. Giữ tương thích client cũ không gửi optional expectedRevision khi Run task hợp lệ.


## J46 — Read-only agy cần biên filesystem thật, 2026-10-24

Rà provider limit README: `--mode plan` đi cùng disable-slash vốn cảnh báo không hiệu lực. Phép thử thật bằng đúng buildArgs(write:false) trong fixture ngoài được mount ghi đã đổi BEFORE→AFTER bằng native file tool. Host luôn được outer sandbox bảo vệ; chưa có incident người dùng thật. Runtime cũ chỉ wrap khi write/isolate/taskContextFile, nên không được coi plan flag là biên read-only.

Đích không thêm màn hình/quyền hay adapter: mọi model call agy qua runtime, cả probe/read-only, bắt buộc wrapExecution(write:false). Thiếu Linux/bwrap/namespace từ chối trước spawn, giữ guard write:true và task-context MCP, giữ group cancellation/cleanup. Mọi giao diện model-free/invited vẫn giữ phạm vi cũ. Same prompt qua default runtime bỏ isolate phải không đổi file; SDK report không thay kiểm file. Không claim read/network/tool-server isolation; CLI người dùng tự mở ngoài control.

Ma trận: real CLI before-file-edit/after-EROFS; fake-process spy bắt wrapper/writefalse/cleanup và sandbox unavailable→0spawn; full runtime/cancel/boundary; full source và package khớp hashes, browser nguồn tích hợp cùng UI bytes. VI/EN README nêu managed writing Claude Code; current local agy probes/read-only đòi Linux/bwrap, khác pin lịch sử. Link/anchor local và commit ancestry được kiểm; remote fetch TLS fail ghi unverified, không sửa CA/global auth hoặc bypass. Không tạo demo native managed khi identity vẫn unknown.

## J47 — Quét nhanh trạng thái Kế hoạch → Thực hiện → Kết quả, 2026-10-24

**Pain point đã quan sát:** tại S04–S06, tiêu đề chỉ cho tổng số task; người vận hành phải đọc lần lượt từng card mới biết việc nào cần chuẩn bị, đang chạy, cần nghiệm thu hay đã xong. Các summary điều khiển trong footer gần giống chữ phụ, còn card ở trạng thái khác nhau có trọng lượng thị giác gần như nhau. Hậu quả là hành động tiếp theo khó thấy dù dữ liệu và guard đã có đủ.

**Lát cắt đích:** giữ nguyên screen pool, route, task/run ID và mọi mutation. Mỗi view thêm một vùng tổng hợp ngắn từ state hiện có: S04 `cần chuẩn bị / sẵn sàng / hoàn tất`, S05 `sẵn sàng / đang xử lý / cần xử lý`, S06 `cần nghiệm thu / cần xử lý / đã tích hợp`. Card dùng status rail không chỉ dựa vào màu; badge chữ hiện có vẫn là nguồn nghĩa. Footer gom source, cấu hình, trợ giúp và bước tiếp theo thành một vùng điều khiển có affordance rõ. Không ẩn task, không tự sắp xếp lại lịch sử, probe, dispatch hoặc nghiệm thu.

**Flow và điểm dừng:** Hội thoại → S04 xem tổng hợp và mở đúng task → S05 chạy/khôi phục → S06 verify/integrate; Back/reload/deep link giữ hành vi cũ vì tổng hợp được tính lại từ cùng snapshot. Đủ khi VI/EN, sáng/tối và 375/1280 không tràn ngang; keyboard vẫn tới được mọi summary/action; số đếm đúng với retry, task hoàn tất và kết quả lỗi. Đây là cải thiện khả năng quét bằng self-review/browser fixture, chưa phải human acceptance hay bằng chứng giảm thời gian người dùng.

**Kết quả lát cắt điều hướng:** helper phân loại duy nhất trả visibility, nhóm summary và rail; cùng summary đó giữ count cùng `targetTaskId` đầu tiên theo thứ tự nguồn. Count>0 là button có nhãn VI/EN “đi tới task đầu tiên”, Enter/click focus rồi scroll card; count0 là span không vào Tab order. Test helper4/4 phủ stale revision, local/remote và empty target; full `npm test`508/508 trên45file. Browser fixture cô lập8ca VI/EN×sáng/tối×375/1280 đạt focus ring, đúng đích, không overflow và dữ liệu/thứ tự trước–sau không đổi;0 model call. Chưa test screen reader thật hoặc người dùng thật với danh sách dài.
