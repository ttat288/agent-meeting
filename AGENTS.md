# Hướng dẫn agent — Agent Meeting

## Hướng dẫn dự án hiện có

- Đọc `docs/HANDOFF.md` trước khi sửa mã; giữ các quyết định kiến trúc, bảo mật và quy trình bàn giao trong đó. Đọc `CONTRIBUTING.md`, `SECURITY.md` và `docs/SECURITY-DESIGN.md` khi công việc liên quan.
- Hướng dẫn này bổ sung cho tài liệu hiện có, không thay thế chúng. Không sửa hoặc hoàn tác thay đổi không liên quan của người dùng. Không commit/push nếu chưa được yêu cầu.
- Stack hiện tại: Node.js >=18, không dependency runtime ngoài; giao diện `src/ui/` dùng HTML/CSS/JavaScript thuần, không build.

## Quy tắc UI/UX

- Khi thiết kế, xây dựng, chỉnh sửa hoặc review UI/UX, **phải đọc** SKILL.md của `ui-ux-pro-max` và áp dụng phần phù hợp với yêu cầu và ràng buộc dự án.
- Đường dẫn đã cài trên máy cấu hình repo này: `/home/theo/workspace/agent-meeting/.agents/skills/ui-ux-pro-max/SKILL.md`. Vị trí tương đối trong checkout là `.agents/skills/ui-ux-pro-max/SKILL.md`; trên máy khác, xác định đường dẫn tuyệt đối từ gốc checkout thực tế.
- Trước khi thay đổi, đọc design system hiện có. Hiện các token màu, bán kính, font, component và sáng/tối nằm trong `src/ui/app.css`; cấu trúc ở `src/ui/index.html`, hành vi ở `src/ui/app.js`, dịch ở `src/ui/i18n.js`. Đọc thêm quyết định UI trong `docs/HANDOFF.md`. Nếu sau này có `design-system/**/MASTER.md` và override theo trang, đọc chúng trước; giữ tính nhất quán giữa các màn hình.
- Giữ stack, CSP trong `src/server.js`, hỗ trợ Việt/Anh, chế độ sáng/tối theo `prefers-color-scheme`, responsive và các ràng buộc hiện tại. Không làm yếu CSP để chạy ví dụ từ skill.
- Khuyến nghị từ skill **không tự cấp quyền** thêm framework, thư viện, font, CDN hay dịch vụ ngoài. Ví dụ Tailwind/React/GSAP chỉ là tham khảo; chuyển nguyên tắc phù hợp sang stack hiện tại, không mặc định dự án dùng chúng. Không chọn `html-tailwind` thay cho HTML/CSS/JS thuần chỉ vì không có stack tương ứng trong skill.
- Dùng truy vấn domain nhỏ nhất phù hợp; kiểm tra kết quả đúng vấn đề trước khi áp dụng. Không tự tạo hoặc ghi đè design system đang có chỉ vì skill gợi ý. Không dùng `--force` nếu chưa được người dùng cho phép rõ ràng.
- Công việc backend thuần không ảnh hưởng UI/UX không cần nạp skill này.
- Nếu SKILL.md, script hoặc dữ liệu cần dùng bị thiếu/không đọc được, báo rõ đường dẫn và giới hạn; không tuyên bố đã áp dụng skill khi chưa đọc hoặc kiểm chứng được.
- Ví dụ upstream dùng `${CLAUDE_PLUGIN_ROOT}` dành cho plugin Claude. Với repo này, gọi script bằng đường dẫn thực: `/home/theo/workspace/agent-meeting/.agents/skills/ui-ux-pro-max/scripts/search.py`; trên máy khác dùng đường dẫn tuyệt đối của checkout đó. Không cần đặt biến plugin Claude.

## Danh mục skill và phạm vi sử dụng

Kiểm kê ngày 2026-10-21 bao gồm thư mục ẩn, nội dung bị Git ignore, manifest skill và cấu hình/hướng dẫn agent.

