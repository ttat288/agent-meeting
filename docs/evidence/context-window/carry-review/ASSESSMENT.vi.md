# Đánh giá hướng context/carry — khả thi có điều kiện, chưa nghiệm thu model

**Cập nhật mới nhất — đã thực thi lát cắt canonical local:** xem [kết quả trong60 phút](#lát-cắt-canonical-local-trong60-phút-2026-10-22). Assembler đọc kho canonical do test tạo, checkpoint có delta tùy chọn, source/WIP/revision/privacy guards đã kiểm; source sản phẩm `team.js` có thay đổi chưa commit. Các đoạn review/export dưới đây là lịch sử, không là design review của source mới hoặc nghiệm thu model/controller. Full suite mới338/338 trên30 file; chi tiết/hash/log và overhead ở mục mới.

Ngày2026-10-22. Đây là kết quả đọc source, một lượt kiểm kê bằng Antigravity và một lượt Claude không thành công; **không có đồng thuận của hai agent hoặc phản biện thiết kế thành công từ Claude**. Bản nháp và phạm vi ở [REVIEW-PACKET](REVIEW-PACKET.vi.md); bằng chứng kiểm độc lập ở [verification.json](verification.json). Chưa sửa runtime sản phẩm hoặc triển khai collector/carry assembler trong lượt này.

**Cập nhật local tiếp nối:** đã hoàn thiện phép dựng context từ evidence lưu trên đĩa với reference truy hồi thật trong script offline và kiểm tra nguồn/identity có giới hạn. [benchmark-carry.js](benchmark-carry.js), [kết quả](benchmark-carry.json):21/21 ca đạt; không gọi model mới, không sửa source sản phẩm. Đây là bước kiểm tiếp theo, không thay thế kết quả5 invariant lịch sử hoặc làm mới review Claude. Kết luận vẫn **khả thi có điều kiện; chưa đủ bằng chứng lợi ích để tích hợp controller**.

## Kết luận về pain point

**Tool có log task/run/diff/test/integration, nên có thể dựng phần context đã được ghi bằng code, không cần gọi model chỉ để tóm tắt lại các facts đó.** Tuy nhiên, lưu ngoài model không có nghĩa successor tự biết; nó vẫn phải đọc một phần dữ liệu, tốn input token và context. Task done không tự chứa quyết định/ràng buộc chưa ghi, phương án đã thử thất bại, blocker hay bước tiếp. Không yêu cầu serialize suy nghĩ nội bộ; chỉ giữ quyết định/rationale ngắn và facts có ích cho công việc.

Source hiện tại: `team.js:207-208` vẫn yêu cầu decisions/unknowns/next do caller cung cấp. `contextFor` loại full snapshot nhưng không suy diễn semantic summary. WorkManager có base/revision/evidence; export journey dùng cho minh họa không xuất hết các field đó. Vì vậy không được suy từ missing field của export rằng live store thiếu dữ liệu, cũng không được suy đủ task log nghĩa là đủ context cho mọi successor.

Phương án đáng thử: canonical state/evidence references + delta nhỏ ngay ở mốc làm việc, dựng capsule bằng code, chỉ hydrate phần task đang cần. Nếu dữ kiện đã được ghi thì không thêm lượt model tóm tắt riêng. Delta output và successor đọc vẫn có token; metric đúng là **zero dedicated summarization invocation khi đủ dữ liệu**, không phải zero total token. Nếu không giúp hơn CLI native ở quality/cost tương đương thì giữ cách đơn giản hoặc bỏ overhead.

## Hai lượt CLI thực tế và giới hạn quyền

User cho phép Antigravity/Gemini Flash3.8 trả phí, giao extraction thay quyết định kiến trúc; cho thử Claude. Catalog revision1 không có candidate enabled/verified hoặc provider IDs, nên không đổi catalog/global settings để làm review. Kiểm executable/version không là model probe. `agy models` cho ID Flash low/medium/high; chọn low và đã thông báo.

| Attempt | Runtime/requested model | Kết quả | Usage runtime báo | Chi phí |
| --- | --- | --- | --- | --- |
| Flash facts | agy1.4.3 / gemini-3.8-flash-low | reported,29.652s; không có trường máy xác nhận actual model | input18712, output1903, thinking0, cache-read0, total20615 token | **Trả phí theo yêu cầu user**; USD/billing chưa biết |
| Claude design review | Claude Code2.1.289 / claude-opus-5-5 | failed,4.971s: OAuth token revoked; không có review | CLI trả input/output0, cost estimate0 | Không có model output; billed USD vẫn unknown, không suy hóa đơn từ estimate |

Raw response/ledger: [Flash](flash-facts.json), [trích xuất](flash-facts.md), [Claude lỗi](claude-review.json), [review-ledger](review-ledger.json). Tối đa2 attempt đã dùng hết; không retry, không login/đổi settings, không paid probe riêng. Đây là quyền **review lần này**, không phải quyền cho benchmark model tiếp theo hoặc ngân sách vô hạn. Mọi usage là runtime-reported, không phải xác nhận hóa đơn. Không cộng payload bytes thành token, không khẳng định Flash actual identity dựa trên văn bản tự khai báo.

Flash phù hợp việc kiểm kê theo phân công, không được xem lời khen/chê model là benchmark năng lực phổ quát. Đã đối chiếu các facts chính với source. Raw Flash tự dựng link file:// tới workspace tạm không tồn tại các file đó: không dùng các link này làm bằng chứng; xem đường dẫn/line thật trong verification. Có thể giữ phản hồi bất lợi/unknown mà không gọi lại để ép đồng thuận.

## Những điểm phải sửa/kiểm trước khi tự động hóa

1. **Telemetry đúng adapter:** analyzer offline đã có không phải collector. Claude statusline có thể là nguồn cho phiên hỗ trợ nó, nhưng không được giả định statusline xuất đầy đủ trong adapter headless `--print`. Hiện runtime gom JSON cuối invocation; một invocation có thể có nhiều model/tool lượt. Đo sau khi print kết thúc chưa chứng minh can thiệp kịp trước khi context đầy bên trong. Cần xác minh schema/cadence/boundary mà không đổi settings global; unsupported giữ unknown. Native compaction vẫn bật trong baseline.
2. **Facts đủ và truy hồi được:** giữ goal/plan/task/base/source revision, grant/constraints, WIP paths/hashes, accepted decisions/rationale ngắn, failed attempts hữu ích, tests/evidence/unknown/next. Dùng kho hiện hữu và references thật, không tạo memory system tổng quát. Log báo xong không được nâng thành verified/integrated. Private PM/credential không nằm trong capsule; dữ liệu agent là untrusted, không cấp quyền.
3. **Không tạo summary call dư:** ưu tiên structured delta trong output đã có. Thiếu critical fact phải được báo rõ, lấy từ nguồn có quyền hoặc hỏi đúng quyết định; không bịa summary để vượt gate. Không cưỡng ép mọi progress thành metadata dài. Đo token delta/readback/setup, không chỉ số call.
4. **ACK có giới hạn:** `session-child.js:13` bootstrap model và`:22` activation là hai invocation. `runtime.js` dùng `--no-session-persistence`, nên không có native memory transfer từ ACK sang execution; checkpoint được nạp lại. Hash ACK chứng minh phản hồi đúng payload, không chứng minh hiểu và làm đúng. Phải đo overhead này; chưa tự bỏ ACK/quiesce/write fence để tối ưu vì chúng bảo vệ khác nhau. Nếu thay bằng readiness xác định ở code thì vẫn cần semantic/behavior acceptance và source tests; thiết kế thay đổi cần kiểm trước triển khai.
5. **Controller thận trọng:** runtime measurement + app-known input + forecast upper margin + headroom cho bàn giao; freshness/session/generation đúng. Unknown, mismatched, stale và output lớn cần nhánh an toàn. Không ngưỡng80% chung và không hứa context không tăng. Shadow trước auto-trigger; swap cùng slot giữ single writer và grant/caps hiện có.

## Benchmark và metric đã ghi / còn thiếu

[benchmark-local.js](benchmark-local.js) dùng evidence export fixture trước, không gọi model; [kết quả](benchmark-local.json):5/5 invariant đạt, assembler model calls0, khoảng1.402ms trên máy này. Capsule1154 byte, projection cùng facts660 byte: **overhead494 byte**. Export đầy đủ6456 byte có nhiều log lặp, chỉ là đối chứng transport yếu; không dùng chênh lệch đó để claim thắng direct CLI. Không bơm thêm log để làm baseline xấu.

Fixture export thiếu4 field metadata trong projection nên experiment không nhận ready-for-autonomous-continuation. Nó còn kiểm checkpoint.next cũ không được replay sau task integrated, reported không thành done, integrated thiếu test source không được accepted. Đây là kiểm structural facts, **không phải semantic retention bằng model**. Model token/context prediction/overflow/total billing/8h đều null/unverified. Assembler chỉ là code experiment dưới evidence, chưa tích hợp runtime.

Benchmark triển khai kế tiếp cần khóa trước source/input/acceptance/model/version/quyền/budget/case order. Arm A direct CLI native context/auto-compaction mạnh; arm B tool-derived state + structured delta, không dedicated summary call. Nếu không có swap trong workload thật thì chưa chứng minh recovery; không nhồi context để ép có swap. Case parser pilot đã khóa là phép thử khác, không âm thầm dùng input mới.

Metric tối thiểu:

| Nhóm | Metric và provenance |
| --- | --- |
| Quan sát | schema/source/CLI version/model/session/generation, capture time/sample age, coverage và missing/mismatch; peak observed context, không cộng usage thành resident context |
| Dự báo | forecast ghi trước hành động, actual cùng boundary, underprediction distribution/max/exceedance, interval coverage, cỡ mẫu/CI; thiếu actual thì null, không suy P95/P99 từ vài mẫu |
| Kế thừa | gold must-preserve facts độc lập, missing-critical-fact, stale/unauthorized writes, repeated/forgotten work, scope/decision đúng, source tests sau swap; presence-of-key không là semantic pass |
| Phục hồi | đủ headroom bàn giao, late/avoidable swap, generation/slot/WIP continuity, startup/rehydrate/recovery latency và failures; reject unknown state đúng cũng là kết quả |
| Tổng chi phí | mọi PM/lead/worker/review/delta/ACK/activation/retrieval/compaction/retry input/output/cache/reasoning, toolschema/output, elapsed/công user/setup/repair; observed/null tách0 |

Điểm dừng/gate: local fixtures phải giữ facts/evidence/revision và fail closed với thiếu/stale; collector shadow phải có actual telemetry hợp lệ mới tính prediction error. Trước model benchmark cần quyền mới vì2 review attempt đã hết; không khẳng định tiết kiệm hay8h nếu chưa có matched model run/coverage/quality. Nếu overhead không được bù thì đơn giản hóa; không tiếp tục tối ưu vô hạn hoặc làm thêm UI/remote/multi-file/HR để có demo thắng.

## Benchmark local tiếp nối: nguồn thật, delta chưa có, reference có giới hạn

Pain point đang kiểm là successor phải đọc lại log để tìm facts đã lưu, trong khi nhãn task done có thể làm mất ràng buộc hoặc lặp việc. Cách đơn giản đối chứng là đọc trực tiếp đúng facts/evidence cần thiết. Tiêu chí đủ của lát cắt này: dựng recorded facts bằng code, chỉ ra phần không dựng được, truy hồi đúng evidence trong export đã khóa và từ chối nguồn không khớp; công khai overhead. Không đặt mục tiêu chứng minh successor hiểu đúng bằng fixture.

Script chỉ đọc `docs/evidence/pm-team/journey.json` và hash source repo; không đọc live store trong home, transcript CLI hoặc credential. Input pin SHA-256 `97f34355f25002c929b0bea09841687748616670d4c28b2071d7c58691044a1a`. Task/run/slot/generation và goal/plan revision đối chiếu các field có trong export. Resolver dùng đường dẫn cố định, ba JSON pointer allowlist `/run/evidence`, `/run/integrationEvidence`, `/run/changes`, hash riêng của projection và budget8.192 byte/tối đa3 reference không trùng. Nó là resolver trong experiment, **chưa là endpoint truy hồi của sản phẩm**. File hash chứng minh bytes nguồn đã pin, không chứng minh source workspace/grant hiện vẫn mới; không có requirement/base revision để kiểm thì vẫn blocked.

Facts dựng được: task/run ID, slot A/generation2, goal/plan revision1, acceptance `sum(2,3)=5`, scope `sum.js`, before/after hash, trạng thái run integrated và kết quả test đã lưu của workspace/source. Cờ `completedInFixture` chỉ phản ánh trạng thái và test trong export; không chạy lại test sum hoặc xác nhận cây source hiện tại. `checkpoint.next` thuộc mốc trước integration nên không replay. Dù biết task này nên dừng, không suy ra task tiếp theo hay quyền chạy mới.

### Delta tối thiểu và nguồn phải nối

Mười mục dưới là **nhóm thông tin còn thiếu/chưa dùng được cho continuation trong export này**, không phải mười field chắc chắn thiếu trong live store. Bốn field của benchmark cũ vẫn là bốn field của projection cũ; phép kiểm mới rộng hơn, không so count đó như tiến bộ hoặc hồi quy.

| Nhóm thiếu trong export | Source hiện có | Delta thực sự cần ghi khi làm / xử lý |
| --- | --- | --- |
| Goal | `work.js:201` requirementSnapshot; `:206` objective; `pm.js:96` goal có revision | Lấy goal chuẩn có revision; không suy từ tên file hoặc acceptance |
| Requirement revision | `work.js:201`, `team.js:207` | Truy hồi giá trị hiện hành và đối chiếu task/run/checkpoint; không tự điền1 |
| Base revision | `work.js:188-201`, `team.js:207` | Lấy base cùng source snapshot; commit SHA một mình không phát hiện dirty changes |
| Source snapshot | `work.js:203` before; `team.js:202-207` source/WIP inventory | Nối hash/revision nguồn chuẩn và kiểm lại tại lúc dùng; change hashes không thay full source guard |
| Grant/constraints | `pm.js:101-117`; `team.js:29-34`, `:221-227` | Chỉ hydrate ràng buộc cần thiết; quyền phải kiểm từ live coordinator, không sao chép token/hash quyền vào context |
| Decisions/rationale | `team.js:208` caller cung cấp decisions | Ghi quyết định đã chọn và lý do ngắn khi phát sinh, nguồn/revision; không serialize suy nghĩ nội bộ hoặc gọi summary riêng |
| Failed attempts hữu ích | Work store có nhiều run/status/evidence; chưa thấy record cấu trúc riêng cho phương án bị loại | Chỉ thêm điều đã thử, outcome và điều cần tránh chưa có trong artifact; không suy lý do thất bại từ exit code |
| Unknowns/blockers | Task có unknowns (`work.js:144`, `pm.js:177`); checkpoint caller unknowns (`team.js:208`) | Ghi blocker/unknown hiện hành và điều kiện gỡ; thiếu record không có nghĩa không còn unknown |
| Checkpoint WIP | `team.js:205-207` có wip/snapshot/workspace; export chỉ còn scope và hash checkpoint | Dùng WIP đúng mốc đang chạy. Run changes sau integration không được gắn nhãn WIP trước swap |
| Current next action | `team.js:208` caller next; export giữ next cũ | Task integrated → dừng. Với task dở, ghi bước tiếp còn hiệu lực gắn checkpoint/revision và unknown; không kéo next cũ qua completion |

Trong một output vốn phải trả, delta chỉ cần các quyết định/blocker/thử thất bại/bước tiếp **mới hoặc thay đổi**; facts máy đã lưu thì dùng reference. Không bắt mọi progress lặp cả capsule. Rỗng có chủ đích phải phân biệt unknown/missing; không tự ghi “không có” để qua gate. Chưa có live-store capture được phép/được lưu cho fixture này, nên không bổ sung giá trị giả từ source code. Không cần xây memory store mới để hoàn thành assessment.

### Kết quả và đối chứng cùng dữ kiện

| Payload JSON compact UTF-8 | Byte | Ý nghĩa |
| --- | ---: | --- |
| Direct: đúng recorded facts | 459 | Đối chứng local nhỏ nhất cho phần facts đã chọn |
| Capsule cùng facts + missing/gates/references | 1666 | Thêm1207 byte; không chứng minh tiết kiệm |
| Toàn bộ3 evidence metadata trả về | 708 | Tính cả envelope pointer; không gồm raw test output |
| Direct facts + cùng toàn bộ evidence metadata | 1167 | So đầy đủ cùng dữ kiện được đọc |
| Capsule + cùng toàn bộ evidence metadata | 2374 | Vẫn thêm1207 byte; changes có thể bị đọc lặp, đã tính vào cả hai arm |

Export gốc6456 byte vẫn chỉ là đối chứng transport phụ. Những con số trên không gồm system prompt/tool schema/native compaction/tokenizer/cache/setup, không phải model A/B hoặc hóa đơn. Không so tỷ lệ giảm giữa benchmark cũ660/1154 byte và bản này459/1666 byte: projection đã đổi. Thời gian trong JSON là một lượt script **gồm các checks**, không là latency assembler riêng hoặc phân phối hiệu năng. Các metric successor input/delta output/usage/billing/retention/prediction/overflow/recovery/live writer đều null; chỉ số model calls của assembler bằng0 và real model runs bằng0.

21 ca kiểm gồm: public reference đúng; chặn next cũ; missing critical → blocked; reported không thành integrated; test thiếu/fail/cancel/timeout; source bytes đổi; report lẫn task/run; generation/goal/plan/slot sai; acceptance xung đột; private/snapshot/raw output không vào projection; pointer/path không thuộc allowlist; digest sai; retrieval quá budget/trùng; không cấp writer/semantic acceptance từ fixture. Các ca mutation là **âm tính tổng hợp**, không dữ liệu model hoặc delta được khôi phục. Privacy check chỉ chứng minh projection không lấy các field đã loại; text trong acceptance/command/path vẫn là untrusted và cần cơ chế redaction/quyền sản phẩm trước dùng live. Không coi hash đúng là nội dung đúng về mặt ngữ nghĩa, single writer hiện tại hoặc source còn mới.

Tái lập từ gốc repo, không gọi `run-reviews.js`:

```bash
node docs/evidence/context-window/carry-review/benchmark-carry.js
node --test test/context-window.test.js
```

6/6 test analyzer offline đạt trong lượt tiếp nối, log ở [local-tests.txt](local-tests.txt); syntax và `git diff --check` đạt. Không chạy lại full suite295/29 vì không sửa source sản phẩm; số đó vẫn là lịch sử. Hash source trong report mới khớp các hash audit trước; raw review, ledger và input fixture giữ nguyên.

### Kết luận và cửa còn mở

Lát cắt đánh giá/local benchmark đã đủ để nói **dựng recorded facts không cần dedicated summary invocation**, xác định delta không suy được và đo overhead của phương án reference. Chưa đủ để nói carry giảm tổng token/công người dùng, semantic retention đạt, hoặc context luôn dưới giới hạn. Không có số đo headless từng internal turn dưới quyền hiện tại: collector tại boundary đó giữ **unverified/unsupported cho auto-trigger**, không dùng JSON cuối invocation thay telemetry giữa lượt. Không bật controller.

Phần còn lại cần nguồn/quyền mới: capture canonical state an toàn và current revision/grant để kiểm source/WIP thật; xác minh collector schema/cadence trên adapter đã chọn; gold must-preserve facts và matched direct-native/model run với toàn bộ chi phí ACK/activate/delta/retrieval/retry. Model/phiên bản/probe/run cap/budget phải được cấp riêng trước model run;2 attempt cũ đã hết. Nếu không chứng minh lợi ích bù overhead ở chất lượng tương đương thì giữ direct CLI/native compaction. Claude design review vẫn chưa thành công; không sửa OAuth/settings hoặc chạy thêm model để lấp chỗ trống. Nghiệm thu model thật/8h còn mở.

**Bàn giao được đề nghị là conditional implementation/validation, không là design acceptance của hai model.** Claude review còn thiếu do auth; không tự sửa OAuth/global config. Có thể tiếp tục phần local/fixture/source audit không tốn model trong phạm vi, còn model test/call mới chờ quyền rõ ràng.

## Lát cắt canonical local trong60 phút (2026-10-22)

**Quyền và thời gian:** yêu cầu mới cho phép thực thi local trên kho do test tạo, không mở rộng quyền model/live store. Bắt đầu21:42:20, deadline22:42:20 ngày2026-10-22 (Asia/Bangkok, UTC+7); kết thúc22:01:18, thời lượng18.98 phút; chi tiết ở [canonical-verification.json](canonical-verification.json). Dừng sớm khi đạt các tiêu chí local dưới đây. Không dùng thời gian còn lại để bật controller hoặc gọi model.

**Pain point đã xử lý trong lát cắt:** assembler trước chỉ đọc export tĩnh thiếu metadata, successor dễ dùng next cũ. [Công cụ local](../../../../tools/carry-canonical.js) nay đọc task/run/checkpoint canonical do API sản phẩm tạo trên checkout/store tạm, dựng phần đã ghi và truy hồi evidence được phép; không phải endpoint/runtime hook hoặc memory engine mới. Không có default store và không mở store trong home người dùng. Test đọc cùng ConfigStore, không tạo WorkManager thứ hai làm reconcile writer đang chạy.

**Delta còn thiếu được ghi tại checkpoint:** thêm tùy chọn `continuation` trong `TeamController.checkpoint`; giữ nguyên `decisions`/`unknowns`/`next`. `decisions` ghi quyết định và rationale ngắn, không suy nghĩ nội bộ. `failedAttempts:[{attempt,outcome,avoid}]` giữ điều đã thử/outcome/điều tránh, `blockers:[{issue,resolution}]` giữ vướng mắc/điều kiện gỡ. Hai mảng phải tường minh, tối đa10 mục/mảng,1000 ký tự/field, được kiểm mẫu secret bằng cơ chế sản phẩm có sẵn. Extra fields bị bỏ, không spread vào checkpoint. Không gửi delta vẫn tương thích API cũ nhưng assembler báo missing/block; `[]` là caller ghi rõ chưa có tại mốc đó. Delta được lưu cùng revision/hash checkpoint trong một thao tác CAS, không gọi summary model. Đây là **caller-reported**: code không tự xác minh semantic truth của quyết định/outcome. Không sửa prompt tự động để ép mọi progress ghi delta.

### Kết quả verified local và phạm vi integrated

[Test journey](../../../../test/carry-canonical.test.js) dùng API plan/readiness/run/checkpoint/swap/verify/integrate thật, kho/checkout tạm và executable fixture không có network/model. Driver `session-child.js`, parser `runtime.js`, sandbox bwrap và supervisor production chạy với discovery thay bằng executable test cố định; không chạy executable Claude/Codex/agy thật. Các probe trong helper cũng là hàm fixture được inject, không probe provider. Fixture ghi WIP thật, bootstrap thử ghi bị chặn, predecessor được drain trước successor và capability cũ bị từ chối. Chỉ test-created source được integrate/reset/cleanup.

- **42 ca kiểm + parent =43 test đạt**: identity task/run/PM/slot; goal/plan/requirement/base/config/generation; checkpoint hash; source dirty dù HEAD giữ nguyên và HEAD đổi dù bytes giữ nguyên; WIP snapshot/scope; thiếu run/snapshot/decisions/unknowns/next/delta/grant limit; blocker hiện hành; reference hash/allowlist/budget/tối đa3/trùng/stale store revision. Missing hoặc xung đột không tự điền; lỗi filesystem không được echo đường dẫn riêng vào capsule.
- References chỉ trả `evidence`, `integrationEvidence`, `changes`, tối đa8192 byte/read. Evidence lấy tên test đã khóa và exit/timeout/cancel/error boolean/thời điểm, không raw output/error prose, arbitrary argv, report, full snapshot, config/grant token hoặc private PM channel. Selected text có mẫu credential bị từ chối. Không thể nhận biết mọi bí mật hoặc private prose bằng regex; đây vẫn là untrusted data, không cấp quyền chạy.
- Running thiếu critical delta → blocked; blocker ghi rõ → resolve-recorded-blockers. Reported chỉ đề nghị verify; verified chỉ đề nghị integrate; integrated phải có task done và tests đầy đủ/passing ở cả workspace/source hiện hành mới đề nghị **dừng task đã tích hợp**. Không dùng checkpoint.next hoặc delta lịch sử như next mới sau report/integration; không suy ra quyền hay task kế tiếp. Evidence thiếu/fail/cancel/timeout/trùng không thành completion. `localStateConsistent` chỉ là kiểm cấu trúc/nguồn tại lần đọc, không là semantic acceptance hoặc autonomous readiness.
- ACK/quiesce/write fence và cơ chế swap hiện hữu giữ nguyên. Assembler luôn trả `writerPromotionAuthorized:false`, `semanticRetentionVerified:false`; reference/hash không cấp capability hoặc chứng minh writer quiescent. Mutation âm tính là dữ liệu test tổng hợp đã khôi phục, không phải sự cố model thật.
- **Full suite mới338/338 test,30 file**, RAM1200MiB/swap0, timeout900s, runner tuần tự; exit0, không skip/cancel. [Log](canonical-tests.txt); syntax checks và `git diff --check` đạt. Đây là kết quả mới, không tái dùng295/29. Hash source hiện tại và report/log ở [verification](canonical-verification.json), [benchmark](canonical-benchmark.json). Hash review trước là lịch sử: `src/team.js` đã thay đổi ở delta tùy chọn, không coi review cũ bao phủ source mới.

**Phân biệt trạng thái:** delta và code experiment đã có trong workspace chưa commit; test local đã verified trên source tích hợp hiện tại. `reported/verified/integrated` trong report benchmark là trạng thái canonical của task **fixture**, không phải task/model người dùng. Chưa tích hợp assembler vào runtime hoặc bật controller; không đọc/sửa live-user store. Quyền model review trước đã hết và Claude design review vẫn chưa có kết quả thành công.

### Overhead cùng dữ kiện

Đây là phép so payload transport từ cùng nguồn đã kiểm: direct nhận đúng facts + binding/revisions + missing/next; cả hai arm tính cùng delta ghi và cùng evidence readback. Không dùng full log hoặc direct thiếu provenance làm baseline. Không phải hai model run hay đo thời gian/công vận hành CLI native. JSON compact UTF-8 trong lượt ghi [canonical-benchmark.json](canonical-benchmark.json):

| Payload / mốc | Direct | Capsule | Chênh lệch |
| --- | ---: | ---: | ---: |
| Running: facts/binding/next/missing |1671 byte|2395 byte|+724 byte|
| Running: cộng cùng delta552 và evidence272 |2495 byte|3219 byte|+724 byte|
| Integrated: facts/binding/next/missing |1280 byte|2004 byte|+724 byte|
| Integrated: cộng cùng evidence534 |1814 byte|2538 byte|+724 byte|

Delta552 byte là toàn payload ghi checkpoint hợp lệ trong phép đo, không chỉ trường mới; đã tính cho cả hai arm. Integrated tính delta mới0 vì chỉ dừng task, không phát minh next/delta sau completion. Payload capsule tính cả schema/refs/gates; evidence gồm envelope, không raw test output. Đây là **overhead thêm**, chưa chứng minh giảm token/chi phí hoặc tiết kiệm so direct. Không so tỷ lệ với hai projection export cũ vì dữ kiện khác.

Đo thêm **đường swap production hiện hữu**, tách khỏi so assembler/direct vì assembler chưa gắn runtime: bootstrap input1490 byte, activation input2158 byte, tổng3648; checkpoint1270 byte xuất hiện ở **mỗi** invocation. Explicit adapter args hai lượt475 byte; ACK output fixture113 byte, activation output fixture50 byte. Đây là payload đã quan sát ở test seam quanh production `runCli`, không mô phỏng ACK từ một công thức. Số byte có thể đổi theo delta/đường dẫn/ID; source hashes khóa phiên đo. Không gộp thành claim tổng overhead model: hidden/system/tool prompt, internal turns/cache/reasoning, direct-native recovery và công setup/repair chưa đo. Token/billing/semantic retention/telemetry từng internal turn đều `null`/unverified; actual model calls0, dedicated summary calls0 khác zero input/output/cost của một model pilot tương lai. Không bỏ ACK để giảm payload.

### Tái lập và điểm dừng

Từ checkout, không gọi `run-reviews.js` hoặc executable model:

```bash
AM_CARRY_EVIDENCE_DIR="$PWD/docs/evidence/context-window/carry-review" \
  systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 \
  timeout 180 node --test test/carry-canonical.test.js

systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 \
  timeout 900 npm test
```

Lệnh đầu tạo/cleanup checkout/store tạm, chạy42 checks và parent rồi ghi report nguồn/hash/byte; report của lượt đã lưu và test log là bằng chứng tái lập. `tools/carry-canonical.js` chỉ export `assemble(work, expected)` và `retrieve(work, binding, refs, maxBytes)`, không tự mở kho. Caller phải cung cấp expected task/run/goal/plan/requirement/base/slot/generation đã biết từ coordinator đáng tin; capsule không được tự xác nhận các identity đó. Reference gắn store revision và snapshot lúc đọc, thay đổi sau lần đọc vẫn phải kiểm lại ở lần dùng. Không snapshot filesystem nguyên tử hoặc bằng chứng cho khoảng không quan sát.

**Đã đủ tiêu chí local nên dừng sớm.** Cửa còn mở: semantic continuation/quality bằng model thật, telemetry/cadence headless từng lượt và matched direct-native recovery/cost, review thiết kế độc lập chưa thành công. Tích hợp assembler live hoặc collector/controller cần scope/evidence riêng; model/probe cần quyền/version/budget/run cap mới. Không sửa OAuth/settings để lấp phần thiếu, không đổi parser/input pilot cũ, không hứa context luôn trong giới hạn hoặc nghiệm thu8h. Không có quyết định mới của người dùng cần cho phần local đã hoàn thành.
