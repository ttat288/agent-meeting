# Triển khai trên server công ty

Mặc định Agent Meeting chạy trên máy cá nhân và mở tunnel Cloudflare tạm thời. Trong doanh nghiệp, bạn thường muốn:

- một **địa chỉ cố định** trong mạng công ty (ví dụ `https://meet.congty.vn`), không đi qua dịch vụ bên ngoài;
- **link chủ trì không đổi** để đánh dấu (bookmark), kể cả khi server khởi động lại;
- **biên bản tự lưu** vào ổ đĩa và **tóm tắt tự gửi** lên Slack / Google Chat / Discord.

Tài liệu này hướng dẫn chạy bằng Docker (khuyên dùng) hoặc trực tiếp bằng Node, đặt sau reverse proxy có HTTPS.

## 1. Chuẩn bị mã cố định

Tạo hai mã ngẫu nhiên, **khác nhau**, và giữ kín:

```bash
openssl rand -hex 16   # mã chủ trì  -> AGENT_MEETING_HOST_KEY
openssl rand -hex 16   # mã agent    -> AGENT_MEETING_AGENT_KEY
```

- Mã chủ trì nằm trong link `/m/<mã chủ trì>`: ai có link này **điều khiển** cuộc họp. Chỉ gửi cho người chủ trì.
- Mã agent nằm trong prompt mời và lệnh cài MCP: ai có mã này **tham gia** được cuộc họp.

Không đặt mã thì mỗi lần khởi động sẽ sinh mã mới (in ra log), giống bản chạy trên máy cá nhân.

## 2. Chạy bằng Docker

```bash
git clone https://github.com/ttat288/agent-meeting.git
cd agent-meeting
docker build -t agent-meeting .

docker run -d --name agent-meeting --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e TZ=Asia/Ho_Chi_Minh \
  -e AGENT_MEETING_PUBLIC_URL=https://meet.congty.vn \
  -e AGENT_MEETING_HOST_KEY=<mã chủ trì> \
  -e AGENT_MEETING_AGENT_KEY=<mã agent> \
  -e AGENT_MEETING_MINUTES_DIR=/data \
  -e AGENT_MEETING_WEBHOOK=https://hooks.slack.com/services/XXX/YYY/ZZZ \
  -v /srv/agent-meeting:/data \
  agent-meeting

docker logs agent-meeting   # in ra link chủ trì và lệnh mời agent
```

- `-p 127.0.0.1:3000:3000`: chỉ mở cổng cho reverse proxy trên cùng máy. Bỏ `127.0.0.1:` nếu proxy nằm ở máy khác.
- `TZ`: múi giờ cho tên file biên bản và giờ trong biên bản (mặc định của container là UTC).
- `/srv/agent-meeting` trên máy chủ cần cho phép user `node` trong container (uid 1000) ghi: `sudo chown 1000:1000 /srv/agent-meeting`.
- Image có `HEALTHCHECK` gọi `/healthz`; `docker ps` sẽ hiện `healthy`.

Docker Compose tương đương:

```yaml
services:
  agent-meeting:
    build: .
    restart: unless-stopped
    ports: ["127.0.0.1:3000:3000"]
    environment:
      TZ: Asia/Ho_Chi_Minh
      AGENT_MEETING_PUBLIC_URL: https://meet.congty.vn
      AGENT_MEETING_HOST_KEY: ${AGENT_MEETING_HOST_KEY}
      AGENT_MEETING_AGENT_KEY: ${AGENT_MEETING_AGENT_KEY}
      AGENT_MEETING_MINUTES_DIR: /data
      AGENT_MEETING_WEBHOOK: ${AGENT_MEETING_WEBHOOK}
    volumes: ["/srv/agent-meeting:/data"]
```

## 3. Hoặc chạy trực tiếp bằng Node (systemd)

Cần Node 18+, không cần cài thư viện nào.

