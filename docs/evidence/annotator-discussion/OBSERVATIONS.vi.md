# Thử họp thật: logic hỗ trợ annotator tracking

2026-10-21. Theo yêu cầu người dùng: test nhẹ bằng cuộc thảo luận thực để xem thao tác UI, chưa xây tool. Source ứng dụng lấy từ bản đã cài `/home/theo/.local/share/agent-meeting`, chạy phòng riêng3120; không thay đổi/stop phiên app3000. Service tạm `agent-meeting-annotator-discussion.service`, dữ liệu `/tmp/am-annotator-discussion`. [Kế hoạch](http://127.0.0.1:3120/m/host_annotator_logic_20261021?lang=vi#plan), [kết luận nguồn](http://127.0.0.1:3120/m/host_annotator_logic_20261021?lang=vi#message-15).

Hai subagent Codex nội bộ kế thừa model phiên, không có ID model riêng do tool cung cấp: `/root/annotator_workflow` (Minh - Workflow) và `/root/annotator_quality` (Lan - Quality). Đây là phản hồi suy luận của hai agent thật, không phải demo-bots/kịch bản. Không gọi Claude/Gemini/CLI trả phí. Lookup routing rev1 no-candidate; root chọn internal theo yêu cầu thử họp. Không writer, không sửa code, không dispatch task execution.

Đã nhập brief và điều kiện kết thúc bằng UI, duyệt từng agent với mã5144/9685, giao vai trò qua modal, Start, gửi ca confidence0,98/frame5 đổi hướng, yêu cầu vòng đầu rà đủ frame2–10; mở Tùy chọn, thu Chi tiết, dùng Gợi ý→Yêu cầu chốt. Hai agent tranh luận9 tin trong2:06, kết luận tạo3 VIỆC nghiên cứu. Mở Plan xác nhận3 task, link nguồn quay đúng#message-15. Tất cả task planned/revision1, không có run hoặc bằng chứng hoàn thành giả. [Biên bản](minutes.json), [ID/nguồn](task-links.json), [ảnh Kế hoạch](plan.jpg).

Thiết lập ban đầu của launcher dev không chỉ định admit nên createApp dùng none; đã dừng/đổi phòng disposable trước LIVE, cấu hình admit=all như launcher CLI và cho hai agent join/duyệt lại. Phòng ban đầu không tham gia cuộc tranh luận; không nới quyền ở app người dùng. Một agent parse nhầm response join là JSON, tạo tên thứ hai trong phòng nháp; phòng chính chỉ có đúng2 identity đã duyệt.

## Logic được đề xuất, chưa kiểm nghiệm bằng video

- Người xác nhận cùng keypoint/ID tại frame1 và10; khóa mốc đã duyệt, giữ riêng nội suy/prelabel/điểm người sửa và visibility/ID.
- Pilot rà đầy đủ2–9 và xem lại10. Nếu5 sai thì người sửa thành keyframe, tính/kiểm lại1–5 và5–10. Prelabel sai nhưng nội suy đúng không tự thêm mốc theo prelabel.
- Chỉ sau khi đoạn đã được người duyệt và không có cờ che khuất/đổi hướng/ID mới thử endpoint15; duyệt15 và rà11–14. Confidence0,98 không chứng minh cả đoạn đúng.
- Sau pilot mới thử kiểm rủi ro + mẫu ngẫu nhiên ở nhóm ít rủi ro, có người kiểm ảnh trước khi bật gợi ý để bắt prelabel/nội suy cùng sai. Đo sai số tới điểm người xác nhận, lưu pixel + chuẩn hóa kích thước khi đáng tin; ID/visibility báo riêng. Ngưỡng/tỷ lệ mẫu/bước tăng còn unknown.
- Ba việc nghiên cứu: xác minh CVAT thực; chuẩn bị clip và nhãn tham chiếu; đánh giá lỗi bỏ sót/thời gian. Chưa thực hiện chúng.

Cơ sở CVAT chỉ được đối chiếu tài liệu primary về [interpolation](https://docs.cvat.ai/docs/manual/basics/vocabulary/) và [single-point track](https://docs.cvat.ai/docs/manual/advanced/annotation-with-points/liner-interpolation-with-one-point/). Chưa mở CVAT/video hoặc thử khả năng khóa mốc/prelabel integration; phần đó là việc nghiên cứu tiếp.

## Phát hiện UX chưa sửa

**P1: trạng thái ENDED bị khối tổng kết chiếm hết timeline.** Khi source link quay về kết luận có3 task tên/owner/hạn dài, DOM đo ở viewport cao608 CSS px: room556,19px, endcard642,26px, feed23,99px. [Ảnh thực](ended-overflow.jpg). Link về đúng message15 về mặt dữ liệu nhưng gần như không đọc được hội thoại. Khối tổng kết lặp task table và toàn bộ conclusion vốn đã có trong timeline/Plan. Đây là lỗi thiết kế thực tế mà matrix trước chủ yếu dùng LIVE/short fixture không phát hiện. Chưa sửa trong lượt user yêu cầu chỉ test/góp ý. Ưu tiên sửa cấu trúc ENDED/WORK theo state, không chỉ vá height/font.

Quan sát phụ: sau Lưu vai trò, danh sách thành viên rerender làm opener cũ mất; focus rơi về Tùy chọn. Chưa cô lập repro/độ nghiêm trọng nên ghi observation, không coi đã audit. Setup invite còn rất nhiều chữ, và URL vẫn#moi-agent sau LIVE cho tới khi đổi nav; để người dùng nhận xét thêm.

Bản chạy/tabs giữ để người dùng xem. Không tuyên bố UX được nghiệm thu, không chạy suite nặng, không commit/push hoặc thay settings global.
