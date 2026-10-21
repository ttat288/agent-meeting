# Kế hoạch đề xuất: kiến thức chia việc, đội agent và các không gian làm việc

Ngày: 2026-10-21. Bản nháp để chủ dự án đọc và chỉnh. Chưa phải tính năng đã triển khai hoặc cam kết thời gian.

## 1. Trải nghiệm muốn đạt

Người dùng mở Agent Meeting, nói mình muốn bàn một vấn đề, nhờ phân công hay làm ra sản phẩm. Hệ thống giúp chọn đội phù hợp với model, công cụ và máy đang có. Trưởng nhóm làm rõ yêu cầu, tra năng lực, đề xuất phân công và điều phối theo phạm vi được giao. Người dùng theo dõi được quyết định, công việc và bằng chứng; có thể đổi hướng mà không phải tự chuyển prompt giữa các CLI.

Người dùng không cần diễn đạt hết ngay từ đầu. Có thể bắt đầu bằng trao đổi, giữ lại yêu cầu/quyết định, rồi tạo kế hoạch và chuyển sang thực hiện khi đã rõ mục tiêu. Việc chuyển sang thực hiện phải hiện rõ thay đổi quyền, môi trường và chi phí dự kiến.

Giữ phòng giao tiếp hiện tại như một trải nghiệm độc lập, tiếp tục hữu ích khi chưa cài runtime tự động.

## 2. Ba lựa chọn độc lập quyết định luồng sử dụng

### Mục đích của phòng

| Mục đích | Kết quả chính | Giao diện trọng tâm |
| --- | --- | --- |
| Trao đổi | Ý kiến, phản biện, quyết định, biên bản | Hội thoại, chương trình, người tham gia |
| Lập kế hoạch và chia việc | Task, phụ thuộc, người nhận, tiêu chí nghiệm thu | Hội thoại + bảng phân công và lý do chọn agent |
| Thực hiện công việc | Artifact/commit, kiểm chứng, bàn giao | Bảng việc, phiên chạy, kết quả; chat để chỉ đạo |

Đây là các điểm bắt đầu và cách hiển thị, không phải ba bản sao hệ thống. Phòng có thể đi từ trao đổi sang chia việc rồi thực hiện. Chuyển mục đích không tự bật quyền sửa code hoặc khởi chạy CLI. Phòng chỉ trao đổi không phải đi qua các bước cấu hình repo/build/test.

### Agent chạy ở đâu

| Bố trí | Điều phối cần biết | UI bổ sung |
| --- | --- | --- |
| Cùng máy | Workspace nào, quyền nào, tài nguyên dùng chung | Máy hiện tại, CLI, workspace, số phiên chạy |
| Nhiều máy | Máy nào có repo/tool, cách chuyển artifact, mất kết nối | Danh sách máy, kết nối, phiên bản mã nguồn, chuyển giao |
| Kết hợp | Agent nào ở máy nào; khả năng thực tế của từng nơi | Nhóm theo máy và cảnh báo điều kiện còn thiếu |

Cùng máy không đồng nghĩa cùng working tree. Nhiều agent viết code vẫn cần workspace/worktree riêng và tích hợp tuần tự. Khác máy không có nghĩa phải chia theo frontend/backend; phân theo công cụ, dữ liệu, phụ thuộc và khả năng kiểm chứng.

Không suy ra vị trí thực thi từ đường truyền vào phòng: localhost, LAN hoặc tunnel chỉ mô tả kết nối. Cần host ID và khai báo/kiểm tra workspace riêng.

### Ai quản lý vòng đời agent

- Mời agent có sẵn: người dùng mở CLI/phiên bên ngoài và cho vào phòng; hệ thống theo dõi lời báo và heartbeat, không giả định điều khiển được tiến trình.
- Tool quản lý: adapter khởi chạy, theo dõi, hủy và tiếp tục nếu runtime có hỗ trợ.
- Kết hợp: trưởng nhóm có thể quản lý worker local, đồng thời nhận reviewer bên ngoài.

## 3. Làm trước: đưa đầy đủ kiến thức chia việc vào hệ thống

Nhập đủ nội dung có ý nghĩa của prompt gốc, bao gồm điều kiện không nên giao, quy tắc handoff, kiểm chứng và giữ bằng chứng. Không chỉ giữ ba đoạn mô tả điểm mạnh.

Tách thành các nguồn có cấu trúc:

