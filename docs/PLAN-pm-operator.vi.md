# PM điều hành thay giám đốc — lát cắt triển khai, 2026-10-22

**Trạng thái source mới — 2026-10-22:** đã có lát cắt API/CLI local một lead/slot/task, PM events/watch, grant/readiness/plan approval và managed same-slot swap. [Bằng chứng/giới hạn](evidence/pm-team/ACCEPTANCE.vi.md). Thiết kế dưới đây vẫn rộng hơn capability hiện có: chưa có UI cấp team grant/lifecycle, đa thành viên/đa file, model thật hoặc context8h. Các ghi chú “chưa triển khai runtime” trong phần thiết kế là baseline trước lần thực thi; không coi mọi mục thiết kế đã được hoàn thành.

## Định hướng mới: PM giao việc cho team, hoạt động theo sự kiện

**Đã giao triển khai phiên tiếp theo, 2026-10-22:** người dùng yêu cầu gom bàn luận và phiên tiếp theo thực thi đến done, sẽ treo máy khoảng3 giờ30 phút. Đọc mục “Bàn giao thực thi” đầu HANDOFF cho scope/acceptance/quyền hiện hành; không dừng ở đọc context, thêm plan/prompt hoặc skeleton. Thời gian treo máy không là deadline nghiệm thu và không cấp ngân sách/model trả phí. Giữ tách rõ kỹ thuật fixture đã kiểm và model/UX/hiệu quả thực còn chưa nghiệm thu.

### Swap phiên/model dưới cùng danh tính thành viên

**Quyết định mới nhất của người dùng:** thay luồng agent out/join như hai thành viên độc lập bằng swap runtime/model kế thừa dưới cùng logical agent/slot. A yêu cầu mở CLI kế thừa, nén context/bàn giao lên backend; CLI mới vào ở trạng thái chờ, nhận task/context rồi server chuyển quyền và đóng phiên cũ. Cùng model/phiên mới giải quyết context; khác model giải quyết lựa chọn năng lực hoặc nguồn quota đã được cấp quyền. Không mặc định model khác cùng account sẽ có quota hoặc quyền.

Luồng đích có transaction rõ:

1. A yêu cầu swap qua API scoped; checkpoint nêu goal/task/plan revision, workspace/base + trạng thái dirty/WIP/artifact, quyết định/ràng buộc, evidence, unknowns và bước tiếp. Gửi trước khi cạn khả năng gọi model. Server xác nhận lưu version/hash; không đặt checkpoint đầy đủ vào public room log.
2. Supervisor/adapter mở đúng CLI/model được phép, một successor cho lần swap, ở workspace/quyền chờ đã kiểm. AI đề nghị qua tool chuyên biệt; không tự ghép shell/prompt để đẻ tiến trình model tùy ý. Mở sớm chỉ khi quota/budget/run cap cho phép; chi phí bootstrap cũng tính.
3. Successor được nhận đúng context cần cho slot, xác thực bằng credential bàn giao tạm riêng; acknowledge checkpoint hash/revision, danh tính runtime/model và readiness. Không được ghi mã hoặc nhận task khác chỉ vì đã join. Slot A hiện “Đang bàn giao”; team biết đây là phiên kế thừa, không bầu lại lead/gán lại mọi việc.
4. Dừng/quiesce writer cũ và xác minh đã mất quyền ghi, rồi server chuyển owner/generation một lần, vô hiệu capability cũ, cấp quyền tiếp tục cho successor. Supervisor đóng process cũ theo lifecycle có kiểm chứng. Nếu có overlap bootstrap thì chỉ một writer active; token revoke không là bằng chứng process ngoài đã ngừng ghi. CLI không do app quản lý phải báo giới hạn, không hứa auto-close.
5. Kế thừa slot/task/quyết định/evidence và cursor hợp lệ; lịch sử gắn phiên/model/generation thực để không ghi công sai. Context mới nạp gọn + truy nguồn theo nhu cầu; không tải lại toàn bộ history vào model. Same-model fresh context khác resume cùng history. Không mang token cũ vào checkpoint/chat hoặc cho successor tự nâng grant.

Lỗi cần có bằng chứng: spawn/ready/ack timeout, checkpoint thiếu/stale, source đổi, revoke/pause/goal change giữa swap, successor giả, event trùng/replay, quota cạn không thể tóm tắt, restart giữa chuyển quyền, cancel cũ chưa xác minh. Dừng an toàn/giữ checkpoint, không hai writer, không tự retry chi tiền hoặc đóng phiên cũ trước khi checkpoint được lưu. Retry/swap cap phải theo grant; đổi model ngoài allowlist/budget cần quyết định giám đốc. Cơ chế này không là lệnh cho phiên hiện tại tự mở CLI trả phí.

Đủ để nghiệm thu kỹ thuật: fixture subprocess có scope thật chứng minh A→A kế thừa đúng task và WIP, stale writer bị chặn/cancel, successor không bị mất slot, checkpoint/evidence/phạm vi đúng và UI/trạng thái không giả hoàn tất. Muốn nói đã chạy với CLI/model thật hoặc giữ context ổn8h cần telemetry/run thực được cấp quyền riêng; fixture/process giả không thay điều đó.

**Bổ sung yêu cầu context phiên dài:** [protocol context-window](evidence/context-window/PROTOCOL.vi.md) khóa sự khác biệt giữa context hiện tại, total usage và billing, giới hạn quan sát/control theo từng CLI và benchmark baseline native compaction. Đã có analyzer offline6 tests; chưa có collector/controller hoặc phép thử8h. PM ngủ theo sự kiện không giải quyết context của lead/worker; mỗi vai trò cần checkpoint/khôi phục phù hợp. Không hứa context không tăng hoặc tin số model tự ước lượng.

