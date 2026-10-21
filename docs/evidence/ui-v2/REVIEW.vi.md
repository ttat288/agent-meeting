# Review UI v2 — hai reviewer độc lập

2026-10-21. UI-V2-A `/root/structure_review` và UI-V2-B `/root/system_review`: subagent nội bộ Codex, kế thừa model của phiên hiện tại (môi trường mô tả là GPT-6; tool spawn không trả model ID/version riêng, nên không khẳng định ID cụ thể). Không phải Claude/Gemini, không chạy CLI/model ngoài, không probe profile trả phí. Lookup catalog revision1: list_profiles/get_profile opus-claude/recommend_profile review → no-candidate, các profile disabled/unverified/access unknown. Root chọn review nội bộ theo yêu cầu người dùng, giữ viết source tại root. Hai reviewer chỉ đọc cùng working tree; HEAD556b9f6 kèm thay đổi chưa commit, không writer nên không có workspace writer.

## Lượt thiết kế

A xác minh triple-header, shortcut trùng và Quick gửi ngay; yêu cầu giữ inventory sidebar (agenda/role/kick/admission/task progress/files), nguồn #message-N và admin return. B xác minh hai scale CSS, metadata đứng trước goal/report, report cắt600 ký tự và overlay thiếu focus/isolation. Root giữ sidebar trái, chọn một Tùy chọn chia nhóm với button/link/select gốc; dùng disclosure thay menu ARIA phức tạp chứa select. Không thêm hệ điều hướng hay kho task mới.

## Lượt triển khai và giải quyết

| Phát hiện độc lập | Root xử lý | Kiểm lại |
|---|---|---|
| A/P2: modal ghi chú ghi đè return target, đóng sheet trả về Options | Đóng sheet luôn trả btnPanel, modal vẫn trở về control trong sheet | A+B kiểm browser375: Escape modal giữ inert/focus trong sheet; Escape tiếp trả Chi tiết, nền hết inert |
| A/P2: Results(5) nhưng chỉ1 task có run | Count áp cùng filter local/remote run với danh sách | A chờ đúng Results rồi xác nhận count1/task1 (trước journey tạo thêm kết quả thứ2) |
| B/P2: trap bỏ summary và getClientRects tính cả control trong details đóng | Thêm summary, tabIndex, checkVisibility, loại ancestor details đóng/inert | B kiểm Tab/Shift+Tab thực: close↔Thông tin summary, không ra BODY/address bar |
| B: resize breakpoint tự kéo focus khỏi composer | Resize chỉ trả focus nếu sheet trước đó mở | B kiểm375→1280 vẫn hostMsg |
| A: Plan183px/task, chỉ2 hàng đầy đủ; Execute259px/unconfigured | Gom configure/source/details/action cùng hàng, bỏ acceptance lặp và hướng dẫn thừa; đưa trợ giúp agent vào cùng footer | A retest Plan122px/task, đủ5 task dài trong1280×800; Execute215px rồi root tiếp tục gom footer trợ giúp/next (matrix cuối không tràn) |
| B: full report cắt600 và nằm sâu trong evidence | Hiển thị full report trực tiếp, không height cap | Source độc lập xác nhận; root browser response fixture2240 ký tự đọc đúng độ dài |

A xác minh thêm bằng browser: EN375/768/1280, source link mở Hội thoại/nav, draft qua Back/reload, Admin return, report/test ở màn đầu. B đo shared computed roles: Plan/Execute/Admin page20/28, section16/22, UI14/20, control desktop36, pill13/18. Cả hai kết luận không còn phát hiện chặn trong phạm vi đã review sau retest. Root đối chiếu bằng browser/hành trình/test riêng, không dùng lời reviewer làm nghiệm thu UX.

Giới hạn reviewer: không audit screen reader/Safari/remote model thật; zoom/theme/contrast và hồi quy đầy đủ do root kiểm riêng như ACCEPTANCE. Lượt cuối root gom footer Execute, đổi Quick item sang cùng component btn, token hóa các vai trò chữ và sửa tương phản xám. A kiểm lại source/browser: task Execute chưa cấu hình122px desktop,375px không tràn; run/action còn trước footer. B sanity-read delta cuối xác nhận focus filters/Quick/token màu/timestamp không có lỗi mới; nhắc vẫn còn literal code/JSON/SHA và heading setup, không tuyên bố đã loại toàn bộ literal CSS.
