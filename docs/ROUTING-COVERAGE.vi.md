# Độ bao phủ kiến thức chia việc — schema v1

Ngày nhập: 2026-10-21. Nguồn là prompt người dùng, giữ nguyên byte tại `src/defaults/routing-source.md`. Các so sánh năng lực và tên model trong nguồn là giả thuyết/ưu tiên ban đầu, chưa phải benchmark hay xác nhận quyền truy cập.

SHA-256: `2111f5d95240131fcfcdbc90135d895cb4bbcde6023205c72d737516c0a8ace5`.

| Phần nguồn | Vị trí | Đích có cấu trúc và cách dùng |
| --- | --- | --- |
| 1. Mục tiêu | L3–L16 | policy.objectiveRules; tối ưu chất lượng/chi phí/thời gian, không buộc dùng ba model |
| 2. Ba agent stack | L17–L18 | models, runtimes, profiles; định danh hiển thị tách providerModelId |
| AGENT A: GEMINI FLASH | L19–L82 | models[id=flash].strengths, limitations, outputContract, modalities, roles, source.lines/references; runtime riêng |
| AGENT B: GPT ASTRA + CODEX | L83–L151 | models[id=astra].strengths, limitations, outputContract, modalities, roles, source.lines/references; runtime riêng |
| AGENT C: CLAUDE OPUS + CLAUDE CODE | L152–L225 | models[id=opus].strengths, limitations, outputContract, modalities, roles, source.lines/references; runtime riêng |
| 3. Ma trận phân công mặc định | L226–L243 | policy.matrix; ma trận đầy đủ làm ưu tiên khởi đầu, không thay điều kiện bắt buộc |
| 4. Quy trình điều phối | L244–L300 | policy.workflow, policy.handoffRules, handoff.requiredFields; giữ nguyên bằng chứng |
| 5. Nguyên tắc kiểm soát chất lượng | L301–L313 | policy.qualityRules; 10 nguyên tắc, capability tách access, chống sửa đè |
| 6. Yêu cầu đối với Orchestrator | L314–L327 | policy.orchestratorChecklist; đủ 6 câu hỏi và yêu cầu kế hoạch/tiêu chí nghiệm thu |

`source.lines` ở mỗi model trỏ cả mục gốc: danh mục nhiệm vụ, lợi thế, điều không nên mặc định giao, quy tắc đầu ra và URL hãng. Không bỏ các tiêu đề nhóm chỉ vì truy vấn tóm tắt không trả hết nguồn. `policy.handoffRules` giữ đủ quy trình phân tích → chọn → handoff → review → tổng kết, gồm điều kiện cần agent thứ hai và bốn trạng thái hoàn thành. Trường `policy.principles` cũ dạng bullet được giữ; `qualityRules` mới chứa đầy đủ các quy tắc đánh số.

## Hành vi truy vấn

- `listProfiles(config,{offset,limit})`: mặc định 3, tối đa 10; total, nextOffset, truncated, revision. Chỉ trả tóm tắt cùng access unknown.
- `getProfile(config,id)`: đúng một hồ sơ cùng model/runtime/nguồn; không gán khả dụng từ catalog.
- `recommend(config,task,environment)`: lọc model đã bật/đã xác minh; trạng thái runtime, model access, quota, công cụ, quyền, host/workspace, revision, lock và budget trước xếp hạng. Thiếu bằng chứng trả unknown/no-candidate. Model ID của bằng chứng phải khớp ID cấu hình.
- Ưu tiên context sẵn có khi hợp lệ; có retain-direct; lựa chọn khóa không đủ điều kiện trả no-candidate, không đổi model âm thầm. Phân loại task chưa biết chỉ làm classificationUnknown, không loại ứng viên.
- Chỉ trả tối đa policy.maxCandidates (1–5); mọi response bị chặn ở 32 KiB. Nếu hồ sơ quá lớn, báo lỗi để người gọi giảm nội dung/trang, không âm thầm cắt chứng cứ.
- Review bắt buộc khi rủi ro cao, phạm vi lớn hoặc reviewReasons khớp policy. Đây là yêu cầu review độc lập; chưa chứng minh reviewer được chạy.

Schema task v1: `kind`, `requiredCapabilities[]`, `requiredModalities[]`, `requiredTools[]`, `requiredPermissions[]`, `writePaths[]`, `revision`, `hostId`, `workspaceId`, `currentProfileId`, `lockedProfileId`, `budget.maxCostTier`, `risk`, `scope`, `reviewReasons[]`. Path sửa không nhận parent traversal. Task mô tả phạm vi; không cấp quyền chạy lệnh.

Bằng chứng môi trường theo profile: `profileId`, `providerModelId`, `available`, `modelVerified`, `quotaAvailable`, `checkedAt`, `tools[]`, `permissions[]`, `hostId`, `workspace:{id,revision,writePaths[]}`, `locks:[{path,owner}]`. `available=true` chỉ chứng minh executable/runtime; `modelVerified=true` và model ID khớp chứng minh truy cập riêng. Không có credential trong response. Thời gian kiểm tra được trả lại để bên thực thi kiểm tra độ mới trước chạy; module thuần không tự probe hoặc khởi chạy CLI.

Handoff bắt buộc: objective, scope, sources, facts, evidence, hypotheses, unknowns, actions, testResults, questions, acceptanceCriteria. Các trường ngoài objective/scope là mảng; mảng rỗng nghĩa là chưa có, không nghĩa là đã kiểm chứng. Artifact gốc dùng tham chiếu có vị trí, không nhét toàn nội dung vào context.

## Đã xác minh và giới hạn

Test kiểm SHA-256 nguyên bản; mặc định ba model chưa bật với providerModelId=null; validation/revision; giới hạn truy vấn; access=false; model alias sai; tool/quyền/quota; workspace/revision/lock; ngân sách; context/khóa lựa chọn; modality/host; review và hợp đồng handoff. Các test dùng model ID `test-*` giả lập, không xác nhận model thật.

Giá low/high là ưu tiên chi phí tương đối từ prompt, không phải giá tiền. Không có token pricing, latency benchmark, truy cập tài khoản hoặc thử model thật ở module này. Runtime capability là mô tả có thể cung cấp theo harness; quyền thực tế luôn cần bằng chứng môi trường. Kiểm tra mới, chặn symlink và thực thi phải do adapter/workspace layer xử lý trước chạy. Catalog v1 không tự quản lý tiến trình, merge hoặc khẳng định test sản phẩm đã qua.
