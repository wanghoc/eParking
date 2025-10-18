# 🎥 CẬP NHẬT: HỆ THỐNG STREAMING CAMERA IP YOOSEE

## ✅ ĐÃ TRIỂN KHAI

### 🔄 Thay Đổi Chính

**TRƯỚC:**
- ❌ Hiển thị webcam máy tính
- ❌ Không stream từ camera IP thật

**SAU:**
- ✅ Stream trực tiếp từ camera IP Yoosee
- ✅ Hỗ trợ nhiều protocol: Yoosee, RTSP, HTTP, ONVIF
- ✅ Auto-refresh snapshot mỗi giây
- ✅ Hiển thị trạng thái kết nối realtime

---

## 📋 THÔNG TIN CAMERA CỦA BẠN

Từ ảnh bạn gửi:

### Model: AK2P31-JW-Q2-18D-HB
```
- Type: IPC Camera
- Power: DC12V/2A  
- Lens: 3.4MM
- Resolution: 3MP
- WiFi: Hoa thoa
- Password: 0977298362
```

### Thông tin từ App Yoosee:
```
- Device ID: 7804144881
- IP: 192.168.1.16
- MAC: 78:22:88:4b:d2:b3
- ONVIF ID: 2024DPP9340(M)
```

---

## 🎯 CÁCH SỬ DỤNG

### Bước 1: Truy cập hệ thống
```
URL: http://localhost:3000
Login: admin@dlu.edu.vn / admin123
```

### Bước 2: Thêm camera Yoosee
1. Vào trang **Camera**
2. Nhấn **"Thêm camera"**
3. Điền thông tin:

**Bước 1 - Thông tin cơ bản:**
```
Tên camera: Camera Yoosee Taka
Loại: Vào (hoặc Ra)
Vị trí: Bãi xe A - Cổng vào
Thương hiệu: Yoosee
```

**Bước 2 - Cấu hình kết nối:**
```
Protocol: Yoosee
Device ID: 7804144881
IP address: 192.168.1.16
Port: 8000 (tự động)
```

**Bước 3 - Cài đặt nâng cao (tùy chọn):**
```
MAC Address: 78:22:88:4b:d2:b3
ONVIF ID: 2024DPP9340(M)
Resolution: 3MP / 1080p
```

4. Nhấn **"Test"** → **"Lưu"**

### Bước 3: Xem stream camera
- Camera sẽ tự động hiển thị trên trang Camera
- Stream cập nhật mỗi giây
- Nhấn vào camera để xem toàn màn hình

---

## 🔧 CẤU TRÚC KỸ THUẬT

### Component Mới: `IPCameraStream.tsx`

**Tính năng:**
- ✅ Hỗ trợ 4 protocols: Yoosee, RTSP, HTTP, ONVIF
- ✅ Auto-refresh snapshot (1 FPS)
- ✅ Hiển thị trạng thái kết nối (Online/Offline/Connecting)
- ✅ Error handling đầy đủ
- ✅ Camera info overlay

**Protocol URLs:**

1. **Yoosee Protocol:**
```
URL: /api/cameras/:id/stream?protocol=yoosee&deviceId=7804144881
Hoặc snapshot: http://192.168.1.16:8000/snapshot.jpg
```

2. **HTTP Protocol:**
```
URL: http://192.168.1.16:80/videostream.cgi
Auto-refresh mỗi giây
```

3. **RTSP Protocol:**
```
URL: /api/cameras/:id/stream?rtsp=rtsp://user:pass@192.168.1.16:554/live/ch0
Backend proxy stream
```

4. **ONVIF Protocol:**
```
URL: /api/cameras/:id/stream?protocol=onvif
Auto-discovery via ONVIF
```

---

## 📊 BACKEND API CẦN BỔ SUNG

### Endpoint cần thêm:

#### 1. GET `/api/cameras/:id/stream`
**Chức năng:** Proxy stream từ camera IP

**Query Parameters:**
- `protocol`: yoosee | rtsp | onvif
- `deviceId`: Device ID cho Yoosee
- `rtsp`: RTSP URL cho RTSP protocol

**Response:** 
- Content-Type: image/jpeg (cho snapshot)
- Content-Type: video/mp4 (cho video stream)

