# Protocol ca phát triển 8 giờ — v1, khóa 2026-10-22

T0 `2026-10-22T15:24:53Z`, deadline `2026-10-22T23:24:53Z` (22:24:53→06:24:53 Asia/Bangkok). Đây là ca phát triển, không phải test model8h.

## Pain point và phép đo

1. **Đã tái hiện:** backend verify trả verified trong khi web Results còn reported cho tới refresh. Local subprocess fixture, không model. Acceptance: trạng thái ngoài trang tự cập nhật; không overwrite edit/evidence/focus; mất kết nối có retry; Back/reload không dispatch. Đo conditional reads với workload ghi rõ, giữ raw per-sample latency/bytes/status và body không đổi, có mutation và lỗi quyền. Không gọi bytes là billing.
2. **Đã tái hiện trong pilot trước và source hiện tại:** runtime parser nhận cost âm và model label che multiple modelUsage. Acceptance độc lập, scope một file; test regression giữ nguyên. Chưa có incident production được xác nhận.

## Baseline model pilot mới (không thay input pilot cũ)

Input đóng băng mới tại `/tmp/am-pm-pilot-P7eEyy`,352 files/16463318 byte; sourceDigest `491c16573db8a4e1ceb8fd6d5752fea6624f156a06fb0bc023f6bf3128d656c0`, taskDigest `a67ebf7000860fa0dba699d543138c0b1173a59be51c2b3ae90b8b5d2b2c0653`. Hai copy direct/PM cùng task, test acceptance và source bytes, không có đáp án. Chỉ ghi `src/runtime.js`; tests không được sửa. Baseline direct được native context management/compaction, Read/Edit/Write/Glob/Grep/Bash, tự chạy tests/report; không bắt hỏi từng tool hay nạp full logs. Một session mới mỗi arm, không nhận output arm kia. Nhận định/patch trong phiên Codex chuẩn bị không được đưa cho writer.

Runtime local Claude Code2.1.289; model pin `claude-opus-5-5` như identity requested đã dùng trong evidence trước, không suy model access từ auth loggedIn. Catalog mặc định providerModelId vẫn null/disabled; chỉ cấu hình store pilot tạm nếu probe thành công. Native auth status loggedIn=true chưa chứng minh token được provider chấp nhận.

Quyền mới từ yêu cầu8h: một cặp pilot tối đa4 invocation direct1/probe1/PM1/worker1, không retry/fallback model, tuần tự, writer120s, PM600s, tests30s. Direct cap CLI `--max-budget-usd 1`; worker adapter hiện không có hard monetary cap nên không suy toàn cặp có trần tiền cứng. Nếu direct lỗi authentication/model thì dừng model pair, không sửa OAuth/settings; lưu attempt thất bại rồi tiếp tục local/web. Không dùng agy khác model thay arm. Không gọi reviewer/subagent trả phí bổ sung. Chưa quyết định triển khai controller context.

Quality: evaluator chạy test acceptance + regression trên cả workspace và source sau tích hợp, kiểm diff chỉ scope, test hash không đổi, review behavior; writer report không tự pass. Đo mọi invocation/probe/PM/worker/retry (kể cả failed), setup/evaluation/recovery/maintenance, raw receipt/hash, requested/actual model, elapsed/token/cache/cost riêng. Human director effort, hidden billing/session Codex không đo được giữ null. Có sample1 thì báo từng sample, không P95/generalization. Ngưỡng từ pilot cũ giữ nguyên: giảm20% cost hoặc công giám đốc, metric kia tăng≤10%, quality tương đương; thiếu số hoặc identity mismatch thì unknown. Nếu PM thua thì giữ nguyên.

## Nguồn chính thức đã đọc ngày2026-10-22

