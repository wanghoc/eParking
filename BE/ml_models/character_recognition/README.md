# Model 2: Character Recognition

## Mô tả

Model này có nhiệm vụ nhận diện các ký tự trong biển số xe đã được cắt ra từ Model 1.

## Input

- **Format**: Grayscale image của biển số
- **Size**: 128x32 pixels (width x height)
- **Type**: numpy array hoặc PIL Image

## Output

```python
{
  "text": "49P1-12345",
  "confidence": 0.98,
  "characters": [
    {"char": "4", "confidence": 0.99},
    {"char": "9", "confidence": 0.98},
    {"char": "P", "confidence": 0.97},
    {"char": "1", "confidence": 0.99},
    {"char": "-", "confidence": 1.0},
    {"char": "1", "confidence": 0.99},
    {"char": "2", "confidence": 0.98},
    {"char": "3", "confidence": 0.99},
    {"char": "4", "confidence": 0.98},
    {"char": "5", "confidence": 0.97}
  ]
}
```

## Cách sử dụng

### 1. Đặt model file

Đặt file model đã train vào: `model.pt`

### 2. Cập nhật config

Chỉnh sửa `config.json` nếu cần:

- `characters`: Danh sách ký tự model có thể nhận diện
- `max_length`: Độ dài tối đa của biển số
- `input_size`: Kích thước input cho model

### 3. Test model

```python
from character_recognition import CharacterRecognizer
import cv2

# Load model
recognizer = CharacterRecognizer('model.pt')

# Load plate image (đã được crop từ Model 1)
plate_image = cv2.imread('plate_image.jpg')

# Recognize characters
result = recognizer.recognize(plate_image)

# Print result
print(f"Plate number: {result['text']}")
print(f"Confidence: {result['confidence']}")
```

## Requirements

- PyTorch >= 2.0
- OpenCV >= 4.8
- Pillow >= 10.0

## Training Info

- **Dataset**: [Thông tin về dataset bạn đã dùng]
- **Architecture**: [CNN + LSTM / Transformer / etc.]
- **Training epochs**: [Số epochs]
- **Character accuracy**: [Độ chính xác trên từng ký tự]

## Performance

- **Inference time**: ~10ms per plate (GPU)
- **Character accuracy**: 98%+
- **Plate accuracy**: 95%+ (tất cả ký tự đúng)

## Supported Formats

Model hỗ trợ các format biển số Việt Nam:

- **1 dòng**: `49P1-12345`
- **2 dòng**:
  ```
  49P1
  12345
  ```

## Character Set

```
Numbers: 0 1 2 3 4 5 6 7 8 9
Letters: A B C D E F G H K L M N P R S T U V X Y Z
Special: - (dấu gạch ngang)
```

**Lưu ý**: Không có chữ I, O, Q, W, J vì dễ nhầm với số

## Post-processing

Model tự động:

- Loại bỏ ký tự trùng lặp liên tiếp
- Format theo chuẩn biển số VN
- Sửa một số lỗi thường gặp (0↔O, 1↔I)

## Notes

- Ảnh biển số cần có độ sáng đủ
- Góc nghiêng < 15 độ cho kết quả tốt nhất
- Nên xử lý ảnh (denoise, sharpen) trước khi đưa vào model
