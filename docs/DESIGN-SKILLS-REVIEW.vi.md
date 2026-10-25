# Đánh giá ba bộ design skill cho Foxul

Ngày kiểm: 2026-10-21. Người dùng đánh giá UI v2 “tạm ổn” và yêu cầu nghiên cứu, **chưa yêu cầu cài**. Chỉ tải tài liệu/mã nguồn vào `/tmp/agent-meeting-design-skills-review` để đọc. Không chạy installer, script upstream, engine, hook, telemetry, model CLI hoặc sửa settings/skill hiện có. Không sửa source ứng dụng.

## Kết luận áp dụng

Đề nghị giữ `ui-ux-pro-max` làm nguồn tra cứu/checklist bắt buộc theo AGENTS.md, bổ sung chọn lọc Emil cho stress test/mobile/motion, thử Impeccable ở một tác vụ review có phạm vi rõ; Taste là lựa chọn để thử hướng thiết kế riêng khi đã chốt brand và chế độ app. Chưa có bằng chứng thực nghiệm trong repo để nói bộ nào giúp agent thiết kế tốt hơn bao nhiêu. Đây là review tĩnh về tính phù hợp và xung đột, không phải benchmark hoặc chứng nhận an toàn toàn bộ code upstream.

## Nguồn đã xác định và pin

| Tên người dùng nhắc | Repo gốc | Commit đã đọc | Phạm vi hiện tại |
|---|---|---|---|
| Emil Kowalski | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `2d228630ba1446365f614a108cb8252f1feda202` |15 manifest, MIT; core design engineering cùng các skill chuyên biệt |
| Impeccable Design | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `dad8dbb3aac21ad1fa236c110315ef4abece23e8` |4.7.0, Apache-2.0; một core skill và24 command, có engine/tooling |
| Taste Skill | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `6010f91a9935f1c167dfc500fb1a475681892e6b` |plugin manifest2.1.4, MIT; một skill `design-taste-frontend` với route page/app |

Không lấy bản fork làm upstream. Các bài giới thiệu13 skill Emil, Impeccable17 command hay Taste bundle cũ không mô tả chính xác các commit này. Taste README hiện tại cho biết các skill cổ điển chuyển sang `taste-skill-classics`, nhóm imagegen chuyển repo riêng; không kết luận từ trang docs cũ còn ghi v2 experimental.

## Emil: phù hợp để bổ sung theo vấn đề

Nguồn chính: [README](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/README.md), [break-ui](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/break-ui/SKILL.md), [mobile-native](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/mobile-native/SKILL.md).

`break-ui` có phạm vi rõ: dữ liệu xấu nhưng thực tế, kiểm giới hạn schema, tên dài/ngắn/rỗng, bản dịch, zoom và container thật. Đây là bổ sung sát với lỗi ENDED vừa gặp: transcript và3 task dài khiến tổng kết chiếm timeline. Skill đòi fixture ở biên dữ liệu và harness dev-only, báo phát hiện trước sửa. Với yêu cầu user đã gồm sửa lỗi, không biến bước báo cáo thành một vòng hỏi phép mới; chính skill có biến thể `+ fix`.

`mobile-native` bổ sung phần viewport, touch, scroll và thiết bị thật. Có ích vì ma trận browser375px chưa chứng minh cảm giác trên điện thoại. `review-animations` phù hợp khi sửa motion; manifest đánh dấu chỉ gọi rõ ràng. `prototype` hữu ích nếu người dùng muốn chọn giữa vài cách tổ chức tổng kết, song có bước chờ người chọn nên không gọi mặc định cho task sửa đã có thiết kế đích.

[emil-design-eng](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/emil-design-eng/SKILL.md) thiên về motion và polish, có nguyên tắc giảm/bỏ animation ở thao tác lặp hoặc bàn phím. Ví dụ React/Motion trong tài liệu cần chuyển nguyên tắc sang CSS/JS thuần. Không mặc định thêm thư viện. `pick-ui-library`, `ask-sonner`, Swift/Expo chưa phù hợp stack này; nhiều manifest trong số đó là explicit-only nên cũng không nên mô tả rằng cài cả repo sẽ tự chạy tất cả.

## Impeccable: workflow review tốt, footprint lớn hơn Markdown

[Core skill](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/.agents/skills/impeccable/SKILL.md) phân biệt Persuade/Operate/Read/Experience. Foxul thuộc **Operate**: [hướng dẫn](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/.agents/skills/impeccable/reference/operate.md) cho phép system fonts, UI dày, điều hướng quen thuộc và ưu tiên nhất quán. Không nên đánh đồng toàn bộ repo với phong cách landing page phô diễn.

