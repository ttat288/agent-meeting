# Retry nhận chẩn đoán test — bằng chứng local, 2026-10-23

Phiên90 phút bắt đầu **10:04:56 +07**, deadline **11:34:56 +07**. Thời gian kết thúc thực được chốt trong `verification.json` và đầu `docs/HANDOFF.md`; tài liệu này không tự chứng minh đã đủ90 phút. Source local chưa commit/publish; HEAD `f415cf46961ac43301083c4784fb216b68e87ac6` cộng English capture có sẵn và các sửa được hash trong [source-freeze.json](source-freeze.json). Không gọi thêm agent/model trả phí, sửa OAuth/settings global hoặc app3000.

## Vấn đề đã quan sát và phạm vi

Người vận hành managed coding thấy test độc lập thất bại nhưng lần Run tiếp theo nhận lại prompt cũ, thiếu lỗi test. Hệ thống đã giữ evidence, song phải mở/chép chẩn đoán vào Facts và Save (tăng requirementRevision) để agent nhận lỗi. Tái hiện bằng CSV cell escaping:8 acceptance checks cho plain/comma/quote/LF/CR/empty/Unicode/zero; sửa một file, test ngoài write scope. Đây là bài kỹ thuật có đầu ra hữu ích để kiểm cơ chế, không phải bằng chứng khách hàng cần một app CSV.

Thay đổi nhỏ ở WorkManager: chỉ kèm lỗi independent verification của **lần gần nhất cùng task**, cùng requirement/đường dẫn canonical/base Git/snapshot nguồn được copy. Không tự retry, đổi model, resume patch hoặc cấp thêm quyền. Workspace mới vẫn là bản sao source mới; prompt nói rõ lỗi thuộc candidate trước. Chỉ tối đa4check, diagnostic JSON dưới16KiB; cắt output có nhãn, bỏ dấu hiệu secret bằng detector hiện có trước cắt. Lưu nguồn run/hash/bytes/cờ rút gọn; evidence gốc giữ nguyên. Optional feedback vượt cap128KiB thì bỏ và UI giải thích. Snapshot check là kiểm tại mốc, không phải khóa source nguyên tử.

