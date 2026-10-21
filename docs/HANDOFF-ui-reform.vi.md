# Bàn giao ưu tiên: cải cách UI

Ngày 2026-10-21. **Cập nhật hiện tại:** UI v2 đã triển khai, kiểm bằng browser source cuối và hai reviewer nội bộ; xem [evidence/ui-v2/ACCEPTANCE.vi.md](evidence/ui-v2/ACCEPTANCE.vi.md). Preview3119 đang chạy; bước tiếp theo là người dùng đánh giá, chưa tự nghiệm thu UX. Các đoạn “chưa sửa UI” dưới đây mô tả các mốc lịch sử.

Yêu cầu ban đầu của người dùng, sau khi xem bản hợp nhất phòng/workspace. **Phiên tiếp theo phải cải cách UI trước khi mở rộng tính năng hoặc tiếp tục backlog model/remote.** Phiên ghi nhận này chỉ sửa bàn giao, chưa sửa giao diện.

## Phản hồi trực tiếp và trạng thái nghiệm thu

Người dùng nhận xét: “các UI vẫn chưa rõ ràng, text thừa khá nhiều, cũng như design không gọn gàng lắm, những cái gom được không gom, những cái cần màu tách biệt màu nền tí thì màu nó bị khớp màu nền, trông tính năng như title không giá trị vậy”. Người dùng yêu cầu phiên sau cải cách lại UI.

**UI hiện tại chưa được người dùng chấp nhận.** Việc nối dữ liệu, test kỹ thuật, luồng browser fixture và các ảnh ở `evidence/consistency/` không chứng minh bố cục, mật độ nội dung hoặc phân cấp thị giác đã đạt yêu cầu. Giữ bằng chứng hành vi đã kiểm, không dùng nó để bác bỏ phản hồi thiết kế này.

## Kết quả cần đạt

- Nhìn vào mỗi view biết ngay nội dung chính, trạng thái và hành động tiếp theo. Các chức năng phải có hình thức rõ là điều khiển hoặc nhóm có ích; tránh trông như tiêu đề/chữ trang trí chìm vào nền.
- Giảm chữ thừa, đoạn giải thích lặp và thông tin kỹ thuật hiện thường trực. Giữ hướng dẫn cần để ra quyết định, điều kiện an toàn và lỗi có cách khôi phục; đưa chi tiết ít dùng vào phần mở rộng hoặc trợ giúp đúng chỗ.
- Gom những nội dung/hành động cùng nhiệm vụ; giảm khối, khoảng trống và đường điều hướng lặp. Không chỉ đổi màu/bo góc trên bố cục cũ rồi coi là cải cách.
- Tạo phân cấp thị giác giữa nền trang, vùng nội dung, nhóm tương tác, tab đang chọn, trạng thái và nút chính. Dùng màu nền/surface, viền và typography có chủ đích; kiểm cả sáng/tối để tránh khối cần nổi bật lại trùng màu nền. Không dùng màu làm tín hiệu duy nhất.
- Bố cục gọn nhưng dễ đọc và thao tác; mật độ phù hợp desktop/mobile, khoảng cách có quy luật, nút/field không bị thu nhỏ đến khó dùng.

## Cách bắt đầu phiên sau

