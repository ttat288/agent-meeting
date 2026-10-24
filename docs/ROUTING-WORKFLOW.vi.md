# Chia việc theo catalog và bằng chứng

Catalog/policy/handoff có schema `agent-meeting/routing@1`, mặc định ở `src/defaults/routing.json`.
Bản prompt gốc và SHA-256 được giữ nguyên; xem `ROUTING-COVERAGE.vi.md`. Nhận định ưu tiên là giả thuyết người dùng, không phải xếp hạng đã benchmark.

## Tra cứu trước khi giao

```bash
node bin/routing.js list_profiles
node bin/routing.js get_profile '{"id":"opus-claude"}'
node bin/routing.js recommend_profile '{"task":{"kind":"review"}}'
node bin/routing.js check_runtime '{"adapter":"claude"}'
node bin/routing.js --stdio
```

Không cần join phòng. MCP stdio chỉ có bốn tool đọc; execution không thuộc allowlist hội thoại.
`AGENT_MEETING_CONFIG_DIR` hoặc server `--config-dir` chọn cùng thư mục cấu hình. Nếu dùng thư mục tùy chỉnh, đặt cùng biến khi gọi CLI lookup.
Lookup có pagination, tối đa 32 KiB, revision và unknowns. Không có ứng viên hợp lệ là kết quả bình thường; trưởng nhóm có thể giữ việc.

## Cấu hình và chạy local

Từ link chủ trì mở **Không gian làm việc** (`/m/<mã>/workspace`), **Quản trị** (`/m/<mã>/admin`).
Mặc định có thể trao đổi qua phòng cũ ngay, không cần cấu hình runtime. Ba lựa chọn mục đích/vị trí/quản lý độc lập.

1. Quản trị model: nhập model ID đã đối chiếu, nguồn và ngày; bật model/hồ sơ. Nhập tay chỉ tạo nguồn `user-configured`, không tự thành benchmark.
2. Ánh xạ runtime: hiện Claude Code có adapter ghi mã; agy hỗ trợ đọc/plan; Codex/Gemini CLI trong catalog chưa đồng nghĩa có adapter thực thi.
3. **Probe model** gọi CLI thật, có thể phát sinh usage. Với agy, cả probe/read-only đều cần Linux/bwrap để chặn ghi filesystem; plan flag không phải biên ghi. Thiếu sandbox thì từ chối, không fallback không cách ly. Quan sát có revision/runtime, hết hạn 30 phút; đổi cấu hình phải probe lại. `check_runtime` không xác nhận model access. Nếu output không xác nhận model thực thì giữ `unknown`.
4. Tạo task thực hiện local/managed: workspace Git, base revision, đường dẫn được sửa, tiêu chí và tệp Node test nằm ngoài phạm vi sửa. Không nhập command shell. Task chưa khởi chạy cho tới khi chọn Chạy.
5. Run chụp cấu hình/snapshot nguồn, chép file theo Git có giới hạn sang workspace riêng. Worker không ghi cây nguồn. Linux cần bwrap; thiếu hoặc namespace bị chặn thì từ chối ghi, không chạy fallback không cách ly. Bwrap hiện cô lập **ghi filesystem**, không cô lập đọc/mạng; không coi đây là sandbox bí mật.
6. Agent báo xong → `reported`. Người chủ trì/trưởng nhóm gọi kiểm chứng: chạy test độc lập, output/exit code gắn run. Không đủ model identity/test hoặc thay đổi ngoài scope không được nghiệm thu.
7. `verified` → tích hợp một file, kiểm tra toàn snapshot nguồn, chạy lại test trên source tích hợp. Test lỗi/hủy thì rollback nếu source chưa bị người khác sửa. Nhiều file phải tích hợp thủ công có review; app không tự merge.
8. Nguồn đổi: cập nhật snapshot có chủ động (`rebase`), vô hiệu bằng chứng cũ, kiểm chứng lại. Run đang chạy giữ cấu hình cũ, quyết định mới đọc revision mới.

