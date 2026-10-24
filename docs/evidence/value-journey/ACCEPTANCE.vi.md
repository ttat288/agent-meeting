# Kiểm giá trị và sửa hành trình thật — local, 2026-10-24

T0 **12:59:04 Asia/Bangkok**, hạn gốc **16:30 cùng ngày**. Source nền HEAD `1b56f4db04d4135a66fcc329af89332eb21b9d3f`, nhánh `codex/2026-10-22-product-hardening`, có nhiều thay đổi local trước phiên; không coi HEAD là toàn bộ source đã kiểm. Hash đầu phiên ở `initial.json`, source hai module trước sửa ở `inputs/source-before.json`. Đây là PM self-review/controlled experiment; không có human UX acceptance.

## Bốn đầu ra

1. **Task thật, failure thật:** chủ trì tải handoff của run v1 đã integrated sau khi Configure acceptance/reference/facts v2 và restart. API cũ trả task v2 với evidence v1. Người nhận có thể hiểu nhầm rằng yêu cầu mới đã được kiểm. Workaround là mở run snapshot, tự đối chiếu và sửa JSON. Regression API đỏ đã tái hiện, không lấy CSV làm bằng chứng nhu cầu. Tiêu chí: giữ snapshot đã thực thi, revision/unknown rõ và task mới vẫn chưa được nghiệm thu.
2. **Đối chứng:** cùng task sửa provenance, source nền/reference/acceptance, requested `gemini-3.8-flash-low`. Product dùng task/config/run/probe API thật và native runtime thật trong config/work/room `/tmp`. Trước probe và sau probe đều409 `MODEL_ACCESS_REQUIRED`: CLI phản hồi nhưng machine identity vẫn unknown. Không fake identity hoặc dùng runner scripted để làm arm này xanh. Direct supplied-source trả patch dữ liệu cần PM áp dụng/kiểm; có pilot sai/thiếu context, full context, clarification và repair. Task độc lập thứ hai là quyền file khi tích hợp/rollback: direct-first có patch đạt, product-second vẫn bị cùng guard. Không suy mẫu này thành benchmark thống kê hoặc lợi ích ròng. Native direct được cấp file tools và workspace ghi riêng đã kiểm, terminal không được cấp vì PM sở hữu kiểm độc lập. Bản đầu là capability check; hai bản sau che checkout thật/output arm trước và dùng Git objects riêng. Giữ mọi partial/fail và thao tác PM sửa candidate, không gọi đó là managed integration.
3. **Sửa và phục hồi:** đã sửa handoff, umask, stale rebase, thông báo tầng model identity, mutator có revision không xác định và biên read-only agy; chi tiết bên dưới. Kiểm failure/restart/stale/missing/redirected/closed/restore, success và source tích hợp. Thay đổi UI chỉ ẩn refresh khi run không còn đúng yêu cầu/nguồn, không thêm màn hình hoặc cơ chế điều phối.
4. **Khép chất lượng:** source cuối qua full regression, browser và gói local; agy review rồi PM đối chiếu. Không đồng nhất reported/verified/integrated; không nhận test xanh là giá trị sản phẩm hoặc UX được giám đốc chấp nhận.

## Thay đổi đã có bằng chứng