**Yêu cầu mới của người dùng, 2026-10-22; thiết kế đích, chưa triển khai runtime:** PM thay người dùng chủ trì giai đoạn đầu, hiểu mục tiêu và chịu trách nhiệm kết quả; team tự chọn lead, đề xuất cách chia việc, được PM kiểm tra kế hoạch rồi chủ động thực hiện. PM không theo dõi từng bước bằng model. Team báo trở ngại cần quyết định hoặc chuyển kết quả để đánh thức PM; PM nghiệm thu theo bằng chứng và nén kết quả cho giám đốc. Đào sâu/báo cáo bổ sung theo câu hỏi và nhu cầu thật của giám đốc.

Đây là thay đổi mô hình vận hành, không chỉ đổi prompt hoặc thêm tên role. Lát cắt PM hiện tại phía dưới vẫn chạy PM → run/verify/integrate, chưa có lead capability, wake/resume hay team tự vận hành. Không quảng bá là đã có công ty tự chủ. Ưu tiên thiết kế mới này thay việc mở rộng PM quản lý mọi task; benchmark cũ/pilot input đã khóa giữ nguyên, không dùng nó để đánh giá một runtime mới khi chưa version lại protocol.

### Pain point, giá trị và tiêu chí đủ

- Giám đốc muốn giao một yêu cầu, trao đổi những quyết định quan trọng rồi nhận kết quả; PM cũ còn đóng vai trò điều khiển từng thao tác worker. Overhead payload/wait đã đo; overhead model/công giám đốc thực chưa đo. Team tự chọn lead/chia việc hiện là hành vi hội thoại có thể đề xuất, chưa là quyền backend đã triển khai.
- Giả thuyết cần kiểm: bỏ PM model khỏi vòng tiến độ thường nhật sẽ giảm số lượt PM và công giám đốc mà không giảm chất lượng hoặc tăng chi phí bù ở lead/worker. Không coi chuyển token PM sang lead là tiết kiệm tổng.
- Hành trình đủ đầu tiên: một mục tiêu có acceptance → vài quyết định thực sự cần giám đốc → môi trường sẵn sàng → team đề xuất lead/kế hoạch → PM duyệt → team tự thực hiện trong quyền → một tín hiệu kết quả có evidence → PM báo cáo ngắn, người dùng mở được bằng chứng. Chặn đúng goal stale, lỗi môi trường, test fail, pause/revoke và báo xong giả. Không cần dựng công ty/HR/scheduler tổng quát.
- Với task nhỏ mà một coding CLI làm tốt, cho phép PM nhận thầu rồi giao một người hoặc khuyến nghị direct; không bắt lập team/họp/bầu lead. Nếu PM chỉ là lớp chuyển tiếp không bù được overhead, bỏ lớp đó cho loại việc ấy.

### Phân quyền và trách nhiệm

| Vai trò | Chịu trách nhiệm | Giới hạn |
| --- | --- | --- |
| Giám đốc | Mục tiêu, quyết định ảnh hưởng sản phẩm, ngân sách/quyền và chấp nhận kết quả | Không vận hành từng tool; vẫn dừng/thu hồi/tiếp quản được |
| PM | Hiểu yêu cầu, đề xuất acceptance/phạm vi, mở hoặc chuẩn bị phòng, duyệt thành viên/kế hoạch, xử lý quyết định vượt quyền team, kiểm kết quả và báo cáo | Không chia lại mọi task hoặc review từng dòng thường xuyên; không nâng quyền/chi phí bằng hội thoại |
| Lead do team đề xuất | Phân việc/dependency, kiểm đầu ra, tích hợp trong quyền, xử lý vấn đề kỹ thuật, tổng hợp evidence cho PM | Không tự đổi mục tiêu/ngân sách; không dùng credential PM/host |
| Thành viên | Nhận phạm vi rõ, thực hiện và báo kết quả có bằng chứng, phản biện khi cần | Báo xong không tự là verified; không tự duyệt kết quả mình hoặc tự đuổi đồng đội |
| Backend và công cụ xác định | Capability, revision, run/test/integration, thời hạn, checkpoint, sự kiện và chặn quyền | Không dùng model để làm heartbeat, đếm giờ hoặc kiểm trạng thái đơn giản |

PM chịu trách nhiệm về hệ thống giao việc: khi lỗi, kiểm lại brief/acceptance, cách chia việc, công cụ và môi trường trước khi quy lỗi cho một thành viên. PM phải nói rõ thiếu quyết định hoặc thiếu khả năng từ đầu, không build tùy đoán rồi giải thích bằng lỗi cấp dưới.

### Một yêu cầu, những quyết định có giá trị

PM đọc nguồn dự án liên quan, tóm tắt điều đã hiểu và đưa phương án khuyến nghị. Tự xử lý lựa chọn kỹ thuật thường nhật trong scope. Chỉ hỏi giám đốc khi quyết định thay mục tiêu, đối tượng dùng, acceptance, chi phí, quyền hoặc đánh đổi khó đảo ngược. Có thể có nhiều vòng làm rõ khi thật sự thiếu quyết định, nhưng không ép mọi dự án qua một bộ câu hỏi dài cố định.

Mẫu tương tác đích trong kênh riêng hiện hữu:

