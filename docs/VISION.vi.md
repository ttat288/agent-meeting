# Định hướng: đội AI phát triển phần mềm tự vận hành

Ngày ghi nhận: 2026-10-21. Đây là định hướng phát triển; các khả năng bên dưới chưa phải tính năng đã có của bản 3.5.0.

## Mục tiêu

Tự xây một hệ thống đội AI phát triển phần mềm, với mã nguồn do chủ dự án phát triển và phát hành theo giấy phép MIT. Tham khảo kiến trúc các dự án hiện có để học hỏi, nhưng tự thiết kế và triển khai hệ thống riêng, thay vì lấy một repo về đổi tên.

Trải nghiệm hướng tới: **người dùng đưa ý tưởng vào một phòng chat, trao đổi với trưởng nhóm AI để làm rõ mong muốn; sau đó cả đội tự lập kế hoạch và thực hiện cho đến khi có sản phẩm chạy được, đúng yêu cầu.** Người dùng có thể quan sát, đổi hướng, tạm dừng hoặc tiếp quản qua chat.

**Ưu tiên đầu tiên: một đội nhỏ tự làm tốt một web full-stack từ ý tưởng đến bản chạy được.** Sau đó mới mở rộng số agent, loại sản phẩm và mức độ tự chủ. Thành công được đo bằng sản phẩm đúng mong muốn, ít lỗi, có kiểm chứng, ít cần người dùng can thiệp và có chi phí hợp lý. Số agent là phương tiện để đạt kết quả đó.

## Năng lực cần có

1. **Tổ chức đội linh hoạt.** Trưởng nhóm chia việc, giao nhiệm vụ, theo dõi tiến độ và điều phối các vai trò thiết kế, frontend, backend, kiểm thử, bảo mật và triển khai. Vai trò không bắt buộc tương ứng với một agent chạy thường trực; chỉ gọi chuyên gia khi công việc cần.
2. **Ghép nhiều model và công cụ.** Chọn model/provider hoặc coding agent phù hợp với từng vai trò. Hỗ trợ cloud và local qua adapter có thể mở rộng; phân biệt adapter gọi model với adapter chạy coding agent có công cụ và phiên làm việc riêng.
3. **Làm song song có kiểm soát.** Khởi đầu với đội nhỏ, thiết kế để mở rộng tới hàng chục agent khi đồ thị công việc cho phép. Có cơ chế tránh nhận việc trùng, sửa đè và tích hợp kết quả lỗi thời.
4. **Phát triển sản phẩm đầy đủ.** Bắt đầu với web full-stack; về sau hỗ trợ ứng dụng và game. Có thể tiếp tục trên codebase hiện có, đọc và tuân thủ quy tắc dự án, giữ các hành vi đã được kiểm chứng.
5. **Tự lặp để đạt chất lượng.** Làm rõ yêu cầu → lập kế hoạch → viết code → build → test → review độc lập → sửa lỗi → kiểm tra lại → tích hợp. Hoàn thành cần bằng chứng từ sản phẩm chạy thật.
6. **Kiểm tra sâu.** Kiểm tra luồng chính, tình huống biên, dữ liệu sai, phân quyền và vấn đề bảo mật; kết hợp công cụ kiểm tra với agent đánh giá. Phát hiện của agent cần được đối chiếu bằng bằng chứng phù hợp.
7. **Tiết kiệm token và chi phí.** Chỉ gọi agent khi cần; cấp context theo nhiệm vụ, tái sử dụng thông tin có nguồn và phiên bản, tránh trao đổi không tạo tiến bộ. Có ngân sách và giới hạn thực thi rõ ràng.
8. **Chạy dài và khôi phục được.** Lưu task, quyết định, tiến độ, lần chạy và kết quả; tiếp tục sau gián đoạn. Phát hiện agent kẹt, timeout, giới hạn retry và vòng sửa lỗi.
9. **Quan sát và can thiệp.** Hiện ai đang làm gì, phụ thuộc nào đang chặn, kết quả kiểm tra, chi phí và vấn đề còn lại. Lệnh đổi hướng, tạm dừng và tiếp quản phải tác động tới công việc đang chạy, không chỉ thêm một tin nhắn.

