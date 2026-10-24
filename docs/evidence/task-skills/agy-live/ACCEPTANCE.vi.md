# Direct agy: review và handoff có model thật — 2026-10-24

Local trên HEAD `1b56f4db04d4135a66fcc329af89332eb21b9d3f`, branch `codex/2026-10-22-product-hardening`, chưa commit/push. Phiên bắt đầu **11:46:59 +07**, hạn16:30 cùng ngày. Thời điểm chốt/thời lượng riêng trong `verification.json` và HANDOFF. Không cộng ca cũ hoặc thời gian chờ reset.

## Kết quả và phạm vi

Khoảng trống được khép: một model thật viết handoff, downstream invocation mới chọn `skill_load` từ metadata/grant, nhận reference qua **production `createLookup`**, sinh patch; PM kiểm guard/source/test và test trên source sau áp dụng. Ba arm matched đều qua8/8. Đây là **direct agy text protocol do PM/harness chuyển tiếp**, không phải MCP native hoặc agy managed adapter. Không giả reportedModel/observation để vượt guard sản phẩm; `prepare(..., 'claude')` trong harness chỉ dựng context cho phép thử lookup được hỗ trợ, không dispatch model qua adapter Claude.

Executable `/home/theo/.local/bin/agy`, requested **gemini-3.8-flash-low** ở mọi lượt. **Actual model unknown**: raw JSON chỉ có conversation_id/status/response/duration_seconds/num_turns/usage, không có machine model field. Không lấy lời model tự nhận làm identity. Credentials/settings và toàn cây host được mount chỉ đọc bằng bwrap; `/tmp` riêng được ghi. Không cách ly đọc/mạng. `plan` không hiệu lực với disable-slash-commands; biên ghi đến từ bwrap, không từ prompt. Persistence/cache/artifact warnings EROFS là hệ quả biên chỉ đọc, không được gọi nhầm thành OAuth failure. Raw chứa ID/log runtime giữ ở `/tmp/am-agy-20261024-114659`; receipt công bố bỏ ID/raw stderr, giữ hash/byte và cảnh báo. Không hứa `/tmp` lưu bền.

## Review và hai sửa nhỏ

`calls.json` giữ nguyên toàn bộ phân tích của hai review model, không coi nhận xét là sự thật trước kiểm.

- **Đã tái hiện và sửa:** `bin/task-skills.js` tính cap trên tổng pending trước tách dòng, nên burst nhiều request hợp lệ có thể đóng stdin. Nay cap65536 byte **mỗi dòng**, kể cả dòng hoàn chỉnh; phần đuôi chưa có newline vẫn có cap. Không nới bound cho một request. Test burst6×49KB đỏ trước sửa, xanh sau; oversized66KB không được trả kết quả.
- **Đã tái hiện và sửa:** description cắt600 codepoint không có chỉ báo, khiến người đọc không biết metadata thiếu. Nay `descriptionTruncated: true` đi từ discovery qua snapshot tới bootstrap/skill_list; manifest đầy đủ vẫn load được. Chỉ thêm field khi thực sự cắt, giữ snapshot cũ của description ngắn. Snapshot description dài có thay đổi phải review/save policy tường minh như source stale thông thường.
- Review1 finding1 (crash/null/notification) không tái hiện: outer catch đã xử lý null; notification không yêu cầu response. Mã lỗi method không chuẩn là hardening ngoài lát cắt, không phải crash đã chứng minh.
- Finding3 (secret false-positive/bundled không sửa được) chưa có trường hợp bundled cụ thể; không bỏ secret guard. Có thể bỏ chọn skill hoặc cập nhật nguồn; thông báo riêng là giới hạn còn lại, không nhận blocker thật đã quan sát.
- Finding4 realpath/hardlink không chứng minh symlink bypass: component đã chặn symlink, realpath cũng không phát hiện hardlink. Không nhận đây là sandbox đọc/bí mật.
- Finding5 newline normalization bị loại: pin byte đổi thì stale là chủ đích, không nới integrity để tránh repin.
- Finding7 taskSkillMode-only chưa có đường app bypass: prepare chặn mọi policy agy; không xây adapter hay đổi guard.
- Finding8 bỏ2s escalation bị loại: silent grandchild có thể sống dù parent/stdio đã đóng. Giữ process-group kill bảo đảm cũ.
- Review cuối nêu split UTF-8/byte cap và flag absent. `setEncoding('utf8')` giữ partial character; claim dòng<65536 nhưng pending>65536 không có tái hiện hợp lệ, ví dụ67000 thực sự quá cap. Flag là additive optional chỉ true, không có consumer/schema đòi false. Không có lỗi mới được xác nhận trong hai sửa.

Hai test mới đỏ trước sửa (`red.txt`12/14); targeted18/18; full **487/487,43file,0fail/skip/cancel** (`full.txt`), Node22.22.1/Linux, đúng MemoryMax1200M/swap0/timeout900. `journey.json` chạy lại production API/MCP/restart/retry/verify/integrate và source8checks. Fixture vẫn được ghi đúng nhãn; model evidence nằm riêng. Không sửa UI; UI bundle và runtime adapter giữ nguyên hash. Browser12case của ca trước chỉ là bằng chứng cũ cùng UI bytes, không nhận browser mới hoặc native model UI test. Replay offline model patches: `node tools/check-live-skill-results.js`, receipt `replay.json`, không inference mới.

## So sánh ba cách giao tiếp