> Tôi đề xuất hoàn thành luồng A trước để bạn dùng thử ngay; B có thể làm sau. Bạn đồng ý phạm vi này chứ?
>
> **Đồng ý** · **Tôi muốn đổi**
>
> Khi chọn đổi: “Bạn muốn điều chỉnh phần nào?” — nhập ý muốn hoặc lý do nếu hữu ích. Không bắt giải trình để được từ chối. Luôn cho phép trả lời tự do; dùng lựa chọn nhiều phương án khi yes/no không đủ rõ.

Trước thực hiện có một bản tóm tắt để giám đốc duyệt: kết quả mong đợi, acceptance, phần chưa làm, giả định quan trọng, quyền/ngân sách, thời lượng phiên, mức báo cáo. “Đồng ý kế hoạch” chỉ phê duyệt đúng bản revision đang hiển thị; không mặc nhiên đồng ý chi phí chưa biết hoặc mọi quyền máy. Câu trả lời mặc định không tự được gửi hoặc tính là chấp thuận. Đổi ý làm revision cũ stale và yêu cầu reconcile công việc đang chạy.

Thiết kế hỏi–đáp dùng khối Chủ trì/kênh PM hiện hữu, cùng VI/EN, keyboard và trạng thái gửi/lỗi rõ; không thêm dashboard/bộ máy quản lý riêng. Đã đọc ui-ux-pro-max và design tokens hiện hữu. Query local về progressive disclosure không có kết quả đúng vấn đề sau một lần thu hẹp; không dùng kết quả heading-wrap để chứng minh UX hỏi–đáp. Đề xuất giảm câu hỏi và mở phần lý do theo lựa chọn dựa trên yêu cầu người dùng; nguyên tắc label/feedback lấy từ các hướng dẫn Forms phù hợp đã đọc. Chưa dựng UI mới hoặc nghiệm thu UX.

### Thời lượng phiên và ngân sách là hai quyết định riêng

Đề xuất bốn lựa chọn: **1 giờ / 2 giờ / 3 giờ / Đến khi hoàn thành**. Lựa chọn cuối nghĩa là không đặt hạn tổng cho phiên, nhưng vẫn dừng khi acceptance đạt hoặc gặp điều kiện dừng. Không cần thêm “Unlimited” đồng nghĩa, dễ bị hiểu là tiền vô hạn.

- Đồng hồ phiên bắt đầu sau duyệt brief/quyền và readiness đạt, tại thời điểm bàn giao team; thời gian làm rõ không ăn vào phiên thực hiện. Nếu đã chạy thì thời gian chờ quyết định vẫn thuộc thời gian phiên, ghi riêng công người dùng/chờ máy.
- Hết thời gian: chặn dispatch mới, yêu cầu dừng an toàn/checkpoint các run, ghi phần đã xong/chưa xong và hỏi quyết định gia hạn. Không tự cấp thêm ngân sách hoặc hứa mọi process ngoài đã bị giết.
- “Đến khi hoàn thành” vẫn có cap tiền hoặc consent unknown-cost rõ ràng, run/fix/wake cap và timeout từng tiến trình; stalled/retry vô hạn phải bị chặn. Cap runtime không thay hard spending cap. Giữ chế độ và các giới hạn thực mà backend đã hỗ trợ; chưa có enforcement thì chưa mở lựa chọn như một tính năng đang có.
- Lựa chọn thời lượng cho sản phẩm tương lai không đặt deadline tổng cho phiên phát triển hiện tại và không gỡ lệnh cấm model trả phí.

### Readiness và context trước khi giao team

PM giữ bản hiểu chuẩn có revision: mục tiêu/acceptance, quyết định và lý do, constraints, unknowns, scope/budget, repo/base, mốc và bằng chứng. Hiểu context nhất nghĩa là giữ quyết định chính xác và biết truy về nguồn; không buộc PM nuốt mọi raw log hoặc reference. Lead nhận context thực hiện đã duyệt, thành viên nhận phần cần cho task và các ràng buộc chung. Private giám đốc–PM không được đẩy cả transcript cho team.

Trước dispatch: workspace riêng đúng snapshot/base; tool/runtime/model identity và quyền có bằng chứng; dependencies/test command hoạt động; đường dẫn output/evidence và cách báo blocker rõ. Dùng check xác định/local trước, paid probe chỉ sau consent/ngân sách. Missing credential, model mismatch hoặc test runner lỗi là readiness blocked; không đổ cho năng lực model hoặc mở quyền global để chữa. Môi trường đầy đủ không có nghĩa chia sẻ secrets/hostKey cho mọi agent.

Team đề xuất lead và task breakdown có ID/dependency/owner/output/acceptance/budget trong nguồn task hiện hữu. PM kiểm một lần về coverage, task trùng/bỏ sót, dependency, quyền và khả năng kiểm chứng; yêu cầu sửa những thiếu sót cụ thể, không tự chia lại chỉ để kiểm soát. Đổi phạm vi lớn mới quay lại PM. Bầu lead ban đầu qua thỏa thuận trong phòng, PM xác nhận quyền; không cần hệ thống voting/ranking model.

### PM ngủ theo nghĩa vận hành; team đánh thức bằng sự kiện

Flow đích: `clarifying → readiness → team-plan → team-working → pm-review → completed`.
Nhánh cần quyết định/failed/paused/cancelled giữ bằng chứng, không ép thành completed. Đây là phase vận hành đích, không thay trạng thái run reported/verified/integrated hiện có.

Sau duyệt kế hoạch, PM không gọi model để đọc mỗi progress/heartbeat. Lead tự quản trong quyền. Chỉ đánh thức PM khi:

1. Team có kết quả đủ điều kiện chuyển nghiệm thu, kèm task/run/artifact/test evidence.
2. Blocker vượt quyền team hoặc buộc thay quyết định sản phẩm/ngân sách.
3. Guard hệ thống báo hết phiên/ngân sách, sự cố không phục hồi được hoặc cần quyết định thay thành viên vượt quyền.
4. Giám đốc đổi yêu cầu, dừng hoặc yêu cầu báo cáo/đào sâu.

Sự kiện vào kho hiện hữu có ID, goal/plan revision, actor xác thực, lý do và evidence refs. Deduplicate/coalesce tiến độ, rate/wake cap và ack theo ID; không gọi model cho “đang làm”, log test pass lặp hoặc nhắc đồng ý. Worker signal là dữ liệu đề nghị, không phải quyền chi tiền hoặc kết luận hoàn thành. Event cũ không tác động goal/grant mới. Restart giữ pending event, vô hiệu credential như policy hiện có; resume phải có kiểm chứng và không dispatch lặp.

Đường đánh thức phải là chương trình bridge/watch hoặc runtime resume được kiểm chứng: chờ mạng/heartbeat bằng code, chỉ trả input cho model khi có sự kiện cần xử lý. CLI tắt thì event vẫn còn và UI nói cần kết nối; không giả rằng wait cursor, lưu phòng hoặc prompt “ngủ đi” đã tạo wake runtime. Chưa có quyền/runtime model để kiểm đường wake thật.

Lead xử lý run/test/integration bằng capability riêng có scope; heartbeat PM không phải điều kiện sống của các run đã bàn giao hợp lệ. Director revoke/goal change vẫn chặn lead và cancel/reconcile theo controller. Không được giải quyết bằng cách đưa PM token/hostKey cho worker hoặc bỏ lease. Quyền cancel/reassign có generation: trước khi giao lại phải chứng minh dừng hoặc cách ly writer cũ, giữ artifacts/checkpoint và tăng revision. Không cho hai writer cùng ghi source.

### Thành viên không đáp ứng: sửa đúng nguyên nhân và bảo vệ đầu ra

Không đánh giá model theo tên, giọng văn hoặc chậm một lần. Progress phải có đầu ra kiểm được: artifact/diff, test log, điều đã kiểm và blocker. Kiểm công cụ/môi trường, độ rõ task, độ khó và lỗi tích hợp trước.

Nếu lỗi có thể phục hồi, lead góp ý cụ thể hoặc thu nhỏ phần việc trong giới hạn sửa đã cấp. Nếu tiếp tục gây lỗi nghiêm trọng, vi phạm scope hoặc không tạo tiến triển có bằng chứng, team đề nghị rút agent khỏi **task/phiên này**, kèm lý do và tác động; không suy thành xếp hạng model phổ quát. Vi phạm scope có thể yêu cầu dừng ngay. Chỉ actor có quyền mới cancel/reassign/kick. Khi nằm trong grant đã duyệt thì lead xử lý và báo PM ở mốc; vượt grant/ngân sách thì hỏi PM/giám đốc. Không làm thêm hệ thống HR/chấm điểm tổng quát.

### Báo cáo cuối và đào sâu theo yêu cầu

PM là người nén cuối nhưng phải giữ sự thật: kết quả so với acceptance, evidence, rủi ro/phần chưa xong, usage/cost/time đã biết hoặc unknown, quyết định cần giám đốc. Report mặc định ngắn, link mở được để đào sâu. Mức độ chuyên nghiệp là rõ ràng, chính xác, phù hợp người đọc; không biến việc nhỏ thành báo cáo dài.

Mẫu ngắn (chỉ là cấu trúc, không là kết quả đã có):

> **Kết quả:** …  
> **Kiểm chứng:** … [bằng chứng]  
> **Còn hạn chế:** …  
> **Chi phí/thời gian:** …; phần chưa đo: …  
> **Bạn cần quyết định:** … / chưa có.

Giám đốc có thể chọn ngắn / chi tiết / tài liệu trình bày chuyên nghiệp lúc giao việc hoặc sau đó. “Vì sao chọn phương án này?” khiến PM truy evidence/decision đã lưu trước; chỉ giao nghiên cứu thêm nếu nguồn chưa đủ và còn quyền/ngân sách. Mỗi yêu cầu bổ sung có scope/acceptance riêng; không tự làm lại dự án hoặc gọi đội đầy đủ chỉ để trả lời một câu.

PM xác nhận kết quả theo evidence/điều kiện nghiệm thu của dự án; không coi cả team đồng ý, test xanh hạn chế hoặc model báo hoàn thành là đủ. Missing review/verification hoặc multi-file chưa hỗ trợ phải báo blocked/giới hạn đúng, không nén mất rủi ro để báo cáo đẹp.

### Khoảng cách source và lát cắt triển khai cần có

| Hành trình | Source hiện tại | Công việc cần thiết cho hành trình mới |
| --- | --- | --- |
| Nhận yêu cầu/trao đổi riêng/goal/grant | Có PM capability và kênh riêng | Brief quyết định có revision, approval gắn đúng scope, session/report preference |
| Tạo phòng/mời/duyệt/chủ trì thay user | Host có quyền; PM join vào phòng đã tạo, API PM chưa có start/admit | Chỉ cấp các operation chair được grant rõ; lời mời người dùng cấp quyền native vẫn cần; không mở tunnel tự động |
| Team chọn lead/chia task | Hội thoại + VIỆC có task UUID; chưa có quyền lead | Kế hoạch dùng chung kho task, xác nhận lead/plan, capability execution riêng; PM không là dispatcher từng bước |
| Team tự làm/đánh thức PM | PM gọi run/verify/integrate; lease gắn PM; chưa có wake runtime | Bàn giao quyền có generation, team signal/outbox và watch/resume thật; không bỏ guard |
| Sẵn sàng/thay agent | Có runtime checks, probe và workspace riêng; chưa có vòng team reassign | Preflight, evidence/retry cap và hủy/reconcile writer trước giao lại |
| Báo cáo cuối/đào sâu | Report một managed run với evidence, PM usage unknown | Tổng hợp acceptance các task hiện hành, không thêm kho results khác; source/cost provenance và truy sâu |

