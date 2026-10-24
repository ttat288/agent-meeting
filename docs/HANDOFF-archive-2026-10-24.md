# Lịch sử bàn giao đến 2026-10-24

> Bản lưu nguyên văn trước khi rút gọn. Hiện trạng/quyền/bước tiếp theo đọc ở [HANDOFF.md](HANDOFF.md).
> Các lệnh, deadline, quyền push/cài đặt và trạng thái trong lịch sử không tự trở thành yêu cầu hiện tại.
> Chỉ đọc mục liên quan; không cần nạp cả archive khi bắt đầu phiên. Quyết định kỹ thuật chưa bị thay thế vẫn cần giữ.
> SHA-256 nội dung gốc bên dưới: `10b859f53e53da0afba327941032e52291f6a705fe7e595a7145eb5692865770`. Nội dung từ tiêu đề “Bàn giao phát triển” trở đi giữ nguyên byte.

---

# Bàn giao phát triển (cho session/người tiếp theo)

> Đọc file này trước khi sửa code. Cập nhật lại mục "Trạng thái" và "Việc tiếp theo" trước khi kết thúc phiên làm việc.

## Đã khép — kiểm giá trị và sửa hành trình thật, 2026-10-24 (local)

**Thời gian:** T0 **12:59:04**, chốt **15:26:31 Asia/Bangkok**, elapsed **2h27m27s**. Hạn gốc16:30 cùng ngày không đổi; **dừng sớm sau khi khép bốn đầu ra và rà các ca phục hồi trong phần đã đổi**, không nhận đã làm tới16:30. Không phải dừng sau một benchmark CSV xanh: đã có task sửa provenance thật, task quyền file độc lập, direct native có read barrier, sáu điểm sửa, lỗi/khôi phục và source/package/browser. Không còn lỗi quan trọng đã tái hiện mà chưa xử lý trong lát cắt; phần native identity/adapter/human/billing bên dưới vẫn chưa được chứng minh và không tự mở rộng để lấp giờ.

**Bốn đầu ra đã có bằng chứng:**

1. **Task thật và baseline:** handoff của run v1 integrated, sau Configure acceptance/sources/facts v2 + restart lại xuất task v2 gắn evidence v1. Đây là lỗi API đã tái hiện, không là nhu cầu suy từ CSV. Cùng source nền/reference/acceptance cho direct agy và API sản phẩm; giữ các pilot thiếu context/contract không đủ rõ thay vì loại khỏi chi phí.
2. **Đối chứng thật:** direct supplied-source có fail→clarify/diagnostic→repair; direct native có file tools, workspace ghi riêng đã kiểm, terminal không cấp vì PM sở hữu test độc lập. Bản native đầu chỉ là capability evidence; bản sau che checkout thật/output arm trước và có Git objects riêng. Sealed candidate đầu2/4 do warning ở field khác; một repair4/4; ca post-hoc missing-run-revision còn fail nên PM sửa một dòng rồi4gốc+1mới đạt. Không tính model output nguyên trạng là đã đạt hết hợp đồng hoặc native managed integration. Product chạy task/config/probe/run API thật; hai probe thật (probe mới sau khi TTL cũ hết) đều có CLI phản hồi nhưng actual identity unknown, Run409. `agy write:true` trong adapter vẫn chặn; không fake observation/đổi provider/gỡ guard để làm xanh.
3. **Sáu sửa trong cùng hành trình:** handoff dùng executed snapshot + revision/currentness/unknown rõ; atomic integration/rollback giữ ordinary permission bits dưới umask077; rebase chặn old requirement/removed source/canonical redirect/closed trước ghi và UI ẩn nút cũ; recovery phân biệt CLI failure với missing/mismatch identity; mutator legacy đòi revision số nguyên dương, không dùng undefined làm optional fence; mọi agy model call qua runtime có filesystem boundary, kể cả readonly/probe, vì plan flags vẫn cho native edit trong fixture thật. Legacy thiếu field là fixture tương thích, chưa có bằng chứng người dùng thật mất field. Explicit Run mới cùng task phục hồi, không tự sửa store/auto retry/probe.
4. **Source tích hợp:** full cuối **504/504,44file,0fail/skip/cancel**, **108.365s**, memory1200M/swap0/timeout900, Node22.22.1/Linux. API handoff9/9, targeted74/74 +21 runtime/boundary. Browser **48 geometry cases** (12readiness+24identity+12historical, VI/EN/light/dark/375/768/1280) + stale-page legacy Verify409→reload→explicit Run mới→verify→integrate, Back/reload/deep link,0model calls. Gói local70file giải nén source hash khớp và95/95 independent checks; không publish. agy review từng lát cắt rồi PM đối chiếu, không áp dụng findings chưa tái hiện. CI Node18/20/22 và human UX mới chưa chạy.

**Bằng chứng dùng lại:** [ACCEPTANCE](evidence/value-journey/ACCEPTANCE.vi.md), [verification](evidence/value-journey/verification.json), [model calls](evidence/value-journey/model-calls.json), [overhead](evidence/value-journey/overhead.json), [source freeze](evidence/value-journey/source-freeze.json), [preservation](evidence/value-journey/preservation.json), [browser](evidence/value-journey/browser/browser.json), [gói cuối](evidence/value-journey/package-verification-sealed.json). `node tools/check-value-journey.js` replay offline mọi pass/fail và ca post-hoc, không inference. Prompt tường minh/hash và source trước sửa nằm trong evidence/inputs; SDK hidden context/tool transcript vẫn unknown. Raw CLI/tarball/workspace thử ở `/tmp/am-value-20261024-125904`, không hứa /tmp bền vững.

**Usage/overhead/thất bại riêng ca này:** **19 lượt CLI thật**, **690090input+21712output=711802total_tokens** theo CLI; **2770449cache-read**, thinking0 báo riêng. Không cộng cache vào CLI total hoặc suy thành tiền; không cộng19lượt/199110token ca trước. Sum wall mọi call **574.841s**, có song song; prompt tường minh **675334 UTF-8bytes**; không phải thời lượng ca/human time. PM token/hidden context/billing invoice/maintenance/native tool-schema split unknown. Giữ empty SUCCESS+command denial, pilot thiếu source, field-contract failure, warning assertion quá literal, native sealed fail và PM correction. Browser1–4 và8 fail do test/participant;10 là lượt cuối đầy đủ đạt.19 SDK turn counters không được coi là số model/tool requests nội bộ. Hai lỗi chuẩn bị native (pack report đặt tên package.json và marker dưới private /tmp) không có model call; đã sửa và kiểm barrier độc lập. Không gọi thêm để che fail hoặc tuyên bố tiết kiệm.

**Kết luận sản phẩm:** đã sửa lỗi correctness/phục hồi; **wow factor và lợi ích ròng so agy trực tiếp chưa chứng minh**. Direct đi tới sửa mã với kiểm/review của PM; managed agy hiện bị identity/adapter chặn. CLI không hỏng chỉ vì adapter hoặc machine identity chưa hỗ trợ. Giữ lời hứa hẹp, không làm showcase giả thành công/native-MCP/write đã có. README Anh/Việt nêu writing adapter Claude;91 link/anchor local đạt. Remote fetch TLS fail/web fallback inaccessible nên chưa xác minh fresh clone, không sửa CA/auth hoặc bypass. Bản cuối chỉ khác gói95 kiểm ở CHANGELOG; executable/assets/README byte-identical nên không lặp test. Bước tiếp PM đề xuất: dùng agy trực tiếp cho sửa mã trong trạng thái hiện tại, giữ managed guards và chưa mở adapter/đa-provider/graph/backlog. Giám đốc không cần chọn lỗi/chia việc hoặc thao tác thường nhật thêm.

**Bảo toàn/quyền:** HEAD vẫn1b56f4d, nhánh cũ; mọi thay đổi local, file đầu phiên không bị xóa. execution-sandbox/task-skills/cli-discovery/connect/default catalog/AGENTS/package/.gitignore giữ nguyên byte T0; runtime chỉ thêm mandatory agy filesystem boundary (reverse patch khớp T0), guard write/MCP không đổi, SECURITY/README cập nhật giới hạn; chỉ sửa các file liên quan, docs và evidence. Không commit/push/merge/release, đổi model/provider, sửa OAuth/settings global, chạm app3000/phòng thật/public endpoint. Các full496/499/502 và browser/gói trung gian chỉ áp dụng snapshot lúc đó; không phủ lên source504 cuối. Native1.4.7/hash đo trong ca không attestation mọi lượt trước; actual model của tất cả lần thử vẫn unknown.

## Lịch sử lệnh đã thực thi — kiểm giá trị và sửa hành trình thật, hạn 16:30 ngày 2026-10-24 +07

**Lệnh mới nhất của giám đốc:** đồng ý đề xuất PM tự chọn lỗi thật cần reference và ca thất bại/phục hồi, so Agent Meeting với agy trực tiếp cùng đầu vào/tiêu chí, đo công điều hành và tổng chi phí, sửa điểm nghẽn hoặc thu hẹp lời hứa; yêu cầu “viết bàn giao đi, làm đến giờ cũ… đảm bảo số lượng việc đủ nhiều”. **Đã giao thực thi ở phiên kế**, thay trạng thái dừng/chỉ đề xuất ở mục lịch sử bên dưới. Lượt chuẩn bị này chỉ cập nhật bàn giao, chưa chạy task/model/test mới. Clock khi chuẩn bị **12:56:53 ngày24/10/2026 +07**; hạn giữ **16:30 ngày24/10/2026 Asia/Bangkok**, không phải T0+3h hoặc ngày kế. Phiên kế kiểm clock, ghi T0 riêng và làm ngay; nếu đã qua hạn thì xin mốc mới, không tự dời lịch.

**Điều chỉnh trách nhiệm PM:** giám đốc phản hồi các ca làm ít và dừng sớm. Ca11:46–12:02 chỉ hoàn tất phép thử CSV và hai sửa nhỏ; không giải quyết xong bài toán giá trị sản phẩm. Không tự thu nhỏ yêu cầu mới thành một benchmark nhỏ rồi tuyên bố done. “Wow factor” **chưa được chứng minh**: baseline matched cũng đạt, structured26895token so baseline26890, Caveman28072; lookup do text harness chuyển tiếp và native integration chưa kiểm. Không lấy487test/19inference/ảnh đẹp/số mã làm giá trị sản phẩm. PM tự chọn task và chia việc thường nhật; không đẩy việc tìm lỗi, tìm người thử hoặc chốt ca test về giám đốc.

### Mục tiêu và khối lượng phải khép

**Pain point cần kiểm:** người vận hành có coding CLI nhưng khi dùng Agent Meeting phải nhập/chuyển context, giải thích lại reference, đối chiếu reported với source/test hoặc cứu luồng fail/stale/restart. Chọn vấn đề thực trên repo/source tích hợp; ghi quan sát và giả thuyết riêng. Ưu tiên hành trình sản phẩm hiện có và feedback đang mở, không mặc định xây adapter/graph/editor. Phiên này phải xử lý cả chuỗi phát hiện→đối chứng→sửa→phục hồi→kiểm source→kết luận sản phẩm, không dừng sau một arm xanh.

Bốn đầu ra bắt buộc dưới đây là khối lượng mục tiêu; **không đặt quota số bug/feature/test/token để tạo việc giả**:

1. **Một nhiệm vụ thật của Agent Meeting, đủ điều kiện so sánh.** Trong20–30phút đầu đọc AGENTS, HANDOFF, CONSISTENCY-JOURNEYS và tài liệu liên quan, rà source/feedback/evidence để PM chọn lỗi hoặc điểm nghẽn thật cần reference. Chỉ ra người gặp khó, bước lỗi, hậu quả, workaround và tiêu chí đầu ra trước khi sửa. Có ít nhất một failure đã tái hiện và chẩn đoán được. Không tái dùng sum/CSV/patched fixture làm bằng chứng nhu cầu; nếu ứng viên đầu không có lỗi thì chọn ứng viên kế trong cùng hành trình. Giữ source snapshot/base, reference/hash, acceptance/test độc lập và quyền bằng nhau ở các arm. Không cho arm sau đọc lời giải/patch/commit/test bí mật từ arm trước.
2. **Đối chứng direct CLI với đường sản phẩm thực sự hỗ trợ.** Dùng `/home/theo/.local/bin/agy` requested `gemini-3.8-flash-low` cho scout/phản biện/review và công việc model phù hợp. Giữ direct có đủ context/tool/quyền được cấp, không cố làm yếu baseline. Ghi rõ ai chọn/nạp reference, ai chuyển diagnostic, ai áp dụng patch, từng thao tác bắt buộc và thao tác cứu lỗi. Dùng API/CLI/browser của sản phẩm hiện có, không tự viết thêm một text harness rồi gọi đó là luồng sản phẩm. Nếu cần PM chuyển patch như dữ liệu thì ghi toàn bộ manual work và chỉ gọi là assisted workflow; không giả native managed integration. Adapter/model identity chặn một arm là kết quả cần ghi và phân tích, không được fake observation/reportedModel, bỏ guard hoặc đổi model/provider để làm xanh. Không bắt xây adapter trước; vẫn tiếp tục sửa/kiểm các điểm nghẽn độc lập trong quyền. Nếu có đủ thời gian sau vòng đầu, làm vòng task độc lập tiếp theo hoặc đổi thứ tự arm để kiểm kết luận có lặp lại; ghi rõ khi mẫu chỉ có một và không suy thống kê.
3. **Sửa trọn điểm nghẽn có bằng chứng, kiểm lỗi và phục hồi.** Ưu tiên thay đổi nhỏ giảm việc nhập/chuyển/cứu tay hoặc ngăn trạng thái sai trong task→run→evidence→result. Phải kiểm đường thành công cùng ít nhất hai ca biên khác nhau liên quan thực tế (ví dụ stale source/revision, reference thiếu/đổi/quyền deny, failed verification→explicit retry, restart/reload); không dựng lỗi giả hoặc thêm tính năng chỉ để đạt số ca. Tận dụng test/harness hiện có, thêm kiểm cần thiết cho hành vi mới. Sửa các lỗi tích hợp phát hiện đến khi hành trình mục tiêu đạt hoặc tới hạn; không nhận worker reported là verified/integrated. Nếu không tìm ra sửa có ích, công khai chưa tìm ra và dùng thời gian kiểm các pain point cùng hành trình đang mở, không sửa chữ/metadata vô cớ cho có code. Không cần tìm cho đủ nhiều bug để chứng tỏ đã làm.
4. **Khép chất lượng và kết luận giá trị có thể kiểm lại.** PM tự kiểm source tích hợp, scope/test bất biến/ID/revision/evidence/khôi phục, review độc lập bằng agy rồi đối chiếu findings. Production source đổi thì full regression đúng giới hạn bên dưới; UI ảnh hưởng phải đọc ui-ux-pro-max/design/HANDOFF-ui-reform và kiểm browser integrated VI/EN/theme/responsive/Back/reload/deep link phần ảnh hưởng, cập nhật screen pool/flow/matrix. So cùng chất lượng và công bố thành công/thất bại của cả hai arm. Chỉ cập nhật showcase khi có kết quả hữu ích đã kiểm thật; nếu direct tốt hơn hoặc lợi ích chưa rõ, thu hẹp lời hứa tương ứng thay vì dựng “wow”. Cuối phiên ghi delta từ ca trước, việc đã khép/còn mở, receipts/hash, mọi usage/overhead/thời lượng thật và bước tiếp ai làm trong chính HANDOFF.