| Pain point quan sát | Trước | Sau và bằng chứng |
| --- | --- | --- |
| Handoff lịch sử lấy điều kiện hiện tại | acceptance/sources/facts v2 gắn evidence v1 | `task = requirementSnapshot`, run/current requirement revision riêng; true/false/null; legacy thiếu snapshot trả null và limitation. API current/stale/restart/missing snapshot/missing task đã kiểm. |
| Quyền file sau integration/rollback dưới umask077 | original0754 thành0700; rollback vẫn báo restored | Temp tạo private0600, chmod ordinary permission bits trước rename; success/rollback giữ0754. Concurrent chmod/symlink vẫn conflict. Không bảo toàn ACL/xattr/owner hay executable mode của file mới. |
| Refresh run cũ sau Configure | HTTP200, run verified thành reported, current task ready thành verifying | Backend kiểm open/current requirement/current source/canonical path trước ghi; stale409 giữ state. UI không hiện refresh cho attempt cũ/nguồn đã rời hội thoại. Current rebase→verify→integrate vẫn chạy. |
| Checkout tạm mất | Cần biết có còn cứu được run không | Lỗi400/ENOENT không đổi state; khôi phục đúng source path rồi explicit rebase→verify→integrate đạt. Không tự restore hoặc dispatch. |
| CLI có phản hồi nhưng thiếu/khác actual identity | Recovery bảo kiểm CLI/quyền chung, không chỉ đúng tầng lỗi | Phân biệt unknown/mismatch và hướng tới runtime reporting/mapping trước probe tiếp; giữ warning tốn phí, không auto Run/probe.15 VM tests và24 browser cases. |
| Run legacy thiếu revision | Optional fence bỏ qua undefined; verify/rebase đổi task state | Mutator đòi revision nguyên dương,409 giữ state/evidence; explicit Run mới cùng task phục hồi. Đây là fixture tương thích, chưa có bằng chứng mất field ở người dùng thật. |
| Read-only agy chỉ dựa vào CLI flag | Exact `buildArgs(write:false)` vẫn sửa file fixture BEFORE→AFTER | Mọi agy model call qua runtime buộc bwrap, `write:false` mount workspace chỉ đọc. Cùng prompt qua default runtime không truyền isolate giữ file BEFORE/EROFS; thiếu boundary từ chối trước spawn. Guard writing/MCP không gỡ. Linux/bwrap nay cần cho cả readonly/probe. |

## Đối chứng và công điều hành

`managed.json`, `managed-full.json`, `managed-repair.json`, `mode-managed.json` giữ request/status/source/probe. Không sửa settings/OAuth global; mapping model chỉ trong config thử nghiệm. Catalog mặc định trả no-candidate và Flash/Gemini disabled; không suy thành agy hỏng. Native agy write/task-skill guards sản phẩm giữ nguyên.

Direct đầu tiên và scout đầu tiên có CLI `SUCCESS` nhưng text rỗng và `denied_actions: RunCommand`; không nhận usable success. Pilot supplied-source handoff dùng sai `taskSnapshot`, PM test thất bại. PM đã cấp thiếu đoạn tạo run ở pilot, nên loại khỏi matched claim; lượt full cấp cả `src/server.js` và `src/work.js`. Patch full dùng field `current` thay tên API mà PM mong đợi; hợp đồng tên field chưa đủ rõ là lỗi chuẩn bị của PM, không là bằng chứng model yếu. PM bổ sung cùng hợp đồng cho cả hai arm, chuyển diagnostic và nhận repair. Một assertion đòi đúng chữ “unavailable” được sửa để chấp nhận “missing/unavailable/unknown”; cùng file bốn test bất biến cuối dùng cho mọi replay candidate.

Native unsealed sửa một file, qua4 kiểm gốc nhưng không có read barrier nên chỉ dùng làm capability evidence. Bản che lời giải đầu qua2/4 vì warning nằm ở field mới thay `limitations`; prompt của PM chưa nêu đủ rõ hợp đồng này. Hợp đồng được làm rõ trong cả hai arm và một repair trên source gốc qua4/4. Khi review tiếp, một ca **post-hoc** phát hiện fallback từ snapshot lúc run mất revision, trái hợp đồng giữ unknown. PM sửa **một dòng** trong candidate direct, không gọi model thêm;4 kiểm gốc +1 ca mới đạt. Giữ nguyên bốn test gốc và cùng một test post-hoc cho mọi candidate liên quan trong replay. Không tính candidate model nguyên trạng là đã đạt toàn bộ hợp đồng, không đổ lỗi model từ một yêu cầu chuẩn bị chưa đủ rõ.

Các bước bắt buộc direct-assisted gồm: PM chọn reference/source và đóng gói context; đọc kết quả/fence; kiểm match duy nhất; áp patch trong candidate; chạy kiểm độc lập; chuyển diagnostic/clarify khi fail; review rồi sửa source tích hợp. Mode patch qua ba test liên quan; handoff repair qua bốn test của task gốc. Mã source tích hợp do PM chỉnh, không nhận là native managed integration hoặc output nguyên byte của model. Model không được đọc lời giải từ arm khác; native direct chỉ nhận source nền và hợp đồng, không nhận patch đã sửa.