1. Đọc `HANDOFF.md`, tài liệu này, `CONSISTENCY-JOURNEYS.vi.md`, `HANDOFF-consistency.vi.md` và `AGENTS.md`; kiểm tra Git status. Nhiều thay đổi chưa commit, không reset/clean hoặc đè thay đổi không liên quan.
2. Bắt buộc đọc `.agents/skills/ui-ux-pro-max/SKILL.md` và design system hiện có trong `src/ui/app.css`, `workspace.css`, cấu trúc/hành vi/bản dịch tương ứng. Áp dụng truy vấn nhỏ đúng vấn đề. Không mặc định tạo palette/framework/design system mới, không dùng `--force`.
3. Mở bản tích hợp thật, kiểm kê các view Hội thoại/Kế hoạch/Thực hiện/Kết quả và Quản trị, gồm trạng thái có dữ liệu/lỗi. Không chỉ đọc ảnh cũ hoặc xem màn rỗng.
4. Lập danh sách vấn đề cụ thể theo screen ID: phần nào dư/lặp, phần nào nên gom, hành động chính là gì, khối nào thiếu độ tách nền, điều khiển nào giống title. Phân biệt phản hồi người dùng với giả thuyết cần kiểm tra. Ví dụ cần rà soát: stepper và navigation/header có trùng vai trò; thẻ bối cảnh lặp ở các view; phần số liệu/metadata có chiếm chỗ của công việc chính; hàng thao tác và điều kiện task có bị chia nhỏ quá mức. Đây là điểm kiểm tra, chưa phải kết luận mọi phần đều phải bỏ.
5. Cập nhật use case, screen pool/flow và ma trận nghiệm thu trước khi sửa. Chốt phân cấp nội dung và cách gom nhóm trên hành trình đang có; triển khai trực tiếp trong phạm vi đã được yêu cầu, không dừng lại ở đề xuất hoặc yêu cầu duyệt lại cho thay đổi UI có thể hoàn tác.
6. Cải cách các thành phần dùng chung để các view nhất quán. Giữ hợp đồng task ID/revision/nguồn/evidence vừa triển khai; không tạo bảng việc hoặc mục tiêu thứ hai để né khó khăn bố cục.

## Cửa nghiệm thu

- Mỗi view có mục đích và hành động chính nhận biết rõ; nhóm điều khiển, tab đang chọn và trạng thái có phân biệt thị giác đủ rõ trên nền.
- Có đối chiếu trước/sau: những chữ/khối đã bỏ, nội dung đã gom và lý do giữ phần còn lại. Không dùng số lượng chữ giảm làm tiêu chí duy nhất; vẫn phải hiểu được việc cần làm.
- Hành trình Hội thoại → Kế hoạch → Thực hiện → Kết quả giữ cùng dữ liệu và có đường quay về nguồn. Đọc được nhiệm vụ/kết quả chính mà không phải lướt qua nhiều thẻ giải thích hoặc JSON.
- Kiểm Việt/Anh, system/light/dark và 375/768/1280 CSS px; cả dữ liệu thật của fixture và loading/empty/error/blocked/running/completed có liên quan. Kiểm tương phản, bàn phím/focus, không tràn ngang và không lỗi console.
- Browser trên source tích hợp kiểm navigation, draft, validation, nguồn hội thoại và các hành động task/run bị ảnh hưởng. Chạy hồi quy phù hợp với giới hạn bộ nhớ trong HANDOFF. Screenshot là bằng chứng bổ trợ, không thay thế đánh giá hành trình hay sự chấp nhận của người dùng.
- Báo rõ phần đã cải thiện, ca đã kiểm và giới hạn còn lại; không tự tuyên bố “UX đã hoàn chỉnh” chỉ vì test xanh. Chưa commit/push/release khi chưa được yêu cầu.

## Ràng buộc và tài nguyên

Giữ HTML/CSS/JS thuần, Node >=18, không thêm runtime dependency/CDN/font/dịch vụ ngoài; giữ CSP, hai token và ranh giới admin/execution local. Giữ Việt/Anh, theme theo hệ thống và khả năng dùng bàn phím. Không gọi model trả phí hoặc đổi settings global chỉ để sửa UI.

Preview fixture phiên trước: `http://127.0.0.1:3118/m/host_consistency_preview_1234`, có thể không còn chạy. `node tools/consistency-preview.js` tạo dữ liệu temp mới và in source path; adapter là tiến trình Node xác định, không phải model thật. Không đụng app người dùng ở cổng 3000. UI assets nạp khi server khởi động, nên restart đúng preview sau sửa.

## Bản triển khai tiếp theo — 2026-10-21

