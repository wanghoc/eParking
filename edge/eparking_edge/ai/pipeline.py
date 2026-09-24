"""Đường ống AI 2 giai đoạn: YOLOv8-OBB định vị biển số -> YOLO11n nhận dạng từng ký tự."""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

from .postprocess import CharBox, assemble_plate

log = logging.getLogger(__name__)


@dataclass
class PlateResult:
    text: str
    det_conf: float
    char_conf: float
    crop: np.ndarray
    quad: np.ndarray  # 4 điểm (tl, tr, br, bl) trong hệ tọa độ khung hình gốc
    timings_ms: dict = field(default_factory=dict)


def order_quad(pts: np.ndarray) -> np.ndarray:
    """Sắp xếp 4 đỉnh OBB về (tl, tr, br, bl)."""
    pts = pts.astype(np.float32)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], dtype=np.float32)


def warp_quad(image: np.ndarray, quad: np.ndarray) -> np.ndarray:
    """Xoay-cắt vùng biển số theo OBB về ảnh chữ nhật thẳng (khử góc nghiêng)."""
    tl, tr, br, bl = quad
    w = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    h = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    if w < 8 or h < 8:
        return np.empty((0, 0, 3), dtype=image.dtype)
    dst = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.float32)
    m = cv2.getPerspectiveTransform(quad, dst)
    return cv2.warpPerspective(image, m, (w, h), flags=cv2.INTER_LINEAR)


class PlatePipeline:
    """Singleton: trọng số 2 mô hình được nạp vào RAM đúng 1 lần khi khởi động app."""

    _instance: Optional["PlatePipeline"] = None
    _instance_lock = threading.Lock()

    @classmethod
    def get(cls, cfg=None) -> "PlatePipeline":
        with cls._instance_lock:
            if cls._instance is None:
                if cfg is None:
                    raise RuntimeError("PlatePipeline.get() needs cfg on first call")
                cls._instance = cls(cfg)
            return cls._instance

    def __init__(self, cfg):
        from ultralytics import YOLO  # import nặng, chỉ nạp khi thực sự dùng AI

        self.cfg = cfg
        t0 = time.perf_counter()
        self.detector = YOLO(cfg.detector_weights, task="obb")
        self.recognizer = YOLO(cfg.recognizer_weights, task="detect")
        # 2 luồng camera (vào/ra) dùng chung model -> tuần tự hóa predict để an toàn luồng.
        self._lock = threading.Lock()
        self._warmup()
        log.info("AI models loaded in %.0f ms (device=%s)", (time.perf_counter() - t0) * 1000, cfg.device)

    def _warmup(self):
        dummy = np.zeros((self.cfg.detector_imgsz, self.cfg.detector_imgsz, 3), dtype=np.uint8)
        with self._lock:
            self.detector.predict(dummy, imgsz=self.cfg.detector_imgsz, device=self.cfg.device, verbose=False)
            self.recognizer.predict(dummy[:160, :160], imgsz=self.cfg.recognizer_imgsz, device=self.cfg.device, verbose=False)

    def process(self, frame: np.ndarray, roi: Optional[tuple[int, int, int, int]] = None) -> Optional[PlateResult]:
        timings = {}
        ox, oy = 0, 0
        image = frame
        if roi:
            # ROI: chỉ đưa vùng làn xe vào detector, giảm số pixel cần suy luận.
            x, y, w, h = roi
            image = frame[y:y + h, x:x + w]
            ox, oy = x, y

        with self._lock:
            t0 = time.perf_counter()
            det = self.detector.predict(
                image, imgsz=self.cfg.detector_imgsz, conf=self.cfg.detector_conf,
                device=self.cfg.device, verbose=False,
            )[0]
            timings["detect"] = (time.perf_counter() - t0) * 1000

            obb = det.obb
            if obb is None or len(obb) == 0:
                return None
            best = int(obb.conf.argmax())
            det_conf = float(obb.conf[best])
            quad = order_quad(obb.xyxyxyxy[best].cpu().numpy())

            t1 = time.perf_counter()
            crop = warp_quad(image, quad)
            if crop.size == 0:
                return None
            timings["warp"] = (time.perf_counter() - t1) * 1000

            t2 = time.perf_counter()
            rec = self.recognizer.predict(
                crop, imgsz=self.cfg.recognizer_imgsz, conf=self.cfg.recognizer_conf,
                device=self.cfg.device, verbose=False,
            )[0]
            timings["recognize"] = (time.perf_counter() - t2) * 1000

        boxes = rec.boxes
        if boxes is None or len(boxes) == 0:
            return None
        xywh = boxes.xywh.cpu().numpy()
        cls = boxes.cls.cpu().numpy().astype(int)
        confs = boxes.conf.cpu().numpy()
        chars = [
            CharBox(label=str(rec.names[c]), x=float(b[0]), y=float(b[1]), conf=float(p))
            for b, c, p in zip(xywh, cls, confs)
        ]
        text = assemble_plate(chars, crop_height=crop.shape[0])
        quad[:, 0] += ox
        quad[:, 1] += oy
        return PlateResult(
            text=text,
            det_conf=det_conf,
            char_conf=float(confs.min()),
            crop=crop,
            quad=quad,
            timings_ms=timings,
        )
