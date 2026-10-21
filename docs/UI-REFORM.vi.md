# Cải cách UI — 2026-10-21

Đặc tả đích viết trước khi sửa UI. Giữ hợp đồng dữ liệu trong CONSISTENCY-JOURNEYS.vi.md; không thêm nguồn task, quyền hoặc execution mới.

## Baseline quan sát trên bản tích hợp

Preview cô lập 3119, có quyết định, task nguồn #1, run Node subprocess reported và catalog revision 2. Đã mở Hội thoại, Kế hoạch, Thực hiện, Kết quả và Quản trị. Header có stepper chuẩn bị/họp cạnh navigation phiên và shortcut Kế hoạch trùng. Kết quả phải đi qua hai thẻ bối cảnh/số liệu trước khi thấy task; UUID, revision, base và nút bàn giao lấn át hành động kiểm chứng. Form quản trị kéo dài trước nút lưu; cấu hình task là một cột gồm nhiều trường ít dùng. Đây là vấn đề quan sát được, chưa phải đánh giá người dùng về bản đích.

## Screen pool đích và nghiệm thu

| Screen / use case | Nội dung thiết yếu, hành động chính | Chi tiết mở rộng / trạng thái / quyền | Điểm vào-ra |
|---|---|---|---|
| S01–02 chuẩn bị UC01 | Bối cảnh → mời → bắt đầu | Agenda và tùy chọn mở khi cần; giữ validation, draft; host | Thanh bước chỉ trong chuẩn bị; nav phiên vẫn có |
| S03 Hội thoại UC01–02 | Hội thoại và ô gửi; quyết định/việc cạnh hội thoại | Bối cảnh/thông tin phòng gom vào disclosure; mobile mở bảng tóm tắt; host | Một navigation phiên; nguồn message vẫn deep link |
| S04 Kế hoạch UC02 | Tên việc, owner, tiêu chí; mở sửa yêu cầu → lưu → thực hiện | ID/nguồn/snapshot mở rộng; điều kiện chạy gom nhóm; planned/stale/retired | #plan, giữ UUID/revision/draft; nguồn → S03 |
| S05 Thực hiện UC03/05 | Điều kiện chạy, profile + nút chạy cùng nhóm; run hiện trạng và hủy | Run đang hoạt động chặn nút chạy lặp; chưa cấu hình → sửa tại S04; blocked/error/retry giữ draft | #execute → S04 hoặc S06; không dispatch khi chỉ chuyển view |
| S06 Kết quả UC04 | Task → trạng thái báo cáo/test/tích hợp → hành động kiểm chứng hoặc tích hợp | Nhật ký, ID, snapshot, tải bàn giao và số liệu mở rộng; failed/stale/verified/integrated | #results → nguồn hoặc thực hiện; kết quả cũ không tự được nhận |
| S07 Quản trị UC06 | Heading theo nhóm đang chọn; danh sách model + form; lưu rõ ràng | Năng lực/ưu nhược và provenance mở rộng, giữ điều kiện bật model/cảnh báo probe chi phí; local-only | Link trở về đúng view, giữ ngôn ngữ |

## Flow

Hội thoại → Kế hoạch (cùng VIỆC/UUID) → mở yêu cầu → lưu → Thực hiện → chọn profile/chạy → Kết quả → kiểm chứng → tích hợp → nguồn hội thoại. Back/reload/admin-return giữ view và draft, không chạy ngầm. Cấu hình thiếu dẫn về Kế hoạch; lỗi vẫn hiện tại nhóm thao tác và cho sửa/thử lại. Mọi run giữ full snapshot trong disclosure; không ẩn cảnh báo cũ/stale hoặc điều kiện an toàn.

## Ma trận kiểm trên source cuối

- R01: Mỗi view có heading/mục tiêu và hành động tiếp theo rõ, selected nav có nền/viền/font; bỏ shortcut và stepper trùng khi đang làm việc.
- R02: Task từ hội thoại giữ ID qua plan/execute/results, reload/Back, link nguồn và admin-return; bản nháp giữ qua đổi view; validation thiếu acceptance giữ dữ liệu và focus lỗi.
- R03: Fixture subprocess thật report → verify → integrate; evidence và source test thành công; chặn chạy lặp khi active, hiển thị lỗi chạy/failed/stale và đường phục hồi.
- R04: Có dữ liệu và empty/loading/error; Việt/Anh × system/light/dark × 375/768/1280 CSS px, không tràn ngang, focus bàn phím và disclosure dùng Enter/Space; console/CSP không lỗi ứng dụng.
- R05: Hồi quy i18n, consistency, work/server/security phù hợp, từng file có MemoryMax=1200M / swap=0 và timeout theo HANDOFF.

Ảnh là bằng chứng bổ trợ. Kết quả thực tế/giới hạn ghi tại evidence/ui-reform/ACCEPTANCE.vi.md; thiết kế vẫn chờ người dùng xem và nhận xét.