Đã triển khai cải cách cấu trúc sau baseline ở trên; **vẫn chờ người dùng đánh giá**. Screen pool/flow đích viết trước code: [UI-REFORM.vi.md](UI-REFORM.vi.md). Đối chiếu trước/sau, ca browser, hồi quy và giới hạn: [evidence/ui-reform/ACCEPTANCE.vi.md](evidence/ui-reform/ACCEPTANCE.vi.md). Preview cô lập cổng 3119, dữ liệu fixture `/tmp/am-ui-reform-preview`; không dùng model thật. Không commit/push, không sửa cổng 3000 hoặc settings global.

## Phản hồi bác bỏ bản cải cách — 2026-10-21

Người dùng bác bỏ bản vừa triển khai: text/box quá to, thiếu nhất quán, header quá nhiều button, Hội thoại có ba header. Không tiếp tục xem UI-REFORM v1 là đích đã chốt. Đã lập [UI-REFORM-v2-plan.vi.md](UI-REFORM-v2-plan.vi.md) với số đo browser, inventory, wireframe, scale chung và cửa nghiệm thu; hai subagent nội bộ review read-only. Lượt này chỉ planning, **chưa sửa source UI theo v2**. Ưu tiên tiếp theo shell/Hội thoại và token chung theo kế hoạch mới, không vá tiếp bằng override.

## Bàn giao v2 chạy được

Đã hoàn thành shell/Hội thoại trước, rồi token/component, Plan/Execute/Results/Admin. Giữ UI thuần/CSP/data contracts; utility đầy đủ và keyboard/sheet/nested modal đã retest. Task Plan122px desktop với5 task dài; feed495px thay272px ở609px cao. Root kiểm hành trình lỗi/khôi phục thực qua fixture Node, locale/theme/width/zoom200% thật; hai agent review độc lập đã đóng phát hiện. Chi tiết và giới hạn trong evidence/ui-v2, không dùng số test/ảnh để tuyên bố người dùng chấp nhận. Giữ preview transient service3119, không commit/push. Ưu tiên tiếp: nhận phản hồi thiết kế trên bản chạy.

## Thử họp thực sau UI v2: phát hiện ENDED chưa đạt

2026-10-21: người dùng yêu cầu thử nhẹ một cuộc thảo luận logic annotator tracking. Đã thực hiện trên bản cài local qua phòng3120 với hai subagent Codex thật,9 tin/2:06,3 việc nghiên cứu, không code/CLI trả phí. **Phát hiện chưa sửa:** ENDED với3 task dài làm endcard642px và feed chỉ24px ở viewport608px; source link đúng nhưng hội thoại không đọc được. Ưu tiên cải cách cấu trúc ENDED/WORK, bỏ nội dung task/conclusion lặp chiếm vùng chat. Bằng chứng và giới hạn: [evidence/annotator-discussion/OBSERVATIONS.vi.md](evidence/annotator-discussion/OBSERVATIONS.vi.md). Lượt này chỉ test để người dùng nhận xét; không tự sửa source UI. Preview3120 giữ bằng transient user service `agent-meeting-annotator-discussion.service`.


## Cập nhật showcase và sửa WORK/ENDED — 2026-10-21

Đã xử lý lỗi ENDED mô tả ở trên: bỏ bảng task/kết luận lặp ở footer, giữ trạng thái + số việc tự báo + link Plan; metadata, tải/copy biên bản và carry/new trong disclosure giới hạn vùng cuộn. Sidebar vẫn giữ note/status/evidence. Với fixture ba task dài, feed370–423px tại viewport608px cao, thay vì24px trong ca lỗi cũ; hai fixture khác nhau nên không coi là benchmark matched. Independent browser36 ca + Back/reload/source/carry/download/keyboard, zoom200% thật đạt; xem [SHOWCASE.md](SHOWCASE.md). Đây là sửa có kiểm chứng hành vi, chưa thay người dùng nghiệm thu thiết kế.
