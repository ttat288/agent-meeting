# Bản cải cách UI để người dùng xem — 2026-10-21

**Trạng thái: đã triển khai, chạy được; chưa được người dùng nghiệm thu UX.** Đọc [screen pool/flow và tiêu chí viết trước code](../../UI-REFORM.vi.md). Giữ hợp đồng ID/nguồn/revision trong CONSISTENCY-JOURNEYS.vi.md.

## Xem và chạy lại

Preview local: [Kế hoạch](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#plan), [Kết quả](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#results). Dữ liệu disposable `/tmp/am-ui-reform-preview`. Preview được giữ chạy độc lập, log tại `/tmp/am-ui-reform-preview/server.log`. Không dùng app cổng 3000. Khi cần khởi động lại, xác định đúng process preview trước; không khởi động hai server cùng cổng:

```bash
AM_PREVIEW_ROOT=/tmp/am-ui-reform-preview AM_PREVIEW_PORT=3119 \
AM_PREVIEW_SCENARIOS=1 AM_PREVIEW_DELAY_MS=12000 node tools/consistency-preview.js
```

Runner là Node subprocess xác định, sửa `sum.js` trong bản sao được bwrap giới hạn ghi. Probe cũng dùng fixture, không gọi Claude/model thật. Hai phòng phụ `host_ui_empty_preview_1234` và `host_ui_errors_preview_1234` dùng kiểm rỗng và lỗi/khôi phục. Env mới của launcher chỉ dành công cụ preview; không thay API ứng dụng.

## Trước / sau

| Trước quan sát trong browser | Bản triển khai | Lý do giữ/bỏ |
|---|---|---|
| Stepper chuẩn bị/họp + shortcut Kế hoạch + navigation phiên đồng thời | Một navigation bốn view; bước bối cảnh/mời chỉ trong chuẩn bị; Quản trị/theme/ngôn ngữ là tiện ích header | Một hệ điều hướng cho công việc, vẫn truy cập chức năng phòng tại Hội thoại |
| Bối cảnh lớn và đoạn giải thích lặp ở đầu cả ba view; Kết quả thêm thẻ metrics trước task | Heading theo mục đích, task/kết quả đứng đầu; bối cảnh và số liệu là disclosure cuối | Dữ liệu quyết định hiện trước hướng dẫn và metadata |
| UUID, revision, base, profile/model và self-report thường trực | Tên việc + owner + trạng thái + link nguồn; ID, nguồn snapshot, cấu hình đầy đủ mở khi cần | Giữ truy vết nhưng không buộc đọc thông tin kỹ thuật để hành động |
| Form yêu cầu dài một cột; điều kiện/routing/run chia thành nhiều hàng | Mục đích/vị trí/quản lý cùng nhóm; checkout/scope/test hai cột desktop; phụ thuộc/facts/unknowns mở rộng; profile và Run chung vùng | Giảm quãng tìm kiếm, giữ nhãn và draft; lưu không dispatch |
| Mọi run mở ngang cấp, UUID là heading; verify có cùng sức nặng với tải JSON | Lần gần nhất mở; lịch sử đóng; báo cáo, tệp thay đổi, test và trạng thái đọc trực tiếp; một hành động kiểm chứng/tích hợp/thử lại phù hợp | Không nâng report thành accepted; log test đọc riêng, vẫn tải artifact và full snapshot được |
| Các nhóm Quản trị dùng một heading chung, form năng lực dài trước Lưu | Heading theo nhóm, lựa chọn có nền rõ; gom năng lực/thế mạnh/hạn chế vào disclosure | Giữ điều kiện bật model, provenance, CAS và cảnh báo probe có phí |
| Tab/surface/điều khiển cùng tông, một số giống tiêu đề | Tab chọn có nền đặc + viền + chữ; disclosure có marker/biên; input có nền/viền; status có nhãn ngoài màu | Dùng token sẵn có, không thêm palette/framework/CDN hoặc đổi CSP |

Ảnh baseline: [Kết quả](before-results.png), [Quản trị](before-admin.png). Source cuối: [Kết quả desktop](after-results-desktop.png), [Kết quả mobile](after-results-mobile.png), [form kế hoạch](after-plan-form.png), [Hội thoại](after-conversation-desktop-dark.png), [Quản trị](after-admin-desktop-dark.png). Ảnh minh họa phân cấp, không thay thế kiểm hành trình.

## Kiểm hành trình và dữ liệu

| Ca | Thao tác, bằng chứng | Kết quả |
|---|---|---|
| R01 phân cấp/navigation | Mở năm view có task/run/catalog; một nav phiên; kiểm heading/selected tab trước đo | Đạt phần triển khai; chờ đánh giá người dùng về dễ hiểu/mật độ |
| R02 draft/validation/ID | Xóa acceptance → Lưu; error focus + aria-invalid; nhập nháp, đổi view/Back/reload còn; lưu đúng task; chưa chọn profile → lỗi và focus | Đạt. UUID `meeting-9aa059ea45cd030c4f4e6f641e085ba0` giữ qua mọi view; không tạo task mới khi chuyển view |
| R03 report/verify/integrate | Browser chọn profile, chạy Node thật → reported → test độc lập → verified → integrate; chạy test riêng trên source tích hợp | Đạt; task done, self-report vẫn todo; [state/evidence](journey-state.json) |
| R04 nguồn và bàn phím | Link nguồn về `#message-1`, đúng kết luận/VIỆC; Tab có outline; Enter/Space mở evidence/test; Ctrl+Enter gửi tin vào fixture | Đạt thao tác đã thử. Không phải chứng nhận toàn bộ accessibility |
| R05 lỗi/khôi phục | Thiếu acceptance/profile; kết quả cũ có cảnh báo; running chặn Run lặp, hủy → cancelled → chạy lại; test cố ý 5≠6 → failed, 0/1, không có Integrate; sửa fixture rồi thử lại | [Test fail và log mở bằng bàn phím](failed-test-evidence.png); giữ lịch sử. Kết quả phục hồi cuối ghi trong recovery-state.json |
| R06 kết nối/rỗng/loading | Dừng đúng preview → Làm mới báo lỗi, dữ liệu còn; bật lại → Làm mới thành công; phòng phụ rỗng có đường về Hội thoại; form brief → mời vẫn dùng được | Đạt ca đại diện. Lỗi mạng cố ý không tính là lỗi console ứng dụng |
| R07 ma trận layout/navigation | 5 view × VI/EN × system/light/dark × 375/768/1280 CSS px | 90 ca [source cuối](browser-final-matrix.json), chờ đúng heading rồi mới đo; không tràn document/panel đã kiểm; admin quay về Results |
| R08 hồi quy | 22 file test chạy lần lượt, từng file `MemoryMax=1200M MemorySwapMax=0 timeout 150`, Node test timeout 30s | 231/231 test; [tổng hợp](tests-summary.json), log từng file giữ local tại `tests/*.log`. i18n/consistency chạy lại sau thay đổi cuối; syntax và diff whitespace qua |

Console sạch sau nạp source cuối: [browser-console.json](browser-console.json). CSP và backend không sửa trong lát cắt này. [Token từ browser](theme-colors.json) và [tỷ lệ đo](contrast.json): chữ chính 14.77–17.74, chữ phụ 9.86–11.20, chữ nút chính 6.29–7.14, link 6.29–6.53, biên input 4.83–5.76. Đây là các cặp token chính, không phải audit WCAG toàn sản phẩm. System đã xác nhận theo môi trường hiện tại đang tối; theme sáng kiểm riêng.

## Giới hạn và điều còn cần đánh giá

- 90 ca là kiểm layout/navigation có dữ liệu, không phải chạy 90 lần toàn bộ execution. Lỗi/empty/loading/running/failed/completed được thử ở các ca đại diện, không phủ tích Descartes mọi trạng thái.
- Không gọi model trả phí, không thử đội agent thật hoặc worker khác máy trong phiên này. Không dùng fixture để chứng minh chất lượng model/remote hoặc đội tự xây sản phẩm.
- Chưa thử Safari/iOS, screen reader, 200% text zoom, forced colors hoặc toàn bộ tổ hợp bàn phím trong các drawer/modal cũ; không tuyên bố accessibility toàn diện.
- Source stale, config conflict, persistence/carry có hồi quy backend; browser kiểm cảnh báo run revision cũ nhưng chưa lặp toàn bộ conflict/rebase/remote trên giao diện. Hạn chế reconcile/review đa file hiện có vẫn giữ.
- Snapshot/JSON, routing recommendation và dữ liệu chuyên sâu vẫn cần phần mở rộng; đây là lựa chọn có chủ đích. UI mời agent và thông tin giao thức gốc vẫn tương đối dài, ngoài trọng tâm năm view của lát cắt này.
- Browser đôi lúc timeout/đọc khung hình cũ; ma trận cuối kiểm đúng heading và lưu từng nhóm. Preview tool session đã được thay bằng tiến trình detached để bản xem còn chạy sau bàn giao.
- Người dùng cần xem bản chạy và nhận xét mục đích view, mật độ, nhóm điều khiển, khả năng tìm hành động. Không lấy test xanh hoặc ảnh làm thay cho sự chấp nhận đó. Chưa commit/push/release; giữ nguyên thay đổi không liên quan trong working tree.

Dấu vân tay source đã kiểm: [source-hashes.txt](source-hashes.txt). Ca phục hồi cuối: task `meeting-18965fb09662660dbeb5c24ee98e44f1` có chuỗi cancelled → failed → integrated; test độc lập trên checkout nguồn cũng đạt.
