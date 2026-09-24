from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml


@dataclass
class AIConfig:
    detector_weights: str = "models/plate_obb.pt"
    recognizer_weights: str = "models/char_yolo11n.pt"
    device: str = "cpu"  # "cpu" | "cuda:0"
    detector_imgsz: int = 640
    recognizer_imgsz: int = 320
    detector_conf: float = 0.5
    recognizer_conf: float = 0.25
    # Số khung liên tiếp phải cho cùng kết quả trước khi chốt biển số
    confirm_frames: int = 2
    # Bỏ qua cùng 1 biển số trên cùng 1 làn trong khoảng này (giây)
    plate_cooldown_s: float = 20.0


@dataclass
class LaneConfig:
    lane: str  # "IN" | "OUT"
    camera: str  # RTSP URL hoặc chỉ số webcam ("0")
    roi: Optional[tuple[int, int, int, int]] = None  # x, y, w, h


@dataclass
class CloudConfig:
    base_url: str = "http://localhost:5000"
    device_key: str = ""
    connect_timeout_s: float = 0.3
    # Ngân sách mạng cho quyết định online; quá thời gian -> xử lý như offline (mở cổng, ghi hàng chờ)
    read_timeout_s: float = 0.7
    heartbeat_interval_s: float = 5.0
    failures_before_offline: int = 2
    snapshot_interval_s: float = 300.0


@dataclass
class SyncConfig:
    interval_s: float = 2.0
    batch_size: int = 50
    backoff_base_s: float = 2.0
    backoff_max_s: float = 300.0
    request_timeout_s: float = 15.0


@dataclass
class BarrierConfig:
    kind: str = "log"  # "log" | "serial" | "http"
    serial_port: str = "COM3"
    baudrate: int = 9600
    # Lệnh gửi relay theo từng làn, dạng hex (vd relay USB LCUS-1: "A00101A2")
    open_command_hex: dict = field(default_factory=lambda: {"IN": "A00101A2", "OUT": "A00201A3"})
    http_url: dict = field(default_factory=dict)  # {"IN": "http://relay-in/open", ...}


@dataclass
class AppConfig:
    station_name: str = "Cổng bãi xe"
    data_dir: str = "data"
    lanes: list[LaneConfig] = field(default_factory=list)
    ai: AIConfig = field(default_factory=AIConfig)
    cloud: CloudConfig = field(default_factory=CloudConfig)
    sync: SyncConfig = field(default_factory=SyncConfig)
    barrier: BarrierConfig = field(default_factory=BarrierConfig)
    # Khi offline mà biển số không có trong cache xe đã đăng ký: True = vẫn mở (ưu tiên lưu thông)
    offline_open_unknown: bool = False

    @property
    def db_path(self) -> Path:
        return Path(self.data_dir) / "edge.sqlite3"

    @property
    def evidence_dir(self) -> Path:
        return Path(self.data_dir) / "evidence"


def load_config(path: str | Path) -> AppConfig:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    base = Path(path).resolve().parent

    ai = AIConfig(**raw.get("ai", {}))
    for attr in ("detector_weights", "recognizer_weights"):
        p = Path(getattr(ai, attr))
        if not p.is_absolute():
            setattr(ai, attr, str(base / p))

    lanes = []
    for item in raw.get("lanes", []):
        roi = tuple(item["roi"]) if item.get("roi") else None
        camera = item.get("camera")
        lanes.append(LaneConfig(lane=item["lane"].upper(), camera="" if camera is None else str(camera), roi=roi))

    data_dir = Path(raw.get("data_dir", "data"))
    if not data_dir.is_absolute():
        data_dir = base / data_dir

    return AppConfig(
        station_name=raw.get("station_name", "Cổng bãi xe"),
        data_dir=str(data_dir),
        lanes=lanes,
        ai=ai,
        cloud=CloudConfig(**raw.get("cloud", {})),
        sync=SyncConfig(**raw.get("sync", {})),
        barrier=BarrierConfig(**raw.get("barrier", {})),
        offline_open_unknown=bool(raw.get("offline_open_unknown", False)),
    )
