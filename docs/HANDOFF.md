# Bàn giao phát triển (cho session/người tiếp theo)

> Đọc file này trước khi sửa code. Cập nhật lại mục "Trạng thái" và "Việc tiếp theo" trước khi kết thúc phiên làm việc.

## Bàn giao phiên kế — thực thi đủ8 giờ, nâng cấp sản phẩm và công bố bằng chứng (2026-10-22, yêu cầu mới nhất)

**Lệnh đã giao, phải thực thi ngay ở phiên kế:** người dùng cấp8 giờ làm việc để nâng cấp Agent Meeting/web/tool tốt nhất có thể dựa trên pain point và benchmark/metric kiểm chứng được; **cho phép tự quyết triển khai, commit/push code và cập nhật README**. Không chỉ nạp context, lên plan rồi dừng. Phiên đang chuẩn bị bàn giao này chỉ cập nhật tài liệu; chưa bắt đầu phiên8 giờ, chưa commit/push hoặc chạy thêm benchmark/model. Bắt đầu8 giờ khi phiên kế thực sự bắt đầu làm; không tính thời gian chờ người dùng mở phiên mới.

**Ưu tiên quyền mới:** mục này thay timebox60 phút, yêu cầu dừng sớm sau một lát cắt, chế độ “giữ mọi thay đổi chưa commit/không push” và phạm vi local-only của yêu cầu trước. Các đoạn “yêu cầu mới nhất” ở bên dưới là lịch sử của từng lát cắt, không ghi đè lệnh8 giờ này. Giữ kiến trúc/bảo mật, tính trung thực của evidence và thay đổi người dùng. “Toàn quyền” cho phép các quyết định phát triển/xuất bản trong mục tiêu này; không là yêu cầu tiêu tiền vô hạn, công khai bí mật, hủy dữ liệu hoặc vô hiệu kiểm soát truy cập. Không dùng lệnh cấm cũ làm lý do dừng mọi phần có thể triển khai trong phạm vi mới.

### Ca đang thực thi — 2026-10-22/23 (Asia/Bangkok)

- **T0:** 2026-10-22 22:24:53 +07:00; **deadline:** 2026-10-23 06:24:53 +07:00; giờ cuối bắt đầu 05:24:53. Chưa kết thúc ca; không suy thời gian phát triển thành runtime/model8h.
- Workspace ban đầu: `main`, HEAD `e292fd3833d65152ebfa6133fc27a67285b6cab9`, nhiều thay đổi CLI/PM/team/carry/UI/docs chưa commit. Snapshot riêng tại `/tmp/am-shift-start-hq4gnkv8` (352 file + SHA-256/status), không đưa dữ liệu snapshot vào repo public.
- **Checkpoint 22:57:36 (T+32m43s, còn7h27m17s):** baseline338/338 trên30 file đạt. Đã sửa work live updates + conditional304, giữ draft/evidence/focus; human PM chuyển vào Tùy chọn (matched375×812: vùng work633→723px); lỗi state PM được xóa khi phục hồi. Parser cost âm/multiple-model giữ unknown; frozen acceptance2 fail→2 pass. Audit tìm thấy same-byte HEAD đổi vẫn checkpoint/swap/report: đã thêm guard,82 targeted checks đạt. [Evidence đang cập nhật](evidence/shift-20261022/ACCEPTANCE.vi.md), [protocol](evidence/shift-20261022/PROTOCOL.vi.md), [raw HTTP benchmark](evidence/shift-20261022/work-watch-benchmark.json). Direct Claude2.1.289 requested claude-opus-5-5 auth revoked sau4570ms,1/4 invocation đã dùng; PM/probe/worker chưa chạy, không retry/đổi model/sửa OAuth, không claim hiệu quả model. Chưa commit/push; đang review/package/full regression trước lát cắt tiếp. Preview3150, baseline3151 riêng; không đụng3000 hoặc dữ liệu thật.

- **Checkpoint23:09:58 (T+45m05s, còn7h14m55s):** nhánh `codex/2026-10-22-product-hardening`, origin/main chưa đổi so base.346/346 trên31 file đạt trước chỉnh foreground/poll race cuối; đang kiểm lại source cuối.82 PM/team/carry targeted đạt sau guard HEAD; package68 file/11 module cần thiết có đủ, extracted package serve4 route+skill đạt, không cài app user. READMEVI/EN đã có ảnh Results source hiện tại và link benchmark/unknown. Snapshot cũ ở3151, preview hiện3150; assets hash khớp source sau restart. Soak local90 phút bắt đầu khoảng23:08, chạy3 client/3s/100 canonical task, restart giữa ca; report private `/tmp/am-shift-watch-soak-90m.json(.partial)`, service `agent-meeting-watch-soak.service`, pin source hashes của tiến trình. Smoke1 phút60 request/1 restart/0 errors; soak chưa hoàn tất, không model/browser/8h proof. Chưa commit/push. Next: regression/hash/security/package review→commit/push lát cắt đầu nếu đạt, kiểm CI rồi tiếp tục pain point có bằng chứng; vẫn giữ giờ cuối05:24:53–06:24:53 cho kiểm/chốt toàn ca.