1. **Hồ sơ model:** định danh, mô tả năng lực, trường hợp phù hợp, hạn chế, modality, nguồn, ngày kiểm tra, mức tin cậy. Tên hiển thị tách với model ID của provider/CLI.
2. **Hồ sơ runtime/adapter:** CLI/harness, cách nhận input/output, tool có thể cung cấp, session/resume/cancel và giới hạn.
3. **Trạng thái môi trường:** máy, CLI/version, trạng thái truy cập model, tool/quyền, workspace, thời điểm kiểm tra. Không chứa credential trong phản hồi cho model.
4. **Chính sách giao việc:** cách chọn, giới hạn ngân sách, review khi cần, giữ context đang có, fallback, chống giao trùng/sửa đè.
5. **Hợp đồng bàn giao:** mục tiêu, phạm vi, nguồn và vị trí bằng chứng, facts/hypotheses/unknowns, thay đổi đã làm, kết quả test, câu hỏi còn lại.
6. **Lịch sử đánh giá:** kết quả theo loại task, model/version, runtime, thời gian, chi phí nếu có, retry và bằng chứng nghiệm thu.

Lưu bản nguồn của nội dung nhập để kiểm tra độ bao phủ. Mỗi nhận định năng lực có loại nguồn: tài liệu hãng, cấu hình của người dùng, hoặc đánh giá thực tế. Các câu “model A giỏi hơn B” trong prompt được nhập như giả thuyết/ưu tiên ban đầu, không tự nâng thành dữ kiện đã xác minh. Kiểm tra tên model, model ID và thông số bằng nguồn chính thức trước khi bật sử dụng.

JSON có schema/version đủ cho catalog và policy ban đầu. Trạng thái run và dữ liệu tăng theo thời gian có lớp lưu riêng; không dồn tất cả vào một JSON chung.

### Tool tra cứu dự kiến

- `list_agents`: tóm tắt các cấu hình có thể dùng và trạng thái biết/chưa biết.
- `recommend_agent`: nhận yêu cầu task, lọc điều kiện bắt buộc, trả một số ứng viên cùng lý do và giới hạn.
- `get_agent_profile`: đọc sâu đúng hồ sơ cần thiết, kèm nguồn.
- `check_runtime`: kiểm tra điều kiện chạy; kiểm tra executable tách với xác minh truy cập model.
- `record_run_result`: lưu kết quả có bằng chứng sau kiểm chứng; phân biệt báo cáo của agent và kết quả đã kiểm tra.

Tên tool còn có thể đổi để không lẫn agent trong phòng với cấu hình model/runtime. Tool tra năng lực nên dùng được ngoài một phòng đang họp; không buộc Astra join một cuộc họp chỉ để chọn worker.

Phản hồi giới hạn dung lượng, ưu tiên 2–3 ứng viên; cho đọc tiếp và báo phần bị cắt. Không đọc toàn catalog vào context mỗi lần. Kết quả mang revision của catalog/policy và thời điểm kiểm tra runtime để phát hiện cũ.

Bộ lọc điều kiện bắt buộc chạy trước; sau đó trả mức phù hợp dựa trên dữ liệu hiện có để trưởng nhóm cân nhắc. Có thể giữ việc ở trưởng nhóm hoặc báo không có ứng viên; không bắt buộc gọi agent khác. Nếu phân loại task không chắc, cung cấp mô tả rút gọn thay vì loại ứng viên chỉ vì thiếu tag.

RAG để sau: tìm trong tài liệu dài, benchmark và lịch sử khi có nhu cầu. Không dùng retrieval ngữ nghĩa làm nguồn quyết định model ID, quyền, ngân sách hoặc trạng thái truy cập.

## 4. Áp dụng cho agent phát triển chính dự án này

Khi triển khai chặng này, thêm hướng dẫn ngắn trong AGENTS.md và tài liệu quy trình, trỏ tới policy/catalog có phiên bản. Hướng dẫn yêu cầu:

1. Xác định mục tiêu, độ khó, nguồn, tool, quyền sửa và điều kiện nghiệm thu.
2. Trước khi giao task, tra cấu hình thực sự khả dụng; tránh nhắc lại ưu tiên model cứng trong prompt.
3. Chọn làm trực tiếp hoặc gọi worker dựa trên lợi ích, context sẵn có, thời gian và ngân sách. Nêu lý do ở kế hoạch ngắn.
4. Khi gọi CLI, dùng adapter có model ID cụ thể và đối số có cấu trúc; không nội suy prompt thành chuỗi shell.
5. Giao phạm vi/workspace và bằng chứng; kiểm chứng kết quả trước khi tích hợp và ghi nhận thành công.
6. Không đổi model âm thầm khi bị từ chối truy cập; ghi rõ fallback và lý do, trong phạm vi người dùng cho phép.

