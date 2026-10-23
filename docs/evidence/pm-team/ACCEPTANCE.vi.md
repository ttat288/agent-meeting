# PM theo sự kiện → team local → swap cùng slot → evidence

Lát cắt tại workspace ngày2026-10-22, trên HEAD `e292fd3833d65152ebfa6133fc27a67285b6cab9` cộng thay đổi chưa commit. Không reset/clean phần CLI/PM/UI/docs đã có. Không gọi model/probe trả phí, sửa settings global, cập nhật bản cài local hoặc commit/push repo; server fixture dùng loopback port ngẫu nhiên, không dùng3000.

## Vấn đề đã xử lý và phạm vi đủ

PM cũ phải điều khiển từng run, giữ lease và đọc progress; chưa có lead capability hay cơ chế thay runtime giữ WIP. Lát cắt mới cho **một lead/worker lane, logical slot A, một task canonical và một file tích hợp**, phù hợp task nhỏ không cần dựng đội nhiều người. Team đề xuất kế hoạch, PM duyệt một lần rồi chờ bằng code; team thực hiện/verify/integrate trong grant riêng, gửi result/blocker; PM đọc evidence, ack và báo ngắn. Không tạo task board, scheduler, memory engine hoặc hệ thống xếp hạng.

Giả thuyết giảm công giám đốc/chi phí model chưa được đo. Cơ chế giảm progress delivery vào PM không tự chứng minh rẻ hơn coding CLI trực tiếp. Không thay input pilot parser/baseline cũ hoặc claim README để ép kết quả có lợi.

## Bằng chứng

**Kết quả cuối:**295/295 test trên29 file đạt;19 ca team và15 ca PM riêng đạt. Syntax checks và `git diff --check` đạt. Mọi test được thực thi trên checkout tích hợp hiện tại, không chỉ bản copy module/skeleton.

- [journey.json](journey.json): task/run UUID, checkpoint hash/revision/scope, logical slot/generation, ledger execution/bootstrap, process-group stop receipt, event/dedupe/ack và report. Artifact **fixture**, không có model/provider/billing thật. Đường dẫn source/workspace tạm trong log chỉ làm provenance; các checkout đó được dọn sau test.
- [targeted-tests.txt](targeted-tests.txt):19 ca team trên source tích hợp, subprocess/bwrap thật; không chỉ mock state machine.
- [pm-regression.txt](pm-regression.txt):15 ca PM cũ, giữ UC09/private boundaries/client compatibility.
- [full-tests.txt](full-tests.txt): hồi quy tuần tự toàn repo. Kết quả cuối và hash source nằm trong [verification.json](verification.json).

Lệnh dùng giới hạn RAM1200MiB, swap0, heap768MiB, timeout150 giây cho file targeted hoặc900 giây cho runner toàn suite. `scripts/test.js` chạy từng file, timeout150 giây/file; test managed có deadline riêng. Chỉ chạy lại sau thay đổi/failure cụ thể. Các lỗi phát hiện trong quá trình và đã sửa: cancellation bị gắn failed; cleanup không đợi process drain; parent chưa tự kiểm ACK; quãng chờ swap cần fence trước khi old result kết thúc; ledger phải gắn generation chính xác và giữ cả bootstrap thất bại; wake cap cần attention bền vững để watch không lặp nhanh/đợi vô nghĩa. Không bỏ verification hay nới sandbox để xanh.

