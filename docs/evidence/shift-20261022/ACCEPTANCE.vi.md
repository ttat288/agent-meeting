# Evidence ca phát triển — đang thực thi, chưa kết thúc 8 giờ

T0 22:24:53 ngày22/10/2026, deadline06:24:53 ngày23/10/2026 Asia/Bangkok. Trạng thái tại22:57:36:32m43s đã làm,7h27m17s còn lại. Không nhận đã hoàn thành8 giờ hoặc nghiệm thu model8h. HEAD ban đầu `e292fd3833d65152ebfa6133fc27a67285b6cab9`, workspace dirty có sẵn được snapshot private trước sửa; chưa commit/push tại checkpoint này.

## Pain point đã tái hiện và thay đổi tích hợp

- **Web nhìn trạng thái cũ:** API verify đã trả verified nhưng Results vẫn reported/nút verify. Web nay đọc có điều kiện khi view đang hiện, tự hiển thị reported→verified→integrated từ hành động ngoài trang. Khi focus/input/details đang dùng, giữ DOM và báo Có cập nhật; explicit Show updates có chủ đích. Offline giữ dữ liệu cuối, backoff/timeout và nhãn retry; restart phục hồi. Không tự chạy task. Hợp đồng UC11 trong CONSISTENCY-JOURNEYS.
- **Hàng PM dư ở human + lỗi mạng cũ:** chuyển chọn PM/history vào Tùy chọn; active/pending vẫn có supervision, takeover trở lại human; đóng/history/deep link không xóa dữ liệu. State fetch có timeout/no overlap, không có PM idle polling3s khi human. Network error có provenance và xóa khi state fetch thành công; action error không bị refresh thành công xóa. UC12 ghi đích và ma trận. Native request count chưa đo qua browser API; không báo một con số giảm requests giả.
- **Evidence vận hành sai:** cost âm giữ null; multiple modelUsage giữ unknown dù có model label. Frozen acceptance đầu vào pilot2 lỗi trước và2 đạt sau fix do phiên phát triển; không coi đó là writer model hoàn thành task. Public successful-result contract khác giữ nguyên.
- **Base revision cũ qua swap:**3 test thực (checkpoint, swap trước bootstrap, HEAD đổi trong readiness) đều nhận200 trước sửa dù source bytes không đổi; PM report sau integration cũng nhận200. Nay kiểm HEAD cùng snapshot trước readiness/start/checkpoint/swap, sau readiness và trước activation/promotion; submit/report chặn source HEAD khác. Tests dùng Git checkout/process fixture thật, không model. Integration đã có guard riêng từ trước; đây là tránh tiếp tục/wake/report dựa trên provenance cũ, không là bằng chứng đã xảy ra production incident.
- **Lệnh terminal PM:** đổi quoting JSON sang POSIX shell words cho URL/token/client path. Test round-trip qua `/bin/sh` gồm dấu nháy, spaces, `$()`, backtick, newline/Unicode; không chạy interpolation. Không thay quyền hoặc tắt CSP.

## Kiểm browser source tích hợp (CUA, fixture local)

Preview3150 dùng source repo + kho/source tạm riêng, không model; baseline3151 dùng snapshot352 file trước sửa và bản sao cùng dữ liệu fixture. Không mở app user3000. Hành trình giữ task `meeting-7613cb65d421185acbfa5e8186681a97`, run `f6e6dd10-caf4-4721-aed6-7b4d3fa96245`; manual Meeting task vẫn todo trong khi execution integrated, đúng hợp đồng tách tiến độ tự báo.

- So cùng375×812 CSS px và cùng task/report: PM human baseline90px→0px; work633→723px (+90px). Đây là vùng nội dung, không là metric chất lượng/giảm thời gian công người dùng. Browser viewport ban đầu có zoom110%; các số so matched chỉ lấy sau khi xác nhận cả hai innerWidth375/innerHeight812/dpr1. Không lấy set() danh nghĩa làm số đo.
-36 ca localeVI/EN × light/dark ×375/768/1280 × Plan/Execute/Results: đúng heading/task ID, không overflow ngang, PM human height0. Các trường fixture tiếng Anh là dữ liệu nhập, không lỗi dịch. Đã xem screenshot mobile/light và desktop/dark; ảnh VI/EN Results1280×812 dark được export tại thư mục evidence này từ assets có hash khớp source phục vụ sau restart. GIF showcase giữ nhãn bản quay2026-10-21, không nhận là quay mới.
- Trạng thái integrated do API ngoài trang xuất hiện không bấm Refresh. Mở evidence rồi backend thêm quyết định: details vẫn mở và focus giữ ở summary; có nút Show updates. Áp dụng bằng nút chuyển focus về work heading.
- Đang sửa acceptance draft rồi backend thay quyết định: input/focus/details giữ nguyên, có Updates available. Navigate/Back/reload mở lại draft đúng task/revision, không gửi save/run.
- Offline thật bằng dừng service preview: run cuối vẫn hiện và có nhãn Connection lost/retrying; khởi động lại cùng kho phục hồi trạng thái. Đã tìm lỗi stale `Failed to fetch` của PM và sửa provenance; kiểm PM recovery tiếp trên source cuối trước xuất bản.
- Menu Agent chairs mở invitation không launch model. Takeover/history/close bằng Enter và focus về Options kiểm; source conversation link/Back về Results giữ ID. Console warning/error rỗng trong vòng kiểm36 ca; lỗi fetch ở vòng offline trước đó là có chủ ý. Chưa kiểm bằng screen reader thật hoặc nghiệm thu UX từ người dùng.

## Benchmark có raw/script

[Protocol](PROTOCOL.vi.md), [raw local HTTP](work-watch-benchmark.json), tái lập:

```bash
systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 \
  timeout 180 node tools/benchmark-work-watch.js 30 /tmp/work-watch-result.json
```

Canonical task API synthetic1/25/100 task,30 mẫu/arm/workload, đảo AB/BA, cùng state/acceptance. Unchanged body tổng unconditional82320/435360/1540170 byte, conditional0; mỗi30 conditional có2490 byte header request thêm,10350 byte response headers so unconditional10890. Mutation200 trả facts byte-identical;403/404/405 không bị conditional bypass. Median milliseconds theo1/25/100: unconditional0.532/0.891/1.945, conditional0.471/0.801/1.795; có mẫu conditional25 task max1.794ms cao hơn baseline max1.665ms, không giấu tail thua. Mẫu là local HTTP, không tương đương UI3s freshness hoặc human time. Đầu vào và source hashes nằm trong raw report; nếu source đổi thì report này thuộc đúng version đã ghi.

Auto polling thêm requests so với người không refresh; native direct CLI có thể stream kết quả không polling work. Các số này không chứng minh thắng direct CLI hoặc tiết kiệm token/billing. Hai setup attempt lỗi được giữ trong protocol: hostSay vượt MAX_TEXT, sau đó fuzzy dedup; v3 dùng host task API chính thức, không sửa sản phẩm hoặc giảm acceptance cho benchmark.

**Model A/B chưa có kết quả:** [ledger](model-ledger.json) ghi direct Claude2.1.289/requested claude-opus-5-5, exit1/OAuth revoked sau4570ms. Native direct có Read/Edit/Write/Glob/Grep/Bash, context management bật và cap CLI1USD/120s; không tắt khả năng baseline hoặc truyền patch. Receipt runtime nói0 token/cost, billed cost và phiên Codex/human setup vẫn unknown. Không probe/PM/worker/retry/fallback/auth repair sau failure. Input pilot mới đã khóa, không sửa input cũ; chưa có efficacy, semantic retention/context/billing hoặc runtime8h.

