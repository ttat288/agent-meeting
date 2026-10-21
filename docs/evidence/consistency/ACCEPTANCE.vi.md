# Nghiệm thu lát cắt thống nhất — 2026-10-21

> **Phản hồi người dùng sau triển khai:** UI chưa được chấp nhận về độ rõ ràng, lượng chữ, cách gom nhóm, độ gọn và phân cấp màu/nền. Các kết quả dưới đây chỉ xác nhận hành vi trong phạm vi đã thử, không xác nhận chất lượng thiết kế. Ưu tiên phiên sau: [cải cách UI](../../HANDOFF-ui-reform.vi.md).

## Kết luận có phạm vi

Đã triển khai và kiểm thử luồng Hội thoại → Kế hoạch → Thực hiện → Kết quả trên source tích hợp. Mục tiêu nhập một lần; VIỆC tự ánh xạ tới task; bổ sung điều kiện không tạo task mới; báo cáo, test và tích hợp cùng task/revision. Không tuyên bố đã nghiệm thu đội AI tự làm sản phẩm hoặc mọi tổ hợp remote/mixed.

Hợp đồng viết trước code: [CONSISTENCY-JOURNEYS.vi.md](../../CONSISTENCY-JOURNEYS.vi.md). Baseline đã quan sát cả phòng, workspace, admin trên preview 3117 trước sửa. Preview kiểm thử mới dùng cổng 3118, thư mục `/tmp/am-consistency-preview`, không thay app người dùng/cấu hình global.

## Hành trình browser đã chạy

1. Nhập “Sửa phép cộng trong sum.js và chứng minh 2 + 3 = 5.” tại brief → Mời agent → Bắt đầu; không cần workspace/model để thảo luận.
2. Chủ trì gửi `KẾT LUẬN` + `VIỆC: Dev | Sửa phép cộng trong sum.js | hôm nay` ngay trong composer.
3. Mở Kế hoạch: cùng bối cảnh, task `meeting-8b771d64d1a59f2e8c063309f9d6fa5a`, nguồn `#message-1`. Không nhập lại mục tiêu.
4. Mở điều kiện task, chọn execute/local/managed, workspace `/tmp/am-consistency-preview/source`, phạm vi `sum.js`, test `test/sum.test.js`. Cố lưu thiếu acceptance: lỗi và draft được giữ. Đi admin rồi quay lại `#plan`: draft còn đủ các trường và ID.
5. Lưu acceptance `sum(2,3) trả về 5`: vẫn một task, requirementRevision 2. Chạy trước probe: bị chặn vì runtime chưa xác nhận, chưa tạo run. Vào admin → runtime → probe adapter fixture → quay lại đúng `#execute`.
6. Chạy task: tiến trình Node thực trong bwrap sửa `a-b` thành `a+b` trong bản sao; report dưới task. Trong Kết quả, bấm verify (Node test thật), rồi integrate (Node test lại trên source tích hợp). Run `4fedd28b-5f7f-45b5-8891-c0c7579969dd` thành integrated, task accepted; evidence hai lượt test exitCode 0. [Bản bàn giao API](fixture-handoff.json).
7. Restart đúng preview, reload `#results`: ID/revision/run/kết quả còn, số liệu 1 run/1 verified/1 integrated. Bấm nguồn về đúng tin; Back về kết quả; Forward trở lại hội thoại. Sidebar giữ tiến độ tự báo riêng, đồng thời hiện liên kết execution “Đã tích hợp” cùng task ID.
8. Kiểm VI/EN và theme system/light/dark. Nội dung người dùng giữ nguyên ngôn ngữ gốc. Kiểm desktop/tablet/mobile, không tràn ngang. Có phát hiện và sửa overflow thanh đầu ở màn hẹp trước khi chốt.
9. Keyboard: focus vào Results, Tab sang Administration, Enter mở admin, link quay về đúng Results. Console errors trả `[]` sau hành trình.

Fixture là adapter thử xác định, **không gọi model/CLI AI trả phí**. Nó chứng minh dữ liệu/API/UI/tiến trình/test/tích hợp, không chứng minh chất lượng model hay đầy đủ hành vi CLI thật. Bằng chứng CLI model thật ở phiên trước không được tái sử dụng để nhận hành trình mới đã được model nghiệm thu.

## Ma trận kết quả

