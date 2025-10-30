"""
Inference script for license plate detection and recognition
Usage: python inference.py --image <base64_encoded_image>

Tích hợp YOLOv8 OBB + EasyOCR cho hệ thống eParking
"""

import sys
import json
import base64
import numpy as np
from PIL import Image
import io
import time
import cv2
import os
import re
from datetime import datetime

# Import các thư viện ML
try:
    from ultralytics import YOLO
    import easyocr
    ML_AVAILABLE = True
except ImportError as e:
    print(f"Warning: ML libraries not available: {e}", file=sys.stderr)
    ML_AVAILABLE = False


class LicensePlateDetector:
    """Class nhận diện biển số xe - tích hợp từ dự án test_model"""
    
    def __init__(self):
        """Khởi tạo detector với YOLOv8 OBB và EasyOCR"""
        if not ML_AVAILABLE:
            raise RuntimeError("ML libraries not available. Please install: ultralytics, easyocr, opencv-python")
        
        # Đường dẫn model
        model_path = os.path.join(os.path.dirname(__file__), '..', 'plate_detector', 'best.pt')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        # Load YOLOv8 OBB model
        try:
            self.plate_model = YOLO(model_path)
            print(f"[INFO] Loaded plate detector model: {model_path}", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLO model: {e}")
        
        # Khởi tạo EasyOCR reader (Vietnamese + English)
        try:
            self.ocr_reader = easyocr.Reader(['vi', 'en'], gpu=False, verbose=False)
            print("[INFO] EasyOCR reader initialized", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize EasyOCR: {e}")
    
    def validate_plate_format(self, text):
        """
        Kiểm tra format biển số Việt Nam
        Format: 30A-12345, 51F1-12345, 29A12345, etc.
        Returns: (is_valid, cleaned_text)
        """
        text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
        # Pattern cho biển số VN: 2 số + 1-2 chữ + 4-5 số
        pattern = r'\d{2}[A-Z]{1,2}\d{4,5}'
        match = re.search(pattern, text)
        return match is not None, text
    
    def format_plate_text(self, text):
        """Format lại text biển số cho đẹp: 30A-12345"""
        text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
        match = re.search(r'(\d{2})([A-Z]{1,2})(\d{4,5})', text)
        if match:
            return f"{match.group(1)}{match.group(2)}-{match.group(3)}"
        return text
    
    def detect_and_recognize(self, image, conf_threshold=0.3):
        """
        Nhận diện biển số và đọc ký tự
        
        Args:
            image: numpy array (BGR format from OpenCV or RGB from PIL)
            conf_threshold: Ngưỡng confidence cho detection
        
        Returns:
            dict: Kết quả detection và OCR
        """
        try:
            # Đảm bảo image là BGR cho OpenCV
            if len(image.shape) == 3 and image.shape[2] == 3:
                # Nếu là RGB (từ PIL), convert sang BGR
                if isinstance(image, np.ndarray) and image.dtype == np.uint8:
                    # Kiểm tra xem có phải RGB không bằng cách thử detect
                    pass  # YOLO tự xử lý
            
            # Detect biển số với YOLOv8 OBB
            results = self.plate_model(image, conf=conf_threshold, verbose=False)
            
            if not results or len(results) == 0:
                return {
                    'success': False,
                    'message': 'No license plate detected',
                    'plate_number': None,
                    'confidence': 0.0
                }
            
            result = results[0]
            
            # Xử lý OBB (Oriented Bounding Box)
            if result.obb is None or len(result.obb) == 0:
                return {
                    'success': False,
                    'message': 'No license plate detected',
                    'plate_number': None,
                    'confidence': 0.0
                }
            
            # Lấy detection có confidence cao nhất
            best_detection = None
            best_conf = 0.0
            
            for obb in result.obb:
                conf = float(obb.conf[0]) if obb.conf is not None else 0.0
                
                if conf > best_conf:
                    best_conf = conf
                    
                    # Lấy tọa độ OBB (4 điểm)
                    points = obb.xyxyxyxy[0].cpu().numpy().astype(int)
                    
                    # Tính bounding box
                    x_coords = points[:, 0]
                    y_coords = points[:, 1]
                    x1, x2 = int(x_coords.min()), int(x_coords.max())
                    y1, y2 = int(y_coords.min()), int(y_coords.max())
                    
                    # Đảm bảo trong giới hạn
                    h, w = image.shape[:2]
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(w, x2)
                    y2 = min(h, y2)
                    
                    best_detection = {
                        'bbox': (x1, y1, x2, y2),
                        'confidence': conf,
                        'points': points
                    }
            
            if best_detection is None:
                return {
                    'success': False,
                    'message': 'No valid detection found',
                    'plate_number': None,
                    'confidence': 0.0
                }
            
            # Crop biển số
            x1, y1, x2, y2 = best_detection['bbox']
            
            if x2 <= x1 or y2 <= y1:
                return {
                    'success': False,
                    'message': 'Invalid bounding box',
                    'plate_number': None,
                    'confidence': best_detection['confidence']
                }
            
            cropped_plate = image[y1:y2, x1:x2]
            
            # Tiền xử lý cho OCR
            gray = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)  # Tăng độ tương phản
            
            # Resize nếu quá nhỏ
            if gray.shape[1] < 200:
                scale = 200 / gray.shape[1]
                gray = cv2.resize(gray, None, fx=scale, fy=scale, 
                                interpolation=cv2.INTER_CUBIC)
            
            # OCR với EasyOCR
            ocr_results = self.ocr_reader.readtext(gray, detail=0)
            plate_text_raw = ''.join(ocr_results).replace(' ', '')
            
            # Validate và format
            is_valid, plate_text = self.validate_plate_format(plate_text_raw)
            plate_text_formatted = self.format_plate_text(plate_text) if is_valid else plate_text_raw
            
            return {
                'success': True,
                'plate_number': plate_text_formatted if is_valid else None,
                'confidence': best_detection['confidence'],
                'bbox': {
                    'x': x1,
                    'y': y1,
                    'width': x2 - x1,
                    'height': y2 - y1
                },
                'raw_text': plate_text_raw,
                'is_valid': is_valid,
                'annotated_image': self._draw_result(image, best_detection, plate_text_formatted)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'plate_number': None,
                'confidence': 0.0
            }
    
    def _draw_result(self, image, detection, plate_text):
        """Vẽ kết quả lên ảnh"""
        try:
            annotated = image.copy()
            points = detection['points']
            x1, y1, x2, y2 = detection['bbox']
            conf = detection['confidence']
            
            # Vẽ OBB polygon
            cv2.polylines(annotated, [points], True, (0, 255, 0), 2)
            
            # Vẽ text
            label = f"{plate_text} ({conf*100:.1f}%)" if plate_text else f"Conf: {conf*100:.1f}%"
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            
            # Background cho text
            cv2.rectangle(annotated, (x1, y1 - text_h - 10), 
                         (x1 + text_w + 10, y1), (0, 255, 0), -1)
            
            # Text
            cv2.putText(annotated, label, (x1 + 5, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            return annotated
        except:
            return image


# Global detector instance (lazy loading)
_detector = None

def get_detector():
    """Get or create detector instance"""
    global _detector
    if _detector is None:
        _detector = LicensePlateDetector()
    return _detector


def decode_base64_image(base64_str):
    """
    Decode base64 string to OpenCV image (BGR format)
    
    Args:
        base64_str: Base64 encoded image string
        
    Returns:
        numpy array: Decoded image in BGR format
    """
    try:
        # Remove header if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_data))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        return img_array
    except Exception as e:
        print(f"Error decoding image: {e}", file=sys.stderr)
        return None


def save_detection_image(image, plate_number, output_dir='detected_plates'):
    """
    Lưu ảnh detection vào thư mục
    
    Args:
        image: Annotated image
        plate_number: Biển số đã detect
        output_dir: Thư mục lưu ảnh
    
    Returns:
        str: Đường dẫn file đã lưu
    """
    try:
        # Tạo thư mục nếu chưa có
        os.makedirs(output_dir, exist_ok=True)
        
        # Tạo tên file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plate_clean = plate_number.replace('-', '').replace(' ', '') if plate_number else 'unknown'
        filename = f"{plate_clean}_{timestamp}.jpg"
        filepath = os.path.join(output_dir, filename)
        
        # Lưu ảnh
        cv2.imwrite(filepath, image)
        
        return filepath
    except Exception as e:
        print(f"Error saving image: {e}", file=sys.stderr)
        return None


def detect_and_recognize(image):
    """
    Main inference pipeline
    
    Args:
        image: Input image as numpy array (BGR format)
        
    Returns:
        dict: Detection and recognition results
    """
    start_time = time.time()
    
    try:
        if not ML_AVAILABLE:
            # Fallback for testing
            return {
                'success': True,
                'plate_number': '30A-12345',
                'confidence': 0.99,
                'message': 'ML libraries not available, returning mock data',
                'processing_time_ms': int((time.time() - start_time) * 1000)
            }
        
        # Get detector
        detector = get_detector()
        
        # Run detection and OCR
        result = detector.detect_and_recognize(image, conf_threshold=0.25)
        
        # Add processing time
        result['processing_time_ms'] = int((time.time() - start_time) * 1000)
        
        # Lưu ảnh nếu detect thành công
        if result['success'] and result.get('plate_number'):
            annotated_image = result.get('annotated_image')
            if annotated_image is not None:
                saved_path = save_detection_image(annotated_image, result['plate_number'])
                if saved_path:
                    result['saved_image'] = saved_path
                    print(f"[INFO] Saved detection image: {saved_path}", file=sys.stderr)
        
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'plate_number': None,
            'confidence': 0.0,
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }


def main():
    """Main entry point"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Missing image argument. Usage: python inference.py --image <base64_string>'
        }))
        return
    
    # Read image from command line argument
    image_base64 = sys.argv[2]
    
    # Decode image
    image = decode_base64_image(image_base64)
    
    if image is None:
        print(json.dumps({
            'success': False,
            'error': 'Failed to decode base64 image'
        }))
        return
    
    # Run inference
    result = detect_and_recognize(image)
    
    # Remove annotated_image from output (too large for JSON)
    if 'annotated_image' in result:
        del result['annotated_image']
    
    # Print result as JSON
    print(json.dumps(result))


if __name__ == '__main__':
    main()