Các command `critique`, `audit`, `distill`, `clarify`, `harden` bổ sung đúng lớp đang cần: tìm vấn đề hierarchy, kiểm kỹ thuật, giảm trùng thông tin và xử lý state/i18n. Riêng [audit](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/.agents/skills/impeccable/reference/audit.md) là kiểm kỹ thuật; không thay việc người dùng đánh giá thiết kế. [distill](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/.agents/skills/impeccable/reference/distill.md) rất sát vấn đề tổng kết lặp task/conclusion, nhưng đề xuất bỏ/gom phải giữ inventory và dữ liệu.

Điểm vận hành cần quyết định trước khi dùng: [README](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/README.md) mô tả installer có hook, API roll chọn hướng thiết kế và telemetry lựa chọn; `.agents/skills/impeccable/scripts/impeccable` có thể tải engine pin vào cache home. Launcher kiểm SHA256 sidecar và fail closed cho binary mới tải; điều này không thay audit binary. Core skill yêu cầu `context` ngay đầu phiên, nên **chỉ copy SKILL.md không làm workflow thành prompt-only**. Có fallback đọc context dự án khi launcher không chạy.

Không chạy `npx impeccable install` cho repo này ở lượt nghiên cứu. Nếu pilot, cần quyết định rõ engine/cache/network/hook; không bật hook tự động như một tác dụng phụ. `--no-hooks` chỉ là lựa chọn bỏ hook của installer, không loại engine hoặc mọi network path. Telemetry opt-out không loại request roll để lấy catalog. Live mode là công cụ dev; README cũng yêu cầu không nới CSP/security để inject vào production. Source/CLI path đã đọc; chưa chạy hoặc audit toàn bộ engine Rust và mọi hook/platform adapter.

## Taste: v2 có route app thật, nhưng house style mạnh

