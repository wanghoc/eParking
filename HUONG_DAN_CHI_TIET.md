# 📚 HƯỚNG DẪN CHI TIẾT - HỆ THỐNG ePARKING

## 🎯 Mục đích của tài liệu này

Tài liệu này được viết cho những người **chưa có nhiều kinh nghiệm lập trình web** nhưng muốn hiểu và sử dụng hệ thống eParking. Tôi sẽ giải thích từng bước một cách đơn giản nhất.

---

## 📖 1. TỔNG QUAN VỀ HỆ THỐNG

### 🏗️ eParking là gì?
- **eParking** = Hệ thống quản lý bãi xe thông minh
- **Mục đích**: Giúp người dùng quản lý việc gửi xe, theo dõi lịch sử, nạp tiền
- **Công nghệ**: Website được viết bằng React (JavaScript hiện đại)

### 🎨 Giao diện chính
```
┌─────────────────────────────────────────────────────────┐
│ 🟢 Banner xanh (top)                                  │
├─────────────┬─────────────────────────────────────────┤
│ 📱 Sidebar  │ 🏠 Nội dung chính                      │
│ - Logo      │ - Dashboard                            │
│ - User info │ - Bảng thống kê                       │
│ - Menu      │ - Danh sách xe                        │
│             │ - Hoạt động gần đây                   │
└─────────────┴─────────────────────────────────────────┘
```

---

## 🖥️ 2. GIẢI THÍCH CÁC KHÁI NIỆM CƠ BẢN

### 🌐 **Website là gì?**
- Website = Trang web bạn truy cập qua trình duyệt (Chrome, Firefox...)
- Giống như một ứng dụng trên điện thoại, nhưng chạy trên web

### 🏠 **Localhost là gì?**
- **Localhost** = Máy tính của bạn
- **Port 3000** = Cổng số 3000 trên máy tính
- **http://localhost:3000** = Địa chỉ để truy cập website trên máy tính của bạn
- **Tại sao cần localhost?** Để test website trước khi đưa lên internet

### ⚙️ **Server là gì?**
- **Server** = Máy tính chạy website
- **Development Server** = Server chạy trên máy tính của bạn để test
- **Production Server** = Server thật trên internet

### 📁 **File và thư mục**
```
📁 eParking/                    ← Thư mục gốc của dự án
├── 📁 src/                     ← Chứa code chính
│   ├── 📄 App.tsx             ← Trang chính
│   ├── 📄 index.tsx           ← Khởi động ứng dụng
│   └── 📁 components/         ← Các phần nhỏ của trang
├── 📁 public/                 ← File tĩnh (HTML)
└── 📄 package.json            ← Cấu hình dự án
```

---

## 🚀 3. CÁCH CHẠY HỆ THỐNG

### 📋 **Bước 1: Mở Terminal/Command Prompt**
- Nhấn `Windows + R`
- Gõ `cmd` và nhấn Enter
- Hoặc mở PowerShell

### 📂 **Bước 2: Di chuyển đến thư mục dự án**
```bash
cd F:\eParkig
```

### 📦 **Bước 3: Cài đặt thư viện (chỉ làm 1 lần)**
```bash
npm install
```
**Giải thích**: Tải về các thư viện cần thiết (React, CSS, Icons...)

### ▶️ **Bước 4: Chạy website**
```bash
npm start
```

### 🌐 **Bước 5: Mở trình duyệt**
- Mở Chrome/Firefox/Edge
- Gõ: `http://localhost:3000`
- Nhấn Enter

---

## 🎯 4. GIẢI THÍCH LUỒNG HOẠT ĐỘNG

### 🔄 **Khi bạn chạy `npm start`:**
```
1. Terminal → npm start
2. Hệ thống → Tìm file package.json
3. Đọc cấu hình → Biết đây là dự án React
4. Khởi động server → Chạy trên port 3000
5. Biên dịch code → Chuyển code thành website
6. Mở browser → Tự động mở http://localhost:3000
```

### 🖱️ **Khi bạn click vào menu:**
```
1. Click "Trang chủ" → Gửi tín hiệu đến App.tsx
2. App.tsx → Kiểm tra "activeItem = home"
3. Render HomePage → Hiển thị dashboard
4. Browser → Cập nhật giao diện
```

### 📊 **Cấu trúc dữ liệu:**
```javascript
// Dữ liệu xe
const vehicles = [
  {
    id: 1,
    plateNumber: "29A-12345",    // Biển số
    type: "Xe máy",              // Loại xe
    brand: "Honda",              // Hãng
    model: "Wave Alpha",         // Model
    status: "Đang gửi"          // Trạng thái
  }
];

// Dữ liệu dashboard
const dashboardData = [
  {
    title: "Số dư",              // Tiêu đề
    value: "2,450,000₫",        // Giá trị
    icon: Wallet,                // Icon
    color: "bg-blue-500"        // Màu sắc
  }
];
```

---

## 🛠️ 5. GIẢI THÍCH CODE (ĐƠN GIẢN)

### 📄 **File App.tsx (Trang chính)**
```javascript
// 1. Import các thư viện cần thiết
import { useState } from "react";
import { AppSidebar } from "./components/AppSidebar";

// 2. Tạo component App
export default function App() {
  // 3. Tạo biến để lưu trang hiện tại
  const [activeItem, setActiveItem] = useState("home");

  // 4. Hàm hiển thị nội dung theo trang được chọn
  const renderContent = () => {
    switch (activeItem) {
      case "home":
        return <HomePage />;        // Hiển thị trang chủ
      case "vehicles":
        return <VehiclesPage />;    // Hiển thị trang xe
      // ... các trang khác
    }
  };

  // 5. Giao diện chính
  return (
    <div className="h-screen flex">
      {/* Sidebar bên trái */}
      <AppSidebar 
        activeItem={activeItem} 
        onItemClick={setActiveItem} 
      />
      
      {/* Nội dung bên phải */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}
```

