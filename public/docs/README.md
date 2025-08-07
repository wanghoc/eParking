# eParking - Hệ thống quản lý bãi xe

Ứng dụng web quản lý bãi xe thông minh được xây dựng bằng React, TypeScript và Tailwind CSS.

## Tính năng

- 🏠 Trang chủ với dashboard
- 🚗 Quản lý phương tiện
- 📊 Lịch sử gửi xe
- 💳 Nạp tiền
- 🗺️ Quản lý bãi xe
- ⚙️ Quản trị hệ thống
- ❓ FAQ

## Yêu cầu hệ thống

- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

## Cài đặt

1. **Clone dự án** (nếu chưa có):
```bash
git clone <repository-url>
cd eParking
```

2. **Cài đặt dependencies**:
```bash
npm install
```

3. **Chạy ứng dụng**:
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc dự án

```
eParking/
├── public/
│   └── index.html
├── src/
│   ├── index.tsx
│   └── index.css
├── components/
│   ├── AppSidebar.tsx
│   ├── HomePage.tsx
│   ├── VehiclesPage.tsx
│   └── ui/
│       ├── avatar.tsx
│       └── utils.ts
├── styles/
│   └── globals.css
├── App.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Scripts có sẵn

- `npm start` - Chạy ứng dụng ở chế độ development
- `npm run build` - Build ứng dụng cho production
- `npm test` - Chạy tests
- `npm run eject` - Eject từ Create React App (không khuyến khích)

## Công nghệ sử dụng

- **React 18** - Framework UI
- **TypeScript** - Ngôn ngữ lập trình
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icon library
- **Create React App** - Build tool

## Phát triển

Dự án sử dụng:
- TypeScript cho type safety
- Tailwind CSS cho styling
- Lucide React cho icons
- Component-based architecture

## Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển. 