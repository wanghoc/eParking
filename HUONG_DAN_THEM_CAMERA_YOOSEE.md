# 📷 Hướng Dẫn Thêm Camera Yoosee vào Hệ Thống

## 🎯 Thông Tin Camera Yoosee Taka

| Thông tin | Giá trị | Bắt buộc |
|-----------|---------|----------|
| **Tên thiết bị** | Taka | ✅ |
| **Device ID** | 7804144881 | ✅ |
| **IP mạng cục bộ** | 192.168.1.16 | ✅ |
| **MAC Address** | 78:22:88:4b:d2:b3 | ⚪ Không bắt buộc |
| **ONVIF ID** | 2024DPP9340(M) | ⚪ Không bắt buộc |
| **Protocol hỗ trợ** | Yoosee, ONVIF, RTSP, HTTP | - |

---

## 📱 Cách Lấy Thông Tin Từ App Yoosee

### 1. Device ID (ID máy ảnh)
```
1. Mở app Yoosee
2. Chọn camera cần thêm
3. Nhấn icon Settings (⚙️)
4. Chọn "Device Info" (Thông tin thiết bị)
5. Sao chép "ID máy ảnh"
   → Ví dụ: 7804144881
```

### 2. IP mạng cục bộ
```
Trong cùng màn hình "Device Info":
- Tìm dòng "IP mạng cục bộ"
- Sao chép địa chỉ IP
   → Ví dụ: 192.168.1.16
```

### 3. MAC Address (nếu cần)
```
Trong màn hình "Device Info":
- Tìm dòng "Địa chỉ MAC"
- Sao chép địa chỉ MAC
   → Ví dụ: 78:22:88:4b:d2:b3
```

### 4. ONVIF ID (nếu có)
```
Xem trên tem/nhãn dán ở mặt camera:
- Tìm dòng "ONVIF ID:" hoặc "ONVIF"
- Ghi lại mã số
   → Ví dụ: 2024DPP9340(M)
```

---

## 🚀 Hướng Dẫn Thêm Camera

### Bước 1: Truy cập hệ thống
1. Mở trình duyệt: **http://localhost:3001**
2. Đăng nhập vào hệ thống
3. Vào menu **"Camera"**
4. Nhấn nút **"Thêm camera"**

### Bước 2: Điền thông tin cơ bản
**Thông tin BẮT BUỘC:**
- ✅ **Tên camera**: Tùy chọn (Ví dụ: "Camera Cổng Vào Taka")
- ✅ **Loại camera**: Chọn "Vào" hoặc "Ra"
- ⚪ **Vị trí**: Không bắt buộc (Ví dụ: "Bãi xe A - Cổng vào")
- ⚪ **Thương hiệu**: Chọn "Yoosee"

### Bước 3: Cấu hình kết nối
**Thông tin BẮT BUỘC:**
- ✅ **Protocol**: Chọn "Yoosee" hoặc "ONVIF"
- ✅ **Device ID**: `7804144881` (bắt buộc với Yoosee)
- ✅ **IP address**: `192.168.1.16`

**Thông tin TỰ ĐỘNG:**
- 🔄 **Port**: Tự động điền (8000 cho Yoosee, 80 cho ONVIF)
- 🔄 **Channel**: Mặc định = 0 (không cần sửa)

**Thông tin KHÔNG BẮT BUỘC:**
- ⚪ **Username**: Để trống nếu không biết
- ⚪ **Password**: Để trống nếu không biết

### Bước 4: Cài đặt nâng cao (không bắt buộc)
- ⚪ **MAC Address**: `78:22:88:4b:d2:b3`
- ⚪ **ONVIF ID**: `2024DPP9340(M)`
- ⚪ **Serial Number**: Để trống nếu không biết
- ⚪ **Resolution**: Mặc định 1080p
- ⚪ **FPS**: Mặc định 30
- ⚪ **Tính năng**: Chọn "Hỗ trợ âm thanh" nếu cần

### Bước 5: Test và lưu
1. Nhấn nút **"Test"** để kiểm tra kết nối
2. Nếu test thành công, nhấn **"Lưu"**
3. Camera đã được thêm vào hệ thống!

