# Hướng Dẫn Cấu Hình Camera Yoosee

## Vấn Đề Hiện Tại

Camera Yoosee Model AK2P31-JW-Q2-18D-HB (ONVIF ID: 2024DPP9340(M)) **KHÔNG hỗ trợ RTSP streaming chuẩn** qua mạng LAN. Camera chỉ mở:
- **Port 554**: RTSP nhưng không phản hồi đúng chuẩn
- **Không có HTTP snapshot endpoint** trên các port thông thường

## Giải Pháp

### Lựa Chọn 1: Cấu Hình ONVIF/RTSP Chuẩn (Khuyến Nghị)

1. **Mở App Yoosee** trên điện thoại
2. **Chọn camera** → Cài đặt (Settings)
3. **Tìm mục "ONVIF" hoặc "RTSP"**
4. **Bật ONVIF/RTSP Protocol**
5. **Đặt username/password** cho RTSP stream
6. **Lưu cấu hình** và khởi động lại camera

### Lựa Chọn 2: Sử Dụng P2P Cloud (Phức Tạp)

Camera Yoosee sử dụng giao thức P2P proprietary để streaming qua internet:
- Cần **Yoosee P2P SDK** (yêu cầu license thương mại)
- Phải đăng ký tài khoản developer với nhà sản xuất
- Không phù hợp cho dự án nhỏ

### Lựa Chọn 3: Đổi Sang Camera IP Chuẩn

Nếu không thể cấu hình Yoosee, xem xét:
- **Camera hỗ trợ ONVIF chuẩn**: Hikvision, Dahua, Axis, Uniview
- **Camera hỗ trợ RTSP**: Hầu hết camera IP hiện đại
- **Camera hỗ trợ HTTP snapshot**: Rất dễ tích hợp

## Thông Tin Camera Hiện Tại

```yaml
Model: AK2P31-JW-Q2-18D-HB
ONVIF ID: 2024DPP9340(M)
Device ID: 7804144881
MAC Address: 78:22:88:4b:d2:b3
IP Address: 192.168.1.16
WiFi: "Hoa thoa" (Password: 0977298362)

Ports Mở:
- Port 554: RTSP (không hoạt động đúng chuẩn)
- Port 80, 8000, 8080: CLOSED
```

## Hệ Thống Streaming Hiện Tại

✅ **Backend stream endpoint**: `/api/cameras/:id/stream`
- Hỗ trợ: RTSP, HTTP, ONVIF, Yoosee
- Tự động xử lý authentication
- Follow HTTP redirects
- Timeout: 10 giây

✅ **Frontend component**: `IPCameraStream.tsx`
- Auto-refresh mỗi 1 giây cho HTTP snapshots
- Hiển thị trạng thái kết nối (Online/Offline/Connecting)
- Xử lý lỗi và retry tự động
- Hỗ trợ fullscreen view

✅ **Protocols hỗ trợ**:
1. **HTTP**: Snapshot URL (ví dụ: `http://camera-ip/snapshot.jpg`)
2. **RTSP**: FFmpeg chuyển thành JPEG (ví dụ: `rtsp://camera-ip:554/live`)
3. **ONVIF**: Snapshot qua ONVIF endpoint
4. **Yoosee**: P2P (cần cấu hình đặc biệt)

## Test Streaming

Camera demo đã được tạo (ID 54) với HTTP snapshot công khai:
```bash
# Test backend endpoint
Invoke-WebRequest -Uri "http://localhost:5000/api/cameras/54/stream" -OutFile "test.jpg"

# Xem trong browser
http://localhost:3000/camera-management
```

## Bước Tiếp Theo

1. **Cấu hình camera Yoosee** để bật ONVIF/RTSP chuẩn
2. **Hoặc test với camera IP khác** có sẵn
3. **Cập nhật thông tin camera** qua form AddCameraModal
4. **Kiểm tra streaming** tại trang Camera Management

## Lưu Ý Quan Trọng

⚠️ **Camera Yoosee thiết kế cho P2P Cloud streaming**, không phải LAN streaming  
⚠️ **Port 554 mở nhưng RTSP không hoạt động chuẩn** - cần enable trong app  
⚠️ **Không có HTTP snapshot** - cần cấu hình hoặc dùng RTSP  

---

**Liên Hệ Hỗ Trợ**: Nếu cần trợ giúp cấu hình camera Yoosee, tham khảo tài liệu của nhà sản xuất hoặc liên hệ support Yoosee.
