# Pilot hiệu quả PM: chuẩn bị, chưa chạy model — 2026-10-22

## Pain point và lựa chọn case

Giám đốc muốn biết tổng công/chi phí giao việc qua PM có thấp hơn giao thẳng coding CLI. Hiện chưa có số đo model đủ dùng; fixture sum cho thấy overhead và bị giữ làm đối chứng kỹ thuật lịch sử. Không chạy lại nó để tìm kết quả thuận lợi.

Case `runtime-evidence` sửa lỗi dữ liệu vận hành thật trong `src/runtime.js`: parser giữ chi phí âm và cho trường `model` che sự mơ hồ khi `modelUsage` có nhiều model. Đã tái hiện local trên source, chưa quan sát incident production; ảnh hưởng tiềm năng là số đo chi phí/identity không đáng tin, không khẳng định đã phát sinh thiệt hại. Chỉ cho sửa một file, phù hợp integrator hiện có. Không thêm reviewer/scheduler/multi-file. Case này nhỏ, có thể bất lợi cho PM; direct CLI đang là đường khuyến nghị cho sửa lỗi đơn lẻ. Pilot không chứng minh lợi ích tổ chức đội hoặc mọi loại công việc. Một case khác chỉ được chọn từ pain point thật và ngân sách riêng, không dựng việc khó để PM thắng.

`tools/prepare-pm-pilot.js` tạo hai Git copy ở `/tmp/am-pm-pilot-*`, cùng HEAD và cùng byte của tracked/untracked/dirty source tại thời điểm chuẩn bị; loại protected paths như managed copy. Không commit, không checkout làm thay đổi repo gốc, không gọi model, không ghi global. Manifest hash toàn input, task và acceptance; hai copy đều có test độc lập `test/pm-pilot-acceptance.test.js`, không có đáp án hoặc patch sửa lỗi. `task.json` là đầu vào chung cho cả hai arm, gồm nguồn, triệu chứng, acceptance, scope và limits. Input không được sửa giữa hai arm. Nếu cần sửa case/protocol, tạo version mới trước khi chạy, không ghi đè run cũ.

## Baseline và protocol đã khóa

1. Chuẩn bị copy sạch riêng cho direct và PM; kiểm lại manifest/hash/test, HEAD, scope trước mỗi arm. Chạy từ chính copy đó; không đưa output của arm trước vào session sau. Dùng session mới, cùng repo input; không đọc ledger có kết quả/clone bên cạnh. PM không nhận solution từ phiên Codex chuẩn bị này.
2. Direct nhận nguyên `task.json`, dùng native context/tools/session trong quyền đã cấp, tự điều tra, sửa, chạy tests, xem diff và báo cáo; không bắt hỏi người dùng từng tool, đọc lại repo vô ích hay nhận prompt yếu hơn. Direct được test và báo cáo chuẩn như PM. Đây là baseline coding CLI có năng lực tự hoàn tất task nhỏ.
3. PM nhận cùng `task.json` cộng prompt coordinator và grant cần thiết. Goal/acceptance giữ nguyên; `plan.facts` chứa triệu chứng/nguồn trong task. Worker đọc nguồn tại copy của mình. PM gọi run → wait có cursor → verify → integrate → report. Chỉ ghi completed sau test source tích hợp. Tất cả prompt/thêm wrapper/probe/lời mời/schema/output đều tính vào tổng usage/billing có nguồn. Không tính token chỉ từ `task.json`.
4. Cùng provider model ID cho direct, PM và worker, cùng CLI version, quyền/scope/write isolation, timeout writer120 giây và test30 giây/file. Direct có native đọc/sửa/tìm kiếm; reviewer cuối và test do evaluator thực hiện ngoài writer ở cả hai arm. Không buộc direct chịu thêm bước PM. Model ID hiện **chưa chọn/không được cấp quyền**; catalog `opus-claude` tắt, providerModelId=null, chưa probe. Không tự đổi sang model khác.
5. Pilot đầu gồm **một cặp**, thứ tự direct→PM, mỗi arm1 writer attempt, không technical retry/fix loop hoặc reviewer model. PM session điều phối riêng timeout600 giây mỗi invocation, heartbeat/wait không là model tự chạy. Tối đa4 CLI invocation trả phí: direct1, PM1, worker1, probe worker1; mỗi invocation có thể có nhiều provider request/token, đây không là cap tiền. Setup lỗi/hết lượt/test fail vẫn ghi nguyên và dừng cặp khi không còn quyền, không thay bằng lượt đẹp hơn. Probe shared chỉ được khấu hao khi có reuse thực; báo first-use bao gồm nó. Nếu được cấp pilot lặp riêng thì đảo thứ tự PM→direct, session/copy mới và báo mọi cặp; không lấy kết quả tốt nhất.
6. Evaluator chạy cùng hai test files trên kết quả mỗi arm bằng `runTest` hoặc Node trong cùng write sandbox; PM có cả workspace test và integrated-source test, chi phí/độ trễ thêm đó được tính. Kiểm diff ngoài scope, test hashes và review thủ công theo cùng acceptance; test xanh không tự chứng minh chất lượng. Không cần output byte giống nhau, cần cùng behavior/scope/chất lượng. Không commit/push, không chạy app3000, không chỉnh settings global/bản cài local.

