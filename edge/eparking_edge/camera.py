"""Đọc luồng camera trên thread riêng, chỉ giữ khung hình mới nhất (tránh trễ tích lũy do buffer RTSP)."""
from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

log = logging.getLogger(__name__)


class CameraStream:
    def __init__(self, source: str, name: str):
        self.source: int | str = int(source) if source.isdigit() else source
        self.name = name
        self._frame: Optional[np.ndarray] = None
        self._frame_ts = 0.0
        self._seq = 0
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name=f"camera-{name}")
        self.connected = False

    def start(self) -> "CameraStream":
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=2)

    def latest(self) -> tuple[Optional[np.ndarray], float, int]:
        with self._lock:
            return self._frame, self._frame_ts, self._seq

    def _open(self) -> cv2.VideoCapture:
        if isinstance(self.source, str) and self.source.startswith("rtsp"):
            cap = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
        else:
            cap = cv2.VideoCapture(self.source)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap

    def _run(self) -> None:
        backoff = 1.0
        while not self._stop.is_set():
            cap = self._open()
            if not cap.isOpened():
                self.connected = False
                log.warning("Camera %s unavailable, retry in %.0fs", self.name, backoff)
                self._stop.wait(backoff)
                backoff = min(backoff * 2, 30.0)
                continue
            self.connected = True
            backoff = 1.0
            log.info("Camera %s connected", self.name)
            while not self._stop.is_set():
                ok, frame = cap.read()
                if not ok:
                    log.warning("Camera %s read failed, reconnecting", self.name)
                    break
                with self._lock:
                    self._frame = frame
                    self._frame_ts = time.monotonic()
                    self._seq += 1
            cap.release()
            self.connected = False