| Skill | Đường dẫn từ gốc repo | Mục đích và điều kiện sử dụng | Xử lý |
| --- | --- | --- | --- |
| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/SKILL.md` | Hướng dẫn thiết kế, tương tác, accessibility, responsive và review UI/UX; bắt buộc đọc khi làm UI/UX theo quy tắc trên. | Skill phục vụ phát triển Agent Meeting; cài local và ignore đúng thư mục này. |
| `add-lang` | `.local-tools/codegraph/.claude/skills/add-lang/SKILL.md` | Thêm grammar tree-sitter/extractor và kiểm chứng ngôn ngữ cho chính CodeGraph. | Thuộc repo công cụ nhúng, không phải skill của Agent Meeting; chỉ cân nhắc khi được giao phát triển CodeGraph. |
| `agent-eval` | `.local-tools/codegraph/.claude/skills/agent-eval/SKILL.md` | Benchmark khả năng truy hồi CodeGraph với/không có công cụ trên corpus. | Thuộc CodeGraph; không tự chạy benchmark, thay đổi cài đặt global hoặc các lượt agent trả phí khi phát triển Agent Meeting. |

- Trước lần cài này, không có SKILL.md riêng của Agent Meeting, không có AGENTS.md ở gốc, và không có cấu hình `.agents/` hoặc `.codex/` trong repo. `.claude/launch.json` là cấu hình chạy ứng dụng, không đăng ký skill.
- Hướng dẫn agent có sẵn nằm trong `.local-tools/codegraph/AGENTS.md`, `.local-tools/codegraph/docs/AGENTS.md` và `.local-tools/codegraph/CLAUDE.md` (tham chiếu `@AGENTS.md`). Chúng áp dụng cho CodeGraph, không trở thành chính sách toàn repo Agent Meeting. Tài liệu CodeGraph có nhắc harness `scripts/agent-eval/`, nhưng không liệt kê hai manifest trên thành danh mục skill cho Agent Meeting.
- `.local-tools/` đã được ignore trước lần cấu hình này; giữ nguyên quy tắc đó và nội dung công cụ. Không sao chép skill CodeGraph sang `.agents/skills` hoặc tự động áp dụng chúng toàn repo.
- Các skill global/bundled như `skill-installer` và `openai-docs` được dùng để cấu hình và xác minh discovery trong phiên cài; chúng không được cài vào repo và không thuộc danh mục skill dự án. Không sao chép danh sách skill global của máy vào đây.
- **Bảo trì:** mỗi lần cài hoặc gỡ skill ở phạm vi dự án, cập nhật danh mục này, đường dẫn thực, mục đích, điều kiện sử dụng, nguồn/cách cài và quy tắc ignore tương ứng. Phân biệt skill dự án với skill vendor/công cụ nhúng; không tự nâng hướng dẫn vendor thành quy tắc toàn repo.

## Cài local, Git và máy mới

Skill là **tài nguyên local**, không được commit/push cùng dự án. Máy khác phải cài lại. Giữ `AGENTS.md` và `.gitignore` trong Git để chia sẻ hướng dẫn; không ignore toàn bộ `.agents/`, `.agents/skills/` hoặc cấu hình agent có thể cần chia sẻ.

- Nguồn: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Commit đã đọc và kiểm tra trước khi cài: `56ea9cf174ed86786187daa9de0e6247cb0747e4`.
- Gói nguồn: `.claude/skills/ui-ux-pro-max`, tự chứa SKILL.md, `scripts/`, `data/`, `references/`; không cần cài các skill khác trong repo upstream.
- Đã đọc hướng dẫn upstream, script installer và helper GitHub; kiểm tra import/các thao tác I/O của script skill. Tìm kiếm dùng Python standard library và CSV local, không cài package hoặc gọi mạng. Chế độ `--persist` có thể ghi tài liệu design system, nên không dùng nó cho smoke test.
- Pattern Git hẹp: `/.agents/skills/ui-ux-pro-max/`, bao gồm mọi script/dữ liệu/tham chiếu và cache Python bên trong. Trước khi cài/cập nhật, kiểm tra file đã được track; nếu có, chỉ `git rm --cached` đúng các file skill này và giữ bản local, không đụng file khác. Lần cài này không có file skill được track nên không cần bỏ theo dõi.

Lệnh cài **đã chạy thành công** trên máy này qua skill-installer (không cài CLI npm hoặc dependency ứng dụng):

```bash
python3 /home/theo/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo nextlevelbuilder/ui-ux-pro-max-skill \
  --ref 56ea9cf174ed86786187daa9de0e6247cb0747e4 \
  --path .claude/skills/ui-ux-pro-max \
  --dest /home/theo/workspace/agent-meeting/.agents/skills \
  --method download
```

Trên máy mới, dùng `$skill-installer` của Codex và cùng repo/ref/path, chỉ định `--dest <gốc-checkout-thực>/.agents/skills` thay cho thư mục skill global mặc định. Đọc SKILL.md của installer để xác định vị trí helper thực trên máy đó, không giả định đường dẫn `/home/theo`. Installer dừng nếu thư mục đích đã tồn tại; không xoá hoặc ghi đè bản local chưa kiểm tra. Khi nâng commit, kiểm tra lại hướng dẫn/script trước khi cài và ghi commit mới vào đây.

Kiểm chứng sau khi cài (chạy từ gốc checkout):

```bash
python3 -B "$PWD/.agents/skills/ui-ux-pro-max/scripts/search.py" \
  'keyboard focus modal' --domain ux -n 2