“Áp dụng cho tôi” nghĩa là workflow có chỉ dẫn và tool để tôi tuân theo trong repo này. Không sửa trọng số hay trí nhớ vĩnh viễn của model, không bảo đảm ảnh hưởng các phiên ngoài repo. Cần kiểm tra discovery và dùng được ở phiên mới.

Đợt thử đầu: chính Agent Meeting dùng catalog để chọn worker cho một task giới hạn. Chỉ gọi model/runtime đã có quyền sử dụng; không cài hoặc chạy hàng loạt chỉ để chứng minh đủ ba hãng.

## 5. Tổ chức UI: không gian sử dụng và trang quản trị riêng

Điều chỉnh theo yêu cầu tiếp theo ngày 2026-10-21: có thể xây lại 70–90% UI để phù hợp mô hình mới; không ràng buộc phải giữ bố cục cũ. Phần trăm là phạm vi thay đổi được chấp nhận, không phải chỉ tiêu phải viết lại code. Giữ chức năng và dữ liệu hữu ích, kiểm chứng tương thích.

Nguyên tắc: cài xong có thể bắt đầu với cấu hình mặc định, không bắt vào admin. Các kết nối/quyền thực sự còn thiếu được hướng dẫn ngắn ngay tại hành động cần dùng; không hứa thực thi khi chưa có runtime khả dụng. Cấu hình chuyên sâu ở trang quản trị, không dồn vào form tạo phòng.

### Không gian sử dụng hằng ngày

Điều hướng chính đề xuất:

- **Tổng quan:** phòng/công việc gần đây, đang chạy, đang cần người dùng quyết định, tạo phiên mới.
- **Phòng:** hội thoại và quyết định; hiển thị theo mục đích đã chọn.
- **Công việc:** task, phụ thuộc, người nhận, kiểm chứng, tích hợp, bàn giao.
- **Kết quả:** sản phẩm, artifact, biên bản và báo cáo bàn giao.
- **Quản trị:** điểm vào riêng, không mở thành các form cấu hình trên trang chính.

Trang bắt đầu ưu tiên ô “Bạn muốn đội AI làm gì?”, chọn mục đích gọn và tiếp tục phiên gần đây. Tự dùng đội/máy/chính sách mặc định; hiển thị tóm tắt có thể sửa cho phiên đó. Cấu hình riêng của một phiên không tự ghi đè mặc định toàn hệ thống.

### Trang quản trị

Route đề xuất `/admin`, dùng bố cục admin management: sidebar theo nhóm, danh sách có tìm/lọc, trang chi tiết chỉnh sửa, thông báo lưu và lịch sử thay đổi. Đây là khu tùy chỉnh của chủ ứng dụng, chưa đòi hỏi dựng một ứng dụng frontend hoặc server triển khai độc lập. Không công khai quyền admin qua link mời agent; giữ ranh giới quyền chủ trì hiện có khi mở rộng.

| Nhóm quản trị | Cấu hình có thể chỉnh |
| --- | --- |
| Model & năng lực | Thêm/sửa/tắt model, provider/model ID, thế mạnh, hạn chế, modality, nguồn và mức tin cậy |
| Quy tắc chia việc | Loại nhiệm vụ, ưu tiên chất lượng/tốc độ/chi phí, lựa chọn mặc định, fallback và điều kiện review |
| Agent & runtime | CLI/adapter, model được phép dùng, reasoning khi hỗ trợ, giới hạn phiên và khả năng resume |
| Máy & workspace | Máy mặc định, kết nối worker, repo/workspace và khả năng thực thi |
| Mẫu làm việc | Đội mẫu, brief, tiêu chí nghiệm thu và hợp đồng handoff |
| Thực thi & ngân sách | Song song, timeout, retry, giới hạn tài nguyên/chi phí và quyền thực thi |
| Dữ liệu & kết nối | Nơi lưu, retention, export/import, tích hợp và tham chiếu credential |
| Giao diện & hệ thống | Ngôn ngữ, theme, độ đậm thông tin và các tùy chọn hiển thị được hỗ trợ |

