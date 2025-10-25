# Hướng dẫn tích hợp ML Models cho nhận diện biển số xe

## Tổng quan

Hệ thống eParking sử dụng 2 ML models để nhận diện biển số xe:

1. **Model 1**: Nhận diện và định vị biển số xe trong hình ảnh
2. **Model 2**: Nhận diện ký tự trong biển số đã được cắt ra

## Kiến trúc hệ thống

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Camera    │─────▶│  Model 1     │─────▶│  Model 2    │
│  (Webcam)   │      │(Detect Plate)│      │(Recognize   │
└─────────────┘      └──────────────┘      │ Characters) │
                                            └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Database   │
                                            │  (Save)     │
                                            └─────────────┘
```

## Cấu trúc thư mục

```
BE/
├── ml_models/
│   ├── plate_detector/          # Model 1: Nhận diện biển số
│   │   ├── model.pt             # Model file (PyTorch)
│   │   ├── config.json          # Cấu hình model
│   │   └── README.md            # Thông tin chi tiết model
│   │
│   ├── character_recognition/   # Model 2: Nhận diện ký tự
│   │   ├── model.pt             # Model file (PyTorch)
│   │   ├── config.json          # Cấu hình model
│   │   └── README.md            # Thông tin chi tiết model
│   │
│   └── utils/
│       ├── preprocessing.py     # Tiền xử lý ảnh
│       ├── postprocessing.py    # Hậu xử lý kết quả
│       └── inference.py         # Chạy inference
│
├── api/
│   └── ml_service.js           # API endpoints cho ML
│
└── requirements_ml.txt          # Python dependencies
```

## Cài đặt

### 1. Cài đặt Python dependencies

```bash
cd BE
pip install -r requirements_ml.txt
```

### 2. Đặt models vào đúng thư mục

Copy các model files đã train vào:

- Model 1 → `BE/ml_models/plate_detector/model.pt`
- Model 2 → `BE/ml_models/character_recognition/model.pt`

### 3. Cấu hình models

Chỉnh sửa `config.json` trong mỗi thư mục model:

**plate_detector/config.json:**

```json
{
  "model_type": "yolov8",
  "input_size": [640, 640],
  "confidence_threshold": 0.5,
  "nms_threshold": 0.4,
  "classes": ["license_plate"]
}
```

**character_recognition/config.json:**

```json
{
  "model_type": "cnn_lstm",
  "input_size": [128, 32],
  "characters": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-",
  "max_length": 10
}
```

## API Endpoints

### 1. Nhận diện biển số từ webcam stream

**POST** `/api/ml/detect-plate`

Request:

```json
{
  "image_base64": "base64_encoded_image",
  "camera_id": 1
}
```

Response:

```json
{
  "success": true,
  "plate_number": "49P1-12345",
  "confidence": 0.95,
  "bbox": {
    "x": 100,
    "y": 150,
    "width": 200,
    "height": 50
  },
  "processing_time_ms": 150
}
```

### 2. Stream webcam và tự động nhận diện

**WebSocket** `/ws/camera/:cameraId`

Client gửi frames từ webcam → Server xử lý và trả về kết quả real-time

## Code tích hợp

### Backend (Node.js + Python)

**BE/api/ml_service.js:**

```javascript
const { spawn } = require("child_process");
const express = require("express");
const router = express.Router();

// Chạy Python script để inference
function runInference(imageBase64) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [
      "ml_models/utils/inference.py",
      "--image",
      imageBase64,
    ]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve(JSON.parse(result));
      } else {
        reject(new Error("Python inference failed"));
      }
    });
  });
}