**Lát cắt tiếp theo:** một hành trình local low-risk trong capability hiện có, từ PM chair giới hạn → team đề xuất lead/plan → handoff scope → team hoàn tất hoặc escalate → một wake → PM report. Fixture chạy code thật trước; model thật cần cấp quyền/budget riêng. Chưa tự triển khai remote/multi-file/scheduler/model scoring để làm demo đẹp. Cần có wake runtime và backend quyền lead trước khi tuyên bố team tự làm không cần PM follow. Mọi test có timeout/memory/run cap, không deadline tổng.

### Wow factor cần đo

Lời hứa sản phẩm đích: **“Giao một mục tiêu, quyết định ở các mốc quan trọng, nhận kết quả đã kiểm chứng cùng báo cáo rõ ràng.”** Chưa phải claim hiệu quả hiện có.

Đối chứng direct coding CLI mạnh, manual team và PM theo sự kiện chỉ ở case cần phối hợp thật; việc đơn giản giữ direct như control. Tính mọi model PM/lead/worker/review/probe/retry, setup phòng/readiness, công giám đốc, test/integration, wake và recovery. Báo lần đầu và reuse thực riêng. Metric chính là công giám đốc trên kết quả đạt acceptance, đồng thời giữ tổng cost/chất lượng/elapsed và tỷ lệ thành công công khai. Số lượt PM bị loại khỏi progress chỉ là metric giải thích, không thay tổng chi phí.

Chưa có quyền paid/model/budget mới từ ý tưởng này. Ngưỡng/wake budget/case mới phải khóa trước thử; nếu PM+lead không bù overhead thì giản lược role hoặc dùng direct. Không biến “công ty tối ưu” thành yêu cầu triển khai mọi chức năng tổ chức trước khi có lợi ích thật.

---

## Lịch sử và khả năng PM đang có trước định hướng team

**Cập nhật ủy quyền 2026-10-22:** người dùng đã yêu cầu build ý tưởng dưới đây ở phiên kế tiếp, thực thi ngay sau nạp context. Không đặt deadline tổng; làm đến khi hành trình mục tiêu được kiểm chứng và chi phí/context được đánh giá trung thực. **Đã có coordinator capability/API/CLI client, kênh riêng, goal/grant, run/verify/integrate/report và điều khiển giám đốc**; xem [bằng chứng](evidence/pm-operator/ACCEPTANCE.vi.md). PM là CLI ngoài do người dùng tự mở, chưa có daemon/model launcher PM; chưa nghiệm thu model thật. Các mục kiến trúc sâu hơn bên dưới vẫn là định hướng, không tự trở thành khả năng hiện có. Không tự gọi model/CLI trả phí, thay settings global, đổi process3000, commit/push hoặc cập nhật bản cài local.

## Phạm vi đã giao và điểm dừng

- Vào web chọn **Tôi làm chủ trì** hoặc **Agent làm chủ trì**. Chọn Tôi giữ luồng hiện có; chọn Agent sinh lời mời/prompt riêng cho PM CLI join trước và được người dùng xác nhận. Người dùng là giám đốc, làm việc qua PM; vẫn xem được tiến độ/bằng chứng và có thể dừng/thu hồi/tiếp quản. PM có danh tính và quyền backend riêng, không lấy hostKey hoặc giả danh giám đốc.
- Hoàn thành một hành trình hữu ích: giao mục tiêu → làm rõ/lập kế hoạch → thực hiện trong phạm vi quyền → kiểm chứng/review phù hợp → kết quả có bằng chứng và báo cáo giám đốc. Tận dụng task/run/source/revision hiện có. Không dừng ở màn chọn, prompt đẹp, skeleton hoặc role chỉ có tên PM; cũng không buộc xây hết mọi mục kiến trúc/backlog A–C bên dưới.
- Áp dụng AGENTS “Pain point trước, làm đủ và biết dừng”: chọn lát cắt nhỏ nhất giải quyết trọn việc, sửa đến tiêu chí đủ. PM không tự tạo cuộc họp/đội nhiều agent cho mỗi yêu cầu; chỉ thêm worker/reviewer khi cần và có quyền. Không xây sơ đồ phòng ban hoặc hệ thống tổng quát chưa có nhu cầu chứng minh.
- Nghiệm thu mode Tôi không hồi quy; mode Agent thực sự thao tác được bằng quyền ủy nhiệm có phạm vi, private director–PM không lộ cho worker; spoof/revoke/đổi yêu cầu/mất kết nối/reload được xử lý đúng. Không suy ra CLI đang tiếp tục chạy chỉ vì phòng được lưu. Đủ là hành trình chạy được và có evidence, không phải tối ưu tuyệt đối.
- Đánh giá so với dùng coding CLI trực tiếp trên cùng task/đầu vào/acceptance khi có quyền thực hiện phép thử: kết quả, số lần/thời gian giám đốc can thiệp, thời gian và tổng usage/cost cả PM+worker+review+retry. Trước đó dùng fixture xác định để test sản phẩm; ghi rõ chưa đo model/billing thực, không lấy số giảm payload94–96% làm bằng chứng cho cả hệ thống. Đơn giản hóa phần có overhead mà chưa có lợi ích bù lại.
- Không giới hạn thời gian tổng không gỡ timeout/bộ nhớ từng test/run hoặc giới hạn retry/budget. Nếu nghiệm thu model thật cần quyền chưa được cấp, hoàn tất phần có thể kiểm tra, chuẩn bị phép thử cụ thể rồi nêu đúng giới hạn/quyền còn thiếu; không tự chi tiền, không giả bằng chứng và không để nguyên phần triển khai được chỉ vì phép thử đó chưa được phép.