Danh sách là bản đồ phát triển, không phải mọi mục đã có backend. Bản đầu chỉ hiện mục dùng được; chưa làm trình kéo-thả bố cục, custom CSS/JS hoặc editor schema tùy ý. “Thiết kế” trước hết là theme và bố cục được hỗ trợ; mở rộng thành trình thiết kế riêng nếu có nhu cầu cụ thể.

### Ví dụ thêm model bằng admin

Mở Model & năng lực → Thêm model → nhập định danh và mô tả điểm mạnh/hạn chế → chọn runtime tương thích → kiểm tra cấu hình → lưu. Có thể lưu hồ sơ chưa kết nối nhưng phải hiện “chưa xác minh/chưa sẵn sàng”. Nhận định người dùng nhập được ghi là cấu hình người dùng; không tự trở thành kết quả benchmark.

Sau khi lưu, tool tra cứu và đề xuất dùng cùng một nguồn cấu hình với admin. Thêm một model thuộc adapter đã hỗ trợ không cần sửa code. Thêm provider/CLI có giao thức mới vẫn cần adapter tương ứng, không chỉ thêm tên vào form.

### Lưu xuống file và áp dụng cấu hình

- Mặc định đóng gói trong ứng dụng; cấu hình tùy chỉnh nằm ở thư mục dữ liệu ghi được, ví dụ `~/.agent-meeting/config/`, không ghi đè mã nguồn/package khi bấm Lưu.
- Đề xuất các file `models.json`, `routing.json`, `runtimes.json`, `system.json`, có schemaVersion và revision; vị trí dữ liệu được cấu hình riêng. Dữ liệu bí mật dùng kho/tham chiếu credential phù hợp, không xuất chung trong catalog.
- Backend validate trước khi ghi, ghi nguyên tử, lưu bản trước và kiểm tra revision để tránh hai tab ghi đè. Một thay đổi nhiều file cần công bố snapshot nhất quán.
- Nút Lưu ghi bền vững thật; UI chỉ báo thành công sau phản hồi backend. Có lỗi ghi thì giữ bản đang sửa và báo rõ. Khởi động lại phải đọc đúng cấu hình đã lưu; file lỗi không âm thầm xóa hay thay bằng cấu hình rỗng.
- Thay đổi có hiệu lực cho quyết định/phần việc mới; run đang chạy giữ snapshot cũ. Thay đổi cần restart được gắn nhãn cụ thể. Sau nâng cấp ứng dụng, giữ cấu hình người dùng và migration có backup.
- Có khôi phục mặc định theo nhóm, xem thay đổi và export/import có kiểm tra schema. Catalog/policy revision làm mất hiệu lực cache liên quan; Astra tra lại trước quyết định mới nếu phiên bản đổi.

Đây là một hệ cấu hình chung cho admin và tool, không duy trì một JSON cho UI và một bản kiến thức riêng cho Astra.

Ở phạm vi một phòng có tổng quan, thảo luận, kế hoạch, thực hiện và kết quả theo khả năng đã bật. Không lặp hai bảng việc có trạng thái độc lập ở cấp toàn cục và trong phòng: cùng một dữ liệu, khác bộ lọc.

### Luồng tạo phiên

1. Chọn “Trao đổi”, “Lập kế hoạch và chia việc” hoặc “Thực hiện công việc”, kèm một ví dụ đầu ra.
2. Nhập mong muốn bằng ngôn ngữ tự nhiên; có thể trao đổi để làm rõ, không bắt điền brief dài.
3. Dùng đội/máy/chế độ quản lý mặc định đã có; nếu thực hiện, chỉ hỏi workspace hoặc quyền còn thiếu. Có thể sửa lựa chọn cho phiên này; tùy chỉnh hệ thống đi qua admin.
4. Hệ thống kiểm tra điều kiện, đề xuất đội và phân công, giải thích lý do cùng điểm chưa biết.
5. Vào không gian tương ứng. Khi cần người dùng quyết định, hiện đúng hành động và lý do tại task/phòng liên quan.

Có lựa chọn “Chưa rõ, trao đổi trước”. Người dùng có thể sửa phân công và khóa lựa chọn model; hệ thống báo mâu thuẫn với yêu cầu bắt buộc thay vì tự làm khác.

### Các màn hình phải khác thực chất

