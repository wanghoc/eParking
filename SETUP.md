# Hướng dẫn SETUP hệ thống eParking

## 1. Thành phần cài đặt chính

### 1.1. Mã nguồn

- Thư mục `FE/`: Frontend React (giao diện web người dùng và admin).
- Thư mục `BE/`: Backend Node.js + Prisma + ML detector (nhận diện biển số).
- Tập tin `docker-compose.yml`: Định nghĩa các service (frontend, backend, database, detector, nginx…).
- Tập tin `README.md`: Giới thiệu nhanh + hướng dẫn chạy.

### 1.2. Công cụ yêu cầu

**Cách 1 – Khuyến nghị (dùng Docker):**
- Docker Desktop (Windows) – đã bao gồm Docker Engine & Docker Compose.

**Cách 2 – Chạy thủ công (dùng cho dev, khi không dùng Docker):**
- Node.js LTS (>= 18).
- Python 3.10+ (cho detector YOLO + EasyOCR).
- PostgreSQL 14+ (nếu tự cài DB ngoài Docker).
- Git (để clone repository nếu cần).

---

## 2. Cách cài đặt & chạy hệ thống

### 2.1. Setup nhanh bằng Docker (đầy đủ các thành phần)

1. Mở terminal tại thư mục gốc `eParking/`.
2. Chạy lệnh:

```bash
docker-compose up -d
```

3. Đợi các container build & start xong, sau đó truy cập:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - Prisma Studio: `http://localhost:5555`
   - Detector (Socket.IO + HTTP): `http://localhost:5001`

> Tất cả cấu hình database, network nội bộ, volume dữ liệu… đã được định nghĩa trong `docker-compose.yml`. Không cần cài PostgreSQL thủ công.

### 2.2. Setup thủ công (trường hợp không dùng Docker)

> Chỉ nên dùng khi bắt buộc
#### 2.2.1. Chuẩn bị Database

1. Cài PostgreSQL trên máy.
2. Tạo database mới, ví dụ tên: `eparking`.
3. Lấy connection string tương ứng, ví dụ:

```env
postgresql://username:password@localhost:5432/eparking
```

4. Tạo file `.env` trong thư mục `BE/` với nội dung tối thiểu:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/eparking"
PORT=5000
```

#### 2.2.2. Backend + Prisma

1. Cài dependencies backend:

```bash
cd BE
npm install
```

2. Chạy migration Prisma để tạo bảng:

```bash
npx prisma migrate deploy
```

(hoặc `npm run prisma:migrate` nếu đã cấu hình sẵn trong `package.json`).

3. Seed dữ liệu mẫu (nếu có script `seed` trong `BE/prisma/seed.js`):

```bash
node prisma/seed.js
```

4. Khởi động server backend:

```bash
npm start
```

#### 2.2.3. ML Detector (Python)

1. Tạo virtualenv và cài thư viện ML:

```bash
cd BE
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements_ml.txt
```

2. Khởi động websocket detector:

```bash
python ml_models/utils/websocket_detector.py
```

Detector sẽ lắng nghe trên cổng `5001` (Socket.IO + HTTP).

#### 2.2.4. Frontend React

1. Cài dependencies frontend:

```bash
cd FE
npm install
```

2. Chạy chế độ dev:

```bash
npm run dev
```

Mở trình duyệt tới `http://localhost:3000`.

> Lưu ý: đảm bảo URL backend/detector trong `FE/src/api.ts` và các file cấu hình trỏ đúng host/port.

---

## 3. Dữ liệu thử và thành phần liên quan

### 3.1. Cấu trúc dữ liệu trong database

Cấu trúc bảng được định nghĩa trong:
- `BE/prisma/schema.prisma`

Các migration (tạo/cập nhật bảng) nằm trong:
- `BE/prisma/migrations/`

Script seed dữ liệu mẫu (nếu dùng):
- `BE/prisma/seed.js`

### 3.2. Mô hình và cấu hình ML