## Tests và giới hạn checkpoint

- [Baseline](baseline-tests.txt):338 test/30 file,0 fail, tuần tự/cgroup1200M/swap0/timeout900s trên source lúc bắt đầu.
- [Frozen acceptance trước](parser-before.txt)/[sau](parser-acceptance.txt):2 fail→2 pass. Đầu vào test không đổi; source parser sau fix riêng, không trộn vào model arm.
- [Head guard](head-guard-tests.txt):82 checks,0 fail, tuần tự `--test-concurrency=1`, cgroup1200M/swap0/timeout180s; PM/team/canonical carry. [Red team](team-head-before.txt) có redaction fixture capability trong assertion, [red PM](pm-head-before.txt) giữ lỗi trước fix. Test submit được bổ sung sau guard, không gắn nhãn có red run.
- [Web/quotes/i18n/runtime/API](web-tests.txt) là targeted source tương ứng. Full suite mới, package smoke, source hashes cuối, commit/push/CI và browser cuối còn phải làm trong ca. Không dùng baseline338 để thay kiểm source mới.

Chưa có model thật hoàn thành task, multi-file/remote thứ hai, telemetry/controller tự động/context8h, hard monetary cap, human effort/billing đối soát hoặc người dùng chấp nhận UX. Giữ fixture/local/model/unknown tách biệt. Không coi số test/ảnh đẹp/LOC hoặc thời gian phát triển là nghiệm thu sản phẩm/model8h.

## Checkpoint23:09:58 — ca tiếp tục

45m05s đã làm,7h14m55s còn lại; nhánh `codex/2026-10-22-product-hardening`, chưa commit/push. Extracted tarball smoke68 file/11 module bắt buộc/4 route+bundled skill đạt ([package](package-smoke.json)); không cài lên app user. Full suite346/346 trên31 file đạt trước refinement cuối về foreground/poll race, sẽ kiểm lại source cuối. Không gắn346 đó cho version chưa kiểm.

Soak90 phút đang chạy:3 HTTP client (1 unconditional +2 conditional),3s cadence,100 task tổng hợp, mutation30s, restart giữa khoảng; output/private partial `/tmp/am-shift-watch-soak-90m.json(.partial)`, source hashes pin theo tiến trình. Smoke1 phút đạt60 request/1 restart/0 errors. Thời gian phát triển hoặc soak HTTP không nghiệm thu model8h/context8h/giảm billing; chỉ báo kết quả khi tiến trình kết thúc thật.

## Tiếp nối — nguồn tái lập và receipt thật

Nguồn ban đầu của workspace được commit riêng `805f638bdd68cb08103c8c1ca93b832be54e1a69`, giữ bytes preexisting; current worktree tiếp tục chứa các sửa của ca. Frozen writer input tái tạo bằng `node tools/reproduce-writer-input.js`: clone temp tại basee292fd3, overlay archive foundation +6-file delta, verify352 file/acceptance hashes cho cả direct/PM. [Manifest](writer-input/manifest.json), [reproduction](writer-input/reproduction.json); sourceDigest491c1657… giữ đúng bản đã dùng cho attempt Claude. Cả hai clone fail2/2 acceptance trước fix. Không dùng source parser hiện đã sửa như một case chưa giải; prepare hiện chặn case đã hết lỗi.

[Read-only audit riêng](readonly-audit/PROTOCOL.vi.md) đã chạy đúng tổng cap2: một lỗi cờ timeout (89.43ms), một technical retry42367.76ms. CLI reportedSUCCESS nhưng có denied_actions RunCommand, response chỉ là mở đầu, không deliver JSON predictions; actual model unknown. Runtime usage input16289/output1169/total17458/cache_read8441, không là resident context/billing. Managed arm blocked/no-call; không có model A/B hoàn tất. Adapter production đã sửa nhận denied_actions và diagnostic; post-run classification có hash riêng, giữ nguyên receipt cũ. [Ledger toàn ca](session-model-attempts.json) tính cả Claude auth failure +hai attempt agy, billed/preparation/human cost unknown. Không gọi thêm model sau cap này.

PM recovery source cuối đã kiểm: network alert xuất hiện khi stop preview, focus vẫn BODY; sau start lại state thành công thì alert rỗng/hidden. Action grant lỗi vẫn giữ sau state refresh; form nguyên dữ liệu. Focus đưa alert vào vùng nhìn thấy (trước fix bị cắt dưới vùng cuộn). Sau restart PM phải reconnect đúng policy; không có execution grant/model launch trong test.

Evidence UI nay dùng cùng điều kiện pass như evaluator: exit0 kèm cancelled/timeout/error không Passed. Unit kiểm9 case, browser trên **controlled synthetic store** có4 entries thấy đúng1/4 passed và Test1–3 Failed/Test4 Passed; không dùng nó thay nghiệm thu cancel runtime thật. [Tests](evidence-label-tests.txt).

[Pre-push integrated tests](integrated-prepush-tests.txt)/[source hashes](verification-prepush.json):349 test/32 file,0 fail/skip/cancel, sequential/cgroup. Đây là source của checkpoint xuất bản đầu, không thay kiểm source cuối ca hoặc user/model acceptance. Soak90 phút còn đang chạy; chưa công bố completed. Ca8 giờ vẫn tiếp tục tới deadline06:24:53.

## Lát cắt tiếp — focus giám sát PM (23:56 +07)

Đã push foundation805f638 + lát cắt66a4e986d3aedac644b46caa859890741081f152 lên nhánh `codex/2026-10-22-product-hardening`. Desktop installer CI3 nền tảng đạt; Linux Node18 đã đạt, Node20/22 còn chờ tại checkpoint này. Các dòng whitespace trong red TAP là output gốc, được giữ nguyên; `diff --check` cho source sạch. Không kết thúc ca.

Pain point tái hiện: keyboard focus Revoke PM → POST private message từ API khác → poll render mới → activeElement BODY dù status vẫn active. Sau sửa các vùng summary/pending/progress chỉ dựng lại khi dữ liệu riêng đổi, cùng phép thử thấy focus vẫn Revoke PM và message mới xuất hiện. Pause bằng Enter chuyển tới summary PM paused; takeover bằng Enter về btnOptions/root hidden. Không có execution grant/model call. Search skill hai lần trả focus appearance/visibility chung, không có match chính xác preservation; dùng nguyên tắc chung làm fallback, quyết định cụ thể dựa trên browser reproducer. J20 bổ sung vào journey hiện có, không thêm screen.

## Phục hồi kiểm chứng và bảo toàn nguồn — tiếp tục ca

[Browser/API recovery](verification-recovery.json), [ảnh chờ test](verification-cancel-en.jpg). Controlled slow Node test25s ban đầu: Verify tại Results chỉ disabled và stale reported; hủy phải chuyển Execute. Source mới thêm trạng thái chờ+Cancel tại nơi bắt đầu và cả Results khi reload/external action. Hủy test thật5947ms, evidence cancelled/exitCode null, source nguyên a-b. Ca không hủy hoàn tất request failed sau20168ms vì Node22 internal test-timeout20s (không phải model failure), trong khi Plan draft/focus/details vẫn nguyên và pending cập nhật, không bị callback cũ dựng lại. Đổi fixture test10s và requirementv2 cho ca integration riêng: verification pass, integration cancel→rollback restored/a-b; không đổi acceptance đầu vào model benchmark. API/CLI contract await result giữ nguyên.