### Nhịp thực hiện đến hạn và tiêu chí dừng

Mặc định tiếp tục công việc hữu ích trong bốn đầu ra trên **đến16:30**, không coi một task chạy được là đủ. PM lập hàng việc ngắn ngay sau scout, thực hiện theo tác động; sau mỗi lát cắt chọn tiếp điểm nghẽn còn bằng chứng trong cùng hành trình và thời gian còn lại. Không sleep lấp giờ, chạy full test vô cớ, gọi model để đủ số hoặc mở toàn bộ backlog. Cập nhật tiến độ theo phát hiện/kết quả/rủi ro, không im lặng quá lâu.

Dành tối thiểu25–30phút cuối cho regression/browser cần thiết, bảo toàn và bàn giao; ngừng mở sửa lớn trước16:00. Nếu có lỗi cần xử lý cuối phiên, ưu tiên sửa/rollback an toàn trong phạm vi thay vì mở tính năng mới. Không vượt hạn; chưa xong thì ghi đúng thiếu/blocked nào và bằng chứng. Chỉ dừng sớm khi **toàn bộ bốn đầu ra** đã khép, đã rà các ca phục hồi/feedback liên quan mà không còn việc hữu ích trong scope; phải nêu bằng chứng cụ thể vì sao không còn việc cần làm, không lặp kết luận “đủ lát cắt” của ca15phút. Số lượng công việc được đánh giá bằng các kết quả hành trình và vấn đề đã kiểm/giải quyết, không bằng số file hoặc feature.

**Chi phí phải ghi đầy đủ:** input/output/cache/thinking theo CLI khi có, mọi lượt scout/review/repair/retry và overhead tổng hợp; latency model/task/toàn phiên tách nhau, thao tác chuyển context/diagnostic/patch, reconfiguration, phục hồi, schema/tool output/context bị gửi lại và bảo trì. Token PM/hidden context/billing không thấy thì unknown, không suy bytes thành token hoặc giảm output thành tiết kiệm. Đếm thao tác không được gọi là human time; không có người dùng thật thì ghi PM self-review/controlled experiment. Không lấy19lượt/199110token ca cũ làm budget đã tiêu của phiên mới, nhưng giữ số lịch sử và tính tổng mới riêng.

### Workspace, nguồn và quyền giữ nguyên

HEAD gần nhất **1b56f4db04d4135a66fcc329af89332eb21b9d3f**, branch `codex/2026-10-22-product-hardening`. Có nhiều tracked modified/untracked: kiểm `git status --short` và giữ mọi thay đổi trước khi làm; không reset/clean/pull/merge. Mốc cuối487/487 thuộc `docs/evidence/task-skills/agy-live/source-freeze.json`, không tự phủ source mới. Đọc kết quả agy-live (matched/pilot/recovery/review/overhead) để không lặp lỗi chuẩn bị: pilot Git base khác; hai recovery sai revision/string/regex; parser fence chưa trim; một CLI output SUCCESS vẫn timeout teardown. Không tự biến tool offline replay thành một inference hoặc managed native journey.

Đọc `docs/GEMINI-WORKFLOW.vi.md` và `docs/ROUTING-WORKFLOW.vi.md` trước giao agy; dùng catalog lookup phù hợp, task ID/source/base/phạm vi/quyền/output/acceptance/timeout/retry rõ. Dùng agy hữu ích, không greeting probe lại. Actual model vẫn unknown nếu không có machine identity. `--mode plan` không hiệu lực cùng disable-slash-commands; dùng biên filesystem ghi đã kiểm và workspace riêng nếu worker ghi, prompt không là sandbox. Ưu tiên supplied-source read-only review/patch dữ liệu để PM kiểm. Không thêm provider/model hoặc gọi agent khác ngoài quyền hiện có; không cần spawn subagent nội bộ để tuân thủ bàn giao.

**Không commit/push/merge/release**, bỏ guard agy taskContextFile/write/model access, sửa OAuth/settings global/MCP global, chạm app3000/phòng thật hoặc mở endpoint public. Không mặc định quyền dùng agy phát triển là quyền xây/bật adapter sản phẩm. Không dependency runtime/framework/CDN mới; Node>=18 và UI vanilla/CSP/VI-EN/theme giữ nguyên. CONTRIBUTING/SECURITY/SECURITY-DESIGN áp dụng khi sửa liên quan.

Full khi source đổi: `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test`.

**Bước tiếp đã được giao:** phiên kế PM đọc mục này, kiểm giờ/workspace rồi tự scout/chọn task thật và thực thi ngay đến hạn; giám đốc không cần chọn lỗi/chia việc/cấp lại quyền thường nhật. Việc đổi mục tiêu/ngân sách/quyền mới phải trình giám đốc; lượng việc nhiều không tự cấp quyền vượt ranh giới.

## Đã thực thi tiếp với agy — 2026-10-24, dừng sớm

**Thời gian thật:** T0 **11:46:59**, chốt **12:02:47 ngày24/10/2026 Asia/Bangkok**, **15phút48giây**; dừng trước16:30. Đây là thời lượng riêng phiên này, không cộng ca cũ/chờ reset.

**Trạng thái:** phạm vi review/model evidence được giao ở mục tiếp theo đã thực thi, không còn là lệnh chờ chạy. Phiên bắt đầu **11:46:59 +07**; mốc chốt/thời lượng riêng ghi trong đoạn thời gian bên dưới và [verification](evidence/task-skills/agy-live/verification.json). Hạn gốc16:30 cùng ngày giữ nguyên; đủ nghiệm thu lát cắt nên dừng sớm, không kéo việc cho đầy giờ hoặc tự mở backlog. Các giới hạn native integration/human/billing bên dưới vẫn chưa được chứng minh, không tự nhận toàn sản phẩm đã nghiệm thu.

**Pain point đã xử lý:** thiếu bằng chứng độc lập/model thật cho task→skill/reference→handoff→kết quả; source có hai lỗi nhỏ quan sát được khi review. `agy` requested **gemini-3.8-flash-low** đã review source và review sửa cuối; PM đối chiếu từng finding, không áp dụng mù. Sửa MCP cap theo từng dòng65536bytes để burst hợp lệ không đóng stdin; metadata cắt600codepoint nay báo `descriptionTruncated: true` xuyên discovery→snapshot→bootstrap/lookup, full manifest vẫn load được. Giữ byte/source/retry/cancel/secret guards; không sửa runtime adapter hoặc UI.

**Model thật và kiểm source:** [ACCEPTANCE](evidence/task-skills/agy-live/ACCEPTANCE.vi.md), [calls](evidence/task-skills/agy-live/calls.json), [matched](evidence/task-skills/agy-live/matched.json), [overhead](evidence/task-skills/agy-live/overhead.json), [source freeze](evidence/task-skills/agy-live/source-freeze.json). Ba arm baseline/structured/Caveman cùng task/revision/source/test/Git base/requested model: mỗi downstream tự trả request đọc reference qua granted production lookup, nhận text/receipt và sinh patch; PM kiểm guard, candidate và source sau áp dụng đều8/8. Ba handoff giữ ID/điều kiện/phủ định/literal error/path/evidence/unknowns/bước tiếp. Đây là **direct agy text protocol PM/harness chuyển tiếp**, không phải agy MCP native hoặc managed Claude inference; không fake actual model để qua access/verification guard. Actual model vẫn **unknown** vì machine output không có identity field. `applied: not-observed` trong sản phẩm giữ nguyên; chỉ quan sát hành vi ở phép thử này.

**Kiểm chứng:** hai test mới đỏ12/14 trước sửa; targeted18/18; full **487/487,43file,0fail/skip/cancel**, đúng memory1200M/swap0/timeout900, Node22.22.1/Linux. Production API/MCP journey chạy lại tới integrated/source8checks; đây vẫn là fixture riêng, không thay model evidence. `node tools/check-live-skill-results.js` replay ba patch model đã lưu,8checks/arm, không inference. Không sửa UI; hashes UI và runtime giữ nguyên. Browser12case của ca trước là bằng chứng cũ cùng UI bytes, không nhận đã có browser/model native mới. Source mới chưa chạy CI Node18/20/22 hoặc nghiệm thu người dùng.

**Thất bại và chi phí thật:** tổng **19 lượt agy**, gồm2review+6pilot+2recovery bị loại+9matched; CLI báo **189905input+9205output=199110token**, thinking/cache báo0. Tổng wall mọi call **412.270s**, có phần song song nên không là thời lượng phiên; tổng prompt148567UTF-8bytes. Matched baseline26890token/27.199s, structured26895/29.410s, Caveman28072/28.353s; mỗi arm3inference và1lookup83request/410response bytes. Một mẫu tuần tự không là benchmark thống kê; không chứng minh structured rẻ hơn. Caveman handoff ngắn hơn nhưng tổng token cao hơn; **giữ quy tắc ngắn hiện có, không cài Caveman/graph**. PM token/billing/hidden unreported context/công người dùng/bảo trì vẫn unknown/null. Không gọi lại greeting probe;13093token probe ca cũ không cộng vào phiên này.

Pilot có Git base khác do fixture commit timestamp nên không dùng làm matched; baseline/Caveman patch SyntaxError, structured qua8/8. Một baseline handoff có SUCCESS/output nhưng CLI không thoát tới190s, bị timeout; không gọi clean success. Hai recovery vẫn fail: fence parser harness chưa trim trailing blank lines; kiểm độc lập trim chỉ để đọc thì revision là chuỗi `revision2` và patch vẫn SyntaxError, không tích hợp. Giữ toàn bộ fail trong pilot/recovery/inspection receipts, không âm thầm sửa output. Harness restart ban đầu gặp nothing-to-commit khi seed lại (không model call); đã giữ nguồn và sửa cách chuẩn bị matched cùng base. EROFS log là cache/conversation/artifact persistence dưới mount chỉ đọc, không phải bằng chứng auth/model agy hỏng. Review đề xuất bỏ2s kill escalation hoặc normalize source pin bị PM loại; review cuối không có lỗi mới tái hiện được. Raw runtime chỉ `/tmp/am-agy-20261024-114659`, receipt lưu hash và usage nhưng bỏ conversation ID/raw stderr.

**Bảo toàn/quyền:** HEAD1b56f4d/branch cũ; mọi thay đổi local. Có sẵn nhiều file dirty từ ca trước; chỉ chỉnh thêm bin/task-skills, cli-discovery, task-skills, tests liên quan và tài liệu/evidence cần thiết. File khác nguyên byte so snapshot đầu; không reset/clean/commit/push/merge/release, chạm app3000/phòng thật/public endpoint, OAuth/settings global, đổi model/provider hoặc nới guard. Bwrap mount host read-only, scratch riêng; không tuyên bố cách ly đọc/mạng.

**Điểm dừng và bước tiếp:** review hữu ích đã có, model handoff/reference/patch được kiểm thật, lỗi phạm vi đã sửa và source regression đạt. Dừng sớm. Không cần giám đốc cấp quyền hoặc xử lý thao tác thường nhật. Nếu mở lát cắt mới, giám đốc chỉ cần chốt mục tiêu task thực để đo công vận hành so direct CLI; chưa có căn cứ xây adapter/graph hoặc chọn Caveman từ mẫu CSV này. Native agy skill/MCP/write, human UX, đa-provider và lợi ích ròng/billing vẫn open; không dùng khoảng trống đó để tuyên bố đã nghiệm thu hoặc tự mở rộng phạm vi.

## Lệnh đã thực thi — tiếp với agy, hạn 16:30 ngày 2026-10-24 +07

**Lệnh mới nhất của giám đốc:** “viết bàn giao đi, làm việc đến giờ như cũ”. Phiên sau đọc mục này, kiểm workspace và **thực thi ngay phần nhiệm vụ còn thiếu**, không chỉ nạp rồi chờ. Lệnh mới thay trạng thái dừng của ca 09:28–10:08 bên dưới. Hạn giữ nguyên **16:30 ngày 24/10/2026, Asia/Bangkok (UTC+07)**, không tự cộng thêm giờ hoặc dời sang ngày khác. Lượt chuẩn bị bàn giao kiểm clock lúc **11:45:19 +07**, còn trong hạn; chỉ cập nhật context, không khởi động ca triển khai mới trong lượt viết bàn giao. Phiên sau ghi T0 thực và thời lượng riêng; không cộng khoảng chờ/ca cũ thành giờ làm. Đạt đủ nghiệm thu thì báo và dừng sớm; nếu mở sau hạn, báo để nhận mốc mới.

**Mục tiêu tiếp nối:** hoàn tất bằng chứng thật cho lát cắt nhận task → nhận quy tắc/skill đúng phạm vi → tìm/nạp reference → dùng tool được phép → giao tiếp đủ ý → kết quả kiểm chứng, tận dụng source local đã có. Khoảng trống hiện tại là independent scout/review và so sánh model thật: ca trước mới chứng minh API/MCP/browser bằng fixture, ba mẫu giao tiếp do PM soạn; chưa chứng minh model áp dụng skill, chất lượng hoặc lợi ích ròng. Không tự mở toàn bộ backlog, marketplace, graph, UI editor hoặc adapter mới chỉ vì còn thời gian.

**Runtime đã kiểm, dùng ngay đúng việc:** `/home/theo/.local/bin/agy`, requested model **`gemini-3.8-flash-low`**, PM vừa gọi thật trả exit 0 / `SUCCESS` / `ANTIGRAVITY_OK`, CLI duration 5.1067s, usage 13087 input + 6 output = 13093 tokens. Receipt: [agy-probe](evidence/task-skills/agy-probe.json). Không cần probe chào hỏi lại để đủ thủ tục; bắt đầu bằng scout/phản biện/review hữu ích, có task ID, source/base, phạm vi, đầu ra, nghiệm thu, timeout/retry. Actual model vẫn unknown nếu output không có machine identity field; ghi usage của mọi lượt và chi phí unknown đúng nhãn. Không đổi model âm thầm.

Gemini CLI riêng `.local-tools/gemini-cli` lỗi `UNSUPPORTED_CLIENT`/refresh `EROFS` **không phải lỗi agy**. Không yêu cầu giám đốc cung cấp runtime khác trước khi tự kiểm đường agy đã có. Phân biệt CLI hoạt động với tích hợp Agent Meeting: `src/task-skills.js::prepare` hiện từ chối policy trên adapter khác Claude; `src/runtime.js` chặn agy taskContextFile và write. **Được dùng agy trực tiếp cho công việc phát triển/scout/review trong quyền đã giao, không bắt xây adapter sản phẩm trước.** Không bỏ guards để làm demo thành công hoặc nhận agy đã hỗ trợ managed skill/MCP/write.

