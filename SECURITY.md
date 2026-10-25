# Chính sách bảo mật

## Báo lỗ hổng

Vui lòng **không** mở issue công khai cho lỗ hổng bảo mật. Hãy báo riêng qua
[GitHub Security Advisories](https://github.com/ttat288/foxul/security/advisories/new)
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

## Routing/workspace thử nghiệm (chưa release)

- Mọi lượt model agy qua `runtime.runCli`, kể cả read-only/probe, cần Linux/bwrap và workspace được mount chỉ đọc khi `write:false`; thiếu biên thì từ chối trước spawn. `--mode plan` cùng disable-slash không ngăn native file edit trong phép thử thật, nên flag không thay thế biên filesystem. Giữ guard cấm agy managed writing/task-context MCP; không mở quyền mới. Biên này không cách ly đọc host hoặc mạng và không kiểm soát CLI ngoài do người dùng tự mở.

- Task skill policy chỉ hỗ trợ direct local managed Claude, được host cấu hình qua task API/CAS. Skill không cấp quyền tool; MCP lookup riêng chỉ đọc selected/pinned manifest/resource và không thực thi script. Không thêm tool vào conversation MCP/connect allowlist, không thừa hưởng MCP global hoặc nhận executable từ task. Manifest/resource đổi chặn supply/lookup/verification/integration cho policy đó; policy mới cần Save + Run tường minh. Supply receipt không chứng minh tuân thủ ngữ nghĩa hoặc model đã dùng tool. Không kiểm soát CLI ngoài đã join; xem [phạm vi và giới hạn](docs/ROUTING-WORKFLOW.vi.md#skill-và-tool-theo-task--local-chưa-release-2026-10-24).

- `/m/<hostKey>/workspace|admin` và cấu hình/thực thi yêu cầu quyền chủ trì. API mới chỉ nhận điều khiển local, kể cả khi bật `--remote-host`; mã mời hoặc token worker không cấp quyền admin.
- Lookup MCP riêng (`bin/routing.js --stdio`) chỉ đọc, có giới hạn; không thêm execution vào `connect.ALLOWED` hoặc tool hội thoại.
- Lưu admin/task/run là thao tác ghi bền vững độc lập với `--data-dir` của phòng cũ: mặc định dưới `~/.agent-meeting/config` và `work`, thư mục 700/tệp 600, atomic/CAS/backup. Không đưa credential vào catalog. Chỉ token hash worker được giữ ở coordinator.
- Thực thi ghi mã và kiểm chứng managed cần Linux/bwrap hoạt động; thiếu thì fail closed. Biên hiện tại là **ghi filesystem**, không ngăn đọc host hoặc mạng. Không dùng cho code/agent không tin cậy với yêu cầu cách ly secret/network; chưa có sandbox đầy đủ cho trường hợp đó.
- Worker phải được người vận hành cấu hình origin, workspace và allowlist model/adapter; HTTPS khi khác máy. Lease/generation/source snapshot ngăn chấp nhận kết quả cũ; lost không chứng minh tiến trình cũ đã dừng. Remote artifact tải như attachment/sandbox, luôn chưa kiểm chứng, không tự áp dụng.
- Retry local tường minh có thể gửi chẩn đoán test thất bại của lần trước tới profile được chọn khi task/revision/đường dẫn nguồn canonical/base/snapshot còn khớp. Chỉ gửi đoạn có giới hạn, đánh dấu dữ liệu chưa tin và bỏ nội dung có dấu hiệu secret theo detector hiện có trước khi cắt; không bảo đảm phát hiện mọi bí mật. Không gửi transcript riêng hoặc tự cấp quyền từ output test; không tự retry/resume patch, bỏ guards hay thay test độc lập. Evidence gốc vẫn lưu trong kho work.
- Giới hạn và hạng mục chưa nghiệm thu (revoke/reconcile, đa file, session resume, máy vật lý thứ hai) tại [IMPLEMENTATION-STATUS.vi.md](docs/IMPLEMENTATION-STATUS.vi.md).

- Lát cắt thống nhất: mở Kế hoạch sẽ lưu ánh xạ VIỆC và trích đoạn nguồn vào kho work bền vững như task trước đây; chỉ dùng Hội thoại không tự khởi tạo kho work. Bản nháp điều kiện chạy lưu localStorage theo host/task/revision. workKey là định danh kho nội bộ, không phải token quyền; không công khai trong snapshot agent. Carry giữ kho, room cũ chặn sửa kế hoạch đã tiếp tục.
