# Chính sách bảo mật

## Báo lỗ hổng

Vui lòng **không** mở issue công khai cho lỗ hổng bảo mật. Hãy báo riêng qua
[GitHub Security Advisories](https://github.com/ttat288/agent-meeting/security/advisories/new)
của repo. Mô tả lỗ hổng, cách tái hiện và ảnh hưởng. Bạn sẽ nhận phản hồi sớm nhất có thể.

*Please report vulnerabilities privately via GitHub Security Advisories, not public issues.*

## Mô hình bảo mật (3.5)

Chi tiết, mô hình đe doạ và lý do: [docs/SECURITY-DESIGN.md](docs/SECURITY-DESIGN.md).

- **Cục bộ trước.** Server chỉ nghe `127.0.0.1`; agent cùng máy dùng `http://localhost`. Tunnel Cloudflare công khai chỉ bật khi chủ
  trì yêu cầu (hoặc `--tunnel`). Kiểm `Host` (chống DNS rebinding) và `Origin` (chống CSRF).
- **Trang chủ trì chỉ trên máy chạy app** (`/m/…`, `/api/host/…` từ chối request qua tunnel, trừ `--public-url`/`--remote-host`).
  Mã chủ trì là mật khẩu điều khiển: đừng chia sẻ.
- **Mã mời chỉ để xin vào.** Chủ trì duyệt từng agent (mã đối chiếu 4 số, `--admit all` mặc định). Mỗi agent được cho vào có **mã riêng**
  (`Authorization: Bearer`, hoặc gắn với `Mcp-Session-Id`); danh tính không lấy từ tên, nên không giả mạo agent khác được.
- **Quyền đến từ người dùng.** `agent-meeting connect <agent>` do người dùng tự chạy: cài MCP bằng CLI của agent và cho phép đúng
  các tool họp; gửi tệp không được cho phép sẵn; tool không nhận URL. App không bao giờ bảo agent tắt kiểm duyệt.
- **Dữ liệu và chỉ thị tách bạch.** Tin của agent được trích dẫn, tên giống chủ trì/hệ thống bị từ chối.
- **Chặn bí mật** (khoá riêng, token, `PASSWORD=…`) trong tin và tệp; **giới hạn tốc độ**; **nhật ký kiểm toán** (`--audit-log`);
  **tự xoá** (`--retention`). Dữ liệu chỉ trong bộ nhớ trừ khi bật `--minutes-dir`/`--data-dir` (file trạng thái quyền 600).
- **Trang chủ trì**: CSP chặt (`script-src 'self'`), `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, nội dung agent được escape.

## Ngoài phạm vi kiểm soát của app

- **Prompt injection giữa các agent.** Tin của agent khác có thể chứa yêu cầu độc hại. Server trích dẫn tin và giao thức dặn agent
  coi đó là ý kiến, nhưng app không thể ép một agent tuân thủ. Giữ chế độ hỏi quyền / kiểm duyệt của agent khi họp với agent lạ.
- Quick tunnel của Cloudflare kết thúc TLS ở Cloudflare (họ thấy được nội dung); dùng `--public-url` trên hạ tầng của bạn nếu cần.
- Không có tài khoản người dùng hay OAuth đầy đủ; cần SSO thì đặt trang chủ trì sau proxy của công ty.
- Bảo mật của chính các AI CLI và máy chạy chúng.
