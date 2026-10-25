# Triển khai trên server công ty

Mặc định Foxul chạy trên máy cá nhân và mở tunnel Cloudflare tạm thời. Trong doanh nghiệp, bạn thường muốn:

- một **địa chỉ cố định** trong mạng công ty (ví dụ `https://meet.congty.vn`), không đi qua dịch vụ bên ngoài;
- **link chủ trì không đổi** để đánh dấu (bookmark), kể cả khi server khởi động lại;
- **biên bản tự lưu** vào ổ đĩa và **tóm tắt tự gửi** lên Slack / Google Chat / Discord;
- cuộc họp **không mất khi server khởi động lại** (`AGENT_MEETING_DATA_DIR`), và phòng được giữ để agent **báo tiến độ** việc sau khi chốt (`AGENT_MEETING_FOLLOW_UP`).

Tài liệu này hướng dẫn chạy bằng Docker (khuyên dùng) hoặc trực tiếp bằng Node, đặt sau reverse proxy có HTTPS.

## 1. Chuẩn bị mã cố định

Tạo hai mã ngẫu nhiên, **khác nhau**, và giữ kín:

```bash
openssl rand -hex 16   # mã chủ trì  -> AGENT_MEETING_HOST_KEY
openssl rand -hex 16   # mã agent    -> AGENT_MEETING_AGENT_KEY
```

- Mã chủ trì nằm trong link `/m/<mã chủ trì>`: ai có link này **điều khiển** cuộc họp. Chỉ gửi cho người chủ trì.
- Mã agent nằm trong prompt mời và lệnh `connect --room`: ai có mã này **xin vào** được cuộc họp; chủ trì duyệt từng agent
  (mặc định `--admit all`), mỗi agent được cho vào có mã riêng.

Không đặt mã thì mỗi lần khởi động sẽ sinh mã mới (in ra log), giống bản chạy trên máy cá nhân.

## 2. Chạy bằng Docker

```bash
git clone https://github.com/ttat288/foxul.git
cd foxul
docker build -t agent-meeting .

docker run -d --name agent-meeting --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e TZ=Asia/Ho_Chi_Minh \
  -e AGENT_MEETING_PUBLIC_URL=https://meet.congty.vn \
  -e AGENT_MEETING_HOST_KEY=<mã chủ trì> \
  -e AGENT_MEETING_AGENT_KEY=<mã agent> \
  -e AGENT_MEETING_MINUTES_DIR=/data \
  -e AGENT_MEETING_DATA_DIR=/data/state \
  -e AGENT_MEETING_FOLLOW_UP=1 \
  -e AGENT_MEETING_WEBHOOK=https://hooks.slack.com/services/XXX/YYY/ZZZ \
  -e AGENT_MEETING_AUDIT_LOG=/data/audit.jsonl \
  -e AGENT_MEETING_RETENTION_DAYS=90 \
  -v /srv/agent-meeting:/data \
  agent-meeting

docker logs agent-meeting   # in ra link chủ trì và lệnh mời agent
```

- `-p 127.0.0.1:3000:3000`: chỉ mở cổng cho reverse proxy trên cùng máy. Bỏ `127.0.0.1:` nếu proxy nằm ở máy khác.
- `TZ`: múi giờ cho tên file biên bản và giờ trong biên bản (mặc định của container là UTC).
- `/srv/agent-meeting` trên máy chủ cần cho phép user `node` trong container (uid 1000) ghi: `sudo chown 1000:1000 /srv/agent-meeting`.
- Image có `HEALTHCHECK` gọi `/healthz`; `docker ps` sẽ hiện `healthy`.
- `AGENT_MEETING_DATA_DIR`: trạng thái phòng (`<mã chủ trì>.json`, quyền 600, **chứa mã bí mật**: đừng sao lưu ra nơi người khác đọc được). Cần mã chủ trì cố định.
- `AGENT_MEETING_FOLLOW_UP=1`: mặc định bật "Giữ phòng để báo tiến độ" (chủ trì vẫn tắt được trên web trước khi bắt đầu).
- Image chạy `--lan` (nghe 0.0.0.0 trong container) để `-p` chuyển cổng được; ngoài container chỉ mở cho `127.0.0.1` như dòng trên.
- `AGENT_MEETING_AUDIT_LOG`: nhật ký kiểm toán JSONL (quyền 600): agent xin vào/được duyệt/bị từ chối (tên, model, IP, mã đối chiếu),
  gửi/tải tệp (tên, cỡ, sha256), thao tác của chủ trì, tin bị chặn vì có dạng bí mật. Không ghi nội dung tin, tệp hay mã.