| Tiêu chí | Bằng chứng kỹ thuật đã có |
| --- | --- |
| Brief/goal/grant/plan đúng revision | Scope lấy từ director grant; plan giữ UUID; PM duyệt plan revision, source snapshot và baseline tests. Source đổi phải chủ động propose + approve lại. |
| Readiness | Workspace/base/snapshot, independent test files, sandbox, pinned config/model observation. Chạy test baseline trước handoff, lỗi runner/dependency chặn dispatch; acceptance fail của bug chưa sửa giữ nguyên bằng chứng. Không gọi probe ngầm. |
| Team có quyền riêng | Bearer hash riêng, POST/local/same-origin/rate/generation/goal/grant guards. Không gửi PM token/hostKey/private transcript. PM chair chỉ được start phòng hiện có/admit pending khi grant cho phép. |
| PM không model-poll progress | Client `watch` vòng chờ HTTP trong Node, stdout một lần khi có actionable event/guard. Fixture chạy child client thật và không nhận snapshot/message payload lặp. Initial run reported không tự đánh thức PM; result phải qua independent verify + source integration. |
| Event bền vững | ID gồm goal/plan/kind/key, dedupe và explicit ack; submit trùng giữ một event. Spoof/stale từ chối. Cap tạo attention và blocked watch; CLI tắt không auto-resume, pending được giữ. |
| A→A cùng task/run/WIP | Read-only bootstrap cố ghi file và bị filesystem từ chối; successor ACK đúng checkpoint/model/generation, old group SIGTERM→SIGKILL và không còn process sống trước promotion. File WIP giữ qua biên, independent test source đạt. |
| Runtime chủ động yêu cầu swap | Production `session-child.js` + `runtime.js` + supervisor chạy với executable fixture, chỉ thay discovery; response JSON có cấu trúc xin swap được kiểm grant/cap. Không executable/shell tùy ý và không token model. |
| Model kế thừa | Same-model và different allowlisted-model fixtures giữ slot/task; model identity/lượt bootstrap được ghi riêng. Model ngoài allowlist hoặc observation/routing không hợp lệ bị chặn. Không gọi đây là thử provider thật. |
| Lỗi và dừng | ACK sai/timeout giữ old writer hoặc fail closed; stale source/WIP/checkpoint, replay, goal/revoke giữa readiness không promote. Pause/revoke/goal/takeover/time expiry cancel; PM lease lapse không giết công việc đã bàn giao trong grant còn hiệu lực. |
| Restart | Pending event giữ; capability/grant/approval bị vô hiệu; không dispatch lại. Run chưa rõ giữ interrupted cần reconcile, không suy token revoke thành process đã chết. |
| Báo cáo | Report cần result event đã ack và source integrated còn khớp; có acceptance, test evidence, ledger/runtime identity, elapsed. PM/lead ngoài, tổng cost và telemetry chưa quan sát giữ null/unknown. |

## Cách dùng và giới hạn còn mở

Contract/operation cụ thể ở [prompt PM](../../prompts/pm-operator.vi.md#khi-grant-có-team--pm-theo-sự-kiện-apicli-local). Director thêm `team` vào API grant hiện có; PM dùng `bin/pm.js`, lead dùng `bin/team.js`. Đây là **hành trình API/CLI local**; UI hiện hữu chưa có form team grant, lựa chọn thời lượng hoặc lifecycle swap mới. Không sửa UI trong lát cắt, không viện test cũ để nhận đã nghiệm thu browser/UX UC10.

Supervisor Linux quản lý driver Node và CLI subprocess trong process group, bootstrap bằng bwrap read-only. Adapter Claude print có bootstrap rồi invocation thực thi mới; không phải native resume cùng transcript. CLI bên ngoài supervisor không được hứa tự đóng. Model managed trả structured request ở biên phản hồi; chưa tích hợp native swap tool vào MCP hội thoại, telemetry threshold/auto-compaction hoặc context controller. Full inventory giữ ở backend; successor nhận summary/decision/acceptance/scope/WIP/hash, không nạp toàn history hoặc private transcript.

Session60/120/180 phút hoặc null đếm từ handoff; grant expiry và run/invocation/swap/wake caps vẫn có. Invocation reservation không phải provider request count/hard spending cap. Event không là quyền chi tiền. Watch chỉ phục vụ CLI/tool đang sống, không daemon khởi động model đã tắt. Restart giữa transaction yêu cầu reconcile thủ công; không có tự phục hồi nguyên session. Tích hợp vẫn một file, required expert review vẫn blocked.

**Chưa nghiệm thu model thật, UX team/swap,8h context hoặc lợi ích kinh tế.** Muốn mở cửa model cần director chọn rõ runtime/model/version/provider identity, chấp thuận paid probe và chi phí chưa biết hoặc cơ chế ngân sách phù hợp, scope/test/input khóa và cap cho mọi PM/lead/worker/bootstrap/retry. Case tối thiểu một execution + một swap cần tối đa3 managed invocation reservation, **chưa gồm paid probe/PM/lead ngoài**; từng invocation có thể nhiều provider request. Không hard cap USD thì không được hứa bảo đảm ngân sách tiền. Giữ baseline direct CLI có native compaction/tests/report mạnh và ghi cả kết quả bất lợi/unknown.

Điểm dừng: phần local được phép đã chạy hết luồng có evidence và checks; không tự mở thêm UI/đa thành viên/remote/multi-file/ranking hay gọi paid model để lấp cửa nghiệm thu chưa được cấp quyền.