| Màn hình | Nội dung chính | Hành động chính |
| --- | --- | --- |
| Trao đổi | Chat, chương trình, người tham gia, quyết định | Mời, phát biểu, chốt, tạo kế hoạch |
| Chia việc | Task, phụ thuộc, lý do chọn agent, điều kiện còn thiếu | Sửa kế hoạch, đổi người nhận, chuyển thực hiện |
| Thực hiện local | Tiến độ task/run, workspace, diff/commit, build/test | Chạy, tạm dừng, hủy, xem lỗi, kiểm chứng |
| Thực hiện nhiều máy | Nội dung thực hiện + host, đồng bộ mã, artifact, kết nối | Giao máy, chuyển artifact, thử lại/chuyển giao |
| Bàn giao | Tiêu chí đạt/chưa đạt, cách chạy, artifact, chi phí, vấn đề còn lại | Xem sản phẩm, tải kết quả, tạo việc tiếp |

Ở màn thực hiện, chat vẫn dùng để chỉ đạo nhưng không chiếm toàn bộ giao diện. Không dùng số tin nhắn làm tiến độ. Phân biệt agent báo xong, đang kiểm chứng, đã đạt và đã tích hợp.

Với remote do người dùng tự quản lý, chỉ hiển thị điều khiển mà hệ thống thực sự có: gửi yêu cầu dừng khác với xác nhận tiến trình đã dừng. Mất kết nối thành trạng thái rõ ràng, không tự coi task đã hủy hoặc thất bại.

Giữ HTML/CSS/JS thuần, CSP, Việt/Anh, sáng/tối. Có thể tổ chức lại token/component và bố cục theo thiết kế mới thay vì buộc giữ giao diện cũ. Ưu tiên phân cấp thông tin, bàn phím, phản hồi thao tác, trạng thái trống/lỗi và responsive. Tra cứu skill trả hướng landing page hoặc kết quả không khớp settings nên không áp dụng các bố cục đó; phân tách trang quản trị dựa trên yêu cầu người dùng và nguyên tắc UX chung. Chưa chốt font/palette/framework mới.

## 6. Kiến trúc đủ để UI phản ánh sự thật

Các đối tượng chính: Project, Room, Task, Run, AgentProfile, RuntimeAdapter, Host, Workspace, Artifact, Evidence và RoutingDecision. Role là trách nhiệm trong task; không đồng nhất role với một model hoặc một tiến trình thường trực.

RoutingDecision lưu ứng viên, lý do chọn/loại, phiên bản catalog/policy và trạng thái khả dụng tại thời điểm chọn. Run tham chiếu task, model/runtime thực dùng, host/workspace, log, timeout, usage và kết quả. Nhờ đó UI có thể giải thích “vì sao giao cho agent này” và điều tra fallback.

Tách module registry/routing/execution khỏi lõi phòng họp. Giữ kết nối MCP/curl hiện có qua lớp tương thích. Tool tra cứu chỉ đọc không đi chung cơ chế auto-allow với tool khởi chạy/sửa workspace; hiện connect.js tạo allowlist từ danh sách TOOLS nên phải tách phân quyền trước khi thêm execution tool.

Chạy local trước; remote cần worker kết nối đã xác thực và khai báo khả năng, không chỉ một tunnel vào phòng. Remote về sau dùng capability và quyền được kiểm soát ở worker; tin nhắn trong phòng không tự cấp quyền chạy lệnh.

## 7. Thứ tự triển khai và cửa nghiệm thu

| Chặng | Đầu ra có thể xem và dùng | Điều kiện hoàn thành |
| --- | --- | --- |
| A. Kiến thức chia việc | Catalog, policy, hợp đồng handoff, tài liệu nguồn, MCP tra cứu | Đối chiếu đủ nội dung prompt; nguồn/độ tin cậy rõ; truy vấn có giới hạn; revision và unknown hoạt động |
| B. Áp dụng vào chính repo | Hướng dẫn agent + adapter local đầu tiên + ghi quyết định chọn | Một task thật chọn cấu hình hợp lệ, gọi đúng model, thu bằng chứng; lỗi truy cập/timeout không báo thành công |
| C. Thiết kế trải nghiệm | Wireframe/prototype không gian chính gọn + admin riêng | Bắt đầu được mà không vào admin; đọc thử các chế độ và local/remote/mixed; thêm/sửa model dễ hiểu |
| D. UI mới, admin và thực hiện local | Điều hướng mới, admin cấu hình cốt lõi, luồng chat tới bàn giao | Lưu admin xuống file, restart còn cấu hình, routing dùng đúng revision; một thay đổi nhỏ chạy trọn vòng có kiểm chứng; cuộc họp cũ còn dùng được |
| E. Nhiều máy và đội kết hợp | Host/worker, artifact, phiên bản mã, khôi phục kết nối | Task chạy ở host đúng, artifact gắn đúng run/base; ngắt mạng không giao trùng hoặc tích hợp kết quả cũ |
| F. Cải thiện bằng dữ liệu | Thống kê theo task/model/runtime; retrieval khi cần | So với baseline cùng task/ngân sách; điều chỉnh routing có bằng chứng và khả năng quay lại |