Không chạy CLI/model trong bước chuẩn bị. Quyền còn cần cấp rõ: CLI/provider ID/version cụ thể cho ba vai trò cùng model, quyền paid probe, **một cặp/tối đa4 invocation**, ngân sách tổng USD và cách dừng khi chạm ngân sách. App không có hard monetary cap, provider usage có thể đến muộn; nếu người dùng yêu cầu cap cứng thì cần cơ chế provider kiểm chứng được trước, không coi run cap/timeout là đủ. Không tự xin duyệt lại thao tác repo đã được giao.

## Ledger, chất lượng và tiêu chí quyết định

`ledger.json` khởi tạo `authorization.granted=false`, model/version/budget/cost/time con người=null, run=`not-run`. Nó không thực thi CLI. Với mỗi invocation thêm vào `calls`:

```json
{"id":"unique","role":"direct|pm|worker|probe|review|retry","requestedModel":null,"actualModel":null,"startedAt":null,"endedAt":null,"exitCode":null,"usage":{"input":null,"output":null,"cacheRead":null,"cacheWrite":null,"reasoning":null},"costUsd":null,"provenance":null,"rawArtifact":null,"sha256":null}
```

Lưu raw JSON/receipt đã kiểm bí mật ngoài repo, hash và nguồn đối soát; không ghi credential. Nếu client chỉ cho tổng theo session, giữ nguyên ngữ nghĩa đó, không tự phân bổ token cho tool/model turn. Không cộng cache/token trường bao hàm nhau hai lần; token không quan sát được giữ null. Mỗi arm ghi cả probes, PM, worker, review, retry/fail; `completeCallInventory=true` chỉ sau đối soát đủ. `totalCostUsd` phải khớp tổng calls và nguồn billing. Shared setup cost cũng cần provenance; số0 chỉ khi có bằng chứng không phát sinh tiền.

Ghi thời gian bằng event log thao tác người thật `{at, action, activeMs, decision, evidence}`: setup/kết nối/xác nhận/grant, chờ, làm rõ, phục hồi, nghiệm thu/báo cáo; phân biệt số thao tác và số quyết định. `director.activeMs` chỉ công điều hành trong thực thi; cộng `setup.directorActiveMs`, `recoveryMs`, `maintenanceMs` riêng, không đếm trùng. `elapsedMs` là toàn khoảng từ bắt đầu arm setup đến review/report cuối, bao gồm tests/chờ/phục hồi. Shared setup ghi công chuẩn bị case/acceptance/harness, kiểm manifest và phần session Codex này nếu có billing; phần hiện chưa quan sát giữ unknown. Không chỉ tính thời gian script chuẩn bị vài mili giây. So standalone thì shared setup được cộng vào cả hai lựa chọn; so incremental có thể báo thêm nhưng phải ghi rõ.

