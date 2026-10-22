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