[Permission rollback red](mode-rollback-before.txt)/[checks](mode-rollback-tests.txt): chmod nguồn0640→0600 trong lúc integration tests chạy; rollback cũ trả0640, mất sửa ngoài. Nay lstat regular-file/bytes/mode guard giữ0600 và source đã áp dụng, báo conflict/manual reconciliation, không nhận done. [Symlink check](symlink-rollback-tests.txt) bổ sung sau fix: thay target bằng symlink có cùng bytes vẫn giữ symlink/external bytes, conflict. Không gọi đây là filesystem transaction nguyên tử; vẫn cần đối chiếu thủ công nếu nguồn thay đổi đồng thời.

[Inventory red local](inventory-before.txt), [worker red](worker-inventory-before.txt), [34 checks](source-preservation-tests.txt): file `__proto__` có thật bị mất khỏi copy/JSON và unscoped output bị reported. Dùng null-prototype dictionaries cho cả local và worker; giữ file đúng bytes và reject output ngoài scope. Worker test đầu fail ở missing source input; sau sửa kiểm cả source preservation và scope rejection. Một vòng kiểm giữa chừng còn fail do expected byte length trong test ghi nhầm24 thay vì25; đã sửa assertion theo đúng chuỗi, không nới yêu cầu copy/scope. Symlink check riêng không nằm trong34. Full regression source mới còn chạy tại checkpoint này.

PM delayed-response fixture: proxy local3154 chuyển tới kho tạm3150, chỉ delay response `pm/message`2s, không model/quyền execution. Trước sửa, Send khi request khác bận xóa draft chưa gửi; response thành công cũ cũng reset nội dung vừa nhập. Nay act trả success thật; chỉ reset khi nội dung vẫn trùng phần đã gửi, retry bị bỏ không xóa. Browser thấy một message đã gửi, draft kế còn nguyên và không vào history. Pause/revoke/takeover được ưu tiên trong khi request thường còn chờ, actionVersion fence bỏ response cũ. Takeover đóng PM308ms trong một sample, Options focus/draft giữ; sau response2s cũ vẫn human/hidden, không hồi sinh UI PM. Đây không hủy request đã tới backend, không chứng minh mọi thứ tự transport đồng thời hoặc billing/human time.

[Integrated recovery regression](integrated-recovery-tests.txt)/[hash seal](verification-recovery-tests.json):354 test/32 file,0 fail/skip/cancel. Sau seal chỉ refinement DOM đặt nhóm chờ+Cancel ngay cạnh nút Verify thay vì dưới evidence disclosure; syntax/browser VI375×812 và thao tác Cancel đạt trên source placement mới, full matrix CI của commit tiếp theo sẽ kiểm đúng checkout đó. [Ảnh VI mobile](verification-cancel-vi-mobile.jpg), không overflow ngang; fields goal/report tiếng Anh là dữ liệu fixture. Không giả mọi ảnh/receipt cũ có source hash mới.

## Unicode của báo cáo và evidence

[Runtime red](runtime-utf8-before.txt): stream fixture chia từng byte của JSON hợp lệ, báo cáo `Đã kiểm chứng tiếng Việt và 🧪` bị thay U+FFFD dù status reported. [Evidence red](evidence-unicode-before.txt): Node test thật có tên Unicode dài, tail32768 code units bắt đầu bằng low surrogate nửa emoji. Runtime/test stdout/stderr nay dùng incremental UTF-8 decoder; cắt prefix/tail bỏ surrogate bị chia tại biên. Runtime giữ counter byte thực1MiB, test multibyte1.2MB vẫn output-limit, không đổi trần hoặc cho success khi vượt. [26 targeted checks](unicode-tests.txt) đạt, sau đó bổ sung assertion cho report65536-prefix không cắt nửa emoji; full regression source cuối đang chạy. Đây là process/stream fixture và Node test, không là model capability hoặc billing evidence.

[Full Unicode regression](integrated-unicode-tests.txt)/[source hash seal](verification-unicode-tests.json):357 test/32 file,0 fail/skip/cancel trên source đã tích hợp, sequential/cgroup1200M/swap0/timeout900s. [Extracted package smoke](package-recovery-smoke.json) trên source này:68 file,5 route/conditional checks + bundled skill; asset bytes khớp repo, CSP giữ nguyên, không cài app user/model. Tarball SHA e3e9c43ae244baa660a82bc43b07b5eecca69dcff1bfe0f4fa30483830fb4780 thuộc đúng package có README/CHANGELOG tại thời điểm đóng gói.

## Draft revision cũ có đường phục hồi trong UI

Baseline browser đã tái hiện: người dùng nhập acceptancev1; API ngoài trang lưu yêu cầuv2; Save cũ409 giữ text; Show updates lấy v2 nhưng không có đường mở v1 từ UI. Source vốn lưu key theo host/task/revision. Nay form có disclosure chỉ đọc `View previous draft · vN`, chỉ hiện các trường khác với bản đang mở. Chọn draft hợp lệ mới nhất trước revision hiện tại, đúng host/task; không quét vendor/global, tự merge hoặc replay. Current draft được lọc type/whitelist, storage lỗi giữ server data. Không thêm screen/draft store mới.

[Browser8 case](draft-recovery-browser.json):VI/EN × light/dark ×375/1280, old/current acceptance đúng, readonly, chỉ1 trường khác, không overflow. [Ảnh EN mobile](draft-recovery-en-mobile.jpg), [VI light mobile](draft-recovery-vi-light-mobile.jpg). Ctrl+A chọn0..76 trên old field, gõx không thay text. Reload hiện lại recovery; một lần reload về URL setup không query/hash. Rà lại sau đó thấy fixture empty chưa có room JSON (chỉ work store), nên restart tạo createdAt mới và app reset navigation đúng policy cuộc mới; không phải lỗi CUA đã xác nhận. Mở Plan từ nav vẫn thấy draft; fixture được start/persist trước các phép kiểm tiếp theo. Local-storage-disabled/malformed/privacy kiểm helper thật qua [unit tests](draft-helper-tests.txt), chưa phải browser chặn storage.

Không Save thì backend giữrevision2/1 run. Sau API lênv3, vẫn mở được draftv1 dù thiếu draftv2; tự chép text vào current form rồi Save→v4 cùng task,2 tiêu chí, không thêm run. Một kiểm post-save focus bổ sung criterion và Save→v5,3 tiêu chí, vẫn1 synthetic historical run; focus về workTitle (trước refinement là BODY). [API outcome và source hash](draft-recovery-browser.json). Đây là chỉnh dữ liệu fixture riêng, không sửa benchmark model input hoặc nguồn người dùng.

[Full local360/33 file](integrated-draft-tests.txt)/[hash seal](verification-draft-tests.json) đạt0 fail/skip/cancel trước one-line post-save focus refinement; syntax và browser checked source focus mới, CI commit tiếp sẽ kiểm checkout đó. Luồng Cancel đã giảm một lần chuyển view bắt buộc so web cũ (Verify→Execute→Cancel thành Verify→Cancel); đây là count đường thao tác, không metric thời gian/human cost hoặc thắng native direct CLI.

## Đường dẫn source đổi trong lúc tích hợp/rollback

