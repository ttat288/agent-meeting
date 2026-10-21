# Tiến độ triển khai routing / workspace

> **Cập nhật ưu tiên 2026-10-21:** người dùng phát hiện phòng và workspace chưa nhất quán; chặng C/D chưa được nghiệm thu về trải nghiệm xuyên suốt. Phiên kế tiếp làm [HANDOFF-consistency.vi.md](HANDOFF-consistency.vi.md) trước danh sách backlog bên dưới. Các kết quả module/test sau đây giữ làm baseline kỹ thuật.

Ngày 2026-10-21. Base Git: `556b9f69c39a1b1dd6fb9cc71d1b9ddfe5798b47`.
Không commit/push/release, không public deployment, không cài dependency hoặc sửa MCP/settings global.
Giữ nguyên thay đổi có sẵn ở `.gitignore`, README, PLAN, VISION; chỉ bổ sung hướng dẫn workflow vào AGENTS/HANDOFF.

## Kết quả theo chặng

| Chặng | Đã triển khai / kiểm chứng | Phần còn thiếu để đạt toàn bộ kế hoạch |
|---|---|---|
| A | Catalog/policy/handoff schema@1; lưu nguyên prompt + SHA-256; bảng bao phủ 6 mục; lọc điều kiện trước ranking; pagination/32KiB; CLI + MCP stdio riêng không cần phòng; cấu hình dùng chung admin/tool | Chưa có benchmark chứng minh ưu tiên năng lực; các model nguồn mặc định tắt, ID chưa xác minh giữ null |
| B | Hướng dẫn repo tra catalog trước giao việc; adapter Claude/agy bằng argv/stdin; kiểm executable/version tách model access; hai CLI thực sự có đầu ra hữu ích; task sửa parser thật có kiểm chứng và tích hợp | Chưa có adapter Codex/Gemini CLI; resume nguyên session chưa hỗ trợ; agy không trả machine model identity nên actual unknown |
| C | Prototype dùng được: workspace và admin riêng, 3 lựa chọn độc lập; token cũ, HTML/CSS/JS thuần, Việt/Anh, sáng/tối, responsive; xem `UI-PROTOTYPE.vi.md` | Cần thêm bài usability với người dùng; không tuyên bố đã thay thế toàn bộ UX đội AI |
| D | Admin thêm/sửa/tắt model, policy, mapping runtime, import/export/reset; atomic/CAS/lock/revision/backup/600; restart giữ cấu hình; run giữ snapshot; local task→run→test→tích hợp một file→test source→handoff; rollback/cancel/rebase có test | Chat với leader tự sinh/sửa kế hoạch chưa tự động; task đang dùng form và phòng cũ. Chưa có sửa requirement/revoke run đầy đủ, tích hợp đa file, reviewer tự động hoặc đối chiếu session bị interrupted |
| E | Token hash theo host; worker `--once` với allowlist model/adapter; private copy; lease/heartbeat/generation; snapshot gồm cả uncommitted input; artifact hash/provenance; stale/replay từ chối; HTTP + CLI model thật trên worker process riêng cùng máy | Chưa nghiệm thu trên máy vật lý thứ hai/HTTPS thật; remote report luôn chưa kiểm chứng; chưa tự tích hợp remote, revoke token, cancel/rebase queued assignment hoặc xác nhận process cũ đã dừng |
| F | Persist task/model/runtime/usage/cost/time/retry/evidence; metrics 64KiB; unknown không thành 0; so baseline yêu cầu cùng task-set/budget; không RAG | Chưa có bộ baseline thực tế cùng task/ngân sách để kết luận tối ưu routing |

## Task và phân công thực tế

Mỗi worker phát triển làm trong bản sao riêng, không sửa working tree chung; trưởng nhóm copy/review/tích hợp tuần tự. Không có worktree Git mới cần archive.

