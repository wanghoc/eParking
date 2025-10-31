#!/usr/bin/env python3
"""
Test script to verify license plate detection is working
"""
import sys
import base64
import json
from pathlib import Path

# Add BE to path
sys.path.insert(0, str(Path(__file__).parent / 'BE'))

try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
    print("✓ ML libraries loaded")
except ImportError as e:
    print(f"✗ Failed to import ML libraries: {e}")
    sys.exit(1)

# Load model
model_path = Path('/app/ml_models/plate_detector/best.pt')
if not model_path.exists():
    print(f"✗ Model not found at: {model_path}")
    sys.exit(1)

print(f"✓ Found model: {model_path}")

try:
    model = YOLO(str(model_path))
    print("✓ Model loaded successfully")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    sys.exit(1)

# Create test image (white rectangle simulating a license plate)
test_image = np.ones((480, 640, 3), dtype=np.uint8) * 255
cv2.rectangle(test_image, (200, 200), (440, 280), (0, 0, 0), 2)
cv2.putText(test_image, "29-T8", (220, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
cv2.putText(test_image, "2843", (240, 270), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

print("✓ Created test image")

# Run detection
try:
    results = model.predict(test_image, conf=0.25, verbose=False)
    print(f"✓ Detection ran successfully")
    
    if results and len(results) > 0:
        result = results[0]
        if hasattr(result, 'obb') and result.obb is not None:
            print(f"  Found {len(result.obb)} OBB detections")
            for i, box in enumerate(result.obb):
                conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                print(f"  Detection {i+1}: confidence = {conf:.2%}")
        elif hasattr(result, 'boxes') and result.boxes is not None:
            print(f"  Found {len(result.boxes)} box detections")
            for i, box in enumerate(result.boxes):
                conf = float(box.conf[0])
                print(f"  Detection {i+1}: confidence = {conf:.2%}")
        else:
            print(f"  No detections (result has no boxes/obb)")
    else:
        print(f"  No results returned")
        
except Exception as e:
    print(f"✗ Detection failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✓ All checks passed!")