---

## ❓ Câu Hỏi Thường Gặp

### Q1: Tôi không biết Serial Number?
**A:** Không sao! Serial Number không bắt buộc. Bạn có thể để trống.

### Q2: Tôi không biết Channel là gì?
**A:** Channel thường là 0 hoặc 1. Hệ thống đã đặt mặc định = 0. Bạn không cần sửa.

### Q3: URLs (RTSP/HTTP) ở đâu?
**A:** Bạn KHÔNG cần điền URLs. Hệ thống sẽ TỰ ĐỘNG tạo dựa trên:
- IP address
- Port  
- Username/Password (nếu có)
- Channel

### Q4: Tôi không biết Username/Password camera?
**A:** Không sao! Với camera Yoosee:
- Kết nối qua Device ID không cần username/password
- Chỉ cần Device ID + IP là đủ

### Q5: Nên chọn Protocol nào?
**A:** Khuyến nghị:
- 🥇 **Yoosee**: Tốt nhất cho camera Yoosee (cần Device ID)
- 🥈 **ONVIF**: Chuẩn quốc tế, tương thích tốt (cần ONVIF ID nếu có)
- 🥉 **RTSP**: Streaming trực tiếp (cần username/password)

### Q6: Làm sao biết kết nối thành công?
**A:** 
1. Nhấn nút "Test" trong form
2. Xem kết quả:
   - ✅ Màu xanh = Thành công
   - ❌ Màu đỏ = Lỗi kết nối
3. Nếu lỗi, kiểm tra lại IP và Device ID

---

## 🎯 Cấu Hình Nhanh - Copy & Paste

### Cấu hình tối thiểu (chỉ cần 3 thông tin):
```
Tên camera: Camera Taka
Device ID: 7804144881
IP address: 192.168.1.16
Protocol: Yoosee
```

### Cấu hình đầy đủ:
```
Tên camera: Camera Yoosee - Cổng Vào Taka
Loại: Vào
Vị trí: Bãi xe A - Cổng vào
Thương hiệu: Yoosee

Protocol: Yoosee
Device ID: 7804144881
IP address: 192.168.1.16
Port: 8000 (tự động)
Channel: 0 (tự động)

MAC Address: 78:22:88:4b:d2:b3
ONVIF ID: 2024DPP9340(M)
Resolution: 1080p
FPS: 30
Hỗ trợ âm thanh: Có
```

---

## 🔧 Xử Lý Lỗi

### Lỗi: "Cannot connect to camera"
**Giải pháp:**
1. Kiểm tra camera đã bật và kết nối WiFi
2. Kiểm tra IP address đúng không
3. Thử ping IP từ máy tính: `ping 192.168.1.16`
4. Đảm bảo máy tính và camera cùng mạng LAN

### Lỗi: "Device ID không hợp lệ"
**Giải pháp:**
1. Mở app Yoosee và kiểm tra lại Device ID
2. Đảm bảo không có dấu cách thừa
3. Device ID thường là 10 chữ số

### Lỗi: "Camera name already exists"
**Giải pháp:**
1. Đổi tên camera khác
2. Hoặc xóa camera cũ có cùng tên

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Camera đã bật và kết nối WiFi
2. ✅ Device ID chính xác
3. ✅ IP address đúng
4. ✅ Máy tính và camera cùng mạng
5. ✅ Firewall không chặn port 8000

---

## 📝 Ghi Chú Kỹ Thuật

### Protocols được hỗ trợ:
- **Yoosee Protocol**: Port 8000, P2P connection
- **ONVIF**: Port 80, chuẩn quốc tế
- **RTSP**: Port 554, streaming trực tiếp
- **HTTP**: Port 80, web streaming

### Auto-generated URLs:
```
RTSP: rtsp://[username]:[password]@192.168.1.16:554/live/ch0
HTTP: http://192.168.1.16:80/videostream.cgi
Yoosee: P2P connection via Device ID
ONVIF: Auto-discovery via ONVIF protocol
```

---

✨ **Chúc bạn thiết lập camera thành công!** 🎥
