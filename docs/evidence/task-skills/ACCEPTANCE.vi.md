# Skill/tool theo task — bằng chứng local, 2026-10-24

**Bổ sung phiên 11:46 +07:** đã có review và so sánh direct agy model thật, hai lỗi đã tái hiện/sửa và full487/487. Xem [kết quả agy-live](agy-live/ACCEPTANCE.vi.md). Các số485/485, unknown model và giới hạn fixture bên dưới là snapshot ca trước; không xóa lịch sử hoặc gọi direct text mediation là native MCP.

Source: branch `codex/2026-10-22-product-hardening`, HEAD `1b56f4db04d4135a66fcc329af89332eb21b9d3f` cùng thay đổi local được giữ từ bàn giao và phần phiên này. **Chưa commit/push/release.** Hash source cuối trong `source-freeze.json`; kết quả máy trong `verification.json`. Đây là nghiệm thu kỹ thuật/self-review fixture, không phải giám đốc hoặc khách hàng chấp nhận UX, không phải benchmark model thật.

## Vấn đề, baseline và điểm dừng

Quan sát source: CLI `skills list/show/inspect` có catalog/link guards, nhưng `WorkManager.start` không cấp guide từ policy task; Claude managed có strict MCP config rỗng. Người vận hành có thể chép guide vào Facts hoặc dùng CLI trực tiếp. Chưa có người dùng thật chứng minh tần suất/chi phí của thao tác này hoặc rằng CSV cần skill để model suy luận đúng. Lát cắt kiểm **hợp đồng cấp context/tool** cho task đã được host chọn policy, không tự động phân loại mọi task hoặc khẳng định người dùng cần hệ thống điều phối.

Baseline API là source **HEAD1b56f4d archived**, không giả là bản local của ca cũ. Skill path của hai source đều chưa được nối trước phiên này; readiness local có khác và không dùng để suy lợi ích của policy mới. Cùng CSV source/test bytes,8 acceptance checks, scripted participant, lỗi independent verification lần đầu, explicit retry, restart và output hashes. Baseline thử một workaround cụ thể:4 discovery/read operations, chép2 body guide vào Facts, Save tăng requirementRevision. Đây **không phải** chứng minh mọi người dùng/CLI bắt buộc cần chép2 lần. Direct Node fixture đọc/nhận luật trực tiếp và không có wrapper routing/catalog.

Điểm dừng: task có policy nhận required đúng attempt/phạm vi, optional lookup ngắn qua grant riêng, giữ điều kiện/ID/evidence khi fail/retry, verify/integrate trên source; task khác không nạp guide; lỗi quyền/nguồn/unsupported fail rõ; regression và browser recovery trong phần ảnh hưởng. Không mở marketplace, graph index, adapter Gemini, policy editor UI hoặc team/remote rollout.

## Hành trình đã kiểm

- Host API hiện có lưu required/optional IDs và tools, pin nguồn/version nếu có/hash; skill policy và quyền tool là hai phần riêng. Task không có policy không có catalog/context file/MCP grant.
- Required manifest supplied đúng1 lần mỗi attempt stateless. Optional chỉ metadata; bootstrap đã có link/hash nên có thể `skill_load` thẳng resource, không cần đọc lại cả catalog/manifest. Duplicate load trong cùng tiến trình trả receipt không body.
- Tiến trình MCP thật qua stdin/stdout: chỉ phơi grant, từ chối tool `execute`, cho phép đúng reference, chặn ID không chọn/traversal/link ngoài pin, giữ taskId/requirementRevision/hash. Script liên kết chỉ đọc text, không được chạy. No arbitrary command/URL/remote service.
- Source ignored đổi/thiếu, root symlink, resource sửa, content có mẫu secret hoặc vượt bound trả lỗi. Explicit policy Save mới repin; Save acceptance không được nhận ngầm nguồn mới. Không tự grant/Run/retry.
- Direct local managed Claude là phạm vi hỗ trợ. Runtime args mới strict MCP riêng; không lấy user/project/local settings hoặc native skills/hooks của lần gọi này. Help CLI2.1.289 xác nhận flags có sẵn; **chưa gọi Claude model thật để chứng minh adapter/model dùng MCP**. Managed policy/CLAUDE.md/provider system context không được nhận là toàn bộ đã nằm trong supply ledger. agy/remote/team-swap từ chối policy; CLI ngoài đã join không thuộc kiểm soát này.
- Bwrap thật giữ context dưới `/tmp` chỉ đọc, workspace riêng được ghi. Không đổi biên thành sandbox đọc/mạng. MCP deny không thu hồi quyền Read gốc của CLI.
- CSV `failed→restart→explicit retry→verified→integrated` cùng task/revision; chẩn đoán cũ được kèm, test nguồn tích hợp đạt8/8 và hash bằng direct/baseline. Handoff có selected/supplied/grant; `applied=not-observed`, không nhãn enforced/compliant.