Chặng A trước, B sau; có thể thiết kế wireframe C trong lúc hoàn thiện B. Định hình cả luồng trước khi dựng lại UI, nhưng chỉ bật thao tác backend đã hỗ trợ. Nếu có bản prototype giả lập, gắn nhãn rõ dữ liệu mẫu.

Không lấy việc hoàn thiện code graph/RAG hoặc hỗ trợ mọi model làm điều kiện khởi động. Dùng interface context/evidence chung để bổ sung engine sau. Không đặt lịch cứng khi chưa đo adapter đầu tiên.

## 8. Bài thử để kiểm tra đúng ý tưởng

1. **Chỉ bàn:** hai agent phản biện một ý tưởng, chốt quyết định; không bị hỏi repo hay cấu hình chạy code.
2. **Chỉ chia việc:** Astra đề xuất task/người nhận cho một repo, giải thích chọn model; kết thúc bằng kế hoạch, chưa tự chạy.
3. **Tự làm trên một máy:** trưởng nhóm điều phối một thay đổi nhỏ; worker có workspace riêng; build/test/review và tích hợp có bằng chứng.
4. **Cùng máy, phiên bên ngoài:** người dùng mời reviewer có sẵn; UI nhận biết reviewer không nằm dưới quyền quản lý tiến trình của tool.
5. **Nhiều máy:** một máy có repo và build, máy khác review artifact; kiểm tra quyền truy cập và revision trước giao việc.
6. **Đổi ý giữa chừng:** từ bàn ý tưởng chuyển sang thực hiện, rồi sửa yêu cầu; giữ lịch sử và vô hiệu phần kết quả đã lỗi thời.
7. **Không đủ điều kiện:** thiếu model/tool, hết quota, timeout, mất mạng; hiện lý do và phương án khả thi, không im lặng fallback hoặc báo xong.
8. **Mặc định đủ dùng:** người mới tạo phiên trao đổi mà không cần mở admin; thực hiện chỉ hỏi kết nối/quyền còn thiếu tại nơi cần.
9. **Tùy chỉnh thật:** thêm/sửa/tắt model, lưu xuống file, khởi động lại và truy vấn tool; mọi nơi dùng cùng cấu hình. Hai tab sửa đồng thời, file lỗi và lỗi ghi không làm mất cấu hình hợp lệ.
10. **Đổi cấu hình khi đang chạy:** run cũ giữ snapshot; quyết định mới lấy revision mới, đổi ưu tiên cho một phiên không thay mặc định toàn hệ thống.

Kiểm tra UI bằng desktop/mobile, bàn phím, Việt/Anh và sáng/tối. Kiểm tra backend tập trung ở chọn sai ứng viên, quyền, task/run state, hủy/khôi phục và bằng chứng. Đánh giá tiết kiệm context bằng đo phản hồi truy vấn thực tế, không hứa trước phần trăm tiết kiệm.

## 9. Giả định ban đầu để bắt đầu được

- Astra là trưởng nhóm ưu tiên theo mong muốn người dùng; vai trò trưởng nhóm vẫn cấu hình được.
- Nhập ba nhóm model trong prompt trước; schema mở để thêm model, không đóng vào ba hãng.
- Tự động hóa local trước. Thiết kế UI từ đầu có chỗ cho remote/mixed; worker remote triển khai sau luồng local đã kiểm chứng.
- Trải nghiệm đầu tiên là làm tiếp trên chính Agent Meeting với task nhỏ; mục tiêu dài hạn web full-stack trong VISION.vi.md vẫn giữ.
- Chưa chọn lại tên sản phẩm, framework, database lớn hoặc triển khai cloud trong bản kế hoạch này.

Bước triển khai đầu sau khi chỉnh bản kế hoạch: lập bảng đối chiếu prompt gốc → catalog/policy/handoff, thiết kế schema và mẫu phản hồi tool; từ đó làm chặng A trước khi tự động khởi chạy agent.