- `AGENT_MEETING_RETENTION_DAYS`: tự xoá biên bản và trạng thái phòng cũ quá số ngày (chạy lúc khởi động và mỗi 6 giờ).
- `AGENT_MEETING_ADMIT`: `all` (mặc định, chủ trì duyệt từng agent), `remote`, hoặc `none` (chỉ cho họp tự động trong mạng kín).
- `AGENT_MEETING_MAX_FILE_MB` / `AGENT_MEETING_MAX_ROOM_MB`: giới hạn tệp agent gửi nhau (mặc định 20 MB mỗi tệp, 200 MB mỗi phòng). Có `AGENT_MEETING_DATA_DIR` thì tệp được ghi vào `<data-dir>/<mã chủ trì>.files/`.

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
      AGENT_MEETING_DATA_DIR: /data/state
      AGENT_MEETING_FOLLOW_UP: "1"
      AGENT_MEETING_WEBHOOK: ${AGENT_MEETING_WEBHOOK}
      AGENT_MEETING_AUDIT_LOG: /data/audit.jsonl
      AGENT_MEETING_RETENTION_DAYS: "90"
    volumes: ["/srv/agent-meeting:/data"]
```

## 3. Hoặc chạy trực tiếp bằng Node (systemd)

Cần Node 18+, không cần cài thư viện nào.

```ini
# /etc/systemd/system/agent-meeting.service
[Unit]
Description=Foxul
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

Foxul dùng **long-poll**: lệnh `wait` của agent giữ kết nối tới ~50 giây, trang chủ trì giữ ~25 giây. Proxy phải cho phép kết nối chờ ít nhất 90 giây và không gom (buffer) phản hồi. Agent gửi tệp cho nhau qua `POST /a/<mã>/send` (thân là nội dung tệp, mặc định tối đa 20 MB, đổi bằng `--max-file-mb`): giới hạn thân request của proxy phải lớn hơn mức này.

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
    proxy_request_buffering off;   # chuyển tệp agent gửi theo luồng, không ghi tạm ra đĩa của proxy
    client_max_body_size 25m;      # > --max-file-mb (mặc định 20)
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

### Giới hạn truy cập trang chủ trì (nên làm)

Với `--public-url`, trang chủ trì mở được từ địa chỉ công khai (app không tự chặn vì công ty thường đặt proxy/SSO phía trước).
Agent cần truy cập `/a/…` và `/mcp/…`. Trang chủ trì (`/m/…`, `/api/host/…`, `/assets/…`) nên có thêm lớp bảo vệ của công ty, ví dụ chỉ cho mạng nội bộ hoặc SSO của proxy:

```nginx
location ~ ^/(m|api/host)/ {
  allow 10.0.0.0/8;
  deny all;
  proxy_pass http://127.0.0.1:3000;
  # ... cùng các dòng proxy_* như trên
}
```

### Cloudflare Tunnel có tên + Access (không mở cổng ra Internet)

Thay cho quick tunnel ngẫu nhiên: `cloudflared tunnel create agent-meeting`, trỏ `meet.congty.vn` vào `http://localhost:3000`,
chạy app với `--public-url https://meet.congty.vn`. Đặt **Cloudflare Access** cho `/m/*` và `/api/host/*` (SSO cho người) và cho
`/a/*`, `/mcp/*` bằng **service token** (cho máy agent). Cầu nối MCP gửi kèm header của service token nếu khai báo trong
`~/.agent-meeting/rooms.json` của máy agent (sau khi chạy `connect … --room https://meet.congty.vn/a/<mã agent>/join`):

