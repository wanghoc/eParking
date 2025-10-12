# eParking - Hệ thống quản lý bãi xe thông minh

# Backend
cd BE
npm install
npm run dev

# Frontend  
cd FE
npm install
npm start

# Database
npx prisma db push
npx prisma db push

Hệ thống quản lý bãi xe thông minh dành cho Trường Đại học Đà Lạt, hỗ trợ nhận diện biển số tự động, thanh toán không tiền mặt và quản lý hiệu quả.

## 🌟 Tính năng chính

### 👤 Dành cho sinh viên

- **Đăng ký tài khoản** và quản lý thông tin cá nhân
- **Quản lý tài khoản** - cập nhật thông tin, đổi mật khẩu an toàn
- **Đăng ký phương tiện** (tối đa 3 xe/tài khoản)
- **Xem lịch sử gửi xe** chi tiết
- **Nạp tiền và thanh toán** qua ví điện tử
- **Dashboard** theo dõi thống kê cá nhân với giao diện ấn tượng

### 🔧 Dành cho quản trị viên

- **Quản lý người dùng** và phương tiện
- **Quản lý bãi xe** và camera nhận diện
- **Theo dõi hoạt động** thời gian thực
- **Xử lý cảnh báo** hệ thống
- **Cấu hình hệ thống** và báo cáo

### 🤖 Tính năng tự động

