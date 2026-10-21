# Review độc lập bản showcase

Ngày: 2026-10-21. Hai reviewer Codex nội bộ, model kế thừa phiên gốc; công cụ không cung cấp model ID cụ thể. Không gọi Claude/Gemini hoặc CLI/model trả phí, không bật profile. Catalog routing revision1 đã được tra trước khi giao việc và không có profile ngoài hợp lệ được bật. Worker chỉ đọc source/bằng chứng, không sửa checkout.

## Agent A — showcase_structure

Đối chiếu README Anh/Việt, SHOWCASE, recorder, cấu trúc WORK/ENDED, CSS, ảnh và evidence. Không có phát hiện chặn merge: câu chuyện rõ từ câu hỏi đến task có nguồn; khai báo bot kịch bản và chưa kiểm chứng đúng; đủ Plan, status/note/sidebar, MD/copy/JSON, carry/new trong inventory. Không chạy browser mới; giới hạn là review source/tài liệu/ảnh và evidence.

## Agent B — showcase_accessibility

Review typography/density/accessibility của footer và player. Thao tác browser độc lập: chuyển cảnh, phím Right trên slider, đổi VI/EN, play/pause, trạng thái paused ban đầu. Không thấy lỗi chặn merge về typography/density; footer giữ native summary/focus ring và vùng cuộn.

Phát hiện và giải quyết:

- P2: hướng dẫn/preview phục vụ docs/showcase khiến link ../demo.gif và ../demo.vi.gif trả404. Root đổi server root sang docs, mở /showcase/, cập nhật lệnh dựng lại. Root kiểm HTTP200 và player; B độc lập xác nhận cả hai GIF200 và HTML/JS/manifest được phục vụ khớp byte với source.
- P3: Next/Previous thiếu guard khi manifest chưa tải hoặc lỗi. Root thêm disabled ban đầu và guard !manifest, kiểm lỗi tải bằng route abort: thông báo lỗi hiện, nút bị disable, không có pageerror. B đối chiếu fix trên source cuối.

Hai phát hiện đã đóng trước merge. Lần recheck của B dùng HTTP/source vì phiên CUA cũ không còn khả dụng; không tự nhận đã chạy lại browser. Chưa thử screen reader trên thiết bị thật. Root tự đối chiếu và giải quyết, không coi lời reviewer hoặc số test là nghiệm thu UX.
