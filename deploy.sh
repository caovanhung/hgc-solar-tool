#!/bin/bash
set -e

echo "=========================================="
echo "  TRIỂN KHAI HGC SOLAR ENGINE TRÊN VPS    "
echo "=========================================="

echo "1. Cài đặt các thư viện mới nhất..."
npm install

echo "2. Build Frontend (dist/) và Backend (server.js)..."
npm run build

echo "3. Đảm bảo thư mục data_storage tồn tại..."
mkdir -p data_storage

echo "4. Khởi động lại dịch vụ Node.js qua PM2..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list | grep -q "hgc-solar"; then
    pm2 restart hgc-solar --update-env
  else
    pm2 start server.js --name "hgc-solar"
  fi
  pm2 save
  echo "✓ PM2 đã khởi động lại tiến trình 'hgc-solar' thành công!"
else
  echo "PM2 chưa được cài đặt toàn cục. Hãy chạy: npm install -g pm2"
fi

echo "=========================================="
echo "  TRIỂN KHAI HOÀN TẤT THÀNH CÔNG!         "
echo "=========================================="