[Red trước ghi](source-root-integration-before.txt): verify xong, source root bị đổi sang symlink trỏ clone có cùng HEAD/bytes, integrate không reject. [Red rollback](source-root-rollback-before.txt): source root đổi trong lúc integrated tests, cancel làm rollback ghi bytes gốc sang cây khác. Cả hai cây đều temp fixture thuộc test; không có dữ liệu người dùng. Root canonical được kiểm trước ghi/sau await và rollback kiểm lại parent path rồi target regular-file/hash/mode. [Targeted checks](source-path-guard-tests.txt), [nested parent](parent-rollback-tests.txt) đạt; nested là check bổ sung sau fix, không gắn nhãn red run. Bổ sung đường phục hồi restore directory đúng rồi explicit retry giữ external tree nguyên; full regression source/test mới đang chạy. Không claim loại bỏ mọi filesystem race hoặc snapshot nguyên tử.

Soak restart scope được làm rõ khi rà runner: tại phút45, script gọi `app.flush()`→`app.close()`→`createApp/restore` trong **cùng Node process** rồi dùng listener mới. Đây là clean server-instance restart/persisted restore, không là OS-process restart, SIGKILL hoặc crash durability. Ba client label được gọi tuần tự trong mỗi round, đảo thứ tự; không claim ba requester đồng thời. Resource samples gồm cả driver/server/raw collection cùng PID. Raw/source hashes của runner đầu ca được giữ nguyên; giới hạn này phải đi cùng kết quả90 phút khi hoàn tất.

[Full path-guard regression](integrated-source-path-tests.txt)/[source hashes](verification-source-path-tests.json):363 test/33 file,0 fail/skip/cancel. Source/test frozen trong lần chạy. Guard trước ghi giữ trạng thái verified khi bị chặn; sau khôi phục canonical directory đúng, explicit retry integrated/tested, cây ngoài vẫn nguyên bytes. Không cần model call hoặc nới quyền để kiểm ca này.

## Soak đã hoàn tất00:38:50 (+07), ca phát triển vẫn tiếp tục

[Raw90 phút](work-watch-soak-90m.json), [analysis/quantile method/limits](work-watch-soak-analysis.json):5400024.414ms,5403 request,100 task UUID giữ nguyên/0 run/0 error,1 clean server-instance restart ở giữa. Journal xác nhận process hoàn tất và30.957s cgroup CPU qua90 phút; số này không là app-only/model/human cost. Mỗi client1801 samples: unconditional1801×200, conditional mỗi arm181×200+1620×304. Body bytes mỗi arm87,002,541 so8,754,183, không gồm headers hoặc tổng chi phí. Median/p95(ms):unconditional5.599/9.369; A2.302/7.217; B4.207/7.547. Order/cache/workload chung ảnh hưởng; chỉ descriptive, không kết luận causal/CLI win.

Tất cả5 source hashes của tiến trình match commit66a4e986d3aedac644b46caa859890741081f152; sourceWorkManager mới khác nên không nhận retroactive90-minute coverage cho source mới. Native model/runtime8h, browser, human effort, crash/SIGKILL và secret/network isolation không được kiểm bằng soak. Script chỉ assert task IDs/no runs/status/body shape; decision freshness từngpayload không được độc lập so khớp ở mọi sample, benchmark/API targeted kiểm mutation riêng. Không rerun hoặc kéo dài fixture để thay thế thiếu evidence model.

## Hàng đợi CI trùng

[Snapshot trước sửa](ci-queue-before.json) có hai CI run push/PR cùng mỗi SHA8b9fae0/db2ba65, trong khi commit cũ còn queued/in_progress. Workflow mới thêm concurrency key theo workflow+head repository+branch (push/ref_name và PR/head_ref cùng key trong repo); fork cùng tên branch và Desktop workflow có group khác. Giữ matrix18/20/22, fail-fast false, memory/time/sandbox checks. [GitHub concurrency syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency) là nguồn kiểm cấu hình; actual Actions ở commit mới sẽ kiểm behavior, chưa claim đã giảm tiền/quality overhead chỉ vì ít run. Không tự đổi repo permissions, branch protection hoặc cắt tests.

CI f531241: push run39825283533 đã cancelled sau PR run39825293789 cùng SHA được lập; PR có đủ matrix18/20/22 và Node18 đang chạy tại checkpoint. Manual cancel39824949891 được nhận;39824939968/39824571056 đã completed trước lúc lệnh tới, không tính là cancellation hoặc tiền tiết kiệm. Cấu hình không hủy Desktop workflow. Chưa coi queued/in_progress là xanh.

## Lựa chọn profile và ý định Run theo đúng revision

[Browser observations](profile-intent-browser.json): trước fix, chọn opus-claude rồi focus Options; tạo task khác qua API làm live render và selection vềrỗng. Nay selection transient theo task/requirement/config snapshot, giữ qua unrelated update/Back/Refresh cùng revision. Apply requirement mới hoặc Refresh config mới/reload yêu cầu chọn lại; không ghi lựa chọn chạy vào local storage.

Hai [red config](viewed-config-before.txt)/[red requirement](viewed-requirement-before.txt) có runtime fixture starts1 thay vì0 từ view cũ (không AI call). Field expectedConfigRevision/expectedRequirementRevision tùy chọn được hostHTTP chuyển có whitelist tới WorkManager, kiểm trên snapshot dùng start; không thêm execution tool MCP hoặc client runner args. [24 targeted tests](profile-intent-tests.txt) kiểm stale/current/fresh-probe/model-remap và0/1 fixture dispatch đúng snapshot, còn API cũ thiếu optional fields giữ semantics cấu hình hiện hành. Current test model-remap được bổ sung sau hai red, không nhận là cùng frozen model benchmark input.

Browser VI Run từ taskv5 khi backendv6 trả alert yêu cầu cập nhật; Apply mới xóa selection. Configv2→v3 và probe fixture mới vẫn chặn Run cũ; Refresh xóa selection. Backend giữ1 historical synthetic run, không có thêm run bởi các lần bị chặn. EN same-revision Refresh giữ opus-claude, không overflow. Guard conservative: ngay cả đổi label/cấu hình không đổi provider cũng buộc Refresh/chọn lại; có thêm thao tác ở ca đó, không claim net human-time/cost win. Full source regression đang chạy.

[CI concurrency verified](ci-dedupe-verified.json):f531241 PR39825293789 đã success matrix18/20/22; push39825283533 cancelled do cùng group. Desktop39825293676 success. Đây là actual Actions behavior của config mới, không phải số tiền tiết kiệm đã đo. Source UI/run guard mới phía trên chưa thuộc run CI đó.

[Full profile-intent regression](integrated-profile-intent-tests.txt)/[source hashes](verification-profile-intent-tests.json):367 test/33 file,0 fail/skip/cancel, source frozen. JSON Run request fixtureprofile opus-claude/config3/requirement6 tăng27→86 byte (+59); không gồm headers/TLS/client/schema/model context hoặc billing. Không thêm probe/model call tự động; blocked stale view cần Refresh và chọn lại, kể cả label-only config edit. Chưa đo human time/net cost.

## Probe chậm, form Quản trị và native invocation đang chờ

Đã tái hiện baseline bằng delay-response proxy3s/fake adapter: đang sửa Model sau khi bắt đầu probe, callback renderAdmin xóa draft và focus; nav Runtime→Models→Runtime trong lúc chờ làm nút probe bật lại. Source mới chỉ cập nhật readonly observations, giữ form/focus; probe nút pending theo profile trong cùng tab, mapping chưa lưu phải Save/revert mới probe. Late error từ view đã rời dùng thông báo, không dựng lại/chuyển focus view mới.

