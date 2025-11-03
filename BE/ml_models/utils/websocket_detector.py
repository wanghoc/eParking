"""
WebSocket Realtime License Plate Detector
Giống y hệt project test nhưng dùng WebSocket cho web-based streaming

Architecture:
- Frontend gửi video frames qua WebSocket
- Backend xử lý với PERSISTENT YOLO + EasyOCR (load 1 lần duy nhất!)
- Trả kết quả realtime về frontend để hiển thị

Usage:
    python websocket_detector.py
"""

from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import cv2
import numpy as np
import base64
from ultralytics import YOLO
import easyocr
import re
import time
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', 
                   max_http_buffer_size=10_000_000)  # 10MB buffer

class PersistentDetector:
    """
    Detector PERSISTENT - Model load 1 lần duy nhất!
    Giống y hệt project test
    """
    
    def __init__(self, model_path='ml_models/plate_detector/best.pt'):
        print("\n" + "=" * 60)
        print("🚀 INITIALIZING PERSISTENT DETECTOR")
        print("=" * 60)
        
        # Check model path
        if not os.path.exists(model_path):
            print(f"[ERROR] Model not found: {model_path}")
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        # Load YOLO model - 1 LẦN DUY NHẤT!
        print(f"\n[1/2] 📦 Loading YOLO model from {model_path}...")
        start_time = time.time()
        self.model = YOLO(model_path)
        print(f"[1/2] ✅ YOLO model loaded in {time.time() - start_time:.2f}s")
        
        # Load EasyOCR reader - 1 LẦN DUY NHẤT!
        print(f"\n[2/2] 📖 Initializing EasyOCR reader (Vietnamese + English)...")
        start_time = time.time()
        self.reader = easyocr.Reader(['vi', 'en'], gpu=False, verbose=False)
        print(f"[2/2] ✅ EasyOCR reader loaded in {time.time() - start_time:.2f}s")
        
        print("\n" + "=" * 60)
        print("🎉 DETECTOR READY FOR REALTIME DETECTION!")
        print("=" * 60 + "\n")
        
        # Stats
        self.total_frames = 0
        self.total_detections = 0
        self.start_time = time.time()
    
    def validate_plate_format(self, text):
        """Kiểm tra format biển số Việt Nam: 30A-12345"""
        text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
        pattern = r'\d{2}[A-Z]{1,2}\d{4,5}'
        match = re.search(pattern, text)
        return match is not None, text
    
    def format_plate_text(self, text):
        """Format biển số: 30A-12345"""
        text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
        match = re.search(r'(\d{2})([A-Z]{1,2})(\d{4,5})', text)
        if match:
            return f"{match.group(1)}{match.group(2)}-{match.group(3)}"
        return text
    
    def detect_and_annotate(self, frame):
        """
        DETECT VÀ VẼ NGAY - REALTIME!
        Giống y hệt project test's process_frame()
        
        Args:
            frame: BGR numpy array
            
        Returns:
            annotated_frame: Frame đã vẽ khung xanh lá + text
            plate_info: Dict chứa thông tin biển số (hoặc None)
        """
        start_time = time.time()
        self.total_frames += 1
        
        # Detect với YOLO
        results = self.model(frame, conf=0.25, verbose=False)
        
        if not results or len(results) == 0:
            return frame, None
        
        result = results[0]
        
        # Check OBB results
        if result.obb is None or len(result.obb) == 0:
            return frame, None
        
        # Lấy detection TỐT NHẤT (highest confidence)
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
                h, w = frame.shape[:2]
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)
                
                best_detection = {
                    'bbox': (x1, y1, x2, y2),
                    'points': points,
                    'confidence': conf
                }
        
        if best_detection is None:
            return frame, None
        
        # Crop biển số
        x1, y1, x2, y2 = best_detection['bbox']
        
        if x2 <= x1 or y2 <= y1:
            return frame, None
        
        cropped_plate = frame[y1:y2, x1:x2]
        
        # Tiền xử lý cho OCR (GIỐNG Y PROJECT TEST)
        gray = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        
        # Resize nếu quá nhỏ
        if gray.shape[1] < 200:
            scale = 200 / gray.shape[1]
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        
        # OCR
        ocr_results = self.reader.readtext(gray, detail=0)
        plate_text_raw = ''.join(ocr_results).replace(' ', '')
        
        # Validate và format
        is_valid, plate_text = self.validate_plate_format(plate_text_raw)
        plate_text_formatted = self.format_plate_text(plate_text) if is_valid else plate_text_raw
        
        # VẼ KẾT QUẢ LÊN FRAME - KHUNG XANH LÁ!
        annotated = frame.copy()
        points = best_detection['points']
        conf = best_detection['confidence']
        
        # Vẽ OBB polygon (XANH LÁ - BGR: 0,255,0)
        cv2.polylines(annotated, [points], True, (0, 255, 0), 3)
        
        # Vẽ rectangle
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Tạo label
        if is_valid:
            label = f"{plate_text_formatted}"
            conf_label = f"Conf: {conf*100:.1f}%"
        else:
            label = "License Plate"
            conf_label = f"Conf: {conf*100:.1f}%"
        
        # Đo kích thước text
        (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
        (conf_w, conf_h), _ = cv2.getTextSize(conf_label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        
        # Vẽ background xanh lá
        box_height = label_h + conf_h + 20
        box_width = max(label_w, conf_w) + 20
        cv2.rectangle(annotated, (x1, y1 - box_height - 5), 
                     (x1 + box_width, y1), (0, 255, 0), -1)
        
        # Vẽ text biển số (ĐEN ĐẬM)
        cv2.putText(annotated, label, (x1 + 10, y1 - conf_h - 15),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
        
        # Vẽ confidence
        cv2.putText(annotated, conf_label, (x1 + 10, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
        
        # Tính FPS
        process_time = time.time() - start_time
        fps = 1.0 / process_time if process_time > 0 else 0
        
        # Vẽ FPS (góc trên bên trái)
        cv2.putText(annotated, f"FPS: {fps:.1f}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Tạo plate_info
        plate_info = {
            'text': plate_text_formatted if is_valid else plate_text_raw,
            'confidence': float(conf),
            'is_valid': is_valid,
            'bbox': [int(x1), int(y1), int(x2), int(y2)],
            'fps': float(fps)
        }
        
        if is_valid:
            self.total_detections += 1
        
        return annotated, plate_info
    
    def get_stats(self):
        """Lấy stats"""
        runtime = time.time() - self.start_time
        avg_fps = self.total_frames / runtime if runtime > 0 else 0
        
        return {
            'total_frames': self.total_frames,
            'total_detections': self.total_detections,
            'runtime_seconds': int(runtime),
            'avg_fps': round(avg_fps, 2)
        }


# Khởi tạo PERSISTENT DETECTOR - Load 1 lần khi server khởi động!
print("\n🚀 Starting WebSocket Detector Server...")
detector = PersistentDetector()

# Connected clients tracking
connected_cameras = {}


@socketio.on('connect')
def handle_connect():
    """Client kết nối"""
    print(f"[WebSocket] 🔌 Client connected: {request.sid}")
    emit('connection_response', {'status': 'connected', 'message': 'Ready for detection'})


@socketio.on('disconnect')
def handle_disconnect():
    """Client ngắt kết nối"""
    sid = request.sid
    if sid in connected_cameras:
        camera_id = connected_cameras[sid]
        del connected_cameras[sid]
        print(f"[WebSocket] 🔌 Camera {camera_id} disconnected: {sid}")
    else:
        print(f"[WebSocket] 🔌 Client disconnected: {sid}")


@socketio.on('register_camera')
def handle_register_camera(data):
    """Đăng ký camera"""
    camera_id = data.get('cameraId', 'unknown')
    connected_cameras[request.sid] = camera_id
    print(f"[WebSocket] 📹 Camera registered: {camera_id} (sid: {request.sid})")
    emit('camera_registered', {'cameraId': camera_id, 'status': 'registered'})


@socketio.on('video_frame')
def handle_video_frame(data):
    """
    Nhận frame từ frontend và xử lý REALTIME!
    
    Data format:
    {
        'cameraId': 'camera_123',
        'frame': 'base64_encoded_image_data',
        'timestamp': 1234567890
    }
    """
    try:
        camera_id = data.get('cameraId', 'unknown')
        frame_base64 = data.get('frame', '')
        timestamp = data.get('timestamp', 0)
        
        if not frame_base64:
            print(f"[ERROR] No frame data from camera {camera_id}")
            emit('detection_error', {'error': 'No frame data'})
            return
        
        # DEBUG: Log frame info
        print(f"[Camera {camera_id}] Received frame, length: {len(frame_base64)}")
        
        # Decode base64 -> numpy array
        # Format: data:image/jpeg;base64,/9j/4AAQ...
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',')[1]
        
        # DEBUG: Check base64 after split
        if not frame_base64 or len(frame_base64) < 100:
            print(f"[ERROR] Frame base64 too short after split: {len(frame_base64)}")
            emit('detection_error', {'error': 'Invalid frame data'})
            return
        
        try:
            frame_bytes = base64.b64decode(frame_base64)
            print(f"[Camera {camera_id}] Decoded {len(frame_bytes)} bytes")
        except Exception as e:
            print(f"[ERROR] Base64 decode failed: {e}")
            emit('detection_error', {'error': f'Base64 decode error: {e}'})
            return
        
        if len(frame_bytes) == 0:
            print(f"[ERROR] Frame bytes empty after decode!")
            emit('detection_error', {'error': 'Empty frame bytes'})
            return
        
        frame_np = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame = cv2.imdecode(frame_np, cv2.IMREAD_COLOR)
        
        if frame is None:
            print(f"[ERROR] OpenCV imdecode failed, bytes length: {len(frame_bytes)}")
            emit('detection_error', {'error': 'Failed to decode frame'})
            return
        
        # DETECT VÀ VẼ - REALTIME!
        annotated_frame, plate_info = detector.detect_and_annotate(frame)
        
        # Encode annotated frame -> base64
        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        annotated_data_url = f"data:image/jpeg;base64,{annotated_base64}"
        
        # Gửi kết quả về frontend
        response = {
            'cameraId': camera_id,
            'timestamp': timestamp,
            'annotated_frame': annotated_data_url,
            'detection': plate_info,
            'stats': detector.get_stats()
        }
        
        emit('detection_result', response)
        
        # Log nếu detect được biển số hợp lệ
        if plate_info and plate_info['is_valid']:
            print(f"[Camera {camera_id}] 🎯 DETECTED: {plate_info['text']} "
                  f"(Conf: {plate_info['confidence']*100:.1f}%, FPS: {plate_info['fps']:.1f})")
        
    except Exception as e:
        print(f"[ERROR] Frame processing error: {e}")
        import traceback
        traceback.print_exc()
        emit('detection_error', {'error': str(e)})


@socketio.on('get_stats')
def handle_get_stats():
    """Lấy thống kê"""
    stats = detector.get_stats()
    emit('stats_response', stats)


@app.route('/health')
def health():
    """Health check endpoint"""
    stats = detector.get_stats()
    return {
        'status': 'healthy',
        'detector': 'ready',
        'stats': stats
    }


@app.route('/')
def index():
    """Root endpoint"""
    return {
        'service': 'WebSocket License Plate Detector',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'websocket': 'ws://localhost:5555'
        }
    }


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🚀 WebSocket Detector Server Starting...")
    print("=" * 60)
    print(f"🌐 HTTP Server: http://0.0.0.0:5001")
    print(f"🔌 WebSocket: ws://0.0.0.0:5001")
    print("=" * 60 + "\n")
    
    # Import request here to avoid issues
    from flask import request
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=False, allow_unsafe_werkzeug=True)
