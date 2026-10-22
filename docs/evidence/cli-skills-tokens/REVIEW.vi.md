# CLI, graph skill và context — 2026-10-22

Base main e292fd3; chưa commit/push/cập nhật app cài local. Giữ phần HANDOFF chưa commit có sẵn. Kế hoạch: [PLAN](../../PLAN-cli-skills-tokens.vi.md). Không đổi UI/CSP, settings global, process3000 hoặc vendor CodeGraph; không gọi model/CLI trả phí.

## Hành vi đã triển khai

- `node bin/cli.js doctor`: chỉ đọc sự hiện diện room/bridge/executable. Không xuất room URL/key/header, không probe mạng/model hoặc khẳng định quyền MCP. JSON phân biệt unknown/not-probed/not-checked.
- `skills list/show/inspect`: mặc định skill sản phẩm trong src/skills; `--local` chỉ .agents/skills của cwd, `--dir` chọn rõ catalog. List có query/pagination và trần200 entry; đọc frontmatter8KiB, manifest <=64KiB, description<=600 ký tự. Show một text file nguyên vẹn <=32000byte. Metadata hỗ trợ YAML đơn giản, không parser YAML đầy đủ. File lỗi/symlink bị bỏ qua kèm số skipped.
- Graph suy ra từ link Markdown và literal references/scripts/assets trong SKILL.md: cạnh có đường dẫn thực, trạng thái và size; hash của manifest. Inspect không nạp body resource, không traversal đệ quy; chỉ show đúng resource khai báo. `list --graph --query` tìm thêm theo tên resource. Chặn ../, đường dẫn tuyệt đối, symlink và resource chưa khai báo; không chạy script. Đây là graph tài liệu theo liên kết rõ ràng, chưa phải semantic search hoặc dependency graph đầy đủ giữa mọi skill. Hash chưa bao gồm nội dung mọi reference. Đã inspect skill ui-ux-pro-max local thật, tìm đúng hai reference hiện có mà không nạp body vào context.
- History mới giữ compatibility: không argument vẫn full; truyền offset/limit/maxChars nhận trang JSON. Offset trên các tin người đọc có quyền xem, không thay cursor wait. Không cắt tin lớn để tránh mất quyết định; oversized báo vượt ngân sách, maxChars không phải token cap. Offset không phải snapshot ổn định qua renew; caller phải bỏ offset khi chuyển cuộc họp.
- Rút phần mô tả tool lặp, giữ tên/schema tham số cũ/annotations và giao thức bảo mật. Schema history thêm tham số, không thêm tool hoặc execution permission. Bridge đã cài phải reconnect theo yêu cầu người dùng để lấy schema mới; không tự cập nhật trong phiên này.

## Kiểm chứng

[tests.txt](tests.txt): **252 test/25 file đạt**, full suite tuần tự từng file, cgroup MemoryMax1200M/MemorySwapMax0, outer timeout900s, heap768MiB/timeout150s mỗi file và test timeout30s trên Node22.22.1. Có các ca mới: truy hồi đủ history/không mất wait cursor; Unicode, tin quá cỡ, input lỗi, offset cuối; HTTP/MCP thật với session/Bearer/admission/giả tên/tin riêng; CLI subprocess temp home, no-write, output redaction; skill graph hash đổi sau sửa nguồn, liên kết thiếu/escape/symlink, đọc resource chọn lọc. Test bridge stdio/connect hiện có vẫn chạy với CLI giả và HOME tạm, không model.

Skill validator quick_validate.py đạt. [package.json](package.json): npm pack dry-run xác nhận entrypoint skill + reference + CLI module nằm trong gói sản phẩm. Installer test14 ca trong suite kiểm payload ở thư mục tạm. Không cài skill vào .agents/skills hoặc settings global; AGENTS phân biệt skill sản phẩm với skill phát triển local.

## Đếm token và đối chứng

Dùng [tiktoken chính chủ](https://github.com/openai/tiktoken)0.14.0, cài trong venv /tmp riêng; runtime app vẫn Node stdlib. Script tái hiện: `node tools/measure-context.js | <python-venv> tools/count-context-tokens.py`; cache encoding trong /tmp. [token-measurements.json](token-measurements.json) ghi SHA256 và số byte/ký tự/token chính xác cho cl100k_base và o200k_base. [room-tools-before.json](room-tools-before.json) là schema conversation baseline e292fd3 để đối chiếu, không là cấu hình runtime.

| Workload | cl100k_base trước→sau | o200k_base trước→sau | Diễn giải |
|---|---:|---:|---|
| Chỉ cần5 tin cuối trong fixture100 tin |23506→1203|12474→653|Giảm94,88%/94,77% payload; không bỏ tin cần dùng |
| Cần toàn bộ lịch sử, đọc mọi trang |23506→23741|12474→12710|Tăng1,00%/1,89%, chưa gồm thêm lượt model |
| Schema conversation mỗi session |1174→1002|956→861|Giảm14,65%/9,94%, đã tính tham số phân trang mới |
| Cần1 reference từ12 skill×3 reference |35352→1224|35352→1228|Giảm96,54%/96,53% so với baseline đọc toàn catalog; tính cả list+inspect+entry+reference |
| Đã biết skill ngắn cần đọc |45→249|45→252|Graph thừa làm tăng204/207 token; nên show trực tiếp |

Đây là workload tổng hợp xác định, không so graph với một agent grep/rg đã tối ưu. Số phần payload không phải số lượt agent đã chạy. Chưa đo tokenizer riêng của Claude/Gemini/GPT6, hidden prompt, output/reasoning, request envelope, cache hit, billing hay hiệu quả quyết định. Không tuyên bố giảm tổng tiền94–96%. Kết quả chứng minh cơ chế giảm nội dung truy hồi khi chọn đúng một phần; dùng wait tăng dần, tránh history/full scan không cần thiết, tránh graph khi đã biết file.

## Giới hạn và việc còn mở

Chưa nghiệm thu CLI thật/auto-mode hoặc máy vật lý thứ hai theo hạn chế không model/settings của phiên. Doctor chỉ giúp chẩn đoán local; cần chủ trì duyệt join và mở phiên CLI mới nếu vừa connect. wait vẫn có thể trả backlog lớn khi mới vào; chưa thay đổi giao thức/cursor ở luồng này. Skill catalog không tự tìm global/vendor và không tự cài hoặc kích hoạt discovery native của từng client. CLI lấy được skill qua stdout; hướng cài native theo client phải được yêu cầu riêng. Không tự chuyển sang backlog UI/model/remote, không commit/push hoặc tạo release.
