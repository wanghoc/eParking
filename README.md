# eParking System

Hệ thống quản lý bãi xe thông minh, nhận diện biển số tự động, quản lý ví và thanh toán.

## 🔑 Tính năng chính (rút gọn)

- Đăng ký/đăng nhập bằng MSSV, quản lý thông tin cá nhân và phương tiện
- Quản lý nhiều xe, lịch sử gửi xe, lịch sử thanh toán
- Quản lý camera (thêm/sửa/xóa), xem luồng camera trực tiếp
- Tự động nhận diện biển số (YOLO + EasyOCR) realtime qua Socket.IO
- Tính phí, trừ tiền ví, cảnh báo số dư thấp
- Dashboard admin: thống kê, quản lý người dùng, phương tiện, camera

## 🧱 Công nghệ chính

- Frontend: React 18 + TypeScript, Tailwind CSS, React Router
- Backend: Node.js (Express), Prisma ORM, PostgreSQL, FFmpeg
- ML Detector: Python, YOLO, EasyOCR, OpenCV (chạy trong container backend)
- Hạ tầng: Docker, Docker Compose, Nginx, Prisma Studio

## 📁 Cấu trúc thư mục

```bash
eParking/
├── FE/          # Frontend React
├── BE/          # Backend Node.js + ML detector
├── docker-compose.yml
└── README.md
```

## 🚀 Cách chạy nhanh bằng Docker (khuyến nghị)

### 1. Yêu cầu

- Đã cài Docker Desktop (bao gồm Docker Compose)

### 2. Khởi động hệ thống

Trong thư mục gốc `eParking/`:

```bash
docker-compose up -d
```

Lần đầu nếu muốn build lại sạch:

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 3. Truy cập các dịch vụ

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Prisma Studio: `http://localhost:5555`
- Detector (Socket.IO + HTTP): `http://localhost:5001`

> Database chạy trong container PostgreSQL, được cấu hình sẵn qua `docker-compose.yml`.

## ⚙️ Cấu hình môi trường (chạy ngoài Docker)

Nếu muốn chạy thủ công (dev không dùng Docker), cần:

1. Tạo file `.env` trong `BE/` (ví dụ):

```env
DATABASE_URL="postgresql://username:password@localhost:5432/eparking"
PORT=5000
```

2. Cài đặt backend:

```bash
cd BE
npm install
npm run prisma:migrate   # nếu có script tương ứng trong package.json
npm start
```

3. Cài đặt ML detector (tuỳ chọn nếu không dùng Docker):

```bash
cd BE
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements_ml.txt
python ml_models/utils/websocket_detector.py
```

4. Cài đặt frontend:

```bash
cd FE
npm install
npm run dev
```

## 🧪 Cách sử dụng nhanh trong giao diện

1. Mở trình duyệt tới `http://localhost:3000`.
2. Đăng ký tài khoản bằng MSSV + email, sau đó đăng nhập.
3. Vào mục **Quản lý xe** để thêm phương tiện (biển số, nhãn hiệu, mẫu xe).
4. Nạp tiền ví (mock/giả lập theo UI hiện có) trong trang **Ví/Thanh toán**.
5. Vào **Quản lý camera** để thêm camera (RTSP/HTTP/ONVIF, v.v.).
6. Mở **Luồng camera trực tiếp / Live camera** để xem stream; hệ thống sẽ tự gửi khung hình lên Detector và hiển thị biển số nhận diện realtime.
7. Kiểm tra **Lịch sử gửi xe** và **Lịch sử giao dịch** để xem lại phiên gửi xe và thanh toán.

## 🐛 Troubleshooting ngắn gọn

- Container không chạy: dùng `docker-compose ps` và `docker-compose logs` để xem lỗi.
- Frontend không mở: kiểm tra container frontend, thử `docker-compose restart frontend`.
- Backend không kết nối DB: kiểm tra container PostgreSQL, biến `DATABASE_URL`.
- Live camera không thấy biển số: kiểm tra URL camera, băng thông, và logs detector (cổng 5001).

## 📄 Ghi chú
Giảng viên hướng dẫn:
KS. Nguyễn Trọng Hiếu
Nhóm tác giả:
2212375	Triệu Quang Học - 22123752dlu.edu.vn
2212343	Đinh Lâm Gia Bảo - 22123752dlu.edu.vn
2212456	Lê Thành Thái - 22123752dlu.edu.vn