Product mất thêm thao tác tạo/configure task/model mapping, Run bị block, một explicit paid probe rồi explicit Run vẫn block. Không có completed native managed arm để so cùng chất lượng, tổng token hoặc latency hoàn thành. Task thứ hai dùng lại proof unknown còn hạn. Khi ca vượt TTL30 phút, một explicit probe thật mới xác nhận available/quota true nhưng actual model vẫn unknown, Run409; không nhận các request muộn dùng proof đã hết hạn là proof fresh. Xem `managed-fresh-proof.json`. Bytes HTTP/prompt và các thao tác ở `overhead.json`; số thao tác là PM script/protocol, không phải human time. Không đếm tool replay như inference.

## Kiểm chứng và thất bại giữ lại

- Full production source cuối **504/504,44 file**, Node22.22.1/Linux, memory1200M/swap0/timeout900, **108.365s**, exit0. `full-readonly-final.json/txt`. Các full496/499/502 thuộc source trước các lớp identity guidance/legacy mutator/mandatory readonly boundary; giữ lịch sử và không phủ lên source cuối.
- API handoff/recovery cuối **9/9**, gồm missing snapshot/task/revision, source mất/restore và legacy mutation→explicit new Run. Kiểm tập trung **74/74**; full504 đã bao gồm các ca cuối.
- Gói npm **local, không publish** cuối **70 file**, source hashes khớp; giải nén rồi chép independent tests vào để kiểm **95/95**. Tests không phải payload mặc định của gói. `package-verification-final.json`, `package-final-manifest.json`, `package-final-check.txt` giữ bản đã kiểm95; `package-verification-sealed.json` giữ gói cuối chỉ khác CHANGELOG, toàn bộ mã/assets/README khớp byte nên dùng lại bằng chứng kiểm95. Các gói55/71 kiểm trước đó giữ receipt riêng.
- Browser source tích hợp: **12 readiness +24 identity +12 historical-result cases**, cùng stale-page legacy failure→explicit new Run→integrate, VI/EN×light/dark×375/768/1280; repeated expiry→failed probe→successful probe→explicit Run→failed check→retry→verify→integrate; Configure→historical warning/download→Back/reload/deep link; current refresh có và stale refresh không có. Không model call; expiry backdated. Report/screenshot trong `browser/`.
- Browser1–4 fail do test: selector gặp hai warning; link nằm trong disclosure đóng; APIRequestContext nhận URL tương đối; same-hash navigation bị hiểu nhầm là reload. Browser8 fail vì participant CSV ghi lại bản incomplete trong lần chạy mới không có diagnostic; đã tái hiện riêng ở `browser-fixture-regression.json`. Sau hai attempt sửa CSV đầu, metadata recovery dùng no-op participant để không tự gây regression ngoài mục tiêu. Giữ mọi log; không gán các lỗi test thành bug sản phẩm. Browser10 là lượt cuối đạt toàn bộ48 geometry cases + legacy recovery,0 model calls.
- Native baseline preparation: báo cáo npm pack vô tình đặt tên package.json làm Node từ chối script; đổi tên trước khi gọi model. Boundary check đầu đặt marker dưới private /tmp bị ENOENT, đổi sang marker cache ngoài workspace và xoá sau kiểm. Hai lỗi chuẩn bị này không có model call.

## Biên read-only và hành trình README

Rà giới hạn provider trong README/showcase dẫn tới kiểm giả định read-only. Hai lượt CLI thật cùng prompt: plan flags vẫn ghi file trong fixture được phép ghi; default runtime sau sửa với workspace mount chỉ đọc giữ nguyên file. Outer sandbox bảo vệ host trong cả hai lượt; không thử ghi dữ liệu thật. Bảo vệ đến từ **filesystem boundary**, không nhận lời model sau test rằng “execution mode” đã enforce. `readonly-boundary-verification.json`, `runtime-boundary-red/green.txt` và hai raw receipts giữ điều kiện/latency/usage; không so tốc độ từ hai timer scope khác nhau.21 kiểm runtime/cancel/boundary đạt.

Không mở managed agy write hoặc task-context MCP, không thay provider, không bỏ plan/sandbox flag hay group escalation. Đây là tightening tương thích: mọi lượt agy model qua runtime cần Linux/bwrap, thiếu thì fail closed; CLI ngoài app không bị app kiểm soát. Không claim read/network/external-tool-server isolation.

