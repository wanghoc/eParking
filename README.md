# Hệ thống eParking

Hệ thống quản lý bãi xe thông minh theo kiến trúc **Edge-Cloud Hybrid**: nhận dạng biển số và điều khiển barrier chạy trên **máy trạm tại cổng** (`edge/`), Web + API trên Cloud (`FE/`, `BE/`) quản lý tài khoản, ví, phiên gửi xe và báo cáo. Cổng vẫn hoạt động khi mất Internet và tự đồng bộ khi có mạng lại.

**Hướng dẫn chạy nhanh:** [HUONG_DAN_SU_DUNG.md](HUONG_DAN_SU_DUNG.md) (`start-eparking.bat` + app `eParkingEdge.exe`).

Chi tiết thiết kế (lược đồ dữ liệu, hợp đồng đồng bộ, quy tắc nợ cước): [docs/EDGE_CLOUD_ARCHITECTURE.md](docs/EDGE_CLOUD_ARCHITECTURE.md).

## 🔑 Tính năng chính

- **Xác thực & Quản lý người dùng**: Đăng ký/đăng nhập, quản lý thông tin cá nhân và phương tiện.
- **Quản lý phương tiện**: Hỗ trợ nhiều xe cho một tài khoản, xem lịch sử gửi xe và lịch sử giao dịch.
- **Máy trạm cổng (Edge)**: đọc camera RTSP, nhận diện biển số cục bộ (YOLOv8-OBB + YOLO11n), mở barrier, giao diện POS cho bảo vệ (cảnh báo nợ cước, mở thủ công). Mất mạng vẫn cho xe ra vào, ghi hàng chờ SQLite và tự đồng bộ.
- **Thanh toán & Ví điện tử**: Tự động trừ phí khi xe ra. Sự kiện đồng bộ từ lúc offline được phép đẩy ví xuống âm (nợ cước); lượt gửi kế tiếp sẽ bị chặn tại cổng cho đến khi nạp đủ.
- **Bảng điều khiển cho quản trị viên**: thống kê, phiên gửi xe đang mở (kèm ảnh đối soát), danh sách nợ cước, trạng thái online/hàng chờ của từng máy trạm.
- **Chatbot hỗ trợ**: Tích hợp chatbot Gemini để trả lời các câu hỏi thường gặp.

## 🧱 Công nghệ sử dụng

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router.
- **Backend**: Node.js (Express), Prisma ORM, PostgreSQL.
- **Edge (máy trạm cổng)**: Python, Ultralytics YOLOv8-OBB + YOLO11n, OpenCV, PySide6, SQLite.
- **Hạ tầng**: Docker, Docker Compose, Nginx.

## 📁 Cấu trúc thư mục

```
eParking/
├── FE/               # Web React (sinh viên + admin)
├── BE/               # Cloud API Node.js + Prisma
├── edge/             # Ứng dụng desktop tại cổng: AI + barrier + hàng chờ offline
├── docs/             # Tài liệu kiến trúc
├── docker-compose.yml  # Cloud: postgres + backend + frontend
└── README.md
```

## 🚀 Hướng dẫn chạy bằng Docker (Khuyến nghị)

### 1. Yêu cầu

- Đã cài đặt Docker và Docker Compose.
- (Tùy chọn) `GEMINI_API_KEY` để sử dụng chatbot.

### 2. Cấu hình

Tạo một tệp `.env` ở thư mục gốc của dự án (`eParking/`) để tùy chỉnh các biến môi trường nếu cần. Bạn có thể bỏ qua bước này để sử dụng các giá trị mặc định.

```env
# .env
# Cổng cho các dịch vụ
FRONTEND_PORT=3000
BACKEND_PORT=5000
DB_PORT=5432

# Thông tin xác thực database
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_DATABASE_NAME=eParking_db

# API Key cho Gemini Chatbot
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Khởi động hệ thống

Mở terminal trong thư mục gốc `eParking/` và chạy lệnh sau:

```bash
docker-compose up -d --build
```

Lệnh này sẽ build các image và khởi chạy tất cả các dịch vụ ở chế độ nền.

### 4. Truy cập

Sau khi khởi động thành công, bạn có thể truy cập các dịch vụ tại:

- **Giao diện người dùng (Frontend)**: `http://localhost:3000` (hoặc cổng bạn đã cấu hình)
- **API Backend**: `http://localhost:5000`
- **Database (PostgreSQL)**: `localhost:5432`

Để xem log của một dịch vụ cụ thể:
```bash
docker-compose logs -f <tên_dịch vụ>
# Ví dụ: docker-compose logs -f backend
```

Để dừng hệ thống:
```bash
docker-compose down
```

## ⚙️ Hướng dẫn chạy thủ công (Không dùng Docker)

Nếu bạn muốn chạy các dịch vụ một cách thủ công cho mục đích phát triển.

### 1. Backend (Node.js)

```bash
cd BE
# Tạo file .env và cấu hình DATABASE_URL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm start
```

### 2. Frontend (React)

```bash
cd FE
npm install
npm run dev
```

### 3. Máy trạm cổng (Edge)

```bash
# Trên server: cấp khóa cho máy trạm
cd BE && node scripts/edge-device.js create --code GATE-A --name "Cổng bãi A" --lane BOTH --lot 1

# Trên máy tính tại cổng (Python 3.10-3.12)
cd edge
pip install -r requirements.txt
copy config.example.yaml config.yaml   # điền base_url, device_key, RTSP camera, relay barrier
python main.py                          # --no-ai: chạy thử không cần camera/model
```


1. Mở trình duyệt tới `http://localhost:3000`.
2. Đăng ký tài khoản bằng MSSV + email, sau đó đăng nhập.
3. Vào mục **Quản lý xe** để thêm phương tiện (biển số, nhãn hiệu, mẫu xe).
4. Nạp tiền ví (mock/giả lập theo UI hiện có) trong trang **Ví/Thanh toán**.
5. Chạy ứng dụng Edge tại cổng: xe qua camera được nhận diện, Cloud trừ phí và barrier mở; tài khoản âm sẽ hiện cảnh báo đỏ trên POS của bảo vệ.
6. Kiểm tra **Lịch sử gửi xe** (kèm ảnh đối soát) và **Lịch sử giao dịch**; admin theo dõi nợ cước và trạng thái máy trạm ở **Bảng điều khiển**.

## 🐛 Troubleshooting ngắn gọn

- Container không chạy: dùng `docker-compose ps` và `docker-compose logs` để xem lỗi.
- Frontend không mở: kiểm tra container frontend, thử `docker-compose restart frontend`.
- Backend không kết nối DB: kiểm tra container PostgreSQL, biến `DATABASE_URL`.
- Máy trạm báo OFFLINE: kiểm tra `cloud.base_url`, mạng, và `docker-compose logs -f backend`. "SAI KHÓA THIẾT BỊ": cấp lại bằng `node scripts/edge-device.js rotate --code <CODE>`.
- Không nhận diện được biển số: xem `edge/data/edge.log`, kiểm tra URL RTSP và vùng `roi` trong `config.yaml`.

## 📄 Ghi chú
Giảng viên hướng dẫn:
- KS. Nguyễn Trọng Hiếu
Nhóm tác giả:
- 2212375	Triệu Quang Học - 22123752dlu.edu.vn
- 2212343	Đinh Lâm Gia Bảo - 22123752dlu.edu.vn
- 2212456	Lê Thành Thái - 22123752dlu.edu.vn