### 🎨 **File HomePage.tsx (Trang chủ)**
```javascript
export function HomePage() {
  // 1. Dữ liệu dashboard
  const dashboardData = [
    {
      title: "Số dư",
      value: "2,450,000₫",
      icon: Wallet,
      color: "bg-blue-500"
    }
  ];

  // 2. Giao diện trang chủ
  return (
    <div>
      {/* Tiêu đề */}
      <h1>Trang chủ</h1>
      
      {/* Các card thống kê */}
      <div className="grid grid-cols-3">
        {dashboardData.map((item) => (
          <DashboardCard 
            title={item.title}
            value={item.value}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 6. GIẢI THÍCH CSS VÀ STYLING

### 🎨 **Tailwind CSS là gì?**
- **CSS Framework** = Thư viện có sẵn các style đẹp
- **Thay vì viết CSS dài**, chỉ cần dùng class có sẵn

### 📝 **Ví dụ Tailwind CSS:**
```html
<!-- Thay vì viết CSS dài -->
<div style="background: blue; padding: 20px; border-radius: 8px;">
  Nội dung
</div>

<!-- Chỉ cần dùng class Tailwind -->
<div className="bg-blue-500 p-5 rounded-lg">
  Nội dung
</div>
```

### 🎨 **Các class thường dùng:**
```css
bg-blue-500     = Màu nền xanh
text-white      = Chữ màu trắng
p-4             = Padding 16px
m-2             = Margin 8px
rounded-lg      = Bo góc
flex            = Hiển thị flexbox
grid            = Hiển thị grid
hover:bg-gray-100 = Đổi màu khi hover
```

---

## 🔧 7. CÁC LỆNH QUAN TRỌNG

### ▶️ **Chạy website:**
```bash
npm start
```

### ⏹️ **Dừng website:**
- Nhấn `Ctrl + C` trong terminal

### 🔄 **Restart website:**
```bash
# Dừng (Ctrl + C) rồi chạy lại
npm start
```

### 📦 **Cài đặt thư viện mới:**
```bash
npm install tên-thư-viện
```

### 🏗️ **Build cho production:**
```bash
npm run build
```

---

## 🐛 8. XỬ LÝ LỖI THƯỜNG GẶP

### ❌ **Lỗi "Port 3000 is already in use"**
```bash
# Giải pháp 1: Dùng port khác
npm start -- --port 3001

# Giải pháp 2: Tìm và tắt process cũ
taskkill /f /im node.exe
npm start
```

### ❌ **Lỗi "Module not found"**
```bash
# Xóa và cài lại node_modules
rm -rf node_modules package-lock.json
npm install
```

### ❌ **Website không load**
1. Kiểm tra terminal có chạy `npm start` không
2. Kiểm tra URL: `http://localhost:3000`
3. Thử refresh trang (F5)
4. Kiểm tra console (F12) xem có lỗi không

---

## 📚 9. TÀI LIỆU THAM KHẢO

### 🌐 **Website học lập trình:**
- **freeCodeCamp.org** - Học JavaScript, React
- **w3schools.com** - Học HTML, CSS, JavaScript
- **reactjs.org** - Tài liệu chính thức React

### 📱 **Ứng dụng học:**
- **SoloLearn** - Học lập trình trên mobile
- **Grasshopper** - Học JavaScript cơ bản

### 📖 **Sách tiếng Việt:**
- "Lập trình web với HTML, CSS, JavaScript"
- "React cơ bản cho người mới bắt đầu"

---

## 🎯 10. BƯỚC TIẾP THEO

### 🎓 **Để hiểu sâu hơn:**
1. **Học JavaScript cơ bản** (2-3 tuần)
2. **Học React cơ bản** (1-2 tháng)
3. **Học CSS và Tailwind** (1 tuần)
4. **Thực hành làm dự án nhỏ**

### 🚀 **Để phát triển eParking:**
1. **Thêm tính năng đăng nhập**
2. **Kết nối database**
3. **Thêm tính năng thanh toán**
4. **Tối ưu giao diện mobile**

---

## 📞 11. HỖ TRỢ

### 🆘 **Khi gặp vấn đề:**
1. **Đọc lại tài liệu này**
2. **Kiểm tra console (F12)**
3. **Tìm kiếm trên Google**
4. **Hỏi trên Stack Overflow**

### 📧 **Liên hệ hỗ trợ:**
- **Email**: support@eparking.com
- **GitHub**: github.com/eparking/issues
- **Discord**: discord.gg/eparking

---

## 🎉 KẾT LUẬN

**Hệ thống eParking** là một website quản lý bãi xe được viết bằng React. Website này giúp người dùng:
- ✅ Xem thống kê tài khoản
- ✅ Quản lý danh sách xe
- ✅ Theo dõi lịch sử gửi xe
- ✅ Nạp tiền và thanh toán

**Để chạy website:**
1. Mở terminal
2. Di chuyển đến thư mục dự án
3. Chạy `npm start`
4. Mở trình duyệt và truy cập `http://localhost:3000`

**Chúc bạn thành công với dự án eParking! 🚀** 