- [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode): exec/structured events/resume. Dùng OpenAI Docs để kiểm nguồn chính thức; không suy version tài liệu là executable local hoặc quyền account.
- [Claude Code programmatic usage](https://code.claude.com/docs/en/headless): print/native tools/context management/continue/resume; kết quả auth lỗi có thể ở stdout.
- [Gemini CLI checkpointing](https://geminicli.com/docs/cli/checkpointing/): filesystem/conversation checkpoints là khả năng baseline cần giữ nếu dùng Gemini CLI. Không đồng nhất với adapter Antigravity/agy và không claim đã thử Gemini.

Tài liệu là tiêu chuẩn tham khảo journey/recovery, không benchmark thắng các công cụ đó. Không thay snapshot/runtime/model giữa các arm rồi so với lần cũ. Source/hash mới sau sửa được báo riêng.

## Local watch benchmark — protocol v2

`node tools/benchmark-work-watch.js 30 <output.json>` chạy ephemeral HTTP server/store, một socket keep-alive và3 workload1/25/100 task canonical tổng hợp.30 samples/arm/workload, thứ tự AB/BA đảo từng sample,3 warmup mỗi arm,5s request timeout, không retry request. Cùng endpoint/state/acceptance: unchanged hash ổn định, conditional304 không body, mutation phải trả200 và facts byte-identical baseline, error403/404/405 giữ nguyên. Báo từng sample/median/max/body bytes/response header bytes và overhead header request; không suy chi phí model hoặc công người dùng từ scripted polls. Native direct CLI có thể stream kết quả không thêm polling: đây không là phép so model hay tổng chi phí direct CLI.

Lần chạy harness đầu không xuất report hoàn chỉnh: gửi100 dòng trong một hostSay vượt MAX_TEXT, chỉ48 task nên assertion100 thất bại. Sửa setup v2 thành từng25 dòng theo giới hạn sản phẩm; không đổi payload/parser product hoặc giảm acceptance, không chọn kết quả thuận lợi. Kết quả lần hoàn chỉnh khóa theo source hashes v2; latency các workload trước lần lỗi không được lấy trộn.

Setup v2 cũng thất bại: fuzzy dedup trong Meeting gộp các task gần giống của những tin khác nhau, chỉ còn25/100. Không dùng dữ liệu đó làm workload100 hoặc lẫn các sample. Setup v3 dùng API host `/work/tasks` chính thức, mỗi task có acceptance/sources/facts; không inject private store và không thay cơ chế dedup sản phẩm để ưu ái benchmark. Mọi trường đo/acceptance/arm/order giữ nguyên; workload nay ghi rõ canonical task API, không tự nhận task từ hội thoại. Hai lần lỗi là lỗi thiết kế fixture, không lỗi model và không được giấu trong kết quả.

## Soak HTTP90 phút đã chạy — nguồn đóng băng riêng

Raw/analysis `work-watch-soak-90m.json` và `work-watch-soak-analysis.json` thuộc sourceRef66a4e986d3aedac644b46caa859890741081f152 (5 hashes match), Node22.22.1, cgroup512M/swap0, service limit5700s. Mục tiêu là giữ100 task IDs/0 runs qua reads và clean restore; không là decision freshness mọi payload, crash hoặc model/context8h. Client labels gọi tuần tự mỗi round3s. Restart flush/close/createApp/restore cùng Node PID, listener mới. Request/body/resource sample thô được giữ; headers/CPU app-only/user/model billing chưa đo.

Tái lập source mà không checkout/reset worktree hiện tại (không gọi model):

```bash
soak_source_dir="$(mktemp -d /tmp/am-soak-source-XXXXXX)"
git archive 66a4e986d3aedac644b46caa859890741081f152 | tar -x -C "$soak_source_dir"
cd "$soak_source_dir"
systemd-run --user --scope -q -p MemoryMax=512M -p MemorySwapMax=0 \
  timeout 5700 node tools/soak-work-watch.js 90 /tmp/am-soak-reproduction.json
```

UUID/timestamps của fixture mỗi lần khác; acceptance kiểm tính liên tục trong cùng lần, không ép bytes/cost giữa hai lần khác nguồn. Không gắn kết quả90 phút cũ cho source mới có WorkManager khác hash. Không tự chạy lại90 phút khi không có giả thuyết/lỗi mới cần kiểm.

## Revision2 cho Git store của input tái tạo (khóa trước sửa helper)

Auditd78076a:reproducer hiện clone cả repo rồi detachbase.352workingfiles đúnghash nhưng .git chứa101commitobject, có66a4e98 sửa runtime về sau. Không coi workingfiledigest là toàn bộ Gitinput hoặc nhận model không thể đọc answer qua gitlog. Originalnativepilot đãauthfailed trước codework, không retroactively sửa receipt hoặc nhận nó thành arm thành công.

Preparationrevision2 phải init repo rỗng, fetch local đúngbaseSHA với depth1/no-tags/no-submodule, detachbase rồi bỏ FETCH_HEAD URL. Mỗiarm chỉ1commitobject làbase, không configuredremote, không cófuturefixobject;352workingfile/acceptance/taskdigests vẫn giữ. Haiarm dùng cùngpolicy mới. Đây là đổi Gitmetadata input so với helpercũ, không nhận toàn bộinput gồmhistory đã giữ nguyên hoặc so performance/modelv2 với nativepilotv1. Không gọi model/repairOAuth trong kiểm này.

Unit dùng repo Git disposable2commits (base vàanswer), không phụ thuộc lịch sử clone CI hoặc remote; acceptance thực dùng originalmanifest và reject prepared solved input hiện có. Overhead:newinit+fetch+checkout+cat-file selfcheck so oldclone+checkout tăng2Gitprocess/arm (4/helper), chưa đo setup CPU/time/invoice. Fullmodelblindness chưa được bảo đảm: nativeCLI vẫn theo phạm vi đọc đã giao, có thể có ambient external access; localGitstore isolation không là OS/network sandbox.

Helperv2 tự kiểm mọi commitobject saufetch, không chỉgiảđịnh depth1 hoặc dựa checkoutHEAD. Nếu ambient Gittemplate mang thêm lịch sử, preparation phải fail; unit injects disposable template chỉ trong subprocess/test environment, không sửa Gitsettingsglobal.

## Cách tái lập và giới hạn baseline cần giữ rõ

Chạy từ full clone của nhánh này. Reproducer writer cần các commit base/foundation trong lịch sử; shallow checkout có thể cần `git fetch --unshallow` do người vận hành chạy trước. Helper chỉ fetch từ đường dẫn repo local, không tự lấy mạng hoặc gọi model.

```bash
node tools/benchmark-work-watch.js 30 /tmp/work-watch-result.json
node tools/reproduce-writer-input.js
node docs/evidence/shift-20261022/verify-final-package.cjs
```

Lệnh package cuối dùng thư mục kết quả mới trong `/tmp` mặc định (hoặc đối số thư mục mới), không ghi đè receipt cũ. Nó yêu cầu package inputs đã commit, kiểm mọi file runtime đã track được ship, hash mọi file tar, CSP/HTTP/assets/304, bundled skill và hai CLI signal tests từ bản giải nén. Test được copy sau pack; không ship test/dev evidence hoặc cài ứng dụng. Đây là chương trình chuẩn bị cho lượt kiểm cuối ca, chỉ có receipt thật sau khi thực thi thành công.

Direct writer được native Read/Edit/Write/Glob/Grep/Bash; adapter managed production hiện chỉ Read/Edit/Write/Glob/Grep. Đây là so workflow có quyền công cụ khác nhau theo hướng direct có thêm khả năng tự chạy test, không là model A/B với tool rights giống hệt. Không nới quyền production để làm đẹp benchmark. Frozen task v1 còn field `fixLoops:0`; nó có thể gây mơ hồ với vòng test/edit nội bộ dù rules cho native tools và test. Vì direct đã lỗi OAuth, không có hành vi model để xác nhận cách hiểu. Một cặp mới phải khóa rõ internal test/edit loops được phép trong timeout, phân biệt với retry invocation, và ghi phiên bản/prompt mới trước khi gọi; không sửa taskDigest hoặc diễn giải lại kết quả v1 để tuyên bố thắng.

Do các giới hạn trên và không có hai arm hoàn tất, ca này chưa cung cấp bằng chứng chất lượng/chi phí tốt hơn một coding CLI trực tiếp mạnh. HTTP benchmark là transport riêng, Git-store check là tính toàn vẹn input riêng, không thay thế phần model còn thiếu.

Contract kế tiếp đã được đóng gói riêng tại [writer-strong-next-contract.json](writer-strong-next-contract.json), không sửa manifest/task v1. Source digest và acceptance giữ nguyên; task digest mới `eb69f6197b366ed0118b80f8e3ff20165d3731653a133dd39f1dadf4f1547893`. Nó bỏ field fixLoops mơ hồ, cho phép internal edit/test trong một invocation, giữ native context/compaction và công khai tool-right asymmetry. Khi mở một trial mới, dùng common task object này làm prompt contract cho cả hai arm trên source đã tái tạo, và ghi digest mới vào mọi receipt. Trạng thái `prepared-not-executed`, `executionAuthorized:false`; không là kết quả model hoặc quyền gọi thêm trong ca đang bị dừng vì auth.

Frozen case validator còn tính lại aggregate source/task digests, pin base e292 và acceptance path/hash. Thay file metadata, task hoặc base nhưng giữ declared digest cũ sẽ bị từ chối trước tạo workspace. Contract mới phải có trial/digest riêng; không sửa manifest v1 để làm đẹp kết quả cũ.
