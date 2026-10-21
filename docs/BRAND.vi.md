# Agent Meeting · Convergence v1

Hướng người dùng chọn: **nhiều góc nhìn hội tụ thành quyết định**. Người dùng đã duyệt logo Convergence v1 ngày 2026-10-21 (“logo 1 ok đó convergence”); dùng làm nhận diện chính của Agent Meeting.

## Ý tưởng

Ba hình hội thoại cùng hướng vào phần âm ở tâm. Mỗi hình có thể đọc riêng; khoảng trống chung xuất hiện khi ba hình được đặt cùng nhau. Logo diễn đạt cách Agent Meeting tạo quyết định qua trao đổi, giữ tính gọn và dễ nhận diện trên tab hoặc launcher.

Bản phác thảo raster ban đầu được tạo bằng công cụ imagegen tích hợp và lưu tại `docs/brand/concepts.png`. Bộ asset triển khai được dựng lại bằng SVG hình học, chuyển phần đuôi hội thoại về tâm để tránh cảm giác cánh quạt/tái chế. Không tracing raster, không thêm thư viện, font hay CDN. Các hình SVG dùng chung một path quay ba góc, không gradient hoặc hiệu ứng 3D.

## Bộ asset

| Asset | Dùng cho |
|---|---|
| `assets/brand/mark.svg` | Symbol indigo trên nền sáng |
| `assets/brand/mark-mono.svg` | In/hiển thị một màu tối |
| `assets/brand/mark-inverse.svg` | Symbol trắng trên nền tối |
| `assets/brand/wordmark.svg` | Symbol + tên sản phẩm, chữ system sans |
| `assets/brand/app.svg` | App tile indigo, hình trắng |
| `assets/brand/app-16.png` … `app-1024.png` | Raster theo kích thước đích |
| `assets/brand/app.ico` | Icon nhiều kích thước cho Windows |
| `assets/brand/app.icns` | Container icon PNG cho macOS |
| `assets/icon.svg`, `src/ui/favicon.svg` | Biểu tượng nguồn app/README và favicon, cùng hình học v1 |
| `assets/brand/legacy-icon.svg` | Bản cũ giữ để đối chiếu |

Wordmark SVG dùng chữ hệ thống nên hình dáng chữ có thể khác nhẹ giữa hệ điều hành. Symbol/app icon là path độc lập font. Không coi wordmark này là bản outline typography cuối cùng.

Màu chính `#4F46E5`; màu mực `#111827`; màu đảo `#FFFFFF`. Giữ palette hiện có, không đổi accent hoặc token typography toàn app. Clear space khuyến nghị bằng khoảng trống ở tâm logo, tối thiểu 1/8 chiều rộng symbol; giữ tỷ lệ và phần âm, không bóp méo hoặc thêm viền. Kiểm thực tế có các mẫu 16/24/32/48/64 CSS px; khả năng nhận diện trên thiết bị/thị lực thực tế vẫn cần đánh giá.

## Preview và dựng lại

```bash
node tools/brand-preview.js
# http://127.0.0.1:3122
```

Server preview chỉ phục vụ danh sách asset thương hiệu và trang trình bày được khai báo rõ, không mở toàn bộ checkout. Trang có biến thể sáng/đơn sắc/tối, icon kích thước thật, link tải SVG và lệnh xem trước cài app. Không phải một view nghiệp vụ mới của sản phẩm.

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tools/export-brand.js
```

Công cụ dev dùng trình duyệt Chromium đã có để rasterize SVG, rồi ghi container ICO/ICNS bằng Node standard library. Không có dependency runtime mới. `BROWSER_BIN` chọn browser executable hiện có. Native icon rendering trên macOS/Windows chưa được kiểm trên máy này; `file` nhận diện container không thay cho kiểm hệ điều hành thật.

Các ảnh/GIF showcase quay trước đợt branding này còn biểu tượng cũ theo đúng thời điểm ghi. Luồng UI trong demo vẫn giữ; cần quay lại với nhận diện Convergence đã duyệt trước lần cập nhật showcase tiếp theo.
