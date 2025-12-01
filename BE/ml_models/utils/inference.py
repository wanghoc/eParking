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
    """Class nhận diện biển số xe - Sử dụng EasyOCR với preprocessing cải tiến"""
    
    def __init__(self):
        """Khởi tạo detector với YOLOv8 OBB và EasyOCR tối ưu"""
        if not ML_AVAILABLE:
            raise RuntimeError("ML libraries not available. Please install: ultralytics, torch, opencv-python")
        
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
        
        # Initialize EasyOCR with optimized settings
        print("[INFO] Loading EasyOCR reader (Vietnamese + English - OPTIMIZED)...", file=sys.stderr)
        self.ocr_reader = easyocr.Reader(['vi', 'en'], gpu=False, verbose=False)
        print("[INFO] EasyOCR reader loaded successfully", file=sys.stderr)
    
    def validate_plate_format(self, text):
        """
        Kiểm tra format biển số Việt Nam
        Format: 30A-12345, 51F1-12345, 29AB-12345, etc.
        Returns: (is_valid, cleaned_text)
        """
        text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
        # Pattern linh hoạt hơn: 2 số + 1-2 ký tự (chữ hoặc kết hợp) + 4-5 số
        pattern = r'^(\d{2})([A-Z]{1,2}|[A-Z]\d|\d[A-Z])(\d{4,5})$'
        match = re.match(pattern, text)
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
            
            # MULTI-PASS OCR với preprocessing cải tiến
            gray = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)
            
            # Resize to optimal size
            if gray.shape[1] < 300:
                scale = 300 / gray.shape[1]
                gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            
            candidates = []
            
            # Method 1: CLAHE + Bilateral Filter
            try:
                denoised1 = cv2.bilateralFilter(gray, 11, 17, 17)
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                enhanced1 = clahe.apply(denoised1)
                kernel_sharpen = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
                sharpened1 = cv2.filter2D(enhanced1, -1, kernel_sharpen)
                
                result1 = self.ocr_reader.readtext(sharpened1, detail=0,
                                                  allowlist='0123456789ABCDEFGHKLMNPRSTUVXYZ',
                                                  paragraph=False, batch_size=1)
                if result1:
                    text1 = ''.join(result1).replace(' ', '').upper()
                    if len(text1) >= 7:
                        candidates.append(text1)
            except:
                pass
            
            # Method 2: Adaptive Threshold
            try:
                denoised2 = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
                thresh2 = cv2.adaptiveThreshold(denoised2, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                               cv2.THRESH_BINARY, 11, 2)
                
                result2 = self.ocr_reader.readtext(thresh2, detail=0,
                                                  allowlist='0123456789ABCDEFGHKLMNPRSTUVXYZ',
                                                  paragraph=False, batch_size=1)
                if result2:
                    text2 = ''.join(result2).replace(' ', '').upper()
                    if len(text2) >= 7:
                        candidates.append(text2)
            except:
                pass
            
            # Method 3: Simple enhancement
            try:
                enhanced3 = cv2.equalizeHist(gray)
                result3 = self.ocr_reader.readtext(enhanced3, detail=0,
                                                  allowlist='0123456789ABCDEFGHKLMNPRSTUVXYZ',
                                                  paragraph=False, batch_size=1)
                if result3:
                    text3 = ''.join(result3).replace(' ', '').upper()
                    if len(text3) >= 7:
                        candidates.append(text3)
            except:
                pass
            
            # Chọn kết quả tốt nhất
            plate_text_raw = ''
            if candidates:
                for cand in candidates:
                    is_valid, _ = self.validate_plate_format(cand)
                    if is_valid:
                        plate_text_raw = cand
                        break
                
                if not plate_text_raw:
                    plate_text_raw = max(candidates, key=len)
            
            # Validate và format
            is_valid, plate_text = self.validate_plate_format(plate_text_raw)
            plate_text_formatted = self.format_plate_text(plate_text) if is_valid else plate_text_raw
            
            # Vẽ kết quả lên ảnh
            annotated_image = self._draw_result(image, best_detection, plate_text_formatted)
            
            # Encode annotated image to base64 for transmission
            _, buffer = cv2.imencode('.jpg', annotated_image, [cv2.IMWRITE_JPEG_QUALITY, 90])
            annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            
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
                'annotated_image': annotated_image,
                'annotated_image_base64': f"data:image/jpeg;base64,{annotated_base64}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'plate_number': None,
                'confidence': 0.0
            }
    
    def _draw_result(self, image, detection, plate_text):
        """Vẽ kết quả lên ảnh - style giống dự án test với khung xanh lá"""
        try:
            annotated = image.copy()
            points = detection['points']
            x1, y1, x2, y2 = detection['bbox']
            conf = detection['confidence']
            
            # Vẽ OBB polygon với màu xanh lá đậm (BGR format)
            cv2.polylines(annotated, [points], True, (0, 255, 0), 3)
            
            # Vẽ thêm rectangle bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Tạo label
            if plate_text:
                label = f"{plate_text}"
                conf_label = f"Conf: {conf*100:.1f}%"
            else:
                label = "License Plate"
                conf_label = f"Conf: {conf*100:.1f}%"
            
            # Đo kích thước text
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
            (conf_w, conf_h), _ = cv2.getTextSize(conf_label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            
            # Vẽ background cho biển số (xanh lá)
            box_height = label_h + conf_h + 20
            box_width = max(label_w, conf_w) + 20
            cv2.rectangle(annotated, (x1, y1 - box_height - 5), 
                         (x1 + box_width, y1), (0, 255, 0), -1)
            
            # Vẽ text biển số (màu đen, đậm)
            cv2.putText(annotated, label, (x1 + 10, y1 - conf_h - 15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            
            # Vẽ confidence (màu đen)
            cv2.putText(annotated, conf_label, (x1 + 10, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            return annotated
        except Exception as e:
            print(f"[ERROR] Drawing error: {e}", file=sys.stderr)
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
        
        # Handle different color formats
        if len(img_array.shape) == 3:
            if img_array.shape[2] == 4:
                # Remove alpha channel: RGBA -> BGR
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            elif img_array.shape[2] == 3:
                # Convert RGB to BGR for OpenCV
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
        print("[INFO] Starting detect_and_recognize", file=sys.stderr, flush=True)
        
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
        print("[INFO] Getting detector instance", file=sys.stderr, flush=True)
        detector = get_detector()
        
        # Run detection and OCR
        print("[INFO] Running detection and recognition", file=sys.stderr, flush=True)
        result = detector.detect_and_recognize(image, conf_threshold=0.25)
        print("[INFO] Detection completed", file=sys.stderr, flush=True)
        
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
    print("[DEBUG] Script started", file=sys.stderr, flush=True)
    
    # Check if we should read from stdin
    use_stdin = '--stdin' in sys.argv
    
    if use_stdin:
        print("[DEBUG] Reading image from STDIN", file=sys.stderr, flush=True)
        # Read base64 from stdin
        image_base64 = sys.stdin.read().strip()
    else:
        # Legacy: Read from command line argument
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': 'Missing image argument. Usage: python inference.py --image <base64_string> or --stdin'
            }), flush=True)
            return
        
        print("[DEBUG] Reading image from command line argument", file=sys.stderr, flush=True)
        image_base64 = sys.argv[2]
    
    print(f"[DEBUG] Image base64 length: {len(image_base64)}", file=sys.stderr, flush=True)
    
    # Decode image
    print("[DEBUG] Decoding image...", file=sys.stderr, flush=True)
    image = decode_base64_image(image_base64)
    
    if image is None:
        print(json.dumps({
            'success': False,
            'error': 'Failed to decode base64 image'
        }), flush=True)
        return
    
    print(f"[DEBUG] Image decoded: {image.shape}", file=sys.stderr, flush=True)
    
    # Run inference
    print("[DEBUG] Running inference...", file=sys.stderr, flush=True)
    result = detect_and_recognize(image)
    
    print("[DEBUG] Inference completed", file=sys.stderr, flush=True)
    
    # Remove annotated_image from output (too large for JSON)
    if 'annotated_image' in result:
        del result['annotated_image']
    
    # Print result as JSON
    print(json.dumps(result), flush=True)
    print("[DEBUG] Result sent", file=sys.stderr, flush=True)


if __name__ == '__main__':
    main()

