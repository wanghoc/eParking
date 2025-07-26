# 📁 CẤU TRÚC CODE ePARKING - GIẢI THÍCH ĐƠN GIẢN

## 🎯 Mục đích

File này giải thích **cấu trúc code** của hệ thống eParking một cách **đơn giản nhất** cho người mới bắt đầu.

---

## 📂 CẤU TRÚC THƯ MỤC

```
📁 eParking/                          ← Thư mục gốc
├── 📁 src/                           ← Chứa code chính
│   ├── 📄 App.tsx                   ← TRANG CHÍNH
│   ├── 📄 index.tsx                 ← KHỞI ĐỘNG
│   ├── 📄 index.css                 ← STYLE CHUNG
│   └── 📁 components/               ← CÁC PHẦN NHỎ
│       ├── 📄 AppSidebar.tsx        ← THANH BÊN TRÁI
│       ├── 📄 HomePage.tsx          ← TRANG CHỦ
│       ├── 📄 VehiclesPage.tsx      ← TRANG XE
│       ├── 📄 DashboardCard.tsx     ← Ô THỐNG KÊ
│       └── 📁 ui/                   ← CÁC PHẦN UI
│           ├── 📄 avatar.tsx        ← ẢNH ĐẠI DIỆN
│           ├── 📄 card.tsx          ← Ô THÔNG TIN
│           └── 📄 utils.ts          ← CÔNG CỤ
├── 📁 public/                       ← FILE TĨNH
│   └── 📄 index.html                ← TRANG HTML
├── 📄 package.json                  ← CẤU HÌNH DỰ ÁN
├── 📄 tsconfig.json                 ← CẤU HÌNH TYPESCRIPT
├── 📄 tailwind.config.js            ← CẤU HÌNH CSS
└── 📄 postcss.config.js             ← CẤU HÌNH POSTCSS
```

---

## 🔍 GIẢI THÍCH TỪNG FILE

### 🏠 **App.tsx - TRANG CHÍNH**
```javascript
// Đây là file QUAN TRỌNG NHẤT
// Nó quyết định cấu trúc chính của website

export default function App() {
  // 1. Lưu trạng thái trang hiện tại
  const [activeItem, setActiveItem] = useState("home");

  // 2. Hiển thị nội dung theo trang được chọn
  const renderContent = () => {
    switch (activeItem) {
      case "home": return <HomePage />;      // Trang chủ
      case "vehicles": return <VehiclesPage />; // Trang xe
      // ... các trang khác
    }
  };

  // 3. Giao diện chính
  return (
    <div>
      <AppSidebar />           {/* Thanh bên trái */}
      <div>{renderContent()}</div> {/* Nội dung bên phải */}
    </div>
  );
}
```

**Chức năng:**
- ✅ Quản lý việc chuyển trang
- ✅ Hiển thị sidebar và nội dung
- ✅ Điều khiển toàn bộ website

---

### 🚀 **index.tsx - KHỞI ĐỘNG**
```javascript
// File này KHỞI ĐỘNG website
// Giống như nút "Bật máy" của website

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // Import trang chính

// Khởi động website
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**Chức năng:**
- ✅ Khởi động React
- ✅ Kết nối với file HTML
- ✅ Hiển thị website

---

### 📱 **AppSidebar.tsx - THANH BÊN TRÁI**
```javascript
// Thanh menu bên trái của website
// Chứa logo, thông tin user, menu điều hướng