[README](https://github.com/Leonxlnx/taste-skill/blob/6010f91a9935f1c167dfc500fb1a475681892e6b/README.md) xác nhận plain HTML cũng được hỗ trợ. Không áp lời nhận xét về bản cũ mặc định React/Next cho snapshot này. Phần [app-screens](https://github.com/Leonxlnx/taste-skill/blob/6010f91a9935f1c167dfc500fb1a475681892e6b/skills/taste-skill/references/app-screens.md) dùng typography sản phẩm, border/divider và mật độ hợp app; app **không có motion floor**. Các yêu cầu ảnh/motion lớn trong route page không áp nguyên xi cho app.

Điểm phù hợp: đếm theo view, một dữ kiện có một nguồn, số liệu thật, dữ liệu lỗi/loading/rỗng, kiểm browser và giữ stack. Điểm cần ghim ngoại lệ cho Foxul: app rules vẫn cấm violet/indigo, màu navy/slate tối, accent ở một số chrome; yêu cầu face đã chọn được load. Đó là lựa chọn thẩm mỹ của tác giả, không phải tiêu chuẩn accessibility. Màu accent indigo hiện có, system font và shell/navigation đã được người dùng đánh giá phải được giữ. `--keep palette,type` và `--allow` có cơ chế bảo toàn brand/waiver, nhưng phải dùng đúng rule; chưa kiểm việc waiver bao phủ từng rule bằng runtime.

Tooling [SKILL](https://github.com/Leonxlnx/taste-skill/blob/6010f91a9935f1c167dfc500fb1a475681892e6b/skills/taste-skill/SKILL.md) yêu cầu Node22+ và browser cài sẵn cho inspector; đây là tooling dev, không tự đổi runtime Node>=18 của app. Đã đọc draw/inspect/assets/CDP helper và installer, không chạy. Script `draw.mjs` mặc định có history ngoài project (`~/.taste-skill/history.json`, có biến `TASTE_SKILL_HISTORY`); assets tìm/tải ảnh từ nguồn ngoài. Installer shell `--codex` link vào `~/.codex/skills`, khác quy tắc cài project-local đang dùng. Nếu dùng sau phải chọn scope và tài nguyên đầy đủ, không chỉ lấy một Markdown bỏ library/references/scripts.

## Các xung đột và cách phân vai

| Chỗ giao nhau | Rủi ro cụ thể | Quyết định đề nghị |
|---|---|---|
| Tên shortcut | Emil có `animate`; Impeccable có thể pin command thành skill tên `animate` | Giữ `$impeccable animate` có namespace, không pin trùng. Source pin.rs có guard SKIP nếu skill ngoài đã tồn tại, không khẳng định nó ghi đè |
| Auto-trigger | ui-ux-pro-max, Impeccable, Taste đều mô tả rất rộng cho UI | Một workflow chính mỗi task, skill phụ chỉ cho concern được gọi; không ghép3 full playbook |
| Design authority | app.css + HANDOFF/v2 hiện có; Impeccable dùng PRODUCT/DESIGN/surface briefs; UIUX có MASTER; Taste có direction sheet | Source/token và hợp đồng dự án là chuẩn. Tài liệu bổ sung tham chiếu chuẩn đó, không sinh3 design system độc lập |
| Màu/radius/font | Taste cấm indigo; craft-floor Impeccable có radius12–16 trong khi app8 | Pin brief/token hiện tại. Core Impeccable cho brief ưu tiên; Taste dùng keep/allow hoặc chỉ lấy critique phù hợp |
| Density | UIUX gợi base16/target44 tổng quát; v2 chọn14/20 và36 desktop/44 mobile | Giữ role/context của dự án; không áp ngưỡng mobile lên mọi control pointer desktop |
| Motion | Emil hạn chế thao tác thường xuyên; page art-direction có thể đẩy motion; Operate/app route tiết chế hơn | Chọn đúng surface. App vận hành không dùng quota motion của trang marketing |
| Cài thư viện | Emil có skill lookup thư viện và ví dụ framework; các bộ có mẫu/font/tool riêng | Không thêm dependency/font/CDN hoặc đổi stack chỉ để khớp ví dụ |
| State, ID, evidence | Simplification/redesign có thể lược control hoặc metadata cần truy vết | Mọi thay đổi phải kiểm inventory, task/source/revision/draft/evidence và lifecycle cả LIVE/WORK/ENDED |
| Kiểm chứng | Detector/screenshot/điểm critique chỉ phủ một phần | Tiếp tục browser theo hành trình và dữ liệu thật; user review là cửa riêng |
| Hooks/network/files | Impeccable engine/hooks/catalog, Taste history/assets/installer home | Tách tooling khỏi app; không cấp thêm quyền hay sửa global ngoài phạm vi user yêu cầu |

Về Codex, [tài liệu chính thức](https://developers.openai.com/blog/skills-agents-sdk) nói metadata là tín hiệu chọn skill, body/reference chỉ nạp khi cần; [hướng dẫn về descriptions](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) lưu ý scope quá rộng và hướng dẫn mâu thuẫn làm routing kém. Vì vậy cài nhiều không có nghĩa agent luôn đọc toàn bộ, nhưng descriptions trùng vẫn tạo rủi ro chọn sai/đọc thừa. Các tên core mặc định không đụng `ui-ux-pro-max`. Có một collision tùy chọn đã đối chiếu [pin.rs](https://github.com/pbakaus/impeccable/blob/dad8dbb3aac21ad1fa236c110315ef4abece23e8/crates/context/src/pin.rs): pin command `animate` tạo folder/manifest tên `animate`, trùng Emil; installer có guard SKIP với skill không phải pin của nó. Giữ namespace tránh nhầm workflow, không mô tả thành lỗi tự ghi đè.

## Cấu hình thử nghiệm đề nghị, chưa thực hiện

1. Giữ nguyên skill `ui-ux-pro-max` hiện có, AGENTS và token UI v2.
2. Cân nhắc cài project-local đúng `break-ui` trước; `mobile-native` cho task điện thoại; motion review chỉ khi sửa motion. Không cần cả15 skill.
3. Pilot Impeccable ở Operate với một nhiệm vụ như review ENDED/WORK; bắt đầu bằng phát hiện có file/state/bằng chứng. Engine/hook/telemetry là quyết định riêng; không chạy installer toàn bộ chỉ để đọc critique.
4. Taste thử riêng trong bản sao/temp khi có yêu cầu tạo hướng thị giác mới, đặt app route + giữ palette/type và scope. Không dùng nó để tự restyle lại UI mà người dùng vừa đánh giá tạm ổn.
5. Đo hiệu quả trên cùng bài: tổng kết3 task dài, transcript dài, viewport thấp, source link, keyboard, Plan count/draft. So vấn đề đã tìm/đã sửa, tác dụng phụ, thời gian/usage; chưa có số liệu để xếp hạng chất lượng.

Nếu cài sau, phải theo quy tắc AGENTS: pin commit đã review, ignore hẹp đúng folder skill local, cập nhật inventory/nguồn/điều kiện dùng, giữ license/thông báo phù hợp. Lượt này chưa cài nên không sửa inventory hoặc `.gitignore`.
