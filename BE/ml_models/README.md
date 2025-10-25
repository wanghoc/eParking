# ML Models Directory

Thư mục này chứa các ML models cho hệ thống nhận diện biển số xe.

## Cấu trúc

```
ml_models/
├── plate_detector/          # Model nhận diện vị trí biển số
│   ├── model.pt            # Model file (đặt model của bạn vào đây)
│   ├── config.json         # Cấu hình model
│   └── README.md           # Thông tin chi tiết
│
├── character_recognition/   # Model nhận diện ký tự
│   ├── model.pt            # Model file (đặt model của bạn vào đây)
│   ├── config.json         # Cấu hình model
│   └── README.md           # Thông tin chi tiết
│
└── utils/                   # Utilities
    ├── preprocessing.py     # Tiền xử lý ảnh
    ├── postprocessing.py    # Hậu xử lý kết quả
    └── inference.py         # Chạy inference
```

## Bước đầu tiên

1. **Đặt model files vào đúng thư mục:**

   - Model nhận diện biển số → `plate_detector/model.pt`
   - Model nhận diện ký tự → `character_recognition/model.pt`

2. **Cập nhật config files:**

   - Chỉnh sửa `config.json` trong mỗi thư mục theo cấu hình model của bạn

3. **Cài đặt dependencies:**

   ```bash
   pip install -r ../requirements_ml.txt
   ```

4. **Test models:**
   - Test model 1: Xem `plate_detector/README.md`
   - Test model 2: Xem `character_recognition/README.md`

## Tài liệu chi tiết

Xem file `ML_INTEGRATION_GUIDE.md` ở thư mục gốc project để biết hướng dẫn chi tiết.
