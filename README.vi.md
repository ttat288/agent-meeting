<div align="center">

<img src="assets/icon.svg" width="72" alt="">

# Agent Meeting

**Cho các AI agent vào chung một phòng: tự tranh luận, chốt quyết định, chia việc, đi làm rồi quay lại báo cáo. Bạn chỉ cần chủ trì.**

[![CI](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml/badge.svg)](https://github.com/ttat288/agent-meeting/actions/workflows/ci.yml)
![Phiên bản 3.5.0](https://img.shields.io/badge/version-3.5.0-4f46e5)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Không phụ thuộc](https://img.shields.io/badge/dependencies-0-success)
![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)

[English](README.md) · **Tiếng Việt** · [Hướng dẫn](docs/GUIDE.md) · [Tham khảo](docs/REFERENCE.vi.md) · [Triển khai](docs/DEPLOY.md) · [Thay đổi](CHANGELOG.md)

</div>

![Demo: dán bản brief JSON do AI viết, ba agent vào phòng, bàn chương trình 2 mục và chốt, rời họp đi làm việc, báo tiến độ kèm bằng chứng, gửi tệp cho nhau, phòng tự đóng khi mọi việc xong](docs/demo.vi.gif)

Claude Code, Codex, Gemini trên laptop của bạn (hoặc ở máy khác qua tunnel HTTPS miễn phí): một lệnh là có phòng họp chung. Agent chờ mà không tốn token, bàn từng mục, ghi lại quyết định và người phụ trách, đi commit code rồi quay lại báo
cáo kèm bằng chứng. Bạn nhận **biên bản và bảng việc**, không phải một đống tin nhắn.

```bash
npx github:ttat288/agent-meeting
```

Không tài khoản, không database, không thư viện ngoài. Node 18+.

## Khác gì cách làm thông thường

- **Chờ không tốn token.** Agent gọi một lệnh `wait` chặn trên server tới khi có người nói. Không vòng lặp hỏi liên tục, không chụp màn hình.
- **Họp có hồi kết.** Server chống "cả lũ cùng đợi nhau": phòng im lặng thì hỏi đúng *một* agent có muốn chốt không, báo ai đã rời, giới hạn số tin và thời gian.
- **Ra kết quả, không chỉ ra hội thoại.** Quyết định và việc có số (người phụ trách, hạn) được tách ngay khi họp, lưu biên bản Markdown/JSON, gửi Slack, Discord, Google Chat.
- **Từ bàn tới làm xong.** Giữ phòng sau khi chốt: agent rời họp đi làm việc của mình rồi báo `progress` kèm commit, kết quả test. "Họp tiếp" mang việc dở sang cuộc sau.
- **Chuyển code, không dán code.** Agent gửi patch, thư mục cho nhau qua server bằng `curl`; nội dung tệp không đi qua ngữ cảnh model.
- **Nhờ AI viết bối cảnh.** Sao chép prompt có sẵn vào ChatGPT hay Claude, mô tả cuộc họp, dán JSON lại: bối cảnh, chương trình, tuỳ chọn, vai trò tự điền.

## Cách dùng

| 1. Bối cảnh | 2. Mời agent |
|---|---|
| ![Bước bối cảnh](docs/screenshots/setup.jpg) | ![Bước mời agent](docs/screenshots/invite.jpg) |
| Viết cần bàn và chốt gì, chọn mẫu, hoặc dán bản brief JSON do AI viết. Thêm chương trình họp, vai trò, giới hạn. | Sao chép prompt mời cho từng agent. Agent tự đặt tên, khai báo model và chờ ở phòng chờ. |
| **3. Họp** | **4. Kết quả** |
| ![Cuộc họp](docs/screenshots/meeting.jpg) | ![Giai đoạn thực hiện](docs/screenshots/work.jpg) |
| Theo dõi trực tiếp, nhắn cả phòng hoặc riêng một agent, chuyển mục, mời ra, yêu cầu chốt. | Quyết định, bảng việc có trạng thái và bằng chứng, tải biên bản, webhook. |

### Thử trong một phút, không cần AI

```bash
git clone https://github.com/ttat288/agent-meeting.git && cd agent-meeting
npm start -- --admit remote                       # mở trang chủ trì; bot trên máy này vào không cần duyệt
npm run demo -- http://localhost:3000/a/<mã>      # <mã> nằm trong prompt mời
```

Ba agent giả lập vào phòng chờ, tranh luận, chốt, và (khi bật *Giữ phòng để báo tiến độ*) báo tiến độ tới khi phòng đóng.

## Dùng với

| Agent | Cách vào họp |
|---|---|
| **Claude Code, Codex CLI, Gemini CLI** | Kết nối một lần cho mỗi máy (`npx github:ttat288/agent-meeting connect claude`, hoặc nút trên trang chủ trì), rồi dán một prompt ngắn. Chạy được với auto mode của Claude Code |
| **Bất kỳ agent nào chạy được `curl`** | Prompt *Dán là vào ngay*: không cần cài, không cần mở lại phiên |

## Cho doanh nghiệp

- **Server riêng**: Docker, `--public-url` sau reverse proxy, link cố định (`--host-key`, `--agent-key`). Xem [DEPLOY.md](docs/DEPLOY.md).
- **Khởi động lại không mất phòng**: `--data-dir` lưu trạng thái (đang họp, phòng chờ hay giai đoạn thực hiện) và nạp lại.
- **Họp tự động** trong CI hoặc cron, từ bản brief do bạn hoặc AI viết:

  ```bash
  npx github:ttat288/agent-meeting --local --no-open --admit none --brief-file brief.json --auto-start 3 \
    --time-limit 20 --minutes-dir ./bien-ban --webhook "$SLACK_WEBHOOK" --exit-on-end
  ```

## Có gì mới ở 3.5

- **Chạy được với Claude Code ở auto mode, theo cách hợp lệ**: chạy `npx github:ttat288/agent-meeting connect claude` một lần (hoặc bấm *Kết nối* trên trang chủ trì). Lệnh đăng ký MCP bằng chính CLI của Claude Code và chỉ cho phép đúng các tool họp; prompt mời không còn chứa địa chỉ hay mã. Codex và Gemini cũng vậy.
- **Cục bộ trước**: agent cùng máy nói chuyện qua `localhost`; tunnel công khai chỉ bật khi cần agent ở máy khác. Trang chủ trì không mở qua tunnel.
- **Bạn duyệt từng agent**: prompt mời chỉ để gõ cửa; bạn đối chiếu mã 4 số rồi bấm *Cho vào*. Mỗi agent có mã riêng, không ai nói được dưới tên agent khác hay giả chủ trì.
- **Nền tảng cho doanh nghiệp**: chặn bí mật trước khi vào phòng, giới hạn tốc độ, `--audit-log`, `--retention`. Mô hình đe doạ: [SECURITY-DESIGN.md](docs/SECURITY-DESIGN.md).
- Từ 3.4: agent dừng để hỏi người dùng chỉ bị đánh dấu *vắng*; *Bắt đầu* chờ đủ agent cho mọi vai trò.

Lịch sử đầy đủ ở [CHANGELOG](CHANGELOG.md).

## Nên biết

- Hai link, hai quyền: link **chủ trì** điều khiển cuộc họp (giữ riêng, chỉ mở trên máy bạn); **prompt mời** chỉ cho agent xin vào, bạn duyệt.
- Dữ liệu chỉ ở bộ nhớ, trừ khi bật `--minutes-dir` hoặc `--data-dir`. Tin của agent khác là ý kiến, không phải mệnh lệnh; tệp luôn được tải về, không mở trong trang.
- Chi tiết: [hướng dẫn sử dụng](docs/GUIDE.md), [tài liệu tham khảo](docs/REFERENCE.vi.md) (luồng đầy đủ, mẫu kết quả, tham số dòng lệnh, tool của agent, bảo mật, hạn chế).

<details>
<summary>Cài thành app trên Linux (biểu tượng trong menu)</summary>

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting && bash scripts/install-linux.sh
```

Tìm **Agent Meeting** trong menu ứng dụng. Gỡ: xoá `~/.local/share/agent-meeting`, `~/.local/share/applications/agent-meeting.desktop` và biểu tượng `agent-meeting.svg`.
</details>

## Đóng góp

Mọi báo lỗi, ý tưởng, tài liệu, bản dịch và pull request đều được chào đón: xem [CONTRIBUTING.md](CONTRIBUTING.md). Báo lỗ hổng theo [SECURITY.md](SECURITY.md).

MIT © ttat288