## Đánh giá hệ thống hiện tại

Đối chiếu src/server.js, src/work.js, src/remote.js, IMPLEMENTATION-STATUS và CONSISTENCY-JOURNEYS trên workspace hiện hành. Hệ thống có phòng họp/MCP, vai trò thường, task nguồn/revision, adapter Claude/agy, workspace riêng, verification và tích hợp một file; remote có lease/generation và artifact chưa kiểm chứng. Slot agent thường không có quyền host/admin. PM mới dùng quyền riêng, tạo task từ mục tiêu/acceptance/grant đã xác thực; không tự tạo DAG/đội nhiều agent. CLI ngoài giữ vòng gọi plan/run/state/verify/integrate/report, backend cưỡng chế và lưu trạng thái; không có scheduler hay model PM tự chạy. Có binary/profile không chứng minh model access.

Chưa đủ vận hành tự chủ: reviewer acceptance chưa có; multi-file integration bị chặn; interrupted phải reconcile và chưa resume phiên; worker không daemon; revoke/cancel remote chưa đầy đủ; ngân sách mới có các kiểm tra tier/metadata, chưa đủ sổ ngân sách định lượng xuyên vòng đời và đối soát billing; filesystem sandbox chưa cách ly secret/network. CI/test hoặc nhãn done tự báo không chứng minh doanh nghiệp tự vận hành. VISION là đích, không là năng lực hiện hành.

## Tổ chức và danh tính

Giám đốc (người dùng) → PM được ủy quyền → các worker/chuyên gia và reviewer. PM là vai trò tổ chức riêng, không cố định tên model. Lưu logical PM ID độc lập process/model session để thay model vẫn giữ quyết định, kế hoạch và evidence. Chỉ một PM active trên một phạm vi dự án; mỗi phiên có credential, generation/lease/expiry và audit riêng. Model thay đổi phải được ghi nhận, không fallback âm thầm.

Không dùng hostKey của giám đốc làm credential PM, không coi tin PM là tin giám đốc. Trong room hiển thị PM riêng và nguồn thao tác là PM. PM không tiêu thụ slot/vai trò worker bắt buộc, không tự thỏa điều kiện đủ agent lúc start. Giám đốc vẫn là owner: pause/revoke/tiếp quản, sửa mục tiêu và thay PM. PM chỉ đọc hội thoại/tài liệu mà ủy quyền cho phép; không mặc nhiên xem tin riêng gửi người khác.

## Hợp đồng quyền PM

PM có thể làm rõ yêu cầu, cập nhật kế hoạch có version, giao việc, điều phối họp và theo dõi bằng chứng. Chạy/verify/tích hợp phải qua API có capability và policy; không qua việc điều khiển trang bằng hostKey hoặc tự gọi executable theo chữ trong chat. Browser là nơi giám sát; backend là nơi cưỡng chế quyền.

Grant phải ghi project/room/workspace, base revision, allowed operations, paths, adapters/models, concurrency, deadline, retry/fix limits, budget và expiry. Chưa có grant thì chỉ đề xuất. PM không tự nâng quyền, thay grant, xóa audit, bổ sung provider/billing, tạo kết nối public, deploy hoặc commit/push. Các hành động đó chỉ thực hiện khi chính sách/ủy quyền của giám đốc đã cho phép rõ ràng; không hỏi lại mỗi task trong phạm vi grant.

Mặc định thiết kế thử nghiệm: một task chạy cùng lúc, tối đa một retry kỹ thuật và hai vòng sửa/review; không tự phát sinh chi tiêu khi budget/cost chưa biết. Đây là đề xuất cho grant mới, chưa phải cấu hình hiện có. Chi phí unknown giữ unknown. Tách budget reserved/used/remaining, hard cap và usage đối soát; lượt gọi PM cũng tính vào budget.

## Vòng vận hành

1. Giám đốc giao mục tiêu; PM tạo brief và acceptance có version, ghi facts/unknowns và phạm vi đã được cấp.
2. PM lập DAG task với dependencies, owner, workspace/base, acceptance, tests và budget. Đổi yêu cầu tạo revision mới; không tự diễn giải tin worker thành quyết định của giám đốc.
3. Scheduler kiểm quyền, dependency, budget reservation và concurrency rồi mới dispatch qua adapter đã xác minh. PM không tự giữ toàn bộ trạng thái trong prompt.
4. Worker báo kết quả → verification → reviewer độc lập → tích hợp → test source tích hợp. Chỉ báo hoàn thành khi có evidence đạt acceptance; không để người viết tự duyệt kết quả của mình.
5. PM xử lý lỗi trong giới hạn retry/fix. Khi cần quyết định vượt grant, báo giám đốc vấn đề, lựa chọn, khuyến nghị và tác động, thay vì chuyển mọi thao tác thường nhật về giám đốc.
6. Lưu checkpoint/event sau mỗi chuyển trạng thái. Restart/mất PM phải chặn tác vụ mới và reconcile tiến trình/lease cũ trước tiếp tục; không khởi chạy trùng. Revoke chặn hành động tương lai ngay, đồng thời hủy/reconcile tác vụ đang chạy theo hợp đồng cancel riêng; không giả rằng thu hồi token đã giết process.

