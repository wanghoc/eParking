# Hướng dẫn chạy eParking

Hệ thống có 2 phần:

| Phần | Chạy ở đâu | Mở bằng |
|---|---|---|
| **Cloud**: database + backend + web | Docker | `start-eparking.bat` |
| **Máy trạm cổng**: camera + AI + barrier | Ứng dụng Windows | shortcut **eParking Edge** trên Desktop |

## 1. Khởi động Cloud (Docker)

Nhấp đúp **`D:\eParking\start-eparking.bat`**. Script tự mở Docker Desktop nếu chưa chạy, khởi động 3 container rồi mở trình duyệt.

| Trang | Địa chỉ | Tài khoản demo |
|---|---|---|
| Sinh viên | http://localhost:3000 | `2212375@dlu.edu.vn` / `123456` |
| Quản trị | http://localhost:3001 | `admin@dlu.edu.vn` / `123456` |
| API | http://localhost:5000/api/health | – |

- Cổng 3000 chỉ cho tài khoản sinh viên; cổng 3001 chỉ cho admin. Đăng nhập sai cổng sẽ được nhắc chuyển.
- Dừng hệ thống: `stop-eparking.bat`. **Dữ liệu database được giữ lại** (volume `eparking_pg_data`) và vẫn còn sau khi tắt máy.
- Bản sao lưu database trước lần nâng cấp: `backups\eparking_before_edge_*.sql`.

## 2. Mở ứng dụng máy trạm

Cloud cần chạy trước. Sau đó nhấp đúp shortcut **eParking Edge** trên Desktop (hoặc `D:\eParking\edge\dist\eParkingEdge\eParkingEdge.exe`).

- Lần mở đầu mất khoảng 10 giây để nạp mô hình AI.
- Góc trên phải hiện **● ONLINE** (xanh) khi đã kết nối Cloud, **● OFFLINE (tự chủ)** (cam) khi mất kết nối.
- Nhập **tên bảo vệ ca trực** ở góc trên phải. Cần có tên này mới mở barrier thủ công được.

### Màn hình
- **LÀN VÀO**: đang dùng webcam của máy. Đưa biển số vào khung hình; khi nhận diện chắc chắn (2 khung liên tiếp) app tự gửi check-in.
- **LÀN RA**: chưa gắn camera; bấm **Nhập biển số tay** để check-out (vd `49G1-11111`).
- Thẻ kết quả:
  - 🟩 xanh: mở cổng
  - 🟨 vàng: mở nhưng có lưu ý (nợ cước khi offline, mở thủ công)
  - 🟥 đỏ: bị chặn (đang nợ cước, không đủ tiền, xe chưa đăng ký). Bảo vệ bấm **Mở barrier thủ công** và nhập lý do.
- Bảng dưới cùng: 30 sự kiện gần nhất và trạng thái đồng bộ.

### Thử kịch bản mất mạng
1. Trong app, check-in xe `49G1-11111` bằng nhập tay → xanh, trạng thái "Đã đồng bộ".
2. Chạy `stop-eparking.bat` (giả lập mất mạng). Sau vài giây app chuyển **OFFLINE**.
3. Check-out `49G1-11111` → barrier vẫn mở, trạng thái "Chờ đồng bộ".
4. Chạy lại `start-eparking.bat`. App tự về **ONLINE** và đẩy hàng chờ lên; xem lịch sử ở trang sinh viên (3000).
5. Nếu số dư không đủ, ví sẽ âm. Lượt kế tiếp của xe đó sẽ bị chặn đỏ tại cổng; trang admin (3001) hiện xe trong danh sách **Tài khoản nợ cước**.

## 3. Cấu hình máy trạm

Sửa `D:\eParking\edge\dist\eParkingEdge\config.yaml`, rồi tắt và mở lại app.

```yaml
lanes:
  - lane: IN
    camera: "0"          # webcam; camera IP: "rtsp://user:pass@192.168.1.64:554/Streaming/Channels/102"
  - lane: OUT
    camera: ""           # trống = nhập tay
cloud:
  base_url: "http://localhost:5000"   # đổi thành địa chỉ server nếu Cloud chạy máy khác
  device_key: "edk_..."               # khóa của máy trạm GATE-A
barrier:
  kind: log              # log = chỉ ghi log; serial = relay USB; http = relay mạng
```

- Nếu chỉ có 1 webcam, chỉ một làn được dùng webcam (2 làn không mở chung một thiết bị được).
- Cấp khóa cho máy trạm mới:
  ```
  docker compose exec backend node scripts/edge-device.js create --code GATE-B --name "Cổng B" --lane BOTH --lot 1
  ```
  Đổi khóa: `... rotate --code GATE-A` · Thu hồi: `... revoke --code GATE-A` · Danh sách: `... list`
- Dữ liệu cục bộ (hàng chờ SQLite, ảnh bằng chứng, log) nằm trong thư mục `data\` cạnh file exe. Lỗi xem ở `data\edge.log`.

## 4. Build lại ứng dụng (khi sửa code trong `edge/`)

```powershell
cd D:\eParking\edge
.\.venv\Scripts\python -m pytest     # chạy test
.\build_exe.ps1                       # tạo lại dist\eParkingEdge
```
Đóng app trước khi build. Script tự giữ lại `config.yaml` và `data\` (khóa thiết bị, hàng chờ chưa đồng bộ).

Sau khi sửa code web/backend: `docker compose up -d --build`.

## 5. Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| App báo **OFFLINE** dù Cloud đang chạy | Kiểm tra http://localhost:5000/api/health; kiểm tra `cloud.base_url` |
| App báo **SAI KHÓA THIẾT BỊ** | Cấp lại bằng `edge-device.js rotate`, dán key mới vào `config.yaml` |
| Hộp thoại "Không nạp được mô hình AI" | Thiếu thư mục `models\` cạnh exe; app vẫn dùng được với nhập tay |
| Không thấy hình camera | Webcam đang bị ứng dụng khác dùng, hoặc URL RTSP sai; xem `data\edge.log` |
| Trang web trắng / lỗi | `docker compose ps`, `docker compose logs -f backend` |
