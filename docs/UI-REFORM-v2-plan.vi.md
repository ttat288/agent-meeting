# UI v2 — kế hoạch sửa cấu trúc và mật độ

Ngày 2026-10-21. **V2 đã triển khai và kiểm chứng; chờ người dùng đánh giá UX. Bản UI trước đã bị người dùng bác bỏ**, không còn là thiết kế đích. Kết quả triển khai: [evidence/ui-v2/ACCEPTANCE.vi.md](evidence/ui-v2/ACCEPTANCE.vi.md). Các phần chẩn đoán/spec bên dưới giữ làm baseline và cửa nghiệm thu. Giữ các hợp đồng dữ liệu trong CONSISTENCY-JOURNEYS.vi.md; tài liệu UI-REFORM.vi.md mô tả vòng trước.

## 1. Chẩn đoán đã kiểm

Người dùng phản hồi: text/box quá to, không nhất quán, header quá nhiều button, Hội thoại có ba header. Root đo browser thực tại 1341×609 CSS px, dữ liệu fixture có quyết định/task/run:

| Vùng | Chiều cao hiện tại |
|---|---:|
| `.top` | 69 px |
| `.session-nav` | 62 px |
| `.conversation-heading` | 69 px |
| Tổng chrome trước timeline | **200 px** |
| Composer | 113 px |
| Timeline còn lại | **272 px — khoảng 45% viewport** |

Source xác nhận ba vùng riêng tại index.html; workspace.css tăng heading view lên28, tên task20, padding task24, nav min-width120 và control min-height44. app.css/workspace.css còn giữ các scale khác nhau, Admin có body16 và title tới34. Sửa bằng cách nối thêm override đã làm vấn đề khó kiểm soát hơn.

Không phải mọi chữ đều quá lớn: phần metadata hiện đã nhỏ. Nguyên nhân chính là chrome/wrapper chiếm chỗ, nhiều lớp cùng có border/nền, navigation được nhấn như action và typography theo vai trò chưa thống nhất. Phải sửa cấu trúc trước, không giảm font-size toàn trang.

## 2. Cơ sở và phạm vi

Đã áp dụng skill ui-ux-pro-max local: typography/spacing theo vai trò, reflow, target size web, focus, hierarchy. Search navigation trả Breadcrumbs không phù hợp app phẳng này, nên không dùng làm lý do thêm breadcrumb. Quyết định bố cục dưới đây là thiết kế cho Agent Meeting, không phải tiêu chuẩn bắt buộc có đúng số px đó.

Tham chiếu primary:

- [Carbon productive typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets): phân biệt tỷ lệ UI sản phẩm và trang nội dung; base productive14px. Chỉ tham khảo nguyên tắc, giữ font hệ thống hiện có, không cài Carbon/IBM Plex.
- [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): web có minimum24 CSS px và các ngoại lệ; không đồng nhất với hướng dẫn native44pt/48dp. Thiết kế này chọn target rộng hơn minimum cho thao tác chạm, không dùng nó để phóng to mọi box.

Giữ HTML/CSS/JS thuần, palette sáng/tối hiện tại, CSP, local-only admin/execution, task/source/run ID, draft và revision guards. Không thêm tính năng backend hoặc bảng việc mới.

## 3. Shell đích: một hệ điều hướng

