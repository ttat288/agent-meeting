# Foxul

**Multiple agents. One clear outcome.**

The moderation layer that keeps multi-agent discussions on track and drives them to a final decision.

Ngày 2026-10-25, giám đốc cung cấp logo cáo và chọn tên Foxul để thay nhận diện briefcase; sau khi nhận bản tích hợp đã đồng ý chuyển sang quay video demo mới. Giữ hướng nhận diện này khi dựng video; không tự vẽ lại, thêm biểu tượng hoặc tối giản hình học. Sự đồng ý không chứng minh trademark, khả năng nhận diện ở mọi kích thước hoặc nghiệm thu mọi luồng UI.

## Logo và màu

Logo cáo có ghế phía sau, mặt chia mảng tối và đuôi cuộn thành vòng. Giữ tỷ lệ, chi tiết trắng ngà, chuyển sắc và viền sáng của ảnh do giám đốc cung cấp. Chỉ loại nền ngoài và chuẩn hoá canvas trong suốt. Không gọi bản raster là logo vector.

| Vai trò | Màu |
|---|---|
| Nền tối / Obsidian | `#0B0D12` |
| Màu chủ đạo / Indigo | `#4F46E5` |
| Viền sáng, accent tối / Cool Indigo | `#8B93FF` |
| Nội dung trên nền tối, nền sáng / Ivory | `#F4F3EF` |

Palette là token nhận diện, không phải cam kết mọi pixel của ảnh có đúng bốn mã màu: ảnh gốc có antialiasing và chuyển sắc. Dùng bản đủ màu trên cả nền sáng và tối, không áp filter hoặc đổi hue. Chưa có bản đơn sắc hay đảo màu được duyệt; trắng ngà là màu dành cho hướng đảo màu về sau, không tự chuyển toàn logo thành một khối trắng.

UI giữ sáng/tối theo hệ thống và lựa chọn theme hiện có, Indigo cho hành động chính, Obsidian và Ivory cho nền/chữ. Giọng văn trực tiếp, cụ thể; không dùng hiệu ứng, lời tán dương hoặc hứa tiết kiệm chưa có bằng chứng để tạo cảm giác đẳng cấp.

## Asset hiện hành

| Asset | Công dụng |
|---|---|
| `assets/brand/foxul.png` | Master RGBA đã tách nền; README và trang review |
| `assets/brand/app-16.png` … `app-1024.png` | Icon xuất từ master, giữ alpha |
| `assets/brand/app.ico`, `app.icns` | Icon desktop nhiều kích thước |
| `assets/brand/mark.svg`, `app.svg`, `assets/icon.svg`, `src/ui/favicon.svg` | Container SVG nhúng raster để tương thích đường dùng cũ; không phải vector master |
| `assets/brand/wordmark.svg` | Logo raster + chữ Foxul bằng system font, chữ hỗ trợ sáng/tối |
| `src/ui/favicon.png` | Icon tab 32 px |
| `src/ui/logo.png` | Bản 128 px phục vụ header 32 px, không tải master dung lượng lớn |

Các bản `mark-mono.svg` và `mark-inverse.svg` của briefcase được loại khỏi bộ hiện hành vì không có biến thể Foxul tương ứng được duyệt. Có thể khôi phục từ lịch sử Git. `legacy-icon.svg` và ảnh concept cũ chỉ là tư liệu lịch sử, không dùng trong sản phẩm hoặc trang review.

Master xuất phát từ ảnh `Gemini_Generated_Image_rvuxtnrvuxtnrvux.png` do giám đốc cung cấp. Tách nền dùng công cụ chỉnh ảnh tích hợp, với yêu cầu giữ nguyên hình/chuyển sắc/chi tiết bên trong và alpha thật ngoài silhouette; cần kiểm thị giác thay vì coi lệnh tách nền là bảo đảm khớp pixel. Prompt cuối đã dùng:

> BACKGROUND REMOVAL ONLY. Extract the exact logo from this image onto real transparent alpha. Keep the original artwork, colors, white inner fox details and shape unchanged; no regeneration or stylistic change. Completely eliminate the white exterior background and any stray exterior pixels, blue noise, speckles or halo. A pristine clean smooth silhouette is essential. Center the extracted logo on a SQUARE 1024x1024 transparent canvas with 6 percent padding on all four sides, tail fully visible. Internal ivory ears, eyes, cheeks and tail remain solid ivory. Deliver only the clean isolated logo. No added elements, no text, no new shadow.

File thực tế là 1254×1254 px; không nhận đã tuân thủ chính xác kích thước/padding từ prompt. Kiểm alpha xác nhận bốn góc bằng 0, nền ngoài có alpha thật và chi tiết trắng bên trong vẫn hiện. PNG được xuất 16–1024 px, ICO có 7 kích thước; browser trên source tích hợp kiểm 72 ca bố cục và source→reload→Back giữ task IDs. Full `npm test` và 204 link/anchor trong 22 Markdown đã đổi đạt tại lượt tích hợp nhận diện. Đây là kiểm kỹ thuật và self-review; giám đốc sau đó đồng ý dùng hướng nhận diện để quay demo, native OS icon chưa kiểm lại.

## Kích thước và kiểm tra

Header dùng 32 px. Bản 16/24/64 px được đặt cạnh nhau trên nền Ivory và Obsidian trong trang review. Đây là downsample cùng artwork, chưa có responsive mark được vẽ riêng. Ở 16 px, tai và vòng đuôi là tín hiệu chính; mặt, ghế và các khe nhỏ có thể nhập lại. Không nhận đã giải quyết độ rõ favicon chỉ từ việc xuất đủ size. Giám đốc cần xem ở kích thước thật trước khi quyết định có cần micro mark riêng.

```bash
node tools/brand-preview.js
# http://127.0.0.1:3122
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tools/export-brand.js
```

Exporter dùng browser hiện có, không thêm dependency runtime. Nó tạo PNG/ICO/ICNS và container SVG từ master; không dùng AI để xuất từng size. Kiểm native Finder/Start Menu và cache icon vẫn cần thực hiện trên đúng OS.

## Tên hiển thị và tương thích

Tên sản phẩm, header/title, README và tài liệu hiện hành dùng Foxul. Package/CLI/MCP/schema/storage keys và đường cài vẫn dùng định danh `agent-meeting` để tương thích. Theo chỉ đạo tiếp theo ngày 2026-10-25, GitHub repo đã đổi thành `ttat288/foxul`, remote dùng `https://github.com/ttat288/foxul.git` và checkout thật ở `/home/theo/workspace/foxul`. Symlink đường dẫn cũ giữ phiên phát triển đang mở hoạt động; không có bản sao source thứ hai. Không publish package hoặc migrate dữ liệu người dùng. Launcher cài sẵn cần người dùng cập nhật tường minh mới nhận asset mới.

Media và receipt cũ giữ nguyên tên/logo tại thời điểm ghi; README/Showcase ghi rõ chúng có trước Foxul. Không sửa pixel ảnh/video cũ để giả bản quay mới. Độ khác biệt, khả năng đăng ký nhãn hiệu và phản hồi người dùng chưa được nghiên cứu; quyết định dùng tên/logo không tự chứng minh các điều đó.
