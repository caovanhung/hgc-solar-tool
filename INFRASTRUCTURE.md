# HƯỚNG DẪN TRIỂN KHAI HẠ TẦNG (INFRASTRUCTURE & DEPLOYMENT GUIDE)
## HỆ THỐNG THIẾT KẾ & BÁO GIÁ ĐIỆN MẶT TRỜI HGC SOLAR

Tài liệu này hướng dẫn chi tiết từng bước để triển khai hệ thống **HGC Solar Design & Quotation Tool** lên máy chủ vật lý, Cloud VPS (AWS EC2, Google Cloud Compute Engine, DigitalOcean, Hetzner, Linode, Viettel IDC, FPT Cloud...) thông qua 2 phương án:
1. **Phương án 1 (Khuyên dùng):** Triển khai tự động bằng **Docker & Docker Compose** (đã tích hợp Nginx và SSL Let's Encrypt).
2. **Phương án 2:** Triển khai **thủ công (Manual)** trực tiếp trên hệ điều hành Linux (Ubuntu / Debian) sử dụng **Node.js 22 + PM2 / Systemd + Nginx Reverse Proxy + Certbot SSL**.

---

## 1. YÊU CẦU CẤU HÌNH HỆ THỐNG (SYSTEM REQUIREMENTS)

| Thành phần | Cấu hình tối thiểu | Cấu hình khuyến nghị |
| :--- | :--- | :--- |
| **Hệ điều hành** | Ubuntu 22.04 LTS / Debian 12 / AlmaLinux 9 | Ubuntu 24.04 LTS / Debian 12 |
| **CPU** | 1 Core (vCPU) | 2 Cores hoặc 4 Cores |
| **RAM** | 1 GB RAM (kèm 1GB Swap) | 2 GB - 4 GB RAM |
| **Ổ cứng (SSD/NVMe)** | 10 GB dung lượng trống | 25 GB - 50 GB NVMe |
| **Mạng & Cổng mở** | Port 80 (HTTP), 443 (HTTPS), 3000 (Internal) | Băng thông 100Mbps - 1Gbps |

---

## 2. PHƯƠNG ÁN 1: TRIỂN KHAI QUA DOCKER & DOCKER COMPOSE (KHUYÊN DÙNG)

Đây là phương pháp triển khai tiêu chuẩn, cô lập môi trường, không lo xung đột phiên bản Node.js và dễ dàng sao lưu di chuyển máy chủ.

### Bước 1: Cài đặt Docker & Docker Compose trên VPS (Ubuntu/Debian)

Chạy các lệnh sau trên terminal của VPS:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các gói phụ trợ
sudo apt install -y curl git apt-transport-https ca-certificates gnupg lsb-release

# 3. Cài đặt Docker Engine & Docker Compose Plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Cấp quyền chạy docker không cần sudo cho user hiện tại
sudo usermod -aG docker $USER
newgrp docker

# 5. Kiểm tra phiên bản
docker --version
docker compose version
```

---

### Bước 2: Tải Mã Nguồn Về Máy Chủ

```bash
# Tạo thư mục ứng dụng
mkdir -p /var/www
cd /var/www

# Clone mã nguồn từ Git repo của bạn
git clone <URL_GIT_REPOSITORY> hgc-solar
cd /var/www/hgc-solar
```

---

### Bước 3: Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
nano .env
```

Nội dung `.env`:
```env
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com
```

---

### Bước 4: Khởi Chạy Hệ Thống

#### Cách 1A: Chạy Nhanh Độc Lập Container App (Port 3000)
Nếu bạn đã có sẵn Nginx trên VPS hoặc dùng Cloudflare Tunnel / Traefik:

```bash
# Build và chạy container trong chế độ nền
docker compose up -d --build solar-app

# Kiểm tra container đang chạy
docker ps
```
Ứng dụng sẽ hoạt động tại địa chỉ: `http://IP_SERVER:3000`.

---

#### Cách 1B: Chạy Trọn Bộ Gồm App + Nginx Reverse Proxy + SSL Tự Động (Port 80/443)
File `docker-compose.yml` và `nginx/conf.d/app.conf` đã được chuẩn bị sẵn:

1. Chỉnh sửa tên miền của bạn trong file cấu hình Nginx:
```bash
nano nginx/conf.d/app.conf
```
*(Thay thế toàn bộ `yourdomain.com` thành tên miền thật của bạn, ví dụ `solar.etekpower.vn` hoặc `solar.hgc.vn`)*.

2. Khởi động toàn bộ cụm dịch vụ:
```bash
docker compose up -d --build
```

3. Cấp chứng chỉ SSL miễn phí Let's Encrypt (Chạy 1 lần duy nhất):
```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email your-email@gmail.com --agree-tos --no-eff-email
```

4. Khởi động lại Nginx để áp dụng SSL:
```bash
docker compose restart nginx
```

---

### Các Lệnh Quản Trị Docker Thường Dùng:

```bash
# Xem log ứng dụng thời gian thực
docker compose logs -f solar-app

# Khởi động lại ứng dụng
docker compose restart solar-app

# Dừng toàn bộ hệ thống
docker compose down

# Cập nhật phiên bản mới nhất từ Git
git pull
docker compose up -d --build solar-app
```

---

## 3. PHƯƠNG ÁN 2: TRIỂN KHAI THỦ CÔNG TRỰC TIẾP TRÊN VPS (MANUAL NATIVE)

Thích hợp nếu bạn muốn chạy trực tiếp bằng **Node.js** và quản lý tiến trình bằng **PM2** hoặc **Systemd**.

### Bước 1: Cài đặt Node.js 22 LTS

```bash
# Cài đặt Node.js 22 thông qua NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx

# Kiểm tra phiên bản (yêu cầu Node 22+)
node -v    # Phải ra v22.x.x
npm -v     # Phải ra 10.x.x
```

---

### Bước 2: Tải Mã Nguồn & Cài Đặt Thư Viện

```bash
sudo mkdir -p /var/www/hgc-solar
sudo chown -R $USER:$USER /var/www/hgc-solar

cd /var/www/hgc-solar
git clone <URL_GIT_REPOSITORY> .

# Cài đặt thư viện dependencies
npm ci
```

---

### Bước 3: Đóng Gói Ứng Dụng (Production Build)

```bash
# Biên dịch Frontend SPA & tối ưu assets vào thư mục dist/
npm run build
```

Kiểm tra thư mục `dist/` đã có file `index.html` và `assets/`.

---

### Bước 4: Chạy Ứng Dụng Chế Độ Nền

Bạn có thể chọn 1 trong 2 cách sau:

#### Cách 4A: Quản lý tiến trình bằng PM2 (Rất tiện lợi, tự động restart khi crash)

```bash
# Cài đặt PM2 toàn cục
sudo npm install -g pm2

# Khởi chạy ứng dụng
pm2 start npm --name "hgc-solar" -- run start

# Lưu danh sách tiến trình để tự động bật khi reboot VPS
pm2 save
pm2 startup
# (Chạy lệnh sudo env PATH=... mà PM2 in ra màn hình)
```

Các lệnh quản trị PM2:
```bash
pm2 status          # Xem trạng thái
pm2 logs hgc-solar  # Xem log chi tiết
pm2 restart hgc-solar # Khởi động lại
```

---

#### Cách 4B: Quản lý bằng Systemd Service của Linux

1. Tạo file dịch vụ `/etc/systemd/system/hgc-solar.service`:
```bash
sudo nano /etc/systemd/system/hgc-solar.service
```

Dán nội dung sau vào:
```ini
[Unit]
Description=HGC Solar Quotation & Design Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/hgc-solar
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hgc-solar

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

2. Kích hoạt và bật dịch vụ:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hgc-solar

# Kiểm tra trạng thái
sudo systemctl status hgc-solar
```

---

### Bước 5: Cấu Hình Nginx Reverse Proxy & Tên Miền

1. Tạo file cấu hình Nginx:
```bash
sudo nano /etc/nginx/sites-available/hgc-solar
```

Dán nội dung sau:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    # Gzip nén dữ liệu tăng tốc độ tải
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Kích hoạt website trong Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/hgc-solar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### Bước 6: Cài Đặt Chứng Chỉ SSL HTTPS Miễn Phí (Certbot Let's Encrypt)

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tự động lấy chứng chỉ và cấu hình HTTPS cho Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot sẽ tự động thiết lập gia hạn SSL định kỳ (auto-renew) mà bạn không cần phải làm gì thêm!

---

## 4. QUY TRÌNH NÂNG CẤP & CẬP NHẬT CODE MỚI (CI/CD / UPDATE)

Mỗi khi có cập nhật tính năng mới từ kho Git, thực hiện 3 lệnh sau:

### Với Docker:
```bash
cd /var/www/hgc-solar
git pull origin main
docker compose up -d --build solar-app
```

### Với Manual (PM2):
```bash
cd /var/www/hgc-solar
git pull origin main
npm ci
npm run build
pm2 restart hgc-solar
```

---

## 5. BẢO MẬT & KIỂM TRA SỨC KHỎE (SECURITY & HEALTH CHECK)

### 1. Bật Tường Lửa UFW Trên Server Linux
Chỉ mở các cổng cần thiết (SSH, HTTP, HTTPS):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # Cổng SSH
sudo ufw allow 80/tcp      # Cổng HTTP
sudo ufw allow 443/tcp     # Cổng HTTPS
sudo ufw enable
```

### 2. Endpoint Kiểm Tra Uptime & Sức Khỏe (Health Check)
Ứng dụng có sẵn REST API health check tại:
```
GET http://localhost:3000/api/health
```
Kết quả phản hồi JSON:
```json
{
  "status": "ok",
  "uptime": 14205.2,
  "projectsCount": 12,
  "timestamp": "2026-10-05T03:15:00.000Z"
}
```
Bạn có thể tích hợp endpoint này vào các dịch vụ giám sát miễn phí như **UptimeRobot**, **StatusCake**, hoặc **Grafana/Prometheus** để nhận cảnh báo qua Telegram/Email nếu máy chủ gặp sự cố.