### Desktop 1280 và tablet đủ chỗ

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [logo tên]  Hội thoại  Kế hoạch  Thực hiện  Kết quả    Đang họp    [Chi tiết] [Tùy chọn ▾] │
└─────────────────────────────────────────────────────────────────────────────────────────┘
│ Tóm tắt phiên (256px) │ Timeline bắt đầu ngay; không có header Hội thoại thứ ba             │
│ Thành viên            │                                                                  │
│ Quyết định / link việc │                                                                  │
│ Bối cảnh / tệp         ├──────────────────────────────────────────────────────────────────┤
│                       │ [Tất cả ▾] [Nhắn…                              ] [Gửi] [Gợi ý ▾] │
```

- Một shell cao mục tiêu52px, tối đa56px ở font/locale bình thường. Logo/tên nhỏ; bốn nav link cùng hàng; selected dùng underline + weight + aria-current, không dùng bốn nút filled/viền hộp.
- Bỏ `.conversation-heading` và shortcut “Kế hoạch →” trùng nav. Giữ h1 ngữ nghĩa cho Hội thoại theo cách visually hidden, không tạo thêm dải trang trí.
- Tối đa hai utility trigger trực tiếp: **Chi tiết** và **Tùy chọn**. Status là thông tin, không nút. Chi tiết đóng/mở sidebar; không tự tạo một toolbar khác.
- Tùy chọn là một popover có nhóm rõ: Phiên (Mời agent, Biên bản, Kết thúc); Ứng dụng (Quản trị); Hiển thị (ngôn ngữ, theme). Kết thúc nhóm cuối, giữ confirm. Một trigger thay sáu control thường trực; menu mở mới chiếm diện tích.
- Giữ sidebar bên trái trong lát cắt đầu để không đổi thói quen/vị trí đồng thời. Sidebar tóm tắt và dẫn về task chuẩn; không lặp form sửa task/progress đầy đủ. Nhãn “tự báo” và “đã kiểm chứng” vẫn tách nghĩa.
- Kết nối bình thường dùng indicator nhỏ; mất kết nối mới hiện thông báo có cách phục hồi. Không dùng banner hướng dẫn cố định khi bình thường.

### Mobile 375 và tablet không đủ chỗ

```text
[logo + tên ngắn]        Đang họp       [Chi tiết] [Tùy chọn ▾]   ← hàng44
Hội thoại       Kế hoạch       Thực hiện       Kết quả             ← hàng44
────────────────────────────────────────────────────────────────
Timeline; không thanh title hoặc strip thành viên nữa
...
[Tất cả ▾] [Nhắn…                         ] [Gửi] [Gợi ý ▾]
```

Cùng một header region có tối đa hai hàng, mục tiêu88px, không hàng thứ ba. Ngưỡng đổi layout dựa trên fit của nhãn Việt/Anh, không cắt chữ để ép một hàng. Chi tiết mở sheet thay sidebar; đóng/Escape trả focus về trigger, không để focus rơi vào nền. Khi zoom/text spacing tùy chỉnh có thể reflow thêm để giữ nội dung, không khóa height và cắt nhãn nhằm đạt con số này.

## 4. Inventory hành động và vị trí

| Hiện có | Vị trí đích | Thường trực? |
|---|---|---|
| Hội thoại/Kế hoạch/Thực hiện/Kết quả | Nav trong shell | Có; một bản |
| Admin | Tùy chọn → Quản trị; admin giữ link trở về view nguồn | Không |
| EN/VI, theme | Tùy chọn → Hiển thị | Không |
| Mời agent/Biên bản/Kết thúc | Tùy chọn → Phiên | Không; label rõ, kết thúc có confirm |
| Thành viên/agenda/quyết định/việc/tệp/bối cảnh | Sidebar/sheet Chi tiết, link nguồn và task | Nội dung tóm tắt; nhóm ít dùng thu gọn |
| Gửi | Composer | Primary của Hội thoại |
| Recipient | Composer cạnh input | Có, compact |
| Năm quick prompts | Một menu Gợi ý cạnh composer | Chỉ trigger; bỏ hàng chip thường trực |
| Làm mới task/run | Góc hàng tiêu đề nội dung tương ứng | Secondary compact; không global header |
| Sửa yêu cầu/Lưu/Run/Verify/Integrate/Retry/Cancel | Ngay task/run và state có liên quan | Một hành động tiếp theo nổi bật; cảnh báo không bị giấu |
| UUID/revision/snapshot/log | Chi tiết inline của task/run | Không; vẫn truy vết đầy đủ |

Menu là thay vị trí điều khiển hiện có, không thêm chức năng. Khi triển khai phải kiểm đủ inventory, không làm mất đường vào Mời/Kết thúc/Biên bản.

## 5. Một scale dùng chung

Các giá trị là token đích ban đầu cần kiểm bằng computed style, không rải literal vào từng view.

| Vai trò | Font / line-height | Weight |
|---|---|---|
| Nội dung form/list và control | 14 / 20px | 400; action500–600 |
| Hội thoại/báo cáo dài | 15 / 22px | 400 |
| Heading task/section | 16 / 22px | 600 |
| Heading trang Plan/Execute/Results/Admin | 20 / 28px | 650 |
| Label/metadata | 13 / 18px | 400–500 |
| Timestamp/code phụ | 12 / 16px | 400 |
| Field chỉnh sửa trên mobile | 16 / 24px | 400 |

- Spacing scale4/8/12/16/24; gutter desktop24, mobile12–16. Task/panel chính padding16 desktop,12 mobile; khoảng task12 hoặc divider.
- Control phổ thông36px desktop pointer; icon target32px/icon16. Coarse pointer/mobile target44px, icon18; không hit-area chồng nhau. Chiều cao textarea theo nội dung, không ép thành hàng36px.
- Radius dùng hai mức sẵn có6–8px cho control,8px cho container; không mỗi nơi một capsule. Status có thể nhỏ nhưng không dùng cùng style với nav/primary action.
- Một outer surface cho một task/editor. Bên trong dùng typography, alignment, divider; không card bọc card, không mỗi disclosure một hộp input. Shadow dành cho overlay/menu, không dùng đại trà trong nội dung.
- Giữ palette/token màu sẵn có. Nền page, surface nội dung và field có vai trò riêng. Phân cấp bằng kích thước/weight/spacing trước; primary màu chỉ dành hành động tiếp theo.
- Refactor định nghĩa cũ trong phạm vi liên quan và gom token vào nguồn chung; bỏ override dư. Không thêm một lớp “v2 override” cuối file để tiếp tục hai design system.

## 6. Nội dung từng view

| View | Cấu trúc đích |
|---|---|
| Hội thoại | Shell → timeline + sidebar tùy chọn → composer. Không title band, không hàng chip gợi ý. Message không bị bọc thêm panel ngoài bubble. |
| Kế hoạch | Một hàng nội dung “Kế hoạch (n)” + refresh nhỏ; danh sách việc dạng row có tên/owner/status/action. Mở inline yêu cầu/acceptance; form có nhóm bằng label/divider, Save ở cuối form. |
| Thực hiện | Cùng task row; profile + Run một nhóm compact. Running hiển thị status + Cancel; có báo cáo dẫn tới Results. Không giữ nút Run primary disabled thành khối lớn khi đã có kết quả. |
| Kết quả | Task/run hiện tại → báo cáo + tệp thay đổi + test → Verify/Integrate/Retry phù hợp. Lịch sử/bằng chứng là disclosure row. Bỏ câu hướng dẫn tĩnh “kiểm chứng…” khi đã tích hợp; copy bám state hoặc bỏ nếu status/action đủ rõ. |
| Quản trị | Cùng scale; sidebar text rows và model list selectable rows; editor một surface. Save gần nhóm field liên quan; điều kiện bật model, nguồn và cảnh báo phí probe vẫn rõ trước thao tác. |

Danh sách không đặt chiều cao cố định khiến tên dài bị cắt. Row khoảng56–64px chỉ là mục tiêu với fixture ngắn, phải tăng khi nội dung wrap. Không chuyển sang grid nhiều card để lấp khoảng trống. Không ép người dùng đọc goal/source lần nữa khi đi qua các view.

## 7. Triển khai theo lát cắt

1. **Shell + Hội thoại trước:** hợp nhất nav/header, inventory/menu, bỏ header lặp và hàng chip; sidebar256, composer compact. Dùng dữ liệu3–5 task và transcript dài, không chỉ fixture một việc.
2. **Token + component chung:** typography/spacing/control, nav/menu/disclosure/status/field; kiểm đối chiếu computed role giữa năm view. Không đổi màu để che lỗi cấu trúc.
3. **Plan/Execute/Results:** task rows, form inline, action theo state, report/test hiển thị trực tiếp; giữ nguồn/ID/draft/guards.
4. **Admin:** áp cùng scale/list/editor; bảo toàn local-only, CAS và điều kiện bật model/probe.
5. **Kiểm source tích hợp:** hành trình, lỗi/khôi phục, Việt/Anh, system/light/dark,375/768/1280, viewport thấp609/640 và zoom200%. Ghi nhận UX độc lập với test kỹ thuật.

Trước triển khai chuẩn bị wireframe/render mẫu shell và một task cho desktop/mobile dựa trên spec này; đối chiếu checklist nội bộ rồi mới mở rộng. Lát cắt1 là điểm kiểm thiết kế sớm, không triển khai đồng loạt năm view rồi chỉ nhìn ảnh cuối.

## 8. Cửa nghiệm thu

- A1: Desktop1280 có đúng một shell ngang≤56px; bỏ conversation heading/shortcut. Mobile375 tối đa hai hàng shell≤96px ở font mặc định, không thêm strip/title. Ngoại lệ reflow/accessibility phải giữ đủ chữ.
- A2: Với cửa sổ1341×609 và dữ liệu baseline, timeline mục tiêu≥440px thay vì272; composer idle≤80px desktop. Tại375×640 timeline mục tiêu≥400px. Các con số chỉ áp dụng state bình thường, không có banner lỗi, menu/sheet đóng và composer chưa multiline.
- A3: Header không hiện thường trực Lang/Theme/Admin/Invite/Minutes/End thành sáu button. Một Tùy chọn và một Chi tiết là đủ; mọi chức năng inventory vẫn truy cập bằng keyboard.
- A4: Cùng role có cùng computed font/spacing/control giữa năm view; không còn title28/34 cho màn hình công cụ. Mỗi task một outer container; disclosure là hàng mở rộng, không hộp form giả.
- A5: Fixture3–5 task có tên Việt/Anh dài: quét được tên/owner/state/action; task ngắn trong Results hiện báo cáo/test/action ở phần màn đầu1280×800; không đạt bằng cắt report/ẩn lỗi.
- A6: Test menu/sheet bằng Tab/Enter/Space/Escape, click ngoài, return focus; hành động phá hủy giữ confirm; focus không che. Touch target không chồng, zoom200% không mất label.
- A7: Conversation→Plan→Execute→Results giữ cùng ID/source; Back/reload/admin-return giữ draft; stale/failed/blocked/running/completed có action/copy đúng. Lỗi an toàn/recovery không giấu trong menu phụ.
- A8: Người dùng đánh giá lại mật độ, phân cấp và tìm hành động trên bản chạy. Các test xanh/90 ảnh hoặc lời agent không đóng cửa nghiệm thu UX.

## 9. Hai lượt review và quyết định hợp nhất

- UI-PLAN-02A `/root/structure_review`: review read-only shell/inventory/mobile, xác nhận triple header và shortcut trùng; đề xuất một bar desktop, gom utility, giữ ngữ nghĩa h1, giảm quick prompts. Root đã đối chiếu source và đo DOM thực.
- UI-PLAN-02B `/root/system_review`: review read-only type/density/component, xác nhận hai scale CSS và card lồng; đề xuất scale UI sản phẩm, primary theo state và kiểm3–5 task. Root đã đối chiếu CSS và ảnh/browser.
- Hai agent đề xuất menu Phiên/Tùy chọn hoặc đặt Mời tại Thành viên. Root chọn **một menu Tùy chọn có nhóm Phiên/Ứng dụng/Hiển thị**, tránh lại tăng số trigger; Mời có label rõ trong nhóm Phiên. Đây là quyết định tích hợp của root, chưa được user nghiệm thu.
- Một agent đề xuất chuyển sidebar sang phải. Root giữ trái trong lát cắt đầu để tránh mở thêm biến thiết kế; tinh gọn nội dung và scale trước. Có thể xem xét lại sau phản hồi thực tế.
- Thực thi review qua hai subagent nội bộ cùng model của phiên, không Claude/Gemini CLI. Lookup catalog revision1 trả no-candidate: các profile đang disabled/unverified/access unknown. Không probe, không đổi settings hoặc gọi model ngoài. Không tuyên bố đã gọi hai hãng khác.
- Chỉ tài liệu planning được sửa trong lượt này, chưa đổi source UI. Không commit/push.

## 10. Mốc triển khai và screen pool v2

2026-10-21: root bắt đầu triển khai; giữ S01–S07 và UC01–UC08 trong CONSISTENCY-JOURNEYS. S03 đích: một header chứa nav, Chi tiết desktop collapse/mobile modal sheet, Tùy chọn disclosure nhóm và Gợi ý gửi ngay; menu không tạo URL mới. S04–S06 giữ hash/task UUID/draft, task name → state/action → inline form/report → source/evidence. S07 giữ return allowlist và scale chung; không đổi API/quyền.

Checkpoint shell trước khi mở rộng: source preview 3119 xác minh process/cwd và fixture riêng. Baseline đo lại 200px chrome, 272px feed,113px composer. Sau lát cắt với5 task dài và transcript dài: desktop1341×609 shell52/feed495/composer62; mobile375×640 shell89/feed490/composer61. Đã xem ảnh, kiểm sheet Escape/return focus. Chưa nghiệm thu UX. Sidebar owner/control dài cần đổi thành summary + disclosure. Matrix cuối bao gồm J01–J10 liên quan, inventory utility/sidebar, keyboard, locale/theme/width/low-height/zoom.

## 11. Bàn giao triển khai v2

Root đã triển khai shell/Hội thoại theo checkpoint rồi áp chung token/component sang Plan/Execute/Results/Admin. Reviewer A+B review cả thiết kế và source/browser, phát hiện focus nested modal/summary trap/resize, count Results và density; đã sửa và retest độc lập. Bằng chứng/giới hạn chi tiết ở [ACCEPTANCE](evidence/ui-v2/ACCEPTANCE.vi.md), [REVIEW](evidence/ui-v2/REVIEW.vi.md). Preview transient service3119 chạy đúng source hiện tại,5 task dài và transcript dài. Chưa commit/push; chưa có người dùng nghiệm thu.


## Lát cắt showcase/ENDED — 2026-10-21

Hiện trạng: ENDED/WORK lặp bảng task và kết luận dưới timeline; ba task dài làm feed còn24px. Đích: timeline giữ nguyên nội dung, footer chỉ có trạng thái + số việc tự báo và link Plan; metadata/tải biên bản nằm trong disclosure, carry/new còn truy cập được. Sidebar giữ status/note/evidence controls, Plan giữ task/source/revision; không bỏ chức năng. Luồng kiểm: LIVE→WORK→ENDED→Plan→source→Back/reload, có/không task, VI/EN, light/dark,375/768/1280 và viewport608px, zoom200%. Showcase quay trên source tích hợp bằng bot kịch bản ghi rõ, không gọi model hay giả tạo kết quả verified.
