# CLI, skill và ngân sách context — 2026-10-22

## Mục tiêu và hiện trạng

Người dùng yêu cầu lập kế hoạch rồi thực thi: CLI vào họp dễ hơn, lấy được skill Agent Meeting và tìm skill local, kiểm chứng tối ưu token. Source: main e292fd3; giữ thay đổi HANDOFF có sẵn. Không thay UI, app3000, settings global, bản cài local; không gọi model/CLI trả phí, commit/push.

Đã xác nhận trên mã: bridge có11 tool, tự chọn phòng từ rooms.json; connect yêu cầu thay settings và mở phiên CLI mới. wait đã dùng cursor và bỏ echo của chính agent, nhưng history trả toàn bộ; chưa có catalog skill/doctor. Thời gian long-poll không tự sinh nội dung model; tool schema, kết quả tool, lời nhắc và lượt model vẫn có chi phí. Không coi byte/4 là số token thật.

## Lát cắt triển khai

1. `doctor`: chỉ đọc trạng thái phòng/bridge/executable, không gọi agent hoặc mạng; ẩn mã/URL phòng, không khẳng định model/MCP được quyền hay server đang sống.
2. `skills list|show`: skill Agent Meeting đóng gói trong src; catalog local mặc định .agents/skills của cwd, hoặc --dir rõ ràng. List chỉ metadata có giới hạn, tìm bằng --query; show chỉ đúng một SKILL.md. Không quét home/vendor, không tự cài, thực thi script hoặc nâng nội dung skill thành quyền. Skill runtime đóng gói là tài nguyên sản phẩm, không phải cài skill phát triển vào .agents/skills.
3. `history` thêm offset/limit/maxChars tùy chọn: trang theo các tin người đọc có quyền xem; trả nextOffset, không thay cursor wait, không cắt giữa tin. Giữ lời gọi cũ toàn bộ lịch sử để tương thích. Tin quá cỡ trả riêng nguyên tin để không mất quyết định; báo rõ giới hạn này.
4. Sửa diễn đạt chi phí chờ; đo transcript fixture xác định: đọc lại full history so với chỉ đọc trang cần thiết. Báo byte/Unicode characters và số phần payload; token model/billing vẫn chưa đo khi chưa chạy model.

## Nghiệm thu và thứ tự

CLI list→tìm→show hoạt động không phòng/không settings; doctor không làm lộ credential. History có phân trang, riêng tư, đúng danh tính HTTP/MCP, không mất tin/đụng wait cursor. Test meaningful trong temp HOME/workspace, chạy từng file với cgroup1200M/swap0, timeout150s/file. Rồi full suite tuần tự có timeout tổng900s. Kiểm npm pack gồm skill product. Ghi bằng chứng và HANDOFF sau triển khai.

Giới hạn: không hứa CLI tự discover skill qua stdout, không đăng ký MCP/cài skill hộ; người vận hành chọn chỗ cài phù hợp CLI. Agent thật/auto-mode, máy thứ hai và billing token còn cần phép thử riêng. Không rút gọn luật bảo mật/giao thức để lấy phần trăm đẹp.

## Bổ sung theo yêu cầu CodeGraph

Áp dụng kỹ thuật truy hồi đồ thị: skill → explicit resource links, xác minh đường dẫn và hash SKILL nguồn, list metadata → inspect graph → show đúng resource. `list --graph --query` tìm thêm theo tên file tham chiếu. Không dùng embeddings hoặc suy ra nội dung tài liệu chưa đọc; không có index bền vững nên mỗi inspect đọc source hiện tại. Các cạnh chưa giải quyết/ngoài thư mục/symlink được báo blocked, không tự theo liên kết. Hash manifest không bảo đảm hash của mọi resource.

Đã đọc README CodeGraph local ghim226ac930; upstream tự lưu ý dense graph payload có thể tăng context resident. Không áp số benchmark upstream cho Agent Meeting, không cài/chạy CodeGraph hay script vendor. Benchmark bổ sung ca đã biết skill ngắn (graph có overhead), đọc hết history (phân trang có overhead), cùng hai ca chỉ cần một phần dữ liệu. Đếm đúng bằng tiktoken theo cl100k_base/o200k_base trong venv tạm; không suy ra billing/model tokenizer thực chưa biết.

## Kết quả

Đã triển khai các lát cắt trên, schema mô tả gọn giảm9,94–14,65% token theo hai encoding dù có phân trang mới. Full suite252 test/25 file đạt; skill validator và package dry-run đạt. Kết quả tokenizer, đối chứng overhead và giới hạn thực nghiệm trong [evidence](evidence/cli-skills-tokens/REVIEW.vi.md). Chưa gọi CLI model thật, thay settings hoặc cập nhật bản cài.