## Khoảng cách so với hiện tại

Agent Meeting 3.5.0 là nền tảng phối hợp: phòng chat, vai trò, quyết định, bảng việc, báo tiến độ kèm bằng chứng, chuyển tệp, MCP và lưu/khôi phục trạng thái phòng khi bật `--data-dir`.

Hiện agent bên ngoài tự kết nối, tự thực hiện công việc rồi báo cáo. Trạng thái việc `done` dựa trên báo tiến độ; server chưa tự khởi chạy đội phát triển, quản lý workspace thực thi hoặc xác minh sản phẩm đã đáp ứng yêu cầu. Khôi phục phòng cũng chưa đồng nghĩa với khôi phục tiến trình build, phiên agent và các tác vụ bên ngoài.

Giữ và phát triển phần giao tiếp đang hữu ích, bổ sung lớp điều phối thực thi riêng. “Tự xây hệ thống riêng” không đòi hỏi viết lại các phần của chính dự án đã hoạt động tốt. Ràng buộc không thư viện ngoài của lõi hiện tại vẫn giữ nguyên; việc thêm runtime hay thư viện cho lớp mới cần quyết định kỹ thuật riêng.

## Kiến trúc đề xuất

Các ranh giới dưới đây là đề xuất, chưa phải quyết định triển khai cuối cùng:

| Thành phần | Trách nhiệm |
|---|---|
| Phòng chat và giao diện | Trao đổi yêu cầu, theo dõi, gửi lệnh điều khiển và hiển thị bằng chứng |
| Trưởng nhóm AI | Làm rõ yêu cầu, đề xuất tiêu chí nghiệm thu, chia việc và xử lý vấn đề cần suy luận |
| Bộ điều phối thực thi | Quản lý trạng thái, phụ thuộc, giao việc, ngân sách, timeout và quyền; kiểm tra chuyển trạng thái bằng quy tắc xác định |
| Adapter model/agent | Khai báo năng lực, khởi chạy, nhận sự kiện/kết quả, hủy, báo usage; khai báo rõ có hỗ trợ resume hay không |
| Workspace và bộ tích hợp | Cấp workspace/worktree riêng, ghi base commit, tích hợp tuần tự và xử lý xung đột |
| Bộ kiểm chứng | Chạy build/test, kiểm tra trình duyệt, kiểm tra bảo mật và thu kết quả review độc lập |
| Kho trạng thái và artifact | Lưu task/run/event, checkpoint, quyết định, commit, log, ảnh và kết quả kiểm tra |

Trưởng nhóm có thể đề xuất kế hoạch và hành động; bộ điều phối chịu trách nhiệm thực thi các ràng buộc. Không đặt toàn bộ trạng thái và luật chạy hệ thống trong prompt của trưởng nhóm.

### Hợp đồng công việc và bằng chứng

- Mỗi task có ID, mục tiêu, tiêu chí nghiệm thu, phụ thuộc, phạm vi sửa, người thực hiện, base commit, ngân sách và hạn chạy. Mỗi lần thử có run ID riêng.
- Vòng đời task dự kiến: `queued → ready → running → verifying → integrating → done`; nhánh ngoại lệ gồm `blocked`, `failed`, `cancelled`. Trạng thái phiên chạy như `paused` được quản lý riêng.
- Agent báo hoàn thành chỉ tạo một kết quả chờ kiểm chứng. Bộ điều phối chỉ chuyển task sang `done` khi bằng chứng bắt buộc hợp lệ.
- Bằng chứng gồm commit được kiểm tra, lệnh và mã thoát, báo cáo test, kết quả kiểm tra trình duyệt và nhận xét review. Gắn với phiên bản yêu cầu, mã nguồn và môi trường chạy; thay đổi liên quan làm bằng chứng cũ cần kiểm tra lại.
- Kiểm tra trên từng nhánh chưa đủ: chạy lại các kiểm tra cần thiết trên commit tích hợp cuối cùng. Reviewer chạy phiên riêng với vai trò và context đánh giá riêng; dùng model khác là tùy chọn.
- Làm rõ yêu cầu ở đầu phiên bằng mô tả luồng sử dụng và tiêu chí chấp nhận. Khi người dùng đổi hướng, tăng phiên bản yêu cầu, xác định task/kết quả bị ảnh hưởng rồi lập lại kế hoạch phần đó.

