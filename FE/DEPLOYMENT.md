# Hướng dẫn Deploy eParking Frontend

## Cách 1: Deploy sử dụng Build Folder (Khuyến nghị)

### Bước 1: Build project

```bash
# Trên máy local
cd FE
npm install
npm run build
```

### Bước 2: Copy build folder

- Copy toàn bộ nội dung folder `build/` lên server
- Đặt vào thư mục web root của server (ví dụ: `/var/www/html/` hoặc `public_html/`)

### Bước 3: Cấu hình server

- Đảm bảo server có thể serve static files
- Cấu hình URL rewriting cho React Router (nếu cần)

## Cách 2: Deploy trực tiếp trên server

### Bước 1: Upload source code

- Upload toàn bộ folder `FE/` lên server

### Bước 2: Cài đặt Node.js và npm

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm

# Hoặc sử dụng Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Bước 3: Build trên server

```bash
cd FE
npm install
npm run build
```

### Bước 4: Serve build folder

```bash
# Cài đặt serve globally
npm install -g serve

# Serve build folder
serve -s build -l 3000
```

## Cách 3: Sử dụng Docker

### Bước 1: Tạo Dockerfile

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Bước 2: Build và run Docker

```bash
docker build -t eparking-frontend .
docker run -p 80:80 eparking-frontend
```

## Lưu ý quan trọng

1. **Environment Variables**: Đảm bảo các biến môi trường cần thiết được cấu hình
2. **API Endpoints**: Cập nhật URL API trong code nếu cần
3. **HTTPS**: Sử dụng HTTPS cho production
4. **Caching**: Cấu hình caching cho static files
5. **Compression**: Bật gzip compression

## Troubleshooting

### Lỗi "react-scripts: command not found"

- Đảm bảo đã chạy `npm install`
- Kiểm tra `node_modules/.bin/` có trong PATH
- Hoặc sử dụng `npx react-scripts build`

### Lỗi build

- Kiểm tra Node.js version (khuyến nghị 16+)
- Xóa `node_modules` và `package-lock.json`, sau đó chạy lại `npm install`
- Kiểm tra log lỗi chi tiết

### Lỗi deployment

- Đảm bảo server có đủ quyền ghi
- Kiểm tra cấu hình web server
- Kiểm tra firewall và port
