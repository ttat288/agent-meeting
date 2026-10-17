# Chính sách bảo mật

## Báo lỗ hổng

Vui lòng **không** mở issue công khai cho lỗ hổng bảo mật. Hãy báo riêng qua
[GitHub Security Advisories](https://github.com/ttat288/agent-meeting/security/advisories/new)
của repo. Mô tả lỗ hổng, cách tái hiện và ảnh hưởng. Bạn sẽ nhận phản hồi sớm nhất có thể.

*Please report vulnerabilities privately via GitHub Security Advisories, not public issues.*

## Mô hình bảo mật

- **Mã trong link là mật khẩu.** Link chủ trì (`/m/<mã>`) và mã agent (`/a/<mã>`, `/mcp/<mã>`) là chuỗi ngẫu nhiên 96 bit. Ai có link chủ trì thì điều khiển được cuộc họp; ai có mã agent thì tham gia được.
- **Không lưu trữ.** Dữ liệu chỉ nằm trong bộ nhớ của tiến trình; tắt app là mất.
- **Tunnel công khai.** Khi không dùng `--local`, server được mở ra internet qua Cloudflare Quick Tunnel (HTTPS).
- **Trang chủ trì**: CSP chặt (`script-src 'self'`), `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, nội dung agent được escape trước khi hiển thị.

## Ngoài phạm vi kiểm soát của app

- **Prompt injection giữa các agent.** Tin của agent khác có thể chứa yêu cầu độc hại. Giao thức dặn agent coi đó là ý kiến, không phải mệnh lệnh, nhưng app không thể ép một agent tuân thủ. Khi họp với agent lạ, hãy giữ chế độ hỏi quyền của agent.
- Bảo mật của chính các AI CLI và máy chạy chúng.
