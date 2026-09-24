"""Điều khiển rào chắn. Lệnh mở chạy trên thread riêng để không chặn luồng nhận diện."""
from __future__ import annotations

import logging
import threading

from .config import BarrierConfig

log = logging.getLogger(__name__)


class Barrier:
    def open(self, lane: str) -> None:
        threading.Thread(target=self._safe_open, args=(lane,), daemon=True, name=f"barrier-{lane}").start()

    def _safe_open(self, lane: str) -> None:
        try:
            self._open(lane)
        except Exception:
            log.exception("Barrier %s failed to open", lane)

    def _open(self, lane: str) -> None:
        raise NotImplementedError


class LogBarrier(Barrier):
    """Không có phần cứng: chỉ ghi log (dùng khi phát triển/demo)."""

    def _open(self, lane: str) -> None:
        log.info("[BARRIER] OPEN lane=%s", lane)


class SerialRelayBarrier(Barrier):
    """Relay USB/RS232: gửi chuỗi byte cấu hình sẵn cho từng làn. Relay tự đóng lại theo xung (pulse) phần cứng."""

    def __init__(self, cfg: BarrierConfig):
        import serial  # pyserial

        self._serial = serial.Serial(cfg.serial_port, cfg.baudrate, timeout=0.2)
        self._commands = {lane: bytes.fromhex(h) for lane, h in cfg.open_command_hex.items()}
        self._lock = threading.Lock()

    def _open(self, lane: str) -> None:
        with self._lock:
            self._serial.write(self._commands[lane])
            self._serial.flush()


class HttpRelayBarrier(Barrier):
    """Relay mạng LAN (vd ESP8266/ESP32): gọi URL mở cổng."""

    def __init__(self, cfg: BarrierConfig):
        import requests

        self._requests = requests
        self._urls = cfg.http_url

    def _open(self, lane: str) -> None:
        self._requests.get(self._urls[lane], timeout=1.0).raise_for_status()


def build_barrier(cfg: BarrierConfig) -> Barrier:
    if cfg.kind == "serial":
        return SerialRelayBarrier(cfg)
    if cfg.kind == "http":
        return HttpRelayBarrier(cfg)
    return LogBarrier()