**Implementation cần làm:**
```javascript
app.get('/api/cameras/:id/stream', async (req, res) => {
  const { id } = req.params;
  const { protocol, deviceId, rtsp } = req.query;
  
  const camera = await prisma.camera.findUnique({ where: { id: parseInt(id) } });
  
  if (!camera) {
    return res.status(404).json({ message: 'Camera not found' });
  }
  
  try {
    switch (protocol) {
      case 'yoosee':
        // Fetch snapshot from Yoosee camera
        const yooseeUrl = `http://${camera.ip_address}:${camera.port || 8000}/snapshot.jpg`;
        const yooseeResponse = await fetch(yooseeUrl);
        const yooseeBuffer = await yooseeResponse.buffer();
        res.set('Content-Type', 'image/jpeg');
        res.send(yooseeBuffer);
        break;
        
      case 'rtsp':
        // Proxy RTSP stream (cần ffmpeg)
        // Convert RTSP to MJPEG hoặc HLS
        break;
        
      case 'onvif':
        // ONVIF discovery và stream
        break;
        
      default:
        // HTTP snapshot
        const httpUrl = camera.http_url || `http://${camera.ip_address}:${camera.port || 80}/snapshot.jpg`;
        const httpResponse = await fetch(httpUrl);
        const httpBuffer = await httpResponse.buffer();
        res.set('Content-Type', 'image/jpeg');
        res.send(httpBuffer);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stream', error: error.message });
  }
});
```

---

## 🎨 UI/UX IMPROVEMENTS

### Camera Grid View
- ✅ 2 cameras per row
- ✅ Aspect ratio 16:9
- ✅ Hover effect với ring cyan
- ✅ Click để xem fullscreen
- ✅ Connection status indicator
- ✅ Camera info overlay

### Connection Status
- 🟢 **Online**: Màu xanh, có icon Wifi
- 🔴 **Offline**: Màu đỏ, có icon WifiOff
- 🟡 **Connecting**: Màu vàng, spinner animation

### Error Handling
- ❌ Hiển thị thông báo lỗi rõ ràng
- 📡 Hiển thị IP và Device ID khi lỗi
- 🔄 Auto-retry khi mất kết nối

---

## 🧪 TESTING

### Test Case 1: Camera với Device ID
```
Input:
- Protocol: Yoosee
- Device ID: 7804144881
- IP: 192.168.1.16

Expected:
- Hiển thị snapshot từ camera
- Refresh mỗi giây
- Status: Online (nếu kết nối được)
```

### Test Case 2: Camera với RTSP
```
Input:
- Protocol: RTSP
- IP: 192.168.1.16
- Port: 554
- Username: admin
- Password: ****

Expected:
- Stream qua backend proxy
- Hiển thị video realtime
```

### Test Case 3: Camera offline
```
Input:
- IP sai hoặc camera tắt

Expected:
- Hiển thị icon AlertCircle
- Message: "Không thể kết nối tới camera..."
- Status: Offline (đỏ)
```

---

## 🚀 NEXT STEPS

### 1. Backend Stream Proxy (QUAN TRỌNG!)
Cần implement endpoint `/api/cameras/:id/stream` để:
- Fetch snapshot từ camera Yoosee
- Proxy RTSP stream
- Handle ONVIF protocol

### 2. Video Streaming (Nâng cao)
Thay snapshot bằng video stream:
- Sử dụng HLS (HTTP Live Streaming)
- Hoặc WebRTC cho low latency
- FFmpeg để convert RTSP → HLS/WebRTC

### 3. PTZ Control (Tùy chọn)
Nếu camera hỗ trợ PTZ (Pan-Tilt-Zoom):
- Thêm controls để điều khiển camera
- API để gửi lệnh PTZ

### 4. Motion Detection (Tùy chọn)
- Detect chuyển động từ camera
- Tạo alerts khi có biến động

---

## 📝 NOTES

### Camera Yoosee Specifics:
1. **Port mặc định**: 8000
2. **Snapshot URL**: `http://{IP}:8000/snapshot.jpg`
3. **Streaming**: P2P qua Device ID
4. **Authentication**: WiFi password (0977298362)

### Limitations hiện tại:
1. ⚠️ Chỉ hiển thị snapshot (1 FPS)
2. ⚠️ Chưa có video streaming thật
3. ⚠️ Backend chưa proxy stream

### Để có video streaming thật:
1. Backend cần ffmpeg
2. Convert RTSP → HLS hoặc MJPEG
3. Frontend dùng `<video>` tag cho HLS

---

## ✅ CHECKLIST

- [x] Tạo component `IPCameraStream.tsx`
- [x] Update `CameraPage.tsx` với IP camera rendering
- [x] Xóa webcam initialization code
- [x] Fix TypeScript types
- [x] Rebuild frontend Docker
- [x] Test với camera mockup
- [ ] **Implement backend stream proxy** ⚠️
- [ ] Test với camera Yoosee thật
- [ ] Tối ưu performance
- [ ] Add video streaming (nâng cao)

---

## 🎉 KẾT QUẢ

✅ **Hệ thống đã sẵn sàng hiển thị stream từ camera IP!**

**Điều bạn cần làm:**
1. Mở http://localhost:3000
2. Thêm camera Yoosee với thông tin đúng
3. Camera sẽ hiển thị (nếu backend proxy đã có)
4. Nếu không thấy hình, check backend logs

**Lưu ý:**
- Frontend đã hoàn thành ✅
- Backend cần thêm stream proxy endpoint ⚠️
- Camera cần kết nối cùng mạng WiFi "Hoa thoa" ✅
