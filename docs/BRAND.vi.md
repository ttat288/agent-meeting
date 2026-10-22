# Agent Meeting · Briefcase

Ngày 2026-10-22, người dùng chọn logo **cặp công sở đủ rộng để đựng laptop** và cung cấp SVG để thay Convergence trong app/README. Hình học giữ nguyên SVG người dùng gửi; đây là nhận diện hiện hành. Convergence và các bản phác thảo trước đó là lịch sử, không còn là bộ asset sử dụng.

## Hình và màu

Thân ngang, quai ngắn ở giữa, góc bo và khe nắp tạo hình cặp công sở quen thuộc. Dùng một path `fill-rule="evenodd"`; lỗ quai và khe nắp là vùng rỗng thật. Không có rect nền, bitmap nhúng, gradient, bóng đổ hoặc họa tiết caro.

Màu chính `#4F46E5`, biến thể tối `#111827`, trắng `#FFFFFF`. App/favicon và logo README đổi sang indigo sáng `#A5B4FC` khi ngữ cảnh ảnh dùng color-scheme tối. Không đổi palette hoặc token UI toàn app. Giữ clear space có sẵn trong viewBox128×128; không bóp méo hình, không lấp khe nắp hoặc lỗ quai.

## Bộ asset

| Asset | Dùng cho |
|---|---|
| `assets/brand/mark.svg` | Symbol indigo, nền trong suốt |
| `assets/brand/mark-mono.svg` | Symbol một màu tối |
| `assets/brand/mark-inverse.svg` | Symbol trắng |
| `assets/brand/wordmark.svg` | Symbol + tên sản phẩm, chữ system sans, hỗ trợ sáng/tối |
| `assets/brand/app.svg` | Symbol trong suốt, hỗ trợ sáng/tối |
| `assets/brand/app-16.png` … `app-1024.png` | PNG RGBA indigo với alpha thật |
| `assets/brand/app.ico` | Icon nhiều kích thước Windows |
| `assets/brand/app.icns` | Container icon PNG cho macOS |
| `assets/icon.svg`, `src/ui/favicon.svg` | Cùng byte với app.svg; README, launcher và favicon/header app |
| `assets/brand/legacy-icon.svg` | Bản hai người cũ, chỉ giữ để đối chiếu |

Wordmark dùng system font nên chữ có thể khác nhẹ giữa OS; symbol là path độc lập font. SVG dùng trực tiếp; bản PNG/ICO/ICNS được render từ app.svg trong chế độ sáng, không chụp nền ô caro. Alpha0 ở nền và vùng rỗng đủ lớn; phần thân opaque, mép có antialiasing. Ở kích thước16–32px, khe nắp nhỏ hơn hoặc gần một pixel nên pixel mẫu có thể mang alpha một phần thay vì0; đây là antialiasing của hình, không phải nền giả.

## Preview và dựng lại

```bash
node tools/brand-preview.js
# http://127.0.0.1:3122
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tools/export-brand.js
```

Preview chỉ whitelist trang và asset thương hiệu. Công cụ export dùng browser Chromium hiện có, Node standard library, không thêm dependency runtime. Có thể chọn executable bằng BROWSER_BIN. ICO/ICNS cần smoke test native theo workflow; giao diện thực tế Finder/Start Menu và cache icon vẫn cần kiểm thủ công.

Ảnh/GIF showcase và evidence trước ngày22.10.2026 giữ nhận diện cũ theo thời điểm ghi. Không chỉnh pixel ảnh/GIF cũ để giả một bản quay mới. Logo hiển thị đầu README và app source đã thay; demo cũ không phải bằng chứng cho nhận diện mới.