Handoff JSON xuất snapshot yêu cầu của chính run (`task`), cùng `requirementRevision`, `currentRequirementRevision` và `requirementsCurrent`. Run đã integrated vẫn là bằng chứng lịch sử nếu task đã sửa; không nghiệm thu acceptance mới. Run cũ thiếu snapshot xuất `task: null` và limitation, không lấy task hiện tại để điền. Source refresh chỉ nhận run còn đúng requirement và nguồn hội thoại/canonical checkout; bị chặn thì không sửa workspace/evidence/task state. Checkout tạm mất trả lỗi filesystem; khôi phục đúng đường dẫn rồi chủ động refresh, verify và integrate, không tự chạy lại.

Tích hợp một file và rollback giữ permission bits ban đầu trên Linux ngay cả khi process umask chặt hơn. File mới giữ mặc định0600; không suy thành bảo toàn ACL/xattr/ownership hoặc chế độ executable của file mới.


Cấu hình lưu một snapshot nhất quán tại `~/.agent-meeting/config/config.json`, backup `.bak`, khóa liên tiến trình/CAS. Task/run ở `~/.agent-meeting/work/`; `--work-dir` đổi chỗ, phải nằm ngoài checkout nguồn. File hỏng báo lỗi và giữ nguyên, không tự reset. Tiến trình bị ngắt thành `interrupted`, không tự giao lại khi chưa đối chiếu trạng thái cũ. Bản đầu chưa có resume nguyên session.

## Bằng chứng phát triển chính dự án

- `docs/evidence/routing-implementation/B2-SCOUT.json`: agy trích xuất ranh giới allowlist; requested `gemini-3.8-flash-low`, actual unknown.
- `B2-REVIEW.json`: Claude review độc lập, machine output xác nhận `claude-opus-5-5`; nhận xét vẫn phải đối chiếu code, không coi là facts mới.
- `B3-IMPLEMENT.json`: task sửa parser thật bằng Claude trong workspace/bwrap, scope một file. Trạng thái cuối chỉ lấy từ kiểm chứng/integration evidence, không lấy lời agent.

Chi phí null là chưa biết; không thay bằng 0. Không có RAG hoặc tự học xếp hạng khi chưa có baseline phù hợp.

## Skill và tool theo task — local, chưa release (2026-10-24)

Host local dùng cùng `POST /api/host/<hostKey>/work/tasks` hoặc `work/tasks/<taskId>/configure` với `expectedRevision`. Không nhập lại nội dung guide vào Facts. Trước tiên xem metadata bằng CLI đã có:

```bash
node bin/cli.js skills list --dir /absolute/workspace/.agents/skills
node bin/cli.js skills inspect csv-guide --dir /absolute/workspace/.agents/skills
```

Trong yêu cầu task, thêm policy rõ ràng (ID là folder skill, không phải đường dẫn/command):

```json
{
  "expectedRevision": 2,
  "skillPolicy": {
    "catalog": "local",
    "required": ["task-rules"],
    "optional": ["csv-guide"],
    "tools": ["skill_load"]
  }
}
```

`catalog` chọn `local` (chỉ `.agents/skills` trong workspace task) hoặc `bundled` (`src/skills` đóng gói). Không quét global/vendor. Required được supplied một lần **mỗi attempt stateless**, optional chỉ metadata và resource/hash. Metadata sẵn trong bootstrap nên có thể gọi thẳng `skill_load` với `{id, resource}`; `skill_list` là grant tùy chọn để đọc lại metadata. Không cấp cả catalog tự động theo từ khóa chưa kiểm chứng. Host chọn đúng phạm vi; rule handoff chung trong bootstrap không chứng minh model giữ đủ ý.

Lưu policy pin manifest + các resource text liên kết với SHA-256, version nếu manifest khai báo, nguồn canonical và trạng thái resource không khả dụng. Tối đa8 required +8 optional,20 links/skill,32KB/text resource và256KiB tổng nguồn. Nguồn đổi/thiếu: sửa/review catalog rồi gửi lại **skillPolicy tường minh** và expectedRevision để tạo revision mới; save acceptance thông thường không âm thầm repin. Không auto Run sau Save. Để ngừng chọn skill/grant, gửi policy có các list rỗng (catalog bundled không cần thư mục local). Task không có policy giữ đường chạy cũ, không thêm guide/catalog.

Metadata có `descriptionTruncated: true` khi description vượt 600 ký tự Unicode; phần thiếu không phải toàn bộ hướng dẫn. Dùng `skills show` hoặc `skill_load` được cấp để đọc manifest đầy đủ. Cờ vắng nghĩa không bị cắt, giữ tương thích snapshot cũ. MCP giới hạn 65536 byte mỗi dòng request, không tính cả burst nhiều dòng thành một request.

