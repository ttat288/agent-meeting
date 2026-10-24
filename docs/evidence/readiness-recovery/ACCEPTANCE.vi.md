# Readiness / phục hồi — kết quả local 2026-10-23

Người vận hành retry task bị chặn bởi quan sát model thiếu/hết hạn, thông báo chung trước đây không dẫn tới thao tác phục hồi tại task. Đã phân biệt `MODEL_ACCESS_REQUIRED` với `ROUTING_REJECTED`; UI giữ profile/task và cho explicit probe có cảnh báo gọi CLI thật, rồi explicit Run. Không tự probe/dispatch. Giữ revision guards; probe thất bại/stale không báo sẵn sàng. Thông báo thành công cũ được xóa nếu lại hết hạn.

## Bằng chứng và phạm vi

- Base tích hợp main `1b56f4db04d4135a66fcc329af89332eb21b9d3f`; mã mới vẫn local. HEAD được cập nhật fast-forward từ f8a0b52 tới merge main đã có sẵn, không tạo commit merge mới. Đây là thao tác Git cập nhật checkout đã thực hiện dù lệnh yêu cầu không merge; không lặp lại quyền này. Không commit/push/release, model trả phí, thêm agent, OAuth/settings global.
- Regression source cuối: **473/473**, 42 file, 0 fail/cancel/skip, Node22.22.1; [log](full-test.txt), [verification](verification.json), [hashes](source-freeze.json). Cgroup1200M, swap0; Node18/20 và CI mới chưa chạy.
- [Baseline API](baseline-api.json) và [API cuối](current-api-final.json): cùng CSV/goal/8acceptance, input/output hashes khớp, tests bất biến. Fail → backdate quan sát → block → failed probe → block → restart → successful probe → explicit retry → verify → integrate → 8/8 test trên source tích hợp. Task/reqv2/evidence liên tục; không configure lại sau save đầu. Baseline API vốn có thể gọi explicit probe; lợi ích mới nằm ở đường UI.
- Red: [backend](red-work.txt) 6 test mới fail trên base; [UI](red-ui.txt) 11/12 fail trên base. [Green UI cuối](green-ui.txt) 13/13. Test VM/fake DOM chứng minh state/guards, không thay browser end-to-end.
- Browser trước hai chỉnh cuối (nhãn pending và xóa success cũ): [baseline](baseline-blocked.png), [hiện tại](current-blocked.png), [EN mobile](current-mobile-en.png), [VI mobile](current-mobile-vi.png), [12 geometry cases](geometry.json). EN/VI, light/dark,375/768/1280 không overflow ngang. [Ca lỗi/focus](browser-checks.json) ghi probe pending/failed, navigation giữ focus/draft, success và lỗi success cũ được tái hiện trước sửa. **Chưa lặp lại toàn browser trên source cuối và chưa hoàn tất browser verify→integrate trong lượt nối lại**; API cuối đã integrated. Không nhận ảnh cũ là ảnh source cuối.

## So sánh và overhead

- Self-review browser cùng task, sau failed Run: baseline 7 thao tác (Options→Admin→Agents & runtimes→probe→Return→chọn lại profile→Run), luồng mới 2 thao tác (probe→Run). Không tính lựa chọn ban đầu/failed Run chung. Đây là đếm thao tác bởi PM, chưa đo thời gian người dùng thật.
- Direct deterministic Node fixture cuối 894ms; managed 1613ms; baseline managed 1409ms. Một mẫu direct-first, timer scope khác; không kết luận tốc độ/billing. Direct 0 probe, managed3probe/2attempt; cả hai0manual diagnostic transfer. Managed có overhead. Prompt1263→3060byte do retry diagnostics; không quy byte thành token/tiền. Không thêm dependency.
- Native coding CLI/model A/B, chất lượng model, token/chi phí tổng (kể cả công phát triển), human UX acceptance và lợi ích ròng chưa chứng minh. Script tự lái API không là sản phẩm tự vận hành.

## Thất bại, giới hạn, thời gian

Reset môi trường làm mất /tmp/preview/raw receipts đầu; API/full checks được chạy lại và lưu trong repo. Lỗi harness selector/viewport/writer không được tính là lỗi sản phẩm. Lỗi sản phẩm success cũ sau lần hết hạn tiếp theo đã tái hiện và sửa bằng regression13th. Probe network error hiện quay về lỗi chung; người dùng có thể Run lại để hiện recovery, chưa tối ưu đường này. Reload vẫn cần chọn profile lại (Map trong bộ nhớ), không tuyên bố persistence mới. Không test mọi crash/remote/multifile.

TTL ở ca này là backdate31phút; quan sát thật đã qua hạn ở đoạn đầu nhưng thiếu post-expiry receipt sau reset, **chưa chứng minh real wall-clock30phút**.

T0 13:30:48 +07; đoạn đầu quan sát tới khoảng14:11, không có timestamp đóng chính xác. Sau gián đoạn/reset,30phút bổ sung tính từ20:32:45, deadline21:02:45. Đóng bằng chứng lúc **21:11:13 +07**: lượt bổ sung thực **38phút28giây**, vượt deadline **8phút28giây** gồm chạy kiểm cuối/chốt bàn giao. Đây là vượt timebox cần ghi nhận; không tính khoảng gián đoạn thành giờ làm, không tuyên bố90phút liên tục. Không mở rộng tiếp.

Bước tiếp đề xuất: PM ở phiên được giao tiếp theo chạy một browser flow trên hash cuối (repeated expiry→probe→Run→verify→integrate, Back/reload), trước mọi mở rộng; giám đốc chưa cần cấp quyền model/publish. Phiên này đã dừng, không tự mở timebox mới.
