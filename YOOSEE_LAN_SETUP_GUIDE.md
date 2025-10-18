# Hướng Dẫn Cấu Hình Camera Yoosee Để Streaming Qua LAN

## ✅ Bước 1: Bật ONVIF/RTSP Trong App Yoosee

### 1.1 Mở App Yoosee
- Mở app Yoosee trên điện thoại
- Đảm bảo đã kết nối camera thành công

### 1.2 Vào Settings Camera
1. Chọn camera của bạn trong danh sách
2. Click vào icon **⚙️ Settings** (góc trên bên phải)
3. Tìm các mục sau:

### 1.3 Enable ONVIF (Khuyến nghị)
```
Settings → Advanced Settings → ONVIF
- Enable ONVIF: ON ✅
- ONVIF Port: 80 (hoặc 8080)
- Authentication: ON
- Username: admin
- Password: [đặt password mới]
```

### 1.4 Enable RTSP (Alternative)
```
Settings → Advanced Settings → RTSP
- Enable RTSP: ON ✅
- RTSP Port: 554
- Authentication: ON
- Username: admin
- Password: [đặt password mới]
```

### 1.5 Lưu và Khởi Động Lại
- Click **Save**
- Restart camera (tắt nguồn 10 giây rồi bật lại)
- Đợi 30-60 giây cho camera boot lại

---

## ✅ Bước 2: Kiểm Tra Kết Nối

### 2.1 Scan Ports Sau Khi Cấu Hình
Chạy lệnh sau để kiểm tra port đã mở:

```powershell
# Test RTSP port
docker exec eparking_backend nc -zv -w 2 192.168.1.16 554

# Test ONVIF port
docker exec eparking_backend nc -zv -w 2 192.168.1.16 80
docker exec eparking_backend nc -zv -w 2 192.168.1.16 8080
```

**Kết quả mong đợi**:
```
Connection to 192.168.1.16 554 port [tcp/rtsp] succeeded!
Connection to 192.168.1.16 80 port [tcp/http] succeeded!
```

### 2.2 Test RTSP Stream
```powershell
# Test với admin:admin
docker exec eparking_backend ffmpeg -rtsp_transport tcp -i "rtsp://admin:admin@192.168.1.16:554/11" -vframes 1 -f image2pipe -vcodec mjpeg - > test.jpg 2>&1
```

**Nếu thành công**: File test.jpg sẽ có kích thước > 10KB

### 2.3 Test HTTP Snapshot (ONVIF)
```powershell
# Test HTTP snapshot endpoint
Invoke-WebRequest -Uri "http://admin:admin@192.168.1.16/onvif/snapshot" -OutFile "onvif_test.jpg"
```

---

## ✅ Bước 3: Cập Nhật Camera Trong Hệ Thống

Sau khi enable ONVIF/RTSP, cập nhật thông tin camera:

### 3.1 Xóa Camera Test Cũ
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/cameras/51" -Method DELETE
```

### 3.2 Tạo Camera Mới Với RTSP
```powershell
$body = @{
    name = 'Camera Yoosee LAN - RTSP'
    type = 'Vao'
    status = 'Hoạt động'
    ip_address = '192.168.1.16'
    protocol = 'RTSP'
    port = 554
    rtsp_url = 'rtsp://192.168.1.16:554/11'
    username = 'admin'
    password = 'admin'  # Thay bằng password bạn đặt
    resolution = '1080p'
    fps = 25
    camera_brand = 'Yoosee'
    device_id = '7804144881'
    mac_address = '78:22:88:4b:d2:b3'
    onvif_id = '2024DPP9340(M)'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/cameras" -Method POST -Body $body -ContentType "application/json"
```

### 3.3 Hoặc Với ONVIF/HTTP
```powershell
$body = @{
    name = 'Camera Yoosee LAN - ONVIF'
    type = 'Vao'
    status = 'Hoạt động'
    ip_address = '192.168.1.16'
    protocol = 'ONVIF'
    port = 80
    http_url = 'http://192.168.1.16/onvif/snapshot'
    username = 'admin'
    password = 'admin'  # Thay bằng password bạn đặt
    resolution = '1080p'
    camera_brand = 'Yoosee'
    device_id = '7804144881'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/cameras" -Method POST -Body $body -ContentType "application/json"
```

---

## ✅ Bước 4: Test Streaming

### 4.1 Lấy Camera ID Mới
```powershell
$cameras = Invoke-RestMethod -Uri "http://localhost:5000/api/cameras"
$yoosee = $cameras | Where-Object { $_.name -like "*Yoosee LAN*" }
Write-Host "Camera ID: $($yoosee.id)"
```

### 4.2 Test Backend Stream Endpoint
```powershell
# Thay 55 bằng camera ID thật
Invoke-WebRequest -Uri "http://localhost:5000/api/cameras/55/stream" -OutFile "yoosee_stream.jpg"

# Kiểm tra kích thước
$size = (Get-Item yoosee_stream.jpg).Length
if ($size -gt 10000) {
    Write-Host "✅ SUCCESS! Streaming works! Size: $size bytes"
} else {
    Write-Host "❌ Failed or invalid image"
}
```

### 4.3 Xem Trong Browser
1. Mở: http://localhost:3000
2. Login với tài khoản admin
3. Vào **Camera Management**
4. Camera Yoosee sẽ hiển thị streaming real-time!

---

## 🔍 Troubleshooting

### Vấn Đề 1: Không Tìm Thấy ONVIF/RTSP Setting
**Giải pháp**:
- Update app Yoosee lên phiên bản mới nhất
- Một số camera Yoosee rất cũ không hỗ trợ ONVIF
- Thử vào **Advanced Settings** → **Network** → **Protocol**

### Vấn Đề 2: Port Vẫn Đóng Sau Khi Enable
**Giải pháp**:
- Restart camera hoàn toàn (tắt nguồn 30 giây)
- Kiểm tra firewall trong camera settings
- Thử port khác: 8000, 8080, 8888

### Vấn Đề 3: 401 Unauthorized
**Giải pháp**:
- Username/password không đúng
- Thử các combo phổ biến:
  - admin/admin
  - admin/[password WiFi]
  - admin/888888
  - admin/123456

### Vấn Đề 4: 400 Bad Request hoặc Timeout
**Giải pháp**:
- RTSP URL không đúng format
- Thử các URL phổ biến:
  ```
  rtsp://IP:554/11
  rtsp://IP:554/live
  rtsp://IP:554/stream1
  rtsp://IP:554/ch0
  rtsp://IP:554/Streaming/Channels/101
  ```

### Vấn Đề 5: Camera Không Hỗ Trợ ONVIF/RTSP
**Giải pháp cuối cùng**:
- Nâng cấp firmware camera (nếu có)
- Sử dụng camera IP khác (Hikvision, Dahua)
- Hoặc chấp nhận dùng app Yoosee cho mobile only

---

## 📋 Camera RTSP URL Phổ Biến

| Brand     | Main Stream URL                                    | Sub Stream URL                          |
|-----------|---------------------------------------------------|----------------------------------------|
| Yoosee    | rtsp://IP:554/11                                   | rtsp://IP:554/12                       |
| Hikvision | rtsp://IP:554/Streaming/Channels/101              | rtsp://IP:554/Streaming/Channels/102   |
| Dahua     | rtsp://IP:554/cam/realmonitor?channel=1&subtype=0 | rtsp://IP:554/cam/realmonitor?channel=1&subtype=1 |
| TP-Link   | rtsp://IP:554/stream1                             | rtsp://IP:554/stream2                  |
| Xiaomi    | rtsp://IP:554/live/ch00_0                         | rtsp://IP:554/live/ch00_1              |

---

## 📞 Cần Trợ Giúp?

Nếu sau khi làm theo hướng dẫn này vẫn không hoạt động, hãy:
1. Chụp screenshot settings của camera trong app
2. Chạy lệnh: `docker exec eparking_backend nc -zv 192.168.1.16 80 554 8000 8080`
3. Share kết quả để được hỗ trợ thêm

---

**Good luck! 🚀**