// API endpoint
router.post("/detect-plate", async (req, res) => {
  try {
    const { image_base64, camera_id } = req.body;

    // Run inference
    const result = await runInference(image_base64);

    // Save to database if plate detected
    if (result.success && result.plate_number) {
      await saveDetection(camera_id, result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
```

### Python Inference Script

**BE/ml_models/utils/inference.py:**

```python
import sys
import json
import base64
import numpy as np
from PIL import Image
import io
import torch

# Import your models
from plate_detector.model import PlateDetector
from character_recognition.model import CharacterRecognizer

def decode_base64_image(base64_str):
    """Decode base64 string to image"""
    img_data = base64.b64decode(base64_str)
    img = Image.open(io.BytesIO(img_data))
    return np.array(img)

def detect_and_recognize(image):
    """Main inference pipeline"""
    # Step 1: Detect plate
    detector = PlateDetector('ml_models/plate_detector/model.pt')
    plates = detector.detect(image)

    if len(plates) == 0:
        return {
            'success': False,
            'message': 'No license plate detected'
        }

    # Get highest confidence plate
    plate = plates[0]
    plate_img = plate['image']

    # Step 2: Recognize characters
    recognizer = CharacterRecognizer('ml_models/character_recognition/model.pt')
    plate_text = recognizer.recognize(plate_img)

    return {
        'success': True,
        'plate_number': plate_text,
        'confidence': plate['confidence'],
        'bbox': plate['bbox']
    }

if __name__ == '__main__':
    # Read image from command line argument
    image_base64 = sys.argv[2]

    # Decode image
    image = decode_base64_image(image_base64)

    # Run inference
    result = detect_and_recognize(image)

    # Print result as JSON
    print(json.dumps(result))
```

### Frontend Integration

**FE/src/components/WebcamStream.tsx** (đã tích hợp sẵn):

Thêm chức năng capture và gửi frame để nhận diện:

```typescript
// Capture frame every 2 seconds for detection
useEffect(() => {
  if (!isConnected || !videoRef.current) return;

  const interval = setInterval(() => {
    captureAndDetect();
  }, 2000);

  return () => clearInterval(interval);
}, [isConnected]);

const captureAndDetect = async () => {
  if (!videoRef.current) return;

  // Create canvas to capture frame
  const canvas = document.createElement("canvas");
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx?.drawImage(videoRef.current, 0, 0);

  // Convert to base64
  const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

  // Send to backend for detection
  try {
    const response = await fetch("/api/ml/detect-plate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: imageBase64,
        camera_id: cameraId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Detected plate:", result.plate_number);
      // Update UI or trigger action
    }
  } catch (error) {
    console.error("Detection error:", error);
  }
};
```

## Testing

### 1. Test Model 1 (Plate Detection)

```bash
cd BE/ml_models/plate_detector
python test.py --image test_images/car1.jpg
```

### 2. Test Model 2 (Character Recognition)

```bash
cd BE/ml_models/character_recognition
python test.py --image test_images/plate1.jpg
```

### 3. Test Full Pipeline

```bash
cd BE
node test_ml_pipeline.js
```

## Performance Optimization

### 1. Batch Processing

Process multiple frames in batches để tăng throughput:

```python
def detect_batch(images):
    """Detect plates in batch"""
    results = []
    for img in images:
        result = detect_and_recognize(img)
        results.append(result)
    return results
```

### 2. GPU Acceleration

Sử dụng GPU để tăng tốc inference:

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
```

### 3. Model Optimization

- Chuyển models sang ONNX format
- Sử dụng TensorRT hoặc OpenVINO
- Quantization để giảm kích thước model

## Troubleshooting

### Lỗi thường gặp:

1. **Model không load được**

   - Kiểm tra đường dẫn model file
   - Đảm bảo Python version khớp với version train model

2. **Độ chính xác thấp**

   - Kiểm tra chất lượng ảnh từ webcam
   - Điều chỉnh confidence threshold
   - Cân nhắc re-train model với data tốt hơn

3. **Inference chậm**
   - Sử dụng GPU
   - Giảm resolution ảnh input
   - Optimize model (ONNX, TensorRT)

## Monitoring

### Metrics cần theo dõi:

- Detection rate (% frames có biển số được phát hiện)
- Recognition accuracy (độ chính xác nhận diện ký tự)
- Processing time (thời gian xử lý mỗi frame)
- False positive/negative rate

## Next Steps

1. ✅ Train và export models
2. ✅ Đặt models vào đúng thư mục
3. ✅ Cập nhật config files
4. ⬜ Test từng model riêng lẻ
5. ⬜ Test full pipeline
6. ⬜ Tích hợp vào production
7. ⬜ Monitor và optimize

## Support

Nếu gặp vấn đề, vui lòng:

1. Check logs trong `BE/logs/ml_service.log`
2. Test models riêng lẻ trước
3. Đảm bảo dependencies được cài đầy đủ
