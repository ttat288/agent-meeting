# UI v2 — bản chạy để đánh giá

2026-10-21. **Đã triển khai và kiểm chứng kỹ thuật; chờ người dùng đánh giá UX.** Bản v1 bị bác bỏ vẫn là baseline lịch sử. Kế hoạch và screen pool: [UI-REFORM-v2-plan](../../UI-REFORM-v2-plan.vi.md), hợp đồng task/source/revision: [CONSISTENCY-JOURNEYS](../../CONSISTENCY-JOURNEYS.vi.md).

## Bản xem

[Hội thoại](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#conversation) · [Kế hoạch](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#plan) · [Thực hiện](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#execute) · [Kết quả](http://127.0.0.1:3119/m/host_consistency_preview_1234?lang=vi#results) · [Quản trị](http://127.0.0.1:3119/m/host_consistency_preview_1234/admin?view=results&lang=vi).

Preview process được kiểm cwd/source trước khi tái sử dụng3119. Hiện giữ chạy bằng **transient user service** `agent-meeting-ui-v2-preview.service`, working directory repo hiện tại, MemoryMax1200M/MemorySwapMax0. Không cài service lâu dài hoặc sửa file settings toàn cục; không đụng ứng dụng3000. Xem process/log: `systemctl --user status agent-meeting-ui-v2-preview.service`, `journalctl --user -u agent-meeting-ui-v2-preview.service`. Khi cần dừng: `systemctl --user stop agent-meeting-ui-v2-preview.service`. Restart đúng unit sau khi sửa assets (server nạp lúc khởi động).

Dữ liệu disposable ở `/tmp/am-ui-reform-preview`; có5 task Việt/Anh với tên và owner dài, transcript dài hơn25 tin. Hai task có kết quả đã tích hợp, các task còn lại chưa cấu hình. Runner là Node subprocess fixture được inject bởi `tools/consistency-preview.js`, sửa `sum.js` trong workspace được giới hạn ghi, **không gọi model AI trả phí**. Probe trong hành trình cũng đi qua runner fixture này; label profile `opus-claude` không phải bằng chứng đã chạy Claude. Source kiểm thử mới `/tmp/am-ui-reform-preview/v2-source`, không phải source sản phẩm.

## Cấu trúc và trước/sau

| Mục | Baseline v1 | Bản v2 |
|---|---|---|
| Chrome trước timeline1341×609 | Header69 + nav62 + heading69 ≈200px | Một shell52px, nav nằm bên trong; h1 Hội thoại chỉ giữ ngữ nghĩa |
| Timeline cùng viewport |272px (45%) |495px (81%) |
| Composer idle desktop |113px |62px; recipient/input/Send/Gợi ý một hàng |
| Mobile375×640 | Không dùng số v1 làm đối chiếu nếu khác state | Shell hai hàng89px, composer61px, timeline490px |
| Header utility | Admin/lang/theme/invite/minutes/end thường trực | Chi tiết + Tùy chọn; status/kết nối là thông tin |
| Task Plan dài, checkpoint đầu trong lượt này |183px/hàng, task đầu291px |122px/hàng ở1280×800; đủ5 task trên màn hình |
| Typography | Task20, page28, Admin tới34; nhiều override | Page20/28, section/task16/22, UI14/20, reading15/22, meta13/18; control36 desktop/44 mobile |
| Task/form/evidence | Card lồng, metadata/disclosure chia nhiều dải | Một outer task surface; footer cùng hàng, divider và form inline; tên/state/action trước metadata |
| Execute | Khối profile/Run disabled khi running/có report; lời dẫn lặp | Run khi sẵn sàng, Cancel khi chạy, Results khi có report; trợ giúp/nguồn cùng footer |
| Results | Report cắt600 ký tự, full report nằm sâu trong evidence | Full report trực tiếp, tệp/test/action theo state; lịch sử/snapshot mở rộng; count đúng task có run |
| Admin | Scale riêng, model list nhiều box | Cùng token; sidebar/model là selectable text rows, editor một surface; giữ provenance/CAS/probe warning |

[Ảnh trước](before-conversation.png), [Hội thoại desktop](after-conversation-1280.png), [mobile](after-conversation-375.png), [Kế hoạch5 task](after-plan-1280.png), [Kết quả](after-results-1280.png), [Quản trị](after-admin-1280.png), [viewport thấp/tối](after-low-desktop-dark.png), [zoom200%](zoom200-plan.png). Root đã xem trực tiếp các ảnh trước khi bàn giao. Baseline screenshot chụp dữ liệu cũ1 task; dữ liệu stress5 task được thêm trước checkpoint shell. Số chrome/feed so cùng viewport và LIVE/composer idle; đây không phải nghiên cứu người dùng với bộ dữ liệu matched.

Các định nghĩa gốc được refactor, không nối lớp v2 override cuối CSS. Scale và spacing/control token nằm trong app.css; workspace.css dùng lại cho các view và Admin. Màu nền/palette giữ, riêng token xám sáng chỉnh `#6b7280`→`#626c7a` sau khi đo tương phản chữ phụ/nền trang chỉ4,47:1; bản cuối4,92:1. Timestamp hệ thống bỏ opacity làm mờ chữ. Không thêm font/framework/dependency/CDN, không đổi server/CSP/API trong lượt này.

## Inventory và bàn phím

- Tùy chọn → Phiên: Mời agent, Biên bản; Ứng dụng: Quản trị; Hiển thị: EN/VI + system/light/dark; Kết thúc nhóm cuối, còn confirm và state gate LIVE/WORK/ENDED/LOBBY.
- Chi tiết giữ thành viên, role/kick/admission, agenda/Next, quyết định, task/source/execution link, tiến độ tự báo, ghi chú/gộp/xóa, tệp và bối cảnh. Task progress ít dùng mở bằng native summary. Desktop collapse tại chỗ; mobile sheet có dialog name, inert nền, trap/return focus.
- Gợi ý giữ đủ5 hành động **gửi ngay** cùng recipient đã chọn. Kiểm payload bằng request interception (không gửi tin thử thật vào phòng).
- Root kiểm Enter/Space/Tab/Shift+Tab/Escape, click ngoài, menu→Invite, menu→End→Cancel; sheet→note modal→Escape→Escape; resize giữ focus composer. Native summary được tính đúng trong trap, control trong details đóng bị loại.

## Hành trình và phục hồi đã thực thi

[Journey evidence](journey.json) ghi task `meeting-e6fd48c1410a83d882fc3b541496d8f8`, requirementRevision1→2, cùng UUID/source xuyên các view:

1. Plan thiếu acceptance → inline error + aria-invalid/focus; nhập draft → Execute → Back → reload → Admin return vẫn giữ draft.
2. Lưu cấu hình trên task có sẵn, không tạo task/run mới; Execute thiếu profile báo lỗi và giữ task.
3. Chọn profile fixture, chạy → running/Cancel → cancelled; chạy lại → reported; test cố ý sai5≠6 → failed, không có Integrate. [Ảnh lỗi](failed-test.png).
4. Sửa **tệp test fixture** rồi chạy lại → reported → verified → integrated. Test độc lập trên checkout fixture nguồn cũng đạt. Task done nhưng Meeting self-report vẫn todo. [Ảnh phục hồi](recovery-integrated.png).
5. Link nguồn đưa về `#message-N`, mở đúng Hội thoại/nav. Browser refresh mạng lỗi giữ5 task; bỏ lỗi rồi Refresh phục hồi. Các stale/source-revision/carry/security guards còn qua hồi quy backend; không tự đổi kết quả cũ thành accepted.

[Kiểm keyboard/network/theme](accessibility-recovery.json): system thực sự theo cả light/dark media; reduced-motion; full report2240 ký tự render đủ bằng response fixture, không cắt/height cap. Không dùng fixture report này để khẳng định có báo cáo model thật dài.

## Kiểm source cuối

[Ma trận cuối](matrix.json): năm view × VI/EN × system/light/dark ×375/768/1280. Chờ đúng view/task/report cần đọc trước khi đo; không tràn document trong các ca ghi lại. [Console](console.json) không có pageerror/console error trong matrix bình thường. Lỗi mạng cố ý ở bài recovery là ca riêng. Đo low-height1341/1280×609 và375×640 có transcript dài.

[Zoom](zoom200.json): **browser zoom thật2.0**, xác nhận bằng `chrome.tabs.getZoom`, không dùng CSS zoom/pinch/device-scale giả zoom. Extension local tạm trong profile Brave riêng `/tmp/am-v2-zoom-profile`; viewport vật lý1280×800 cho CSS viewport640×400, visualViewport.scale1/devicePixelRatio2. Cả5 view × VI/EN không tràn ngang, nhãn/nav còn đủ, menu dùng được. Không cài extension vào browser/profile của người dùng.

[Contrast](contrast.json): các cặp token chữ chính/phụ/link/action/status đã đo sáng/tối ≥4,92:1; không coi đây là audit toàn bộ mọi tổ hợp/screen reader. Hai reviewer đo computed roles độc lập; root matrix xác nhận các view dùng page20/task16/control36 và mobile44.

Hồi quy35 test thuộc5 file: i18n, consistency, server, work-server, remote-server; chạy **từng file** bằng `systemd-run --user --scope -q -p MemoryMax=1200M -p MemorySwapMax=0 timeout 150 node --test --test-timeout=30000 <file>`. [Tổng hợp](tests-summary.json), log từng file tại thư mục này. Syntax3 file JS và `git diff --check` qua. Không chạy npm test không giới hạn hoặc toàn suite không cần thiết cho UI. Script browser lưu tại [checks](checks/); journey-single-use là bản ghi script một lần cho trạng thái fixture trước lượt này, không chạy lặp lên dữ liệu đã done. Runtime Playwright/Brave là công cụ dev có sẵn, không là dependency ứng dụng.

[Hai vòng review và closure](REVIEW.vi.md), [hash source đã kiểm](source-hashes.txt), [6 asset HTTP khớp byte với source cuối](served-source.json). Bổ sung [admin-empty](admin-empty.json): cả5 nhóm Admin ở375/1280 EN không tràn; empty Plan và brief draft qua reload đã kiểm. A `/root/structure_review` và B `/root/system_review` đều là subagent Codex nội bộ kế thừa model phiên; tool không trả ID model riêng, không gán nhãn Claude/Gemini. Root tự kiểm nguồn/hành trình sau khi xử lý phát hiện.

## Giới hạn và bước tiếp

- Chưa có người dùng nghiệm thu mật độ/hierarchy/tìm hành động. Mời đánh giá trực tiếp preview; không mở rộng backlog model/remote trước phản hồi.
- Một số literal typography cũ cho code/JSON/SHA và heading setup còn được giữ; các vai trò sản phẩm chính của5 view đã dùng token chung. Không tuyên bố mọi CSS literal đã được loại.
- Test lỗi, loading/rỗng, running/cancelled/reported/failed/verified/integrated là ca đại diện, không chạy tích Descartes mọi trạng thái với mọi kích thước/theme. Brief draft/reload và empty Plan đã kiểm; chưa lặp full brief/admission bằng agent thật trong lượt này.
- Chưa thử Safari/iOS, screen reader/forced-colors/custom text-spacing hoặc máy worker khác. Zoom đã thử1280×800 ở200%, không tuyên bố mọi mức zoom/kích thước đều được phủ.
- Không gọi model thật hoặc đội agent làm sản phẩm, không xác minh chất lượng model/remote hay giải quyết hạn chế reconcile/multi-file hiện có.
- Giữ nguyên thay đổi không liên quan trong working tree; không commit/push/release, không đổi settings global hoặc ranh giới bảo mật. Bước tiếp theo là người dùng xem bản chạy và chỉ ra phần còn khó quét/thao tác.
