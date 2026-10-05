#!/bin/bash
set -e

echo "=========================================="
echo "  TRIỂN KHAI HGC SOLAR ENGINE TRÊN VPS    "
echo "=========================================="

echo "1. Cài đặt các thư viện mới nhất..."
npm install

echo "2. Build Frontend (dist/) và Backend (server.js)..."
# Xóa sạch thư mục dist cũ để tránh lỗi EACCES quyền root
rm -rf dist 2>/dev/null || sudo rm -rf dist 2>/dev/null || true
npm run build

echo "3. Đảm bảo thư mục dữ liệu tồn tại..."
mkdir -p data_storage

# Kiểm tra trạng thái PostgreSQL
if command -v psql >/dev/null 2>&1; then
  echo "✓ Đã phát hiện PostgreSQL trên VPS!"
else
  echo "! Lưu ý: PostgreSQL chưa được cài đặt trên VPS. Nếu bạn muốn dùng Database chuyên dụng, hãy chạy:"
  echo "  sudo apt update && sudo apt install -y postgresql postgresql-contrib"
  echo "  sudo -u postgres psql -c \"CREATE DATABASE hgc_solar;\""
fi

echo "4. Khởi động lại dịch vụ Node.js qua PM2 (chạy server.js chuẩn Production)..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list | grep -q "hgc-solar"; then
    pm2 delete hgc-solar || true
  fi
  pm2 start server.js --name "hgc-solar" --update-env
  pm2 save
  echo "✓ PM2 đã khởi động tiến trình 'hgc-solar' (server.js) thành công!"
else
  echo "PM2 chưa được cài đặt toàn cục. Hãy chạy: npm install -g pm2"
fi

echo "=========================================="
echo "  TRIỂN KHAI HOÀN TẤT THÀNH CÔNG!         "
echo "=========================================="