[Lifecycle red](probe-lifecycle-before.txt):same-input probe gọi2 runner, older result xóa newer config observation, close không abort/drain probe. Nay cùng host WorkManager/profile/config chỉ share promise đang active, giữ timeout60s/controller, không cache completed probe hoặc tự retry. Config khác không share; stale result trảstale:true mà không persist thay observation mới. Abort/close không lưu thành access proof; failed promise được xóa để explicit retry hoạt động. [Probe intent red](probe-view-intent-before.txt) kiểm stale view vẫn dispatch trước fix; web gửi configrevision và backend chặn trước runner. API cũ thiếu optional revision vẫn chọn current config.

[Browser checks](admin-probe-browser.json), [counter qua reload](probe-coalescing-browser-metrics.json):draft model và mapping còn nguyên/focus sau completion; quay lại khi pending bị disable, mapping/model/runtime/enable chưa lưu bị disable. Hai request overlap qua full reload tăng fixture runner5→6, active về0; native model0. Không share sau backend đã completed dù response còn đang tới; không global dedupe giữa host/serverrestart, không tiền cứng/billing claim.

Một attempt stale-result với timer3s không kiểm được race: probe checkedAt18:26:40.797, configsave18:26:45.338 sau completion; toast thực là recorded. Đã ghi không là pass cho stale case và lặp bằng file gate có kiểmactive=1, configsave xong mới release. Gate case config3→4:old result not applied, draft/focus giữ; stale-view retry bị409 và không tăngrunner. Failure case gated giữ draft/focus, báo previous result unavailable; notice là transient, trườngnoticeHidden trong raw được giữ, không nhận luôn visible tới lúc kiểm.

Dụng cụ repro dùng `AM_PREVIEW_PROBE_DELAY_MS`0–60000 trên `tools/consistency-preview.js`, adapter luôn deterministic/no model. [Smoke300ms](probe-delay-smoke.json) HTTP200/fixture-model sau439.256ms trên hash ghi riêng, một mẫu không là performance benchmark. Full source regression hiện đang chạy.

[Full probe regression](integrated-admin-probe-tests.txt)/[hash seal](verification-admin-probe-tests.json):373 test/33 file,0 fail/skip/cancel. VI375×812 giữ mapping astra/focus sau completion, nút yêu cầu lưu trước khi probe, scrollWidth360≤375; [ảnh](probe-draft-vi-mobile.jpg). Một wait dùng nhãn rút ngắn không match; đọc lại DOM xác nhận nhãn đầy đủ, không sửa assertion/production để ép match. Có10 fixture runner calls cộng dồn trong private preview, native model0; không nhận10 calls cùng một sourcehash vì runner đã restart giữa các refinement.

## Tắt CLI trong lúc test/tích hợp

[Work close red](close-drain-before.txt):close trả trước terminal state và rollback (2 fail). [CLI process red](cli-shutdown-before.txt):SIGINT khi Verify giữ verifying, SIGTERM khi Integrate giữ integrating (2 fail); nguồn fixture đang áp dụng chưa được rollback trước exit. Mỗi test tạo Git/source/work/config/data riêng; --public-url loopback tránh ghi global connect-room, không native model. Reported/verified run được seed rõ để chỉ kiểm lifecycle, không giả model đã làm task.

Source mới theo dõi promise Verify/Integrate trong pending; close abort và drain. CLI signal dùng app.close() rồi flush/exit, signal lặp được bỏ qua; --exit-on-end dùng cùng shutdown sau delay200ms hiện có. Manager đã đóng chặn dispatch/probe/test mới. [39 targeted checks](shutdown-targeted-tests.txt) đạt, gồm hai CLI process thực SIGINT/SIGTERM, persisted cancelled và integration rollback restored/sourcea-b. Sau đó chỉ chỉnh cleanup test để kill child trước xóa temp; regression toàn bộ đang chạy trên source/test cuối. Không có metric billing/human time, không model8h, không SIGKILL/crash hoặc supervisor process ngoài server.

[Full shutdown regression](integrated-shutdown-tests.txt)/[source hashes](verification-shutdown-tests.json):378 test/34 file,0 fail/skip/cancel trên source/test cuối, gồm closed-manager no-new-dispatch và cleanup an toàn. CLI tests dùng explicit public-url loopback và config/work/data dirs tạm; app user/global connect-room không đổi.

## Quan sát mới nhất giữa các phòng dùng chung cấu hình

[Repro trước](observation-staleness-before.json):local+shared của cùng success xuất hiện2 lần; phòng B probe thất bại mới hơn nhưng phòng A vẫn trả success trước và routing đề xuất opus-claude. [3 red tests](observation-freshness-before.txt) tái hiện duplicate/newer failure/equal timestamp. Dữ liệu là fixture riêng,0 native model calls.

Source mới hợp nhất theo profile và timestamp còn hạn30 phút; shared persisted copy thắng timestamp bằng nhau, local mới hơn vẫn thắng shared cũ. Unknown profile/runtime/revision, expired/future/invalid date bị loại. Kho work và observations không đổi schema hoặc bị xóa; không thêm probe/retry. Routing và Run của A nay dùng failure mới, không tạo run/call. [32 targeted](observation-freshness-tests.txt), [382 full/34 file](integrated-observation-tests.txt), [hash seal](verification-observation-tests.json):0 fail/skip/cancel. Không nhận freshness là bảo đảm quota/access tới lúc provider thực thi hoặc thắng baseline model/chi phí.

## Runtime view: trạng thái trước, mapping và JSON mở khi cần

[Baseline](runtime-layout-before.json)/[12 ca source mới](runtime-layout-after.json) dùng cùng config3, fixture-model observation18:56:15.780Z và hai executable checks (check timestamps được refresh, không probe thêm cho matrix). VI375:observationTop2010→352px, pageHeight2216→1140px;1280:1573→143 và1996→1054. Visible text2291→748 ký tự là mô tả bố cục, không tự là nghiệm thu UX hoặc human-time win. UI sourcehashes và bundle bytes trước/sau nằm trong report; tăng JS/CSS là overhead thật, không claim tổng chi phí giảm.

Check runtimes có bản tóm tắt executable/version; từng profile giữ trạng thái model và reported ID/date, probe có cảnh báo chi phí/timeout60s/hạn quan sát30 phút. Mapping mở theo nhu cầu, native details cho diagnostic JSON giữ đầy đủ dữ liệu. Không model tự động. Probe chưa đủ cấu hình bị disable có lý do; backend vẫn quyết định adapter/access. [Ảnh VI desktop](runtime-after-vi-desktop.jpg), [mobile light](runtime-after-vi-mobile.jpg), [EN](runtime-after-en-desktop.jpg).

[State checks](runtime-status-checks.json):failure hiện lỗi/quota fixture, mismatch giữ Model unconfirmed, late completion giữ mapping draft/focus và diagnostic summary open/focus. Save mapping config4→5 làm observation stale; refinement nhỏ sau đó trả focus đúng summary khi Save config5→6, đã kiểm trên source cuối. Early checks có phase trước refinement, không gán sourcehash cuối ngược. Private adapter calls cộng dồn qua nhiều boot không là model/billing. [22 HTTP/routing/real CLI targeted](runtime-ui-targeted-tests.txt) đạt trước focus refinement; source cuối syntax+browser matrix/Save đạt, backend full382 ở commit6bddfa2 không được nhận là browser test. Console error capture rỗng trên lần kiểm cuối.

