"""
Janus + WebSocket Realtime License Plate Detector

Architecture:
- Janus: RTSP → WebRTC
- Browser: receives WebRTC, extracts frames (canvas)
- Browser → sends JPEG frames via WebSocket
- Backend: PERSISTENT YOLO + EasyOCR
- Backend → returns detection results only (NO VIDEO)

Usage:
    python janus_ws_plate_detector.py
"""

from flask import Flask, request
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

# -------------------------------------------------
# Server setup
# -------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    max_http_buffer_size=10_000_000,
)


# -------------------------------------------------
# Persistent Detector
# -------------------------------------------------
class PersistentDetector:
    def __init__(self, model_path="ml_models/plate_detector/best.pt"):
        print("\n🚀 Initializing Persistent Detector")

        if not os.path.exists(model_path):
            raise FileNotFoundError(model_path)

        print("📦 Loading YOLO...")
        self.model = YOLO(model_path)

        print("📖 Loading EasyOCR...")
        self.reader = easyocr.Reader(["vi", "en"], gpu=False, verbose=False)

        self.start_time = time.time()
        self.total_frames = 0
        self.total_detections = 0

        print("✅ Detector ready\n")

    # -------------------------------
    # Plate validation
    # -------------------------------
    def validate_plate(self, text):
        text = text.upper().replace(" ", "").replace("-", "").replace(".", "")
        return bool(re.match(r"^\d{2}[A-Z0-9]{2}\d{4,5}$", text)), text

    def format_plate(self, text):
        m = re.match(r"(\d{2})([A-Z0-9]{2})(\d{4,5})", text)
        return f"{m[1]}{m[2]}-{m[3]}" if m else text

    # -------------------------------
    # Core detection
    # -------------------------------
    def detect(self, frame):
        start = time.time()
        self.total_frames += 1

        results = self.model(frame, conf=0.25, verbose=False)
        if not results or results[0].obb is None:
            return None

        best = max(results[0].obb, key=lambda o: float(o.conf[0]))
        pts = best.xyxyxyxy[0].cpu().numpy().astype(int)

        x1, y1 = pts[:, 0].min(), pts[:, 1].min()
        x2, y2 = pts[:, 0].max(), pts[:, 1].max()

        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        if gray.shape[1] < 300:
            scale = 300 / gray.shape[1]
            gray = cv2.resize(gray, None, fx=scale, fy=scale)

        texts = self.reader.readtext(
            gray, detail=0, allowlist="0123456789ABCDEFGHKLMNPRSTUVXYZ"
        )

        raw = "".join(texts)
        valid, cleaned = self.validate_plate(raw)

        if valid:
            self.total_detections += 1

        return {
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "text": self.format_plate(cleaned) if valid else raw,
            "confidence": float(best.conf[0]),
            "is_valid": valid,
            "fps": round(1 / (time.time() - start), 2),
        }

    def stats(self):
        t = time.time() - self.start_time
        return {
            "total_frames": self.total_frames,
            "total_detections": self.total_detections,
            "avg_fps": round(self.total_frames / t, 2),
        }


# -------------------------------------------------
# Init detector (LOAD ONCE)
# -------------------------------------------------
detector = PersistentDetector()


# -------------------------------------------------
# WebSocket handlers
# -------------------------------------------------
@socketio.on("connect")
def on_connect():
    print(f"🔌 Client connected: {request.sid}")


@socketio.on("disconnect")
def on_disconnect():
    print(f"❌ Client disconnected: {request.sid}")


@socketio.on("frame")
def on_frame(data):
    """
    data = {
      frame: "data:image/jpeg;base64,...",
      ts: 123456
    }
    """
    try:
        if "frame" not in data:
            return

        # Decode JPEG
        b64 = data["frame"].split(",")[1]
        img = cv2.imdecode(
            np.frombuffer(base64.b64decode(b64), np.uint8), cv2.IMREAD_COLOR
        )

        if img is None:
            return

        detection = detector.detect(img)

        emit(
            "result",
            {"ts": data.get("ts"), "detection": detection, "stats": detector.stats()},
        )

        if detection and detection["is_valid"]:
            print(f"🎯 {detection['text']} ({detection['confidence']:.2f})")

    except Exception as e:
        emit("error", {"error": str(e)})


# -------------------------------------------------
# HTTP endpoints
# -------------------------------------------------
@app.route("/health")
def health():
    return {"status": "ok", "stats": detector.stats()}


# -------------------------------------------------
# Run
# -------------------------------------------------
if __name__ == "__main__":
    print("🌐 Detector listening on :5001")
    socketio.run(app, host="0.0.0.0", port=5001)