### Song song và phục hồi

- Khởi đầu với trưởng nhóm, lập trình viên full-stack và người kiểm chứng/reviewer. Đây là ba vai trò; không cần cả ba suy luận cùng lúc. Chuyên gia thiết kế, backend hoặc bảo mật được gọi theo nhu cầu.
- Mỗi task có một chủ thực hiện tại một thời điểm, với lease, heartbeat và mã thế hệ để từ chối kết quả của lần chạy đã mất quyền. Tránh nhận việc trùng; không giả định tiến trình bên ngoài chỉ chạy đúng một lần.
- Mỗi worker sửa code trong workspace riêng; ghi rõ hợp đồng API và thứ tự phụ thuộc. Giới hạn số task đồng thời theo mức độc lập, tài nguyên và ngân sách.
- Tích hợp qua một hàng đợi; xung đột trở thành việc có chủ xử lý. Không cho nhiều agent cùng ghi trên một working tree.
- Lưu chuyển trạng thái và ý định thực thi trước khi chạy tác vụ; khi khởi động lại, đối chiếu với tiến trình/artifact thực tế. Tác vụ có thể lặp cần idempotency hoặc bước kiểm tra trước khi chạy lại.
- Adapter không hỗ trợ resume thì khởi tạo lần thử mới từ checkpoint đã lưu; không tuyên bố đã khôi phục nguyên phiên cũ.
- Phát hiện kẹt bằng thời gian, heartbeat và tiến bộ quan sát được như artifact mới, commit mới hoặc lỗi kiểm tra đã giải quyết. Hết ngân sách/retry thì lưu chẩn đoán và chuyển sang trạng thái chờ can thiệp rõ ràng.
- Tạm dừng ngăn giao việc mới, yêu cầu hủy/checkpoint công việc đang chạy theo khả năng adapter và hiển thị việc nào chưa dừng được. Lệnh tiếp quản hoặc đổi hướng thu hồi quyền ghi của lần chạy cũ trước khi giao lại.

### Context, chi phí và quyền thực thi

- Task nhận yêu cầu liên quan, hợp đồng API, đoạn code cần thiết, quyết định có nguồn và lỗi cần sửa; dùng tham chiếu tới artifact thay cho phát toàn bộ lịch sử chat cho cả đội.
- Theo dõi usage theo task/run/provider. Hiển thị chi phí thực khi provider cung cấp, ước tính có nhãn khi chưa có; model local ghi thêm thời gian và tài nguyên. Không coi số chưa biết là bằng 0.
- Đặt giới hạn token, tiền, thời gian, số agent đồng thời và số vòng sửa lỗi. Cache/tóm tắt có phiên bản và phải làm mới khi nguồn liên quan đổi.
- Lần đầu chạy trong môi trường thực thi cô lập, quyền repo/mạng/secret theo nhiệm vụ. Tin nhắn, tệp và code được đọc là đầu vào cần kiểm tra, không tự cấp quyền cho agent.
- Mốc đầu bàn giao bản chạy local hoặc preview cô lập cùng hướng dẫn tái lập. Chính sách triển khai bên ngoài, quyền dùng credential và hành động không thể hoàn tác phải được xác định rõ trước khi thực thi.

## Lộ trình theo kết quả