export function AppSidebar() {
  const menuItems = [
    { id: "home", label: "Trang chủ", icon: Home },
    { id: "vehicles", label: "Phương tiện", icon: Car },
    // ... các menu khác
  ];

  return (
    <div className="w-64 bg-white">
      {/* Logo */}
      <div className="p-6">
        <h2>eParking</h2>
      </div>

      {/* Thông tin user */}
      <div className="p-6">
        <Avatar />
        <p>Triệu Quang Học</p>
      </div>

      {/* Menu điều hướng */}
      <nav>
        {menuItems.map((item) => (
          <button key={item.id}>
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
```

**Chức năng:**
- ✅ Hiển thị logo eParking
- ✅ Hiển thị thông tin người dùng
- ✅ Menu điều hướng (Trang chủ, Xe, Lịch sử...)

---

### 🏠 **HomePage.tsx - TRANG CHỦ**
```javascript
// Trang chủ với dashboard và thống kê

export function HomePage() {
  // Dữ liệu thống kê
  const dashboardData = [
    {
      title: "Số dư",
      value: "2,450,000₫",
      icon: Wallet,
      color: "bg-blue-500"
    },
    // ... các thống kê khác
  ];

  return (
    <div>
      {/* Tiêu đề */}
      <h1>Trang chủ</h1>

      {/* Các ô thống kê */}
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

      {/* Hoạt động gần đây */}
      <div>
        <h2>Hoạt động gần đây</h2>
        {/* Danh sách hoạt động */}
      </div>
    </div>
  );
}
```

**Chức năng:**
- ✅ Hiển thị thống kê (Số dư, Số xe, Lịch sử)
- ✅ Hiển thị hoạt động gần đây
- ✅ Dashboard tổng quan

---

### 🚗 **VehiclesPage.tsx - TRANG XE**
```javascript
// Trang quản lý phương tiện

export function VehiclesPage() {
  // Dữ liệu xe
  const vehicles = [
    {
      id: 1,
      plateNumber: "29A-12345",
      type: "Xe máy",
      brand: "Honda",
      model: "Wave Alpha",
      status: "Đang gửi"
    },
    // ... các xe khác
  ];

  return (
    <div>
      {/* Tiêu đề và nút thêm */}
      <div>
        <h1>Quản lý phương tiện</h1>
        <button>Thêm phương tiện</button>
      </div>

      {/* Bảng danh sách xe */}
      <table>
        <thead>
          <tr>
            <th>Biển số</th>
            <th>Loại xe</th>
            <th>Hãng/Model</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>{vehicle.plateNumber}</td>
              <td>{vehicle.type}</td>
              <td>{vehicle.brand} {vehicle.model}</td>
              <td>{vehicle.status}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Chức năng:**
- ✅ Hiển thị danh sách xe
- ✅ Thông tin chi tiết từng xe
- ✅ Nút thêm xe mới
- ✅ Nút sửa/xóa xe

---

### 📊 **DashboardCard.tsx - Ô THỐNG KÊ**
```javascript
// Ô hiển thị thống kê (Số dư, Số xe, Lịch sử)

export function DashboardCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card">
      <div className="flex">
        {/* Thông tin */}
        <div>
          <p>{title}</p>
          <p className="text-2xl">{value}</p>
        </div>
        
        {/* Icon */}
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="text-white" />
        </div>
      </div>
    </div>
  );
}
```

**Chức năng:**
- ✅ Hiển thị thông tin thống kê
- ✅ Icon và màu sắc
- ✅ Tái sử dụng cho nhiều loại thống kê

---

### 🎨 **UI Components (ui/)**

#### **avatar.tsx - ẢNH ĐẠI DIỆN**
```javascript
// Component hiển thị ảnh đại diện user

export function Avatar() {
  return (
    <div className="rounded-full">
      <img src="/avatar.jpg" alt="User" />
    </div>
  );
}
```

#### **card.tsx - Ô THÔNG TIN**
```javascript
// Component tạo các ô thông tin đẹp

export function Card({ children }) {
  return (
    <div className="rounded-lg border shadow-sm">
      {children}
    </div>
  );
}
```

#### **utils.ts - CÔNG CỤ**
```javascript
// Các hàm tiện ích để xử lý CSS

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
```

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1️⃣ **Khởi động website:**
```
index.tsx → App.tsx → Hiển thị website
```

### 2️⃣ **Khi click menu:**
```
Click menu → AppSidebar → App.tsx → Hiển thị trang mới
```

### 3️⃣ **Khi load trang:**
```
HomePage → DashboardCard → Hiển thị thống kê
```

---

## 📝 CÁCH ĐỌC CODE

### 🔍 **Đọc từ trên xuống dưới:**
1. **Import** - Nhập các thư viện cần thiết
2. **Data** - Dữ liệu (arrays, objects)
3. **Functions** - Các hàm xử lý
4. **Return** - Giao diện hiển thị

### 🎯 **Từ khóa quan trọng:**
- `import` = Nhập thư viện
- `export` = Xuất component
- `const` = Khai báo biến
- `return` = Trả về giao diện
- `className` = CSS class
- `onClick` = Xử lý khi click

### 🎨 **CSS Classes:**
- `bg-blue-500` = Màu nền xanh
- `text-white` = Chữ trắng
- `p-4` = Padding 16px
- `rounded-lg` = Bo góc
- `flex` = Hiển thị flexbox

---

## 🚀 CÁCH THÊM TÍNH NĂNG MỚI

### 1️⃣ **Tạo trang mới:**
```javascript
// Tạo file src/components/NewPage.tsx
export function NewPage() {
  return (
    <div>
      <h1>Trang mới</h1>
      {/* Nội dung trang */}
    </div>
  );
}
```

### 2️⃣ **Thêm vào menu:**
```javascript
// Trong AppSidebar.tsx
const menuItems = [
  // ... menu cũ
  { id: "new", label: "Trang mới", icon: NewIcon }
];
```

### 3️⃣ **Thêm vào App.tsx:**
```javascript
// Trong App.tsx
import { NewPage } from "./components/NewPage";

const renderContent = () => {
  switch (activeItem) {
    // ... cases cũ
    case "new":
      return <NewPage />;
  }
};
```

---

## 🎉 KẾT LUẬN

**Cấu trúc code eParking được tổ chức theo nguyên tắc:**

1. **📁 Tách biệt rõ ràng** - Mỗi file có chức năng riêng
2. **🔄 Tái sử dụng** - Components có thể dùng lại
3. **📱 Responsive** - Hoạt động trên mọi thiết bị
4. **🎨 Đẹp mắt** - Sử dụng Tailwind CSS
5. **⚡ Hiệu suất cao** - React tối ưu

**Để hiểu sâu hơn:**
- Đọc code từ file `App.tsx` trước
- Sau đó đọc các components con
- Thực hành thêm tính năng mới
- Học thêm về React và JavaScript

**Chúc bạn thành công! 🚀** 