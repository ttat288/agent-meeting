# Briefcase identity — 2026-10-22

Theo yêu cầu người dùng, logo cặp công sở từ SVG được cung cấp thay Convergence. Hình học path và fill-rule được giữ nguyên; không thêm nền, gradient hoặc hiệu ứng 3D. Indigo chính #4F46E5, bản thích ứng sáng/tối dùng #A5B4FC ở ngữ cảnh tối. Người dùng cho phép điều chỉnh màu và yêu cầu đẩy app/README lên main.

## Phạm vi

Đồng bộ assets/icon.svg, src/ui/favicon.svg, bộ mark/wordmark/app.svg và9 PNG16–1024 cùng ICO/ICNS. Header Hội thoại/Quản trị dùng favicon chung. README Anh/Việt dùng logo80px có alt. Preview và BRAND/HANDOFF/CHANGELOG được cập nhật; các ảnh/GIF/evidence trước đây giữ đúng thời điểm ghi, không giả một bản demo mới.

Không sửa app layout, hành vi, API, CSP hoặc dữ liệu task/source/revision. Không restart process3000 hoặc cài vào app thật. Thư mục kiểm app là tạm, port được OS cấp riêng. Preview3122 chỉ phục vụ whitelist asset.

Đã đọc ui-ux-pro-max, token/source UI hiện hành. Truy vấn icon không cho mẫu briefcase phù hợp; không dùng kết quả UX lệch chủ đề để quyết định hình. Nguồn thiết kế là SVG người dùng; chỉ áp dụng nguyên tắc chung về nhất quán và khả năng đọc trên nền sáng/tối.

## Kiểm độc lập

- Browser Chromium/Brave trên source app thật:6 cấu hình OS light/dark × lựa chọn system/light/dark, chờ form và image decode. Ảnh app-light.png/app-dark.png đã xem, logo mới hiện ở header. Không pageerror. src/ui/favicon.svg, assets/icon.svg và favicon HTTP có cùng byte.
- Preview brand ở375/768/1280 CSS px không tràn ngang, chờ ảnh decode; brand.png là trang cuối.
- Đọc pixel PNG bằng canvas, cả9 kích thước: nền góc có alpha0, thân255; lỗ quai/khe nắp có alpha nhỏ hơn255, từ64px trở lên pixel tâm của hai vùng rỗng có alpha0. Ở16–32px có antialiasing trên khe nhỏ, không khẳng định mọi pixel khe đều0. Dữ liệu trong browser.json. Không có họa tiết caro trong asset.
-14 test installer hiện có chạy lại đạt, tuần tự trong một file với MemoryMax1200M/swap0, heap mặc định Node trong cgroup, deadline150s và test timeout30s. installer-tests.txt ghi log; payload nhận icon mới. Không thêm test chỉ phản chiếu markup logo.
- git diff --check đạt. Tool export khóa colorScheme light để PNG indigo có kết quả ổn định, không tùy theme desktop của máy render.
- Native ICO/ICNS cần workflow Desktop installer trên commit mới; screenshot/icon thực tế Finder/Start Menu vẫn là kiểm thủ công. Không coi smoke test là nghiệm thu toàn bộ UX hoặc nhận diện.