### Code intelligence tự phát triển

Định hướng bổ sung ngày 2026-10-21: tự xây engine hiểu mã nguồn của dự án, học cách chia subsystem và đánh giá từ các công cụ đi trước. Không chọn code graph bên ngoài làm lõi mặc định, không lấy repo có sẵn đổi tên. Có thể dùng thư viện parser, compiler hoặc lưu trữ phù hợp; phần schema, pipeline, resolver, retrieval và tích hợp đội AI do dự án tự thiết kế. Phần mã tự phát triển được phát hành MIT; dependency giữ giấy phép tương ứng.

Mục tiêu là cấp context chính xác cho đội AI, đặc biệt khi làm tiếp trên codebase hiện có. Engine là module tách biệt qua adapter, phát triển theo từng lát chức năng để phục vụ mốc web full-stack; không biến việc xây đầy đủ một đối thủ GitNexus thành điều kiện khởi động đội AI.

Phạm vi đầu tiên:

1. **Index JS/TS:** quét repo có bộ lọc, lấy file, symbol, phạm vi khai báo, import/export và vị trí nguồn. Bắt buộc có fixture CommonJS vì code hiện tại dùng `require`/`module.exports`, cùng ESM, alias, re-export, tên trùng và shadowing.
2. **Resolve và truy vấn:** định danh symbol trong snapshot; tìm callers/callees, đường phụ thuộc và vùng có thể bị ảnh hưởng. Mỗi quan hệ có bằng chứng nguồn và trạng thái `resolved`, `ambiguous` hoặc `unresolved`; đường đi tĩnh không được mô tả như luồng runtime đã chứng minh.
3. **Context có giới hạn:** tìm keyword/symbol kết hợp traversal, giới hạn độ sâu, số kết quả và ngân sách phản hồi. Trả lý do chọn context, nguồn, phiên bản index và các giới hạn hoặc phần bị cắt.
4. **CLI rồi MCP:** index repo và kiểm chứng truy vấn qua CLI trước, sau đó cung cấp công cụ cho agent. Graph ban đầu có thể là bảng node/edge trong SQLite; chưa cần graph database chuyên dụng, embedding hay giao diện đồ thị.

Với JS/TS, đánh giá TypeScript Compiler API làm nền cho symbol resolution; Tree-sitter là lựa chọn cho parsing hoặc mở rộng ngôn ngữ khi cần. Không mặc định phải dùng cả hai ở MVP. Lựa chọn dependency/runtime được quyết định riêng, không đổi yêu cầu Node 18+ và không thư viện ngoài của lõi họp hiện tại chỉ vì thêm engine.

Ngay từ MVP, index phải gắn với repo/workspace, commit, thay đổi chưa commit và cấu hình resolution liên quan. Phát hiện stale; khi chưa có cập nhật tăng dần thì rebuild an toàn và công bố snapshot mới nguyên khối, không trả graph đang cập nhật dở. Định danh trong snapshot cần xác định; duy trì identity qua rename/move là năng lực riêng về sau.

Đánh giá bằng fixture có đáp án và bài sửa code thực tế: precision/recall của quan hệ, Recall@K của context, thời gian index, tài nguyên, chi phí context và tỷ lệ hoàn thành task. So sánh cùng model, nhiệm vụ và ngân sách giữa search thông thường và graph. Kết quả graph hỗ trợ chọn phạm vi kiểm tra, không thay thế build/test hoặc chứng minh mọi ảnh hưởng runtime.

Chỉ bổ sung incremental indexing, semantic search, suy luận process, đa ngôn ngữ và UI khi benchmark cho thấy nhu cầu. Không chốt thời hạn 2–4 tuần từ bản tham khảo thành cam kết; ước lượng sau khi hoàn thành một lát index → resolve → query → đánh giá trên repo thật.

### Mốc 1 — Một web full-stack chạy được