`mcp-sandbox.json` bổ sung real MCP stdio chạy trong chính biên bwrap, nạp reference từ catalog dưới /tmp chỉ đọc và từ chối execute. `journey.json` là API + real MCP subprocess; patch selection/tool call do fixture script quyết định. Không được gọi đây là model chọn đúng skill/tool.

## Browser và UI cũ còn thiếu

Đã đọc `ui-ux-pro-max` và design hiện có, query UX **Error Recovery / Error Messages**: alert được công bố và có bước phục hồi. Không thêm UI cấu hình policy; **policy editor chưa có**, API host local là điểm cấu hình. Chỉ thêm bản dịch lỗi skill trong alert có sẵn; CSP/theme/layout/data contracts giữ nguyên. J44 trong CONSISTENCY-JOURNEYS ghi scope/flow/matrix.

`browser.json`:12ca VI/EN × light/dark ×375/768/1280, không overflow; alert giữ focus, có profile/probe có cảnh báo chi phí và admin return. Chạy repeated expiry sau failure và sau success; probe fail không tạo run, success chưa Run; success cũ bị thay bằng alert khi hết hạn lại. Explicit Run lần2 → retry diagnostics → Verify → Integrate; cùng UUID/revision/source. Results reload, Plan/Back, Admin runtime/Back và deep link không gọi lại runtime. Console chỉ có409 cố ý; không pageerror/CSP error. Đã xem trực tiếp `recovery-vi.png` và `integrated-en.png`.

Browser dùng required supply và tool grant rỗng; optional MCP subprocess được kiểm riêng trong journey/unit. Expiry backdate31phút ở hai store, không phải wall-clock30phút. Self-review, không screenreader/human UX acceptance.

## Chi phí và đối chiếu

Mẫu cuối trong `journey.json` (sequential, một lần/arm; không suy thống kê hoặc thời gian người thật):

| Chỉ số | Baseline app + chép guide | Task policy + MCP | Direct Node |
|---|---:|---:|---:|
| Kết quả CSV |8/8, integrated|8/8, integrated|8/8|
| Body guide chép tay trong workaround |2|0|0|
| Chuyển chẩn đoán tay sau fail |0|0|0|
| Hai task prompt, UTF-8 bytes |5019|7569|không model prompt|
| HTTP requests trong script |15|14|0|
| HTTP request/response body bytes |1386 /239487|971 /253784|0|
| MCP request/response bytes, hai process |0|1192 /4170|0|
| MCP schema payload riêng mỗi process |0|654bytes|0|
| Elapsed trong timer của arm |1335.55ms|1407.49ms|718.98ms|

Direct nhanh hơn; policy tăng prompt và transport trong mẫu này. App timer bao gồm configure/probe fixture/HTTP/restart/verify/integrate; direct timer chỉ core repair/check, setup bị loại ở cả hai. OS process trees, Git/sandbox readiness checks, schema envelope/provider serialization không được đếm đủ; bytes schema ở đây là payload nguồn, không provider wire token count. Retry/required supply được tính ở cả2attempt. Không gộp/giấu overhead để tuyên bố ít tool call hoặc tiết kiệm billing. Lợi ích mới chứng minh được là **bỏ một workaround chép body** và có hợp đồng nguồn/quyền/receipt; lợi ích ròng so coding CLI trực tiếp **chưa chứng minh**. Host vẫn phải chọn IDs/phạm vi và xử lý Save policy khi nguồn đổi; có chi phí cấu hình, repin, bảo trì module/MCP/tests.

Token PM, Gemini, provider system prompts, reasoning, cache và billing đều **unknown/null**, không thay bằng0. Gemini install development có7package,13giây npm báo, bundle local khoảng71MiB; không thành dependency runtime sản phẩm. Gemini attempt riêng mất~3.757giây, prompt chuẩn bị55067bytes; model không trả kết quả. Công PM thực ghi trong HANDOFF, không lấy hạn7giờ làm thời gian đã làm.

## Ba cách giao tiếp và Caveman

`communication.json`: cùng task/facts/negation/condition/error/path/evidence/unknowns/next step; current-style850bytes, structured618bytes, Caveman-source-informed541bytes. Cả3giữ toàn bộ trường đã định và downstream deterministic patch/check8/8 sau fail. Negative control bỏ `not` bị phát hiện. Zero lượt hỏi lại là **fixture**, không hành vi người/model đo được.

**Không phải model A/B:** ba mẫu do PM soạn, không có ba inference độc lập. Prompt rule bytes80/261/4678; tổng input facts +instruction+sample1580/1529/5869bytes. Caveman output ngắn hơn nhưng source skill làm input lớn hơn; không suy token/billing hoặc semantic superiority. Bản current-style là mẫu đại diện do PM soạn, không captured transcript của model cũ.