Đếm field sau collapse loại rõ descendants của closed details; rect-only vẫn có thể giữ bounds của child ẩn trong Chromium. Baseline field9 đúng khi tất cả mở; metric sau là fieldsOutsideClosedDisclosures0, không nói DOM đã xóa fields. EN/theme chỉ có after cases, không gán matched-before gains. Chưa đo user task time/UX acceptance/assistive-technology thật. Phát hiện tiếp: đổi ngôn ngữ/reload mất admin subsection về Models; sẽ sửa riêng, không coi matrix geometry đã bao phủ navigation này.

## Reload/ngôn ngữ giữ đúng nhóm Quản trị

Baseline browser khi đổi EN→VI từ Runtime quay về Models; cùng vấn đề khi reload để lấy config mới. Source mới dùng danh sách5 section có sẵn làm allowlist/query section, không thêm screen hoặc localStorage. replaceState giữ hành vi Back ra session, không đẻ history entry mỗi click. Sidebar chuyển focus tới main mới; return view/lang giữ nguyên.

[Browser navigation](admin-navigation-browser.json):cả5 section giữ đúng heading/section sau đổiEN→VI, reload, rồi vềEN; focus main sau chọn bằng sidebar. Invalid __proto__ về Models, Back từ Results trở lại normalized section=models. Return Results vẫn1 task integrated/tested, không run mới. Query hiện hữu được giữ trên return link (section không có nghĩa ở session page); không nhận là internal section Back-stack. Một locator thử option level không được CUA hỗ trợ, fail trước thao tác language; dùng #page h1 để kiểm thay vì nới yêu cầu.

Reload Runtime trước đọc /runtime ghi Observations not loaded; Check runtimes lấy lại saved fixture-model stamp18:56:15.780Z, không probe mới. Sau loaded-empty profile mới là Access untested. Không tự fetch/model sau reload hoặc tự giữ/replay nội dung form admin chưa lưu. Syntax/sourcehash/browser đạt; CI commit sẽ kiểm checkout đầy đủ. Backend full382 và UI matrix trước ở commits tương ứng vẫn giữ scope cũ.

## Nhóm Quản trị trên mobile

[Before](admin-mobile-navigation-before.json)/[after](admin-mobile-navigation-after.json):VI375 cùng config3/unloaded Runtime, header113px giữ nguyên; sidebar157→85px và mainTop270→198px (thêm72px nội dung). Native section select chỉ dưới700px; desktop768/1280 vẫn sidebar, không có hai navigation controls cùng hiện. 12 locale/theme/width cases kiểm actual innerWidth và không overflow; đủ5 option/đích, ArrowDown runtime→hosts chuyển main focus, locale+reload giữ value, Return Results1/Back vềData đúng. [Ảnh mobile](admin-mobile-chooser-vi.jpg).

Tradeoff: pointer/touch đổi nhóm thêm thao tác mở chooser so5 button trực tiếp; không đo human time hoặc tuyên bố net-win thay người dùng. Initial CSS rule trước generic field style bị override; đã chuyển đúng thứ tự, final matrix kiểm mobile/desktop visibility. First nav attempt đọc DOM trước async config render fail, repeated với expectNavigation/selector-visible, không sửa source để ép test.

Browser viewport override áp dụng tab đang selected. Sau mở TTL tab3, một ảnh navigation tên mobile thực ra1280; đã đổi tên [desktop](admin-navigation-runtime-vi-desktop.jpg), tạo tab4selected và chụp [mobile375 thật](admin-navigation-runtime-vi-mobile.jpg). Matrix12 runtime cũ chạy trước tab3, đã ghi actual widths đúng; không gán lỗi ảnh này ngược cho mọi số đo. Source hashes của từng report giữ riêng.

## CI Node20: readiness của test CLI