- Một stack web được chọn cho MVP; một runtime thực thi đầu tiên qua adapter, có hợp đồng để bổ sung provider khác sau.
- Người dùng nhập ý tưởng và làm rõ với trưởng nhóm trong chat; hệ thống lưu yêu cầu và tiêu chí nghiệm thu.
- Đội ba vai trò lập kế hoạch, viết frontend/backend, lưu dữ liệu, build, chạy test, review độc lập, sửa lỗi và kiểm tra lại.
- Bàn giao commit, bản chạy local/preview, hướng dẫn khởi động, kết quả kiểm tra, chi phí và vấn đề còn lại.
- Có lưu trạng thái, ngân sách, giới hạn vòng lặp, tạm dừng và tiếp tục ngay ở mốc này.

**Cửa nghiệm thu:** dùng một ứng dụng mẫu full-stack có luồng tạo/sửa/xem dữ liệu và phân quyền tối thiểu. Từ ý tưởng trong chat, đội tạo được sản phẩm khởi động lại được từ hướng dẫn; dữ liệu tồn tại sau restart; luồng chính, đầu vào sai và truy cập trái quyền được kiểm tra trên bản tích hợp. Có review độc lập, không còn lỗi chặn nghiệm thu đã biết, có báo cáo chi phí và số lần cần người dùng can thiệp. Thử ngắt runtime giữa một task rồi khôi phục để kiểm tra không mất việc hoặc tích hợp trùng.

### Mốc 2 — Đáng tin cậy trên codebase hiện có

Đọc quy tắc repo, xác định baseline, thực hiện thay đổi giới hạn và kiểm tra hồi quy. Bổ sung adapter cloud/local, routing theo năng lực/chi phí, kiểm tra sâu hơn và benchmark lặp lại trên nhiều nhiệm vụ. Đo ảnh hưởng của chạy song song trước khi tăng số worker.

### Mốc 3 — Mở rộng có bằng chứng

Tăng dần số agent tới hàng chục khi tác vụ phù hợp; bổ sung môi trường build/test cho ứng dụng, game và triển khai. Mỗi loại sản phẩm phải có hợp đồng nghiệm thu và bằng chứng chạy thật riêng. Chỉ mở rộng khi dữ liệu cho thấy chất lượng, thời gian hoặc chi phí được cải thiện.

## Đo thành công

| Chỉ số | Cách đo |
|---|---|
| Đúng yêu cầu | Tỷ lệ tiêu chí chấp nhận đạt trên commit bàn giao; ghi riêng tiêu chí chưa thể kiểm chứng |
| Chất lượng | Lỗi chặn nghiệm thu, lỗi hồi quy và lỗi phát hiện sau bàn giao theo mức độ |
| Tự chủ hữu ích | Số lần và thời gian người dùng phải can thiệp; tách trao đổi làm rõ ban đầu khỏi cứu lỗi thực thi |
| Chi phí | Tổng chi phí mỗi sản phẩm được chấp nhận, gồm cả lần thất bại và retry |
| Tốc độ | Thời gian từ brief đã rõ đến bản chạy được và đến nghiệm thu |
| Phục hồi | Khôi phục được sau gián đoạn, task mất/trùng và tác vụ bị lặp ngoài ý muốn |

Chốt ngưỡng ngân sách, thời gian và số lần can thiệp trước mỗi bài thử. Dùng cùng bộ nhiệm vụ để so sánh đội nhỏ với một agent; không chọn kiến trúc chỉ vì có nhiều vai trò hoặc nhiều tin nhắn.

## Việc đầu tiên khi triển khai

Chốt ứng dụng mẫu, stack MVP, runtime/adapter đầu tiên, môi trường cô lập và ngân sách bài thử. Sau đó thiết kế schema task/run/evidence, cơ chế phục hồi và làm một luồng hoàn chỉnh từ chat tới bản chạy được. Đây là bước triển khai tiếp theo, chưa được thực hiện bởi thay đổi tài liệu này.
