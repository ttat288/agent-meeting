# Brand / desktop installer — 2026-10-21

Base review `102c8939f125803a842b357a8ee2a096c3de0669`. Sau review, người dùng đã duyệt logo và yêu cầu push toàn bộ lên main. Logo theo lựa chọn người dùng: nhiều góc nhìn hội tụ thành quyết định. Xem BRAND.vi.md và INSTALL.md để biết phạm vi và hợp đồng.

## Trước / sau

- Trước: icon hai người cũ, shell installer chỉ Linux. Sau: symbol ba hội thoại hội tụ, màu/đơn sắc/đảo màu, tile app, SVG/PNG16–1024/ICO/ICNS; CLI install/uninstall có plan cho ba OS.
- Source README icon và favicon dùng bộ mới; ảnh/GIF showcase cũ giữ đúng thời điểm ghi. App local đang chạy không bị thay hoặc restart.
- Linux: payload cài tạm chạy CLI --version thật; nâng cấp giữ backup; lỗi ghi được tiêm để kiểm khôi phục app/launcher; gỡ giữ dữ liệu và file sửa tay. GLib gio launch thực thi fixture --version với tên đường dẫn Unicode/space/ký tự reserved, không mở phòng/server.

## Review độc lập và xử lý

Hai reviewer là subagent Codex nội bộ `/root/showcase_structure` (A: cấu trúc installer, an toàn file/upgrade/rollback) và `/root/showcase_accessibility` (B: brand, icon nhỏ, typography/focus/copy). Dùng model kế thừa phiên; API không cung cấp ID model thực tế nên không gán tên hãng/model khác. Không gọi CLI/model trả phí hoặc bật routing profile. Reviewer chỉ đọc, không ghi file.

- A phát hiện P1 dangling symlink có thể hướng ghi ra ngoài đích. Root tái hiện regression đỏ trước fix; dùng lstat kể cả link đứt, ghi temp độc quyền rồi rename; COM Windows tạo shortcut ở private temp. Regression xanh và A kiểm lại đúng nguyên nhân, không còn blocker trong source scope đã review.
- B phát hiện giới hạn native thiếu trên preview và viền focus tối tương phản2.84:1. Đã thêm giới hạn và dùng #a5b4fc (8.97:1); B kiểm lại preview đúng byte source, không còn blocker trong scope brand/assets/docs. B không chạy browser responsive/native OS; root kiểm browser độc lập.

## Kiểm độc lập trên source cuối

- `npm test`: 245 test,23 file,0fail. Chạy tuần tự qua scripts/test.js, heap768MB/file, deadline150s/file, cgroup MemoryMax1200M/MemorySwapMax0, toàn lượt timeout900s. Log: tests.txt.14 test desktop installer cũng chạy riêng đạt.
- `git diff --check` đạt.
- Browser Chromium/Brave headless có sẵn, không thêm dependency:375/768/1280 CSS px, cao720. Chờ image/font render; scrollWidth bằng viewport ở cả3, toàn bộ ảnh hiển thị load thành công, không pageerror. Kiểm clipboard bằng stub không sửa clipboard thật, thành công và lỗi đều có phản hồi; Tab/Shift+Tab tạo viền focus đúng màu.5 link tải trả200. Xem browser.json và brand-*.png; root đã xem ảnh375 và1280.
- `file` nhận diện ICO7frames và ICNS; chưa chứng minh icon hiển thị native. macOS/Windows smoke được viết trong workflow, không thể thực thi native ở Linux; xem workflow trên commit được push để biết kết quả CI. Finder/Start Menu launch, Gatekeeper/Windows policy và icon high-DPI cần kiểm native.
- Không thay CSP của app, port3000/3120, settings global, PATH, MCP hoặc bản cài thật. Preview3122 chỉ phục vụ whitelist file, bind127.0.0.1.

Cập nhật sau review: người dùng đã duyệt logo Convergence v1 ngày 2026-10-21 (“logo 1 ok đó convergence”); wordmark dùng system font, chưa outline. Không có kiểm tra pháp lý độc quyền thương hiệu. Desktop launcher vẫn cần Node18+ ổn định và mở console + web UI hiện có; không phải binary độc lập. Managed execution vẫn theo giới hạn Linux/bubblewrap. Lệnh GitHub main được cập nhật khi xuất bản; native launch GUI vẫn cần nghiệm thu riêng.