- **Nhận diện biển số** bằng AI/Camera
- **Tính phí tự động** khi ra bãi
- **Trừ tiền tự động** từ ví điện tử
- **Cảnh báo** số dư thấp và lỗi hệ thống

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js** >= 16.x ([Download](https://nodejs.org/))
- **MySQL** >= 8.0 ([Download](https://dev.mysql.com/downloads/installer/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Chrome/Firefox** phiên bản mới nhất

### 1. Clone project

```bash
git clone https://github.com/wanghoc/eParking.git
cd eParking
```

### 2. Cài đặt MySQL và tạo database

#### Windows:

1. Tải và cài đặt MySQL Installer từ [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Chọn "Developer Default" và làm theo hướng dẫn
3. Nhớ **root password** đã đặt (dùng cho bước tiếp theo)

#### macOS:

```bash
# Sử dụng Homebrew
brew install mysql
brew services start mysql
mysql_secure_installation
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### 3. Cấu hình database

#### Tạo database và import schema:

```bash
# Đăng nhập MySQL (nhập password khi được yêu cầu)
mysql -u root -p

# Trong MySQL shell, tạo database
CREATE DATABASE eParking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schema và dữ liệu mẫu
mysql -u root -p eParking_db < eParking-backend/schema.sql
```

#### Cập nhật thông tin kết nối database:

Mở file `eParking-backend/db.js` và cập nhật thông tin:

```javascript
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "YOUR_MYSQL_PASSWORD", // Thay bằng password MySQL của bạn
  database: "eParking_db",
  connectionLimit: 10,
  queueLimit: 0,
});
```

### 4. Cài đặt dependencies

#### Frontend:

```bash
npm install
```

#### Backend:

```bash
cd eParking-backend
npm install
cd ..
```

### 5. Chạy hệ thống

#### Mở 2 terminal:

**Terminal 1 - Backend:**

```bash
cd eParking-backend
npm start
# Server sẽ chạy tại http://localhost:3000
```

**Terminal 2 - Frontend:**

```bash
npm start
# Website sẽ mở tại http://localhost:3001
```

### 6. Truy cập hệ thống

Mở trình duyệt và truy cập: **http://localhost:3001**

#### Tài khoản demo có sẵn:

**👨‍🎓 Sinh viên:**

- Email: `hocquang@student.dlu.edu.vn`
- Password: `123456`

**👨‍💼 Admin:**

- Email: `admin@dlu.edu.vn`
- Password: `admin123`

## 📁 Cấu trúc project

```
eParking/
├── 📁 src/                      # Frontend React
│   ├── 📁 components/           # Các component UI
│   │   ├── 📁 auth/            # Components xác thực
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── 📁 common/          # Components dùng chung
│   │   │   └── AppSidebar.tsx
│   │   ├── 📁 pages/           # Các trang chính
│   │   ├── 📁 ui/              # UI primitives
│   │   │   ├── avatar.tsx
│   │   │   ├── card.tsx
│   │   │   └── utils.ts
│   │   ├── ProfileModal.tsx    # Modal quản lý tài khoản
│   │   └── ...                 # Các trang khác
│   ├── 📁 contexts/             # React Context
│   │   └── AuthContext.tsx
│   ├── 📄 App.tsx              # Main App component
│   ├── 📄 index.tsx            # Entry point
│   └── 📄 index.css            # Global styles
├── 📁 eParking-backend/         # Backend Node.js
│   ├── 📄 server.js            # Express server + API routes
│   ├── 📄 db.js                # MySQL connection
│   ├── 📄 schema.sql           # Database schema + seed data
│   └── 📄 package.json         # Backend dependencies
├── 📁 public/                   # Static files
│   ├── 📁 img/                  # Images (DLU.jpg)
│   └── 📁 docs/                # Tài liệu (bị gitignore)
├── 📄 package.json             # Frontend dependencies
├── 📄 tailwind.config.js       # Tailwind CSS config
├── 📄 tsconfig.json            # TypeScript config
└── 📄 README.md               # Tài liệu này
```

## 🔧 API Endpoints

### Authentication

- `POST /api/register` - Đăng ký tài khoản
- `POST /api/login` - Đăng nhập

### User & Vehicles

- `GET /api/users/:userId` - Thông tin user
- `PUT /api/users/:userId` - Cập nhật thông tin user (tên, SĐT)
- `PUT /api/users/:userId/password` - Đổi mật khẩu
- `GET /api/users/:userId/vehicles` - Danh sách xe của user
- `POST /api/vehicles` - Đăng ký xe mới
- `PUT /api/vehicles/:vehicleId` - Cập nhật thông tin xe
- `DELETE /api/vehicles/:vehicleId` - Xóa xe

### Parking & History

- `POST /api/parking-sessions/check-in` - Xe vào bãi
- `POST /api/parking-sessions/check-out` - Xe ra bãi
- `GET /api/parking-history/:vehicle_id` - Lịch sử gửi xe

### Wallet & Transactions

- `GET /api/wallet/:userId` - Thông tin ví
- `POST /api/wallet/topup` - Nạp tiền
- `GET /api/transactions` - Lịch sử giao dịch

### Management (Admin)

- `GET /api/users` - Danh sách người dùng
- `GET /api/parking-lots` - Danh sách bãi xe
- `GET /api/parking-lots/overview` - Thống kê bãi xe
- `GET /api/activities/recent` - Hoạt động gần đây
- `GET /api/cameras` - Danh sách camera
- `GET /api/alerts` - Cảnh báo hệ thống
- `GET /api/logs` - Log hệ thống

## 🛠️ Phát triển & Debug

### Chạy ở chế độ development:

```bash
# Backend với auto-reload
cd eParking-backend
npm run dev

# Frontend với hot-reload
npm start
```

### Kiểm tra kết nối database:

```bash
# Test API health
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hocquang@student.dlu.edu.vn","password":"123456"}'
```

### Reset database (nếu cần):

```bash
mysql -u root -p -e "DROP DATABASE eParking_db; CREATE DATABASE eParking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p eParking_db < eParking-backend/schema.sql
```

## 🎯 Hướng dẫn sử dụng

### Đăng ký và sử dụng (Sinh viên):

1. **Đăng ký tài khoản** với email @student.dlu.edu.vn
2. **Đăng ký xe** (biển số, hãng, model)
3. **Nạp tiền** vào ví qua Momo/VNPay
4. **Gửi xe** - hệ thống tự động nhận diện biển số
5. **Lấy xe** - tự động tính phí và trừ tiền

### Quản lý (Admin):

1. **Đăng nhập** với tài khoản admin
2. **Theo dõi** dashboard tổng quan
3. **Quản lý người dùng** và phương tiện
4. **Xử lý cảnh báo** và sự cố
5. **Cấu hình** camera và bãi xe

## ❗ Xử lý lỗi thường gặp

### Backend không chạy được:

```bash
# Kiểm tra MySQL đã chạy chưa
# Windows:
services.msc # Tìm MySQL80 và start

# macOS/Linux:
sudo systemctl status mysql
sudo systemctl start mysql
```

### Lỗi kết nối database:

- Kiểm tra MySQL password trong `eParking-backend/db.js`
- Đảm bảo database `eParking_db` đã được tạo
- Kiểm tra MySQL server đang chạy

### Frontend không load được:

```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Port bị conflict:

- Backend mặc định chạy port 3000
- Frontend mặc định chạy port 3001
- Có thể thay đổi trong package.json hoặc .env

## 🤝 Đóng góp

1. Fork project này
2. Tạo feature branch: `git checkout -b feature/TenTinhNang`
3. Commit changes: `git commit -m 'Thêm tính năng mới'`
4. Push branch: `git push origin feature/TenTinhNang`
5. Tạo Pull Request

## 📞 Liên hệ & Hỗ trợ

- **Developer:** Triệu Quang Học - 2212375
- **Email:** hocquang@student.dlu.edu.vn
- **University:** Đại học Đà Lạt
- **GitHub:** [wanghoc/eParking](https://github.com/wanghoc/eParking)

---

_© 2024 eParking - Hệ thống quản lý bãi xe thông minh | Đại học Đà Lạt_
