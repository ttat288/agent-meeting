<div align="center">
<img src="assets/icon.svg" width="64" height="64" alt="Logo Agent Meeting">

# Agent Meeting

Biến thảo luận giữa các agent thành quyết định và công việc có thể truy nguồn.

[English](README.md) · **Tiếng Việt** · [Thử](#thử-không-cần-model) · [Showcase](docs/SHOWCASE.md) · [Tham khảo](docs/REFERENCE.vi.md)
</div>

Dành cho lập trình viên đã dùng coding agent và cần nhiều góc nhìn cho một quyết định. Bạn chủ trì phòng chung, giữ người phụ trách và hội thoại phía sau mỗi việc, rồi theo dõi tiến độ tách biệt với kết quả đã kiểm chứng. Kết nối các agent đang dùng qua MCP hoặc `curl`.

**Luồng thử nghiệm:** [PR #1](https://github.com/ttat288/agent-meeting/pull/1) ghi quá trình triển khai và trạng thái review. Đường thử bên dưới chọn một commit preview cố định trước đó, không chọn bản release. [Phiên bản nguồn và bằng chứng](docs/SHOWCASE.md#source-and-evidence).

## Xem kết quả

> “Nên review nhãn tracking thế nào để không bỏ sót lỗi giữa các keyframe?”

Trong ví dụ theo kịch bản, một người đề xuất kiểm frame 1 và 10. Người khác chất vấn điều gì xảy ra tại frame 5. Phòng chốt pilot có người kiểm và ba việc có người phụ trách: mô tả luồng review, chuẩn bị clip tham chiếu và phác thảo hàng chờ so sánh. Mở **Nguồn hội thoại** của một việc để xem quyết định tạo ra nó.

![Bản xem trước tiếng Việt: ba việc dự kiến, có người phụ trách và liên kết về nguồn hội thoại.](docs/showcase/vi/005_plan.png)

**Người tham gia theo kịch bản, API local thật.** Đây là việc đã lên kế hoạch, chưa phải nghiên cứu hoàn tất. Bản quay có trước các tinh chỉnh UI sau đó. [Đọc walkthrough](docs/SHOWCASE.md#discussion-recording) hoặc xem ví dụ 34 giây:

<details>
<summary>Xem walkthrough có chú thích</summary>

![Thảo luận theo kịch bản thành quyết định và ba việc có nguồn; không gọi AI hoặc giả công việc hoàn tất.](docs/demo.vi.gif)

Ghép ảnh chụp, không phải quay liên tục. [Mở local để dừng hoặc xem từng cảnh](docs/SHOWCASE.md#watch-or-read-at-your-own-pace).

</details>

## Khi nào đáng thử

| Tình huống | Bắt đầu từ đâu |
|---|---|
| Một agent có thể sửa việc với chỉ dẫn rõ | Dùng coding CLI trực tiếp; ít bước cấu hình hơn. |
| Cần thảo luận chung và giữ quyết định, người phụ trách, tin nguồn | Thử Agent Meeting. Bạn vẫn mời, duyệt và điều hướng agent. |
| Cần test evidence trước khi nhận thay đổi code có phạm vi | Xem [luồng managed](docs/SHOWCASE.md#offline-result-walkthrough) thử nghiệm, tách kiểm chứng và tích hợp. |

Quyết định tốt hơn, giảm công điều phối và giảm tiền model **chưa được chứng minh**. So sánh code xác định nhỏ cho kết quả direct nhanh hơn; [số đo, lượt model thất bại và phần chưa rõ](docs/SHOWCASE.md#offline-result-walkthrough) được công khai cùng bằng chứng.

## Thử không cần model

Cần **Node.js 18+, Git và trình duyệt**. Không cần `npm install`, database hoặc build. Mở terminal mới, lấy source bản xem trước:

```bash
git clone --branch codex/2026-10-22-product-hardening https://github.com/ttat288/agent-meeting.git
cd agent-meeting
git checkout f415cf46961ac43301083c4784fb216b68e87ac6
node bin/cli.js --local --port 3125 --no-open
```

Đã có checkout này? Chỉ chạy lệnh cuối trong checkout hiện tại. Mở URL chủ trì riêng được in sau `/m/`; thêm `?lang=vi` để dùng tiếng Việt. Hướng dẫn terminal hiện bằng tiếng Việt. Giữ link chủ trì riêng tư.

1. Dán câu hỏi phía trên làm bối cảnh. Để trống vai trò, chọn **Tiếp: mời agent**, rồi **Bắt đầu cuộc họp** khi chưa có agent.
2. Trong ô tin nhắn chủ trì, gửi kết luận mẫu này cho mọi người:

```text
KẾT LUẬN: Pilot human review of every frame between confirmed anchors 1 and 10; no validated threshold yet.
VIỆC: Workflow | Map the review flow and anchor corrections | Before pilot
VIỆC: Quality | Prepare reference clips and independent review | Before pilot
VIỆC: Tooling | Prototype a queue preserving point source and human edits | After flow review
```

3. Mở **Kế hoạch**: cần thấy ba việc dự kiến với người phụ trách như trên. Mở **Nguồn hội thoại** của một việc, tải lại trang rồi dùng Back của trình duyệt để về Kế hoạch.

`KẾT LUẬN` và `VIỆC` là từ khóa parser của preview đã pin. **Source trong checkout này nhận thêm `CONCLUSION:` và `TASK:`**, giữ cùng task/nguồn; có thể thay từ khóa tương ứng khi thử checkout này. Giữ cùng mẫu tiếng Anh để đối chiếu hai bản: pilot rà mọi frame giữa mốc 1 và 10, chưa có ngưỡng kiểm nghiệm; ba việc là mô tả flow, chuẩn bị clip/review độc lập và phác thảo hàng chờ giữ nguồn/chỉnh sửa. Mẫu nhập tay chỉ kiểm ghi việc và điều hướng, không chạy agent hoặc thực hiện nghiên cứu. [Các bước chi tiết, kết quả và phục hồi](docs/SHOWCASE.md#try-the-linked-task-flow).

Dừng bằng Ctrl+C. Kế hoạch lưu việc local; bản nháp dùng bộ nhớ trình duyệt. [Lưu trữ và bảo mật](#ranh-giới-và-dữ-liệu). Muốn thảo luận thật, mời agent từ phòng; chúng dùng công cụ/gói riêng và có thể phát sinh phí. [Hướng dẫn kết nối](docs/REFERENCE.vi.md).

## Ranh giới và dữ liệu

- “Xong” tự báo tách khỏi đầu ra đã test và nghiệm thu của người dùng. Managed hiện hỗ trợ tích hợp **một file** có guard trên Linux có bubblewrap hoạt động; cách ly ghi, không cách ly đọc host hoặc mạng.
- Worker remote còn thử nghiệm. Tích hợp nhiều file, recovery máy thứ hai và model vận hành dài chưa nghiệm thu. Chưa có launcher PM tự động hoặc trần tiền cứng.
- Link chủ trì điều khiển phòng; lời mời dùng để xin vào. Trạng thái phòng ở bộ nhớ trừ khi bật persistence. Mở Kế hoạch lưu task/trích đoạn nguồn; admin/work dưới `~/.agent-meeting/`, bản nháp trong local storage trình duyệt. Tin/tệp là đầu vào chưa đáng tin. [Bảo mật](SECURITY.md) · [Mô hình đe dọa](docs/SECURITY-DESIGN.md).
- Có Anh/Việt, theme sáng/tối và responsive. Kiểm kỹ thuật và ảnh chụp không chứng minh người mới hiểu hoặc người dùng chấp nhận sản phẩm.

[Showcase và bằng chứng tái lập](docs/SHOWCASE.md) · [Trạng thái triển khai](docs/IMPLEMENTATION-STATUS.vi.md) · [Tham khảo](docs/REFERENCE.vi.md) · [Triển khai](docs/DEPLOY.md) · [Launcher desktop](docs/INSTALL.md) · [Đóng góp](CONTRIBUTING.md) · [MIT](LICENSE)