Caveman source pin `bae9beaf3aa6dc509f05f3d3ed239c827f6e51bb`, manifest SHA `415d43518f2b1a9498c15a445d4657117b129ee5e81b19454ce348439cc6672b`; LICENSE Apache-2.0 đọc và giữ local. Đây là skill giọng văn, giữ phủ định/literal payload và có ngoại lệ cho cảnh báo/tài liệu gửi ngoài; session persistence không thích hợp làm default ngầm. Chỉ lưu text `.local-tools/caveman-eval`, không hooks/proxy/install global/catalog. AGENTS cập nhật đúng phân biệt này. **Giữ quy tắc task handoff ngắn có cấu trúc**, không cài Caveman mặc định. Không cần code graph cho catalog16selected/link tường minh; không cài/index graph hoặc nhận README vendor là số tiết kiệm thật.

## Thất bại và giới hạn

1. Gemini CLI không có executable ban đầu. Cài local0.65.0 có pin/integrity/ignore-scripts rồi giao scout SKILL-SCOUT-01 với source/phạm vi/đầu ra rõ; root và credential chỉ đọc. CLI trả `UNSUPPORTED_CLIENT`/Code Assist ineligible, refresh credential bị EROFS; không có scout/model output, actual model unknown. Không sửa OAuth/settings, không chuyển provider/model hoặc gọi tiếp cho có. **Review Gemini độc lập chưa hoàn thành**; `gemini.json` giữ sự kiện đã làm và phần chưa biết. Không phát tán raw credential/log auth; raw tạm chỉ trong local ignored.
2. Nhóm runtime + skill đầu20/21: secret fixture dùng chuỗi mà detector sẵn có không nhận; sửa fixture sang mẫu detector thực sự hỗ trợ, không tuyên bố mọi secret được phát hiện. Circular import discovery→connect→server/work được bỏ bằng lazy connect trong doctor, giữ chức năng lookup.
3. Full đầu469/485,16fail do guard skill đọc requirementSnapshot thiếu của run cũ/fixture, kéo theo verify/cancel/shutdown. Sửa compatibility no-policy no-op, **không bỏ guard cho task có policy**; log `full-test-first-failure.txt` được giữ. Targeted cancel/shutdown19/19, full cuối **485/485,43file**, memory/swap/timeout đúng HANDOFF. Không dùng test xanh làm bằng chứng người dùng thích sản phẩm.
4. Không có paid/native coding model run, không đa-CLI efficacy, human time/UX, độc lập Gemini review, prompt semantic compliance hoặc token/billing lợi ích. Optional load dedupe chỉ trong một MCP process; không bền qua restart process. Filesystem source checks ở các mốc, không atomic snapshot hoặc network/secret isolation. Không có arbitrary external MCP/tool registration hoặc admin editor mới.

## Tái lập và bước tiếp

```bash
node --test test/task-skills.test.js
node tools/check-task-skills.js
# Đối chiếu archived source HEAD, giữ riêng ngoài cây source được chạy:
node tools/check-task-skills.js --baseline-root .local-tools/task-skills-baseline
PLAYWRIGHT_MODULE=/absolute/runtime/node_modules/playwright node tools/check-task-skills-browser.js
node tools/check-skill-handoffs.js .local-tools/caveman-eval
systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 900 npm test
```

Baseline archive tạo bằng read-only `git archive HEAD src bin package.json` vào `.local-tools/task-skills-baseline`; Caveman text pinned cần tải lại đúng commit/license nếu máy mới. Browser dùng Brave hoặc `BROWSER_BIN`, toàn bộ data fixture temp và port loopback ngẫu nhiên, được đóng/xóa sau kiểm. Không chạm app3000/phòng thật/settings global. Docs evidence cố ý giữ hash/error/pass/fail; raw source freeze không biến bản local này thành main/release.

Đính chính sau ca: lỗi trong `gemini.json` chỉ thuộc Gemini CLI riêng, không thuộc Antigravity CLI. Người dùng báo `/home/theo/.local/bin/agy` gọi `gemini-3.8-flash-low` trả `SUCCESS`/`ANTIGRAVITY_OK`; receipt agy lịch sử cũng có phản hồi model (kèm một command bị từ chối, không phải full review acceptance). Ca trước chưa kiểm đường này trước khi yêu cầu giám đốc cung cấp runtime mới: đó là thiếu sót của PM. Giữ nguyên bằng chứng fail lịch sử, không sửa nó thành lỗi agy hoặc thành review đã xong.

Bước tiếp cụ thể: khi được tiếp tục nhiệm vụ, PM tự kiểm và dùng `agy` trực tiếp cho scout/review chỉ đọc trong quyền đã giao, rồi kiểm độc lập kết quả. Không cần giám đốc cấp lại runtime chỉ vì Gemini CLI riêng lỗi; chỉ hỏi nếu thực sự gặp ranh giới quyền/auth còn thiếu. Giữ guard task-skill/MCP/write của adapter sản phẩm tới khi có triển khai và kiểm chứng riêng. Lượt đính chính này không chạy inference hoặc mở lại ca phát triển.