## Lát cắt triển khai đề nghị

A. **PM tham gia điều hành có giới hạn:** danh tính/coordinator slot + grant/revoke + audit; chat giám đốc–PM gắn với cùng task/plan hiện hữu, không tạo kho task mới. API PM riêng có quyền điều hành chọn lọc. Prompt riêng: [pm-operator.vi.md](prompts/pm-operator.vi.md). Phase này không được quảng cáo là công ty tự vận hành.

B. **Một vòng làm việc hoàn chỉnh:** mục tiêu → plan → một task trong workspace riêng → test → independent review → tích hợp một file → báo giám đốc; dispatcher/policy xác định, budget ledger, pause/revoke/checkpoint. Mọi giới hạn của WorkManager hiện tại vẫn được giữ.

C. **Chạy công việc sản phẩm thực:** transaction đa file + reviewer acceptance + revise/reconcile/resume + adapter/runtime PM được chọn và probe trong phép thử được người dùng cho phép. Sau đó mới nghiệm thu web full-stack và mở rộng song song/remote.

Không thực hiện A–C chỉ bằng việc gán role hoặc thêm prompt. Việc viết code UI cần đọc ui-ux-pro-max, cập nhật screen pool/flow/test trước thay đổi theo AGENTS; tài liệu này chưa thay thiết kế UI hiện hành. Không chọn Astra/model khác chỉ theo tên: app cần adapter phù hợp và bằng chứng truy cập/model identity; hiện chưa kiểm một PM runtime cụ thể.

## Nghiệm thu cần có trước khi gọi là tự vận hành

- Giám đốc chỉ giao mục tiêu, duyệt grant/phần cần quyết định; PM hoàn tất task nhỏ có evidence mà không cần thao tác host từng bước.
- Worker hoặc tin giả PM/giám đốc không gọi được API điều hành; PM không vượt project/path/model/budget/operation được cấp; PM không thay quorum worker.
- Test/review fail tạo vòng sửa có giới hạn, không tự nâng done; task nhiều file vẫn chặn cho tới khi integrator hỗ trợ thật.
- Pause/revoke/đổi yêu cầu lúc chạy/restart/mất mạng không dispatch trùng hoặc áp kết quả cũ; có đường giám đốc tiếp quản và bằng chứng process cũ đã dừng khi cần.
- Báo cáo hiển thị requested/actual model, usage/cost unknown, giới hạn và provenance; kiểm tokenizer fixture không thay nghiệm thu chi phí vận hành.
- Đi hết hành trình qua API và browser trên source tích hợp; thử fixture xác định trước, model thật chỉ khi được phép. Không đổi app3000/settings global để thực hiện thử nghiệm.

## Phạm vi đã thực thi

Tôi là mặc định. Agent mode chỉ local, xác nhận mã PM trước worker, credential hash/generation/lease riêng, quyền scoped vào workspace/base/path/test/profile/goal revision và 1–3 run, grant hết hạn. Giám đốc giao mục tiêu và grant một lần; PM thao tác các giai đoạn bằng `bin/pm.js` thay giám đốc bấm host từng bước. Kết quả lấy trạng thái/evidence WorkManager, chỉ integrated mới completed. Pause/revoke/takeover/goal change hủy process qua controller và chặn tác vụ mới; không hứa token revoke đã chứng minh process dừng. Restart/lost cần mời/xác nhận/grant lại, không tự resume; task interrupted giữ chặn. PM không có quyền probe/config/remote/commit/deploy. Review chuyên gia bắt buộc vẫn chặn integrate.

Không có hard cap tiền; mặc định từ chối run cost unknown. Giám đốc có thể cấp rõ unknown cost + run cap, hoặc chọn coding CLI trực tiếp. Bản thân chi phí CLI PM không quan sát được. Đối chứng cùng fixture cho thấy thêm overhead; không có bằng chứng giảm tổng tiền/token hoặc công người dùng so với coding CLI trực tiếp. Không mở rộng scheduler/reviewer/model launcher để đuổi lợi ích chưa chứng minh.

## Kiểm chứng hiệu quả PM — ưu tiên phiên sau

**Đã thực thi phần được phép, 2026-10-22:** [pilot runtime-evidence](evidence/pm-operator/PILOT.vi.md) có hai copy dirty input/hash giống nhau, test lỗi thật/acceptance và ledger offline. Hai lỗi parser giữ chưa sửa cho đối chứng; preflight fail đúng lỗi ở cả hai copy, regression đạt. Sửa overhead state/wait bằng cursor có test; chỉ kết luận transport giảm lặp/chờ, chưa có model/billing/công giám đốc thật. Một cặp direct→PM, cùng model/provider ID/version chưa được chọn/cấp quyền; tối đa4 CLI invocation có phí gồm probe, không phải hard cap tiền. Ngưỡng pilot20% tiền hoặc công giám đốc, metric kia không tăng quá10%, quality tương đương; chưa chạy thì verdict thiếu bằng chứng. Không mở rộng case hoặc paid run khi chưa có quyền/ngân sách rõ.

Yêu cầu trực tiếp mới: “cho phiên sau cần làm nghiêm túc cho case PM chứng minh tiết kiệm hơn coding CLI trực tiếp”. Mục tiêu là tìm và chứng minh hiệu quả thực, không buộc dữ liệu phải kết luận PM thắng. Fixture sum hiện có là control kỹ thuật và bằng chứng overhead, không là case lợi ích. Phiên đang bàn giao chỉ cập nhật tài liệu; chưa chạy benchmark/model mới.

