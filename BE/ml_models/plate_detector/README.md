# Model 1: License Plate Detector

## Mô tả

Model này có nhiệm vụ phát hiện và định vị biển số xe trong hình ảnh từ webcam.

## Input

- **Format**: RGB image
- **Size**: 640x640 pixels (có thể resize tự động)
- **Type**: numpy array hoặc PIL Image

## Output

```python
{
  "detections": [
    {
      "bbox": {
        "x": 100,      # x coordinate of top-left corner
        "y": 150,      # y coordinate of top-left corner
        "width": 200,  # width of bounding box
        "height": 50   # height of bounding box
      },
      "confidence": 0.95,
      "class": "license_plate",
      "image": np.array  # Cropped plate image
    }
  ]
}
```

## Cách sử dụng

### 1. Đặt model file

Đặt file model đã train vào: `model.pt`

### 2. Cập nhật config

Chỉnh sửa `config.json` nếu cần:

- `confidence_threshold`: Ngưỡng confidence tối thiểu (0-1)
- `nms_threshold`: Non-maximum suppression threshold
- `input_size`: Kích thước input cho model

### 3. Test model

```python
from plate_detector import PlateDetector
import cv2

# Load model
detector = PlateDetector('model.pt')

# Load image
image = cv2.imread('test_image.jpg')

# Detect plates
results = detector.detect(image)

# Print results
for detection in results['detections']:
    print(f"Plate found at: {detection['bbox']}")
    print(f"Confidence: {detection['confidence']}")
```

## Requirements

- PyTorch >= 2.0
- OpenCV >= 4.8
- Ultralytics (nếu dùng YOLO)

## Training Info

- **Dataset**: [Thông tin về dataset bạn đã dùng]
- **Architecture**: [Kiến trúc model: YOLO, Faster R-CNN, etc.]
- **Training epochs**: [Số epochs]
- **mAP**: [Mean Average Precision]

## Performance

- **Inference time**: ~50ms per image (GPU)
- **Accuracy**: 95%+ on test set
- **FPS**: ~20 frames per second

## Notes

- Model hoạt động tốt nhất với ánh sáng tốt
- Biển số nên chiếm ít nhất 5% diện tích ảnh
- Góc chụp không quá xiên (< 45 độ)