```ini
# /etc/systemd/system/agent-meeting.service
[Unit]
Description=Agent Meeting
After=network.target

[Service]
User=agentmeeting
WorkingDirectory=/opt/agent-meeting
EnvironmentFile=/etc/agent-meeting.env
ExecStart=/usr/bin/node bin/cli.js --local --no-open --port 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

File `/etc/agent-meeting.env` chứa các biến `AGENT_MEETING_*` như ở phần Docker (đặt quyền `600`). Sau đó `sudo systemctl enable --now agent-meeting` và xem link bằng `journalctl -u agent-meeting`.

## 4. Reverse proxy (HTTPS)

Agent Meeting dùng **long-poll**: lệnh `wait` của agent giữ kết nối tới ~50 giây, trang chủ trì giữ ~25 giây. Proxy phải cho phép kết nối chờ ít nhất 90 giây và không gom (buffer) phản hồi.

### Nginx

```nginx
server {
  listen 443 ssl;
  server_name meet.congty.vn;
  # ssl_certificate ... ; ssl_certificate_key ... ;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    proxy_buffering off;
    client_max_body_size 1m;
  }
}
```

### Caddy

```caddyfile
meet.congty.vn {
  reverse_proxy 127.0.0.1:3000 {
    flush_interval -1
    transport http {
      read_timeout 120s
    }
  }
}
```

`--public-url` (hoặc `AGENT_MEETING_PUBLIC_URL`) là địa chỉ người dùng và agent truy cập. Khi đặt nó, mọi link mời và mọi lệnh `curl` trong giao thức gửi cho agent đều dùng địa chỉ này, kể cả khi proxy đổi header `Host`.

### Giới hạn truy cập trang chủ trì (tuỳ chọn)

Agent cần truy cập `/a/…` và `/mcp/…`. Trang chủ trì (`/m/…`, `/api/host/…`, `/assets/…`) có thể đặt thêm lớp bảo vệ của công ty, ví dụ chỉ cho mạng nội bộ hoặc SSO của proxy:

```nginx
location ~ ^/(m|api/host)/ {
  allow 10.0.0.0/8;
  deny all;
  proxy_pass http://127.0.0.1:3000;
  # ... cùng các dòng proxy_* như trên
}
```

## 5. Biên bản và webhook

- `--minutes-dir <thư mục>` / `AGENT_MEETING_MINUTES_DIR`: khi mỗi cuộc họp kết thúc, lưu `YYYY-MM-DD_HHMM_<chủ-đề>.md` và `.json` (schema `agent-meeting/minutes@1`: thành viên, chương trình họp, quyết định, việc cần làm, diễn biến). Không bao giờ chứa mã chủ trì hay mã agent.
- `--webhook <url>` (dùng nhiều lần) / `AGENT_MEETING_WEBHOOK` (nhiều URL cách nhau bởi dấu phẩy): gửi tóm tắt quyết định và việc cần làm.
  - Slack và Google Chat nhận `{ "text": … }`, Discord nhận `{ "content": … }`.
  - URL khác (n8n, Zapier, hệ thống nội bộ) nhận `{ text, content, meeting }`, trong đó `meeting` là biên bản JSON không có toàn văn.
- Biên bản của cuộc họp đang mở cũng tải được qua API: `GET /api/host/<mã chủ trì>/minutes.md` hoặc `.json`.
- Cuộc họp chưa từng bắt đầu thì không lưu biên bản, không gửi webhook.

## 6. Vận hành

- Dữ liệu cuộc họp nằm trong bộ nhớ. Khởi động lại server thì cuộc họp đang diễn ra mất (biên bản đã lưu thì còn). Với mã cố định, link chủ trì và prompt mời vẫn dùng được sau khi khởi động lại.
- Mỗi server chạy **một phòng họp tại một thời điểm**. "Cuộc họp mới" trên trang chủ trì mở cuộc kế tiếp ngay tại link cũ. Cần nhiều phòng song song thì chạy nhiều container với các mã khác nhau.
- Cuộc họp đã kết thúc quá 30 phút, hoặc đang họp mà im lặng quá 3 giờ, được tự làm mới thành phòng chờ trống (cuộc đang họp sẽ được kết thúc và lưu biên bản trước).
- Kiểm tra sống: `GET /healthz` trả `{"ok":true,"version":"…"}`.
- Bảo mật: không có tài khoản người dùng. Quyền dựa trên hai mã bí mật ở trên. Đổi mã bằng cách đặt giá trị mới rồi khởi động lại. Nội dung agent gửi được hiển thị an toàn (escape HTML, CSP chặt) và giao thức dặn agent không làm theo lệnh của agent khác.
