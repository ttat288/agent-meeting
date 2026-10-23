# Review packet — context metric và kế thừa bằng dữ liệu, 2026-10-22

Trạng thái: đề xuất chờ phản biện CLI; không tự xem fixture là nghiệm thu model. Người dùng đã cho phép hai lượt review chỉ đọc: Antigravity/Gemini Flash3.8 (trả phí, giao kiểm kê dữ kiện) và có thể thử Claude (giao phản biện thiết kế). Không retry/probe model riêng, không đổi global settings/config catalog, không commit/push hoặc đụng3000/bản cài local. Runtime đã kiểm executable/version: agy1.4.3, Claude Code2.1.289; quyền model vẫn unknown cho tới invocation thực. `agy models` chỉ liệt kê ID, không là model probe: Flash có low/medium/high. Chọn `gemini-3.8-flash-low` cho extraction, Claude native `claude-opus-5-5` theo machine evidence lịch sử trong repo, không hứa access hiện tại. Không chọn model khác hoặc retry nếu fail. Không có hard USD cap; usage/cost unknown phải ghi null, hai invocation không là hai provider request.

## Mục tiêu review

Người dùng muốn agent không mất mạch khi context gần đầy, giữ được task/WIP/decisions/evidence qua swap, và tránh gọi model chỉ để nhắc lại log. Chấp nhận nghiên cứu hướng khả thi, không hứa “0 token” hoặc context không tăng. Câu hỏi cần kết luận: có thể dựng capsule từ canonical tool state mà không gọi CLI model tóm tắt lại không; còn dữ liệu nào phải ghi trong lúc làm, không thể suy từ task done; đo và đối chứng thế nào trước tự động hóa?

## Source facts đã kiểm (cần reviewer tự đối chiếu packet source)

- `tools/measure-context-window.js` chỉ phân tích trace offline, current input/cache/percentage, null/mismatch giữ unknown. Không collector hoặc controller dự báo. Context resident/usage/billing khác nhau.
- `src/team.js` checkpoint giữ goal/plan/task revision, snapshot/WIP, acceptance/scope; vẫn yêu cầu agent cung cấp `decisions`, `unknowns`, `next`. `contextFor` chỉ bỏ snapshot full, không tự tạo semantic summary từ task log.
- `src/work.js` giữ task/run/result/diff/tests và integrate evidence. Báo reported chưa là verified/integrated. Task status không bao phủ mọi constraint, rejected alternatives, failed attempts hay reasoning chưa được ghi.
- `src/session-child.js` gọi model một lần bootstrap read-only ACK và một lần activate. Claude args `--no-session-persistence`: bootstrap không truyền native model history sang activation; activation nạp lại checkpoint trong prompt. Tính cả hai invocation/token/cache/latency. ACK hash không chứng minh hiểu semantic.
- Swap/manual/runtime-request có fixture subprocess và full suite295/29 tại lượt trước. Chưa model context telemetry/auto-trigger/8h. Review lần này không là benchmark thực thi task/retention.

## Phương án để phản biện (chưa build)

1. App dựng **phần đã ghi nhận** bằng code từ canonical task/run/decision/evidence references, gắn revision/hash/actor/generation. Không gọi model để tóm tắt lại dữ kiện đã có. State có status thực; không biến lời done thành verified. Capsule không bao gồm private PM transcript hoặc credential.
2. Agent ghi delta rất nhỏ tại mốc cần thiết: quyết định/ràng buộc mới, lý do có ý nghĩa, phương án thất bại cần tránh, blocker/WIP không thể suy từ artifact, bước tiếp. Tận dụng output đang phải trả; tránh thêm lượt model chuyên tóm tắt. Metadata output và successor đọc vẫn tốn token, tính đủ; thiếu delta thì unknown/block, không tự bịa nội dung.
3. Snapshot/evidence bên ngoài model không đồng nghĩa đã có trong context successor. Bootstrap phần tối thiểu + truy hồi có giới hạn theo task/source hash, có đường lấy phần thiếu; chống stale và replay. Giữ cùng slot và single writer. Không tự xây memory engine/embedding/vector DB.
4. Collector một adapter trước, không gọi model đo chính mình. Dự báo dùng telemetry mới + input app biết + upper error margin/headroom để checkpoint; freeze schema/clock/capacity/model/version. Không cộng tổng billing để tính context; không ngưỡng80% phổ quát. Thiếu/stale telemetry không được tự suy là an toàn. Dùng shadow mode trước controller.
5. Benchmark đối chứng direct CLI native context/compaction mạnh, cùng task/source/acceptance/quyền/model/version, không nhồi history để ép baseline thua. Kiểm end-to-end quality/WIP/decisions/source sau swap; tính PM/lead/worker/notes/bootstrap/retrieval/compaction/retry/cache/tool overhead/công người dùng. Không đo riêng payload rồi claim billing.

## Metric cần ghi

- Observation: nguồn/schema/CLI version/model/session/generation, timestamp + freshness, sample coverage, unknown/mismatch, peak observed context; khoảng chưa đo không được bảo đảm.
- Forecast: forecast trước bước, actual tại cùng semantic boundary, underprediction distribution/maximum/exceedance, interval coverage. Không chọn P95/P99 tin cậy trên vài mẫu; cỡ mẫu/CI và workload phải công khai. Telemetry thiếu actual thì forecast error=null.
- Recovery: checkpoint coverage của must-preserve facts với gold oracle độc lập, missing-critical-fact, repeated/forgotten work, unauthorized/stale write, đủ headroom bàn giao, source tests, swapped generations, recovery latency. Fact chỉ check có key là structural coverage, không semantic retention.
- Cost: số lần gọi model dành riêng để summary/collector; token/duration/cost mọi actor + startup/ACK/rehydrate/tool/cache, setup/phục hồi, unknown tách0. “Assembler model calls=0” không là total tokens=0.
- Outcome: chất lượng task như baseline; swap late/avoidable, success rate và sample count.8h chỉ được nói khi chạy workload thật8h, không simulated/replay.

## Phép thử local đã chạy

`benchmark-local.js` dựng capsule thử nghiệm bằng code từ evidence export fixture đã có.5 invariant đạt; assembler model calls0; capsule1154 byte so projection dữ kiện đã biết660 byte (**thêm494 byte**). Export đầy đủ6456 byte là baseline transport yếu, không là CLI benchmark. Export thiếu4 trường metadata cho kế thừa (decision/unknown/base/requirement revision); code báo thiếu và không tự nhận ready. Đây là **export evidence thiếu**, không chứng minh live work store thiếu hết các trường tương ứng. Không có actual token/context/billing/model semantic quality; mọi trường đó null. Không biến local experiment thành runtime đã tích hợp.

## Output yêu cầu

Flash: chỉ trả bảng facts/evidence/source location/missing/conflicts, tối đa12 dòng; không chốt kiến trúc hoặc dự báo mô hình. Claude: verdict feasible/conditional/not-feasible + blocker thực tế, sửa phương án nhỏ nhất, metric/oracle/baseline, tiêu chí dừng; kiểm cả overhead/bước ACK. Tối đa900 từ, không dùng tool/mạng/subagent, không sửa file, không gọi model khác, không commit/push. Không coi quan điểm reviewer là facts cho tới đối chiếu source. Nếu thiếu bằng chứng, nêu unknown, không hứa0 token/8h.
