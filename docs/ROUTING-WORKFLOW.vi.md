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
3. **Probe model** gọi CLI thật, có thể phát sinh usage. Quan sát có revision/runtime, hết hạn 30 phút; đổi cấu hình phải probe lại. `check_runtime` không xác nhận model access. Nếu output không xác nhận model thực thì giữ `unknown`.
4. Tạo task thực hiện local/managed: workspace Git, base revision, đường dẫn được sửa, tiêu chí và tệp Node test nằm ngoài phạm vi sửa. Không nhập command shell. Task chưa khởi chạy cho tới khi chọn Chạy.
5. Run chụp cấu hình/snapshot nguồn, chép file theo Git có giới hạn sang workspace riêng. Worker không ghi cây nguồn. Linux cần bwrap; thiếu hoặc namespace bị chặn thì từ chối ghi, không chạy fallback không cách ly. Bwrap hiện cô lập **ghi filesystem**, không cô lập đọc/mạng; không coi đây là sandbox bí mật.
6. Agent báo xong → `reported`. Người chủ trì/trưởng nhóm gọi kiểm chứng: chạy test độc lập, output/exit code gắn run. Không đủ model identity/test hoặc thay đổi ngoài scope không được nghiệm thu.
7. `verified` → tích hợp một file, kiểm tra toàn snapshot nguồn, chạy lại test trên source tích hợp. Test lỗi/hủy thì rollback nếu source chưa bị người khác sửa. Nhiều file phải tích hợp thủ công có review; app không tự merge.
8. Nguồn đổi: cập nhật snapshot có chủ động (`rebase`), vô hiệu bằng chứng cũ, kiểm chứng lại. Run đang chạy giữ cấu hình cũ, quyết định mới đọc revision mới.

Cấu hình lưu một snapshot nhất quán tại `~/.agent-meeting/config/config.json`, backup `.bak`, khóa liên tiến trình/CAS. Task/run ở `~/.agent-meeting/work/`; `--work-dir` đổi chỗ, phải nằm ngoài checkout nguồn. File hỏng báo lỗi và giữ nguyên, không tự reset. Tiến trình bị ngắt thành `interrupted`, không tự giao lại khi chưa đối chiếu trạng thái cũ. Bản đầu chưa có resume nguyên session.

## Bằng chứng phát triển chính dự án

- `docs/evidence/routing-implementation/B2-SCOUT.json`: agy trích xuất ranh giới allowlist; requested `gemini-3.8-flash-low`, actual unknown.
- `B2-REVIEW.json`: Claude review độc lập, machine output xác nhận `claude-opus-5-5`; nhận xét vẫn phải đối chiếu code, không coi là facts mới.
- `B3-IMPLEMENT.json`: task sửa parser thật bằng Claude trong workspace/bwrap, scope một file. Trạng thái cuối chỉ lấy từ kiểm chứng/integration evidence, không lấy lời agent.

Chi phí null là chưa biết; không thay bằng 0. Không có RAG hoặc tự học xếp hạng khi chưa có baseline phù hợp.

## Worker qua HTTP

Quản trị → Máy & workspace để tạo định danh/token và cấu hình máy tương ứng. File riêng quyền 600 có:
`serverUrl`, `hostId`, `token`, `workspace`, `workspaceId`, `workDir` ngoài checkout, `allowedModels` và `adapters` được người vận hành chọn rõ.

```bash
node bin/worker.js --config /absolute/path/worker.json --once
```

Mỗi lệnh đăng ký snapshot thật, nhận tối đa một task rồi thoát; không có task thì idle. Chủ trì xếp hàng task remote/mixed với profile/host cụ thể; không nhầm enrollment với process đang chạy. Khác máy phải dùng origin HTTPS worker truy cập được, chỉ worker API qua mạng; admin vẫn local. Quota/model access ở remote chưa được probe bởi coordinator và được lưu unknown khi dispatch chủ động.

Remote token được hash ở coordinator, bản rõ chỉ hiển thị một lần. Worker giữ receipt private trước chạy, chỉ sửa bản sao; heartbeat lỗi thì hủy và cần reconcile. Artifact `changes.json` có hash, task/run/base/requirement/generation/full input snapshot; tải trên UI như kết quả chưa kiểm chứng. Không áp dụng patch tự động. Dữ liệu cũ thiếu snapshot giữ unknown. Kết quả cũ bị từ chối khi lease/generation/snapshot không còn khớp; giao lại không chứng minh tiến trình cũ đã dừng.

Tab Kết quả hiển thị metrics cùng trạng thái riêng reported/verified/integrated. Remote retry generations và usage/cost được ghi nhận; chi phí chưa có vẫn null. Chưa có baseline matched để đổi routing tự động.
