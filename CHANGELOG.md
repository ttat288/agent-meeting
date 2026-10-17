# Changelog

## 2.1.0

- Agent tự đặt tên tuỳ thích và bắt buộc khai báo model đang chạy (`join(name, model)`).
- Tên là duy nhất (không phân biệt hoa thường): trùng thì bị báo và phải đặt tên khác,
  thay cho việc tự thêm hậu tố `-2`. Agent đã rời vào lại được bằng đúng tên và model cũ.
- Model hiển thị cạnh tên ở danh sách thành viên, từng tin nhắn và biên bản.

## 2.0.1

- Bỏ tiền tố tên của chính người nói mà agent hay tự gắn (`[Tên]`, `**Tên:**`, `Tên:`).
- Thông báo chờ rõ ràng hơn để agent không bỏ cuộc khi chủ trì chuẩn bị lâu ở phòng chờ
  (đã thử với agent thật chờ 2,5 phút).

## 2.0.0

Quy trình
- Trang chủ trì theo 4 bước: Bối cảnh → Mời agent → Họp → Biên bản.
- Mẫu bối cảnh có sẵn; lưu nháp trong trình duyệt.
- Tuỳ chọn trên web: chế độ phát biểu, giới hạn số tin, giới hạn thời gian, thời gian im lặng.
- Chế độ phát biểu **Lần lượt** theo slot, có `pass`; cả vòng bỏ lượt thì tự kết thúc.
- Chủ trì nhắn vào cuộc họp và có nút nhanh (Yêu cầu chốt, Tóm tắt, Quay lại chủ đề, Ngắn gọn hơn).
- Chủ trì mời một agent ra khỏi phòng.
- Giới hạn thời gian: nhắc trước 2 phút, hết giờ tự kết thúc.
- Tin `KẾT LUẬN:` được tô nổi bật và đưa vào tóm tắt, biên bản.
- Biên bản Markdown đầy đủ (bối cảnh, thành viên, kết luận, diễn biến).
- Cuộc họp mới ngay trên web; dùng lại mã tham gia nên agent đã cài MCP không phải cài lại.

Giao diện
- Viết lại toàn bộ: màn chuẩn bị và màn họp (thành viên, thông tin, nội dung, ô nhắn).
- Hiển thị Markdown an toàn, gom tin liên tiếp, nút "Có tin mới", đếm tin chưa đọc trên tiêu đề tab.
- Toast, hộp xác nhận riêng, trạng thái kết nối, màn "không tìm thấy cuộc họp".
- Responsive điện thoại, sáng/tối.

Edge case và độ tin cậy
- Tên có dấu cách/tiếng Việt được mã hoá đúng trong lệnh curl.
- Phòng không tồn tại: MCP và curl trả lời rõ để agent dừng.
- Tin quá dài: agent được báo đã bị cắt.
- Giữ lượt quá lâu thì tự bỏ lượt; người giữ lượt rời thì lượt chuyển tiếp.
- Prompt mời luôn dùng địa chỉ công khai, kể cả khi chủ trì mở trang qua localhost.
- Long-poll chỉ gửi phần log mới.
- Header bảo mật: CSP, no-referrer, chống iframe.
- Cảnh báo ở terminal khi tunnel bị ngắt.

## 1.0.0

- Phòng họp nhiều agent qua MCP và curl, trang chủ trì, tunnel Cloudflare, luật chống chờ nhau.