**Thứ tự PM tự thực thi:**
1. Đọc AGENTS, mục hiện trạng/bằng chứng bên dưới, `docs/GEMINI-WORKFLOW.vi.md`, `docs/ROUTING-WORKFLOW.vi.md` và phần security liên quan. Đối chiếu source freeze/Git hiện tại, giữ mọi thay đổi local. Giao ngay agy một lượt review chỉ đọc về đường task-skill/runtime hiện có, mất ý, quyền, stale/source/retry và overhead; PM kiểm từng phát hiện trên source tích hợp. Review có `SUCCESS` nhưng denied actions hoặc không có phân tích hữu ích chưa được coi là hoàn tất.
2. Khép phần so sánh còn thiếu bằng các lượt model thật có giới hạn: cùng task/đầu vào/acceptance/requested model cho baseline hiện tại, quy tắc ngắn có cấu trúc và Caveman đúng source pin. Giữ ID, điều kiện/phủ định, literal code/command/path/error, evidence/unknowns và bước tiếp; có lỗi/khôi phục và downstream kiểm được. Có thể yêu cầu model trả kết quả/patch như dữ liệu rồi PM áp dụng và chạy test; không cần quyền worker ghi source. Tách bằng chứng trực tiếp qua agy với managed application, không gọi đó là tích hợp native skill/MCP nếu chưa chạy được. Không dùng ba mẫu PM soạn làm model A/B, không thay kết quả fail hoặc unknown bằng demo dựng.
3. Với hành trình sản phẩm, tái sử dụng task/API/MCP/catalog hiện có, kiểm điểm nghẽn thực còn lại do review/tái hiện chỉ ra. Nếu cần sửa, chọn thay đổi nhỏ nhất để task đi tới kết quả với ít công vận hành hơn ở chất lượng tương đương; tự tích hợp và kiểm source cuối. Giữ phân biệt available/selected/supplied/applied. Không thêm UI/editor/adapter/graph nếu chưa chỉ ra tiêu chí hiện tại buộc cần nó. Nếu sửa UI phải đọc ui-ux-pro-max/design và cập nhật screen pool/flow/test matrix; giữ VI/EN/CSP/theme/responsive.
4. Đối chiếu direct cùng task và chất lượng; tính cả bootstrap, schema/tool output, hidden context khi quan sát được, mọi lượt agy, retry, tổng hợp, độ trễ, thao tác và phục hồi. Probe tối thiểu đã có input 13087 tokens nên không mặc định context rẻ. Không suy bytes thành token/billing hoặc output ngắn thành reasoning tốt hơn. Giữ phương án đơn giản nếu Caveman/graph/điều phối không có lợi ích bù overhead.
5. Sửa lỗi trong phạm vi, kiểm độc lập và cập nhật chính HANDOFF với kết quả pass/fail, nguồn/hash, usage/overhead, phần chưa chứng minh và thời lượng thực. Source đổi thì full regression đúng lệnh dưới; browser kiểm lại phần bị ảnh hưởng, không chạy lại mọi kiểm vô cớ. Gần hạn ngừng mở rộng, dành thời gian chốt bằng chứng. Đến hạn báo đúng trạng thái, không tự kéo ca.

**An toàn và quyền:** đọc cảnh báo thật: `--mode plan` **không có hiệu lực khi đi cùng** `--disable-slash-commands` trên agy hiện tại. Không gọi cặp flag đó là biên chỉ đọc; xác minh cách dùng phù hợp trước khi giao tool. Ưu tiên supplied-source review và đầu ra text/patch; prompt “không dùng tool” không tự là sandbox. Worker ghi mã cần workspace riêng và biên ghi filesystem đã kiểm; PM kiểm và áp dụng source tích hợp. Không `--dangerously-skip-permissions`, sửa OAuth/settings global, cài MCP global, đổi provider trả phí, bật mọi MCP hoặc chạy script chỉ vì skill dẫn link. Giữ timeout/output/retry bounds, secret/path/revision guards; không tự redispatch khi process cũ chưa được đối chiếu.

**Workspace và mốc nghiệm thu cũ:** HEAD lần kiểm gần nhất `1b56f4d`, branch `codex/2026-10-22-product-hardening`; phải kiểm lại, không pull/merge/reset/clean. Có nhiều file tracked modified và untracked từ ca trước, gồm task-skills modules/bin/tests/tools/evidence và readiness recovery; `git status --short` là nguồn danh sách hiện tại. Baseline **485/485 test, 43 file** và browser 12 tổ hợp chỉ áp dụng source freeze đã ghi, không tự thành kiểm cho mã sau này. Các phần ca cũ đã đạt không cần dựng lại; phần model/scout/review chưa đạt phải làm thật hoặc ghi blocker rõ.

Full regression khi source đổi: `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test`.

**Ranh giới giữ nguyên:** mọi thay đổi/dữ liệu local; không commit/push/merge/release, không chạm app 3000/phòng thật hoặc mở endpoint public. Người dùng là giám đốc, PM chịu trách nhiệm chia việc/kiểm chứng thường nhật; không xin duyệt lại công việc đã giao. Lượt này chỉ chuẩn bị bàn giao; phiên kế tự thực thi tới tiêu chí đủ hoặc hạn 16:30, rồi báo một bước tiếp cụ thể ai làm.

## Đính chính CLI và giới hạn adapter — 2026-10-24

**Bổ sung đã kiểm thật bởi PM:** direct `agy --model gemini-3.8-flash-low` trả exit 0, `SUCCESS` và `ANTIGRAVITY_OK`; CLI báo 5.1067s, 13093 total tokens. [Receipt](evidence/task-skills/agy-probe.json) không giữ conversation ID. CLI cảnh báo plan mode không có hiệu lực khi disable slash commands; không dùng probe tối thiểu này để nhận sandbox/quyền hoặc adapter skill/MCP/write đã nghiệm thu. Đường inference agy trực tiếp hoạt động, PM không cần yêu cầu giám đốc cung cấp runtime khác.

**PM nhận sai sót của ca trước:** lỗi Gemini CLI riêng được ghi đúng, nhưng PM đã dừng nhánh scout/review và yêu cầu giám đốc cung cấp đường Gemini mới trước khi kiểm `agy` cùng bằng chứng sẵn có. Đó là thiếu sót điều tra và giao việc, không phải bằng chứng Antigravity không hoạt động. Kết luận cuối ca về việc cần giám đốc cấp lại đường runtime được thay bằng quy tắc dưới đây.

**Antigravity CLI không bị xác nhận là không dùng được.** Kiểm trực tiếp lần này: `/home/theo/.local/bin/agy --help` và `agy models` thành công, có `gemini-3.8-flash-low`; không gọi inference mới. User báo probe trả `SUCCESS`/`ANTIGRAVITY_OK`; receipt agy lịch sử trong `evidence/shift-20261022/readonly-audit/agy-receipt.sanitized.json` cũng ghi `SUCCESS`. Requested ID không đồng nghĩa actual model đã xác minh.