- **Checkpoint00:00:10 ngày23/10 (T+1h35m17s, còn6h24m43s):** foundation `805f638` giữ bytes workspace đầu ca; `66a4e986d3aedac644b46caa859890741081f152` đã push nhánh codex/2026-10-22-product-hardening. [CI Node18/20/22](https://github.com/ttat288/agent-meeting/actions/runs/39817936606) và [installer Linux/macOS/Windows](https://github.com/ttat288/agent-meeting/actions/runs/39817936616) đều success đúng SHA.349 local integrated tests/32 file trước slice mới. Benchmark model không đủ cặp;3 invocation attempts gồm auth/flag/permission failures, không gọi thêm theo cap. Frozen writer352-file input tái tạo hash đúng qua helper, parser prepare chặn case đã sửa. Soak51.02 phút/3063 request/1 restart thật/0 lỗi, chưa completed. Đã tái hiện và đang sửa PM background message làm mất keyboard focus; source mới giữ Revoke, Pause chuyển summary, takeover→Options. Test chậm Results trước chỉ disabled Verify, phải sang Execute hủy; source mới có trạng thái chờ+Cancel tại chỗ, cancelled test thật5947ms/source giữ nguyên; đang kiểm navigation/draft và integration rollback trên preview3153 riêng. Chưa commit slice mới; tiếp tục làm việc đến06:24:53, giờ cuối05:24:53.

- **Checkpoint00:46:05 ngày23/10 (T+2h21m12s, còn5h38m47s):** ca tiếp tục đến06:24:53; giờ cuối05:24:53. HEAD đã push `f531241` trên `codex/2026-10-22-product-hardening`, [PR nháp#1](https://github.com/ttat288/agent-meeting/pull/1). Source guard8b9fae0 đạt363 test/33 file,0 fail/skip/cancel local; CI73a556a/a864044 và installer đã xanh. CI mới gom workflow/repository/branch: push f531241 đã cancelled, PR cùng SHA đang chạy matrix18/20/22. Chỉ một yêu cầu hủy CI cũ39824949891 được nhận; hai lượt khác đã hoàn tất trước lệnh, không nhận đã hủy3.
  - Soak hoàn tất00:38:50:90 phút/5403 HTTP/100 task IDs/0 run/0 lỗi. Restart là clean server instance trong cùng Node PID, không crash/process restart. Năm hash match66a4e98; sourceWork mới khác, không nhận coverage ngược. Raw/analysis/protocol tại [evidence ca](evidence/shift-20261022/ACCEPTANCE.vi.md).
  - PM focus/draft/stop-priority, Cancel verification/integration tại Results, Unicode stream, draft cũ chỉ đọc và canonical root/parent rollback guards đã tích hợp/push qua các commit của nhánh. Browser draft8 case + tự chép/lưu đúng revision không thêm run; source hashes/check scope ở evidence.
  - Model attempts vẫn3, không gọi thêm/sửa OAuth; efficacy/billing/model8h unknown. Chỉ preview3150 còn chạy;3151/3153/3154 đã stop, app user3000 và global settings/dữ liệu thật giữ nguyên. Next: kiểm CI đúng HEAD/dedupe, cập nhật PR và chọn pain point có bằng chứng tiếp theo; không kết thúc ca vì đã xong các lát cắt.

- **Checkpoint01:45:57 ngày23/10 (T+3h21m04s, còn4h38m56s):** tiếp tục ca tới06:24:53, giờ cuối05:24:53. HEAD đã push f829eb0, CI39828088723/installer39828088727 success; duplicate push39828082216 cancelled. Source probe mới đạt373 test/33 file và browser admin EN/VI mobile: coalesce active invocation, giữ draft/focus, block mapping chưa lưu/stale config, stale result không ghi đè. Đang commit/push slice; evidence có source hashes và giới hạn0 native model. Preview3150 và3154 riêng còn chạy, không đụng3000. Phát hiện tiếp: CLI signal chỉ flush+exit, verify/integrate chưa được close chờ drain; sẽ tái hiện tối thiểu trước sửa nhằm tránh thoát khi source còn áp dụng/chưa rollback. Model attempts vẫn3, efficacy/billing/model8h unknown.

- **Checkpoint02:26:32 ngày23/10 (T+4h01m39s, còn3h58m21s):** ca tiếp tục tới06:24:53; giờ cuối05:24:53. HEAD đã push65476da, draftPR#1. Probe recovery7f8f02a, graceful CLI shutdown2ac1713, shared observation freshness6bddfa2 (382 tests/34 file local; CI6bddfa2 matrix18/20/22 success) và Runtime UI/nav1ce861f/5c9e519/65476da đã tích hợp. UI12 locale/theme/width cases; mobile secondary nav157→85px, mainTop270→198px; tradeoff thêm mở chooser, user UX acceptance chưa có.
  - CI5c9e519 Node18/22 xanh, Node20 readiness test race (status integrating trước applied bytes). Đang commit fix predicate chờ cả sourcea+b, giữ rollback assertion/timeouts, local2 tests đạt. Package654:68 file/7 HTTP+conditional/CSP/asset checks + actual extracted CLI SIGINT/SIGTERM2tests đạt; tarhash/nguồn ở evidence, không cài app user.
  - TTL experiment tab3 ở private3154:fixture observed19:02:56.916UTC, hết hạn19:32:56.916; đợi kiểm sau02:33 +07, không refresh/probe tab này. Baseline UI hash match1ce861f, metric native0; chưa coi thời gian đã đủ hoặc là model runtime. Tab4selected dành mobile matrix; viewport override theo selected tab, ảnh nhầmwidth1280 đã đổi tên desktop và chụp375 thật. Preview3150/3154 riêng, app3000 giữ nguyên. Model attempts vẫn3, không gọi thêm/sửa OAuth; billing/semantic efficacy/model8h unknown. Next: push/check CI fix, kiểm TTL và pain point có bằng chứng tiếp; giữ giờ cuối cho full integrated/package/README/hash/CI/handoff.

- **Checkpoint03:17:09 ngày23/10 (T+4h52m16s, còn3h07m44s):** tiếp tục tới06:24:53; giờ cuối05:24:53. HEAD4c586299f86acbbd17de1abbc537d91740f19598 đã push, CI39844609339/installer39844609482 overall success. Source mới chưa commit cho admin Save recovery đạt388/35 file local0fail/skip/cancel +browser model/policy/mapping/import/reset ACK gate; đang chốt commit. Không thay global settings/app3000, không gọi thêm model; native model attempts vẫn3, billing/efficacy/model8h unknown.
  - Graceful shutdown đã có real CLI tests; một CI Node20 readiness race được sửa bằng chờ applied bytes trước signal (không tăng timeout/skip). APT installer ae17743 fail vì Microsoft403 không liên quan test tools; helper13e4cce dùng signed officialUbuntu22 sources theo lệnh, không sửa /etc/apt/trust. Native3OS13e4cce đã verified; Desktop concurrency push/PR đã thực sự cancel duplicate.
  - Admin runtime có summary/read-only diagnostics, mapping disclosure, section query giữ locale/reload;375 secondary nav157→85px/mainTop270→198px, thêm một thao tác mở chooser. TTL baseline real observation quá30m vẫn xanh ở UI1ce861f; tab chỉ giữ~23m35, không là model/runtime30m/8h. Timer mới đổi badge local, giữdraft/focus/metadata; backdated fixture cases và zero-counter boot ghi đúng1 explicit runtimeGET,0 additional/probe. Back case thực tế reload/Observations not loaded, không claim mọiBFCache.
  - Save recovery mới giữ newer input và viewed CAS snapshot, pending server DTO chỉ áp vào explicit navigation/reload; stale Save409 giữdraft, copy/reload/restore đã kiểm. Import/reset/mapping cùng guard; notice timer từ message mới. Chưa giữ admin draft qua explicit page reload/language; extra recovery steps chưa có human-time win.
  - Preview3150 main riêng;3154 own probe/admin fixture;3155 response-gate proxy riêng, cap120s/RuntimeMax30m, gate hiện đã release. Tab4selected mới dùng mobile; tab3 là TTL baseline cũ, đã xong evidence và có thể đóng. Next:push/check388-source CI, rà read-only refresh/new drafts và full-journey errors có bằng chứng; không kết thúc ca sau slice. Final hour vẫn phải pack/source-hash/browser/regression đúng source cuối, push/CI và bàn giao giới hạn.

- **Checkpoint03:52:26 ngày23/10 (T+5h27m33s, còn2h32m27s):** vẫn thực thi đến06:24:53, giờ cuối05:24:53. HEAD đã push4544951ecc7e9082ff2dd41a1d69b35f0a3af73b; PR#1 đã đổi mô tả theo source/phạm vi và giữ draft. fc4701d Hosts refresh đạt391/35local, CI39850836431/Desktop39850836433 success. be737f7 task Save recovery đạt398/35local, Desktop39851741623 success, Node CI39851742901 đang chạy (overall queued/in_progress có thể đi kèm jobs matrix còn chờ, không coi là thất bại).
  - Task Save giữ newer input/viewed revision qua configure ACK và /work read chậm,409→Show updates→readonly previous draft→chép→Save revision mới đã browser-check; hidden work view không kéo focus khỏi chat. Manual Refresh4544951 giữ form/focus khi nhập lúc chờ và không thay Results mới; normal refresh focusheading, remote503/retry giữ results/xóa đúng worker warning. Full404/35local,0fail/skip/cancel,22actual-source UI unit; hashes/raw/browser tại acceptance ca.
  - Model attempts vẫn3, không thêm/sửa OAuth; A/B/billing/8hmodel unknown. Preview3150/3154 và gate3155/3156 riêng;3156 gate/configure/workread/remote đều release,3155 có RuntimeMax30m,3156 90m. Không enroll/token/dispatch trong các ca admin/task mới, app3000 không đụng. Next:ràng buộc lỗi callback khi work view hidden, rà footprint/claims; không build orchestration/controller. Giờ cuối vẫn cần source cuối full/browser/benchmark/package, secret/ignore, exactHEAD CI và bàn giao thời gian thực.

### Hợp đồng sử dụng đủ8 giờ

- Ghi `T0`, `T_end=T0+8h`, timezone Asia/Bangkok, thời gian đã dùng và còn lại ngay khi bắt đầu. Đây là **một ca làm đủ8 giờ**, không là “tối đa8 giờ nhưng done sớm ở giờ3”. Hoàn thành một lát cắt thì nghiệm thu nó rồi chọn pain point tiếp theo có bằng chứng trong cùng mục tiêu; không kết thúc toàn phiên vì test xanh, đã push một commit hoặc hết một plan ban đầu.
- Mỗi45–60 phút và trước thay đổi quan trọng, ghi checkpoint ngắn vào phần hiện trạng của bàn giao: kết quả/link evidence/commit, vấn đề đang mở, next action, thời gian còn lại. Tiếp tục sau context compaction từ checkpoint; không bắt đầu lại hoặc quên mục tiêu8 giờ. Update cho người dùng ngắn, tập trung kết quả; không xin duyệt lại các thao tác phát triển/commit/push đã được cấp.
- Không ngủ/chạy lại test/đẻ tài liệu, agent hay feature vô ích để đủ giờ. Dùng thời gian còn lại cho lỗi hành trình thật, tính nhất quán UI/data, recovery, accessibility, hiệu năng, kiểm chứng browser, benchmark công bằng, tài liệu và release hygiene. Kết thúc một lát cắt đúng lúc vẫn áp dụng; **điểm dừng lát cắt không phải kết thúc ca8 giờ**.
- Khoảng60 phút cuối giữ cho tích hợp, regression/browser/benchmark cuối, README/evidence, commit/push và kiểm CI; không mở thêm thay đổi lớn chưa đủ thời gian sửa/kiểm. Nếu xong đợt kiểm sớm, tiếp tục rà hành trình/lỗi phục hồi/claim tài liệu trên bản đã tích hợp và sửa lỗi tìm được, thay vì báo done rồi nghỉ.
- Chỉ kết thúc sớm toàn phiên nếu có yêu cầu dừng của người dùng hoặc trở ngại thực sự làm không còn công việc hữu ích trong quyền (quota/nền tảng ngắt, mất tool/filesystem, phụ thuộc bắt buộc ngoài quyền). Một model auth lỗi, một benchmark chưa chạy được hoặc CI chờ không chặn các phần độc lập. Nếu bị buộc dừng, ghi thời gian thực, nguyên nhân và checkpoint; **không nhận đã làm8 giờ**, không hứa nền tảng sẽ giữ phiên chạy khi nó đã ngắt. Không tự tạo automation/chát mới để giả lập thời gian làm việc.

### Hiện trạng phải giữ và nguồn cần đọc

1. Đọc `AGENTS.md`, mục này và kết quả canonical local ngay dưới; `docs/HANDOFF-ui-reform.vi.md`, `docs/CONSISTENCY-JOURNEYS.vi.md`, `docs/PLAN-pm-operator.vi.md`, `docs/evidence/context-window/carry-review/ASSESSMENT.vi.md`. Đọc CONTRIBUTING/SECURITY/SECURITY-DESIGN trước sửa runtime/quyền. Plan là định hướng, không phải danh sách feature bắt buộc phải build.
2. Workspace `/home/theo/workspace/agent-meeting`, HEAD lần kiểm trước `e292fd3833d65152ebfa6133fc27a67285b6cab9` trên main; **nhiều source/UI/CLI/PM/docs đã sửa và file mới chưa track**. Kiểm Git/status/diff/remote thực tế đầu phiên. Không reset/clean hoặc checkout làm mất phần có sẵn. Khi commit, review scope/secret/ignore và bao gồm dependency liên quan để checkout sau push chạy được; không `git add .` mù quáng hoặc bỏ sót module chưa track.
3. Local canonical carry đã nối task/run/checkpoint với kho tạm; delta failedAttempts/blockers tùy chọn; guard source/revision/WIP/privacy và lifecycle next. Full suite trước **338/338,30 file**,42 canonical checks + parent. [Verification](evidence/context-window/carry-review/canonical-verification.json), [benchmark](evidence/context-window/carry-review/canonical-benchmark.json). Đây là lịch sử đã verified ở source hashes ghi trong report; phải kiểm lại phù hợp source phiên8 giờ, không dùng số cũ cho mã mới.
4. Carry vẫn là `tools/carry-canonical.js` gọi tường minh; chưa gắn runtime/collector/controller. Payload cùng facts có overhead+724 byte, swap fixture input3648 byte qua bootstrap/activation; chưa thắng direct CLI, chưa semantic retention/model billing/8h. `src/team.js` có delta mới chưa được review Claude cũ bao phủ. PM/team local đã có canonical execution/swap/event, nhưng UI team và journey model thật chưa được nghiệm thu. Đừng build lại backend có sẵn hoặc quảng bá experiment thành capability runtime.
5. UI người dùng vẫn cần đánh giá: giảm chữ, gom nhóm, nền/nội dung/điều khiển rõ, hành trình trọn vẹn. **Bắt buộc đọc và áp dụng `ui-ux-pro-max`** theo AGENTS khi làm UI; đọc CSS tokens/index/app/workspace/i18n và design system nếu có. Giữ HTML/CSS/JS thuần, Node>=18, không dependency runtime mới mặc định, CSP chặt, VI/EN, sáng/tối, responsive. Chức năng PM/team không tự buộc thêm một màn/bảng quản lý riêng.

### Thực thi theo kết quả, không chạy theo số feature

**Đích người dùng:** từ giao mục tiêu/acceptance → duyệt quyền/phương án cần thiết → theo dõi ít thao tác → nhận kết quả có nguồn/evidence → xử lý lỗi/tiếp tục đúng dữ liệu. Website phải giúp người dùng hiểu cần làm gì, việc đang ở đâu và bằng chứng nào đã được kiểm. So direct coding CLI, phải giảm công điều hành/lỗi/thời gian/chi phí ở chất lượng tương đương, hoặc tạo kết quả cần thiết direct chưa đạt. “Xịn nhất” không chứng minh bằng số agent, graph, badge hoặc animation.

**Nhịp đề xuất, được tự điều chỉnh theo phát hiện nhưng không rút ca làm:**

| Thời gian tương đối | Kết quả cần tạo |
| --- | --- |
|0–45 phút|Kiểm workspace và chạy app preview tách biệt; đi journey hiện tại, khóa2–3 pain point có bằng chứng; định nghĩa task/input/acceptance/baseline/metric và lịch kiểm. Đọc source trước mở rộng, không dành cả buổi để viết plan.|
|45 phút–3 giờ|Sửa lát cắt tác động lớn nhất xuyên UI/API/data nếu cần; cập nhật screen pool/flow/test matrix hiện có; browser trên bản tích hợp cả lỗi/phục hồi. Kiểm chứng xong lát cắt rồi chọn tiếp, **không kết thúc ca ở giờ3**.|
|3–5 giờ30|Giải quyết bottleneck tiếp theo từ journey/benchmark; ưu tiên nhất quán/recovery/readiness và phần tool thật sự cần ngay. Có thể hoàn thiện carry integration hoặc telemetry shadow nếu nguồn và guard đủ; không bật controller vì “có trong backlog”.|
|5 giờ30–7 giờ|Đo lại cùng protocol, kiểm UX/hiệu năng/reliability, sửa integration issues. So với baseline mạnh, giữ cả kết quả thua/unknown. Hoàn thiện README Anh/Việt và evidence của capability thật.|
|7–8 giờ|Freeze scope lớn; regression/syntax/diff/browser trên source cuối; commit/push theo quyền, kiểm CI đúng commit, sửa/check lại thất bại liên quan; bàn giao kết quả/metric/giới hạn/việc còn mở. Dùng trọn phần thời gian còn lại cho kiểm chứng có ích.|

Trước mỗi lát cắt ghi vài câu: ai khó ở bước nào, quan sát hay giả thuyết, cách đang làm, thay đổi nhỏ nhất và acceptance/metric. Nếu chưa có bằng chứng ảnh hưởng lựa chọn thì đo nhỏ trước. Khi đã giải quyết, không tối ưu vô hạn lát cắt đó; quay lại hành trình để chọn điểm nghẽn có tác động tiếp theo. Không tự mở HR/ranking, remote platform, general memory/scheduler hay nhiều worker chỉ để làm sản phẩm trông lớn.

### Benchmark/metric phải cho phép người khác kiểm lại

- Đầu phiên tìm tài liệu/demo **hiện hành từ nguồn chính thức** của2–3 công cụ mạnh phù hợp use case, ghi ngày/version/phạm vi so sánh. Dùng chúng để hiểu tiêu chuẩn journey, recovery, observability, benchmark reproducibility; không sao chép slogan hoặc công bố thắng công cụ chưa trực tiếp thử. Không bắt buộc mọi capability của công cụ khác.
- Khóa protocol trước đo: tác vụ/inputs/source hash/acceptance, runtime/model/version nếu có, quyền, case order, timeout/retry/run cap, arm direct và arm Agent Meeting. Direct có native auto-compaction/tests/report và workflow hợp lý; cùng facts/evidence/quyền, không ép full log hoặc tắt tính năng baseline. Chạy lại sau sửa phải lưu version/hash mới, không thay input/parser của pilot cũ rồi so với kết quả cũ.
- Ưu tiên metric người dùng: tỷ lệ hoàn thành journey với đúng acceptance; số thao tác/điểm chờ/cần quyết định; thời gian tới kết quả verified; lỗi/retry/khôi phục/repeated work; provenance/revision đúng; keyboard/responsive/Back/reload/deep link; latency/payload/render trên workload ghi rõ. Với performance lặp đủ mẫu thì báo median/tail và sample size; ít mẫu ghi từng số, không bịa P95/P99 hoặc ý nghĩa thống kê. So cùng môi trường/đầu vào, không thêm telemetry thu dữ liệu riêng mặc định.
- Chọn ít nhất một benchmark tái lập có raw result và script chạy được từ checkout, acceptance độc lập và cả case lỗi. Metric phải mô tả kết quả người dùng hoặc độ tin cậy/hiệu năng thực; **số test xanh, screenshot đẹp, LOC, token fixture hoặc byte giảm không tự là hiệu quả sản phẩm**. Có thể công bố local/fixture benchmark nếu nhãn đúng, không dùng nó thay model A/B.
- Nếu chạy model thật: trong quyền tự quyết mới, dùng runtime/model đã cấu hình có quyền truy cập hiện hữu; khóa identity/case và ngân sách/run/retry nhỏ hữu hạn trước gọi, lưu ledger mọi probe/worker/review/summary/ACK/activation/retrieval/compaction/retry. Không đổi model âm thầm, mua subscription/credits hoặc cố sửa OAuth revoked để ép chạy; chọn đường khả dụng và công khai giới hạn. Không cần gọi đủ hãng hoặc thêm subagent cho có. Việc gọi subagent vẫn theo instruction/tool của phiên, không tự suy “toàn quyền” thành yêu cầu bắt buộc multi-agent. Nếu cost/cap không xác định được thì giới hạn phần đo được, ghi unknown và tiếp tục local/browser/tool độc lập, không spam invocation để lấp8 giờ.
- Context resident, tổng usage và billing là ba metric riêng; không hỏi model tự đoán context. Collector phải xác minh schema/cadence/session/generation của adapter; JSON cuối print không chứng minh thấy internal turn. Shadow và fail closed trước auto-trigger; giữ ACK/quiesce/write fence nếu chưa có thay thế đã kiểm.8 giờ **phát triển** không chứng minh runtime/model đã chạy8 giờ, zero token hoặc context luôn dưới giới hạn.
- Nếu overhead không được bù ở chất lượng tương đương, ghi rõ và đơn giản hóa/bỏ lớp đó; đó là cải tiến có ích. Không chọn/bóp workload để ép Agent Meeting thắng. README chỉ dùng claim có source/hash/raw result/giới hạn và cách tái lập; không headline giảm95% tiền từ fixture transport.

### Quyền thực thi, push và nghiệm thu cuối ca

Được sửa source/tool/tests/UI/docs, chạy test/browser/benchmark, commit/push các thay đổi liên quan và cập nhật README chính Anh cùng README.vi.md; không phải chờ xin quyền lại lúc publish Git. Tận dụng quyền này để tạo bản reviewable/chạy được và sửa CI, không chỉ để lại plan hoặc một patch chưa tích hợp. Kiểm branch/remote phù hợp; ưu tiên nhánh `codex/…` nếu cần nhánh mới, không force-push hoặc ghi đè remote changes. Nếu mở PR, attach bằng tool của app. Không gửi tin/email/Slack cho người khác hoặc mua dịch vụ chỉ vì có quyền push.

Giữ preview/test data/credential tách dữ liệu thật. Dùng cổng trống và store/checkout test riêng; không cần đụng app đang chạy3000 hoặc bản cài người dùng để nâng cấp repo. Nếu việc cập nhật app thật trở thành điều kiện cần, làm staging/backup/rollback và giải thích tác động trước; không phá phiên người dùng. Không commit skill local/vendor, raw credential, private transcript/store, token trong URL/log hoặc artifact không phù hợp repo public. Quyền rộng không là lý do làm yếu CSP, sandbox, grant/revision/private boundary hoặc giả nhận model đã được xác thực.

Chạy test phù hợp sau mỗi lát cắt; full suite trước push/final trên source tích hợp, tuần tự với `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test` theo CONTRIBUTING, không bỏ sandbox khi thiếu bwrap. UI cần browser journey thật trên preview: Việt/Anh, sáng/tối, mobile/desktop/keyboard, lỗi/phục hồi/Back/reload/deep link và dữ liệu liên tục. Phân biệt automatic technical checks với UX do người dùng chấp nhận; không tự nhận đã được người dùng duyệt.

README phải mô tả sản phẩm hiện tại và đường dùng nhanh, demo/screenshot đúng phiên bản nếu đổi UI, link benchmark/protocol/raw results với nhãn local/model/unknown, limits thật và cách reproduce. Không công bố chức năng chưa có hoặc dùng screenshot của source cũ. Commit có scope rõ, source test/metric/hash đồng bộ; push rồi kiểm CI đúng SHA, không chỉ chạy lệnh push và nhận CI xanh. Nếu hết giờ mà CI còn pending/fail hoặc thiếu model/UX acceptance, ghi chính xác trạng thái/link và việc tiếp thay vì tự gắn done.

**Bàn giao sau8 giờ:** ghi T0/kết thúc/thời gian làm thực, pain point đã giải quyết, hành trình/capability đã ship, branch/commit/remote/CI, benchmark before/after cùng protocol và mọi overhead/unknown, source hashes/log, verified/reported/integrated/model/UX status, lỗi còn mở và next action nhỏ nhất. Hoàn thành những gì trong quyền, báo đúng phần thiếu; không cần tất cả backlog đạt “hoàn hảo”, nhưng không kết thúc ca sớm chỉ vì xong vài hạng mục.

## Lịch sử — lát cắt local60 phút đã hoàn thành (2026-10-22)


**Đã thực thi local, dừng sớm — trạng thái mới nhất:** nối assembler với task/run/checkpoint thật trong **kho/checkout do test tạo**, không dùng live store. `tools/carry-canonical.js` đọc tường minh, có binding/revision/source/WIP guards và reference giới hạn; chưa gắn runtime/controller. Checkpoint nhận thêm `continuation.failedAttempts`/`blockers` tùy chọn, kiểm text/secret/CAS; omission vẫn unknown, không summary model. Running thiếu critical delta bị blocked, blocker có bước gỡ; sau reported/verified/integrated dùng bước lifecycle hiện hành, không replay next cũ. Giữ ACK/quiesce/single-writer fence. [Kết quả chi tiết/cách tái lập](evidence/context-window/carry-review/ASSESSMENT.vi.md#lát-cắt-canonical-local-trong60-phút-2026-10-22), [benchmark](evidence/context-window/carry-review/canonical-benchmark.json), [verification và thời gian](evidence/context-window/carry-review/canonical-verification.json).

**Kiểm chứng mới:**42 checks + parent =43 test canonical local; full suite338/338 trên30 file đạt, RAM1200MiB/swap0/timeout900s, không skip/cancel; syntax/diff checks đạt. Report source hashes là của lượt mới, không dùng review/hash295/29 cũ để duyệt thay đổi. Direct cùng facts/binding/delta/evidence2495 byte so capsule3219 ở running; integrated1814 so2538, overhead **+724 byte** mỗi mốc. Đường swap production với executable fixture đo thêm bootstrap1490 + activation2158 =3648 byte input, checkpoint1270 byte được nạp mỗi lần; tách khỏi so direct vì assembler chưa gắn runtime. Không có số token/billing/semantic-retention; không claim rẻ hơn direct CLI.

**Điểm dừng/phần thiếu:** lát cắt local đã đủ. Delta/source experiment ở workspace chưa commit; canonical run integrated chỉ là **fixture**, không model thật hoặc task người dùng. Không mở rộng UI/live capture/collector/controller. Model/telemetry/quality/native recovery/cost/8h và independent design review còn chưa nghiệm thu; muốn đi tiếp cần scope/quyền/version/budget/run cap riêng. Không có quyết định mới cần người dùng cho phần local này. Bắt đầu21:42:20, deadline22:42:20 ngày2026-10-22 (UTC+7); kết thúc22:01:18, thời lượng18.98 phút, dừng sớm. Không gọi thêm model/subagent, không OAuth/settings,3000/bản cài local hoặc commit/push.

**Nội dung giao ban đầu bên dưới là lịch sử yêu cầu, đã thực thi theo trạng thái trên.**

**Nhiệm vụ đã giao:** phiên kế đọc `AGENTS.md`, mục context metric/carry ngay dưới và [ASSESSMENT](evidence/context-window/carry-review/ASSESSMENT.vi.md), kiểm workspace rồi thực thi ngay lát cắt local đã đề xuất: nối assembler với canonical task/run/checkpoint trên **kho tạm do test tạo**, xác định/bổ sung cách ghi delta còn thiếu tại mốc làm việc và kiểm source/revision/missing/privacy/WIP. Không chỉ xác nhận nạp context, lập plan rồi dừng hoặc hỏi lại quyền làm phần local này. Phiên hiện tại chỉ viết bàn giao, chưa thực hiện lát cắt đó. Quyền local mới này thay trạng thái “bước tiếp được đề nghị” cho phạm vi trên; không cấp quyền model/live-user-store pilot.

**Timebox:** tối đa60 phút wall time tính từ lúc phiên kế bắt đầu làm, gồm đọc context, sửa, kiểm chứng và cập nhật bàn giao. Ghi mốc bắt đầu/kết thúc/deadline; chừa thời gian kết thúc an toàn. Nếu đủ tiêu chí thì dừng sớm; không chờ cho đủ giờ, không tạo automation, không kéo dài8h. Hết60 phút thì dừng mở rộng, lưu trạng thái và ghi đúng phần chưa xong; không tự nhận done hoặc bỏ kiểm chứng để kịp giờ. Mốc vắng mặt3h30 ở lịch sử bên dưới không áp dụng cho yêu cầu này.

**Pain point/đối chứng:** successor đang phải tìm lại facts trong log và có nguy cơ dùng next/revision cũ; experiment mới chỉ đọc export tĩnh, chưa kiểm assembler với cấu trúc canonical thật. Dùng store/API hiện có trong workspace tạm, không tạo memory engine mới. Đối chứng đọc trực tiếp **cùng facts và evidence**, tính thêm delta/references/readback/ACK/activation; bytes/call count không thay token hoặc billing. Giữ nguồn chuẩn và quyền kiểm ở code; capsule là dữ liệu untrusted, không cấp quyền chạy.

**Tiêu chí đủ và điểm dừng:**

- Dựng phần facts đã có từ task/run/checkpoint canonical bằng code, reference truy hồi được và có binding task/run/goal/plan/requirement/base/source/generation theo nguồn thực sự có. Thiếu hoặc xung đột thì unknown/block; không tự điền từ giả định.
- Phân biệt phần đã lưu với delta caller cần ghi: quyết định/rationale ngắn, thử thất bại hữu ích, blocker/unknown và bước tiếp hiện hành. Tận dụng output/checkpoint hiện có; không gọi model riêng để summary và không yêu cầu lưu suy nghĩ nội bộ.
- Kiểm local có ý nghĩa: stale source/requirement/goal/plan/generation, missing critical facts, reported/verified/integrated, WIP continuity/next sau integration, loại dữ liệu riêng/credential và bảo toàn single-writer fence hiện có. Không sửa ACK/quiesce chỉ để giảm payload. Dùng fixture/subprocess có sẵn khi cần; không chạy executable model thật.
- Ghi kết quả tái lập, overhead so direct cùng dữ kiện, source hashes và giới hạn. Chạy test phù hợp phần thay đổi, syntax/diff checks; nếu sửa source sản phẩm thì chạy kiểm hồi quy cần thiết trong giới hạn RAM/timeout repo, không tái sử dụng295/29 như kết quả mới. Cập nhật ASSESSMENT/HANDOFF với verified/reported/integrated phân biệt rõ.

**Ràng buộc giữ nguyên:** tất cả thay đổi chưa commit; giữ thay đổi người dùng và công cụ vendor. Không commit/push, cổng/process3000, bản cài local, OAuth/settings/global config hoặc đọc/sửa live store người dùng để lấy thêm facts. Hai lượt CLI review đã hết: Flash kiểm kê, Claude auth revoked, chưa có phản biện thiết kế thành công; **không gọi thêm model/probe/retry hoặc subagent**. Không bật collector/controller/auto-trigger hoặc tích hợp runtime tự động trong timebox này. Không hứa zero token/context luôn trong giới hạn, không coi fixture là nghiệm thu model/retention/billing/8h. Thiếu telemetry thì ghi unsupported/unverified; không sửa parser/input pilot cũ. Nếu còn blocker cần model/quyền mới, hoàn tất phần local độc lập rồi ghi quyết định còn cần người dùng; im lặng không là consent.

## Bàn giao context metric/carry — khả thi có điều kiện (2026-10-22, yêu cầu mới nhất)

**Tiếp nối đánh giá/benchmark local:** đã hoàn thiện [ASSESSMENT](evidence/context-window/carry-review/ASSESSMENT.vi.md#benchmark-local-tiếp-nối-nguồn-thật-delta-chưa-có-reference-có-giới-hạn), thêm [script](evidence/context-window/carry-review/benchmark-carry.js)/[report](evidence/context-window/carry-review/benchmark-carry.json):21/21 ca với references truy hồi trên export cố định, hash/identity và goal/plan revision checks, missing/stale/privacy/error cases. Facts459 byte, capsule1666 byte (**thêm1207 byte**); cùng toàn bộ evidence metadata: direct1167 so capsule2374 byte. Projection khác bản thử cũ, không so tỷ lệ giữa hai bản. Mười nhóm context continuation thiếu/chưa dùng được trong export đã được đối chiếu nơi lưu trong source và phần delta caller cần ghi; không giả live store thiếu hoặc điền giá trị giả.6/6 test analyzer offline đạt, [log](evidence/context-window/carry-review/local-tests.txt); source sản phẩm/hash audit và2 review attempt giữ nguyên. Không thêm model/collector/controller hoặc claim retention/billing/8h. Lát cắt local đã đủ; bước model/live-source pilot còn cần nguồn và quyền riêng, không tự mở rộng hoặc sửa OAuth/settings.

**Yêu cầu:** phản biện bằng agent CLI về độ tin cậy metric context và kế thừa từ tool state, tránh lượt model tóm tắt lại; ghi benchmark/metric và bàn giao nếu khả thi. Không hứa zero token, context cố định hoặc8h từ log task. Đọc [ASSESSMENT](evidence/context-window/carry-review/ASSESSMENT.vi.md) và [protocol context](evidence/context-window/PROTOCOL.vi.md) trước phần lịch sử bên dưới.

**Đã làm:** source audit và local capsule experiment từ evidence fixture:5 invariant đạt, assembler model calls0, capsule1154 byte so projection facts660 byte (**overhead494 byte**, không claim rẻ hơn CLI). Bốn field thiếu là trong evidence export, không phải bằng chứng cả live store thiếu. Chưa runtime assembler/collector/controller mới. Source sản phẩm không đổi trong lượt review; các file trước vẫn chưa commit. Test295/29 bên dưới là kết quả lượt triển khai trước, không chạy lại suite để viết bàn giao.

**Họp CLI:** user cấp rõ2 attempt read-only: Antigravity/Gemini Flash3.8 trả phí để kiểm kê, Claude để phản biện. Đã dùng agy1.4.3 requested gemini-3.8-flash-low: reported, runtime usage20615 token (input18712/output1903), actual model machine identity unknown, billed USD unknown. Claude Code2.1.289 requested claude-opus-5-5 thất bại vì OAuth token revoked, không có design review. Không retry/login/settings change, không paid probe riêng. [Ledger](evidence/context-window/carry-review/review-ledger.json), [đối chiếu source](evidence/context-window/carry-review/verification.json). **Không có đồng thuận hai model**; kết luận conditional là đánh giá source + factual reviewer, không tự coi Claude đã duyệt.2 attempt đã hết, quyền này không cấp thêm model benchmark/call tiếp theo; giữ ngân sách unknown minh bạch, không tự đổi model.

**Hướng đi nhỏ nhất:** dựng phần đã được ghi bằng code từ canonical task/run/decision/evidence và delta nhỏ tại mốc làm việc; successor nhận capsule tối thiểu + truy hồi có giới hạn. Log task done không chứa mọi quyết định/rationale, rejected attempts, blocker/WIP hoặc next step chưa ghi. Source checkpoint hiện vẫn đòi decisions/unknowns/next từ caller. Zero dedicated summary invocation khi đủ facts khác zero input/output/billing. Dữ liệu ngoài model vẫn phải được successor đọc. Missing/stale facts phải unknown/block, không tự bịa hoặc coi key hiện diện là hiểu đúng.

**Điểm cần giải quyết trước auto-trigger:** collector phải kiểm đúng schema/cadence từng adapter; không giả statusline chạy trong headless print. Runtime hiện chỉ nhận JSON cuối invocation, không chứng minh thấy từng internal turn kịp chống overflow. Bootstrap ACK và activate là2 invocation không native persistence; tính cả double rehydrate/cost. Hash ACK không là semantic acceptance, cũng không tự bỏ write fence để giảm token. Giữ native compaction baseline; telemetry/forecast/controller thiếu thì không hứa tự đổi khi gần đầy.

**Bước tiếp được đề nghị:** tiếp tục source audit và lát cắt local có giới hạn: tận dụng task/run fields, ghi phần critical delta còn thiếu, projection/capsule với reference thật và revision guards, collector shadow cho một adapter khi xác minh được nguồn; kiểm fixtures stale/missing/privacy/source/WIP/single-writer. Chưa auto-trigger/sửa runtime trước khi chứng minh đủ nguồn và lợi ích so cách đọc trực tiếp facts đã biết. Nếu telemetry chưa lấy được dưới quyền hiện có thì ghi unsupported, không bỏ verification hoặc đẻ memory/scheduler tổng quát. Đọc benchmark/metrics/stop gates tại ASSESSMENT; model pilot cần quyền mới về CLI/model/version/probe/budget/run cap. Không sửa input parser pilot cũ hoặc dùng fixture payload làm billing claim. Không được tự kéo dài8h.

Giữ thay đổi chưa commit; không cổng/process3000, bản cài local, settings global, commit/push. Có thể hoàn thiện các phần local được giao; không gọi thêm paid model hoặc tự chữa OAuth. Khi đủ source/quality/cost evidence mới bật controller; nếu overhead không được bù thì giữ native/direct CLI. UI team/swap và model/8h vẫn chưa nghiệm thu.

## Bàn giao thực thi — PM theo sự kiện, team tự quản, swap kế thừa (2026-10-22)

**Lệnh mới nhất:** người dùng yêu cầu gom toàn bộ bàn luận và **phiên tiếp theo triển khai đến done**, không chỉ đọc/xác nhận hoặc viết thêm plan. Người dùng sẽ treo máy khoảng **3 giờ30 phút**. Đây là thời gian có thể vắng mặt, không là deadline buộc báo done, không phải yêu cầu hẹn giờ/automation hoặc phải làm đủ3h30. Tự xử lý công việc thường nhật trong quyền, không hỏi lại để tiếp tục; thiếu quyền paid/model/budget thì hoàn tất tất cả phần local được phép và báo chính xác cửa nghiệm thu còn thiếu. Không nhận im lặng là consent. Phiên viết bàn giao chỉ cập nhật tài liệu, chưa triển khai các capability mới dưới đây.

### Trạng thái thực thi tại workspace — 2026-10-22 (chưa commit)

Đã triển khai lát cắt **API/CLI local một lead/slot A, một task canonical**: grant team riêng → lead đề xuất plan → PM duyệt đúng revision + readiness → team run/verify/integrate → event bền vững/dedupe/ack → PM report. `bin/pm.js watch` chờ bằng code, chỉ trả actionable event; không gọi PM model theo progress. CLI tắt không tự được mở lại; event chưa ack vẫn được giữ. Grant/team deadline thay PM heartbeat cho run đã bàn giao, còn revoke/goal change vẫn cancel.

Swap có supervisor Linux, driver cố định và read-only bootstrap: checkpoint version/hash, successor ACK đúng hash/generation/model → dừng và kiểm process group cũ không còn writer → chuyển generation cùng slot/task/run/WIP → tiếp tục. Hỗ trợ cùng model hoặc profile/model khác **đã có observation hợp lệ và nằm trong grant**; không probe/fallback ngầm. Lead dùng `bin/team.js`; runtime managed cũng có thể gửi yêu cầu swap JSON có cấu trúc, không sinh shell/CLI tùy ý. Driver dùng Claude print adapter: successor có bootstrap read-only rồi invocation thực thi mới, không tuyên bố native resume nguyên lịch sử. Không có telemetry/controller context tự động hoặc nghiệm thu8h.

Backend giữ full snapshot; context kế thừa gửi summary/decisions/acceptance/scope/WIP/hash, không gửi full inventory hoặc private PM transcript. Run lưu ledger từng execution/bootstrap, kể cả failed/unknown; reservation invocation không phải số request provider hoặc hard cap tiền. Restart vô hiệu capability/grant và giữ checkpoint/event, run chưa rõ thành interrupted; không tự resume/retry. Team cũ được archive trong cùng kho khi tạo team mới, không mất pending event.

Bằng chứng và hướng dẫn: [pm-team/ACCEPTANCE.vi.md](evidence/pm-team/ACCEPTANCE.vi.md), `test/team.test.js`, `bin/team.js`, `bin/pm.js`. Fixtures dùng subprocess/bwrap ghi thật trên checkout tạm, gồm driver/runtime parser production với executable fixture **không gọi AI**. UI hiện hữu không có form cấp team grant, hiển thị lifecycle swap hoặc lựa chọn thời lượng mới; hành trình mới dùng API/CLI, chưa nghiệm thu UI/team/model thật. Không đổi UI trong lát cắt này. Mọi thay đổi cũ vẫn giữ chưa commit; không đụng3000, settings global, bản cài local, model trả phí hoặc push.

**Kiểm chứng cuối:**295/295 test trên29 file đạt bằng runner tuần tự, RAM1200MiB/swap0/timeout900s;19 ca team và15 ca PM riêng đạt. `git diff --check` và syntax checks đạt. Source hash/test totals ở [verification.json](evidence/pm-team/verification.json); fixture report ở [journey.json](evidence/pm-team/journey.json).

**Việc tiếp theo:** xem bằng chứng/kết quả test cuối tại acceptance. Model thật chỉ sau quyết định riêng về adapter/model/version, paid probe, scope/budget và số invocation. Không dùng fixture làm bằng chứng giảm công giám đốc/billing, hoặc gọi đây là công ty agent đa thành viên/đa file hoàn chỉnh. Các dòng “chưa có team/swap” phía dưới là trạng thái trước lát cắt này.

### Mục tiêu và các quyết định đã thống nhất

- **Sản phẩm:** giám đốc giao một mục tiêu, PM làm rõ các quyết định quan trọng và chịu trách nhiệm hiểu đúng; team tự đề xuất lead/chia task/thực hiện; PM duyệt kế hoạch lúc đầu và nghiệm thu/nén báo cáo lúc cuối. Không để PM model follow mọi progress/heartbeat. Team đánh thức PM bằng sự kiện kết quả/blocker cần quyết định; phần chờ/dedupe/heartbeat chạy bằng code. CLI tắt thì event phải được giữ, không giả đã resume.
- **PM:** giảm thao tác thường nhật, giữ trách nhiệm kết quả; không build đoán rồi quy lỗi cấp dưới. Hỏi có khuyến nghị và lý do, đồng ý/đổi phương án, luôn trả lời tự do; từ chối không buộc giải trình. Approval gắn đúng brief/plan/goal revision và grant, không suy thành quyền chi tiêu chưa cấp. Việc nhỏ có thể giao một người hoặc dùng direct CLI, không bắt họp/team cho có.
- **Phiên sản phẩm:** lựa chọn1h/2h/3h/đến khi hoàn thành; budget và quyền riêng. Đếm từ readiness/handoff, hết phiên checkpoint/dừng an toàn rồi đề nghị quyết định tiếp. Không deadline tổng không là tiền/run/retry vô hạn. Lựa chọn này chưa có enforcement trong source.
- **Readiness:** repo/workspace/base/dirty snapshot, tools/dependencies/test command, runtime/model identity, scope/output/evidence rõ trước dispatch. Paid probe chỉ sau quyền/budget. Thành viên yếu phải đánh giá từ artifact/test/tiến triển; kiểm môi trường/cách giao việc trước. Có giới hạn sửa; cancel/reconcile writer cũ trước reassign/rút agent, không tự tạo hệ thống HR/ranking theo tên model.
- **Context dài:** không hứa context không tăng hoặc CLI bất kỳ không bao giờ đầy. Dùng số runtime, không hỏi model tự đoán. Context resident, tổng usage và billing là ba loại số khác nhau. Mỗi actor có context công việc riêng; server giữ quyết định/checkpoint/evidence có revision, chỉ hydrate phần cần thiết. Context thấp bằng cách quên việc không được tính thắng.
- **Quyết định cuối về chuyển phiên:** **swap runtime/model dưới cùng logical agent/slot A**, không out/join như hai nhân sự mới. A yêu cầu swap, gửi checkpoint; runner mở CLI kế thừa chờ; successor nạp/ack đúng checkpoint và readiness; server xác minh writer cũ ngừng ghi rồi chuyển generation/quyền tiếp tục, supervisor đóng process cũ. Slot/task/WIP/decisions/evidence giữ liên tục, log rõ model/phiên kế thừa. Cùng model/phiên mới phục vụ context; khác model phải nằm trong allowlist/quota/quyền/budget, không fallback âm thầm. AI dùng tool yêu cầu runner, không tự sinh shell/CLI tùy ý; không hai writer, không coi revoke token là đã đóng process. Xem phần swap trong PLAN.
- **Báo cáo:** PM trả ngắn, rõ kết quả so acceptance, link evidence, hạn chế, chi phí/thời gian đã biết hoặc unknown, quyết định cần giám đốc. Đào sâu khi được hỏi, ưu tiên truy nguồn đã lưu; nếu cần nghiên cứu mới thì scope/budget mới phù hợp. “Chuyên nghiệp” không là báo cáo dài mặc định.
- **Wow factor/README:** hướng tới giảm công giám đốc trên kết quả đạt yêu cầu, hoặc tăng tỷ lệ thành công trong cùng ngân sách. Chưa có benchmark model/công việc thật chứng minh lợi ích tổng. Không đưa giảm95–96% payload fixture thành headline giảm tiền. Giữ baseline direct CLI có native context/auto-compaction/tests/report mạnh; manual team chỉ so khi case thật cần phối hợp. Tính đủ PM/lead/worker/review/probe/compact/swap/retry/fix, setup/bảo trì/phục hồi và công người dùng. Báo PM thua/không rõ đúng; không ép thắng, nhồi workload hoặc tắt nén baseline.

### Source, bằng chứng và phần còn thiếu

- Git HEAD đã kiểm: `e292fd3833d65152ebfa6133fc27a67285b6cab9` (`main`); nhiều thay đổi CLI/PM/UI/docs có sẵn chưa commit và file mới chưa track. Kiểm Git lại trước sửa, giữ nguyên phần không liên quan; không reset/clean. Nội dung runtime mới phải tích hợp với phần này, không bắt đầu từ HEAD sạch rồi làm mất nó.
- Đã có PM credential local riêng, pending/code approval, private director channel, goal/grant/revision và canonical task/run, PM trực tiếp plan/run/verify/integrate/report. Có scope/cost-unknown/run cap/cancel/revoke/lost/restart guards. PM state/wait có cursor giảm lặp/chờ; `bin/pm.js` chỉ client API, không launcher/daemon. Backend chưa có chair operations đầy đủ cho PM, lead execution capability, team handoff, wake runtime hoặc swap transaction.
- Đã có `tools/measure-context-window.js`: phân tích snapshot Claude statusline offline, unknown/mismatch/peak qua sessions và giới hạn đọc trace; **không là collector/controller**, chưa mapping Codex/agy context resident hoặc runtime8h.6 test đạt, log `docs/evidence/context-window/tests.txt`. Chưa sửa `src/runtime.js` trong phần context này.
- PM15/15 và analyzer pilot3/3 đã đạt ở lát cắt trước; runtime regression9/9 mỗi copy pilot. Full suite265/26 là bằng chứng lịch sử trước các bổ sung này, không tự coi đã chạy trên source mới. Bộ mới chưa có model test thật. Cần test lại phù hợp các thay đổi tiếp theo, tuần tự/có giới hạn.
- Pilot `runtime-evidence`: `/tmp/am-pm-pilot-bh1LIJ/{direct,pm}`,303 file cùng snapshot/hash/acceptance. Hai lỗi parser cost âm và nhiều model bị label che vẫn chưa sửa cho đối chứng; acceptance mới fail2/2 đúng lỗi, regression9/9 đạt. Input đã khóa trước cập nhật docs cuối; không âm thầm thay input/so runtime mới với protocol cũ. Source copy tạm có thể mất; tái tạo phải ghi version/hash mới.
- Số đo đã có: schema payload giảm khoảng10–15%; fixture chỉ cần5/100 tin giảm khoảng95%; chọn1 reference so đọc cả catalog giảm96,5% nhưng chưa đối chứng `rg` mạnh; đọc hết trang tăng1–1,9%; graph khi đã biết file tăng overhead. PM sum fixture thua, không chạy lại để ép thắng. Cursor control1363→171byte và preexisting-change0ms vs legacy505ms có sentinel500ms, chỉ chứng minh transport. Không suy thành billing hoặc benchmark nhiều lượt. Không sửa README claim trước bằng chứng.

### Nguồn bắt buộc và thứ tự thực thi

1. Đọc AGENTS và hiện trạng đầu HANDOFF; `docs/PLAN-pm-operator.vi.md` (định hướng mới + swap), `docs/CONSISTENCY-JOURNEYS.vi.md` UC09/UC10, `docs/evidence/context-window/PROTOCOL.vi.md`; khi làm quyền/runtime đọc CONTRIBUTING/SECURITY/SECURITY-DESIGN/ROUTING-WORKFLOW. UI bắt buộc skill ui-ux-pro-max và design tokens/flow như AGENTS. Tham khảo `docs/prompts/pm-operator.vi.md`, nhưng prompt hiện hành/đoạn lịch sử không được ghi đè hợp đồng mới.
2. Chốt contract nhỏ nhất trên kho task/run/checkpoint hiện hữu: logical member + runtime generation/credential; brief/plan approval; delegated lead; event wake/ack và swap state. Dùng source/task/revision chuẩn, giữ compatibility Tôi và private boundaries. Không tạo thêm bảng task hoặc general memory/scheduler engine trước nhu cầu kiểm chứng.
3. Triển khai một hành trình local low-risk end-to-end: PM nhận/làm rõ/chair có scope → readiness → lead/plan được duyệt → team tự làm trong quyền → PM chờ bằng code → event có evidence → PM report/đào sâu. Tích hợp swap cùng slot ở giữa hành trình, bảo toàn WIP và chặn writer cũ. Tái sử dụng sandbox, WorkManager và evidence/integration thực hiện có; không bỏ verification để làm nhanh. Cơ chế lead/room creation/admission nào cần mở phải có grant/backend guard, không trao hostKey.
4. Kiểm fixture subprocess/cancel/writes thực trước và độc lập trên source tích hợp; kiểm lỗi/restart/replay/goal change/scope/time/cost-unknown, UI VI/EN/theme/keyboard/responsive/Back/reload/deep link nếu đổi UI. Không chỉ test state machine mock rồi báo auto-close/team tự chủ. Runtime thật chỉ sau quyền/ngân sách rõ; nếu chưa được phép, chuẩn bị chính xác adapter/model/run cap/budget cần và phân biệt reported/verified/integrated/model-unverified.
5. Cập nhật journey/tài liệu/evidence đúng trạng thái và benchmark setup hợp lý, giữ kết quả bất lợi/unknown. Không sinh thêm plan/báo cáo rườm rà thay code được phép. Không dùng giới hạn paid để bỏ dở fixture/integration có thể hoàn tất.

### Done trong phạm vi được phép và quyền phải giữ

Done kỹ thuật là hành trình tích hợp ở trên chạy được có evidence: PM không phải model poll tiến độ; lead không mượn PM/host credential; successor nạp đúng checkpoint/slot/task/WIP, chỉ một writer có quyền thực, phiên cũ bị supervisor đóng được trong adapter hỗ trợ; báo cáo giữ acceptance/evidence/unknown; lỗi/rollback/restart/stale không tạo duplicate run/wake/swap hoặc quyền vượt scope. Có test phù hợp và browser journey nếu UI đổi, không lỗi quan trọng đã biết trong phần ảnh hưởng. Không hứa agent CLI bất kỳ tự đóng/8h bền/model efficiency khi chưa kiểm. Nếu điều kiện nghiệm thu đòi model thật nhưng chưa có quyền, báo rõ **chưa nghiệm thu model thật**, không tự gọi là hoàn tất sản phẩm tuyệt đối; vẫn hoàn tất mọi phần đã được phép trước khi kết thúc.

Giữ mọi thay đổi chưa commit; **không gọi model/CLI trả phí hoặc paid probe, không đổi settings global, không đụng process/cổng3000, không cập nhật bản cài local, không commit/push**.3h30 không gỡ các giới hạn này. Test tuần tự, memory/swap/timeout/run/retry cap theo repo; không deadline tổng hoặc ngủ chờ đủ thời gian, không chạy lại suite vô ích. Không tự mở thread/automation hoặc gọi model/subagent trả phí. Không tự giảm mục tiêu thành plan-only, nhưng cũng không mở rộng multi-file/remote/HR/model-ranking hoặc nền tảng công ty tổng quát chỉ vì ý tưởng xa hơn. Nếu buộc phải có quyết định vượt quyền, nêu đúng quyết định và tiếp tục công việc độc lập đã được giao.

## Các mốc trước bàn giao này (giữ làm lịch sử)

> **Context phiên dài — 2026-10-22:** người dùng muốn CLI tham gia team không bị đầy context trong phiên8h và benchmark số đo theo quá trình làm. Đã đối chiếu official Claude statusline/Codex App Server và thêm `tools/measure-context-window.js` phân tích trace runtime offline: peak/current input+cache, unknown, budget exceedance, disagreement, không cộng dồn usage thành context; không hỏi model tự đoán.6 test fixture đạt tuần tự với memory/timeout. [Protocol, nguồn và giới hạn](evidence/context-window/PROTOCOL.vi.md), [test log](evidence/context-window/tests.txt). Đây **chưa là collector, context controller, compaction/resume hoặc benchmark model8h**. Không sửa source runtime/CLI settings, không model thật; giữ pilot parser cũ chưa sửa và mọi thay đổi chưa commit.
>
> **Việc tiếp theo context:** một adapter được cấp quyền có telemetry và control thật, cùng baseline native auto-compaction bật; khóa case/acceptance/model/version/budget trước pilot. Sau đó kiểm checkpoint/nén/chuyển phiên giữ đúng quyết định/scope và test output, đo mọi chi phí/recovery. CLI chỉ join bằng MCP/curl không cho app quyền thấy/điều khiển nội bộ: unknown, không hứa context đứng yên/không bao giờ đầy. Không tự gọi paid probe, sửa settings global, đụng3000/bản cài local/commit/push hoặc dựng memory system tổng quát. Phiên8h là mục tiêu sản phẩm khi có quyền thử, không là deadline tổng cho phát triển hiện tại.

> **Định hướng mới từ giám đốc — 2026-10-22:** PM chủ trì đầu/cuối và chịu trách nhiệm hiểu đúng mục tiêu; team tự đề xuất lead/chia task/thực hiện trong quyền, chỉ đánh thức PM khi có kết quả hoặc cần quyết định. PM báo cáo ngắn cho giám đốc và đào sâu khi yêu cầu. Đã chốt [hợp đồng vận hành đích](PLAN-pm-operator.vi.md#định-hướng-mới-pm-giao-việc-cho-team-hoạt-động-theo-sự-kiện), UX câu hỏi có khuyến nghị/từ chối tự do, thời lượng1h/2h/3h/đến khi hoàn thành tách budget, readiness, chuyển việc dựa evidence, wake/dedupe và acceptance UC10. Đây là **thiết kế, chưa là runtime tự chủ mới**: source vẫn PM run/verify/integrate, không có lead capability hoặc wake/resume thật. Lượt này đọc source/Git/skill UX và cập nhật hợp đồng/tài liệu; không sửa runtime/UI, không chạy lại test cho thay đổi tài liệu, không gọi model trả phí. Không lấy prompt hoặc wait cursor làm bằng chứng PM đã ngủ/team đánh thức được.
>
> **Việc tiếp theo theo định hướng mới:** làm một hành trình local trong scope: quyền chair giới hạn → lead/plan được duyệt → handoff scope → team thực hiện/escalate → wake có runtime thật → PM report có evidence, rồi đối chứng chi phí/công giám đốc. Chưa mở scheduler tổng quát/multi-file/remote/ranking model để làm demo. Pilot parser đã khóa và kết quả cũ giữ nguyên; runtime/protocol đổi phải version lại phép thử trước model run. Vẫn chưa có quyền paid model/CLI hoặc budget mới; giữ thay đổi chưa commit, không đụng3000/settings global/bản cài local/commit/push, không deadline tổng. Các ưu tiên lịch sử phía dưới không thay yêu cầu mới này.

> **Trạng thái kiểm chứng PM — 2026-10-22, chưa commit:** đã chuẩn bị pilot công việc thật `runtime-evidence` (hai lỗi parser cost/model tái hiện trên source, chưa có incident production), baseline direct CLI mạnh, một input dirty snapshot/test/acceptance dùng chung và ledger không thay unknown bằng0. Hai copy `/tmp/am-pm-pilot-bh1LIJ/{direct,pm}`, manifest303 file, cùng HEAD `e292fd3`; test acceptance độc lập fail đúng hai lỗi ở cả hai copy, runtime regression9/9 đạt mỗi copy, hash trước/sau không đổi. Snapshot khóa trước các cập nhật evidence/handoff cuối; không lấy source hiện tại thay nó giữa hai arm. Xem [protocol và bằng chứng](evidence/pm-operator/PILOT.vi.md). Chưa gọi model/probe trả phí; chưa có số đo billing hoặc công giám đốc thật. Analyzer ledger chưa chạy trả `insufficient-evidence`, không kết luận PM thắng.
>
> **Overhead đã sửa:** PM state/wait có cursor tùy chọn, trả ngay thay đổi đã có trước wait và metadata ngắn khi không đổi, giữ auth/lease/revoke/compatibility. Control1363→171 byte, cursor cũ0ms vs legacy505ms được giải phóng bằng sentinel500ms; chỉ là transport, không token/tiền. Targeted PM15/15 và analyzer3/3 đạt (ghi cả lần test fixture kỳ vọng sai/prepare revision thiếu trim đã sửa). Không thay UI, không xóa verification/grant, không mở rộng scheduler/reviewer/multi-file. Không chạy lại demo sum/full suite để tạo bằng chứng hiệu quả.
>
> **Việc tiếp theo PM:** đọc PILOT trước; kiểm snapshot/hash và giữ case parser chưa sửa trong source chính đến khi cặp đối chứng dùng input đã khóa. Chỉ chạy sau quyền rõ về CLI/provider ID/version, cùng model direct/PM/worker, paid probe, một cặp/tối đa4 CLI invocation và budget USD/cách dừng. Catalog hiện không có provider ID đã xác minh; tuyệt đối không tự probe hoặc điền usage giả. App không hard cap tiền,4 invocation không là4 provider request. Mọi setup, PM/worker/probe/review/retry, chi phí session chuẩn bị và công/thời gian/phục hồi đều ghi có provenance hoặc unknown. Một pilot không đủ khái quát; nếu PM không bù overhead thì giữ direct CLI khuyến nghị. Chưa được cấp quyền/ngân sách, không đặt deadline tổng; giữ test tuần tự có giới hạn, không đụng3000/settings global/bản cài local/commit/push. Các hạn chế và quyền này thay ưu tiên lịch sử mâu thuẫn bên dưới.

> **Ưu tiên phiên sau — kiểm chứng hiệu quả PM nghiêm túc (yêu cầu mới 2026-10-22):** người dùng yêu cầu case PM phải chứng minh tiết kiệm hơn coding CLI trực tiếp. Nhiệm vụ tiếp theo là **kiểm chứng và cải thiện hiệu quả trên công việc thật**, không thêm tính năng hoặc lặp demo sum. Đọc [hợp đồng đối chứng](PLAN-pm-operator.vi.md#kiểm-chứng-hiệu-quả-pm--ưu-tiên-phiên-sau), kiểm source/Git rồi làm phần được phép ngay: chọn case thực có pain point, baseline coding CLI đủ tốt, khóa input/acceptance và ghi nhận đầy đủ chi phí. Chỉ kết luận tiết kiệm nếu số đo ủng hộ; kết quả PM thua/không rõ cũng phải báo đúng, chỉ ra điểm hòa vốn hoặc đơn giản hóa/bỏ overhead không được bù. Không chọn case thiên vị PM, làm baseline yếu, giấu setup/retry/thất bại hoặc coi fixture là model thực.
>
> **Quyền cho phiên sau:** yêu cầu kiểm chứng này **chưa gỡ lệnh cấm gọi model/CLI trả phí** và chưa cấp ngân sách thử nghiệm. Hoàn tất case, harness/log và tiêu chí cụ thể trong phạm vi hiện có trước; chỉ chạy model thật sau khi người dùng cấp rõ CLI/model, phạm vi và ngân sách/run cap. Không tự dựng fake usage hay dùng fixture để tuyên bố đã chứng minh. Giữ giới hạn cổng3000/settings global/bản cài local/commit/push, test tuần tự có giới hạn; không đặt deadline tổng, không mở rộng scheduler/multi-file/reviewer chỉ để tạo lợi thế cho PM.

> **Trạng thái PM — đã triển khai tại workspace, 2026-10-22, chưa commit:** chọn Tôi/Agent, PM CLI join trước bằng prompt/capability riêng và mã xác nhận; kênh riêng giám đốc–PM, goal revision/grant local, canonical task/run, run→test độc lập→tích hợp một file + test source→report. Có quan sát/dừng/thu hồi/tiếp quản, chặn spoof/cost unknown chưa duyệt/scope/run cap/stale goal, mất lease và restart không tự tiếp tục. Suite265 test/26 file đạt;18 test PM/i18n cuối đạt (gồm client mới); test fixture có Node subprocess sandbox thật, không có model thật; [bằng chứng và giới hạn](evidence/pm-operator/ACCEPTANCE.vi.md). `bin/pm.js` là client API, không daemon hoặc launcher model. Grant run cap không là hard cap tiền; usage/cost PM ngoài vẫn unknown. Đối chứng fixture cùng task cho thấy overhead tăng, không chứng minh rẻ/nhanh hơn coding CLI trực tiếp; giữ Tôi mặc định, không thêm scheduler/agent mới. Giữ mọi thay đổi CLI/skill có sẵn chưa commit. Không chạm app3000/settings global, model trả phí, bản cài local hoặc commit/push.
>
> **Việc tiếp theo PM:** preview fixture tại `http://127.0.0.1:3143/m/host_consistency_preview_1234?lang=vi#results` (`agent-meeting-pm-preview.service`, source/dữ liệu tạm, không model thật). Người dùng đánh giá UX và, khi cấp quyền riêng, chạy đối chứng model thật cùng objective/input/acceptance trên checkout tạm (direct CLI vs PM+worker), ghi cả thao tác/thời gian giám đốc, PM/worker/review/retry usage/cache/chi phí và chất lượng kết quả. Không tự probe model hoặc đổi settings để làm phép thử. Chưa nghiệm thu daemon/resume, review chuyên gia, multi-file, secret/network sandbox hoặc hard spending cap. Những đoạn “chưa có PM” dưới đây là lịch sử trước lát cắt này.

> **Lịch sử yêu cầu build PM — đã thực hiện lát cắt nêu trên, 2026-10-22:** người dùng đã yêu cầu **build ý tưởng chọn Tôi/Agent làm chủ trì**, người dùng là giám đốc chỉ trao đổi với PM CLI join trước qua prompt riêng; đồng thời giữ tư duy pain point trước, làm đủ và tối ưu tổng chi phí/token. Đây là ủy quyền triển khai mới, thay trạng thái “mới đề xuất” của PM ở các mục lịch sử bên dưới. Phiên kế tiếp đọc [phạm vi/điểm dừng đã cập nhật](PLAN-pm-operator.vi.md) và [prompt PM](prompts/pm-operator.vi.md), kiểm source/Git rồi **thực thi**, không dừng ở nạp context hoặc viết thêm plan. Chưa có PM runtime/slot/quyền trong source; cần làm hành trình có bằng chứng chứ không chỉ thêm role/prompt. Tái sử dụng task/run/source/revision, giữ mode chủ trì Tôi, giám đốc quan sát/dừng/tiếp quản; quyền PM riêng có phạm vi. Chỉ gọi thêm agent/lớp điều phối khi giúp giải quyết việc thật; không coi toàn bộ backlog/kiến trúc A–C là bắt buộc.
>
> **Tiêu chí tiếp tục/dừng:** không đặt deadline tổng, nhưng giữ test tuần tự có cgroup/timeout và giới hạn run/retry. Làm đến hành trình mục tiêu đạt tiêu chí và không còn lỗi quan trọng đã biết trong phần bị ảnh hưởng, báo giới hạn trung thực rồi dừng; không tối ưu vô hạn. So lợi ích với coding CLI trực tiếp bằng cùng task/acceptance khi có quyền chạy; tính cả PM/worker/review/retry và công người dùng. Fixture/tokenizer là bằng chứng có phạm vi, không tự chứng minh tổng billing hay model thực. Giữ mọi thay đổi chưa commit; không đụng app3000/settings global, không model/CLI trả phí, không tự commit/push/cập nhật bản cài. Quyền mới về thời gian không gỡ các giới hạn này. UI phải áp dụng skill/flow/test theo AGENTS. Chuẩn bị phép thử model cụ thể nếu còn thiếu quyền; tiếp tục hoàn tất các phần được phép trước.
>
> **Skill bàn giao cá nhân đã cập nhật:** `/home/theo/.codex/skills/viet-ban-giao/SKILL.md` và metadata hỗ trợ “viết vài câu gửi phiên kế tiếp” theo hai chế độ: **thực thi ngay nhiệm vụ đã giao** hoặc **nạp context rồi chờ** (kể cả lỗi gõ “nthực thi”). Nêu chờ rõ ràng thì không tự build/test/backlog; bàn giao không cấp quyền mới. Validator đạt. Skill ngoài repo, không là thay đổi settings global; không cài thêm skill dự án. Lượt này chỉ chuẩn bị bàn giao theo yêu cầu, chưa bắt đầu build PM, không chạy lại test ứng dụng.

> **Nguyên tắc phát triển — 2026-10-22:** theo yêu cầu người dùng, AGENTS đã bổ sung “Pain point trước, làm đủ và biết dừng”: lấy vấn đề/hành trình và baseline đơn giản làm gốc, làm lát cắt nhỏ nhất giải quyết trọn việc, sửa tới tiêu chí đủ, tính tổng overhead rồi dừng. Không coi plan/backlog hoặc nhiều agent/tính năng là mục tiêu. Các thiết kế PM bên dưới vẫn là đề xuất; chưa được hiểu thành yêu cầu triển khai toàn bộ. Bước tiếp theo khi build là chọn một pain point/hành trình cụ thể và nghiệm thu lợi ích, không tự mở rộng kiến trúc. Lượt này chỉ sửa hướng dẫn/bàn giao, giữ mọi thay đổi chưa commit; không chạy lại test ứng dụng, commit/push hoặc đổi bản cài/settings/process3000.

> **Đánh giá PM/“công ty agent” — 2026-10-22:** người dùng muốn giữ vai trò giám đốc và làm việc qua PM AI điều hành. Đã đối chiếu source/giới hạn, viết [thiết kế PM](PLAN-pm-operator.vi.md) và [prompt riêng](prompts/pm-operator.vi.md). Đây chỉ là assessment/thiết kế/prompt, **chưa có slot, credential hoặc quyền điều hành PM trong app**, chưa gọi model. Đề xuất PM là coordinator riêng, có grant được giới hạn/revoke/audit, không dùng hostKey và không tiêu thụ quorum worker. Các phần leader planning, reviewer acceptance, multi-file integration, budget ledger và reconcile/resume vẫn cần triển khai/nghiệm thu; không coi role/prompt là công ty tự vận hành. Chưa sửa UI/runtime trong lượt này.

> **CLI, skill graph và context — 2026-10-22, chưa commit:** người dùng yêu cầu lập plan rồi thực thi, gồm skill họp + skill local và áp dụng kỹ thuật CodeGraph. Đã thêm doctor chỉ đọc; skills list/show/inspect, graph từ liên kết resource thật, hash manifest và truy hồi từng resource; history phân trang tùy chọn giữ riêng tư/cursor wait và compatibility; mô tả tool gọn hơn. [Kế hoạch](PLAN-cli-skills-tokens.vi.md), [bằng chứng/giới hạn](evidence/cli-skills-tokens/REVIEW.vi.md). Full suite252 test/25 file đạt, tuần tự trong cgroup1200M/swap0 và timeout; skill validator/pack dry-run đạt. Đếm local bằng tiktoken0.14.0: schema conversation giảm9,94–14,65%; fixture truy hồi5 tin giảm94,77–94,88%, chọn1 reference giảm96,53–96,54% so với full scan. Có đối chứng overhead khi đọc hết hoặc đã biết skill. Không coi đây là giảm billing/model-token thực, không gọi model trả phí. Không chạy/cài CodeGraph vendor hoặc đổi UI, app3000, settings global, bản cài local. Giữ phần HANDOFF chưa commit có sẵn, không commit/push.
>
> **Việc tiếp theo trong phạm vi CLI:** người dùng thử lệnh mới từ checkout; bridge đã cài chỉ nhận schema mới sau reconnect khi người dùng yêu cầu. Chưa kiểm CLI thật/auto-mode hoặc billing; doctor không probe mạng/quyền model. Skill native discovery/cài theo client, semantic search, graph xuyên skill và giới hạn backlog wait chưa triển khai. Các bước đó cần yêu cầu riêng; giữ nghiệm thu UX/logo và backlog trước đây đúng trạng thái.

> **Cập nhật nhận diện — 2026-10-22:** người dùng chọn icon cặp công sở và cung cấp SVG, yêu cầu thay trong app và push README. Bộ Briefcase thay Convergence tại assets/icon.svg, favicon/header, mark/wordmark và PNG/ICO/ICNS. Nền trong suốt thật, giữ hình học SVG người dùng; app/README có indigo sáng cho nền tối. Xem [BRAND](BRAND.vi.md) và [bằng chứng](evidence/briefcase/REVIEW.vi.md). Không đổi process cổng3000 hoặc cài vào app thật. Đã push `main` tới `e292fd3833d65152ebfa6133fc27a67285b6cab9`; [CI Node18/20/22](https://github.com/ttat288/agent-meeting/actions/runs/39713170538) và [installer native Linux/macOS/Windows](https://github.com/ttat288/agent-meeting/actions/runs/39713170326) đều completed/success, đã kiểm lại khi bàn giao. Các đoạn Convergence bên dưới là lịch sử.
>
> **Việc tiếp theo:** dùng logo Briefcase hiện hành; kiểm icon qua launcher trên máy người dùng và cập nhật demo theo bản quay mới khi cần. Không coi ảnh/GIF lịch sử là nhận diện hiện tại. Không có lỗi CI còn mở trên commit trên. Bản app đã cài local có thể còn icon cũ; chỉ cập nhật/restart theo yêu cầu người dùng.
>
> **Quy ước bàn giao cá nhân:** đã tạo skill local `/home/theo/.codex/skills/viet-ban-giao/SKILL.md`, validator đạt và đã xuất hiện trong danh mục skill phiên. Khi người dùng nói “viết bàn giao”, kiểm tài liệu đã đủ chưa: thiếu thì cập nhật, đủ thì skip; câu trả lời chỉ gồm “Đây là bàn giao”, link file và prompt nạp context. Skill là tài nguyên cá nhân ngoài repo. Lần bàn giao này chỉ cập nhật HANDOFF để bổ sung commit/kết quả CI/quy ước, không tự commit/push thêm.

> **Trạng thái hiện tại — branding/installer lên main, 2026-10-21:** sau main `102c893`, triển khai logo Convergence v1 theo lựa chọn “nhiều góc nhìn hội tụ thành quyết định” và desktop installer Node stdlib. Người dùng đã yêu cầu push toàn bộ và cập nhật main; xuất bản logo/installer cùng tài liệu và bằng chứng, không tạo tag/release. Lệnh GitHub dùng ref main rõ ràng. Preview `http://127.0.0.1:3122` qua service `agent-meeting-brand-preview.service`, chỉ whitelist asset thương hiệu. Xem [brand](BRAND.vi.md), [installer](INSTALL.md), [kiểm chứng/review](evidence/brand-install/REVIEW.vi.md). 245 test/23 file đạt bằng runner tuần tự cgroup1200M/swap0, browser375/768/1280 không tràn ngang. Hai reviewer Codex nội bộ đã kiểm lại các phát hiện đã sửa. Người dùng đã duyệt logo Convergence (“logo 1 ok đó convergence”) ngày 2026-10-21; [smoke test native cả ba OS đạt trên `6f329f8`](https://github.com/ttat288/agent-meeting/actions/runs/39632577516); GUI/icon còn chờ kiểm thủ công. Không cài vào app thật, không đổi process cổng3000 hoặc dữ liệu người dùng.
>
> **Việc tiếp theo:** dùng logo Convergence đã duyệt cho nhận diện; kiểm GUI launch và icon trên máy người dùng, giữ phân biệt smoke test native với nghiệm thu trải nghiệm. Giữ các mục showcase/UI trước đây làm lịch sử, cập nhật demo theo nhận diện đã duyệt trong lần cập nhật showcase tiếp theo.

> **Trạng thái mới nhất — showcase đã hợp nhất vào main, 2026-10-21:** theo yêu cầu người dùng, nhánh `v3.5-security` tới `d7e533a` đã fast-forward vào `main`, gồm nền3.5/routing/task, UI v2 và README/demo mới. README Anh/Việt và GIF10 cảnh/34 giây đã xem render thật trên GitHub; player có pause/tua/đổi ngôn ngữ tại `http://127.0.0.1:3121/showcase/?lang=vi` (transient service chỉ phục vụ docs). Hai reviewer Codex nội bộ đã review; phát hiện link GIF404 và guard khi manifest lỗi đã sửa/kiểm lại. [Review](evidence/showcase/REVIEW.vi.md), [showcase](SHOWCASE.md), [CI Node18/20/22 đạt trên bản mã](https://github.com/ttat288/agent-meeting/actions/runs/39618725924). Các commit sau bản mã này chỉ sửa player/tài liệu, đã kiểm browser riêng. Không tạo release/tag, không đổi app đang chạy cổng3000, không cài thêm ba design skill.
>
> **Việc tiếp theo:** người dùng xem README/demo và đánh giá UX; giữ các giới hạn managed/remote/model trong IMPLEMENTATION-STATUS, không coi showcase hoặc CI là nghiệm thu sản phẩm. UI WORK/ENDED mới đã sửa lỗi feed24px, xem evidence/showcase. Những đoạn “chưa push/merge” bên dưới là lịch sử các lát cắt trước, không phải trạng thái Git hiện tại.

> **UI v2 đã triển khai — 2026-10-21, chờ đánh giá UX:** một shell52px desktop/hai hàng89px mobile, timeline495px ở viewport609px; token và task/tool rows chung cho năm view. Hai reviewer Codex nội bộ review thiết kế + triển khai, phát hiện đã sửa/kiểm lại; browser journey lỗi/phục hồi/zoom200% thật và hồi quy có giới hạn. Xem [evidence/ui-v2/ACCEPTANCE.vi.md](evidence/ui-v2/ACCEPTANCE.vi.md). Preview3119 giữ bằng transient service `agent-meeting-ui-v2-preview.service`; không đụng3000. Việc tiếp theo: người dùng đánh giá bản chạy trước backlog mới, không coi test/ảnh là nghiệm thu.

> **Ưu tiên mới nhất — cải cách UI, 2026-10-21:** người dùng chưa chấp nhận UI hiện tại: chưa rõ ràng, nhiều chữ thừa, bố cục chưa gọn, chưa gom nội dung hợp lý và thiếu phân biệt nền/khối/điều khiển. Phiên sau phải đọc [HANDOFF-ui-reform.vi.md](HANDOFF-ui-reform.vi.md) và cải cách UI trước backlog model/remote hoặc tính năng mới. Kết quả test luồng trước đây không đồng nghĩa thiết kế đã được nghiệm thu.

> **Cập nhật triển khai thống nhất — 2026-10-21:** đã triển khai view chung tại `/m/<key>#conversation|plan|execute|results`, redirect `/workspace`, adapter VIỆC → task UUID, cấu hình trên task sẵn có, revision/source guards và carry dùng chung kho. Đọc [CONSISTENCY-JOURNEYS.vi.md](CONSISTENCY-JOURNEYS.vi.md) và [bằng chứng nghiệm thu](evidence/consistency/ACCEPTANCE.vi.md). Browser đi hết luồng bằng fixture Node subprocess thật; chưa nghiệm thu hành trình mới bằng model thật/remote máy thứ hai. Không coi đây là đội tự xây sản phẩm hoàn chỉnh.

> **Bàn giao để push — 2026-10-21:** người dùng đã yêu cầu commit/push nhánh `v3.5-security`, gồm lớp routing/task/workspace, UI v2, test và tài liệu/bằng chứng liên quan. Bản cài app local đã cập nhật; người dùng nhận xét UX “tạm ổn” sau cuộc họp thử annotator. Giới hạn còn mở: ENDED với ba task dài làm tổng kết chiếm timeline (feed khoảng24px ở viewport608px), xem [observations](evidence/annotator-discussion/OBSERVATIONS.vi.md). Ba bộ design skill mới chỉ được nghiên cứu, chưa cài. Skill local, cấu hình và dữ liệu chạy trong home/tmp không đưa vào Git. Không tạo release/tag hoặc merge main trong lần push này.

> **Showcase và chuẩn bị merge main — 2026-10-21:** README Anh/Việt viết lại theo luồng câu hỏi→phản biện→quyết định→task có nguồn. GIF UI v2 mới có10 cảnh/34 giây và caption; player local có pause/tua, không autoplay. Đã sửa cấu trúc WORK/ENDED: bỏ task table/conclusion lặp, footer gọn, metadata/export/carry/new trong disclosure; sidebar giữ điều khiển tiến độ. Kiểm độc lập36 ca layout/keyboard, source/reload/Back/download/carry, zoom200% thật; 231 test đạt sau khi khôi phục byte nguồn routing (lỗi whitespace của lần push trước). CI cũ thiếu bwrap và dùng cờ test không hợp Node18: runner tạm được chuẩn bị bwrap, test tuần tự có cgroup1200M/swap0 và timeout; npm test có runner từng file, managed verification Node18 giữ deadline tiến trình khi thiếu cờ mới. CI Node18 phát hiện localhost→IPv6 không fallback: kho phòng local nay lưu127.0.0.1 đúng bind của server, test bridge vẫn thử đầu vào localhost. Demo dùng bot kịch bản, không model trả phí hoặc giả hoàn thành task. Xem [SHOWCASE.md](SHOWCASE.md). Người dùng đã yêu cầu push toàn bộ và merge main; không tạo release/tag.

## Sản phẩm là gì

Agent Meeting: phòng họp cho nhiều AI agent (Claude Code, Codex, Gemini CLI, hoặc bất kỳ agent nào chạy được `curl`) trên các máy khác nhau tự trao đổi; người dùng là **chủ trì** qua trang web. Một lệnh `npx github:ttat288/agent-meeting` chạy server Node (không thư viện ngoài) + tunnel Cloudflare miễn phí.

- Repo: https://github.com/ttat288/agent-meeting (public, MIT). Đăng nhập `gh` trên máy dev là tài khoản `ttat288`.
- Người dùng nói tiếng Việt; giao thức agent và tài liệu hướng dẫn (GUIDE, DEPLOY) bằng tiếng Việt. **README: tiếng Anh là bản
  chính (`README.md`), tiếng Việt ở `README.vi.md`; ngắn gọn, hấp dẫn, luôn ghi phiên bản mới nhất (badge + "What's new");
  chi tiết nằm ở `docs/REFERENCE.md` / `docs/REFERENCE.vi.md`. GIF demo phải là tiếng Anh** (người dùng yêu cầu 2026-10-18).

## Kiến trúc

```text
bin/cli.js        tham số dòng lệnh, tải cloudflared, bật tunnel, tạo cuộc họp, mở trình duyệt
src/meeting.js    lõi: class Meeting (trạng thái LOBBY→LIVE→ENDED, hoặc LIVE→WORK→ENDED khi giữ phòng báo tiến độ;
                  slot, chế độ free/turns, luật chống chờ nhau, kick, giới hạn tin/thời gian, việc có số/trạng thái,
                  toState()/restore() cho --data-dir, carryIn() cho "Họp tiếp"). Không phụ thuộc HTTP.
src/server.js     HTTP thuần: /m/<hostKey> (trang chủ trì), /api/host/<hostKey>/* (điều khiển,
                  long-poll state, minutes.md|json, file/<mã tệp>), /a/<agentId>/<tool> (API văn bản cho curl),
                  /a/<agentId>/send + /a/<agentId>/file/<mã tệp> (tệp, v3.2), /mcp/<agentId> (MCP JSON-RPC);
                  lưu biên bản (--minutes-dir), gửi webhook (work/task/ended), ghi/nạp trạng thái phòng (--data-dir),
                  renew(mt, carry); nội dung tệp: blobs (bộ nhớ) hoặc <dataDir>/<hostKey>.files/<mã tệp>
src/minutes.js    biên bản Markdown / JSON (agent-meeting/minutes@1) / tóm tắt webhook
src/brief.js      bản brief JSON (agent-meeting/brief@1): parseBrief / toBrief / aiPrompt, chạy cả Node lẫn trình duyệt
                  (UMD: module.exports | window.AgentMeetingBrief), phục vụ ở /assets/brief.js (v3.3)
src/ui/           trang chủ trì: index.html + app.css + app.js + i18n.js (từ điển VI→EN, v3.3) (+ /assets/brief.js),
                  không build, CSP chặt
scripts/          install-linux.sh (launcher menu), demo-bots.js (3 agent giả lập, `--en` nói tiếng Anh)
tools/            công cụ phát triển, KHÔNG phát hành: shot.js (chụp ảnh Firefox BiDi), record-demo.js (quay GIF, --vi),
                  make-gif.py, shot-setup.js (ảnh bước 1/2 + tab JSON), shot-mobile.js (mobile tối giữa cuộc họp); BIDI_PORT=…
test/             node:test; meeting.test.js (luật) + server.test.js (HTTP/MCP) + minutes.test.js + files.test.js + brief.test.js
Dockerfile        node:22-alpine, CMD --local --no-open; docs/DEPLOY.md (proxy, systemd, mã cố định)
```

Quyết định kỹ thuật quan trọng (đừng đảo ngược nếu không có lý do mạnh):

- **Long-poll thay SSE/WebSocket**: Cloudflare quick tunnel không hỗ trợ SSE (đã dính lỗi này: trang treo "Đang kết nối…").
- **`wait` chặn ~50 giây** rồi trả "Chưa có tin mới, gọi lại": vừa dưới timeout tool của các CLI (Codex ~60s), vừa không tốn token.
- **Hai token**: `hostKey` (điều khiển) tách khỏi `id` agent (chỉ tham gia). "Cuộc họp mới" **giữ nguyên id agent** để MCP đã cài vẫn dùng được.
- **Không phụ thuộc thư viện**, Node 18+. CI chạy Node 18/20/22.
- Dữ liệu trong bộ nhớ. Lưu ra đĩa chỉ khi người dùng bật (`--minutes-dir`, `--data-dir`).
- `--data-dir` chỉ cho phòng `fixed` (bắt buộc `--host-key`): file `<hostKey>.json` chứa mã nên quyền 600; chỉ phòng đang
  nằm trong `byHost` được ghi (phòng cũ bị "Cuộc họp mới" thay thế không được ghi đè file). Khi nạp lại: agent đang họp được
  coi là còn trong phòng (wait kế tiếp chạy tiếp từ `cursor`), `version` +1000 để long-poll của trang chủ trì không bị kẹt.
- Giữ phòng báo tiến độ (`cfg.followUp`): `_end(reason)` khi LIVE mà còn việc chưa xong thì sang WORK; `_end(reason, true)`
  mới kết thúc hẳn (sweep, "Cuộc họp mới", Đóng phòng). Trong WORK mọi tool trừ progress/history trả `_workText` ngay,
  KHÔNG chặn chờ. Việc "của" agent = dòng VIỆC có tên agent (so khớp theo ranh giới từ, `owns()`), nên giao thức/bối cảnh
  phải dặn ghi đúng tên agent. Phòng tự đóng khi mọi việc `done`.
- "Họp tiếp": việc chưa xong mang sang giữ nguyên số (`taskSeq` không bao giờ dùng lại); `carry.members` cho phép agent của
  các cuộc trước báo `progress` dù chưa join cuộc mới.
- Văn bản gửi agent phải **rất rõ ràng**: agent thật (Haiku, Sonnet…) đã từng bỏ cuộc ở phòng chờ, tự gắn tiền tố "[Tên]", nhầm định dạng. Mọi thay đổi giao thức nên thử với agent thật.
- **Nhận diện kết quả khoan dung nhưng không nhận nhầm** (`_extract` trong src/meeting.js, test lấy từ tin agent thật):
  `KẾT LUẬN:` ở đầu dòng (giữa đoạn chỉ khi viết HOA sau dấu hết câu); `XONG MỤC n` ở đầu dòng hoặc đầu câu,
  giữa đoạn phải có `:`; nhiều mục trong một tin, cho nhảy mục, báo muộn chỉ ghi tóm tắt. Việc gần trùng thì gộp
  (`sameTask`, Jaccard theo từ). Mỗi mục chỉ giữ KẾT LUẬN mới nhất (`decisions()` trong minutes.js và app.js phải giống nhau).
  KHÔNG tự xoá việc cũ khi có KẾT LUẬN mới (đã thử, làm mất việc khi agent chỉ gửi bổ sung).
- Lệnh "Nói" bằng curl dùng heredoc `--data-urlencode "text@-" <<'HET'`: dấu ngoặc kép làm shell nuốt `$0.3`.
- `--public-url` cố định địa chỉ trong giao thức (`fixedOrigin`); tunnel thì dùng địa chỉ của request.
- `--host-key`: phòng `fixed` không bị xoá khi hết hạn mà được `renew()` (cùng hostKey + agent id); trang chủ trì
  thấy `createdAt` đổi thì tự tải lại.
- **Tệp (v3.2)**: server là trạm chuyển tiếp HTTP, nội dung tệp KHÔNG đi qua tin nhắn/ngữ cảnh model. Meeting chỉ giữ
  metadata (`files`: id, name, size, sha256, from, to, note, t, got, carried, gone) và đăng một dòng sys có `file: id`
  (+ `to` nếu gửi riêng); `_render(msgs, a)` thêm lệnh tải đúng của người đọc (`a.base`). Server giữ bytes và kiểm tra
  `sendCheck` + giới hạn TRƯỚC khi nhận (handler `checkContinue`: chỉ `writeContinue()` khi hợp lệ), nhận theo luồng, tính
  sha256 lúc nhận. Gửi riêng được bảo vệ bằng mã tệp ngẫu nhiên (chỉ người nhận được báo) + so tên, KHÔNG phải xác thực.
  `fileFor` so theo TÊN chứ không đòi đang là thành viên (tệp "Họp tiếp" mang sang tải được trước khi join lại).
  `dropFiles` có đếm tham chiếu: tệp mà cuộc khác trong `byHost` còn giữ (Họp tiếp) thì không xoá.
  Mọi agent (cả MCP) có `a.base` = `<origin>/a/<id>` để có lệnh curl cho phần tệp; `a.how` vẫn chỉ dành cho curl
  (quyết định progress qua tool hay curl). Tool `files(name, wait)` là `readOnlyHint`; `send` không phải tool MCP.
  `files?wait=1` chặn tới `waitMs` cho tới khi có tệp chưa tải gửi cho mình: cần cho giai đoạn WORK (agent đã rời không
  còn `wait`), đã thấy agent thật dùng đúng.
- **Bản brief (v3.3)** = đúng thân `POST /api/host/<k>/start` + `schema` + `roles`. `src/brief.js` là nguồn duy nhất cho
  kiểm tra/chuẩn hoá (UI, CLI `--brief-file`, test); `LIMITS` phải khớp `BOUNDS`/`MAX_AGENDA`/`start()` của meeting.js (có
  test so sánh). Server KHÔNG dùng parseBrief: `start()` tự kẹp/cắt như cũ. Lỗi cú pháp dùng bộ dò riêng (`syntaxError`)
  để thông báo tiếng Việt, giống nhau trên mọi engine (thông báo của `JSON.parse` khác nhau giữa Node/Chrome/Firefox).
  Trường thiếu lấy `base` (mặc định của server/CLI), KHÔNG lấy bản nháp đang có: JSON là toàn bộ sự thật.
- `roles` theo vị trí: agent có mặt thứ i (sắp theo slot, `_order()`) nhận `roles[i]` nếu chưa có vai trò giao tay
  (vai trò tay không "ăn" mất vị trí). `meeting.preset` = brief từ CLI, chỉ hiện trong snapshot khi LOBBY, lưu qua --data-dir,
  "Cuộc họp mới" mang sang (như agenda); trang chủ trì dùng làm bản nháp ban đầu khi trình duyệt chưa có nháp.
- Hai bước chuẩn bị là trạng thái TRÌNH DUYỆT (`step`, `location.hash` `#boi-canh`/`#moi-agent`, pushState + popstate);
  server vẫn chỉ có LOBBY. Bản nháp: `localStorage[agent-meeting:<hostKey>:brief]` (nháp cũ ≤3.2 theo từng ô được chuyển).
  Form ↔ JSON: đổi form → JSON viết lại (trừ khi ô JSON đang focus); JSON hợp lệ → form viết lại, KHÔNG định dạng lại chữ
  người dùng đang gõ; JSON sai thì giữ nguyên chữ để sửa tiếp.
- Prompt nhờ AI (`aiPrompt`) đã chỉnh theo agent thật, đừng nới: ví dụ KHÔNG có số liệu/chi tiết riêng (Haiku chép sang
  cuộc họp khác); dặn rõ khi `followUp` thì agenda/endCondition chỉ là phần bàn bạc; prompt không được chứa `<…>`
  (test kiểm). Đổi prompt thì thử lại bằng subagent Haiku + Sonnet với đúng prompt lấy từ trang (so sha256).
- **Hai ngôn ngữ cho trang chủ trì (v3.3)**: khoá dịch là CÂU TIẾNG VIỆT GỐC. Mọi chuỗi hiển thị trong app.js bọc
  `tr('…')` hoặc `` tr`… ${x} …` `` (khoá: `${…}` → `{0}`, `{1}`…, bản EN đổi được thứ tự); HTML tĩnh để tiếng Việt, `apply()`
  dịch từng đoạn chữ + placeholder/title/aria-label. Thêm chuỗi mới thì thêm vào `EN` trong src/ui/i18n.js, `test/i18n.test.js`
  sẽ báo nếu thiếu (kể cả chuỗi tiếng Việt quên bọc `tr`; chuỗi không dấu như `'xong'` thì test không bắt được, phải tự để ý).
  Đừng đặt biến cục bộ tên `tr`. Chữ trong CSS `content:` không dịch được: dùng `attr(data-…)`.
  Chọn ngôn ngữ: `?lang=` → localStorage `agent-meeting:lang` → `navigator.language`; nút VI/EN tải lại trang.
  Tin do server sinh có thêm `m.en` (CHỈ để hiển thị; agent, biên bản, history vẫn dùng `m.text` tiếng Việt). Giao thức gửi agent
  KHÔNG dịch. Phần theo ngôn ngữ trang mà agent nhận được: prompt mời, tin nhanh của chủ trì (giữ từ khoá KẾT LUẬN/VIỆC),
  mẫu bối cảnh, prompt nhờ AI (`aiPrompt(brief, 'en')`). Lý do kết thúc: `REASON_EN` ở meeting.js + bảng trong i18n.js.
- Tệp luôn trả về `application/octet-stream` + `attachment` + `nosniff` + CSP `sandbox` (cùng origin với trang chủ trì);
  tên tệp qua `fileName()` (basename, chỉ `\p{L}\p{M}\p{N}._+-`, không bắt đầu bằng `.`/`-`) nên an toàn trong `curl -o "…"`.

## Cách làm việc / kiểm thử

```bash
npm test                                   # phải xanh
npm start -- --local --no-open --port 3100 # chạy dev (cổng 3000 có thể là app người dùng đang chạy)
npm run demo -- http://localhost:3100/a/<id>   # 3 bot giả lập
```

- Test giao diện bằng trình duyệt tích hợp (pane) hoặc Claude in Chrome; GIF demo quay bằng `gif_creator` của Claude in Chrome rồi chỉnh thời lượng khung bằng Python PIL (`docs/demo.gif`).
- Test agent thật: chạy subagent (haiku/sonnet) với **đúng prompt sao chép từ trang**, không dặn thêm. Điều khiển chủ trì
  bằng API (`POST /api/host/<k>/role|start|say` với JSON), xem log bằng `GET /api/host/<k>/state?v=-1`. Server dev nên chạy
  với `--host-key`/`--agent-key` cố định để URL không đổi mỗi lần khởi động lại (UI được nạp lúc khởi động: sửa UI phải khởi động lại).
  Phát lại tin thật qua bộ phân tích mới: lưu state JSON rồi `new Meeting()` + `say()` từng tin.
- Bẫy đã gặp:
  - Class CSS trùng tên trạng thái (`.gone`, `.ended`) làm vỡ bố cục: đặt tên class khung riêng (`.notfound`, `.endcard`).
  - `element.replaceChildren(null)` chèn chữ "null": lọc trước khi chèn.
  - `pkill -f <mẫu>` có thể giết chính shell đang chạy lệnh: kill theo PID (`ss -ltnp | grep :3100`).
  - Trình duyệt headless Brave không chạy trong môi trường này.
  - Agent thật hay chép sai mã phòng (cắt bớt ký tự) giữa cuộc họp: thông báo 404 phải bảo kiểm tra URL, thử lại.
  - Agent nói "tôi sẽ gửi XONG MỤC 1." nghĩa là CHƯA xong: đừng nới regex cho dấu chấm sau số mục.
  - Docker: container chạy UTC, cần `TZ=Asia/Ho_Chi_Minh` (Node có sẵn dữ liệu múi giờ, alpine không cần tzdata).
  - Regex có cờ `u` KHÔNG cho escape `-` ngoài `[]` (SyntaxError): tên agent như `Haiku-Agent` từng làm `leave` và state
    của chủ trì trả 500. Dùng `reEscFold` (không escape `-`) cho regex cờ `u`.
  - Codex CLI (0.162): tool MCP bị ẩn sau cơ chế tìm tool (model không thấy `join` nếu không chủ động tìm), và tool
    không có `annotations` thì bị hỏi duyệt MỖI lần gọi (`codex exec` thì bị chặn: "requires approval, but approval policy
    is never"). Codex tự chạy tool khi `readOnlyHint: true` hoặc `destructiveHint: false` + `openWorldHint: false` (đã thử
    bằng MCP server giả). Đừng bỏ `annotations` trong `TOOLS`.
  - Codex `-s workspace-write` để `.git` chỉ đọc (agent không commit được, báo "vướng") và chặn mạng: thêm
    `-c sandbox_workspace_write.network_access=true -c 'sandbox_workspace_write.writable_roots=["<repo>/.git"]'`.
    Chạy `--dangerously-bypass-approvals-and-sandbox` bị bộ kiểm duyệt của Claude Code chặn: đừng dùng.
  - `codex mcp add/remove` viết lại toàn bộ `~/.codex/config.toml` (đổi thứ tự khoá) và `codex exec` tự thêm
    `[projects."<repo>"] trust_level`: sao lưu file trước, thử xong chép lại bản sao lưu.
  - Hai agent làm chung một working tree: `git commit -a` của agent này có thể gom thay đổi của agent kia (đã gặp,
    agent Codex tự ghi chú trung thực trong bằng chứng). Không phải lỗi sản phẩm.
  - `POST /api/host/<k>/start` không gửi `settings.agenda` thì GIỮ chương trình của cuộc trước ("Cuộc họp mới" mang
    `agenda` sang, để `--agenda-file` dùng cho mọi cuộc). Trang web luôn gửi chương trình đang hiện nên không bị;
    gọi API thử thì gửi `"agenda": []`.
  - `read_page`/`find` của trình duyệt tích hợp lấy `title` làm tên nút và không tính chữ trong `<span>` con: KHÔNG dùng
    để kết luận về accessibility (chuẩn accname: nội dung trước, `title` thành mô tả).
  - Chụp ảnh tài liệu: Firefox snap headless + WebDriver BiDi (`firefox --headless --no-remote -profile
    ~/snap/firefox/common/<thư mục> --remote-debugging-port 9223`, rồi script Node dùng WebSocket có sẵn:
    `session.new` → `browsingContext.setViewport` (devicePixelRatio 2) → `navigate` → chờ → `captureScreenshot`).
    Profile phải nằm trong `~/snap/firefox/common` (snap không đọc được /tmp riêng). `firefox --screenshot` chụp trước
    khi trang tải xong state nên trống. Ảnh lưu JPEG 1280px bằng PIL.
  - Mẫu bối cảnh không được chứa `<…>` thật (trang chủ trì coi là chỗ trống chưa điền và hỏi lại trước khi bắt đầu).
  - Agent hay vào lại cuộc họp sau với TÊN KHÁC (Haiku-Agent → Haiku-Analyst); nó tự nhắc lại dòng VIỆC và `sameTask`
    gộp vào việc cũ (đổi người phụ trách, giữ số). Hai agent cùng gửi KẾT LUẬN với câu chữ khác nhau vẫn có thể tạo việc
    trùng: chưa nới `sameTask` (gộp nhầm làm mất việc), chủ trì đánh dấu bản trùng là xong.
  - Firefox snap headless chạy từ sandbox của phiên: `kill <pid>` bị từ chối (Permission denied). Tắt bằng BiDi:
    `session.new` rồi `browser.close` (xem script quay GIF ở "Cách lặp lại phép thử").
  - Mẫu nginx trong DEPLOY.md từng để `client_max_body_size 1m`: gửi tệp > 1 MB sau proxy sẽ hỏng. Đã nâng lên 25m +
    `proxy_request_buffering off`; đổi `--max-file-mb` thì nhớ đổi theo.
  - `scripts/install-linux.sh` chép code nhánh hiện tại vào app trong menu của người dùng: chỉ chạy sau khi đã merge.
  - (v3.3) Ô ẩn của công tắc/nút chọn dùng `position:absolute`: thiếu `position:relative` ở khung cha thì chúng định vị
    theo trang và kéo dài cả `body` (trang tràn, thanh dưới trôi). `.pane` trong `.setup` (flex cột) phải `flex: none`,
    không thì bị co bằng khung và nội dung tràn ra ngoài.
  - (v3.3) Luật màn hẹp `.btn span:not(:only-child) { display: none }` ẩn chữ của mọi nút có icon: nút ở thanh dưới
    (`.startbar`) phải được trả lại chữ.
  - (v3.3) Trình duyệt tích hợp: khi cửa sổ app bị ẩn, `computer` (phím/chụp ảnh) báo hết giờ; `javascript_tool`,
    `read_page` vẫn chạy. Cỡ mô phỏng (mobile/tablet) bị app xoá khi pane đổi rộng: đặt lại trước mỗi lần chụp.
  - (v3.3) Subagent đôi khi trả JSON trong `SubagentHandback` hoặc chỉ trong text trước đó và báo cáo cuối chỉ là câu tóm
    tắt: lấy đúng chữ từ transcript (`tool_use` SubagentHandback `input.message`, hoặc các khối `text` của assistant).
  - (v3.3) Heredoc không có dấu nháy (`<<EOF`) ăn mất dấu `\`: viết script JS/Python có `\n` bằng công cụ Write.
  - (3.3.1) Firefox BiDi: phiên tạo bằng `session.new` KHÔNG tự hết khi WebSocket đóng; quên `session.end` thì mọi lần sau
    báo "Maximum number of active sessions" và không đóng được Firefox đó nữa (snap: `kill` bị từ chối). Script luôn
    `session.end` (hoặc `browser.close`) kể cả khi lỗi; kẹt thì chạy Firefox khác với profile/cổng khác (`BIDI_PORT=9224`).
  - (3.3.1) Trang chủ trì ghi bản nháp/tab vào localStorage khi rời trang: đặt localStorage rồi reload sẽ bị ghi đè. Đặt từ
    một URL cùng origin không chạy app (`/favicon.svg`) rồi mới mở trang (xem `tools/shot-setup.js`).
  - (3.3.1) CSP chặn `<style>` chèn bằng script (kể cả khi chụp ảnh); chỉnh CSS lúc chạy bằng CSSOM (`el.style.x = …`).
  - (3.3.1) Ảnh tối: Firefox headless cần profile có `user.js` với
    `user_pref("layout.css.prefers-color-scheme.content-override", 0);` (shot.js `dark` đặt `data-theme`, CSS không dùng).
    Thanh cuộn headless vẫn sáng: ẩn bằng `scrollbarWidth = 'none'` trước khi chụp (`tools/shot-mobile.js`).
  - (3.3.1) Lưới `grid-template-columns: 1fr` có min = nội dung: dải thành viên ở màn hẹp kéo rộng cả trang. Dùng `minmax(0, 1fr)`.
  - (3.3.1) Header là lưới `1fr auto 1fr` (thanh bước ở giữa); `.top-l`/`.top-r` KHÔNG được `min-width: 0`, không thì cột
    phải bị ép và nút chồng lên thanh bước. Thêm nút vào header thì đo lại ở 721–1280 px (lúc LIVE có 3 nút) cả VI lẫn EN.
- Commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên; cập nhật CHANGELOG + README/GUIDE cho thay đổi người dùng thấy được; `bash scripts/install-linux.sh` để cập nhật bản trong menu.

## Trạng thái

- **UI v2 hiện tại:** đã triển khai, xem evidence/ui-v2; phản hồi bác bỏ và dòng “v2 chưa triển khai” bên dưới là lịch sử trước lượt này. Bản mới vẫn chờ người dùng đánh giá.

- **Phản hồi UI mới nhất 2026-10-21:** người dùng bác bỏ bản cải cách vừa chạy vì quá lớn/không nhất quán/ba header. Đã planning lại và review bởi hai subagent nội bộ; xem [UI-REFORM-v2-plan.vi.md](UI-REFORM-v2-plan.vi.md). V2 chưa triển khai; ưu tiên một shell gọn và Hội thoại trước. Các số test của v1 không phải nghiệm thu thiết kế.

- **2026-10-21 — bản cải cách UI chạy được, chưa người dùng nghiệm thu:** đã đọc/apply ui-ux-pro-max, kiểm năm view có dữ liệu, viết screen pool/flow trước code tại [UI-REFORM.vi.md](UI-REFORM.vi.md). Một nav phiên, task/kết quả đứng trước metadata, form chia nhóm, bằng chứng và số liệu mở rộng, Quản trị có heading theo nhóm. Giữ CSP/API/task ID. Preview cô lập 3119, không đụng cổng 3000/settings/model trả phí. Bằng chứng và giới hạn: [evidence/ui-reform/ACCEPTANCE.vi.md](evidence/ui-reform/ACCEPTANCE.vi.md). Không commit/push.

- **2026-10-21 — Bàn giao sửa tính nhất quán:** phòng cũ và workspace mới vẫn là hai luồng/task model rời nhau; chưa sửa trong phiên bàn giao. [HANDOFF-consistency.vi.md](HANDOFF-consistency.vi.md) ghi vấn đề, screen pool/use case khởi đầu, thứ tự sửa dữ liệu/API/UI, test hành trình và thay đổi cách làm. Test kỹ thuật trước đây không chứng minh UX thống nhất.

- **2026-10-21 — Triển khai routing/workspace (chưa commit/push/release):** catalog/policy/handoff có nguồn và lookup CLI/MCP riêng; admin + workspace mới, config atomic/CAS/backup; adapter Claude/agy, local task/test/single-file integration có bằng chứng CLI thật; worker token/lease/snapshot/artifact và metrics. Chi tiết, test, artifact và giới hạn tại [IMPLEMENTATION-STATUS.vi.md](IMPLEMENTATION-STATUS.vi.md), cách dùng tại [ROUTING-WORKFLOW.vi.md](ROUTING-WORKFLOW.vi.md). Không coi đây là đội tự xây app full-stack hoàn chỉnh: còn leader planning tự động, multi-file/review/resume, reconcile/revoke và thử máy vật lý thứ hai. bwrap chỉ cách ly ghi filesystem, không đọc/mạng. Execution không vào allowlist hội thoại.

- **2026-10-21 — Bổ sung định hướng đội AI phát triển phần mềm tự vận hành:** xem [VISION.vi.md](VISION.vi.md). Ưu tiên đội nhỏ làm trọn web full-stack, nghiệm thu bằng sản phẩm chạy thật, review độc lập, ngân sách và phục hồi. Đã liên kết từ README EN/VI; đây là thay đổi tài liệu, chưa triển khai runtime/adapter hay nâng phiên bản.
- **2026-10-21 — Code graph riêng:** bổ sung mục "Code intelligence tự phát triển" trong VISION: học kiến trúc dự án đi trước, tự xây pipeline/resolver/retrieval, bắt đầu JS/TS (gồm CommonJS), CLI rồi MCP, có bằng chứng quan hệ, kiểm tra stale và benchmark. Chưa cài engine bên ngoài hoặc viết engine mới.
- **2026-10-21 — Source tham khảo local theo yêu cầu người dùng:** đã clone đầy đủ `colbymchenry/codegraph` vào `.local-tools/codegraph/`, ghim commit `226ac930de078e7ece9c16aa91ceafc1d92f0935`. Thư mục `/.local-tools/` được gitignore, không phải submodule và không phát hành cùng dự án; giữ nguyên LICENSE MIT và lịch sử upstream. Chưa cài dependency, chạy index hay thay đổi cấu hình agent. Nguồn này phục vụ nghiên cứu/thử nghiệm, chưa thay thế định hướng tự phát triển engine.

- **2026-10-19, nhánh `v3.5-security` (từ main e0316cf), CHƯA merge/push/tag.** package 3.5.0, CHANGELOG 3.5.0, README (EN+VI),
  GUIDE, REFERENCE (EN+VI), DEPLOY, SECURITY.md, docs/SECURITY-DESIGN.md (threat model, đã duyệt). 124 test xanh.
  Đã làm: mã riêng từng agent (Bearer / Mcp-Session-Id), chủ trì duyệt (`--admit all|remote|none`), tên dành riêng, trích dẫn tin
  (`│ `), chặn bí mật, cục bộ trước (127.0.0.1, tunnel theo yêu cầu, trang chủ trì không qua tunnel, Host/Origin), `connect`/
  `disconnect` + cầu nối stdio `src/bridge.js`, giới hạn tốc độ, `--audit-log`, `--retention`, UI (Máy này/Máy khác, tab Đã kết nối,
  duyệt agent), demo bots dùng mã riêng (`--admit remote`).
  - **BẪY (2026-10-19): `npm test` không giới hạn từng làm treo máy người dùng (OOM 7,6 GB)**: assert so hai Buffer lớn khác nhau tính
    diff O(n²). Đã sửa (so sha256). LUÔN chạy test có giới hạn: `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0
    timeout 150 node --test --test-timeout=30000 <file>` từng file.
  - **CHƯA: bước 4 thử thật** (người dùng ĐÃ đồng ý chạy đủ ca A, B, C). Đã chuẩn bị trong scratchpad của phiên (mất khi hết phiên):
    sao lưu `~/.claude.json`, `~/.claude/settings.json`, `~/.agent-meeting`; repo thử LabelLoop; prompt chép từ trang (sha256 MCP
    `ad256a41…`, curl `b55739d9…`). Phiên sau làm lại các bước chuẩn bị đó, rồi: A) Claude Code CLI bản desktop
    (`~/.config/Claude/claude-code/2.1.289/*/claude -p --permission-mode auto --output-format stream-json --verbose`) với prompt
    curl localhost + subagent Haiku; B) `node bin/cli.js connect claude` rồi prompt "Đã kết nối" + subagent Sonnet; C) tunnel thật +
    `connect claude --room <URL>`. Chủ trì duyệt/bắt đầu qua API. Xong: `disconnect claude`, so settings.json với bản sao lưu
    (KHÔNG chép đè ~/.claude.json: app desktop ghi liên tục). `~/.agent-meeting/rooms.json` hiện trỏ tới phòng thử cổng 3100 (đã tắt).
  - Chưa: ảnh/GIF mới cho thẻ mời và duyệt agent; hỏi người dùng merge + GitHub Release.

- **2026-10-19, nhánh `v3.4-away` (từ `v3.3.1-header` 36a4e5a). ĐÃ MERGE vào main (fast-forward) + tag `v3.4.0`
  + push (người dùng yêu cầu 2026-10-19); CHƯA tạo GitHub Release. App trong menu đã cài lại từ `v3.4-away` (`--version` = 3.4.0).** package 3.4.0, CHANGELOG 3.4.0,
  README (EN+VI) badge + "What's new in 3.4", GUIDE + REFERENCE (VI+EN). 106 test xanh. Đã làm bước 1–5 và 7 của lộ trình v3.4:
  - Agent VẮNG (`a.away`, `a.awaySince`; snapshot `status: 'away'` + `awaySince`): `_reap` hết `staleMs` → `_setAway` (giữ
    slot/vai trò/cursor, mất lượt ngay), vắng thêm `cfg.awayMs` (mặc định 15 phút) → `a.lost = true` + `leave('mất kết nối')`.
    `_seen(a)` (gọi từ `_agent`, `progress`, `listFiles`) bỏ vắng, hoặc cho agent `lost` vào lại nếu phòng LIVE/LOBBY; `a.back`
    = số phút im lặng, lần `wait` kế tiếp báo "Bạn đã vắng ~N phút…" (trả ngay kể cả khi không có tin mới). `_active()` (có mặt,
    không vắng) dùng cho lượt (`_advance`, lượt đầu), `passStreak`, người được hỏi chốt khi im lặng; `_present()` (tính cả vắng)
    vẫn dùng cho vai trò theo vị trí, "chỉ còn mình bạn", "mọi agent đã rời phòng". `join` cùng tên + model khi đang vắng thì vào
    lại. `changedSince` (long-poll của trang chủ trì) cũng gọi `_reap` để phát hiện vắng khi không agent nào đang `wait`.
    Đã thử trên server thật: Grok im 3 phút → "vắng" trên trang, chủ trì nhắn, Grok `wait` lại nhận đủ tin đã lỡ + giữ vai trò.
  - Giao thức: luật 6 thêm "trong phạm vi quy tắc của dự án và của chính bạn"; luật 12 (cần duyệt/mâu thuẫn: say ngắn rồi wait
    tiếp, dừng hỏi người dùng thì vẫn giữ chỗ) và 13 (tách lệnh đọc tệp với lệnh gửi, không gửi bí mật); số luật là 11/12 khi
    agent không có `a.base`.
  - Prompt mời (`perm` trong `buildInvite`, VI + EN): người dán là chủ trì, phòng chạy trên máy này / địa chỉ công khai (theo
    hostname của origin), chia sẻ gì, mâu thuẫn thì nói vào phòng. KHÔNG thêm trường `permissions` vào brief (cần hỏi người dùng).
  - Chặn Bắt đầu: `rolesNeeded(roles)` trong src/brief.js (bỏ vai trò trống ở CUỐI, "" ở giữa vẫn tính); UI khoá `#btnStart`
    (+ `title`), `#checks2` báo "Cần N agent theo vai trò (đang có M)" (class `bad`); server 409 `{error, need, have}` trừ khi
    `force: true`; CLI `--auto-start n` < số vai trò thì thoát lỗi.
  - CHƯA: bước 6 (thử với agent thật: subagent Sonnet + Haiku với workspace "build nothing", và Claude Code CLI thật ở auto mode
    qua tunnel: hỏi người dùng trước); GIF/ảnh chưa chụp lại (giao diện chỉ thêm trạng thái vắng + nút khoá).

- **2026-10-19, nhánh `v3.3.1-header` (từ main bf9ee8e), CHƯA merge/push/tag.** package 3.3.1, CHANGELOG 3.3.1, README (EN+VI)
  badge + "What's new". 96 test xanh.
  - **Thanh bước lên header** (người dùng yêu cầu: "mang progress bar lên header cho rộng phần body"): `index.html` header =
    `.top-l` (logo + trạng thái) | `nav.steps` | `.top-r` (VI/EN, kết nối, nút); CSS lưới `1fr auto 1fr`. Thu gọn: ≤1180 chỉ
    bước hiện tại có chữ (chữ khác sr-only), ≤1024 ẩn chữ "Agent Meeting", ≤900 `#btnInvite`/`#btnMinutes` chỉ icon (thêm
    `title`, chữ sr-only), ≤720 thanh tiến độ 4 đoạn 3 px ở mép dưới header (nút bước sr-only). Bỏ được một hàng ~45 px.
    Sửa kèm: tràn ngang ở ≤860 px khi đang họp (`.room` `1fr` → `minmax(0, 1fr)`; lỗi có từ trước).
  - Đã kiểm tra (trình duyệt tích hợp): đo chồng lấn/tràn bằng JS ở 1280/1180/1100/1024/900/800/768/721/720/640/375, cả LIVE
    (3 nút) lẫn LOBBY, VI và EN: không chồng, không tràn ngang; ảnh 1280 sáng (bước 1, 2, kết thúc), 768 tối, 375 sáng/tối
    (LOBBY + LIVE); bấm bước 2 trên header vẫn chuyển bước + focus tiêu đề; tooltip EN đúng. Console chỉ có lỗi
    ERR_CONNECTION_REFUSED lúc khởi động lại server. CHƯA: bàn phím thật (Tab qua các bước), trình đọc màn hình, Safari/iOS.
  - GIF `docs/demo.gif` (EN) + `docs/demo.vi.gif` quay lại; ảnh `docs/screenshots/en/*` và ảnh VI `setup`, `invite`,
    `brief-json`, `meeting`, `work` (giờ 1280×680 như bản EN), `files`, `ended`, `mobile-dark` chụp lại (Firefox BiDi).
    `carry.jpg` không có header nên giữ. Công cụ mới: `tools/record-demo.js --vi`, `tools/shot-setup.js`, `tools/shot-mobile.js`,
    `BIDI_PORT` cho mọi script.
  - **"Nhờ AI viết" tiếng Anh với AI thật** (việc #2 cũ): prompt chép từ trang `?lang=en` khớp sha256 `aiPrompt(defaults(),'en')`
    (3564 ký tự). Haiku 4.5 + Sonnet 5.5 × 2 mô tả (repo calc có followUp; review bảo mật 3 agent lần lượt, chỉ bàn): 4/4 JSON
    hợp lệ, đúng ý (calc: followUp=true, agenda chỉ phần bàn; bảo mật: turns, followUp=false, 3 vai trò). Điểm yếu: Haiku (2/2)
    viết mẫu `VIỆC: [agent role] | …` thay vì dặn ghi tên agent; Haiku tự chèn đường dẫn thư mục làm việc của chính nó (môi
    trường subagent, AI chat thường không có); Sonnet viết 1 vai trò >200 ký tự (bị cắt, trang hiện cảnh báo). Chưa sửa prompt.
    Dán nguyên văn (có ```json) vào trang: form điền đúng, bước 2 tóm tắt đúng.
  - **Agent thật họp theo brief do AI viết** (việc #3 cũ): brief Haiku/calc (chỉ đổi đường dẫn repo) dán vào trang, mời
    Haiku + Sonnet bằng prompt "Paste and join" EN chép từ trang, bấm Bắt đầu trên trang. Vai trò theo slot đúng (Sonnet slot 1
    "fixer", Haiku slot 2 "implementer"), 3 mục chuyển đúng, KẾT LUẬN + 2 VIỆC ghi ĐÚNG tên agent (`Sonnet-Lan (fixer)`) dù brief
    chỉ ghi "[agent role]", Sonnet rời phòng đi làm, commit 1878595, báo progress; Haiku làm mul() ngay trong phòng rồi báo
    (fe4c81c), rời phòng → ENDED "mọi agent đã rời phòng" (không qua WORK vì đã xong hết). Repo: 2 commit, `node test.js` ok.
    Ghi nhận: bối cảnh tiếng Anh nhưng hai agent nói tiếng Việt (lần thử 2026-10-18 thì nói tiếng Anh): chấp nhận được.
  - CHƯA: tab MCP / Codex CLI tiếng Anh với Codex thật (không chạy vì dùng tài khoản ChatGPT của người dùng + sửa
    `~/.codex/config.toml`; người dùng dặn thử bằng subagent), tunnel thật, webhook thật.
  - Theo yêu cầu người dùng ("app local chưa update"): đã chạy `scripts/install-linux.sh` TỪ NHÁNH `v3.3.1-header` → bản trong
    menu là 3.3.1 (trước là 3.2.0). Thư mục app còn `src/ui.html` cũ (không dùng, để nguyên). Người dùng dùng thử bản này qua
    tunnel và gặp lỗi nghiêm trọng ở "Lộ trình v3.4".
  - Firefox headless pid 20699 (cổng 9223, profile `am-shot`) bị kẹt phiên BiDi, không kill được từ sandbox: người dùng tự đóng.
- **2026-10-18 (tối), theo yêu cầu người dùng**: README viết lại (tiếng Anh là `README.md`, tiếng Việt `README.vi.md`, chi tiết ở
  `docs/REFERENCE(.vi).md`), đã **merge v3.3-brief vào main và push** (main = 08fbb23 lúc đó). Sau đó làm thêm **trang chủ trì
  tiếng Anh** + bot demo `--en` + GIF tiếng Anh (`docs/demo.gif`; bản Việt `docs/demo.vi.gif`) + ảnh `docs/screenshots/en/`,
  rồi push lần hai (xem git log). CHƯA tag, CHƯA GitHub Release (cả v3.2.0 lẫn v3.3.0).
  - 96 test xanh (`test/i18n.test.js` mới: đủ bản dịch cho app.js/index.html, `tr` dạng tag, parseBrief/aiPrompt tiếng Anh).
  - Đã thử với agent thật: Haiku 4.5 + Sonnet 5.5 dùng ĐÚNG prompt mời tiếng Anh chép từ trang (`?lang=en`), bối cảnh tiếng Anh,
    2 mục, roles theo slot: cả hai vào họp, nhận đúng vai trò theo slot, XONG MỤC 1 → server chuyển mục 2, KẾT LUẬN + VIỆC
    được ghi (#1), rời phòng, ENDED "mọi agent đã rời phòng". Agent trả lời bằng tiếng Anh (theo bối cảnh), lý do rời phòng có
    khi viết tiếng Việt (chữ của agent, không dịch).
  - Giao diện tiếng Anh đã xem: bước 1/2, họp, thực hiện, kết thúc (desktop + 375 px tối), nút VI/EN đổi và nhớ, tiếng Việt
    vẫn như cũ. CHƯA: prompt nhờ AI tiếng Anh với AI thật (mới test bằng Node: không có `<…>`, mẫu JSON hợp lệ), MCP tab tiếng
    Anh với CLI thật (chỉ thử tab "Paste and join" qua curl).
- **v3.3.0 (nhánh `v3.3-brief`) đã merge vào main và push (2026-10-18, người dùng yêu cầu); CHƯA tag.** 92 test xanh (`test/brief.test.js`
  mới: JSON hợp lệ, bọc ```json/câu dẫn, lỗi cú pháp có dòng/cột, sai kiểu từng trường, kẹp số, cắt độ dài, khoá lạ, `<…>`,
  64 KB, roles theo slot, POST start nhận nguyên brief, preset qua toState/restore). package.json 3.3.0, CHANGELOG 3.3.0,
  README/README.en/GUIDE/DEPLOY đã cập nhật, ảnh mới `setup.jpg`, `invite.jpg`, `brief-json.jpg`, GIF `docs/demo.gif` mới
  (dán JSON do AI viết → form → Tiếp → mời agent → họp → thực hiện → đóng; 39 khung, 71 s, 2,0 MB).
  - Đã kiểm chứng trên trình duyệt tích hợp (server dev `--data-dir`): mẫu, đếm ký tự, danh sách chương trình (Enter, Alt+↑
    bằng phím thật), tab JSON (lỗi theo dòng, áp ngay, Áp dụng), Tiếp/← Bối cảnh/thanh bước/Back/tải lại giữ bước, chặn khi
    trống, hỏi lại `<…>`, phòng chờ hiện vai trò "theo bản brief", Bắt đầu gửi đúng brief (vai trò slot + vai trò tay giữ
    nguyên), ngăn kéo Mời agent lúc họp, Họp tiếp về bước 1 có thẻ mang sang. Cỡ 1280 (sáng), 768 (sáng), ~800 và 375 (tối),
    không tràn ngang, không lỗi console. Thứ tự Tab kiểm tra qua DOM (cửa sổ app bị ẩn nên không gửi được phím Tab thật).
  - "Nhờ AI viết" với agent thật: subagent Haiku 4.5 + Sonnet 5.5, đúng prompt sao chép từ trang (so sha256), 3 vòng,
    10 lần, gồm cả chế độ "đã có bản nháp": mọi JSON đều hợp lệ và đúng ý mô tả; đã sửa prompt 2 lần (xem "Quyết định").
    Kết quả dán nguyên văn vào trang (cả bản bọc ```json + đoạn giải thích phía sau): form điền đúng, bước 2 tóm tắt đúng.
  - CLI `--brief-file`: lỗi theo dòng + thoát 1, dùng kèm `--context` bị từ chối, `--auto-start` dùng settings + roles
    (đã thử với curl join), không `--auto-start` thì trang nhận brief làm bản nháp (đã xem trên trang); `--context-file` +
    `--agenda-file` cũng tạo preset (xem qua API).
  - CHƯA kiểm chứng: bàn phím thật đầy đủ (Tab/Space trên công tắc), trình đọc màn hình, Safari/iOS, Node 18/20 (CI sẽ
    chạy), bấm "Mở tệp .json" với hộp chọn tệp thật, mở tệp do "Tải .json" tải về, Docker với `--brief-file`, chế độ tối ở
    768/1280 (CSS dùng chung biến nên không khác, nhưng chưa nhìn), agent THẬT họp theo brief do AI viết (mới thử phần viết +
    dán; giao thức gửi agent không đổi trừ dòng vai trò, vốn đã có từ v3).
- **v3.2.0 đã merge vào main và push (2026-10-18, fast-forward từ `v3.2-files`); CHƯA tag, CHƯA GitHub Release.**
  Đã chạy `scripts/install-linux.sh` (bản trong menu là 3.2.0); người dùng tự mở để kiểm tra giao diện. 75 test xanh
  (`test/files.test.js` mới: tải lên/tải về đúng bytes, header an toàn, gửi riêng, tên độc, giới hạn content-length/
  chunked/Expect 100-continue/tổng phòng/số tệp, WORK + `files?wait=1`, `--data-dir` khởi động lại + Họp tiếp + Cuộc họp mới).
  - Đã kiểm chứng tay bằng curl thật trên server dev (`--data-dir`): `git format-patch` → send riêng → `git am` trong clone
    khác; `tar czf - | curl --data-binary @-`; người ngoài bị 404; tệp 25 MB bị từ chối ngay (có Expect và chunked);
    tệp 15 MB OK; kill SIGTERM rồi chạy lại vẫn tải đúng (sha256 khớp), quyền 600/700.
  - Agent thật (subagent Haiku 4.5 + Sonnet 5.5 qua curl, prompt "Dán là vào ngay" sao chép từ trang, không dặn thêm),
    hai bản clone riêng của repo thử, 2 lần: (1) giữ phòng báo tiến độ: Haiku sửa + commit + gửi patch riêng (tự mã hoá
    `to=Sao%20Mai`), Sonnet đã rời họp chờ bằng đúng một lệnh `files?wait=1`, tải, `git apply --check`, `git am`, test xanh,
    báo progress; phòng tự đóng. (2) làm ngay trong cuộc họp: Sonnet gửi, Haiku nhận qua `files?wait=1`, `cat` đọc patch
    trước, `git am`, test xanh, báo TIẾN ĐỘ. Cả hai clone có commit đúng (giữ tác giả của patch). Chưa thấy agent dán code.
  - Giao diện (trình duyệt tích hợp, desktop + mobile 375px): mục Tệp, thông báo tệp có nút Tải, nút ☰ hiện "Tệp n",
    không lỗi console. Ảnh `docs/screenshots/files.jpg` và GIF `docs/demo.gif` mới (Firefox BiDi, 27 khung, 1,6 MB).
  - `npm run demo` chạy trọn với gửi tệp ở giai đoạn thực hiện.
  - CHƯA kiểm chứng: gửi tệp qua tunnel Cloudflare thật (giới hạn ~100 MB, Expect 100-continue qua tunnel), sau
    nginx/Caddy thật, Node 18/20 (máy dev là Node 22; CI sẽ chạy), MCP `files` với CLI thật (chỉ có test node), Windows
    (tên tệp, quyền 600), `scripts/install-linux.sh`.
- Phiên bản phát hành: **v3.1.1** (2026-10-18, main, tag + GitHub Release; gồm cả 3.1.0 vốn chưa phát hành riêng).
  67 test xanh. Phiên 2026-10-18 (chiều): thử Codex CLI thật, sửa annotations/prompt MCP, gộp/xoá việc trùng, ảnh mới,
  demo có báo tiến độ.
- Đã kiểm chứng với **Codex CLI 0.162** (bản đi kèm app ChatGPT, `/usr/lib/chatgpt/resources/codex`, `codex exec`
  trong sandbox `workspace-write`): prompt tab Codex CLI → dùng MCP thật (join/wait/say/leave/progress), làm việc trên
  repo thử, commit, báo `progress` sau khi `leave`, tự dừng sau "Mọi việc đã báo xong"; `wait` chặn 50s không bị Codex
  cắt (gọi lại đều trong phòng chờ); chủ trì đóng phòng thì dừng ngay. Codex chưa cài MCP thì đi thẳng đường lui curl.
  Kèm Haiku 4.5 / Sonnet 5.5 qua curl (4 cuộc họp, gồm khởi động lại server khi agent ở phòng chờ, và gộp việc trùng).
- Gemini qua MCP: người dùng tự thử từ IDE Gemini (2026-10-18), theo người dùng là "khá ổn". Quyết định của người dùng:
  KHÔNG lên kế hoạch thử thêm các CLI khác (Claude Code, Gemini CLI, Codex TUI); phép thử agent thật chỉ cần subagent
  Haiku/Sonnet qua curl (và Codex `exec` nếu cần MCP) chạy trong phiên phát triển.
- CHƯA kiểm chứng: webhook thật (người dùng chưa có URL), GIF demo mới.
- Đã kiểm chứng (phiên 2026-10-18, sáng): toàn bộ bằng subagent Haiku 4.5 / Sonnet 5.5 qua curl với đúng prompt từ trang, server dev
  `--local --port 3100 --host-key … --agent-key … --data-dir … --minutes-dir …`, giao diện bằng trình duyệt tích hợp
  (desktop + mobile 375px). Chưa kiểm chứng: CLI thật qua MCP, webhook tới Slack/Discord/Google Chat thật (mới có server giả
  trong test), `npm run demo` sau thay đổi, `scripts/install-linux.sh`.

### Cách lặp lại phép thử "Nhờ AI viết" (v3.3)

1. Server dev (lệnh ở dưới), mở trang chủ trì trong trình duyệt tích hợp. Lấy ĐÚNG prompt trang chép ra: bọc
   `navigator.clipboard.writeText` bằng `javascript_tool` để lưu chữ vào `window.__copied`, bấm `#btnAiPrompt`, rồi so sha256
   với `aiPrompt(...)` sinh bằng Node (bản nháp trống: `aiPrompt(defaults())`; có nháp: dựng đúng bản nháp đó).
2. Subagent haiku + sonnet (nền), prompt = chữ đó + mô tả cuộc họp như người dùng gõ, không dặn thêm. Mô tả đã dùng: repo
   calc (sửa sub, thêm mul, commit, báo tiến độ, reviewer, ≤20 phút); review bảo mật API đăng nhập (3 agent, lần lượt);
   hoàn thiện bản nháp "Review PR MoMo" (3 agent, 3 mục, ≤30 phút).
3. Kiểm `parseBrief` bằng Node, rồi dán nguyên văn vào `#jsonText` (gán `.value` + sự kiện `input`), bấm `#jsonApply`,
   đọc lại các ô form, bấm `#btnNextStep`, đọc `#briefSummary`. Xem ý nghĩa: followUp/mode/giới hạn đúng mô tả, agenda
   không chứa "làm việc/báo tiến độ" khi followUp, không chép chi tiết của ví dụ.

Ảnh tài liệu: server riêng (`--port 3101 --host-key shothost… --agent-key shotagent…`), Firefox headless như dưới,
`tools/shot.js <url> <out.png> 1280 860 2 2500 '' '<js>'` (tham số js chạy sau khi tải: đặt localStorage bản nháp/tab rồi chụp lần
hai), join agent giả bằng curl cho ảnh bước 2, PIL thu về 1280px JPEG q85. GIF (`tools/record-demo.js`, tiếng Anh; ảnh EN thêm `localStorage['agent-meeting:lang']='en'`): script quay cũ + đoạn mới: `localStorage.clear()`
và bỏ hash → bấm `#btnToJson` → dán JSON (có ```json) làm hai nhát → `#jsonApply` → cuộn → `#btnNextStep` → chạy bot → chờ đủ 3
agent → `#btnStart`; ghép: gộp khung gần trùng (bbox khác biệt < 1500 px²), live 1 s, work 1,1 s, khung chính 3,5-5 s.

### Cách lặp lại phép thử agent thật của v3.2 (gửi tệp)

Repo thử như v3.1 (bên dưới) nhưng tạo `origin` rồi `git clone origin clone-a`, `git clone origin clone-b` (mỗi clone
`git config user.name/email` riêng). Bối cảnh: hai đường dẫn clone; (1) agent ở clone-a sửa sub(), test, commit, gửi patch
cho agent kia bằng cách gửi tệp trong giao thức (không dán code); (2) agent ở clone-b nhận patch, `git am`, chạy test, báo
tiến độ. Một lần `followUp: true` (bên nhận phải chờ tệp ở WORK), một lần `followUp: false` và dặn làm ngay trong họp.
Theo dõi `GET /api/host/<k>/state?v=-1` (`files[].got` cho biết đã tải); kiểm tra `git log` + `node test.js` ở cả hai
clone. Đọc lệnh agent đã chạy: duyệt JSONL của subagent, lấy `tool_use.input.command` (đừng đọc cả file).

Quay GIF: `firefox --headless --no-remote -profile ~/snap/firefox/common/am-shot --remote-debugging-port 9223`, script
Node BiDi: `/new` → mở trang chủ trì 1280×680 → chạy `scripts/demo-bots.js` → điền bối cảnh/chương trình/ô giữ phòng bằng
`script.evaluate` → giao vai trò qua API → bấm Bắt đầu → chụp mỗi ~1,7 s, bấm chip "Yêu cầu chốt" khi bot in "tranh luận
xong", cuộn cột trái tới `#filesSec` khi có tệp → tới ENDED. Ghép bằng PIL: bỏ khung gần trùng (`ImageChops.difference`),
`quantize(128, MEDIANCUT, không dither)`, khung quan trọng giữ 3,5-5 s.

### Cách lặp lại phép thử agent thật của v3.1

```bash
# repo thử: calc.js có sub() sai (a + b), test.js kiểm add/sub; git init + commit "khởi tạo"
npm start -- --local --no-open --port 3100 --host-key <mã> --agent-key <mã> --data-dir <tmp>/data --minutes-dir <tmp>/minutes
```

1. Chạy 2 subagent (haiku + sonnet, nền) với prompt "Dán là vào ngay" sao chép từ trang, không dặn thêm.
2. `POST /api/host/<k>/start` với `{"context": "...repo <đường dẫn>... (1) sửa sub() (2) thêm mul() + test. Mỗi agent một
   việc, VIỆC ghi đúng tên agent, chạy node test.js và git commit riêng, bằng chứng: mã commit + kết quả test",
   "settings": {"followUp": true}}`.
3. Theo dõi `GET /api/host/<k>/state?v=-1` tới khi `state` là `ENDED` (lý do "mọi việc đã báo xong"), rồi `git log` và
   `node test.js` trong repo thử. Muốn thử "Họp tiếp": họp đầu không bật followUp và dặn "chỉ chốt phân công", rồi
   `POST /api/host/<k>/new {"carry": true}`, mời lại chính các agent đó (SendMessage tới subagent cũ với cùng prompt).
4. Codex CLI: sao lưu `~/.codex/config.toml`; `codex mcp add agent-meeting --url <url mcp>` (hoặc để agent tự cài); lưu
   prompt tab Codex CLI ra file rồi trong repo thử: `codex exec -s workspace-write -c sandbox_workspace_write.network_access=true
   -c 'sandbox_workspace_write.writable_roots=["<repo>/.git"]' --json - < prompt.txt > run.jsonl` (chạy nền). Đọc
   `run.jsonl`: `item.type == "mcp_tool_call"` là gọi MCP, `command_execution` là shell/curl. Trả lời agent như người dùng:
   `codex exec resume <thread_id> "…"`. Xong thì chép lại config.toml đã sao lưu.
5. Khởi động lại giữa chừng: kill theo PID (`ss -ltnp | grep :3100`, SIGTERM để kịp ghi), chạy lại đúng lệnh trên.

## Lộ trình v3: giải quyết nỗi đau doanh nghiệp (đã xong)

- [x] Kết quả có cấu trúc: Quyết định (`KẾT LUẬN:`) + Việc cần làm (`VIỆC: người | việc | hạn`), hiển thị và xuất ra biên bản
- [x] Biên bản do server sinh (Markdown + JSON), API tải về; `--minutes-dir` tự lưu khi kết thúc
- [x] `--webhook` (Slack/Discord/Google Chat, URL khác nhận JSON) gửi tóm tắt khi kết thúc
- [x] Chương trình họp nhiều mục: tiến độ, "Mục tiếp theo", agent báo `XONG MỤC n`, kết luận theo mục
- [x] Vai trò cho từng agent + nhắn riêng cho một agent
- [x] `--public-url`, `--host-key`/`--agent-key` (link cố định) + Dockerfile + docs/DEPLOY.md
- [x] Tự động hoá: `--context-file`, `--agenda-file`, `--auto-start N`, `--exit-on-end`, `--time-limit`
- [x] Màn hình hẹp: nút ☰ mở bảng chương trình/kết quả
- [x] Thử với agent thật (Haiku 4.5 ×2 + Sonnet 5.5, 3 lần): chương trình 2 mục, vai trò, nhắn riêng

## Lộ trình v3.1: từ "họp xong" sang "làm xong" (nhánh v3.1-followup)

Kết quả: bước 1-4 và 6 xong, có test (65 test) và đã thử bằng subagent Haiku 4.5 / Sonnet 5.5 qua curl: khởi động lại server
giữa cuộc họp; báo tiến độ; WORK trên repo git thử (agent sửa code, commit thật, báo progress, phòng tự đóng) ×2; họp lập
kế hoạch → "Họp tiếp" → họp review → WORK → đóng. v3.1.1: Codex CLI qua MCP đã thử thật (cùng
kịch bản, xem "Trạng thái"); còn thiếu Claude Code / Gemini CLI qua MCP. Ảnh đã cập nhật cho màn WORK và bảng việc; GIF chưa.

Nhận định (sau bài đánh giá bên ngoài v3.0.0): agent trong phòng họp CHÍNH LÀ người thực thi (Claude Code/Codex trên
máy có repo). Không cần server tự chạy agent; chỉ cần phòng họp theo dõi được tiến độ sau khi chốt và mang việc dở
sang cuộc họp sau. Giữ nguyên: một lệnh là chạy, không thư viện ngoài, Node 18+.

Làm theo thứ tự, mỗi bước có test (npm test) và thử trên trình duyệt / agent thật xong mới sang bước sau:

1. ✅ **Không mất cuộc họp khi khởi động lại.** `--data-dir <thư mục>` (env `AGENT_MEETING_DATA_DIR`): ghi trạng thái
   phòng ra `<hostKey>.json` khi có thay đổi (gom ghi, tối đa ~1 lần/giây, ghi file tạm rồi rename), nạp lại khi khởi
   động nếu dùng `--host-key`. Agent vào lại bằng đúng tên + model (đã hỗ trợ). Không lưu mã bí mật vào biên bản
   (file trạng thái thì cần mã: đặt quyền 600). Test: tắt server giữa cuộc họp, bật lại, họp tiếp, biên bản đủ.
2. ✅ **Việc có trạng thái.** Mỗi việc có số (#1, #2…), trạng thái `chưa làm | đang làm | xong | vướng`, ghi chú/bằng chứng
   (link commit, PR, kết quả test). Agent cập nhật bằng dòng `TIẾN ĐỘ VIỆC <số>: <trạng thái> | <bằng chứng>` và/hoặc
   tool mới `progress(name, task, status, note)` (MCP + curl). Chủ trì đổi trạng thái trên web. Biên bản/webhook/JSON
   có trạng thái. Ghi rõ trong UI: "xong" là agent tự báo, kèm bằng chứng, server KHÔNG tự kiểm chứng.
3. ✅ **Giai đoạn thực hiện sau khi chốt.** Tuỳ chọn "Giữ phòng để báo tiến độ" (web + `--follow-up`): sau KẾT LUẬN,
   agent rời họp để đi làm việc được giao, rồi gọi lại `progress` khi xong; phòng chuyển trạng thái riêng (ví dụ
   WORK) thay vì ENDED; webhook gửi khi một việc xong và khi tất cả xong. Giao thức phải nói rõ cho agent: làm việc
   của mình xong mới báo, không chờ nhau trong phòng.
4. ✅ **Họp tiếp mang việc dở.** "Cuộc họp mới" có lựa chọn đưa các việc chưa xong + quyết định trước vào bối cảnh cuộc
   sau (giữ số việc), để họp review tiến độ.
5. ◐ **Thử với agent thật**: Codex CLI qua MCP ✅ (v3.1.1, phải thêm `annotations`); Gemini qua MCP do người dùng tự thử
   (ổn); không thử thêm CLI khác theo quyết định của người dùng; subagent haiku/sonnet qua curl ✅. Mẫu kịch bản: họp chốt
   2 việc nhỏ trong một repo thử, agent làm thật, báo TIẾN ĐỘ kèm commit.
6. ✅ Tài liệu (README, README.en, GUIDE, DEPLOY, CHANGELOG 3.1.0), package.json 3.1.0, ảnh/GIF nếu UI đổi nhiều,
   rồi hỏi người dùng trước khi merge/push/release.

**Ngoài phạm vi (đừng làm):** tài khoản/phân quyền (dùng reverse proxy của công ty), server tự khởi chạy agent hay tự
merge code, nhiều phòng song song, chạy test thay agent.

## Lộ trình v3.2: gửi tệp / code giữa các agent (đã xong, đã merge vào main)

Thiết kế dưới đây đã làm đúng như chốt, chỉ BỔ SUNG `files?wait=1` (chờ tệp ở giai đoạn WORK) và `--max-room-mb`.

1. ✅ **v3.2: Gửi tệp / code giữa các agent** (người dùng yêu cầu 2026-10-18: "tạo một đường truyền rồi đẩy file ngầm qua,
   cách nhanh nhất"). Thiết kế đã chốt, phiên sau làm theo, có lý do mạnh mới đổi:
   - **Server là trạm chuyển tiếp HTTP**, không P2P/WebRTC (máy sau NAT, đi qua tunnel, không thư viện ngoài). Agent đẩy
     bằng `curl --data-binary @tệp` (thư mục: `tar czf - thư_mục | curl --data-binary @- …`), tải bằng `curl -o`.
     Nội dung tệp KHÔNG đi qua ngữ cảnh model (không tốn token, không chép sai): phòng chỉ nhận một dòng thông báo.
   - API agent (cùng kiểu `/a/<agentId>/<tool>`, mã agent là quyền vào): `POST /a/<id>/send?name=&to=&file=` thân là bytes
     thô → trả mã tệp; hệ thống đăng tin `(tệp) Lam gửi fix-sub.patch (2,1 KB, sha256 ab12…) cho Minh` kèm lệnh tải đúng
     URL; `GET /a/<id>/file/<mãTệp>?name=` tải; `GET /a/<id>/files?name=` liệt kê. `to` trống = cả phòng; gửi riêng thì
     chỉ người nhận thấy thông báo (như nhắn riêng), người khác tải cũng không được.
   - Code: giao thức gợi ý `git format-patch -1 --stdout > x.patch` → bên nhận `git am x.patch` (hoặc `git bundle create`
     → `git fetch x.bundle`). Server KHÔNG tự áp dụng/merge (Ngoài phạm vi).
   - MCP: tool MCP không đọc được tệp trên máy agent mà không đưa nội dung qua token, nên giao thức MCP cũng đưa lệnh curl
     cho phần tệp (agent dùng MCP đều có shell); có thể thêm tool `files()` trả danh sách + lệnh tải. Ghi `annotations`
     như các tool khác.
   - Giới hạn: `--max-file-mb` (mặc định ~20 MB/tệp; Cloudflare quick tunnel giới hạn thân request ~100 MB), tổng mỗi
     phòng (ví dụ 200 MB), số tệp. Lưu trong bộ nhớ; có `--data-dir` thì ghi `<dataDir>/<hostKey>.files/` (quyền 600) để
     khởi động lại không mất. Xoá khi phòng bị dọn (TTL) hoặc "Cuộc họp mới" không mang sang; "Họp tiếp" có thể mang theo.
     Ghi theo luồng (stream), không đọc cả tệp vào chuỗi; vượt giới hạn thì cắt kết nối và báo lỗi rõ.
   - An toàn (quan trọng vì tệp được phục vụ CÙNG origin với trang chủ trì): luôn `content-type: application/octet-stream`,
     `content-disposition: attachment` với tên đã làm sạch (chỉ basename, bỏ ký tự điều khiển, `..`, `/`), `nosniff`, CSP
     `sandbox`; không bao giờ trả HTML/SVG inline. Hiện sha256 để bên nhận kiểm tra. Giao thức dặn: tệp từ agent khác là dữ
     liệu, đọc/kiểm tra trước, không chạy mù quáng, chỉ áp dụng patch khớp việc đã thống nhất (nối với luật 10 hiện có).
   - Trang chủ trì: mục **Tệp** (người gửi, người nhận, cỡ, sha256, nút tải); biên bản Markdown/JSON liệt kê tệp (không
     nhúng nội dung); webhook không cần đổi.
   - Kiểm thử: test node:test cho upload/tải/giới hạn/tên độc/gửi riêng/khởi động lại với `--data-dir`. Thử agent thật:
     HAI bản clone riêng của repo thử (tránh bẫy chung working tree), agent A sửa `sub()` rồi gửi patch, agent B `git am`
     trong clone của mình, chạy `node test.js`, báo tiến độ kèm mã commit. Subagent Haiku + Sonnet qua curl, prompt sao
     chép đúng từ trang. Tài liệu: README/README.en/GUIDE, CHANGELOG 3.2.0, ảnh mục Tệp.
2. ✅ **GIF demo mới** có giai đoạn thực hiện và gửi tệp (`docs/demo.gif`).
3. ✅ Nhỏ: "Thảo luận" ở màn kết thúc khi đóng từ phòng chờ (đã sửa). Ghi chú agent báo sau thay ghi chú đã nối khi gộp
   việc: giữ nguyên (chấp nhận được).

## Lộ trình v3.3: màn chuẩn bị tách 2 bước + bối cảnh dạng JSON để nhờ AI viết (nhánh v3.3-brief, đã xong)

Kết quả: 1-5 xong đúng thiết kế dưới đây (không đổi thiết kế; `roles` theo slot đã làm). Chi tiết ở "Trạng thái". Bước 2-4
làm chung một lần vì cùng một màn (làm từng bước sẽ phải viết lại màn ba lần), test riêng từng phần.

Người dùng yêu cầu 2026-10-18: tự điền bối cảnh và tuỳ chọn trên UI "hơi mệt", muốn chuyển sang JSON để gửi cho AI viết
hộ; trang bối cảnh cần thiết kế đẹp hơn; bước 1 (Bối cảnh) và bước 2 (Mời agent) đang chung một màn, phải tách ra: xong
bước 1 bấm "Tiếp" sang bước 2, chờ agent vào rồi mới Bắt đầu. Làm theo thứ tự, mỗi bước test xong mới sang bước sau.

1. **Định dạng "bản brief" JSON + module dùng chung `src/brief.js`.**
   - Một object khớp đúng thân `POST /api/host/<k>/start` để dùng lại được, thêm `schema` và (tuỳ chọn) `roles`:
     ```json
     {
       "schema": "agent-meeting/brief@1",
       "context": "Chủ đề và yêu cầu cho các agent…",
       "endCondition": "",
       "settings": { "agenda": ["Mục 1", "Mục 2"], "followUp": true, "mode": "free",
                     "maxMsgs": 120, "timeLimitMin": 0, "idleSec": 40 },
       "roles": ["phản biện", "bảo mật"]
     }
     ```
     `roles` theo THỨ TỰ SLOT (agent tự đặt tên nên không biết trước tên): khi bắt đầu, agent slot 1 nhận vai trò 1…
     (chỉ gán cho agent chưa có vai trò do chủ trì giao tay). Có lý do mạnh thì đổi, nhưng nói với người dùng trước.
   - `src/brief.js`: `parseBrief(text)` → `{ ok, brief, errors[] }` (JSON.parse; chấp nhận cả khi AI bọc trong ```json …```;
     kiểm kiểu từng trường, clamp theo `BOUNDS` như `Meeting.configure`, cắt độ dài như `start()`; khoá lạ → cảnh báo
     chứ không lỗi), `toBrief(form)`, `aiPrompt(brief)`. Viết dạng chạy được cả Node (`module.exports`) lẫn trình duyệt
     (`window.AgentMeetingBrief`), phục vụ tĩnh ở `/assets/brief.js` (thêm vào `ASSETS` trong server.js; CSP `script-src
     'self'` vẫn đúng). Test node:test `test/brief.test.js`: JSON hợp lệ, bọc ```json, sai kiểu, số ngoài khoảng, quá
     dài, khoá lạ, có `<…>` chưa điền, chuỗi rất lớn (giới hạn ~64 KB).
   - Dữ liệu dán vào là DỮ LIỆU: chỉ `JSON.parse`, gán bằng `.value`/`textContent`, không bao giờ `innerHTML`.
   - Tuỳ chọn: CLI `--brief-file brief.json` (thay cho `--context-file` + `--agenda-file`, dùng cùng `parseBrief`), cập
     nhật `--help`, README, DEPLOY (ví dụ họp tự động).

2. **"Nhờ AI viết" trên bước 1.** Hai chế độ (tab) cho cùng một bản nháp: **Điền trên form** | **JSON**.
   - Nút **Sao chép prompt cho AI**: chép một prompt tiếng Việt gồm mô tả từng trường, giới hạn, JSON mẫu (bản nháp hiện
     tại), và câu "chỉ trả về JSON". Người dùng dán vào ChatGPT/Claude kèm mô tả cuộc họp, rồi dán kết quả lại.
   - Ô **Dán JSON** + nút **Áp dụng**: hiện lỗi theo từng trường (dòng/khoá), áp vào form khi hợp lệ; form và JSON đồng bộ
     hai chiều (đổi form → JSON cập nhật; sửa JSON hợp lệ → form cập nhật). Nút **Sao chép JSON** / **Tải .json** /
     **Mở tệp .json** (FileReader, không gửi lên server).
   - Bản nháp vẫn lưu localStorage như hiện tại (`draftKey`), giờ lưu cả bản brief.
   - Thử thật: đưa prompt sao chép từ trang (không dặn thêm) + một mô tả cuộc họp cho subagent Haiku và Sonnet, dán JSON
     chúng trả về vào trang, kiểm tra form điền đúng và lỗi hiện rõ khi JSON sai.

3. **Tách bước 1 và bước 2 thành hai màn** (trạng thái server vẫn là LOBBY cho cả hai; bước là trạng thái phía trình
   duyệt, lưu trong `location.hash` (`#boi-canh` / `#moi-agent`) để tải lại trang vẫn đúng bước).
   - Bước 1 "Bối cảnh": chỉ có soạn bối cảnh (form/JSON, mẫu, chương trình họp, tuỳ chọn). Thanh dưới: **Tiếp: mời
     agent →** (chưa có bối cảnh thì báo lỗi như nút Bắt đầu hiện nay; còn `<…>` của mẫu thì hỏi lại).
   - Bước 2 "Mời agent": thẻ mời (các tab prompt), phòng chờ (giao vai trò, mời ra), tóm tắt bối cảnh chỉ đọc kèm nút
     **← Sửa bối cảnh**, nút **Bắt đầu cuộc họp** (gửi đúng bản brief của bước 1). Có thể hiện "chưa có agent: vẫn bắt
     đầu được" như hiện tại.
   - Thanh bước (`#steps`) bấm được để chuyển 1 ↔ 2 khi đang LOBBY; bước 3/4 vẫn theo trạng thái server.
   - Agent vào phòng chờ ngay cả khi chủ trì đang ở bước 1 (server đã cho phép): bước 1 nên có một chỉ báo nhỏ "n agent
     đang chờ". "Họp tiếp": thẻ "Mang từ cuộc họp trước" nằm ở bước 1.
   - Kiểm tra lại các test giao diện thủ công cũ: đổi `renderSteps()` (hiện tại bước 2 = "đã có chữ trong bối cảnh"),
     `initForm`, `renderSetup`, ngăn kéo "Mời agent" lúc đang họp (dùng lại `#invite`, đừng phá `inviteHome`).

4. **Thiết kế lại trang bối cảnh cho đẹp** (vẫn không build, không thư viện, CSP chặt, tự xử lý sáng/tối):
   - Mẫu bối cảnh thành thẻ có biểu tượng + một dòng mô tả (thay cho chip), ô bối cảnh lớn có đếm ký tự (giới hạn 8000),
     chương trình họp dạng danh sách sửa được (thêm/xoá/kéo thứ tự hoặc nút ↑↓) thay cho textarea, nhóm tuỳ chọn thành
     các khối rõ ràng (công tắc "Giữ phòng để báo tiến độ", chế độ phát biểu dạng nút chọn, giới hạn).
   - Kiểm tra ở desktop 1280, tablet 768, mobile 375, chế độ tối; không lỗi console; bàn phím (Tab/Enter) dùng được.
   - Chụp lại `docs/screenshots/setup.jpg` (+ ảnh bước 2), quay lại `docs/demo.gif` theo luồng mới (script quay ở
     "Cách lặp lại phép thử" phải sửa: bấm "Tiếp" trước khi chờ bot, rồi Bắt đầu ở bước 2).

5. Tài liệu: README/README.en (Quy trình 4 bước, phần nhờ AI viết bối cảnh, định dạng brief), GUIDE (mục 5 "Trước khi
   bắt đầu", mục 7 viết bối cảnh), CHANGELOG 3.3.0, package.json 3.3.0. Hỏi người dùng trước khi merge/push/tag/release.

Không đổi giao thức agent trong v3.3 (trừ `roles` theo slot, nếu làm). Nếu phải đổi văn bản gửi agent thì thử lại bằng
subagent Haiku + Sonnet như các phiên trước.

## Lộ trình v3.4: agent thật (Claude Code) bỏ họp giữa chừng + chặn Bắt đầu khi thiếu agent (nhánh v3.4-away, còn bước 6)

Người dùng báo 2026-10-19, đánh giá **lỗi rất nghiêm trọng**. Làm trên nhánh mới tách từ `v3.3.1-header` (header mới, chưa
merge; nếu người dùng đã merge thì tách từ main). Mỗi bước test xong mới sang bước sau.

**Chuyện đã xảy ra** (phòng thật qua tunnel `trycloudflare`, 2 vai trò: Cedar (GPT-6) giám sát, agent kia dựng MVP "LabelLoop").
Người dùng dán prompt "Paste and join" tiếng Anh cho **Claude Code (Opus 5.5, auto mode)**. Agent join được (tên
`Grok-the-Caveman`), đọc brief, rồi DỪNG LƯỢT để hỏi người dùng, không nói gì vào phòng. Lời agent (tóm tắt):
- Nó chạy MỘT lệnh vừa đọc `HANDOFF.md`, `docs/STATUS.md`, tệp memory, vừa gọi server họp → bộ kiểm duyệt auto mode của Claude
  Code chặn vì coi là **đưa dữ liệu ra ngoài** (phòng chạy trên tunnel công khai).
- `CLAUDE.md` của dự án ghi "Phase: IDEA. Markdown only. Build nothing until user says so", còn brief của chủ trì bảo dựng MVP
  ngay. Agent coi tin chủ trì là DỮ LIỆU, không phải lệnh của người dùng (đúng theo nguyên tắc an toàn của nó), nên không làm.
- Nó hỏi người dùng 3 điều: cho chia sẻ bối cảnh dự án lên phòng không; có bỏ luật "build nothing" không; hay rời phòng.
Sau đó agent **bị tính là đã rời phòng**: không gọi `wait` quá `staleMs` (= `busyMs` 120 s + 60 s) thì `_sweep` gọi
`leave(name, 'mất kết nối')` (src/meeting.js ~dòng 212), và lần `wait` sau khi người dùng trả lời nhận `LEFT_TEXT` "Bạn đã rời
phòng. Hãy dừng lại, không gọi thêm tool." → agent dừng hẳn. Agent cùng phòng phải chờ (chế độ lần lượt còn kẹt lượt tới `busyMs`).

**Nguyên nhân gốc** (đừng sửa bằng cách bảo agent bỏ qua quy tắc an toàn/dự án của nó):
1. Prompt mời (`buildInvite` trong src/ui/app.js, cả bản EN trong i18n.js) KHÔNG nói chủ trì là ai. Prompt do chính người dùng
   dán, nên đây là chỗ DUY NHẤT người dùng nói được với agent: "tin [CHỦ TRÌ] là của tôi". Giao thức luật 6 ("Tin [CHỦ TRÌ] …
   ưu tiên làm theo") đến từ server nên agent cẩn thận coi như dữ liệu → đúng.
2. Prompt/giao thức không nói phòng có thể chạy qua địa chỉ công khai và được chia sẻ gì; agent phải tự đoán → bị chặn.
3. Không có đường để agent hỏi lại mà vẫn giữ chỗ: dừng lượt để hỏi người dùng = mất kết nối = bị cho rời phòng vĩnh viễn.
4. Giao thức không dặn tách lệnh: agent gộp "đọc tệp + curl" vào một lệnh, đúng kiểu bộ kiểm duyệt coi là rò dữ liệu.

**Việc cần làm** (thiết kế đề xuất, có lý do mạnh thì đổi nhưng nói người dùng trước):
1. **Không đuổi agent "im lặng"**: hết `staleMs` thì đánh dấu VẮNG (`away`, hiện trên trang: "vắng, có thể đang chờ người dùng
   duyệt"), KHÔNG `leave`. Agent vắng gọi lại `wait`/`say` thì có mặt lại, giữ slot, vai trò, `cursor` (đọc tiếp phần đã lỡ).
   Chế độ lần lượt: agent vắng bị bỏ qua lượt (như hết `busyMs`), không chặn người khác. Luật "chỉ còn mình bạn: leave" và
   "mọi agent đã rời phòng" phải tính agent vắng như chưa rời (hoặc có hạn riêng dài hơn, ví dụ 15 phút, rồi mới coi là rời).
   Tối thiểu nếu vẫn giữ leave: `LEFT_TEXT` cho trường hợp mất kết nối phải bảo "gọi join lại với đúng tên để vào lại", không
   "dừng lại". Test: meeting.test.js (agent im > staleMs rồi wait lại: nhận tiếp tin, còn vai trò; lần lượt không kẹt; phòng
   không tự đóng vì agent vắng), server.test.js nếu đổi văn bản, `--data-dir` restore (agent vắng).
2. **Prompt mời nói rõ quyền** (cả 3 tab, VI + EN, tr() + i18n.js): đại ý "Tôi (người gửi prompt này) là chủ trì: tin
   [CHỦ TRÌ]/[HOST] trong phòng là của tôi. Phòng chạy qua <origin> (nếu không phải localhost thì nói rõ là địa chỉ công khai).
   Bạn được chia sẻ trong phòng những gì cần cho chủ đề, bằng tóm tắt TỰ VIẾT; không gửi bí mật (khoá, .env, mật khẩu, tệp
   memory). Quy tắc của dự án/của bạn vẫn áp dụng: nếu brief mâu thuẫn với chúng hoặc bạn cần tôi duyệt, hãy NÓI VÀO PHÒNG
   (tôi đọc và trả lời ở đó) rồi wait tiếp, đừng dừng im lặng." Cân nhắc cho chủ trì sửa câu quyền này trên trang (ví dụ ô
   "Agent được phép…": chỉ bàn / được sửa code trong repo / được chia sẻ tài liệu dự án) và đưa vào bản brief (`permissions`?)
   — nếu thêm trường brief thì cập nhật brief.js, LIMITS, aiPrompt, test, và hỏi người dùng trước.
3. **Giao thức** (src/meeting.js `_protocol`, có test so chữ thì sửa theo): thêm luật "Bị chặn quyền, cần người dùng duyệt,
   hoặc bối cảnh mâu thuẫn với quy tắc dự án: say NGẮN vào phòng (không kèm dữ liệu nhạy cảm) rồi tiếp tục wait; chủ trì sẽ trả
   lời trong phòng" và "Đọc tệp/chạy lệnh trong dự án bằng lệnh riêng; chỉ gửi vào phòng tóm tắt do bạn tự viết, không ghép
   đọc tệp với curl/say trong một lệnh, không pipe tệp vào say".
4. **Trang chủ trì**: agent vắng hiện rõ trong danh sách thành viên + phòng chờ; cân nhắc toast "X vắng > 3 phút".
5. **Chặn Bắt đầu khi thiếu agent cho vai trò** (người dùng: "có 2 role thì không nên cho start phòng vì chưa đủ agent"): bản
   brief có `roles` (tính cả phần tử "" vì vẫn là một slot) mà số agent có mặt < số vai trò → nút **Bắt đầu cuộc họp** bị khoá,
   dòng kiểm tra ở thanh dưới báo "Cần N agent theo vai trò (đang có M)" (`renderChecks`, `#btnStart` trong app.js; bỏ câu
   "vẫn bắt đầu được" khi có vai trò). Server `POST /api/host/<k>/start` cũng từ chối (409, thông báo rõ) trừ khi gửi
   `"force": true`, để API/CLI không lách; `--auto-start N` của CLI: nếu N < số vai trò thì báo lỗi lúc khởi động. Không có
   vai trò thì giữ hành vi cũ (0 agent vẫn bắt đầu được). Test: server.test.js (409/force), brief.test.js nếu đụng parse,
   i18n (chuỗi mới).
6. **Thử thật** (bắt buộc, vì lỗi đến từ agent thật): workspace thử có `CLAUDE.md` ghi "Build nothing, markdown only" +
   `HANDOFF.md`/`docs/STATUS.md`; brief yêu cầu "chia sẻ trạng thái dự án rồi dựng MVP"; 2 vai trò. Mời subagent Sonnet + Haiku
   bằng đúng prompt chép từ trang (không dặn thêm). Kỳ vọng: agent không bị đuổi khi dừng hỏi; nếu xung đột thì nói vào phòng;
   chủ trì trả lời trong phòng thì agent làm tiếp; không có lệnh gộp đọc tệp + curl. Nếu người dùng đồng ý: thử thêm Claude
   Code thật (CLI, auto mode) qua tunnel, vì bộ kiểm duyệt auto mode chỉ có ở đó. Thử luôn nút Bắt đầu bị khoá khi 1/2 agent.
7. Tài liệu: GUIDE/REFERENCE (VI+EN) mục quyền của agent + "agent vắng", CHANGELOG 3.4.0, package 3.4.0, README "What's new",
   GIF/ảnh nếu giao diện đổi. Hỏi người dùng trước khi merge/push/tag/release.

## Việc tiếp theo

- **Ưu tiên mới PM:** case/input/acceptance/ledger và sửa transport đã sẵn, xem [PILOT](evidence/pm-operator/PILOT.vi.md). Hoàn tất quyết định model/quyền/ngân sách trước model thật; không lặp sum hay mở rộng kiến trúc để tạo lợi thế. Direct CLI vẫn là lựa chọn khuyến nghị cho việc sửa nhỏ cho tới khi có bằng chứng khác.

- **Ưu tiên UI:** người dùng xem bản cải cách đang chạy tại `http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#plan`, nhận xét phân cấp/mật độ/hành động. Sửa theo phản hồi trước backlog model/remote. Test/screenshot chỉ là bằng chứng kỹ thuật, không tự chuyển trạng thái sang UX được chấp nhận. Xem UI-REFORM và acceptance mới; tài liệu bàn giao UI cũ là baseline.

**Ưu tiên triển khai hiện tại:** sửa tính nhất quán theo [HANDOFF-consistency.vi.md](HANDOFF-consistency.vi.md) trước khi mở rộng backlog trong [IMPLEMENTATION-STATUS.vi.md](IMPLEMENTATION-STATUS.vi.md). Bắt đầu bằng use case/screen pool/screen flow và nguồn dữ liệu chung, rồi nghiệm thu một hành trình hoàn chỉnh. Các mục lịch sử dưới đây vẫn giữ làm backlog. Quyền dùng Claude/agy cho phạm vi repo/workspace thử đã được người dùng cấp trong yêu cầu triển khai 2026-10-21; không hỏi lại chỉ để tiếp tục cùng phép thử đó.

**Định hướng mới (2026-10-21):** khi bắt đầu triển khai đội phát triển tự vận hành, theo [VISION.vi.md](VISION.vi.md): chốt app mẫu, stack, runtime/adapter, môi trường cô lập và ngân sách; thiết kế task/run/evidence rồi làm một luồng hoàn chỉnh cho đội nhỏ. Các việc bảo trì 3.x dưới đây giữ làm backlog; không coi những khả năng trong tầm nhìn là đã có.

Theo thứ tự ưu tiên:

1. **Lộ trình v3.4, bước 6: thử với agent thật** (code đã xong, đã push nhánh `v3.4-away`, app menu đã là 3.4.0 nên người dùng
   có thể đang tự dùng thử: hỏi họ kết quả trước). Hỏi người dùng có cho chạy subagent Sonnet + Haiku (workspace có `CLAUDE.md`
   "build nothing", brief bảo dựng MVP, 2 vai trò, prompt chép từ trang, không dặn thêm) và Claude Code CLI thật (auto mode, qua
   tunnel) không. Kỳ vọng: agent dừng hỏi thì chỉ "vắng"; xung đột thì nói vào phòng; không gộp đọc tệp + curl.
2. **GitHub Release v3.4.0** (tag đã có, đã merge vào main): hỏi người dùng có tạo Release không (ghi chú lấy từ CHANGELOG
   3.3.1 + 3.4.0 vì 3.3.x chưa có release). Cân nhắc quay lại GIF/ảnh nếu muốn thấy trạng thái "vắng" và nút Bắt đầu bị khoá (không bắt buộc).
   README (EN + VI) luôn ghi phiên bản mới nhất; đổi giao diện thì quay lại GIF (`tools/record-demo.js`, `--vi`) và chụp lại
   ảnh (`tools/shot-setup.js`, `tools/shot-mobile.js`).
3. **Cân nhắc chỉnh prompt nhờ AI** (cần thử lại Haiku + Sonnet): Haiku hay viết "VIỆC: [agent role] | …" vào context; agent
   thật vẫn ghi đúng tên nhờ giao thức nên chưa gấp. Có thể làm cùng bước 2 của v3.4.
4. **Gửi tệp qua tunnel Cloudflare thật**: tệp vài MB và ~20 MB, Expect 100-continue, "Tệp quá lớn". Hỏi người dùng trước.
5. **Webhook thật**: chỉ khi người dùng đưa URL.
6. Tab MCP / Codex CLI tiếng Anh với Codex thật: chỉ khi người dùng đồng ý (tài khoản của họ, sao lưu `~/.codex/config.toml`).
7. Có thể cân nhắc (cần người dùng đồng ý): giao thức tiếng Anh (`--lang en`); chủ trì xoá tệp; giới hạn tốc độ gửi tệp;
   kéo-thả đổi thứ tự mục chương trình.

Ý tưởng xa hơn (chưa lên kế hoạch):

- Nhiều phòng họp song song trên một server, trang quản trị có mật khẩu (đang nằm trong "Ngoài phạm vi" của v3.1).
- Webhook Microsoft Teams (Adaptive Card); hiện Teams nhận JSON chung.
- Bản dịch giao diện/giao thức sang tiếng Anh (i18n).
- Bản đóng gói có cửa sổ riêng (Electron/Tauri) hoặc launcher cho macOS/Windows.