UI giữ S05/S06: hướng dẫn retry, nguồn chẩn đoán, cờ rút gọn/bỏ output; gộp lời nhắc fail để không lặp hai khối. QA phát hiện nút đổi ngôn ngữ không reload khi URL không có `lang`; sửa một dòng để giữ lựa chọn trong query, không đổi view/params còn lại. [J43/screen flow/matrix](../../CONSISTENCY-JOURNEYS.vi.md#j43--retry-nhận-lỗi-kiểm-chứng-không-nhập-lại-bối-cảnh-đích-trước-sửa-2026-10-23) ghi đích trước sửa.

## Cùng input và acceptance, giữ cả kết quả thua

Scripted participant nhận cùng source/test/goal/acceptance. Nó chọn một patch biết trước khi được cấp diagnostic biết trước; **không suy luận AI**. Direct Node fixture đưa output test trực tiếp về cùng participant như một direct tool loop, không cần chuyển tay; không chạy coding CLI/model thật. Managed dùng HTTP/server/persistence, subprocess Node và bwrap thực.

| Arm | Sau2attempt | Chuyển chẩn đoán tay / configure bổ sung | Revision | Raw |
|---|---|---|---|---|
| Direct Node fixture |8checks đạt trên file đã sửa |0/0|Không cần task revision|Trong từng receipt|
| Managed trước, chỉ Retry |Vẫn fail; source chưa đổi|0/0 nhưng **chưa đạt acceptance**|v2|[before.json](before.json)|
| Managed trước, phục hồi bằng Facts |Integrated; test source đạt|1/1|v3|[before-manual-recovery.json](before-manual-recovery.json)|
| Managed sau |Integrated; test source đạt|0/0|v2|[after.json](after.json)|

Giảm **một lần chuyển diagnostic và một configure** trong protocol này; không gọi đó là thời gian người dùng đã đo. Direct đã làm được0transfer và đơn giản hơn cho việc nhỏ. Người dùng managed vẫn phải chọn/chạy/verify/integrate; script tự lái API không chứng minh sản phẩm đã tự chủ. Task/source-message ID giữ liên tục; old failure không bị sửa thành success; chỉ source-integrated tests mới chuyển done. Restart thường được kiểm; không suy thành crash-process reconciliation.

Source/test bytes đầu vào và output cuối direct/managed khớp hash. Case8checks là scope chấp nhận đã khóa, không là đầy đủ mọi quy tắc CSV hoặc bảo vệ spreadsheet formula injection. Diagnostic bị rút gọn có thể thiếu chi tiết; các task khác vẫn có thể cần xem bằng chứng gốc.

## Overhead và giới hạn đo

Mỗi receipt là một lượt direct-trước, không phải thống kê latency. Managed timer gồm thêm cấu hình, hội thoại, restart và provenance, direct chỉ tạo file đã test. Trong raw cuối: direct khoảng**694ms**, managed khoảng**1238ms**; direct nhanh hơn. Managed trước khi phục hồi bằng Facts khoảng1200ms trong lượt khác; không tuyên bố bản sửa nhanh hơn từ chênh lệch này.

Prompt lần đầu1263byte ở cả trước/sau; retry mới3056byte (**+1793byte**, gồm1505byte JSON diagnostic và rule/structure). 14HTTP request,893byte request body, khoảng283KB response body; work store6file/~139KB. Baseline accepted bằng Facts có15HTTP request, nhưng body phụ thuộc revision/facts và poll; không dùng chênh lệch body làm billing win. Bốn file production đổi tổng+4539byte; không thêm runtime dependency. Tools/tests/evidence và thời gian phát triển90phút vẫn là chi phí; chưa định lượng bảo trì tương lai. Native tool schemas, internal turns, tổng token/billing, CPU/header/TCP và human active time **unknown**. Modelcalls của fixture=0 không có nghĩa cả phiên phát triển không tốn tài nguyên.

## Kiểm chứng và ca lỗi

- Full source freeze: **454/454 test,41file,0fail/skip/cancel**,101.84s; Node22.22.1, Linux/bwrap, cgroup MemoryMax1200M/swap0, timeout900s. Node18/20/remote CI mới chưa chạy. Receipt tổng hợp giữ hash raw log `/tmp`; không gọi `/tmp` là lưu bền vững.
- [Red ban đầu](red-tests.txt) → [green targeted](green-tests.txt): CSV fail→restart→retry→verify→integrate; source/HEAD/requirement/task mismatch, latest cancelled/rejected không lùi về lỗi cũ, payload/Unicode/secret/injection, prompt cap và rollback integration fault. Một số guard dùng state/runner fixtures; không nhận đó là process/model/remote acceptance.
- [Red source identity](red-source-identity.txt): canonical path khác dù HEAD/bytes giống cũng không carry; đã thêm guard và chạy lại full454/targeted/browser trên preview mới. Guard không khẳng định chặn mọi filesystem race.
- [Red prompt cap](red-prompt-limit.txt): bản sửa đầu làm prompt hợp lệ vượt128KiB; nay optional diagnostic bị bỏ, base prompt giữ. [Omission state](omission-state.json) kiểm UI thật; candidate sai tiếp tục **fail** khi verify, source vẫn nguyên, không báo done.
- [Red language](red-language.txt):3ca actual i18n code; browser EN↔VI không reload tay, query/view đúng; draft không Save vẫn giữ qua locale reload. [Draft/keyboard](browser-draft-keyboard.json): h1→TabRefresh và đúng task/run IDs.
- [Browser matrix](browser-matrix.json):12ca VI/EN × light/dark × **375/768/1280 CSS px thực**, không tràn ngang, cả included/omitted/failure state; UI bundle byte-identical sau guard canonical cuối. [Browser cuối](browser-final.json) đã chạy lại whole flow trên backend cuối, ảnh [EN](browser-final-en.jpg). Kích thước requested ban đầu lệch CSS và receipt writer rỗng đã bị loại/recollect; không coi các lần đó là pass. Không tuyên bố universal accessibility hoặc human UX acceptance.
- Observation fixture03:31:03.498UTC hết hạn04:01:03.498UTC bằng thời gian thật. Browser/API retry sau đó409, run count giữ5; [guard](expiry-guard.json), [UI error](browser-expired-error.json). Explicit scripted probe → explicit retry → verify/integrate8checks, requirementv1/run count6; [result](expiry-result.json). Không có model chạy nền30phút và không có automatic retry. Ca thời gian này trước guard canonical cuối; TTL/routing/runtime/UI không đổi byte. Luồng chính và full454 được kiểm lại sau guard; không giả nhận đã chạy thêm30phút trên WorkManager cuối.
- Npm local **68file**, tar376271byte, critical production hashes khớp freeze; [package](package.json), [extracted workflow](package-workflow.json) integrated. Không publish. Gói/tệp fixture ở `/tmp`, không hứa lưu bền vững chúng.
- [Preservation](preservation.json):15file có sẵn không liên quan nguyên byte,3tài liệu dirty chỉ thêm nội dung, HEAD giữ nguyên. Không reset/clean/commit/push. Ảnh browser là scripted participant; không ảnh/model thành công giả.

## Tái lập từ checkout local

```bash
node tools/check-retry-context.js
# Default phải integrated mới exit0; Linux/bwrap, không model.
node tools/retry-context-preview.js
# URL riêng được in; browser: Run → Results/Verify (fail) → Retry → Verify → Integrate.
```

Để replay logic trước sửa mà không phụ thuộc snapshot `/tmp` đầu phiên, lấy **chỉ WorkManager cũ** từ commit đã ghi, giữ các module khác hiện tại (component comparison, không giả làm checkout cũ đầy đủ):

```bash
retry_baseline="$(mktemp -d /tmp/am-retry-baseline.XXXXXX)"
cp -R src "$retry_baseline/src"
cp package.json "$retry_baseline/package.json"
git show f415cf46961ac43301083c4784fb216b68e87ac6:src/work.js > "$retry_baseline/src/work.js"
node tools/check-retry-context.js --app-root "$retry_baseline" --expect failed
node tools/check-retry-context.js --app-root "$retry_baseline" --manual-feedback
```

[Component replay](component-replay.json) đã kiểm WorkManager hash bằng baseline gốc và cùng code/test inputs; hai prompt giống nhau, retry fail như dự kiến. Baseline đầy đủ đầu phiên nằm trong `before.json`, source/UI hashes khác recipe component phải giữ nhãn đúng. Tool/fixture mới chưa có trong clone pin đã công bố. Mỗi run CLI dùng root/config/work/room temp riêng và tự dọn; preview giữ data temp để review, Ctrl+C drain rồi thoát.

## Trạng thái feedback sau lát cắt

| Nhóm | Kết quả/giới hạn hiện tại |
|---|---|
| Hội thoại→task→run |Local journey có source/revision; giữ English capture có sẵn, thêm failure provenance. Chưa semantic extraction acceptance.|
| Tin cậy kết quả |Test độc lập + source integration/rollback vẫn bắt buộc; cap-omission không được biến thành success. Test fixture không thay human/model acceptance.|
| Công điều phối |Khép một gap chuyển diagnostic1→0; direct đã0, vẫn còn manual gates, chưa lợi ích ròng/chi phí model.|
| Adapter/remote/recovery |Normal restart/expiry retry được kiểm. Không thêm Codex/Gemini adapter, đa-provider efficacy/remote/crash reconcile còn mở.|
| Vận hành/persistence |Failure và nguồn còn qua restart, không tự resume. Chưa production operation/retention/long-running model acceptance.|
| Bảo mật |Không mở quyền; bounded untrusted feedback và pattern secret omission. Chưa sandbox secret/network đầy đủ hoặc audit bảo mật mới.|
| E2E/metadata |API/browser/package fixture có hash/IDs/evidence; human UX, native model/billing và máy remote thật vẫn unknown.|

Feedback mới về giao thoa Codex App vẫn đúng ở tầng tính năng; phiên này không chứng minh khác biệt đa-provider hoặc xây lại nền tảng. Thay đổi đáng review cho người dùng managed cần provenance; khi chỉ cần sửa code nhỏ, direct CLI vẫn là baseline đơn giản hơn. Không cần giám đốc chia việc thường nhật; đánh giá model/remote thật chỉ làm khi có quyền/hạ tầng/ngân sách riêng.