README Anh/Việt nêu writing adapter Claude Code gần giới hạn managed; showcase liên kết bản English summary local, không thay ảnh/video thành model-native demo. Clone không còn phụ thuộc topic branch, vẫn checkout cùng pin f415; pin là ancestor của merged head local.91 link/anchor local đạt. Fresh remote fetch chưa kiểm được vì Git TLS verification failed và web fallback inaccessible; không bypass cert, sửa CA/OAuth/settings. Không dùng lỗi TLS làm bằng chứng repo/branch không tồn tại.

## Review agy và đối chiếu

`model-calls.json` giữ mọi lượt, denied action và usage. Scout có các nhận định chưa chứng minh về Claude stdin/print, task permanently stuck khi rebase và cleanup kill timer; PM không sửa theo chúng. Current rebase test vốn đi tới verified/integrated, và timer giữ process-group escalation có chủ đích. Scout nêu mode nhưng lý giải false conflict không đúng; PM tái hiện **permission loss** thực trước khi sửa.

Review handoff/mode không tìm lỗi mới tái hiện được; file mới0600 là giới hạn đã nêu, không triển khai thêm executable/ACL support. Review rebase coi explicit refresh của source không đổi là “mất evidence”; thực tế evidence lưu trong `rebases`, việc yêu cầu verify lại có chủ đích. UI409 có error handling; không phải unhandled error. Missing checkout trả400 qua API catch, không500; restore test xác nhận cứu được. Giả thuyết task biến mất giữa synchronous update chưa tái hiện; update chỉ save sau callback và có CAS. Không nới guards theo review.

## Tái lập không gọi model

```bash
node --test test/work-handoff.test.js
node tools/check-value-journey.js
PLAYWRIGHT_MODULE=/absolute/path/to/playwright AM_SKILL_EVIDENCE=/tmp/am-value-browser node tools/check-task-skills-browser.js
systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test
```

Replay giữ expected fail của patch cũ/sealed warning contract và ca post-hoc, kiểm candidate sau PM correction cùng native capability/permission result, rồi xoá workspace tạm. Source trước sửa và bốn test gốc đã lưu riêng; replay không gọi API model hoặc giả MCP native.

## Kết luận sản phẩm và giới hạn

Đã ngăn các trạng thái nghiệm thu/phục hồi sai, giữ quyền file và chặn native file edit trong read-only runtime; đây là lợi ích correctness có regression tái hiện. **Wow factor, tiết kiệm billing, giảm thời gian người thật và lợi ích ròng so direct chưa chứng minh.** Trong config/adapter hiện tại, agy không đi hết managed journey vì identity proof unknown; cần công khai giới hạn, không sửa guard để tạo demo. Không cập nhật showcase thành model-native success.

**Usage riêng ca này:**19 lượt CLI thật, **690090 input +21712 output =711802 total_tokens** theo CLI; **2770449 cache-read**, thinking0 được báo riêng. CLI total_tokens không cộng cache-read nên không gộp thành billing tokens. Sum wall mọi call **574.841s** có phần song song, không là thời lượng ca; tổng prompt tường minh **675334 UTF-8 bytes**. Không cộng19 lượt/199110token của ca trước. Các lượt nguồn/routing/version check, API/MCP/browser fixture và offline replay không là inference. `model-calls.json`, `overhead.json` và `inputs/prompts/` giữ chuỗi thất bại/repair/review/probe cùng hash. Native SDK tool-schema/output split và context opaque chưa quan sát được.

SDK báo num_turns1/lượt (19 tổng); counter này không được coi là số inference/tool steps nội bộ.19 conversation ID khác nhau được giữ dạng hash, không công bố ID. PM token, hidden/unreported context, billing invoice, human time và chi phí bảo trì chưa đo được. Usage CLI, mọi fail/retry/review, sum call wall, prompt/HTTP bytes và operations được giữ; không thay unknown bằng0. Bản này local, không commit/push/merge/release, không chạm app3000/phòng thật/public endpoint.

**Điểm dừng:** sáu sửa trong cùng hành trình đã có red→green, fresh native/product comparison, failure/recovery, source/package/browser và review đối chiếu; không còn lỗi quan trọng đã tái hiện mà chưa xử lý trong phần đã đổi. Các khoảng trống còn lại là model identity/adapter agy task-skill/write, billing/đa-provider/human acceptance và backlog ngoài hành trình; không tự mở guard, đổi provider hoặc xây adapter để lấp giờ. Mốc16:30 giữ nguyên; thời điểm chốt thực và lý do dừng sớm ghi ở HANDOFF/verification, không nhận đã làm tới hạn.