| Ca | Kết quả | Bằng chứng và giới hạn |
|---|---|---|
| J01 | PASS cho đường chủ trì; regression agent | Bước browser 1–2; server/meeting/security/connect/files tests giữ giao thức mời/agent. Chưa chạy lại agent model thật trong luồng mới. |
| J02 | PASS | Bước 3, Back/reload; consistency test idempotent/read revision/provenance; dữ liệu cũ không bị xóa hay tự ghép theo goal. |
| J03 | PASS với fixture | Bước 4–6; lỗi validation và readiness; cùng task ID/revision và source snapshot. |
| J04 | PASS với fixture | Report → test → integrate → test source, handoff + restart + source link; task manual todo không được tự nâng thành verified. |
| J05 | PASS API/engine | consistency tests sửa VIỆC/context tăng revision, old verified run integrate 409, source mất chặn chạy; chưa có giao diện đổi mục tiêu tuỳ ý khi run active. |
| J06 | PASS browser validation/readiness; PASS engine các nhánh còn lại | work/work-cancel tests: failed tests, cancellation, interrupted, source conflict/rebase/rollback. Chưa đi từng nhánh này qua browser; không dùng log module để tuyên bố tất cả nhánh UX đã hoàn chỉnh. |
| J07 | PASS cho task draft và navigation | Browser bước 4,7,9; redirect `/workspace?lang=en` → `?lang=en#plan` test HTTP. Admin form draft qua reload vẫn theo giới hạn cũ, chưa hứa persistence đầy đủ. |
| J08 | PASS | Browser restart preview fixed; consistency test restart app/room và carry, kể cả non-fixed đổi hostKey; chặn ghi từ phòng cũ và giữ nguồn gốc/yêu cầu. |
| J09 | PASS regression quyền/API; chưa browser remote | remote-server/remote/worker tests; forwarded requests và invitation keys không có quyền config/execution. Chưa test worker trên máy vật lý thứ hai trong luồng mới. |
| J10 | PASS đại diện | VI/EN, system/light/dark; 375/768/1280 CSS px và keyboard route; không lỗi console. Không tuyên bố kiểm screen reader đầy đủ. |

Viewport browser đang có zoom 110%; dùng override 413/845/1408 để đo đúng innerWidth 375/768/1280. Assertions DOM cuối: documentElement.scrollWidth bằng innerWidth ở cả ba kích thước. Đã thử thêm 341px. Ảnh từ `tab.screenshot` sau snapshot; ảnh native `getScreenshot` đôi lúc trả frame cũ sau resize nên không dùng nó làm bằng chứng cuối.

Ảnh bổ trợ, không thay thế hành trình:

- [Desktop EN dark](results-en-desktop.jpg)
- [Tablet EN light](results-en-tablet.jpg)
- [Mobile EN light](results-en-mobile.jpg)
- [Tablet VI light](results-light-tablet.jpg)

## Hồi quy và tái lập

231/231 assertions trên 22 file test, mỗi file chạy tuần tự trong scope MemoryMax=1200M/MemorySwapMax=0, timeout 150 giây và test-timeout 30000ms. Lệnh và từng log nằm cạnh tài liệu này; [tổng kết](regression-summary.txt). `git diff --check` sạch. Không chạy suite không giới hạn.

Tái lập browser fixture: dừng preview 3118 cũ nếu đang dùng, chạy `node tools/consistency-preview.js`. Tool tạo thư mục temp mới, in đường dẫn source để nhập vào task, phục vụ host `/m/host_consistency_preview_1234`; adapter luôn là Node fixture. Có thể tái lập dữ liệu/tiến trình bằng `test/consistency.test.js` mà không cần browser hay tài khoản AI.

## Giới hạn còn lại / cửa tiếp theo

- Nghiệm thu mới bằng CLI model thật; browser cho failed-test/conflict/cancel/interrupted và remote/mixed khác máy.
- Reconcile tiến trình sau restart, review acceptance độc lập, tích hợp đa file vẫn chưa hỗ trợ; UI/backend giữ cửa chặn. Lưu điều kiện không tự chạy agent.
- Nguồn chat là tin gốc tại lúc lập task. Run giữ snapshot yêu cầu; task legacy không có nguồn được giữ và gắn nhãn chưa liên kết, không tự suy diễn.
- Mở Kế hoạch lưu trích đoạn hội thoại vào kho work bền vững; chỉ thảo luận chưa mở work không tự khởi tạo kho đó. Draft task lưu theo host/task/revision ở localStorage; không tự áp draft revision cũ sang yêu cầu mới.
- Không commit/push/release; không sửa settings global, không mở tunnel hoặc gọi model trả phí.