| ID | Mục tiêu / phụ thuộc | Workspace worker | Đầu ra |
|---|---|---|---|
| A1 | Nhập kiến thức, pure lookup / đọc prompt | `/tmp/agent-meeting-routing.73elGN` | routing.js, defaults, coverage, tests |
| D1 | Kho cấu hình / A1 schema | `/tmp/agent-meeting-config-D1-iyGJ0I` | config-store.js, tests |
| C1 | Prototype / API contract | `/tmp/agent-meeting-ui` | workspace HTML/CSS/JS, prototype doc |
| B2-SCOUT | agy trích xuất ranh giới allowlist / CLI help+models | `/tmp/am-cli-review-pimqDD` | `B2-SCOUT.json`; requested gemini-3.8-flash-low, actual unknown |
| B2-REVIEW | Claude review độc lập / CLI help | cùng workspace thử, chỉ đọc | `B2-REVIEW.json`; actual claude-opus-5-5 |
| B3-IMPLEMENT | Claude sửa parser lỗi success+error / A1 B1 và regression đỏ | `/tmp/am-b3-real-u3P8VY/work/runs/2083eb54-4721-41ad-b98d-813a418195d5/workspace` | đúng src/runtime.js, test độc lập + integrated tests đạt; `B3-IMPLEMENT.json` |
| REVIEW-WORK | Review snapshot/probe/scope / D2 | bản sao review riêng | Đã sửa stale source/probe, budget bị bỏ qua, output protected, sandbox/cancel |
| B-SANDBOX | Biên ghi filesystem / runtime | `/tmp/agent-meeting-sandbox.p79pCC`, bản sửa cancel `/tmp/agent-meeting-cancel-sandbox.rWWz2t` | execution-sandbox + test; bỏ bwrap new-session vì làm thoát process group |
| D-CANCEL | Verify/integrate cancellation + rollback / D2 | `/tmp/agent-meeting-work-cancel-NoenoG` | Patch work.js, tests; sửa NODE_TEST_CONTEXT gây xanh giả |
| E1/E2 | Host lease và worker / D2 | `/tmp/agent-meeting-remote`, `/tmp/agent-meeting-worker`, `/tmp/agent-meeting-remote-snapshot.wLYIu6` | remote.js, worker.js, bin/worker.js, tests; snapshot hash và allowlisted claim |
| F1 | Metrics / persisted runs | `/tmp/agent-meeting-evaluation-jB52dZ` | evaluation.js, tests |
| E2-WORKER-HTTP | Review lease qua worker process + Claude thật / E1 E2 | config/receipt private trong `/tmp/am-real-worker-http-*` | `E2-WORKER-HTTP.json`, actual claude-opus-5-5, HTTP/receipt/artifact provenance, không phải máy vật lý thứ hai |

Hai CLI chỉ nhận nguồn liên quan, mục tiêu, facts/unknowns, acceptance và timeout. Không truyền credential/environment vào prompt.
Claude lần đầu lỗi vị trí prompt do cờ variadic; sửa adapter dùng stdin, retry đúng một lần. Không có fallback model âm thầm.
agy 1.4.3 thực sự chạy print JSON, không phải mở editor. Claude bundled 2.1.289 tìm bằng connect.findCli; model xác nhận từ machine modelUsage.

## Các file chính

- `src/defaults/`, `src/routing.js`, `src/routing-tools.js`, `bin/routing.js`: kiến thức và lookup.
- `src/config-store.js`: snapshot cấu hình nhất quán cho mọi consumer, không ghi package.
- `src/runtime.js`, `src/execution-sandbox.js`, `src/work.js`: task/run/local execution/verification/integration.
- `src/remote.js`, `src/worker.js`, `bin/worker.js`: worker transport và lease/artifact.
- `src/evaluation.js`: đo lường; `src/server.js`, `bin/cli.js`: HTTP và đường dẫn dữ liệu.
- `src/ui/workspace.*`: UI mới. Giao diện phòng cũ chỉ thêm link vào workspace và CSS responsive/translation tương ứng.
- Test mới tương ứng trong `test/`; tài liệu nguồn/coverage/workflow/prototype và evidence trong `docs/`.

## Kiểm chứng và bằng chứng

Bằng chứng được tuyển chọn ở `docs/evidence/routing-implementation/`:

- B2-SCOUT/B2-REVIEW: output thật và usage/actual model; nhận xét vẫn được kiểm tra với code. Ví dụ nhận định nhầm `get_file` là biến đã được đối chiếu: trong code đó là chuỗi, không sửa theo nhận định nhầm.
- B3: baseline regression exit 1 → worker sửa một file → hai bộ test exit 0 trong workspace → hai bộ test exit 0 sau tích hợp. Rebase chủ động vì source đầu vào đã đổi; bằng chứng cũ bị vô hiệu trước kiểm tra lại.
- E2: process worker thật qua HTTP, Claude thật, snapshot/artifact/exit 0; remote report vẫn `verified:false`. Sau review đã giới hạn payload claim, thêm hard deadline 180 giây, kiểm thử lại transport.
- Tests chạy từng file bằng `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 150 node --test --test-timeout=30000 <file>`. Không chạy toàn suite không giới hạn. Kết quả cuối: **226/226 test đạt, 21 file, không skip/cancel/fail**. Xem `tests-summary.json` cho lệnh, output và fingerprint code.
- Browser: form trống/lỗi giữ draft và focus alert; tạo task không launch CLI; save model revision 1→2 và còn sau restart; import schema sai giữ JSON; Việt/Anh, sáng/tối, Tab, desktop/mobile/tablet; ảnh admin sáng và workspace mobile tối. Mobile cuối xác nhận innerWidth375, client/scrollWidth360, DPR1. Một tab preview bị debugger timeout/zoom lệch; đã mở tab mới cùng browser, chụp lại và kiểm tra đúng kích thước.