### Case và baseline công bằng

- Kiểm tra nhỏ nhất để chọn công việc thật, trong khả năng sản phẩm hiện có, nơi đang có công điều hành hoặc lỗi cần giảm. Chốt trước ai gặp khó, tại bước nào, ảnh hưởng quan sát được và đầu ra đạt yêu cầu. Không thêm PM/worker/reviewer hoặc làm task khó giả tạo để PM có vẻ cần thiết.
- Lấy coding CLI trực tiếp đã được hướng dẫn đủ mục tiêu, nguồn, acceptance và quyền làm baseline mạnh. Cho baseline dùng chức năng native/context/session có sẵn trong cùng quyền; không buộc nó hỏi người dùng từng tool hoặc cố tình đọc lại toàn repo. So thêm cách direct CLI có test/report chuẩn nếu PM được tính lợi ích từ chúng. Cơ chế scope/audit độc đáo có thể là giá trị riêng, nhưng không tự chứng minh tiết kiệm token/tiền.
- Cùng source/base và trạng thái dirty đầu vào, goal, acceptance/test độc lập, quyền, điều kiện kết thúc và chất lượng đầu ra. Checkout riêng, không để lượt trước cung cấp sẵn đáp án cho lượt sau. Khóa model/profile/version cho đối chứng cùng model; nếu so cấu hình tối ưu thực tế dùng model khác, báo riêng để không gán lợi ích đổi model thành lợi ích điều phối.
- Case đơn giản là đối chứng bất lợi cần giữ. Chọn thêm một vài case đại diện có hành trình thật, không chỉ một ví dụ đẹp; không build hệ thống đa file hoặc vượt capability hiện có để phục vụ benchmark. Khởi đầu bằng pilot nhỏ theo ngân sách được cấp, rồi lặp cặp ở case cần kiểm biến thiên; đổi thứ tự direct/PM giữa các cặp, báo mọi lần fail/retry. Không khẳng định tổng quát từ một lượt hoặc chỉ lấy lượt tốt nhất.

### Số đo và tiêu chí khóa trước khi chạy

- Ghi riêng chất lượng/acceptance, tổng billed cost, input/output/cache/reasoning token nếu client cung cấp, elapsed và **thời gian + số thao tác/quyết định của giám đốc**. Tính đủ direct hoặc PM+worker+review+probe+retry/fix, tool schema/output, việc khởi động/kết nối/xác nhận/grant, test, báo cáo và phục hồi. Không suy tổng billing từ tokenizer local hoặc tổng tool call. Phần không quan sát được ghi unknown, không thay bằng0.
- Báo cả lượt đầu có setup và lượt tái sử dụng hợp lệ; chỉ tính khấu hao khi có số lượt tái sử dụng thực hoặc kịch bản công khai. Chỉ ra điểm hòa vốn nếu có. Ghi thêm chi phí vận hành/bảo trì/lease/reconcile; không quy thời gian ra tiền bằng mức lương tự chọn để ép kết quả thắng.
- Khóa trước tiêu chí chất lượng bắt buộc và mức tiết kiệm đủ có ý nghĩa, ví dụ20% tổng billed cost **hoặc** công giám đốc, rồi báo đúng metric đó. Không gọi là giảm tiền nếu chỉ giảm thao tác; không gọi là giảm token nếu chỉ chuyển token sang PM/reviewer. Ngưỡng này là đề xuất cần chốt theo case/ngân sách trước khi chạy, không được đổi sau khi thấy kết quả. Lợi ích phải đủ vượt biến thiên quan sát được, giữ chất lượng tương đương và không che một mức tăng đáng kể ở metric còn lại.
- Mỗi run có ID, nguồn/model thực, raw usage/cost provenance khi có, quyết định/ngắt của giám đốc, evidence test và outcome. Báo mẫu, độ biến thiên, lỗi, giới hạn và các phần chi phí chưa đo; không xóa lượt thua. Dữ liệu không có bí mật hoặc credential.

### Thực hiện và điểm dừng

Trước hết chuẩn bị case/acceptance, harness đo tối thiểu và baseline, tận dụng script/kho task/run/evidence sẵn có; không tạo thêm hệ thống benchmark tổng quát. Chưa được phép model trả phí: có thể kiểm harness bằng fixture nhưng phải ghi chưa có bằng chứng hiệu quả model; chuẩn bị chính xác CLI/model, số lượt, quyền và ngân sách cần xin. Không hỏi lại các thao tác repo thường nhật đã được giao, cũng không coi yêu cầu bàn giao này là quyền tự chi tiền.

Khi có quyền chạy: làm pilot đối chứng, phân tích chi phí từng phần, sửa đúng overhead quan sát được rồi chạy lại cùng case/acceptance; không thêm kiến trúc theo phỏng đoán. Nếu không tìm được lợi ích bù overhead, đơn giản hóa hoặc bỏ lớp thừa, giữ direct CLI là đường khuyến nghị cho case đó. Đủ là kết luận có bằng chứng về **PM tiết kiệm ở case nào/điều kiện nào, hoặc chưa tiết kiệm và vì sao**, kèm thay đổi cần thiết đã kiểm và giới hạn. Không đặt deadline tổng, vẫn giữ timeout/bộ nhớ/run cap/retry và ngân sách; không tối ưu vô hạn hoặc hứa chắc sẽ chứng minh PM thắng.