Pilot:6inference handoff/patch; source/test bytes giống nhưng commit timestamp tạo Git base khác, nên **không dùng làm matched comparison**. Baseline và Caveman tạo regex chứa newline thực gây SyntaxError; structured qua8/8. Không arm nào chọn optional lookup khi toàn bài đã có trong prompt; không suy là model không có khả năng dùng tool. Baseline handoff có SUCCESS/output nhưng process không thoát tới190s, bị hủy/timeout; ghi lifecycle failure dù inference có usage.

Hai explicit recovery pilot cũng không tích hợp: model trả fenced JSON và revision dạng chuỗi `revision2`, còn patch lỗi cú pháp. Harness ban đầu bóc fence không xử lý trailing blank lines, nên parse fail trước guard. `recovery-inspection.json` trim fence **chỉ để kiểm độc lập**: revision guard vẫn fail và candidate vẫn SyntaxError. Không âm thầm sửa kiểu revision/code hoặc thay output fail bằng output đẹp. Không gọi thêm retry để ép xanh.

Matched: cùng task `T-COMM-CSV`, revision2, source/test hash, Git base `7a01d9772446634cc5573bd6e713f71df2420fc2`,8checks và requested model. Khác instruction80/261/4678bytes; Caveman đúng SHA pin `415d43518f2b1a9498c15a445d4657117b129ee5e81b19454ce348439cc6672b`, commit `bae9beaf3aa6dc509f05f3d3ed239c827f6e51bb`. Không cài vào catalog/hooks/global hoặc áp dụng session persistence cho PM.

Required task-rules yêu cầu đọc reference trước patch; optional csv-guide chỉ metadata, không supplied body. Mỗi downstream thực sự trả JSON request `skill_load` cho `references/csv.md`; harness chỉ chuyển request vào granted production lookup rồi gửi receipt/text ở lượt kế. Mỗi arm3inference: handoff, tool request, patch. Đã kiểm task ID/phủ định/điều kiện/source hash/revision/literal error/path/evidence/unknowns/bước tiếp bằng đọc toàn handoff; exact-substring coverage trong JSON chỉ phụ trợ, không phạt Markdown/paraphrase đúng nghĩa. Caveman thay wording nhưng giữ điều kiện. Chưa dùng metric độ ngắn để suy lý luận tốt hơn.

| Matched arm | Input token | Output token | Tổng token | Tổng call wall | Handoff bytes | Test source |
|---|---:|---:|---:|---:|---:|---|
| Baseline |26360|530|26890|27.199s|1000|8/8|
| Structured |26380|515|26895|29.410s|916|8/8|
| Caveman |27531|541|28072|28.353s|844|8/8|

Mỗi arm lookup request83bytes/response410bytes; schema/context và prior protocol messages được gửi lại nguyên trong prompt, chi phí nằm trong usage CLI báo. Timer tổng call không bao gồm setup/test/tổng hợp; `matched.json` có elapsed arm rộng hơn. Một mẫu tuần tự/style, không randomized, labels/style khác nhau; không causal benchmark hoặc kết luận chất lượng chung. Baseline đã đủ tốt trong matched; structured không tiết kiệm token ở mẫu này; Caveman thêm1182token so baseline dù handoff ngắn hơn. **Không có lợi ích bù overhead được chứng minh để chọn Caveman làm mặc định.** Giữ rule ngắn đang có vì rõ hợp đồng trường, không vì đã chứng minh rẻ hơn.

## Tổng overhead và giới hạn còn lại

**19 lượt**, gồm2review +6pilot +2recovery bị loại +9matched. Usage CLI: **189905input +9205output =199110token**, thinking/cache CLI báo0. Tổng wall của mọi call **412270ms** (có phần song song, **không phải thời lượng phiên**). Tổng prompt148567 UTF-8 bytes. Probe chào hỏi ca trước không gọi lại, không tính vào phiên này; receipt cũ vẫn13093token. Token PM, billing/cache thực/hidden unreported context, công người dùng và bảo trì tương lai **unknown**, không thay bằng0. Tốn thêm hai lần chuẩn bị harness: restart pilot ban đầu cố seed Git lại gặp nothing-to-commit (không inference), và nhận ra Git base pilot không matched nên giữ fail và chạy matched riêng. Không đổ lỗi đó cho model/sản phẩm.

Bằng chứng mới chứng minh được model đáp ứng yêu cầu đọc reference và tạo kết quả kiểm được trong task nhỏ, dưới điều khiển text protocol. Không chứng minh tự discovery skill tùy ý, native Claude/agy MCP, đa-provider, suy luận nội bộ tuân thủ, human UX, lợi ích ròng hay billing. Reference giúp nhắc quy tắc nhưng CSV đã có8tests đầy đủ; không thể nhận skill là nguyên nhân patch đúng hoặc rằng task này bắt buộc cần catalog. Cần thiết kế thử nhiệm vụ thật có nhu cầu reference trước khi đánh giá giá trị thị trường/chi phí điều phối; không tự mở adapter hoặc feature mới để bù bằng chứng thiếu.

Bước tiếp: PM đã khép phạm vi bằng chứng được giao và dừng sớm; không cần giám đốc cấp quyền hay thao tác thường nhật. Nếu mở lát cắt mới, mục tiêu đáng quyết định là đo công vận hành trên task thực so direct CLI; chưa có căn cứ đầu tư Caveman/graph/adapter mới từ mẫu này.
