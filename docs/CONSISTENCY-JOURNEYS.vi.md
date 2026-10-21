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