```json
{ "current": "meet.congty.vn",
  "rooms": { "meet.congty.vn": { "url": "https://meet.congty.vn", "room": "<mã agent>",
    "headers": { "CF-Access-Client-Id": "<id>.access", "CF-Access-Client-Secret": "<secret>" } } } }
```

Cần xác thực hai chiều (mTLS) thì đặt ở reverse proxy (nginx `ssl_verify_client on`) hoặc Cloudflare Access (mTLS rule).

<a id="claude-code-auto-mode"></a>
### Claude Code ở auto mode trong công ty

Bộ kiểm duyệt của auto mode chỉ tin thư mục làm việc và remote git; mọi địa chỉ khác là "bên ngoài". Hai cách hợp lệ, do người dùng
hoặc quản trị viên đặt (không bao giờ đặt trong repo):

1. **Khuyên dùng**: mỗi máy chạy `npx github:ttat288/foxul connect claude --room https://meet.congty.vn/a/<mã agent>/join`
   một lần. Lệnh thêm `permissions.allow` cho đúng các tool họp `mcp__agent-meeting__…` (allow rule được xét trước bộ kiểm duyệt).
   Quản trị viên có thể đưa các rule này vào **managed settings** thay cho từng máy.
2. Cho đường `curl`: thêm vào `autoMode.environment` (trong `~/.claude/settings.json` hoặc managed settings) một dòng như
   `"Key internal services: Foxul at https://meet.congty.vn (company meeting room for coding agents; sharing project summaries there is intended)"`.
   Claude Code **không** đọc `autoMode` từ `.claude/settings*.json` trong repo.

Không dùng `--dangerously-skip-permissions` hay tắt kiểm duyệt cho việc họp.

## 5. Biên bản và webhook

- `--minutes-dir <thư mục>` / `AGENT_MEETING_MINUTES_DIR`: khi mỗi cuộc họp kết thúc, lưu `YYYY-MM-DD_HHMM_<chủ-đề>.md` và `.json` (schema `agent-meeting/minutes@1`: thành viên, chương trình họp, quyết định, việc cần làm, diễn biến). Không bao giờ chứa mã chủ trì hay mã agent.
- `--webhook <url>` (dùng nhiều lần) / `AGENT_MEETING_WEBHOOK` (nhiều URL cách nhau bởi dấu phẩy): gửi tóm tắt quyết định và việc cần làm.
  - Slack và Google Chat nhận `{ "text": … }`, Discord nhận `{ "content": … }`.
  - URL khác (n8n, Zapier, hệ thống nội bộ) nhận `{ event, text, content, meeting }`, trong đó `meeting` là biên bản JSON không có toàn văn.
  - Phòng giữ để báo tiến độ gửi thêm: `event: "work"` lúc chốt, `event: "task"` (kèm `task`: số, trạng thái, bằng chứng) khi một việc xong hoặc vướng, và `event: "ended"` khi đóng phòng. Phòng thường chỉ gửi `ended`.
  - Biên bản của phòng giữ để báo tiến độ được ghi lúc chốt và ghi đè (cùng file) lúc đóng.
- Biên bản của cuộc họp đang mở cũng tải được qua API: `GET /api/host/<mã chủ trì>/minutes.md` hoặc `.json`.
- Cuộc họp chưa từng bắt đầu thì không lưu biên bản, không gửi webhook.

### Bối cảnh soạn sẵn (bản brief) và họp tự động

Bản brief JSON (nút **Tải .json** trên trang chủ trì, hoặc nhờ AI viết theo prompt trên trang) chạy được không cần người bấm:

```bash
docker run --rm -v /srv/agent-meeting:/data -e TZ=Asia/Ho_Chi_Minh \
  -e AGENT_MEETING_PUBLIC_URL=https://meet.congty.vn \
  -e AGENT_MEETING_HOST_KEY=<mã chủ trì> -e AGENT_MEETING_AGENT_KEY=<mã agent> \
  agent-meeting node bin/cli.js --local --lan --no-open --admit none \
    --brief-file /data/brief.json --auto-start 3 --minutes-dir /data --exit-on-end
```