MCP `bin/task-skills.js` chỉ khởi chạy riêng cho managed Claude với đúng `skill_list`/`skill_load` đã cấp. Runtime dùng strict MCP config riêng, không kế thừa MCP global; task policy tắt native skills/slash commands, hooks và user/project/local settings sources trong lần gọi CLI, không sửa settings/OAuth. Managed/system policy của CLI vẫn áp dụng; native CLAUDE.md/provider system context chưa được đo hoặc nhận là nằm hết trong supply ledger. Không dùng `--bare` vì bản CLI đã kiểm vô hiệu OAuth trong chế độ đó. Không thay credential để chạy model. Quyền Read/Edit/Write có sẵn và biên bwrap không thay thành sandbox đọc/mạng; MCP deny không có nghĩa CLI không thể đọc file qua quyền Read riêng.

Chỉ tool lookup đã cấp được phơi và gọi; tool lạ/bị cấm trả `SKILL_TOOL_DENIED`, resource ngoài liên kết/pin trả lỗi có bước phục hồi. Script liên kết chỉ được đọc như text, không thực thi. Nạp lại manifest đã supplied hoặc resource đã load trả receipt/hash, không trả lại body trong cùng tiến trình MCP. Restart MCP có thể đọc lại resource; không có bảo đảm dedupe cross-process. Không có arbitrary MCP endpoint/command/service trong task policy.

Scope hiện tại: direct local managed Claude. agy, remote và team/swap bị chặn policy này; CLI do người dùng mở rồi join phòng không được app kiểm soát context/tool. UI chưa có policy editor: task API local là điều khiển cấu hình; Execute/Results dùng alert và handoff hiện có. `skillEvidence` ghi selected/supplied/hash/grant và `applied: not-observed`; không gắn enforced/compliant. Nguồn skill ignored vẫn được kiểm trước/sau verify/integrate, không là giao dịch filesystem nguyên tử. Semantic application và lựa chọn tool của model cần quan sát riêng.

Tự tái lập không model: `node tools/check-task-skills.js`; so baseline cùng CSV/8checks bằng `--baseline-root <checkout archived>`. Kết quả/giới hạn và nguồn baseline tại [evidence/task-skills/ACCEPTANCE.vi.md](evidence/task-skills/ACCEPTANCE.vi.md). Đây là scripted API/MCP/browser evidence, chưa chứng minh tiết kiệm token/billing hay giảm thời gian người thật.

## Worker qua HTTP

Quản trị → Máy & workspace để tạo định danh/token và cấu hình máy tương ứng. File riêng quyền 600 có:
`serverUrl`, `hostId`, `token`, `workspace`, `workspaceId`, `workDir` ngoài checkout, `allowedModels` và `adapters` được người vận hành chọn rõ.

```bash
node bin/worker.js --config /absolute/path/worker.json --once
```

Mỗi lệnh đăng ký snapshot thật, nhận tối đa một task rồi thoát; không có task thì idle. Chủ trì xếp hàng task remote/mixed với profile/host cụ thể; không nhầm enrollment với process đang chạy. Khác máy phải dùng origin HTTPS worker truy cập được, chỉ worker API qua mạng; admin vẫn local. Quota/model access ở remote chưa được probe bởi coordinator và được lưu unknown khi dispatch chủ động.

Remote token được hash ở coordinator, bản rõ chỉ hiển thị một lần. Worker giữ receipt private trước chạy, chỉ sửa bản sao; heartbeat lỗi thì hủy và cần reconcile. Artifact `changes.json` có hash, task/run/base/requirement/generation/full input snapshot; tải trên UI như kết quả chưa kiểm chứng. Không áp dụng patch tự động. Dữ liệu cũ thiếu snapshot giữ unknown. Kết quả cũ bị từ chối khi lease/generation/snapshot không còn khớp; giao lại không chứng minh tiến trình cũ đã dừng.

Tab Kết quả hiển thị metrics cùng trạng thái riêng reported/verified/integrated. Remote retry generations và usage/cost được ghi nhận; chi phí chưa có vẫn null. Chưa có baseline matched để đổi routing tự động.
