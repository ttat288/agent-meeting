# Đóng góp cho Agent Meeting

Cảm ơn bạn đã quan tâm! *English speakers are welcome too: issues and PRs in English are fine.*

## Cách đóng góp

- **Báo lỗi**: [mở issue](https://github.com/ttat288/agent-meeting/issues/new/choose) theo mẫu "Báo lỗi". Ghi phiên bản (`--version`), hệ điều hành, agent đang dùng, và nội dung terminal.
- **Đề xuất tính năng**: mở issue theo mẫu "Đề xuất". Mô tả vấn đề bạn gặp trước, giải pháp sau.
- **Tài liệu, bản dịch**: sửa README, [docs/GUIDE.md](docs/GUIDE.md), hoặc dịch giao diện và giao thức sang ngôn ngữ khác.
- **Code**: xem phần dưới.

## Chạy dự án

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting
npm test                          # phải xanh trước khi gửi PR
npm start -- --admit remote --no-open    # chạy local (bot giả lập vào không cần duyệt)
npm run demo -- <URL mời agent>   # 3 agent giả lập để thử giao diện
```

Không cần `npm install`: dự án **không có thư viện ngoài**, và nên giữ như vậy.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/meeting.js` | Lõi cuộc họp, không phụ thuộc HTTP. Luật mới đặt ở đây, kèm test trong `test/meeting.test.js`. |
| `src/server.js` | HTTP: MCP, API curl, trang chủ trì. Test trong `test/server.test.js`. |
| `src/ui/` | Trang chủ trì: HTML/CSS/JS thuần, không build. |
| `bin/cli.js` | Lệnh chạy, tunnel, mở trình duyệt. |

## Quy ước

- Giữ **không phụ thuộc**: chỉ dùng thư viện chuẩn của Node.js (18+) và API trình duyệt.
- Mỗi thay đổi hành vi cần **test** đi kèm. `npm test` chạy trên Node 18, 20, 22 trong CI.
- Văn bản giao diện và giao thức hiện bằng tiếng Việt; giữ giọng văn ngắn gọn, rõ ràng.
- Giao diện phải an toàn: không chèn HTML chưa escape; dùng `textContent` hoặc hàm `md()` có sẵn.
- Thay đổi giao thức gửi cho agent (`_protocol` trong `meeting.js`) nên được thử với ít nhất một agent thật.
- Commit message ngắn gọn, nói rõ *vì sao*. Cập nhật [CHANGELOG.md](CHANGELOG.md) cho thay đổi người dùng thấy được.

## Pull request

1. Fork, tạo nhánh từ `main`.
2. Viết code và test, chạy `npm test`.
3. Mở PR theo mẫu, mô tả cách bạn đã kiểm tra.

Khi tham gia, bạn đồng ý tuân theo [Quy tắc ứng xử](CODE_OF_CONDUCT.md).
