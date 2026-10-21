# Prototype không gian làm việc và quản trị

Ngày 2026-10-21. Phạm vi C/D đầu tiên. Prototype cấu trúc dưới đây được dựng thành HTML/CSS/JS thật tại `src/ui/workspace.*`; các dữ liệu công việc lấy từ server, không có task/agent mẫu. Trang phòng họp hiện có giữ nguyên.

## Bố cục trước khi mở rộng

```text
Agent Meeting     Công việc | Phòng trao đổi | Quản trị          VI/EN

KHÔNG GIAN LÀM VIỆC
Từ ý tưởng đến công việc có bằng chứng
┌─────────────────────────────────────────────────────────────────┐
│ Bạn muốn đội AI làm gì?                                          │
│ [Mục tiêu bằng ngôn ngữ tự nhiên                              ]  │
│ Mục đích          Agent chạy ở đâu?       Ai quản lý agent?      │
│ [Trao đổi     ]   [Cùng máy          ]    [Tôi mời agent      ]  │
│ Thông báo ngắn về khả năng thật của lựa chọn hiện tại             │
│ ▸ Tiêu chí nghiệm thu và phạm vi                                 │
│ [Tạo công việc]  [Vào phòng trao đổi]                             │
└─────────────────────────────────────────────────────────────────┘
Kế hoạch | Công việc & phiên chạy | Kết quả & bằng chứng   Làm mới
Task thật → tiêu chí → đề xuất → run → log/bằng chứng → kiểm chứng
```

```text
QUẢN TRỊ                 Cấu hình đội AI · Revision
Model & năng lực         Tìm model                       Thêm model
Quy tắc chia việc        Danh sách          Form chi tiết
Agent & runtime          model đã bật/tắt   Tên, provider/model ID
Dữ liệu & nguồn                            Năng lực, thế mạnh, hạn chế
                                          Nguồn / xác nhận / bật / lưu
```

Màn hẹp chuyển sidebar thành dãy nút, danh sách model ở trên form; ba lựa chọn vẫn là ba trường độc lập. Mục đích trao đổi trỏ đến phòng hội thoại hiện có; tạo task không tự khởi chạy agent. Lập kế hoạch thể hiện tiêu chí và phụ thuộc; thực hiện thêm chọn hồ sơ, chạy/hủy và bằng chứng. Nhiều máy/kết hợp có thể lưu kế hoạch nhưng không có nút chạy tự động khi worker remote chưa được hỗ trợ.

## Các quyết định UX

- Dùng token, font hệ thống, sáng/tối từ `app.css`. Không thêm font, CDN, framework hay thư viện.
- Đã đọc `ui-ux-pro-max/SKILL.md`; query `error summary validation --domain ux -n 2` trả đúng Focusable Error Summary và Error Messages. Áp dụng summary có focus, role alert, liên kết tới trường lỗi. Hướng design-system Operations Landing không phù hợp admin; giữ hệ thiết kế hiện hữu và bố cục theo yêu cầu dự án.
- VI/EN chọn theo query/localStorage/navigator, cùng khoá `agent-meeting:lang`; nội dung người dùng/server giữ nguyên, chuỗi UI có hai ngôn ngữ.
- Lưu chỉ báo thành công sau backend; lỗi giữ form và dữ liệu nhập. 409 có nút tải lại rõ ràng kèm thông báo việc bỏ bản nháp, không tự ghi đè revision.
- Model mới lưu đủ schema, tách model ID với nhãn. Năng lực cấu hình do người dùng không coi là benchmark; xác minh model ID không đồng nghĩa có quyền truy cập. Runtime probe là hành động riêng gọi CLI thật.
- Task tạo mới yêu cầu tiêu chí nghiệm thu; các trường workspace, base, phạm vi sửa và test nằm ở phần mở rộng. Không biến chuỗi người dùng thành lệnh shell.
- Kết quả là dữ liệu run nguyên gốc gồm snapshot/log/evidence, không suy ra hoàn thành từ số tin hoặc nội dung agent nói.
- API chỉ hỗ trợ local managed mới hiện nút chạy. Giao diện chưa tự tạo kế hoạch bằng AI, chưa có remote worker hoặc resume; các thao tác đó không được giả lập.

## Kiểm chứng và giới hạn

`node --check src/ui/workspace.js` đạt ở bản nguồn độc lập. Kiểm tra trình duyệt và API trên bản tích hợp do trưởng nhóm thực hiện sau khi nối route/assets. Cần kiểm tra desktop/mobile, VI/EN, sáng/tối, tạo task, validation, thêm/sửa/tắt model, 409 giữ draft, runtime probe, run/verify/integrate trước khi tuyên bố toàn bộ chặng D đạt. Bố cục responsive, focus và reduced motion được cài trong CSS, chưa thay cho kiểm tra thực tế.