- `BE/ml_models/plate_detector/best.pt`: mô hình YOLO phát hiện vùng biển số.
- `BE/ml_models/plate_detector/config.json`: cấu hình cho YOLO.
- `BE/ml_models/character_recognition/plate_recognizer.pt`: mô hình nhận dạng ký tự.
- `BE/ml_models/character_recognition/config.json`: cấu hình OCR.
- `BE/ml_models/utils/websocket_detector.py`: server Socket.IO xử lý khung hình.

### 3.3. Dữ liệu thử cho detector

Do kích thước ảnh/video có thể lớn nên repository **không chứa sẵn** toàn bộ tập dữ liệu thử. Để tái hiện kết quả đã báo cáo, có thể:

1. Chuẩn bị một số video/luồng camera có biển số rõ, ví dụ:
   - Camera IP/RTSP trong mạng nội bộ.
   - File video `.mp4` phát qua một RTSP server (VLC, ffmpeg…).

2. Cấu hình camera tương ứng trong giao diện **Quản lý camera**:
   - Chọn đúng loại protocol (RTSP/HTTP/ONVIF…).
   - Nhập URL stream, username/password nếu có.

3. Mở **Live camera** trong ứng dụng, bật stream cho camera vừa cấu hình.

Hệ thống sẽ:
- Gửi khung hình từ FE → Detector qua Socket.IO (`video_frame`).
- Nhận lại kết quả nhận diện (`detection_result`) và overlay khung + biển số trên UI.

---

## 4. Sơ đồ triển khai (mô tả khái niệm)

Mô tả triển khai tiêu chuẩn (dạng text, có thể vẽ lại thành sơ đồ trong báo cáo):

- Người dùng truy cập `http://<host>:3000` → Nginx/FE container phục vụ React app.
- React FE gọi API tới backend `http://<host>:5000` để:
  - Đăng ký/đăng nhập, quản lý người dùng, xe, ví, giao dịch, camera, phiên gửi xe…
  - Lưu/đọc dữ liệu từ PostgreSQL qua Prisma.
- Khi bật Live camera:
  - FE lấy khung hình từ webcam/camera IP, gửi qua Socket.IO tới Detector (cổng `5001`).
  - Detector (Python + YOLO + EasyOCR) xử lý, trả kết quả biển số + bbox + fps.
  - FE overlay thông tin này trên video và cập nhật UI (Dashboard, lịch sử…).

Triển khai bằng Docker Compose (production/dev nhỏ):
- `frontend` service (React build + Nginx)
- `backend` service (Node.js + Prisma)
- `detector` service (Python + ML)
- `postgres` service (database)
- (tuỳ chọn) `prisma-studio` để quản lý DB trực quan

---
Trong trường hợp đồ án/đóng gói **không thể đính kèm**:

1. **Container images đã build sẵn**: có thể cung cấp link Docker Hub hoặc file `docker-quick-update.ps1`/`docker-update.ps1` kèm hướng dẫn pull image.
2. **Dữ liệu video/camera thực tế**: chỉ cần mô tả rõ yêu cầu:
   - Nguồn stream cần có biển số rõ, đủ sáng.
   - Độ phân giải khuyến nghị ≤ 1280×720.
3. **Môi trường phần cứng**:
   - RAM đề nghị ≥ 8GB (Detector ML cần khoảng 2–3GB).
   - CPU có hỗ trợ AVX sẽ giúp YOLO/EasyOCR chạy mượt hơn.

Người triển khai chỉ cần:
- Cài Docker Desktop.
- Lấy mã nguồn (hoặc image Docker) từ kho lưu trữ.
- Chạy `docker-compose up -d` theo đúng `SETUP.md` và `README.md` này.

## 📄 Ghi chú
Giảng viên hướng dẫn:
KS. Nguyễn Trọng Hiếu
Nhóm tác giả:
2212375	Triệu Quang Học - 22123752dlu.edu.vn
2212343	Đinh Lâm Gia Bảo - 22123752dlu.edu.vn
2212456	Lê Thành Thái - 22123752dlu.edu.vn