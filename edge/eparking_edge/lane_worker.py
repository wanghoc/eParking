"""Mỗi làn (vào/ra) chạy 1 thread: lấy khung mới nhất -> AI -> bỏ phiếu -> GateController."""
from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

from .camera import CameraStream
from .config import LaneConfig
from .gate_controller import GateController, PlateVoter

log = logging.getLogger(__name__)


class LaneWorker:
    def __init__(self, lane_cfg: LaneConfig, camera: CameraStream, pipeline, voter: PlateVoter,
                 controller: GateController):
        self.lane = lane_cfg.lane
        self.roi = lane_cfg.roi
        self.camera = camera
        self.pipeline = pipeline
        self.voter = voter
        self.controller = controller
        self.last_text: Optional[str] = None
        self.last_infer_ms = 0.0
        self._preview: Optional[np.ndarray] = None
        self._preview_lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name=f"lane-{self.lane}")

    def start(self) -> "LaneWorker":
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=3)

    def preview(self) -> Optional[np.ndarray]:
        with self._preview_lock:
            return self._preview

    def _run(self) -> None:
        last_seq = -1
        while not self._stop.is_set():
            frame, captured_at, seq = self.camera.latest()
            if frame is None or seq == last_seq:
                time.sleep(0.005)
                continue
            last_seq = seq
            try:
                t0 = time.perf_counter()
                result = self.pipeline.process(frame, self.roi)
                self.last_infer_ms = (time.perf_counter() - t0) * 1000
            except Exception:
                log.exception("Inference failed on lane %s", self.lane)
                continue

            self._update_preview(frame, result)
            confirmed = self.voter.feed(result.text if result else None)
            if result:
                self.last_text = result.text
            if confirmed:
                self.controller.handle_plate(
                    self.lane, confirmed,
                    confidence=min(result.det_conf, result.char_conf),
                    plate_img=result.crop, frame=frame, captured_at=captured_at,
                )

    def _update_preview(self, frame: np.ndarray, result) -> None:
        view = frame.copy()
        if self.roi:
            x, y, w, h = self.roi
            cv2.rectangle(view, (x, y), (x + w, y + h), (255, 200, 0), 1)
        if result is not None:
            cv2.polylines(view, [result.quad.astype(np.int32)], True, (0, 255, 0), 2)
            x, y = result.quad[0].astype(int)
            cv2.putText(view, result.text, (x, max(20, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(view, f"{self.last_infer_ms:.0f} ms", (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        with self._preview_lock:
            self._preview = view