Lỗi `UNSUPPORTED_CLIENT`/refresh OAuth `EROFS` ở ca task-skills bên dưới thuộc **Gemini CLI riêng**, không phải bằng chứng agy hỏng. Source hiện chặn agy riêng ở task-skill MCP (`taskContextFile`) và chế độ ghi (`write:true`); giữ các guard này. Xem [quy tắc kiểm runtime](GEMINI-WORKFLOW.vi.md#đính-chính-runtime--2026-10-24). Khi tiếp tục, PM tự kiểm đường CLI phù hợp trong quyền/ngân sách hiện có, không yêu cầu user cấp lại đường hoạt động chỉ vì một CLI khác thất bại. Chưa có yêu cầu triển khai adapter mới trong lần đính chính này; không commit/push hay sửa mã runtime.

## Đã chốt — skill/tool theo task local, 2026-10-24

**Trạng thái ca trước (lịch sử):** đã thực thi và dừng sau khi kiểm phần local/API/MCP/fixture; lệnh thực thi tiếp mới nằm ở đầu tài liệu. Không coi lệnh lịch sử là ca mới hoặc tự chạy tiếp cho đầy hạn 16:30. T0 **09:28:02 +07**, chốt **10:08:48 +07**, thời lượng **40 phút 46 giây**; dữ liệu thời gian ở [timing](evidence/task-skills/timing.json). Thời lượng là khoảng làm việc và kiểm chứng thực của phiên, không nhận 7 giờ hoặc cộng ca cũ/chờ reset.

**Pain point và phần đã làm:** catalog CLI có sẵn nhưng WorkManager chưa cấp guide/tool theo task. Đã nối host task API hiện có: chọn required/optional IDs và grant riêng → pin nguồn/hash → required supplied mỗi attempt, optional metadata/load qua MCP chỉ đọc → handoff giữ ID/điều kiện/evidence/unknowns → failed check/restart/explicit retry → verified → integrated. Task không liên quan không nhận catalog/guide. Đây là hợp đồng supply/tool đã kiểm bằng fixture; chưa có người dùng thật chứng minh tần suất pain point hoặc lợi ích model. Scope chỉ direct local managed Claude; **UI chưa có policy editor**. agy/remote/team-swap từ chối policy; CLI ngoài join không bị app kiểm soát context/tool. Selected/supplied không chứng minh applied/compliant; handoff ghi `applied: not-observed`.

**Bằng chứng source tích hợp:** [ACCEPTANCE](evidence/task-skills/ACCEPTANCE.vi.md), [verification](evidence/task-skills/verification.json), [source freeze](evidence/task-skills/source-freeze.json), [journey](evidence/task-skills/journey.json), [browser](evidence/task-skills/browser.json), [giao tiếp](evidence/task-skills/communication.json). Full cuối **485/485 test, 43 file**, đúng giới hạn memory 1200M/swap 0/timeout 900. Browser 12 tổ hợp VI/EN × light/dark × 375/768/1280: repeated expiry → probe fail/success → explicit Run → failed verification → retry → verify → integrate; Back/reload/deep link/admin return giữ task/revision và 8 checks source. Đã kiểm nguồn ignored đổi/thiếu, symlink, deny, duplicate, bounds và script chỉ đọc như dữ liệu. Expiry dùng backdate, không nhận 30 phút thực. MCP calls/patch do script quyết định, không phải model choice/human acceptance. Đã đọc/query UI skill về Error Recovery/Error Messages, xem ảnh mobile VI/kết quả EN; không thêm screen/design system.

**Baseline và overhead:** source baseline là HEAD `1b56f4d` archived, cùng CSV/8 checks/output hashes. Một workaround baseline đọc/discover 4 lượt rồi chép 2 body vào Facts; bản mới không chép body. Không nhận đó là thao tác bắt buộc của mọi CLI/người dùng. Hai prompt tăng **5019 → 7569 UTF-8 bytes**; MCP thêm 1192 request + 4170 response bytes, schema 654 bytes/process. App baseline 1335.55ms, bản mới 1407.49ms; direct Node 718.98ms, nhưng timer/lifecycle khác và chỉ một mẫu. Direct nhanh hơn trong fixture; **chưa chứng minh lợi ích ròng, giảm token/billing hoặc thời gian người thật**. Host vẫn phải chọn phạm vi/IDs, save policy khi nguồn đổi; thêm chi phí context/MCP/bảo trì. Token PM/Gemini/model, hidden context, cache/billing đều unknown/null; không suy bytes thành billing.

**Caveman và graph:** review text/license, pin Caveman commit `bae9beaf3aa6dc509f05f3d3ed239c827f6e51bb` và SHA đầy đủ trong ACCEPTANCE, Apache-2.0, lưu tại `.local-tools/caveman-eval`. Không cài skill/hook/proxy/global; AGENTS ghi rõ nguồn và phạm vi. Ba mẫu do PM soạn giữ đủ trường, downstream fixture đạt 8/8; negative control mất `not` bị bắt. **Không phải ba inference/model A/B.** Output 850/618/541 bytes, instruction 80/261/4678 bytes; giữ rule ngắn có cấu trúc, không chọn Caveman mặc định khi chưa chứng minh lợi ích. Catalog nhỏ/link rõ chưa buộc dùng graph; không cài/index graph hoặc lấy README vendor làm benchmark.

**Gemini và thất bại:** [attempt](evidence/task-skills/gemini.json). CLI ban đầu không có; đã cài official 0.65.0 local với ignore-scripts, không thành dependency runtime/global install. Giao scout `SKILL-SCOUT-01` với source/output/acceptance/timeout 180s; requested `gemini-3.8-flash`, actual unknown. Sau khoảng 3.757s, exit 55: `UNSUPPORTED_CLIENT` cho Code Assist; refresh OAuth bị mount chỉ đọc chặn `EROFS`. Prompt chuẩn bị 55067 bytes, không có scout/review/model output; usage/cost unknown. Không chuyển model/provider, migrate hoặc sửa OAuth/settings global. **Review Gemini độc lập chưa hoàn thành**; không gọi lặp lỗi terminal cho đủ quy trình. npm báo install 13s/7 package, bundle local khoảng 71MiB là overhead phát triển.

Full đầu **469/485**, 16 fail do guard skill chưa tương thích run cũ thiếu `requirementSnapshot`, kéo theo verify/cancel/shutdown. Đã sửa no-policy no-op, giữ log fail và kiểm targeted 19/19 rồi full 485/485. Nhóm runtime + skill đầu 20/21 do secret fixture dùng mẫu detector không nhận; đã chỉnh fixture đúng pattern, không nhận lọc mọi secret. Circular import mới được bỏ bằng lazy connect trong doctor.

**Bảo toàn và giới hạn:** HEAD/branch không đổi; giữ thay đổi local trước phiên và thêm source/evidence chưa commit. Không commit/push/merge/release, chạm app 3000/phòng thật/public endpoint hoặc OAuth/settings global. Fixture dùng random loopback/temp data, đóng/xóa sau kiểm. Chưa chứng minh semantic compliance, multi-CLI quality, native Claude MCP invocation, atomic filesystem/read/network isolation, human UX hoặc lợi ích billing. Đã kiểm help flags của CLI, không đồng nghĩa live acceptance. Giới hạn chi tiết trong ACCEPTANCE.

**Bước tiếp (đã đính chính):** PM tự kiểm và dùng `agy` trực tiếp cho scout/review chỉ đọc trong nhiệm vụ, quyền và ngân sách đã giao; không coi giới hạn adapter sản phẩm là cấm dùng CLI phát triển. Kiểm help/models/evidence trước, nêu requested model và chỉ probe có giới hạn nếu còn thiếu bằng chứng. Không yêu cầu giám đốc cấp lại runtime chỉ vì Gemini CLI riêng lỗi. Task-skill policy/MCP và write qua adapter `agy` vẫn chưa được hỗ trợ/kiểm chứng; không tự mở guard hoặc nhận đã nghiệm thu. Lần đính chính này chỉ sửa tài liệu, không tự mở lại ca đã đóng hay triển khai adapter.

## Lệnh ca vừa thực thi — skill/tool theo task, hạn 16:30 ngày 2026-10-24 +07 (lịch sử)

**Lệnh mới nhất của giám đốc:** giao phiên kế thực thi ngay, làm kỹ thay vì nhanh, làm đến **16:30 ngày 24/10/2026, Asia/Bangkok (UTC+07)**; hoàn thành đủ sớm thì báo kết quả và dừng, không kéo việc cho đầy giờ. Lượt viết bàn giao kiểm clock lúc09:26:19 +07, chỉ chuẩn bị context, chưa khởi động ca triển khai mới. Phiên kế ghi T0 thực/deadline và thời lượng; không cộng thời gian chờ/reset thành giờ làm. Dành thời gian trước hạn cho tích hợp, bằng chứng và bàn giao; đến hạn chốt đúng trạng thái, không tự vượt như ca trước. Nếu mở phiên sau deadline thì không âm thầm dời sang ngày khác/mở timebox mới: báo mốc đã qua và xin mốc mới. Đây là nhiệm vụ thực thi đã giao, thay trạng thái chỉ nạp rồi chờ của prompt trước; các ca60/30/90phút/8h bên dưới là lịch sử.

**Vai trò và pain point:** người dùng là giám đốc, agent là PM chịu trách nhiệm ưu tiên/triển khai/kiểm chứng. Giả thuyết hiện tại: CLI được nối vào sản phẩm vẫn phải được nhắc tay để tìm skill, giữ đủ ý khi giao tiếp và lấy MCP thích hợp; catalog có nhưng chưa thành một đường dùng ngắn. Trước sửa, tái hiện nhỏ nhất trên source/workspace đang có, ghi chỗ người vận hành phải làm tay và thông tin dễ mất. Không coi việc có skill, tên model hoặc graph là năng lực đã hoạt động.

**Lát cắt được giao:** triển khai trọn một hành trình **nhận task → nhận quy tắc chung/skill bắt buộc đúng phạm vi → tìm và nạp skill/reference tùy nhu cầu → dùng tool/MCP đã cấp → trao đổi ngắn mà đủ ý → tạo kết quả có bằng chứng**. Dùng cơ chế catalog/config/task/runtime sẵn có, không dừng ở báo cáo nghiên cứu hoặc dựng admin giả. Chỉ thêm phần nền và điều khiển admin cần ngay để quản lý trạng thái skill bắt buộc/tùy chọn và quyền tool của luồng này; không xây marketplace, fleet manager hoặc framework agent tổng quát. PM tự chọn điểm vào nhỏ nhất sau tái hiện, không đẩy phân tích/chia việc về giám đốc.

**Ranh giới thiết kế cần giữ:**
- Skill là hướng dẫn; phân biệt available, selected, supplied và việc áp dụng đã quan sát. Không gắn nhãn “enforced/compliant” chỉ vì đã chèn prompt. Bắt buộc thực thi quyền ở runtime/server khi kiểm được; nội dung ngữ nghĩa phải kiểm bằng kết quả, không giả bảo đảm.
- Phân biệt worker do app khởi chạy với CLI bên ngoài đã join phòng. Không tuyên bố admin kiểm soát toàn bộ tool/context của CLI bên ngoài; hiển thị phạm vi/unsupported rõ. `src/runtime.js` hiện chỉ claude/agy; Claude managed dùng MCP config rỗng. `connect` đăng ký MCP hội thoại, không tự cài skill. Không bật mọi MCP hoặc thừa hưởng settings global âm thầm.
- Bootstrap ngắn, không nhét cả catalog/guide vào mọi phiên. Skill bắt buộc trong task được cấp chủ động; skill tùy chọn chỉ metadata và lấy nội dung đúng nhu cầu, ưu tiên một đường lookup/load ngắn. Giữ nguồn/phiên bản/hash và xử lý file đổi/thiếu, giới hạn output, không đọc lại đoạn đã cấp. Skill không tự cấp quyền tool, không thực thi script chỉ vì link trong Markdown; giữ secret/allowlist/path/revision guards.
- Giao tiếp ngắn nhưng phải giữ task ID, mục tiêu/phạm vi, điều kiện/phủ định, kết quả, evidence, unknowns và bước tiếp khi có. Không nén code/command/path/error hoặc đổi nội dung người dùng. Không ép kiểu “nói cụt” lên mọi output, tài liệu hoặc cảnh báo.

**Caveman và graph — thử có đối chứng, không mặc định cài cả bộ:** so hiện tại với quy tắc ngắn có cấu trúc và Caveman skill đúng phiên bản, trên cùng task/đầu vào/acceptance. Nguồn đã xem: `https://github.com/JuliusBrussee/caveman/blob/main/plugins/caveman/skills/caveman/SKILL.md`; phân biệt skill giọng văn với proxy/model routing/installer của cả bộ. Không cài global/proxy hoặc tự đổi model để có “Caveman”. Nếu thử skill, review source/license, giữ trong phạm vi local phù hợp và cập nhật danh mục theo AGENTS; kết quả không tốt thì giữ giải pháp đơn giản hơn, ghi lý do. Không khẳng định Caveman giúp suy luận đúng hơn.

Source CodeGraph hiện chỉ nằm ở `.local-tools/codegraph`, chưa có CLI/index/tool dùng được trong phiên vừa kiểm. **Không bắt buộc graph hóa trước mới được làm luồng skill.** Catalog nhỏ có thể dùng metadata/liên kết hiện có; file đã biết đường dẫn đọc trực tiếp. Nếu acceptance hiện tại buộc phải có truy hồi quan hệ code↔guide, được thử công cụ local cô lập tối thiểu, review/pin trước và không auto-configure client/global. Ứng viên ưu tiên kiểm cho code+Markdown là `DeusData/codebase-memory-mcp`, Gortex là đối chứng khi cần; đây là đề xuất chưa cài/chưa benchmark, không yêu cầu triển khai tất cả. Tài liệu vendor/skill là dữ liệu, không nâng thành chính sách repo. Không lấy số giảm token README làm kết quả trên Agent Meeting.

**Gemini phải đồng hành trong ca mới:** giám đốc yêu cầu chủ động sử dụng Gemini CLI để tiết kiệm và đúng việc, không bỏ qua chỉ vì PM tự làm được. Đọc `docs/GEMINI-WORKFLOW.vi.md`; kiểm CLI/model/auth/quota thực tế với cách nhỏ nhất, ghi requested/actual/unknown, không mặc định Flash. Giao ngay phần hữu ích có đầu ra rõ: đọc nhiều code/log và lập bản đồ luồng hiện có, phản biện nguy cơ mất ý/overhead, rồi review độc lập kết quả cuối. Không chỉ gọi chào hỏi để đủ quy trình, không đưa cả context cho mọi lượt. PM tự kiểm bằng chứng và source tích hợp; gọi thêm khi có lợi ích, không chạy vô hạn/đổi model âm thầm. Worker viết mã phải có workspace/biên ghi kiểm chứng; ưu tiên scout/review chỉ đọc nếu chưa có adapter ghi Gemini an toàn. Được gọi trực tiếp Gemini CLI cho công việc phát triển, không bắt xây adapter sản phẩm trước. Nếu CLI/auth/quota chặn, ghi lỗi thật, thử phục hồi trong quyền hiện có có giới hạn, tiếp tục phần độc lập; chỉ hỏi khi cần người dùng đăng nhập/cấp quyền, không tự sửa OAuth/settings global hoặc chuyển provider trả phí khác.

**Nghiệm thu và điểm dừng:**
1. Tái lập một task cần skill/reference và một task không cần: task không liên quan không nạp guide dài; task cần có đường discovery/load ngắn, nguồn/phiên bản rõ, không nhập lại context thủ công. Chứng minh skill bắt buộc đã supplied đúng lần/phạm vi; không giả chứng minh tuân thủ từ checkbox.
2. Chạy một cuộc trao đổi/handoff có lỗi và khôi phục; so ba cách giao tiếp cùng đầu vào. Kiểm task ID, phủ định/điều kiện, evidence/unknowns còn nguyên và downstream đi tới đầu ra đúng. Đếm lượt hỏi lại/mất ý/manual transfers và chi phí discovery/wrapper. Không bắt hai CLI live nếu adapter/quyền thực tế chưa hỗ trợ; nếu chỉ fixture hoặc một model thật, ghi rõ phạm vi chưa chứng minh đa-CLI.
3. Tool/MCP được phép dùng được trong phạm vi đã hỗ trợ; bị cấm/thiếu/stale trả lỗi và bước phục hồi rõ, không tự cấp quyền. Có kiểm failure/retry/source đổi; giữ task/revision/draft/evidence và không tự redispatch nguy hiểm. Không cần cài dịch vụ ngoài chỉ để test allow/deny; fixture MCP cô lập được dùng khi phân biệt rõ với MCP thật.
4. Kiểm source tích hợp, không chỉ worker báo xong. Nếu có UI/admin: đọc skill ui-ux-pro-max và design hiện có, cập nhật screen pool/flow/ma trận trong tài liệu hành trình, giữ VI/EN/CSP/theme/responsive; browser task→config→run→failure/recovery→result, Back/reload/deep link. Khép kiểm browser readiness còn thiếu của source local cũ trong phần bị ảnh hưởng, không làm lại mọi test cũ vô cớ.
5. Chạy kiểm phù hợp và full regression khi source thay đổi theo lệnh giới hạn bộ nhớ dưới đây. So baseline cùng chất lượng; token thật nếu runtime có usage, nếu chỉ bytes/ước lượng thì ghi đúng nhãn. Tính input/output, schema, retry, tổng hợp và token Gemini, độ trễ/công vận hành; không chỉ báo output ngắn. Lưu nguồn/version/hash, kết quả fail lẫn pass, overhead và unknowns. Không có human UX acceptance thì ghi self-review/model/fixture.

**Workspace/quyền/bảo toàn:** trước sửa đọc AGENTS.md, mục này, `docs/CONSISTENCY-JOURNEYS.vi.md`, `docs/ROUTING-WORKFLOW.vi.md`, phần liên quan CONTRIBUTING/SECURITY/SECURITY-DESIGN và HANDOFF-ui-reform nếu UI. HEAD gần nhất main1b56f4d trên branch codex/2026-10-22-product-hardening; kiểm thực tế, không tự Git merge/pull/reset/clean để đồng bộ. Nhiều thay đổi local cần giữ: AGENTS, CHANGELOG, HANDOFF, CONSISTENCY-JOURNEYS, src/work.js, src/ui/workspace.js/css, test/work.test.js và file untracked docs/GEMINI-WORKFLOW.vi.md, evidence/readiness-recovery, test/ui-access-recovery.test.js, tools/check-access-recovery.js. Baseline cũ473/473 chỉ áp dụng source đã seal, không coi là kiểm cho mã mới. Không commit/push/merge/release, sửa OAuth/settings global, đụng app3000/phòng thật hoặc mở endpoint public. Quyền Gemini thay giới hạn cũ đối với Gemini; không gọi thêm provider trả phí/agent ngoài phạm vi được giao. Giữ Node>=18, vanilla UI, không dependency runtime mới nếu không cần cho lát cắt. Công cụ phát triển local không tự trở thành dependency sản phẩm.

Full regression: `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test`. Không dùng đủ thời gian bằng sleep, không chạy test lặp khi source không đổi mà không có nghi vấn mới. Cập nhật tiến độ theo phát hiện/rủi ro; gần hạn ngừng mở rộng để chốt. Cuối ca cập nhật chính HANDOFF, bằng chứng dùng lại được, thời lượng thật, phần xong/chưa xong và một bước tiếp cụ thể ai làm; báo sớm nếu đủ nghiệm thu, không tự kéo sau16:30. Nhiệm vụ của PM là hoàn tất lát cắt đã chứng minh, không chỉ tạo thêm config/screen/test rồi tự tuyên bố sản phẩm tốt.

## Nạp hướng dẫn theo nhu cầu — 2026-10-24

Đã rút hướng dẫn Gemini trong AGENTS.md xuống một bullet quyền + đường dẫn; chi tiết chuyển sang `docs/GEMINI-WORKFLOW.vi.md`, chỉ đọc khi cân nhắc dùng Gemini. File Markdown đã biết vị trí có thể đọc trực tiếp; CodeGraph dùng cho tìm code/quan hệ khi runtime/index có sẵn, không bắt mọi lần đọc phải đi qua graph. Kiểm phiên này: source vendor có ở `.local-tools/codegraph`, nhưng không có executable `codegraph` trên PATH, không có thư mục `.codegraph` ở repo, không có tool CodeGraph trong danh mục phiên; vendor cũng chưa có `dist`/`node_modules`. Chưa cài/build/index hoặc sửa settings global; chưa đo tiết kiệm context. Không nhận công cụ đang hoạt động chỉ vì có source. Phiên kế chỉ nạp hướng dẫn liên quan nhiệm vụ; nếu được giao kích hoạt CodeGraph, làm local và kiểm retrieval trước khi tuyên bố dùng được.

## Quyền cập nhật — Gemini CLI, 2026-10-24

Người dùng cho phép chủ động dùng Gemini CLI rộng rãi vì đây là tài khoản có ngân sách token dồi dào nhất của họ. Thay giới hạn không gọi model/thêm agent của ca cũ đối với worker Gemini CLI; không phải quyền gọi mọi provider, sửa OAuth/settings global hoặc commit/push/merge/release. AGENTS.md giữ một bullet quyền và dẫn tới `docs/GEMINI-WORKFLOW.vi.md` chứa phạm vi/quy tắc dùng chi tiết. Chưa xác minh model/quota/runtime thực tế; profile mặc định Flash disabled/unverified, không đồng nhất với CLI đang cài. Lượt này chỉ kiểm catalog và cập nhật tài liệu, chưa gọi model hoặc mở lại ca phát triển. Khi có nhiệm vụ tiếp, PM tự xác minh CLI/model rồi giao việc phù hợp; không cần xin lại quyền mỗi lượt Gemini.

## Đã chốt — readiness/phục hồi local, 2026-10-23

Ca60phút và lượt bổ sung30phút đã đóng; mục giao việc bên dưới là lịch sử, không tự mở lại. Đã sửa blocker thiếu/hết hạn model access: lỗi riêng + explicit probe tại task, giữ profile/revision, yêu cầu explicit Run; routing/budget không dẫn sai sang probe. Không auto gọi CLI. Mã mới chưa commit/push.

Bằng chứng/overhead/thất bại/giới hạn: [ACCEPTANCE](evidence/readiness-recovery/ACCEPTANCE.vi.md), [verification](evidence/readiness-recovery/verification.json), [source hashes](evidence/readiness-recovery/source-freeze.json). Full cuối **473/473**, 42file; API fixture cùng CSV/8acceptance với baseline/direct, đi tới integrated và test source8/8. UI self-review giảm7→2thao tác sau block, chưa human acceptance. Direct Node fixture nhanh hơn; chưa native CLI/model A/B, chưa chứng minh tiết kiệm token/billing/lợi ích ròng. Browser cuối chưa lặp sau chỉnh nhãn pending/xóa success cũ; VM13tests và API cuối đã kiểm. TTL dùng backdate, chưa wall-clock30phút.

Giữ thay đổi HANDOFF có sẵn và dữ liệu; không additional agent/model trả phí/OAuth/global settings/publish. HEAD local đã fast-forward tới main1b56f4d (không commit merge mới); không tái sử dụng thao tác này như quyền merge. T0 13:30:48; đoạn đầu quan sát tới~14:11; reset/gap không tính work. Nối lại20:32:45, deadline21:02:45, đóng 21:11:13 +07 (38phút28giây, vượt8phút28giây). Không nhận90phút liên tục. Raw /tmp đầu đã mất; evidence rerun lưu repo.

Bước tiếp cụ thể nếu được giao phiên mới: PM tự kiểm browser trên source hash cuối từ repeated expiry→probe→Run→verify→integrate và Back/reload; không mở model/adapter/backlog. Giám đốc chưa cần quyết định/cấp quyền thêm; hiện dừng.

## Phiên tiếp theo — 60 phút sửa hành trình readiness/phục hồi (đã giao, 2026-10-23)

**Lệnh mới nhất:** người dùng giao phiên sau làm **1 tiếng**, tiếp tục lát cắt readiness/phục hồi được đề xuất ngay bên dưới. Phiên đang viết mục này chỉ chuẩn bị bàn giao, **chưa bắt đầu60 phút**. Phiên sau đọc AGENTS và mục này, kiểm workspace/source tích hợp rồi **thực thi ngay**; không chỉ nạp context rồi chờ, không yêu cầu giám đốc chia việc. Lệnh này thay trạng thái “mới đề xuất/nạp rồi chờ” trước đó, không mở lại ca90phút/8h.

**Mục tiêu:** người vận hành đã có coding CLI nhưng bị chặn khi khởi chạy/retry vì profile/adapter/quan sát truy cập chưa sẵn sàng hoặc đã hết hạn. Tái hiện một điểm khiến họ phải đọc catalog/JSON, nhập lại điều kiện hoặc nhờ maintainer để biết bước khôi phục; sửa nhỏ nhất để đi tới kết quả kiểm chứng được. Đây là giả thuyết cần kiểm, không nhận đã quan sát mọi lỗi. Đọc source/luồng hiện có trước; ưu tiên một lỗi có thật trong hành trình này, không mặc định thêm adapter/model hay viết lại UI. Nếu readiness đã có đường khôi phục đủ, kiểm ca biên gần nhất (đổi revision/hết hạn/reload/retry); không tạo lỗi hoặc tính năng giả cho đủ giờ.

**Nghiệm thu và điểm dừng:** cùng task/đầu vào/nguồn/acceptance ở trước/sau và baseline coding CLI trực tiếp; ghi thao tác bắt buộc, chuyển/nhập lại dữ liệu, lỗi và overhead. Một ca chặn có thông báo/bước tiếp đúng điều kiện, phục hồi tới verify→integrate và test trên source tích hợp; giữ task ID/revision/source/draft/evidence, không nhầm reported/verified/integrated, không tự probe trả phí hoặc redispatch khi process cũ chưa được đối chiếu. Kiểm cả ca thất bại/khôi phục và Back/reload/deep link liên quan. Dùng fixture/subprocess/HTTP/browser cô lập; nêu rõ không model/human acceptance. Không suy số byte/tool call thành token/billing hay tự tuyên bố lợi ích ròng. Nếu không đạt, bàn giao đúng ca đã thử, nguyên nhân và phần chưa chứng minh.

**Nhịp60 phút tính từ T0 thực của phiên sau:** ghi T0/deadline theo Asia/Bangkok khi bắt đầu;0–10phút kiểm context/workspace và tái hiện baseline/chốt một blocker;10–35phút sửa trọn phạm vi nhỏ;35–50phút kiểm tích hợp và xử lý lỗi;50–60phút chốt bằng chứng, thời lượng thực, overhead/thất bại/unknown và cập nhật chính HANDOFF. Không sleep lấp giờ hoặc mở feature mới cuối ca; đạt sớm thì kiểm các ca phục hồi trong phạm vi. Đến hạn chốt trạng thái thật và bàn giao, không tự kéo thành90phút/8h. Kết thúc có một câu ngắn đề xuất bước tiếp theo và rõ ai cần hành động.

**Nguồn/quyền:** main đã có merge1b56f4d; CI/installer sau merge đều SUCCESS, xem hiện trạng bên dưới. Kiểm Git thực tế, giữ bản sửa HANDOFF local này và dữ liệu có sẵn; đồng bộ source main an toàn trước khi phát triển, không reset/clean. Đọc thêm `docs/CONSISTENCY-JOURNEYS.vi.md`, `docs/HANDOFF-ui-reform.vi.md`; nếu sửa/review UI phải đọc skill `ui-ux-pro-max`, token/style hiện có, giữ VI/EN/theme/responsive/CSP. Đọc CONTRIBUTING/SECURITY/SECURITY-DESIGN khi liên quan. Kiểm phù hợp, full regression khi source thay đổi với giới hạn `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test`; không thêm dependency runtime. Không gọi thêm agent/model trả phí, sửa OAuth/settings global, đụng app3000/phòng thật hoặc mở endpoint public. **Không commit/push/merge/release trong ca mới nếu chưa có lệnh mới**; quyền admin bypass trước chỉ cho PR#1 đã merge, không tái sử dụng. Không làm toàn backlog hoặc xây lại Codex App. Phiên sau chịu trách nhiệm thực thi/kiểm chứng trong phạm vi, không tự giao phần việc thường nhật về giám đốc.

## Hiện trạng sau merge — 2026-10-23

**Đã hoàn thành phạm vi ca90 phút và đưa mã lên main; chưa giải quyết toàn bộ backlog/feedback.** PR [#1](https://github.com/ttat288/agent-meeting/pull/1) đã MERGED lúc **2026-10-23 13:05:36 +07**, merge commit `1b56f4db04d4135a66fcc329af89332eb21b9d3f`, từ head `f8a0b52368b5b93f7e9d621cb602dc45b45b4e0e`. Toàn bộ thay đổi local được bảo toàn trước đó, bản sửa retry, English capture, README/showcase và quy tắc câu đề xuất bước tiếp theo trong AGENTS đã được push. Source tree của merge commit khớp head đã kiểm. Workspace đang ở nhánh `codex/2026-10-22-product-hardening`; local `main` có thể còn cũ, `origin/main` đã fetch tới merge commit. Bản cập nhật bàn giao sau merge này đang local, chưa commit/push.

**Review/quyền:** đã self-review diff production so với main cũ: quyền PM/team, private history, revision/source guards, process quiescence/cancel/shutdown/rollback, bounded retry, UI draft/focus/navigation và CI; chưa phát hiện lỗi cần chặn merge trong phần đã đọc. [Review ghi trên PR](https://github.com/ttat288/agent-meeting/pull/1#pullrequestreview-5624545125) là self-review, không phải review độc lập hay audit bảo mật đầy đủ. GitHub từ chối tác giả tự Approve. Người dùng sau đó **cho phép admin merge, bỏ yêu cầu review đúng một lần cho PR#1**; đã dùng quyền đó, không thay protection (vẫn cần1approval + test18/20/22), không bật auto-merge. Không suy quyền bypass này thành quyền cho PR/lần merge khác. Không release/tag/npm publish; không gọi thêm agent/model trả phí hoặc sửa OAuth/settings global.

**Kiểm chứng:** head f8a0b52 đạt [CI Node18/20/22](https://github.com/ttat288/agent-meeting/actions/runs/39902858424) và [installer Linux/macOS/Windows](https://github.com/ttat288/agent-meeting/actions/runs/39902858363), sáu leaf jobs SUCCESS; ba job CANCELLED là lượt trùng cũ do concurrency, không phải test fail. Full local454/454 và15source/test/tool hashes vẫn áp dụng. Self-review chạy lại `node tools/check-retry-context.js` và `node tools/try-workflow.js`: cả hai exit0, source integrated, tests bất biến và ID/evidence qua restart; fixture, không model. Receipt rerun chỉ `/tmp/agent-meeting-self-review-{retry,workflow}.json`, không hứa lưu bền.

**CI riêng sau merge:** đã xác nhận [installer main](https://github.com/ttat288/agent-meeting/actions/runs/39909438365) SUCCESS và [CI main](https://github.com/ttat288/agent-meeting/actions/runs/39909438369) SUCCESS tại đúng merge commit1b56f4d. Đây là kết quả riêng sau merge, không suy từ head PR. Không mở automation theo dõi nền.

### Căn cứ chọn lát cắt60 phút đã giao ở đầu file

1. **Xác minh sau merge đã đóng:** CI main đã SUCCESS; phiên kế chỉ kiểm revision/trạng thái hiện hành, không tự chạy lại test khi source không đổi. Đồng bộ checkout từ main theo trạng thái workspace, giữ bản sửa local của tài liệu này; không reset/clean hoặc tự bỏ review cho lần mới.
2. **Lát cắt sản phẩm tiếp đáng chọn:** tái hiện hành trình người dùng đã có coding CLI nhưng không khởi chạy/retry được vì adapter/profile/quan sát model chưa sẵn sàng hoặc đã hết hạn. Pain point còn là giả thuyết cần quan sát: người vận hành có phải đọc catalog/JSON hoặc nhập lại dữ liệu để biết bước phục hồi không. Ưu tiên dùng nguồn readiness hiện có, không mặc định xây adapter mới.
3. **Đủ để dừng lát cắt mới:** một ca lỗi có bước phục hồi rõ trên bản tích hợp, giữ task/revision/source/draft/evidence, không tự gọi model hoặc báo done sai; đo thao tác cứu lỗi trước/sau với cùng đầu vào/acceptance và baseline trực tiếp. Dùng fixture/subprocess khi chưa có quyền model; không biến việc thiếu model A/B thành bằng chứng giảm billing hoặc lý do dừng mọi kiểm local. Chưa tái hiện được gap thì không thêm tính năng cho có.

Các mục model-quality/đa-provider/billing/human UX, multi-file integration, máy remote thứ hai/crash reconciliation và vận hành model dài vẫn **open/unknown** theo [bảng feedback](evidence/retry-context/ACCEPTANCE.vi.md#trạng-thái-feedback-sau-lát-cắt). Không mặc định xây lại Codex App hoặc làm toàn backlog. Ca90phút đã kết thúc90phút20giây; ca8h cũng là lịch sử. Không khởi động lại các timebox/lệnh cũ bên dưới. Lệnh mới nhất đã giao ca60phút ở đầu file: phiên sau thực thi ngay phạm vi đó; không dùng lại quyền xuất bản đã khép.

## Lịch sử — ca90 phút cải thiện sản phẩm từ đánh giá khách hàng (2026-10-23)

Các trạng thái “local/chưa commit/chưa có CI mới” và giới hạn Git trong phần ca bên dưới là **snapshot lúc chốt ca**, đã được thay thế bởi hiện trạng sau merge ở đầu file. Giữ nguyên để đối chiếu bằng chứng và thời lượng, không diễn giải thành việc chưa làm hoặc lệnh mở ca mới.

### Kết quả ca90 phút — kết thúc 11:35:16 +07, 90phút20giây thực

**T0 10:04:56; kết thúc 11:35:16 ngày23/10/2026 Asia/Bangkok; thời lượng thực 90phút20giây.** Ca đã kết thúc; không tự mở lại90phút hoặc ca8h. Phần triển khai đã dừng trước mốc cuối, thời gian chốt gồm QA/cleanup/bàn giao. Bản local chưa commit/publish; branch `codex/2026-10-22-product-hardening`, HEAD vẫn `f415cf46961ac43301083c4784fb216b68e87ac6`.

**Đã khép một blocker:** sau independent test fail, Run lại chỉ nhận prompt cũ; phải chép output vào Facts/Save để truyền lỗi. Nay explicit retry kèm bounded diagnostics từ latest independent failure khi task/requirement/**canonical source path**/Git base/source snapshot còn khớp. Không auto retry/đổi model/resume patch. Workspace vẫn fresh source copy; lỗi chỉ là untrusted clues từ candidate cũ. Tối đa4checks/<16KiB, detector secret trước cắt, cờ omission/truncation và provenance/hash/bytes; cap128KiB không bị nới. UI VI/EN nêu bước tiếp/cờ bỏ lỗi, không lặp hai khối fail. Đã sửa lỗi đổi locale replace cùng URL tìm được trong QA; query giữ ngôn ngữ, draft/view vẫn còn.

**Bằng chứng chính:** [ACCEPTANCE.vi.md](evidence/retry-context/ACCEPTANCE.vi.md), [verification.json](evidence/retry-context/verification.json), [source seal](evidence/retry-context/source-freeze.json). CSV8acceptance checks, immutable tests, same source/test/goal/output hashes ở direct Node fixture và managed; fail→restart→retry→verify→test source/integrate. Baseline trước chỉ Retry fail; manual recovery cần1transfer+1configure/v3. Sau sửa0transfer/0configure/v2. Direct Node fixture vốn0transfer, nhanh hơn; **không chạy native coding CLI/model A/B** và không chứng minh lợi ích ròng hay chất lượng đa-provider.

**Source cuối:** red-source-identity (symlink sang canonical path khác nhưng HEAD/bytes giống) đã chặn; red cap/locale/initial failure đều có green. Full **454/454 test,41file,0fail/skip/cancel**,101.84s, Node22.22.1/Linux/bwrap/cgroup1200M/swap0. Node18/20/new CI chưa chạy. Package local68file/376271byte khớp hashes; extracted final package cũng integrated, không publish. Không chạy lại full khi source không đổi.

**Browser cuối:** preview3182/fresh root `final-preview` lặp đầy đủ sau guard canonical: Run→fail→Retry không Save/chọn lạiprofile→verify→integrate→source→Back/reload; một task `meeting-e5b450dedda4688c00359b793f073b6c`, hai run, reqv2, source tests8đạt. [Receipt](evidence/retry-context/browser-final.json), [ảnh EN](evidence/retry-context/browser-final-en.jpg).12geometry/locale/theme cases375/768/1280×812 dùng UI bundle byte-identical với bản cuối; cap-omission giữ failed/source nguyên, draft qua locale reload, h1→TabRefresh. Đây là fixture/self-review, không human UX acceptance.

**Thời gian thật:** observation fixture03:31:03.498UTC hết hạn04:01:03.498UTC; browser/API sau hạn409 và count giữ5. Explicit scripted probe→explicit retry giữreqv1/fromRun→verified/integrated, count6; raw `expiry-*.json`. Không model chạy nền30phút. Ca TTL trước guard canonical cuối; TTL/routing/runtime/UI byte-identical, full454 + main browser flow được kiểm lại sau guard, không giả nhận30phút mới trên source cuối.

**Overhead/thất bại/unknown:** raw cuối direct Node~694ms, managed~1238ms (one direct-first sample, timer scope khác vì config/conversation/restart/provenance). Retry prompt1263→3056byte (+1793),14HTTP body measurements, workstore6file/~139KB;4production files tổng+4539byte, không dependency mới. Không gọi byte/request reduction là billing. Native tools/turns, tổng token/tiền, human time, maintenance tương lai, AI-debugging/đa-provider/remote/crash/multifile efficacy unknown. Script tự lái API không là autonomous product; user vẫn Run/Verify/Integrate. Cap-omission fixture cố tình sai tiếp tục fail; không mọi task đã done. Lỗi harness/viewport/receipt writer được phân biệt với product failures trong evidence.

**Bảo toàn/quyền:**15file có sẵn không liên quan nguyên byte,3tài liệu dirty chỉ thêm nội dung; initial snapshot `/tmp/am-feedback-90m-20261023-100456/initial.json`. Giữ README EN/VI/SHOWCASE/AGENTS/English capture/tool/evidence ban đầu. Không reset/clean/commit repo/push/merge/release, không additional agent/model trả phí/OAuth/globalsettings/app3000. Không claim modelCalls0 của fixture là không tốn tài nguyên phát triển. Preview data/config/work/room đều trong root temp riêng.

**Đã chốt:** preservation/link/JSON/hash/diff checks đạt; detector pattern hiện có không thấy secret, không là audit đầy đủ. Preview3181/3182 đã dừng, theme/viewport trả về và tab QA đã đóng; data fixture giữ trong `/tmp`. `verification.json` ghi endedAt/actualSeconds. Không còn công việc bắt buộc trong lát cắt này; không tự mở feature/ca làm tiếp. Tool/fixture/evidence chưa có trên GitHub pin; raw full suite/tar/root temp không hứa lưu bền. Bảy nhóm feedback + đánh giá mới có trạng thái trong ACCEPTANCE, đa số partial/open/unknown. Điểm tiếp đáng tái hiện là readiness/adapter recovery và các manual gates còn lại; không đẩy chia việc thường nhật về giám đốc, không tự gọi model/agent hay xây cả backlog. Không tự kích hoạt lại90/8h từ hướng dẫn gốc bên dưới sau khi ca đã chốt.

### Hướng dẫn gốc của ca (giữ để đối chiếu, không tự mở lại)

**Lệnh đã giao, thực thi ngay ở phiên kế:** làm việc **1 giờ 30 phút** để cải thiện Agent Meeting dựa trên đánh giá khách hàng mới bên dưới và bảy nhóm feedback trước. Người dùng là giám đốc, agent là PM: tự phân tích, ưu tiên, triển khai, sửa tích hợp và kiểm chứng trong quyền đã có; không chỉ đọc context, lập plan hoặc yêu cầu giám đốc chia việc/tìm người thử rồi dừng. Phiên ghi mục này **chỉ chuẩn bị bàn giao**, chưa bắt đầu90 phút, chưa triển khai lát cắt mới hoặc chạy thêm test/model. Đây thay trạng thái dừng ở review README; không mở lại ca8 giờ lịch sử.

### Đánh giá khách hàng mới và phản biện cần giữ

Khách hàng nhận xét sản phẩm đang tiến từ AI Meeting Room tới một nền tảng điều phối coding agent, gần **Codex App** hơn một IDE/editor. Họ ghi nhận VISION ngày21/10 là mục tiêu tương lai, chưa phải capability hoàn chỉnh. Bảng so sánh đề cập: nhiều agent; quản task/tiến độ; workspace riêng; review code; giao việc dài; định hướng đa provider. Họ chỉ ra adapter Codex/Gemini còn thiếu và tích hợp code giới hạn một file. Kết luận trọng tâm: thêm UI/điều phối không đủ khác biệt; cần chứng minh phối hợp agent dị chủng, giảm công giám sát và tạo đầu ra kiểm chứng được. Đây là phản hồi khách hàng, **không phải yêu cầu xây bản sao Codex App hoặc triển khai toàn bộ bảng tính năng**.

| Nhận định | Đối chiếu hiện trạng, ý nghĩa cho phiên90 phút |
| --- | --- |
| Trùng nhiều năng lực với Codex App | Có căn cứ về vùng giao thoa điều phối/workspace/review; không lấy thêm màn hình, worktree hay feature count làm mục tiêu. Không suy tính tương đương chất lượng từ một bảng có/không. |
| Tự vận hành từ ý tưởng tới sản phẩm | `docs/VISION.vi.md` xác nhận định hướng; source chưa nghiệm thu toàn hành trình. Không hứa hoàn thành đội full-stack tự chủ trong90 phút. Giao việc dài của một sản phẩm đối chiếu cũng không tự chứng minh mọi ý tưởng được thực hiện đúng. |
| Đa provider là lợi thế | **Tiềm năng, chưa chứng minh.** `src/runtime.js` hiện chỉ built-in `claude`/`agy`; agy write bị chặn, model identity có thể unknown; kết nối MCP Codex/Gemini vào phòng khác adapter managed thực thi. Không nhận đã phối hợp đa provider hữu ích từ hai tên trong catalog hoặc fixture. |
| Workspace/review còn hạn chế | Có workspace riêng, source/revision guards và test/integrate một file; không chỉ còn phòng họp, nhưng chưa tương đương Git worktree/diff-review hoàn chỉnh hoặc tích hợp đa file. Sửa một chỗ giảm thao tác/nhầm trạng thái thay vì xây lại nền tảng trong phiên này. |
| Chưa chứng minh giảm công/chi phí | **Đúng, còn mở.** Direct nhanh hơn trong fixture sum; model A/B chưa hoàn tất. Ưu tiên giảm công thực tế trong hành trình, đo thao tác/cứu lỗi và latency; không gọi số fixture là tiết kiệm tiền model. |

**Nguồn:** khách hàng gửi nguyên đánh giá trong chat ngày23/10/2026, dẫn [README main](https://github.com/ttat288/agent-meeting), [VISION main](https://github.com/ttat288/agent-meeting/blob/main/docs/VISION.vi.md) và [giới thiệu Codex App](https://openai.com/index/introducing-the-codex-app/). Đã mở các link lúc chuẩn bị bàn giao, đối chiếu VISION/source local. Bài OpenAI ngày02/02/2026 nêu thread dự án, worktree riêng và review/comment diff; đây là căn cứ giao thoa chức năng, **không phải benchmark so sản phẩm**. Đọc thêm nguồn chính thức hiện hành về [worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees) và [điều khiển công việc từ xa](https://developers.openai.com/blog/mastering-codex-remote-for-engineering). Đánh giá dựa main không tự phủ PR/local; kiểm revision trước khi kết luận một thiếu sót còn tồn tại. Không khẳng định độc quyền đa provider hoặc so sánh hệ sinh thái/giá nếu chưa có nguồn phù hợp.

### Mục tiêu, phạm vi và cách chọn việc

**Pain point ưu tiên:** người vận hành đã có coding CLI nhưng phải chuyển/nhập lại ngữ cảnh, tự đối chiếu báo cáo với test/source và cứu luồng bị chặn. Chọn **một hành trình sửa code nhỏ có ích trên repo/fixture cô lập**, từ quyết định/task tới đầu ra được kiểm trên source tích hợp, có một ca lỗi/khôi phục. Không dùng lại bài sum như bằng chứng nhu cầu; có thể dùng sum cho regression cơ chế. Không mặc định lỗi tồn tại: tái hiện nhỏ nhất trước khi sửa.

**Ưu tiên chọn điểm nghẽn:** (1) thao tác lặp/mất ngữ cảnh khi task → điều kiện chạy → kết quả; (2) không rõ vì sao adapter chưa chạy được, khiến phải đọc catalog/JSON hoặc thử sai; (3) đổi yêu cầu/hủy/restart rồi không có bước tiếp an toàn hoặc phải maintainer cứu. Kiểm chức năng hiện tại trước, chọn blocker quan sát được có ảnh hưởng lớn nhất trong phạm vi90 phút; PM tự chốt, ghi lý do. Không hứa sửa cả ba. Không tự cho phép redispatch khi process cũ chưa được đối chiếu, không bỏ guard để demo qua.

**Acceptance cần chốt trước sửa:** cùng đầu vào/nguồn/tiêu chí đầu ra ở sản phẩm và baseline đơn giản; task/revision/source/evidence liên tục, đầu ra chạy/test trên bản tích hợp, lỗi có bước khôi phục rõ và không báo nhầm done. Chọn ít nhất một chỉ số cụ thể gắn blocker: thao tác bắt buộc, số lần nhập/chuyển lại dữ liệu, số lần cần sửa tay/đọc nội bộ, hoặc lỗi hành trình bị loại bỏ. Đếm đường thao tác không được tự gọi là thời gian người dùng đã đo. Baseline direct phải được giữ đủ công cụ, không cố tình làm yếu; công bố phần nào direct đã giải quyết đơn giản hơn.

**Giới hạn so sánh:** không có quyền gọi model trả phí mới nên model-quality/đa-provider efficacy/billing A/B vẫn unknown. Dùng subprocess/HTTP/browser fixture để kiểm phần độc lập, công khai dữ liệu scripted và scope. Nếu không chạy được arm model thì không dừng mọi phần local hoặc lấy fixture thay chứng minh model. Đo thêm overhead HTTP/process/preparation/context khả dụng; chi phí chưa đo ghi unknown. Không tự mời người mới hoặc gửi tin cho người khác; human acceptance thiếu không chặn sửa vấn đề kỹ thuật đã tái hiện.

### Nhịp làm việc90 phút và cửa nghiệm thu

- **T0–15 phút:** đọc AGENTS, mục này, hiện trạng ở dưới, VISION và các hợp đồng hành trình; kiểm Git và source. Ghi T0 thực/deadline=T0+90 phút theo Asia/Bangkok, giữ snapshot/hash thay đổi có sẵn khi cần. Đối chiếu feedback mới với7 nhóm cũ, phân biệt done/partial/open/unknown; không sinh hệ báo cáo khác.
- **15–30 phút:** đi một hành trình hiện có, ghi baseline và ca lỗi; chốt blocker/phạm vi/acceptance. Không dành hết phiên nghiên cứu đối thủ hoặc sửa lời quảng bá.
- **30–65 phút:** sửa điểm nghẽn trong sản phẩm, tận dụng dữ liệu/chức năng hiện có, kiểm từng bước và xử lý lỗi tích hợp. Không tự thêm adapter/framework/engine codegraph/hệ điều phối chỉ vì feedback nhắc đa provider. Nếu cần UI: bắt buộc đọc `ui-ux-pro-max`, design system, cập nhật screen flow/test matrix liên quan, giữ VI/EN/theme/CSP và kiểm browser.
- **65–80 phút:** kiểm source tích hợp, cùng input/acceptance và ca lỗi/khôi phục; chạy test phù hợp trong giới hạn bộ nhớ. Nếu ảnh hưởng UI, kiểm browser thật trên preview riêng gồm navigation/Back/reload/draft phù hợp; không thay bằng ảnh đẹp/test module. Không mở rộng lát cắt mới sau phút65.
- **80–90 phút:** chốt trạng thái feedback và bằng chứng trước/sau, overhead/thất bại/unknown, cập nhật HANDOFF và tài liệu bị ảnh hưởng. Áp dụng `product-readme` nếu sửa README: English ưu tiên, bản Việt đồng bộ, media/source đúng phiên. Không biến phiên thành sửa README thêm lần nữa nếu blocker sản phẩm chưa được xử lý.

Mốc là ngân sách triển khai có thể điều chỉnh, không phải lý do bỏ kiểm chứng. Làm đến hết90 phút bằng công việc hữu ích trong phạm vi, dành cuối phiên cho QA/bàn giao; không sleep lấp giờ, không mở ca8 giờ hoặc tự kéo dài quá90 phút. Nếu mục tiêu đã đạt sớm, dùng phần còn lại kiểm lỗi/khôi phục và đối chiếu feedback, không thêm tính năng tùy tiện. Nếu bị ngắt/blocked một phần, ghi thời lượng thực, làm phần độc lập có ích và không nhận đã làm đủ90 phút khi chưa đủ.

**Đủ cho lát cắt:** một blocker khách hàng được tái hiện và khắc phục trọn hành trình với bằng chứng đúng phạm vi; chỉ ra phần công điều hành giảm/không giảm hoặc kết quả mới đạt được; không còn lỗi quan trọng đã biết trong phần sửa. Bảy nhóm feedback cùng đánh giá mới vẫn có trạng thái và ưu tiên; không nhận tất cả đã xong. Nếu chưa tái hiện/khắc phục được trong90 phút, ghi đúng chưa đạt và nguyên nhân, không sửa vô ích cho có code hoặc tô hồng kết quả. Chưa có human/model acceptance thì vẫn ghi thiếu, không tự nghiệm thu sản phẩm.

### Hiện trạng mang sang và quyền

- Branch `codex/2026-10-22-product-hardening`, HEAD `f415cf46961ac43301083c4784fb216b68e87ac6`; workspace có sửa local chưa commit. Lần Git check chuẩn bị bàn giao: AGENTS, CHANGELOG, README EN/VI, HANDOFF, REFERENCE, SHOWCASE, `src/meeting.js` và các file test/evidence/tool mới. Giữ mọi sửa/dữ liệu này; không reset/clean. PR#1 trước đó OPEN/DRAFT; **phiên bàn giao này không kiểm lại CI/PR remote**.
- Sửa gần nhất: nhận thêm `CONCLUSION:`/`TASK:` bên cạnh tiếng Việt;59 targeted + **439/439 test,39 file** đã đạt, không skip/cancel/fail, receipt [english-capture.json](evidence/consistency/english-capture.json). Đây là sửa input/capture, chưa phải lợi ích điều phối đa provider. Log full chỉ `/tmp`, hash/count giữ trong receipt; không nhận `/tmp` là lưu bền vững.
- README/showcase đã có đường thử browser pin f415cf4; local alias và `tools/try-workflow.js` chưa xuất bản. Bằng chứng browser cũ/hash cũ không tự phủ source mới. Skill cá nhân `product-readme` có trong catalog; không copy vào repo hoặc sửa skill vendor. Lát cắt English chưa có browser mới/human acceptance.
- Quyền giữ nguyên: **không commit/push, không merge/release; không gọi model trả phí, sửa OAuth/credential hoặc settings global; không tự gọi thêm agent.** Không đụng app3000, dữ liệu phòng thật, hoặc mở public endpoint. Preview/test dùng data/config/work/bridge registry riêng, cổng riêng; Linux/bwrap fail closed. Đọc CONTRIBUTING/SECURITY/SECURITY-DESIGN khi liên quan. Giám đốc chỉ quyết định thay đổi mục tiêu/ngân sách/quyền, PM tự xử lý phân tích/thiết kế/kiểm chứng thường nhật.

## Chỉ đạo tiếp tục xử lý pain point — 2026-10-23

Người dùng phản bác việc PM đẩy bước tiếp theo thành yêu cầu giám đốc tìm người mới thử trong khi các pain point còn mở. **Phản hồi đúng:** bảng phân loại bảy nhóm và lát cắt README không phải giải quyết xong pain point sản phẩm. Không dùng thiếu benchmark model hoặc human UX acceptance để dừng những việc tái hiện/sửa/kiểm được trong quyền hiện hành. Các câu “không tự mở backlog” của lát cắt tài liệu bên dưới không có nghĩa đóng toàn bộ công việc đã giao. Không triển khai mọi ý tưởng; xử lý từng điểm nghẽn có bằng chứng đến hết hành trình.

**Lát cắt đã chọn và sửa:** người dùng quốc tế đọc UI/README tiếng Anh nhưng phải nhập từ khóa Việt để ghi quyết định/task. Source meeting parser chỉ nhận KẾT LUẬN/VIỆC; đường thử trước giải thích workaround thay vì sửa. Nay nhận thêm `CONCLUSION:`/`TASK:` ở cùng vị trí/cú pháp, giữ nhãn Việt, inline uppercase guard và tách task khỏi decision. Không sửa UI/protocol gửi agent, không thêm model/adapter. Lợi ích kiểm được: tin Anh ghi được task/nguồn mà không cần đổi hai marker sang Việt; chưa đo human effort hoặc chất lượng AI.

**Nghiệm thu:** ba test mới đỏ trước sửa; sau sửa59 targeted tests đạt, gồm capture host/agent, Markdown/case/ordinary prose, hai ngôn ngữ và HTTP/restart giữ một task, owner/revision/source/decision. [Receipt](evidence/consistency/english-capture.json) ghi hồi quy toàn bộ và hash; raw red/green cùng thư mục. Không có browser mới, model thật hoặc user acceptance mới. README EN/VI/SHOWCASE/REFERENCE nêu rõ alias chỉ local chưa xuất bản; ví dụ clone pin vẫn dùng marker Việt tương thích bản đó. Các receipt tài liệu trước thuộc source trước sửa, không nhận coverage tự động.

**Ưu tiên công việc còn mở (không giao lại việc phân tích thường nhật cho giám đốc):**

1. Giữ hành trình input → quyết định/task → nguồn → yêu cầu/run liền mạch, ưu tiên chỗ phải sửa tay/nhập lại. English capture là một lỗi đã xử lý, không đại diện giải quyết hết nhóm trích xuất/điều phối.
2. Rà hành trình đổi yêu cầu, hủy, restart và quay lại kết quả; tái hiện trước khi sửa, giữ ID/revision/evidence và không biến self-report thành verification. Các test có sẵn là baseline, không bác bỏ feedback UX. UI sửa tiếp phải đọc skill/design system và kiểm browser tích hợp.
3. Vận hành/persistence/adapter/remote/bảo mật còn mở theo bảng feedback. Xử lý blocker thực trong hành trình chọn, không tự thêm orchestrator hoặc xây toàn bộ backlog. Benchmark model/cost chỉ phần cần model mới chờ quyền/ngân sách; thử remote máy thứ hai chỉ khi có hạ tầng/quyền phù hợp. Nghiệm thu người mới bổ sung bằng chứng, không chặn kiểm/sửa local.

Giữ dữ liệu/thay đổi có sẵn; không commit/push/merge/release, không sửa OAuth hoặc gọi model trả phí. Không tuyên bố tất cả pain point đã giải quyết từ ba test mới hoặc một README.

## Hoàn thiện README/showcase theo product-readme — 2026-10-23 (local review)

**Yêu cầu hiện hành:** hoàn thiện README/showcase cho độc giả quốc tế; kiểm local, không model trả phí/OAuth/merge/release, không commit/push. Giữ toàn bộ sửa có sẵn đầu phiên (AGENTS, CHANGELOG, README EN/VI, HANDOFF, SHOWCASE, script/evidence offline).

**Pain point và lựa chọn:** README đầu phiên đưa ví dụ sum/test cùng nhiều số đo và trạng thái nội bộ lên trước trải nghiệm phòng họp. Đã chọn thông điệp quyết định → ba việc có người phụ trách → tin nguồn, dùng lại ảnh/GIF tracking đã có, ghi rõ scripted/planned và ảnh cũ. Đây là đánh giá biên tập, chưa phải phản hồi người mới. Không sửa UI/runtime hoặc thêm tính năng. Bài sum/direct comparison, thất bại model và giới hạn giữ ở SHOWCASE tiếng Anh; README EN/VI cùng capability/lệnh/giới hạn, mẫu đầu vào giống nhau.

**Đường thử:** clone nhánh PR rồi checkout đúng f415cf46961ac43301083c4784fb216b68e87ac6, chạy CLI local, nhập kết luận mẫu bằng host không mời agent, xem ba việc planned, mở nguồn/reload/Back giữ ID. Từ khóa parser vẫn tiếng Việt, đã giải thích bằng tiếng Anh. Đây là kiểm task capture thủ công, không tự giả làm một cuộc thảo luận AI hoặc công việc hoàn tất. Lệnh offline chưa xuất bản chỉ có ở checkout local, ghi riêng.

**Kiểm chứng và điểm dừng:** đã clone source từ GitHub, xác nhận PR OPEN/DRAFT và main e292fd3, chạy browser EN/VI theo đường thử trên clone đã pin, dùng CLI thật và data/config/work/bridge registry tạm; startup/SIGINT sạch, ba task planned, nguồn/reload/Back giữ ID, không lỗi page JavaScript. Chạy lại offline command local: integrated, hai check exit0, cùng hash direct/managed, stale-save409 phục hồi và restart giữ evidence. Receipt mới [readme-review.json](evidence/showcase/readme-review.json) giữ hash/phạm vi/link audit; bằng chứng cũ không đổi nghĩa thành kiểm mới. Không chạy full suite vì source sản phẩm không đổi. Không gọi agent/model trả phí, sửa OAuth/settings client, đụng app3000 hoặc publish. Xem receipt để biết kiểm startup có các đường dữ liệu tạm khác mặc định của README.

**Còn chưa chứng minh:** chất lượng model/quyết định, lợi ích điều phối ròng, token/billing, người mới tự hiểu/hoàn thành hoặc chấp nhận UX. Direct vẫn nhanh hơn trong fixture nhỏ. Đã đạt phạm vi tài liệu và kiểm local để giám đốc review; không tự mở benchmark/backlog. Không cần quyết định thêm để review; thử với người mới/model thật cần công việc riêng có quyền/ngân sách phù hợp.

## Phiên tiếp theo — xử lý feedback, chứng minh giá trị và chuẩn hóa README (2026-10-23)

**Chỉ đạo mới:** người dùng là giám đốc, agent là PM; xem quy tắc vai trò và phản biện trong AGENTS.md. Phiên tiếp theo thực hiện lát cắt dưới đây, không chỉ nạp context rồi chờ theo prompt cũ. Ca8 giờ phía dưới đã kết thúc, không có timebox8 giờ mới. Phiên ghi bàn giao này chỉ sửa hướng dẫn, chưa thực hiện cải thiện sản phẩm/README hoặc benchmark mới.

**Pain point:** người xem repo đọc lướt chưa thấy giá trị đủ rõ, bằng chứng đủ tin và đường thử tới kết quả. Phản hồi bên ngoài có nhận xét dùng hiện trạng cũ, nhưng lợi ích sản phẩm so với direct CLI vẫn chưa chứng minh đầy đủ. Chưa có cơ sở quy nguyên nhân chỉ cho vẻ ngoài/showcase; phải kiểm cả lời hứa, khả năng thật và công sức vận hành. Không dùng việc source đã có chức năng để gạt bỏ phản hồi.

**Công việc theo thứ tự:**

1. Kiểm workspace, main/nhánh PR và tài liệu hiện hành. Đối chiếu toàn bộ nhóm feedback: liền mạch hội thoại→task→run; độ tin cậy kết quả; công điều phối/trích xuất; giới hạn adapter/remote/recovery; vận hành/persistence; bảo mật; kiểm chứng xuyên suốt và metadata. Mỗi nhóm ghi ngắn đúng/cũ/chưa rõ, nguồn, tác động và hành động; dùng tài liệu hiện có, không sinh hệ báo cáo mới. Không mặc định triển khai mọi đề xuất.
2. Chọn một hành trình hữu ích đủ nhỏ từ thảo luận đến kết quả kiểm chứng được; định nghĩa cùng đầu vào/acceptance cho sản phẩm và baseline direct mạnh. Đo thời gian, can thiệp của người dùng, chất lượng kết quả và tổng overhead/cost khả dụng. Fixture chỉ chứng minh hành vi phần mềm; model benchmark chưa có credential/quyền/ngân sách phù hợp thì ghi blocked/unknown, hoàn thành phần độc lập, không tự login/retry trả phí hoặc hứa kết quả model.
3. Tái hiện rồi sửa điểm nghẽn khiến hành trình đó thất bại, khó hiểu hoặc cần maintainer cứu. Dùng phần đã có, giữ ID/revision/source/evidence, kiểm trên bản tích hợp gồm lỗi/khôi phục; đọc skill UI và design system trước phần UI. Không xây thêm lớp điều phối chỉ vì tên gọi hấp dẫn.
4. Chuẩn hóa README Anh/Việt cùng bố cục: đối tượng/pain point → ví dụ đầu vào/kết quả và demo → khi nên dùng so với direct CLI → đường thử ngắn nhất → khả năng/giới hạn → bằng chứng tái lập/tài liệu sâu. Showcase phải khớp source và capability thực, chỉ rõ fixture/model thật và main/release/PR. Nếu chưa chứng minh ưu thế thì thu hẹp lời hứa; không làm nội dung quảng bá vượt sản phẩm.
5. Kiểm đường từ README tới kết quả, đồng bộ link/lệnh/ảnh/phiên bản, chạy kiểm phù hợp cho phần source thay đổi. Bàn giao những gì đã sửa, bằng chứng, kết quả thua/unknown, giới hạn, Git/CI thực tế và quyết định còn cần giám đốc. Chưa có người dùng mới thử thì không tự nghiệm thu khả năng hiểu, nhu cầu hoặc UX.

**Tiêu chí đủ:** mọi nhóm feedback đã được phân loại và có quyết định; hành trình chọn có hướng dẫn tái lập, bằng chứng đúng phạm vi và không còn lỗi quan trọng đã biết trong phần sửa; READMEVI/EN thống nhất, người đọc biết ai nên dùng, kết quả nào có thể kỳ vọng, cách thử và giới hạn. Nếu thiếu nghiệm thu model/người dùng thì ghi rõ phần chưa đạt, không nhận toàn sản phẩm đã chứng minh giá trị. Không mở toàn bộ backlog cho đủ feedback.

**Trạng thái/quyền cần giữ:** PR nháp#1 vẫn mở, chưa merge ở lần kiểm gần nhất; source workspace f415cf4 trước thay đổi hướng dẫn phiên này. AGENTS.md đã có ghi chú pain point/showcase và vai trò PM, còn local chưa commit. Branch main đã bật protection: PR+1 approval, CI test18/20/22 strict, giải quyết conversation, chặn force-push/xóa; admin bypass được giữ theo yêu cầu, không tự dùng bypass để merge PR. Không suy quyền commit/push của ca8 giờ đã hoàn tất thành lệnh xuất bản mới; yêu cầu hiện tại chưa giao merge/release. Giữ dữ liệu thật và thay đổi có sẵn, không gọi model trả phí/sửa OAuth/settings chỉ để làm showcase.

## Kết quả phiên xử lý feedback — 2026-10-23 (local, chưa xuất bản)

**Pain point đã xử lý:** người đọc README được mời chạy main dù hình/managed capability thuộc PR; demo bot REST/GraphQL không cùng câu chuyện ảnh tracking và không đưa tới kết quả code đã kiểm. Đã chọn lát cắt repo → biết phạm vi → thử fixture → nhận file/test/evidence, không sửa UI hoặc mở backlog. Hành trình kiểm cơ chế có ích cho người đánh giá tích hợp; ví dụ sum nhỏ chưa chứng minh giá trị AI hoặc nhu cầu thị trường.

### Đối chiếu các nhóm feedback với source hiện tại

Không có nguyên văn toàn bộ bài đánh giá ngoài trong workspace; bảng đối chiếu **toàn bộ bảy nhóm được bàn giao ở đầu file**, không giả định biết phiên bản/ý tác giả ngoài nguồn đó. “Cũ” chỉ áp dụng nhận định tuyệt đối thiếu capability đã có trong source PR, không bác bỏ pain point hoặc suy ra main đã có.

| Nhóm | Đánh giá, nguồn hiện tại | Tác động và quyết định |
| --- | --- | --- |
| Hội thoại → task → run | **Cũ nếu nói hoàn toàn rời rạc ở PR; còn giới hạn.** `src/work.js` syncRoom/configure/start và `test/consistency.test.js`: giữ ID, nguồn, revision/carry. Manual report vẫn tách execution. | Fixture mới kiểm cùng nguồn đến integration/restart; không thêm bảng việc. Chưa chứng minh chất lượng trích xuất bằng model. |
| Tin cậy kết quả | **Đúng một phần.** verify/integrate/rollback guard có trong `src/work.js`; test độc lập và source-current trong fixture. Self-report không chứng minh đúng ngữ nghĩa, test một assertion không chứng minh mọi yêu cầu. | README nêu rõ test/AI/user acceptance; không gắn demo tracking với kết quả nghiên cứu hoàn tất. |
| Công điều phối/trích xuất | **Đúng/chưa chứng minh lợi ích ròng.** Quy tắc VIỆC tạo task từ tin, người dùng vẫn cấu hình/probe/duyệt agent. [Model ledger](evidence/shift-20261022/model-ledger.json) không có A/B hoàn tất. | Công khai direct nhanh hơn trong mẫu cơ học; khuyên CLI cho việc nhỏ, không thêm PM/agent. Công người dùng/token/billing unknown. |
| Adapter/remote/recovery | **Đúng về giới hạn.** [Implementation status](IMPLEMENTATION-STATUS.vi.md), `src/execution-sandbox.js`: Linux/bwrap, single-file, remote experimental; lost không chứng minh process dừng. | Không mở rộng adapter/remote. Mẫu mới chỉ phục hồi stale-save và server restart; không gọi đó là crash/remote acceptance. |
| Vận hành/persistence | **Cũ nếu nói mọi thứ chỉ trong RAM; đúng về vận hành dài.** `SECURITY.md`, config/work store atomic/CAS/backup; phòng cần persistence riêng; draft ở browser. | README ghi ba nơi lưu và script dùng temp. State giới hạn, archive/retention/khôi phục production vẫn chưa nghiệm thu; không đụng dữ liệu thật. |
| Bảo mật | **Cũ nếu nói không có admission/capability/CSP; đúng nếu kỳ vọng sandbox đầy đủ.** `SECURITY.md`, `docs/SECURITY-DESIGN.md`, sandbox chỉ cách ly ghi. | Giữ ranh giới local/admin, host key riêng; nêu đọc host/mạng không cách ly. Không nới CSP/OAuth/quyền. Không nhận audit bảo mật mới. |
| Kiểm xuyên suốt/metadata | **Cũ nếu nói không có evidence; đúng nếu yêu cầu model thật/người dùng/remote.** [Evidence ca trước](evidence/shift-20261022/ACCEPTANCE.vi.md); source/hash/revision và model unknown có ghi. | Raw mới giữ nguồn/đầu vào/đầu ra/test/failure/overhead; chỉ claim API fixture. Chưa human UX acceptance; không kế thừa CI cho file local mới. |

### Thay đổi, kiểm chứng và điểm dừng

- README EN/VI cùng bố cục: đối tượng → đầu vào/kết quả → so direct → thử → khả năng/giới hạn → dữ liệu/bằng chứng. Phân biệt main/PR và **lệnh mới chỉ local chưa có trên GitHub**. Đường GitHub dùng test consistency đã có trong PR; tránh tạo một lệnh clone rồi gọi file chưa xuất bản.
- `tools/try-workflow.js`: một lệnh, không model; dùng server HTTP/work manager thực, sandbox Node, repo/config/work/room temp riêng, cổng loopback OS cấp, cleanup. Hai arm cùng source/patch/acceptance mã; provenance riêng được kiểm thêm ở managed. [Showcase](SHOWCASE.md#offline-result-walkthrough), [raw](evidence/showcase/offline-workflow.json). Không sửa runtime/UI; ảnh/GIF cũ giữ đúng nhãn nguồn, không dựng ảnh mới giả thành tích.
- Lượt raw đầu: direct565.55ms, managed1037.21ms; managed14 API requests, work store4 file/64804 byte. Direct nhanh hơn. Một mẫu/thứ tự direct trước, scope timer khác vì workflow có thêm lịch sử/config/recovery; không là benchmark hiệu năng suy rộng. Không đo human active time, token, billing, tổng disk/header/CPU/maintenance. Model baseline mạnh còn thiếu cặp do lỗi OAuth/quyền trước và không có quyền gọi lại; không tự sửa credential.
- Lệnh mới chạy hai lần, kiểm syntax; test consistency5/5 đạt bằng cgroup1200M/swap0/timeout180s. Raw/check receipt và link audit tại `docs/evidence/showcase/`; không chạy lại toàn suite vì source production không đổi. Chưa chạy browser mới/người dùng mới; không tự nghiệm thu UX, tính dễ hiểu hoặc lợi ích ròng.
- Git đầu phiên: chỉ AGENTS.md/HANDOFF.md đã sửa sẵn; giữ nguyên nội dung đó, bổ sung phần này. Remote main xác nhận e292fd3; PR#1 OPEN/DRAFT HEADf415cf4;6 leaf checks thành công,3 duplicate CI jobs cancelled. Snapshot [PR/CI](evidence/showcase/source-status.json) chỉ phủ HEAD đã push, không phủ thay đổi local. Không commit/push/merge/release, không gọi agent/model trả phí, không đổi OAuth/settings hoặc app3000.

**Còn cần giám đốc quyết định khi muốn đi tiếp:** có chấp nhận thử hướng sản phẩm giữ provenance/evidence dù thêm overhead không; nếu muốn bằng chứng model phải giao riêng ngân sách/call inventory/quyền và credential hợp lệ cho cùng strong contract. Chưa có cơ sở tuyên bố ưu thế sản phẩm. Không cần quyết định để giữ/review các sửa local này. Bước nhỏ tiếp là người mới dùng đường thử và phản hồi khả năng hiểu; không tự mở benchmark trả phí/backlog.

## Bàn giao phiên kế — thực thi đủ8 giờ, nâng cấp sản phẩm và công bố bằng chứng (2026-10-22, yêu cầu mới nhất)

> **Ca yêu cầu này đã hoàn tất lúc 06:24:54 23/10/2026 +07, 8h00m01s.** Đọc Trạng thái cuối ca bên dưới; các câu “phiên kế/chưa bắt đầu” được giữ như lịch sử, không tự khởi động ca8 giờ mới.

**Lệnh đã giao, phải thực thi ngay ở phiên kế:** người dùng cấp8 giờ làm việc để nâng cấp Agent Meeting/web/tool tốt nhất có thể dựa trên pain point và benchmark/metric kiểm chứng được; **cho phép tự quyết triển khai, commit/push code và cập nhật README**. Không chỉ nạp context, lên plan rồi dừng. Phiên đang chuẩn bị bàn giao này chỉ cập nhật tài liệu; chưa bắt đầu phiên8 giờ, chưa commit/push hoặc chạy thêm benchmark/model. Bắt đầu8 giờ khi phiên kế thực sự bắt đầu làm; không tính thời gian chờ người dùng mở phiên mới.

**Ưu tiên quyền mới:** mục này thay timebox60 phút, yêu cầu dừng sớm sau một lát cắt, chế độ “giữ mọi thay đổi chưa commit/không push” và phạm vi local-only của yêu cầu trước. Các đoạn “yêu cầu mới nhất” ở bên dưới là lịch sử của từng lát cắt, không ghi đè lệnh8 giờ này. Giữ kiến trúc/bảo mật, tính trung thực của evidence và thay đổi người dùng. “Toàn quyền” cho phép các quyết định phát triển/xuất bản trong mục tiêu này; không là yêu cầu tiêu tiền vô hạn, công khai bí mật, hủy dữ liệu hoặc vô hiệu kiểm soát truy cập. Không dùng lệnh cấm cũ làm lý do dừng mọi phần có thể triển khai trong phạm vi mới.

### Trạng thái cuối ca — 2026-10-23 06:24:54 +07

**Đã làm đủ ca phát triển: 8h00m01s.** T0 2026-10-22 22:24:53 +07; deadline 2026-10-23 06:24:53 +07; kết thúc thực 2026-10-23 06:24:54 +07. [Clock receipt](evidence/shift-20261022/shift-clock-final.json). Đây là thời gian phát triển, **không nghiệm thu model chạy8 giờ**. Lệnh8 giờ này đã hoàn tất; các checkpoint “đang thực thi” phía dưới là lịch sử, không mở một ca8 giờ mới.

- **Nguồn và xuất bản:** nhánh `codex/2026-10-22-product-hardening`, [PR nháp#1](https://github.com/ttat288/agent-meeting/pull/1), chưa merge/release/cài app người dùng. Source chức năng cuối `d4b6208d7d0563982afe520b4040b9dffc0b2e71`; commit evidence trước chốt `e79eeb18541710b1dcef35c72cbe32c306ae200c`. Đủ6 leaf jobs CI success đúng commit evidence, snapshot/link trong clock receipt. Commit ghi clock chỉ đổi tài liệu, CI của SHA mới cần đọc riêng; không tự nhận xanh nhờ source cũ.
- **Kết quả:** web theo dõi run giữ draft/evidence/focus; save/refresh/navigation muộn không ghi đè input mới; Results hủy verify/integrate; admin phân biệt executable/model-access và thời hạn proof; guard source/HEAD/config/revision, Unicode/cost/model evidence và shutdown chờ rollback/escalation; chặn burst toast tràn composer. Không thêm framework/runtime dependency, launcher PM hoặc hệ điều phối tổng quát.
- **Bằng chứng tích hợp:** [436/436 test,38 file,0 fail/skip/cancel,113 hashes](evidence/shift-20261022/verification-toast-final-tests.json); CI của commit evidence mới nhất xem snapshot/link trong clock receipt; [CI953 cũ](evidence/shift-20261022/ci-final-source.json) không tự phủ toast fix. [Tarball](evidence/shift-20261022/package-delivery-final/package-smoke.json):68 file/10HTTP+2CLI signal+2runtime group tests, SHA `4389d88033c9c2cd8680cfde3096490d86d3bc027ff1e9200f66552f94422632`. Browser fixture đã tới source integration, tải artifact/handoff và giữ IDs qua Back/reload/restart; UI cuối có cap toast và scroll-to-latest: burst12 ở3viewport giữ composer/focus/draft, không overflow; [geometry](evidence/shift-20261022/toast-burst-browser.json). Ảnh README được chụp lại đúng source. Chưa có human UX acceptance hoặc model AI hoàn thành task.
- **Benchmark và tổng phí:** [protocol/raw/analysis](evidence/shift-20261022/ACCEPTANCE.vi.md#điểm-đọc-hiện-tại) giữ baseline direct mạnh đã thử nhưng lỗi OAuth, audit riêng bị từ chối quyền/unknown identity; tổng3 native attempts, không cặp A/B hoàn tất. HTTP cùng facts/acceptance có conditional body0, nhưng max25-task2.095ms thua1.965ms, thêm2490 byte request headers/30 và idle polling. Runtime thêm30995 byte, cancel/timeout/output-limit có grace2s; evidence/checkouts/preparation cũng có overhead. Token/billing/human effort/semantic retention vẫn unknown; không quy fixture hoặc thời gian ca thành lợi ích model8h.
- **Bảo toàn:** [352/352 file T0 khớp foundation805f638](evidence/shift-20261022/preservation-final.json); không reset/clean thay đổi có sẵn, không đổi main/app3000/user data/global settings. Preview riêng3150 còn để review; proxy3156 đã dừng khi idle,3154/3155 inactive; fixture toast3157 đã dừng sau kiểm. Snapshot/fixture cần phục hồi giữ trong `/tmp`, không coi là lưu trữ bền vững. Local skill/vendor vẫn ignore hẹp.
- **Còn thiếu và quyết định tiếp:** người dùng đánh giá UX thực; muốn model benchmark tiếp phải khôi phục credential, chốt ngân sách/call inventory và dùng contract mới chung cho hai arm, công khai khác quyền Bash. Foreground API chưa có deadline ứng dụng riêng (10s chỉ cho background poll); chưa nghiệm thu remote máy vật lý thứ hai, tích hợp đa file, hard spending cap hay runtime/context8h. Không mở rộng các phần này chỉ vì đã có backlog.

**Prompt phiên kế:** Tiếp tục Agent Meeting tại `/home/theo/workspace/agent-meeting`. Đọc AGENTS.md, Trạng thái cuối ca trong docs/HANDOFF.md và Điểm đọc hiện tại của evidence; kiểm Git/CI thực tế, giữ source hashes và dữ liệu người dùng. Ca8 giờ trước đã kết thúc; nạp context rồi chờ yêu cầu mới, không tự gọi thêm model, sửa OAuth hoặc merge PR.

### Lịch sử checkpoint ca — 2026-10-22/23 (Asia/Bangkok)

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

- **Checkpoint04:40:01 ngày23/10 (T+6h15m08s, còn1h44m51s):** vẫn thực thi đến06:24:53, giờ cuối05:24:53. HEADđãpushac84999 trên nhánhcodex/2026-10-22-product-hardening. Full422/37local,0fail/skip/cancel; seal mới gồmtools (helperđượcrequirebởitest), raw/hash ởacceptanceca. Node/desktopCI23bd7e8success; ac84999mới chưa nhận xanh khi chưa kiểm.
  - FreshUIjourney477c6b7:taskmeeting-4b2b32… từchat#45→reqv2→expiredproofblock→fixtureprobe→run265ce1c9…→Verify→Integrate→reload/handoff/artifact. Source chỉsum.jsđổi, testhashgiữ, sourceNodecheckexit0. Criticalruntimehashes riêng,0nativeAI; khônggán cho sourcevềsau nếuhashđổi.
  - Notices/toasts23bd7e8 dànhchỗthayoverlay:24states/12locale-theme-widthconfig nofocusedinputoverlap, tradeoff56+54pxởVI375case. Keyboardd78076a:Enter→h1→1TabRefresh thay4, pollgiữh1;12routes+Back/reload đạt. SourceCSS/JS cuối còn phải finalfreeze/checkpackage. Mobiletextbox147pxở375vẫn làfinding, chưa mở rộng layout vìchưađotradeoffshortdraft/contentheight.
  - Reproducerac84999v2 chặn historyleak:oldclone101commitobjectscófuture66a runtimefix;v2mỗiarmchỉbasee292/noextra353filesgồmacceptance/modedigestkhớp. Frozenfile/taskdigestgiữ, Gitmetadatacóđổi; actualGitunit4cases gồmtemplateinjectionfailclosed. Audit4preparations/8armtrees131706544nominalsourcebytes, tăng2Gitprocess/arm;CPU/IO/modelbillingunknown. Originalpilotauthfailedledgergiữnguyên, Nativeattempts vẫn3/khôngcặpA/Bhoànthành.
  - Preview3150main/3156gate còn phục vụ riêng;3154runtimeprivate/3155proxycóRuntimeMaxnên cóthểđãdừng, kiểmtrước dùng. Gatenhìn thấy đều release; app3000/globalsettings/dữliệuthật khôngđụng. Next:rànốt initial concurrentnavigationload/focus, footprint/benchmarkclaims; không mở hệđiềuphối mới. Finalhour vẫn dành fullsource/browser/benchmark/package/secret-ignore/exactHEADCI rồi handoffthờigianthực. Khôngkếtthúccaở6h.

- **Checkpoint05:36 ngày23/10 (T+~7h11m, còn~49m):** đang giờ cuối, tiếp tục tới06:24:53, chưa kết thúc8h. Source freeze `fb50427611cc8307e663a0afeb58c73b274061e1`, runtime latest6d40a86; full434/37,0fail/skip/cancel; Node18/20/22 CI39864139038 và installer3OS39864138948 leaf jobs success. Package68file/10HTTP+CSP+asset+304/2extractedCLI signal đạt; tar9970f35… . [Receipt cuối](evidence/shift-20261022/ACCEPTANCE.vi.md#điểm-đọc-hiện-tại).
  - Finalbrowser Results2→chat#45→Back/reload giữ IDs; VI/EN375dark,1280light no horizontal overflow. Ảnh README thay bằng source cuối cóhash. Fresh source integration trước đó dùng deterministicNodefixture, không model/humanUX acceptance.
  - HTTP30/arm1/25/100 giữ body0 conditional, nhưng max25task2.095ms thua1.965; requestheaders+2490/30, pollingidle tăngrequests. Runtime+30663byte, UI+24952; publicevidence~4.9MB ởsourcefb, khôngnpm nhưngwholecheckoutcopycóoverhead. Modelattempts3/khôngcặpA/Bhoàn tất; strong-nextcontract chỉprepared, direct/managedtoolasymmetry vàv1fixLoopsambiguity công khai; billing/model8hunknown.
  - Còn: review CLI/docs/links/source boundaries cuối, commit/push receipt/README, exactHEADCI mới và cập nhật thời gian kết thúc thật. Chỉ sửa regression quan trọng nếu tìm được; không mở feature mới, không chạy lại test vô ích để đủgiờ. main/app3000/userdata/globalsettings giữ nguyên. Preview3150 reviewable; gate3156 sẽ dừng sau kiểm, không xóa fixture/snapshot cần phục hồi.

- **Checkpoint05:48 ngày23/10 (T+~7h23m, còn~37m):** vẫn làm đến06:24:53. Trong rà cuối đã tái hiện lỗi read-only/unwrapped runtime trả cancel/timeout trước SIGKILL khi grandchild dùng stdioignore vẫn ghi. `953225b92604e706d37e49cdb6688bb94a3c4f20` đã push: giữ promise/timer/cleanup tới escalation2s; không mở feature mới hoặc đổi sandbox. Frozen full **436/38,0fail/skip/cancel**,113 file sealed; package mới68file/10HTTP/2CLI signal/2runtime group tests đạt, tarc93e78b7… . [Evidence mới](evidence/shift-20261022/ACCEPTANCE.vi.md#điểm-đọc-hiện-tại). CI source953 đang chờ kiểm, không dùngfbCI thay.
  - Runtime footprint+30909byte sofoundation, UIhash và5HTTP benchmarkhash khôngđổi; polling/tail-loss/unknownmodel giữ nguyên. UI sau restart953 vẫn2run, đúngnguồn#1/#45/focush1/nooverflow; screenshotREADME vẫn đúngUIhash.
  - Gate3156đãstop khiidle;3154/3155inactive; chỉpreview3150củaca còn chạy đểreview, tabResults5đượcgiữ, viewportreset/themetheohệthống. Dữliệuthật/app3000/main/globalsettingskhôngđụng; nativeattempts3 khôngthêm. Còn:pushreceiptmới, exactHEADCI, rà claims/handoffvàchốtgiờthực. Khôngnhậnđãđủ8h ởcheckpointnày.

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