## Giới hạn vận hành cần giữ rõ

1. bwrap chỉ cô lập **ghi filesystem**, còn đọc host và mạng. Cần Linux + bwrap có namespace; thiếu thì fail closed, không cài hoặc bỏ sandbox tự động. Chưa phải sandbox secret/network đầy đủ.
2. Chỉ tích hợp tự động một file, có snapshot conflict và integrated tests. Review-required task bị chặn auto-integrate; quy trình review/merge thủ công còn cần phát triển. Test không chứng minh mọi tiêu chí ngữ nghĩa.
3. App không tự nối lifecycle agent được mời bên ngoài với process managed. Tunnel chỉ là đường truyền. Worker chỉ claim một task mỗi lần chạy, không daemon/resume và không tự retry uncertain receipt.
4. `interrupted` yêu cầu reconcile trước dispatch mới. Lost lease không chứng minh process cũ đã dừng; chỉ chống nhận kết quả cũ bằng thế hệ/lease/revision/snapshot.
5. Quota/model access probe có hạn 30 phút, cùng config revision/runtime; đổi config phải probe lại. Có binary không chứng minh truy cập model. Thêm model vào form không tạo adapter.
6. State hiện giới hạn 32MiB, config 512KiB, local workspace64MiB/file8MiB; remote artifact1MiB. Cần tách kho run/artifact theo file và archive/retention cho vận hành dài; hiện không tự xóa lịch sử.
7. Luồng remote là dispatch chủ động bởi chủ trì, lưu quyết định/config snapshot/unknowns; không tự nâng metadata worker thành quyền/model đã xác minh. Kết quả chưa đủ điều kiện thì hiển thị đúng trạng thái.

## Bước tiếp theo đủ để tiếp tục

**Bước 0 ưu tiên:** lập use case, screen pool, screen flow, ma trận test và hợp nhất dữ liệu/hành trình theo HANDOFF-consistency; danh sách 1–6 dưới đây là backlog kỹ thuật sau ưu tiên đó.

1. Đọc file này, HANDOFF, AGENTS và kiểm tra status; không commit/push. Chạy các test liên quan theo giới hạn bộ nhớ.
2. Hoàn thiện revise requirements + supersede/revoke run và reconcile interrupted/queued worker; cần test đổi ý lúc đang chạy, không ghi đè state mới bằng callback cũ.
3. Thêm reviewer workflow/evidence acceptance và transaction integration nhiều file; giữ test độc lập và kiểm tra bản tích hợp.
4. Thử worker trên máy thứ hai với URL HTTPS do người dùng vận hành và workspace/model allowlist rõ; thử ngắt mạng thật, token revoke/rotate và khôi phục. Không tự mở public endpoint cho admin.
5. Bổ sung leader chat→structured plan qua adapter đã probe, snapshot yêu cầu và ngân sách định lượng; không hứa hệ thống hiện tự sinh một app full-stack.
6. Xây baseline cùng task-set/ngân sách trước điều chỉnh policy; giữ unknown cost/model rõ, chưa có lý do thêm RAG.

Preview thử nghiệm: `http://127.0.0.1:3117/m/host_routing_preview_1234/workspace`; admin cùng prefix `/admin`. Dữ liệu ở `/tmp/am-preview-data/`, không đụng dữ liệu app người dùng. Nếu process đã tắt, chạy dev bằng CLI với config/work/data-dir riêng và host-key cố định; CLI bình thường có thể cập nhật rooms.json nên đọc connect.js trước khi thử cấu hình global.

## Lát cắt thống nhất phòng/workspace — 2026-10-21

Các view dùng chung trang phòng; VIỆC ánh xạ idempotent tới WorkManager, có nguồn gốc/snapshot, cấu hình yêu cầu trên cùng task UUID, carry giữ kho khi đổi mã phòng. Các kết quả cũ bị chặn sau đổi yêu cầu/nguồn. Xem [hợp đồng hành trình](CONSISTENCY-JOURNEYS.vi.md) và [bằng chứng tích hợp](evidence/consistency/ACCEPTANCE.vi.md). Browser fixture đã đi hết report/test/integrate và restart/navigation; chưa coi đó là kiểm chứng model thật hoặc remote khác máy.