python3 -B "$PWD/.agents/skills/ui-ux-pro-max/scripts/validate_data.py"
git check-ignore -v .agents/skills/ui-ux-pro-max/SKILL.md \
  .agents/skills/ui-ux-pro-max/scripts/search.py \
  .agents/skills/ui-ux-pro-max/data/ux-guidelines.csv \
  .agents/skills/ui-ux-pro-max/references/quick-reference.md
git ls-files -- .agents/skills/ui-ux-pro-max
git status --short --untracked-files=all
```

Kết quả lần cài: query trả 2 kết quả UX phù hợp (Focus States, Focus Not Obscured); validator qua 12 domain, 22 stack và `ui-reasoning.csv`. Không sinh design system hoặc sửa UI.

Codex discovery: [tài liệu chính thức](https://learn.chatgpt.com/docs/build-skills) quy định quét `.agents/skills` từ thư mục làm việc tới gốc repo, kể cả skill folder symlink; vị trí local đã cài đúng cơ chế này. Tài liệu nói tự phát hiện thay đổi skill. Kiểm tra lại ở lượt kế tiếp bằng tên `ui-ux-pro-max`; nếu chưa xuất hiện trong danh sách skill, mở phiên mới tại repo hoặc khởi động lại Codex. Kiểm chứng vị trí/manifest trên đĩa không đồng nghĩa đã xác nhận skill xuất hiện trong bộ chọn của phiên đang chạy.

## Workflow chia việc có catalog

- Trước khi giao việc, xác định mục tiêu, nguồn, quyền/tool, workspace/base revision và nghiệm thu. Đọc `docs/ROUTING-WORKFLOW.vi.md`.
- Tra `node bin/routing.js list_profiles`, `get_profile '{"id":"…"}'`, `recommend_profile '{"task":{…}}'`; cùng nguồn cấu hình với admin, có revision. `check_runtime` chỉ chứng minh executable/version; quyền model cần probe thật. Nguồn mặc định ở `src/defaults/routing.json` và `routing-source.md` là ưu tiên/hypotheses của người dùng, không phải benchmark.
- Chọn làm trực tiếp hoặc worker theo lợi ích/context/ngân sách; không gọi đủ mọi hãng cho có. Không đổi model âm thầm. Task/handoff phải có ID, mục tiêu, phạm vi, nguồn, facts/unknowns, workspace/base, đầu ra, nghiệm thu, timeout/retry và bằng chứng.
- Worker ghi mã phải dùng workspace riêng và adapter có biên ghi filesystem đã kiểm tra. Không nội suy prompt thành shell; không commit/push. Kiểm chứng độc lập và trên source tích hợp, phân biệt reported/verified/integrated.
- Lookup MCP riêng: `node bin/routing.js --stdio` (chỉ đọc); không thêm tool execution vào `server.TOOLS` hoặc allowlist hội thoại của `connect.js`. Không tự sửa MCP/settings global để dùng lookup này.

## Phát triển theo hành trình người dùng

- Ưu tiên hiện tại: đọc `docs/HANDOFF-ui-reform.vi.md`. Người dùng chưa chấp nhận UI sau hợp nhất: cần giảm chữ thừa, gom nhóm, làm bố cục gọn và phân biệt nền/nội dung/điều khiển rõ hơn. Cải cách UI trước backlog model/remote hoặc tính năng mới; giữ hợp đồng dữ liệu trong `docs/CONSISTENCY-JOURNEYS.vi.md`. Test kỹ thuật và browser fixture trước đây không chứng minh thiết kế đã được nghiệm thu.
- Trước khi thêm/sửa một luồng UI, xác định use case, cập nhật screen pool (màn/view/state, quyền, dữ liệu, điểm vào/ra), screen flow và ma trận test. Phân biệt hiện trạng với thiết kế đích. Không tạo màn/bảng việc độc lập chỉ vì có module backend mới.
- Chọn nguồn dữ liệu chuẩn và hợp đồng ID/trạng thái trước khi phân công; giữ ngữ cảnh từ hội thoại tới task/run/evidence. Kiểm thử browser trên bản tích hợp theo hành trình, gồm lỗi/khôi phục, Back/reload/deep link và tính liên tục của dữ liệu.
- Nghiệm thu theo kết quả người dùng và bằng chứng; test kỹ thuật, screenshot hoặc lời agent báo xong không tự chứng minh toàn use case đã hoàn thành. Sau mỗi lát cắt sửa vấn đề tích hợp và cập nhật tài liệu trước khi mở rộng tính năng.