Acceptance bắt buộc: test pilot + runtime regression đạt; test không bị sửa; chỉ thay `src/runtime.js`; review không thấy workaround chỉ làm test xanh hoặc regression ngoài case. Ghi logs/hashes/diff/review vào quality artifacts; không tự cho true từ báo cáo writer. Mô hình/phiên bản/input/quality lệch thì không so hiệu quả điều phối.

Ngưỡng khóa **trước model pilot**: giảm ít nhất20% tổng billed cost **hoặc** công giám đốc, giữ chất lượng và metric kia tăng không quá10%. Báo elapsed/usage mọi arm dù không phải metric quyết định; không giấu chậm hơn. Tổng hợp bằng `node tools/summarize-pm-pilot.js <ledger.json>`; thiếu tiền hoặc công giám đốc thì `insufficient-evidence`, không thay unknown bằng0. Một cặp vượt ngưỡng chỉ là `pilot-candidate-needs-replication`; phải vượt biến thiên ở cặp lặp được cấp riêng mới có kết luận rộng hơn. PM thua là kết quả hợp lệ. Không đổi ngưỡng sau khi xem kết quả. Không đổi thời gian sang tiền bằng lương tự chọn.

First-use và reuse báo riêng. Nếu setup PM thêm S và tiết kiệm mỗi lượt D cùng đơn vị, điểm hòa vốn là ceil(S/D) khi D>0; D<=0 thì chưa có điểm hòa vốn. Không gọi kịch bản giả định là số lượt reuse đã đạt; không trừ bỏ phí session Codex/harness/bảo trì để tạo kết quả thắng.

## Overhead đã sửa trong phạm vi được phép

PM wait trước đây chỉ nhìn revision tại lúc gọi: run đã đổi trước đó vẫn có thể chờ tới25 giây nếu không có tin mới; state lặp lại toàn goal/tasks/runs/history. Thêm cursor tùy chọn ở PM state/wait: cursor cũ trả snapshot ngay, snapshot không đổi trả metadata ngắn; lease-only renewal không buộc gửi lại history. Auth/revoke/goal/run evidence vẫn được kiểm trước phản hồi. Không có cursor giữ compatibility; caller phải dùng cursor, CLI không tự lưu. Không thêm daemon hoặc lớp agent.

Control local `tools/measure-pm-wait.js` không chạy worker/model/port: snapshot1363 byte →171 byte khi unchanged, chờ với cursor cũ0ms; legacy wait505ms do sentinel chủ động giải phóng sau500ms (không đợi25 giây cho control). Đây chỉ là payload và idle wait, **không phải token, billing hay tổng hiệu quả PM**. Không xóa/bỏ verification hoặc grant nhằm làm số đo đẹp hơn.

## Kiểm chứng phiên này và giới hạn

- PM targeted15/15 đạt, gồm cursor + lease-only + pre-wait change + pause/revoke, hành trình sandbox/integration và các guard cũ.
- Analyzer3 test: giữ kết quả PM thua; chặn unknown/mất PM call/quality/model/input/billing không khớp; tính setup/recovery/maintenance và không suy tổng quát từ pilot. Lượt đầu một assertion test sai vì vẫn có metric công giám đốc vượt20%; sửa fixture kỳ vọng, không đổi ngưỡng production. Sau đó bổ sung kiểm recovery unknown, chạy lại trên source cuối.
- Script chuẩn bị và test độc lập được smoke trên hai copy; xem `pilot-preparation.json`, `pilot-repro.json`, `wait-control.json`, `tests-summary.json` và `pilot-unrun-summary.json`. Test pilot phải fail trên source chưa sửa; regression hiện tại phải pass. Đây là kiểm case/harness, không phải outcome model.
- Không chạy lại full suite cũ chỉ để tăng số kiểm. Không sửa UI, không khẳng định UX chấp nhận. Không tự sửa hai lỗi parser trong source chính để giữ case chưa giải cho cặp thử; không quảng bá chúng như incident production. Chưa có model/usage/billing/director effort thực. Toàn bộ thay đổi giữ chưa commit.