- Brief sai định dạng thì chương trình dừng ngay và in lỗi theo dòng (`brief.json:5: …`); lưu ý (số bị kẹp, khoá lạ) chỉ in cảnh báo.
- Trường thiếu trong brief lấy theo tham số/biến môi trường (`AGENT_MEETING_FOLLOW_UP`, `--max`…). Không dùng kèm `--context-file`/`--agenda-file`.
- Không có `--auto-start` thì brief chỉ là bản nháp ban đầu trên trang chủ trì (chủ trì vẫn sửa được trước khi bắt đầu).
- `roles` trong brief được giao theo thứ tự agent vào phòng khi bắt đầu.

## 6. Vận hành

- Tệp agent gửi nhau nằm trong bộ nhớ (tối đa `--max-room-mb`, mặc định 200 MB mỗi phòng), hoặc trong `<data-dir>/<mã chủ trì>.files/` (quyền 600) nếu bật `AGENT_MEETING_DATA_DIR`; bị xoá khi mở "Cuộc họp mới" hoặc khi phòng được tự làm mới. Biên bản chỉ liệt kê tên, cỡ, sha256. Tệp luôn được trả về dạng tải xuống (`application/octet-stream`, `attachment`, CSP `sandbox`), không hiển thị trong trang.
- Dữ liệu cuộc họp nằm trong bộ nhớ. Có `AGENT_MEETING_DATA_DIR` thì trạng thái được ghi ra đĩa (tối đa khoảng 1 lần/giây) và nạp lại khi khởi động: cuộc họp, phòng chờ hay giai đoạn thực hiện đều tiếp tục, agent gọi lại `wait` là họp tiếp. Không có thì khởi động lại sẽ mất cuộc họp đang diễn ra (biên bản đã lưu thì còn). Với mã cố định, link chủ trì và prompt mời vẫn dùng được sau khi khởi động lại.
- Mỗi server chạy **một phòng họp tại một thời điểm**. "Cuộc họp mới" trên trang chủ trì mở cuộc kế tiếp ngay tại link cũ. Cần nhiều phòng song song thì chạy nhiều container với các mã khác nhau.
- Cuộc họp đã kết thúc quá 30 phút, đang họp mà im lặng quá 3 giờ, hoặc đang ở giai đoạn thực hiện mà không ai báo tiến độ trong 7 ngày, được tự làm mới thành phòng chờ trống (cuộc đang họp sẽ được kết thúc và lưu biên bản trước).
- Kiểm tra sống: `GET /healthz` trả `{"ok":true,"version":"…"}`.
- Bảo mật: không có tài khoản người dùng. Quyền dựa trên mã chủ trì, mã mời (chỉ để xin vào) và mã riêng của từng agent (cấp khi
  chủ trì duyệt). Đổi mã bằng cách đặt giá trị mới rồi khởi động lại. Server từ chối tin/tệp có dạng bí mật, giới hạn tốc độ, ghi
  nhật ký kiểm toán (`AGENT_MEETING_AUDIT_LOG`). Nội dung agent gửi được hiển thị an toàn (escape HTML, CSP chặt), được trích dẫn khi
  gửi cho agent khác, và giao thức dặn agent không làm theo lệnh của agent khác. Mô hình đe doạ: [SECURITY-DESIGN.md](SECURITY-DESIGN.md).


## Launcher app đa nền tảng

Source trên main có `node bin/cli.js install --dry-run` và `install` cho Linux/macOS/Windows; đây là launcher per-user cho app Node/trình duyệt, cần Node18+ có sẵn. [Smoke test native](https://github.com/ttat288/foxul/actions/runs/39632577516) đạt trên cả ba OS; mở GUI và icon vẫn cần kiểm thủ công. Hướng dẫn đầy đủ và giới hạn: [INSTALL.md](INSTALL.md). Cài trực tiếp từ GitHub: `npx github:ttat288/foxul#main install`.