[Run39838489515](https://github.com/ttat288/agent-meeting/actions/runs/39838489515) commit5c9e519:Node18/22 success, Node20 fail ở test integrate trước signal:status integrating đã được persist nhưng parent process đọc source a-b trước bước apply synchronous tiếp theo trong child. [Raw excerpt](ci-shutdown-readiness-before.txt) giữ lỗi/stack/timestamps. Đây là readiness race của test, không bỏ assertion rollback hoặc coi status là proof applied.

Predicate mới đợi cả status lẫn sourcea+b rồi mới gửi SIGTERM; terminal failure trước readiness báo nguyên nhân. Không tăng timeout, skip, retry hoặc sửa production để ép xanh. [Local2 tests](ci-shutdown-readiness-tests.txt) đạt; actual matrix của commit fix còn phải kiểm.

[Package source65476da](package-runtime-smoke.json):68 file,7 HTTP/conditional/CSP/asset checks, bundled skill và hash mọi file đóng gói khớp checkout. Không ship .agents/.local-tools/docs/test. [Real packaged CLI2 tests](package-runtime-cli-tests.txt) dùng test readiness mới được copy **sau giải nén**, không có trong tarball, config/work/data riêng/public-url loopback; không cài app user hoặc native model. Tarball SHA cca0d3cdc7486e2de143b508614bfd6eca0ea27a2377eb0341d3a2a37610964b thuộc source+README/CHANGELOG tại654, không tự bao phủ source về sau.

Tái lập CLI package check từ checkout được ghi trong report:

```bash
pkg_verify_dir="$(mktemp -d)"
npm pack --json --cache "$pkg_verify_dir/cache" --pack-destination "$pkg_verify_dir"
tar -xzf "$pkg_verify_dir/agent-meeting-3.5.0.tgz" -C "$pkg_verify_dir"
mkdir "$pkg_verify_dir/package/test"
cp test/cli-shutdown.test.js "$pkg_verify_dir/package/test/"
node --test "$pkg_verify_dir/package/test/cli-shutdown.test.js"
```

Test file hash và production hashes nằm trong receipt; test có2 CLI processes thật, không là native model benchmark. Giữ package outputs trong temp để đối chiếu; không dùng receipt cũ thay final package check cuối ca.

[Full integrated admin/navigation regression](integrated-admin-tests.txt)/[source seal](verification-admin-integrated-tests.json):382 test/34 file,0 fail/skip/cancel tại ae17743, source/test frozen. Gồm CLI readiness đã sửa và UI mới; browser matrices riêng, không gộp thành model quality.

[Desktop duplicates](desktop-ci-duplicates-before.json):2ac1713 có push39835043314 và PR39835053353 cùng workflow/SHA, cả hai workflow overall success. Push có đủ3 job success; PR macOS/Windows success, Linux conclusion rỗng trong metadata snapshot (giữ unknown, không tính là3 green jobs). Workflow installer mới dùng concurrency key workflow/repository/branch giống CI đã verified, giữ3OS/max-parallel1/timeout/sandbox/tool steps. Không đổi trigger paths, permissions hoặc branch protection; không nhận money saved từ số run. Actual cancellation/matrix của commit mới còn phải kiểm.

## APT CI không phụ thuộc feed vendor không liên quan

[Desktop ae17743 failure](desktop-apt-before.txt) [run39840183544](https://github.com/ttat288/agent-meeting/actions/runs/39840183544):Linux prepare chết vì packages.microsoft.com jammy InRelease403, trước test. Không phải lỗi assertion installer, không tắt signature check hoặc nhận retry xanh là đã sửa code. CI test chính cũng dùng apt update toàn bộ feeds nên cùng điểm phụ thuộc.

Helper CI mới chỉ nhận3 test-tool package đã dùng, pinnedUbuntu22.04/GitHub runner, sourcelist tạm cho official jammy/main/universe+updates/security, signed-by Ubuntu archive keyring và HTTPS. Sourceparts là thư mục rỗng riêng cho lệnh; không ghi /etc/apt hoặc thay trust, không gọi trên máy user, không ship trong npm. Hai workflow dùng cùng helper; Desktop paths thêm đúng helper để thay đổi nó được kiểm cả native matrix. [Ubuntu custom APT sources](https://ubuntu.com/pro-client/docs/en/docs/howtoguides/use_custom_apt_config/) hỗ trợ scope source list/parts theo lần gọi. bash -n đạt; actual apt install và3OS/3Node còn phải kiểm ở commit mới, chưa nhận đã xanh.

[APT/native Desktop verified](ci-apt-desktop-verified.json):13e4cce PR39841507338 đủUbuntu22/macOS/Windows success, Linux prepare signed-Ubuntu helper và native smoke đạt; push39841501626 cancelled trong lane mới. Node18/22 success ở snapshot riêng,20 còn chạy; không ghi toàn bộ Node matrix xanh khi chưa xong. Không chạy apt/install trên máy user; source helper nằm .github, không thêm runtime dependency.

## Badge access hết hạn khi để trang mở

[Start](runtime-expiry-baseline-start.json)/[DOM end](runtime-expiry-browser-end.json)/[backend end](runtime-expiry-backend-end.json):source UI 1ce861f, observed19:02:56.916UTC, hết hạn19:32:56.916. Sau19:33:33 tab vẫn verified/Model matched, backend observations[]; fixture adaptercalls giữ14/native0. Browser mở từ19:09:58 (~23m35), **không là browser/model chạy30 phút hoặc8 giờ**. [Ảnh trước](runtime-expiry-before.jpg) giữ toàn bộ context.

Source mới có một local timer tới hạn gần nhất; đổi badge stale, giữ metadata/raw JSON/form/focus. Rời admin section/page/hidden dừng timer; visible/pageshow tính lại tuổi, không api()/probe/retry. [Browser fix](runtime-expiry-fix-browser.json):fixture saved observation **backdated**, còn60s; matched→stale, mappingAstra chưa lưu/focus và diagnostic open/summary focus giữ. [Ảnh sau](runtime-expiry-after.jpg). Window15s đầu không chụp được green trước khi hết, không tính pass. Không lấy các fixture backdate làm thời gian model/browser thực.

[Counter checkpointA](runtime-expiry-instrumented-before.json)/[B](runtime-expiry-instrumented-after.json) đều sau deadline; delta0 riêng cặp này không tự chứng minh trước/sau timer. Đã chạy [fresh-boot zero start](runtime-expiry-navigation-start.json)/[end](runtime-expiry-navigation-end.json):runtimeReads0→1 đúng một Check runtimes explicit, probePOST0/calls14 giữ; không automatic read/probe qua expiry/Back. Back thực tế reload, hiện Observations not loaded, không phục hồi verified cũ; không nhận đã kiểm mọi BFCache/OS visibility policy. Text-selection identity và assistive-technology thật chưa được browser user test; source timer chỉ sửa badge, không dựng lại metadata.

## Save cấu hình trả muộn và phần nhập mới

[Browser red](admin-save-race-before.json):config6→7 đã lưu trước ACK; nhập label mới trong cùng form rồi release, callback trả label cũ và focusBODY. Proxy loopback3155 chỉ giữ response config/reset sau backendcommit, filegate có counter/status/revision, không native model. [2 unit red](admin-save-state-before.txt) kiểm actual functions cho edited-during-save và notice timer cũ ẩn message mới quá sớm.

Guard mới đếm input/change của trang admin và kiểm origin form còn mounted. Có nhập mới/view đã thay thì giữ DOM **và config snapshot cũ**; saved DTO chờ lần navigation/reload rõ ràng, chỉ giữ revision cao nhất. Không tự nâng CAS revision cho form cũ hoặc merge/replay. Normal save nhận đúng server revision; mapping chỉ chuyển focus khi đã rerender, import chỉ clear đúng submitted view, reset dùng cùng guard. Config-conflict Reload dùng loading view hiện có, không để người dùng gõ vào form sắp thay. Latest notice hủy hide timer cũ; unit fake-clock kiểm6s từ thông báo mới, không đo thời gian đọc thực.

[Browser outcome](admin-save-race-browser.json):cùng form giữ label/focus; Save tiếp từ view 7 bị409, backend8 vẫnlabel đã gửi; explicitreload→manualrestoreSave9. ACK từModels khi đang nhập Data giữJSON/focus, explicitnavigation mới áp snapshot10. Import10→11 giữJSON gõ sausubmit; resetpolicy11→12 giữ draft/focus; mapping12→13 giữcheckbox chưa lưu/focus/open. VI policy13→14:backend 4, current field 5 giữ, không tràn375px. [Ảnh VI](admin-save-draft-vi-mobile.jpg). Counter adapter vẫn14/native0; chỉ sửa catalogfixture riêng, app3000/globalsettings không đổi. Một getAttribute(value) trảnull do HTMLfield dùng live property; fieldValue là assertion thật, không xem null là draft loss.

[6 targeted tests](admin-save-state-tests.txt), [full388/35file](integrated-admin-save-tests.txt)/[source seal](verification-admin-save-tests.json):0 fail/skip/cancel. Giới hạn:explicitreload/language không giữ admin draft qua page reload; copy trước reload hoặc navigation theo hướng dẫn. Có thêm bước phục hồi so với auto-rebase nhưng tránh silently overwriting config; chưa đo human-time/net cost. Không nhận UI test/fixture token là model8h hoặcsemantic acceptance.

## Hosts refresh giữ enrollment draft

[Before](hosts-refresh-before.json):GETremote trả muộn ở2409aca dựng lại trang và xóa hostLabel/workerWorkspace đang nhập. Source mới chỉ vẽ list region còn mounted, không thay form/focus; snapshot revision thấp bị bỏ qua, callback từ view cũ chỉ cập nhật cache. Refresh thành công xóa đúng lỗi đọc trước đó.

[Browser](hosts-refresh-browser.json):same-view draft/focus, chuyển Models khi chờ,503 giữ draft và retry hồi phục đều đạt trên375 VI; [ảnh](hosts-refresh-recovery-vi.jpg). Không enroll máy, tạo token, dispatch hoặc native model. Stale revision chỉ kiểm unit, không nhận đã thử worker vật lý. [Full391/35](integrated-host-refresh-tests.txt),0fail/skip/cancel, [source seal](verification-host-refresh-tests.json);9 UI unit gồm fresh/stale/detached callbacks chạy actual source. Lần viết seal đầu lỗi Python dùng keyword pass, chưa tạo receipt; đã sửa và đối chiếu tổng raw trước ghi seal.

CI source2409aca:CI39847742122 và Desktop39847742044 overall completed/success; duplicate CI39847732330 cancelled. Không gán các run này cho source Hosts mới.

## Task Save ACK và bước đọc sau lưu

[Red](task-save-before.json):sourcefc4701d Save đã commit nhưng ACK bị giữ; acceptance gõ sau submit bị mất, form đóng và focusworkTitle. Callback còn xóa draft key. Guard mới giữ viewed revision/draft nếu có input/change mới, form bị thay hoặc workView bị ẩn; kiểm trước và sau /work read, không tự merge/dispatch. Normal save mới clear đúng old key.

[Browser](task-save-browser.json):configure-delay giữ draft/focus;409 giữ draft; Show updates hiện previousv2 readonly, chép nội dung và Save mới thành công. Work-read delay giữ draft; gate này giữ2 reads (có poll chưa ETag), không nhận chỉ1 request. Save từ workView hidden không kéo focus khỏi chat. [Ảnh375VI](task-save-retained-vi.jpg). Các input/model fixture không thành kết quả human/model;0run mới/native call. Storage blocked kiểm unit, chưa browser policy.

[Full398/35](integrated-task-save-tests.txt),0fail/skip/cancel, [source seal](verification-task-save-tests.json).16 UI unit actual-source gồm7task recovery cases. Ba unit đầu fail vì fixture đợi1microtask nhưng VM promise khác realm chưa tới bước read; đã dùng setImmediate để đợi turn, không sửa production nhằm ép test xanh. New task creation không có form riêng trong work UI, dùng nguồn hội thoại hiện có, không thêm màn.

## Manual Refresh và input trong lúc chờ

[Before](work-refresh-before.json):be737f7 restore chữ từ localStorage nhưng đóng form/focusBODY sau delayed remote read. Guard mới chỉ áp config/work cùng lúc khi không có input/change mới, origin control vẫn hiện và không explicit work read mới hơn. Deferred giữ viewed snapshots; auxiliary cache giữ partial-read policy hiện có. Không tự merge/dispatch. Normal Refresh focusworkTitle.

[Browser](work-refresh-browser.json)/[ảnh](work-refresh-retained-vi.jpg):delayed Refresh giữ open form/input/focus; chuyển Results vẫn1 cancelled fixture/run cũ; callback không dựng lại Plan. Remote503 hiện warning ở list nhưng giữ result; retry xóa worker warning và giữ Cancelled fixture run warning. Locator đầu lấy nested run warning, đã sửa direct-child selector, không xóa cảnh báo run nhằm ép test. [Full404/35](integrated-work-refresh-tests.txt),0fail/skip/cancel, [seal](verification-work-refresh-tests.json),22actual-source UI tests. Không native model/new run/human-time win; storage blocked của manual Refresh chưa browser-tested, guard DOM không phụ thuộc storage.

## Lỗi thao tác khi work view bị ẩn

[Before](hidden-action-error-before.json):4544951 delayed /work503 về sau khi quay Hội thoại, lỗi chỉ nằm trong workView hidden/noticehidden=true. Focus/chat không mất nhưng user không thấy kết quả thao tác cũ. Một guard visibility ở actioncatch dùng notice hiện có cho origin hidden/detached; visible origin vẫn inline alert/focus. Không tự retry mutation hoặc đổi view.

[Browser](hidden-action-error-browser.json)/[ảnh](hidden-action-error-after.jpg):notice hiện, chat/focus giữ; visibleerror vẫn alert, retry xóa alert và giữ1result. Controlled503 chỉ proxy/private store,0model/newrun. [Full407/35](integrated-hidden-action-tests.txt),0fail/skip/cancel, [seal](verification-hidden-action-tests.json).25actual-source UI unit gồm3 visible/hidden/detached +finally state. Notice6s/role status dùng cơ chế hiện có; screenreader thực và user đã đọc notice chưa đo.

## Superseded navigation read errors

[Actual-function unit red](navigation-error-unit-before.txt):2fail/2pass ở9cc650c; oldPlan failure gắn alert sau newResults success hoặc sau trở về conversation. Catch mới dùng cùng request/hash guard với success, currentfailure vẫn alert. [4green](navigation-error-unit-after.txt), [full411/36](integrated-navigation-tests.txt),0fail/skip/cancel, [seal](verification-navigation-tests.json).

[Browser baseline](navigation-error-before.json) **inconclusive**:2attempts với proxy held503 không bắt alert; request cụ thể chưa correlate độc lập, không suy chắc polling đã xóa hoặc race không tồn tại. [Normal routes](navigation-error-browser.json) VI375 Plan/Execute3task/Results1run không alert sau guard, chỉ chứng minh normal navigation; không thay thế negative baseline hoặc actual-function unitrace. Không model/newrun trong các ca này.

## Fresh integrated journey on477c6b7

[Input/source hashes](integrated-journey-input.json), [red](integrated-journey-red.txt) và [green](integrated-journey-green.txt):checkout mới7fff096, sum(a,b)=a-b, độc lập test2+3=5. [Browser](integrated-journey-browser.json) tạo meetingtask từ tinVIỆC source#45; requirementv2, Run bị từ chối access đã hết hạn trước dispatch, đi Options→Admin→Runtime đọc versions/savedproof rồi explicit **fixture**probe→returnExecute.

Run265ce1c9… reported, source/test vẫn hash đầu vào; Verifycandidate1/1, Integrate source+test thêm1/1. Chỉsum.js đổi thành a+b, testhash không đổi; developer chạy lại Node test trên source exit0. Reload giữ taskmeeting-4b2b32…/run/source, [handoff](integrated-journey-handoff.json) cùngID và [artifact](integrated-journey-artifact.js) SHA c4906f38… khớp source. [Ảnh](integrated-journey-results-vi.jpg) ghi rõ deterministic fixture/not paid model.

Đây là UI+real Node subprocess, **không native AI**; previewrunCli override được hash, không đánh đồng button label production “CLI thật” với model trong fixture. Runtime versions thật chỉ --version. Nativeattempts toànca vẫn3, actualmodel/efficacy/billing/8h chưa được chứng minh; costUsdnull.2/2 là2lần test cùng acceptance, không2testcasesđộc lập hoặc humanacceptance. Source commit477c6b7/criticalhashes giới hạn coverage; không tự gán cho các source về sau.

## Session notifications không che focused composer

[Baseline](notice-overlap-before.json)/[ảnh](notice-overlap-before.jpg) VI375×812:wsnotice che9426.5px² input, sendtoast che5338.109px² draft mới. CSS mới dùng bodyflex space cho sessionfeedback/toasts, không thêmJS/timer/model/store; emptytoastcontainer cao0. Thông báo có thể làm content reflow/nhỏ đi tạm thời. S07admin vẫn stylehiện có, không claim fix mọi overlay/compliance.

[Matrix](notice-reserved-browser.json):12locale/theme/actualwidthconfig ×2notificationstates (24) đều0overlap, focus/draft/recipient giữ, input trong812px/nohorizontaloverflow. Cùng draftVI375dark input147.289×88:toastoverlap5338.109→0, dành54px mới; workspace notice dành56px ở case đó. Timers hết, toastcontainer cao0/focusgiữ; workRefreshnotice dướiworkview không che headingfocus. [Ảnh cùng notice+toast](notice-and-toast-after-vi375.jpg). Source hashes của CSS/JS ở matrix; Node411/36 thuộc477c6b7 với JS giống hệt, không gán test đó là visual proof cho CSS mới. CI và fullfreeze cuốica sẽ kiểm source cuối.

[After-attempt dùng CSS cũ](notice-old-css-attempt.jpg) vẫn overlap:goto chỉ đổihash, chưa reloadstylesheet. HTTPservedhash khớp nhưng browserCSSOM chỉ oldrule. Đã reloadthật, kiểm CSSOM static/relative rồi mới chạy24states; ảnh attempt không tính pass. Khuyến nghị skillfocus-not-obscured được dùng ở đúng mức componentgeometry; không nhận screenreader/human-time/netperformance/billing hoặc fullWCAG acceptance.
