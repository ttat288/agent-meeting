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
