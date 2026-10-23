# Context làm việc có giới hạn — protocol chuẩn bị, 2026-10-22

**Quyết định kế tiếp của người dùng:** chuyển phiên qua **swap runtime/model kế thừa cùng logical agent/slot**, thay out/join như hai thành viên độc lập. Đặc tả tại [PLAN-pm-operator](../../PLAN-pm-operator.vi.md#swap-phiênmodel-dưới-cùng-danh-tính-thành-viên). AI đề nghị swap/checkpoint; supervisor tạo successor chờ, server xác nhận ready/checkpoint và chấm dứt quyền ghi phiên cũ trước chuyển generation; task/WIP/evidence được giữ. Đây là nhiệm vụ đã giao cho phiên phát triển sau, chưa là chức năng runtime đã có. Benchmark giữ đo cả chi phí checkpoint/bootstrap/rehydrate và lỗi mất context/quyết định, không chỉ peak thấp sau đổi model.

**Cập nhật thực thi local:** đã có checkpoint/hash và supervisor swap cùng logical slot qua API/CLI, gồm read-only bootstrap và chặn writer cũ. [Bằng chứng](../pm-team/ACCEPTANCE.vi.md). Đây là cơ chế chuyển phiên ở biên adapter, không là collector/context controller, native auto-compaction hoặc phép thử8h. Analyzer/đối chứng dưới đây vẫn giữ nguyên; chưa có số đo model thật. Full snapshot ở backend, successor nhận context gọn + hash/WIP; không lấy giảm context fixture làm claim billing.

**Review/carry mới nhất:** [ASSESSMENT](carry-review/ASSESSMENT.vi.md) ghi hướng khả thi có điều kiện: code dựng recorded facts, delta còn thiếu ghi lúc làm, không thêm dedicated summary call khi đủ nguồn; không đồng nghĩa zero token. Có local experiment5 invariants và ledger2 review attempt: Flash factual output, Claude auth revoked nên chưa có independent design review thành công. Actual context/prediction/billing/semantic retention vẫn unverified. Quyền2 paid review attempt đã hết; model benchmark mới cần quyền riêng. Không giả statusline telemetry chạy trong adapter headless print hoặc ACK model giữ memory sang invocation activate mới.

**Benchmark local tiếp nối:** [benchmark-carry.json](carry-review/benchmark-carry.json) ghi21/21 ca trên export đã pin hash, truy hồi3 public projections tối đa8192 byte và từ chối hash/identity/revision xung đột; không là live retrieval API. Direct cùng facts459 byte, capsule1666; nếu đọc cùng toàn bộ evidence metadata thì1167 so2374 byte. Đây là overhead transport1207 byte, chưa có token/billing/model quality. ASSESSMENT có ma trận10 nhóm context thiếu/chưa dùng được trong export, nguồn canonical tương ứng và delta cần ghi; không đồng nhất export thiếu với live store thiếu.6/6 analyzer tests đạt trong lượt này, không chạy lại model/full suite. Controller vẫn tắt; không thêm quyền model hoặc nghiệm thu8h.

## Mục tiêu và giới hạn lời hứa

Người dùng muốn team có thể làm phiên dài8 giờ mà không mất khả năng tiếp tục vì context. Context không thể giữ nguyên tuyệt đối trong lúc nhận input, đọc file và sinh output. Mục tiêu kiểm được là giữ context làm việc trong ngân sách phù hợp, checkpoint/nén/chuyển phiên khi cần và tiếp tục đúng mục tiêu/quyền/acceptance. Tổng token/tiền vẫn có thể tăng trong khi context resident đã giảm; không gọi đó là tiết kiệm tổng nếu chưa đo.

App hiện không thể cưỡng chế context của CLI bất kỳ do người dùng tự mở. Phân biệt adapter có telemetry; adapter có quyền compact/chuyển phiên; CLI chỉ tham gia phòng qua MCP/curl. Loại cuối chỉ kiểm soát được dữ liệu app gửi, không thấy hidden prompts/tool/file mà CLI tự đọc hoặc điều khiển lịch sử nội bộ. Không đủ telemetry/control thì giữ `unknown`/unsupported, không hứa “không bao giờ đầy”. Khả năng8h cần model runtime thật và bằng chứng liên tục theo workload; chưa được nghiệm thu.

## Nguồn kỹ thuật đã đối chiếu

- [Claude Code status line](https://code.claude.com/docs/en/statusline): có context_window/current_usage, capacity và percentage. Bộ đo dưới đây cộng input + cache creation + cache read cho input context, không cộng output lần trả lời vào phần trăm đầu vào. current_usage=null trước phản hồi đầu hoặc ngay sau compact là chưa có số đo, không phải context=0. Đây là telemetry runtime theo cách tính của CLI, không là phép đếm độc lập mọi hidden overhead. Chưa cài statusline/hook hoặc sửa settings.
- [Official OpenAI documentation — Codex App Server](https://learn.chatgpt.com/docs/app-server): có thread/tokenUsage/updated và thread/compact/start, với lifecycle contextCompaction. Repo chưa có managed Codex adapter; chưa ghép schema usage đó thành context resident khi chưa kiểm hợp đồng version cụ thể. Chỉ có cộng dồn usage không đủ biết đang đầy bao nhiêu phần trăm.
- [Official OpenAI documentation — Compaction](https://developers.openai.com/api/docs/guides/compaction): có cơ chế giảm context cho tương tác dài. Đây là khả năng API, không tự biến thành quyền điều khiển mọi CLI hiện có của Agent Meeting.

Không hỏi model “bạn còn bao nhiêu context?” như nguồn benchmark. Có thể nhận tự báo nhu cầu checkpoint/blocker, nhưng số model tự ước lượng không phải telemetry, và hỏi liên tục còn thêm lượt/context/chi phí. Dùng collector xác định ở các mốc runtime, không gọi model riêng để lấy số.

## Bộ đo offline đã triển khai

`node tools/measure-context-window.js <trace.jsonl> [budgetPercent]` chỉ đọc trace tối đa8MiB/10000samples và in số đo; không đọc transcript, gọi CLI/model, ghi settings hoặc compact. JSONL dùng envelope local sau, data là snapshot runtime được collector được cấp quyền thu thập sau này:

```json
{"schema":"agent-meeting/context-sample@1","runId":"pilot-01","actorId":"worker-01","eventId":"event-001","at":1,"source":"claude-statusline","data":{"session_id":"session-id","version":"PINNED_CLI_VERSION","model":{"id":"PINNED_MODEL_ID"},"context_window":{"context_window_size":100000,"used_percentage":15,"current_usage":{"input_tokens":5000,"cache_creation_input_tokens":3000,"cache_read_input_tokens":7000,"output_tokens":1000}}}}
```

Ví dụ cấu trúc trên dùng số giả để mô tả schema, không là trace model thật. `at` là milliseconds theo clock collector, cùng clock trong một actor; eventId duy nhất trong run/actor. Không cần lưu transcript/path/prompt/credential. Khi benchmark thật, lưu raw telemetry đã lọc bí mật/hash ngoài repo và khóa CLI/model/nguồn collector; envelope do caller tạo không tự chứng minh dữ liệu là thật. CLI version/model có trong trace nhưng chưa có bước tự xác minh. Không cấu hình recorder global để thực hiện lượt này.

Report gồm peak input context/percentage, số snapshot có/không có telemetry, vượt budget, disagreement giữa percentage và token components, session IDs và model/version. Mặc định80% là ngưỡng phân tích minh họa, không ngưỡng an toàn phổ quát hoặc enforcement. Khóa budget trước phép thử, dành headroom cho output/tool/overhead và đặc tính runtime đã kiểm. Thiếu component có thể chỉ báo percentage riêng; telemetry mâu thuẫn giữ unknown. Không cộng các snapshot thành tổng token billing. Nhiều epoch/compaction không làm xóa peak cũ; context giảm không tự chứng minh đã compact thành công.

`observed-within-budget` chỉ nói các mẫu quan sát nằm dưới ngưỡng, không bảo đảm khoảng chưa lấy mẫu/future request. Output luôn có `continuousBoundGuaranteed=false`, `qualityVerified=false`, billed cost=null. Chưa có collector/control, chưa là app monitor trực tiếp. Codex/agy/CLI chưa có adapter mapping được giữ unknown. Event duplicate/order sai bị từ chối; không âm thầm xóa mẫu bất lợi.

## Đối chứng cần chạy khi có quyền/ngân sách

1. **Pilot telemetry nhỏ trước.** Một runtime được chọn/cấp quyền, thu mốc sau model responses và quanh compaction/chuyển phiên. Kiểm phiên bản, ngữ nghĩa input/cache/context, timestamp và coverage. Không kéo dài8h chỉ để có biểu đồ. Chưa qua pilot thì chưa nghiệm thu8h.
2. **Baseline native mạnh.** Direct CLI giữ auto-compaction/context management sẵn có bật, cùng model/version/input/acceptance/quyền và workload với Agent Meeting. Nếu baseline tự dùng checkpoint/context file hợp lý thì cho phép. Không so tool với một CLI bị tắt nén hoặc cố tình nạp mọi log. Instrument cả hai giống nhau và tính overhead collector/setup.
3. **Công việc thật.** Lấy backlog người dùng đã giao, input/scope/acceptance khóa; ví dụ kiểm chứng hoặc sửa lỗi repo theo các task có output độc lập. Không nhồi hội thoại/file rác để ép baseline đầy; không thêm đội/model chỉ nhằm làm context trên mỗi worker nhỏ hơn. Khóa tiêu chí và thứ tự trước chạy, giữ mọi lượt fail/retry. Pilot parser đã đóng băng là phép thử khác, không tự thay input đó.
4. **Tính liên tục sau checkpoint.** Khóa quyết định sản phẩm, constraint không commit/settings, task/goal revision, unknowns và acceptance trong nguồn chuẩn. Sau nén/chuyển phiên, kiểm tiếp tục đúng task và source revision, không quên ràng buộc hoặc tạo writer trùng; cùng test output/diff/review độc lập. Việc đọc lại nguồn là hợp lệ, nhưng tính token/time của nó. Có một câu trả lời “tôi nhớ” không đủ chứng minh.
5. **Mốc không chỉ là thời gian.** Đo theo task hoàn tất/model response/token được xử lý và thêm wall time. Nếu không có một lần nén/chuyển phiên thì chưa kiểm được khôi phục qua biên context. Chỉ gọi là8h khi có phiên thật8h; simulated clock/replayed logs không thay nó. Nếu baseline hoàn thành sớm thì ghi nhận lợi thế, không ép chạy thêm cho đủ8h. Thử8h không cấp deadline tổng cho quá trình phát triển.

Số đo bắt buộc: chất lượng/tỷ lệ hoàn thành; context peak và coverage mỗi actor/request quan sát được; overflow/error/timeout; compaction/restart có event và evidence; lượng context lúc rehydrate; chi phí input/output/cache/reasoning và mọi PM/lead/worker/review/compact/retry; elapsed và công giám đốc; setup/bảo trì/phục hồi. Token window/cost tiết kiệm là hai kết luận riêng. Các field chưa quan sát được giữ unknown.

Tiêu chí thành công của lát cắt đầu: telemetry có provenance và scope rõ; context bị kiểm soát tại các biên adapter đã kiểm; có checkpoint/khôi phục thật không làm mất acceptance/quyền; chất lượng tương đương baseline, toàn chi phí công khai. Không lấy “context thấp” bằng cách quên việc hoặc reset liên tục. Chỉ khóa ngưỡng hiệu quả/budget/run cap cụ thể sau khi chọn runtime/case và trước model run; chưa chọn số thắng từ kết quả. Benchmark chuẩn bị hiện chưa có model/collector/control hoặc kết quả8h.

## Trạng thái thực thi phiên này

Đã thêm bộ phân tích offline và tests. Tests dùng fixture xác định cho công thức cache/input, unknown sau compact, unsupported runtime, telemetry mâu thuẫn, giữ peak qua đổi session, duplicate/order/budget và giới hạn file/redaction. Không sửa `src/runtime.js` hoặc hai lỗi parser giữ cho pilot cũ; không thêm dependency, UI hoặc runtime launcher. Không gọi model/CLI trả phí, đọc log riêng của CLI người dùng, đụng3000/settings global/bản cài local/commit/push.

Kiểm chứng: xem `tests.txt`; đây là test bộ đo, không benchmark hiệu quả model hoặc bằng chứng CLI không đầy context. Bước kế tiếp là chọn adapter có telemetry+control thực và cấp quyền/budget pilot; mọi bước local hiện tại không cần xin duyệt lại. Không tự mở rộng thành hệ thống memory tổng quát khi chưa chứng minh yêu cầu/khả năng ở một adapter.
