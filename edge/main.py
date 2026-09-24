"""eParking Edge Workstation - chạy tại máy tính cổng bãi xe.

    python main.py --config config.yaml            # đầy đủ: camera + AI + barrier
    python main.py --config config.yaml --no-ai    # không camera/AI: chỉ nhập biển số tay (demo/test luồng sync)
"""
from __future__ import annotations

import argparse
import logging
import os
import shutil
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from eparking_edge.barrier import build_barrier
from eparking_edge.cloud_client import CloudClient
from eparking_edge.config import load_config
from eparking_edge.connectivity import ConnectivityMonitor
from eparking_edge.gate_controller import GateController, PlateVoter
from eparking_edge.local_db import LocalDB
from eparking_edge.sync_worker import SyncWorker


def setup_logging(data_dir: Path) -> None:
    # Bản .exe không có cửa sổ console: stdout/stderr = None làm thư viện nào print() cũng lỗi.
    if sys.stdout is None or sys.stderr is None:
        sys.stdout = sys.stderr = open(os.devnull, "w", encoding="utf-8")
    data_dir.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)s [%(threadName)s] %(name)s: %(message)s")
    file_handler = RotatingFileHandler(data_dir / "edge.log", maxBytes=5_000_000, backupCount=5, encoding="utf-8")
    file_handler.setFormatter(fmt)
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logging.basicConfig(level=logging.INFO, handlers=[file_handler, console])
    logging.getLogger("ultralytics").setLevel(logging.WARNING)


def app_dir() -> Path:
    """Thư mục chứa eParkingEdge.exe (khi đóng gói) hoặc main.py (khi chạy từ mã nguồn)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def main() -> int:
    parser = argparse.ArgumentParser(description="eParking Edge Workstation")
    parser.add_argument("--config", default=str(app_dir() / "config.yaml"))
    parser.add_argument("--no-ai", action="store_true", help="Không mở camera/AI, chỉ nhập biển số tay")
    args = parser.parse_args()

    if not Path(args.config).exists():
        example = app_dir() / "config.example.yaml"
        if example.exists():
            shutil.copyfile(example, args.config)
    cfg = load_config(args.config)
    setup_logging(Path(cfg.data_dir))
    log = logging.getLogger("edge")

    db = LocalDB(cfg.db_path)
    stuck = db.recover_after_crash()
    if stuck:
        log.warning("%d event(s) were mid-decision at last shutdown -> marked BLOCKED for review", stuck)

    from PySide6.QtWidgets import QApplication
    from eparking_edge.ui.main_window import MainWindow

    app = QApplication(sys.argv)

    client = CloudClient(cfg.cloud)
    window_ref = {}

    def on_online_change(online: bool) -> None:
        if "w" in window_ref:
            window_ref["w"].bridge.online.emit(online)
        if online:
            sync.wake()

    connectivity = ConnectivityMonitor(client, db, cfg.cloud, on_change=on_online_change)
    sync = SyncWorker(db, client, connectivity, cfg.sync)
    controller = GateController(
        db, client, connectivity, build_barrier(cfg.barrier), cfg.evidence_dir,
        offline_open_unknown=cfg.offline_open_unknown,
        on_outcome=lambda o: window_ref["w"].bridge.outcome.emit(o) if "w" in window_ref else None,
    )

    cameras, lane_workers = [], {}
    startup_error = None
    camera_lanes = [lc for lc in cfg.lanes if lc.camera.strip()]
    if not args.no_ai and camera_lanes:
        from eparking_edge.camera import CameraStream
        from eparking_edge.lane_worker import LaneWorker

        try:
            from eparking_edge.ai.pipeline import PlatePipeline

            pipeline = PlatePipeline.get(cfg.ai)  # nạp model 1 lần trước khi mở camera
        except Exception as exc:  # thiếu model / lỗi torch: vẫn mở app ở chế độ nhập biển số tay
            log.exception("Cannot load AI models")
            startup_error = f"Không nạp được mô hình AI, chỉ dùng được nhập biển số tay.\n\n{exc}"
            camera_lanes = []
        for lane_cfg in camera_lanes:
            cam = CameraStream(lane_cfg.camera, lane_cfg.lane).start()
            cameras.append(cam)
            voter = PlateVoter(cfg.ai.confirm_frames, cfg.ai.plate_cooldown_s)
            lane_workers[lane_cfg.lane] = LaneWorker(lane_cfg, cam, pipeline, voter, controller).start()

    window = MainWindow(cfg, db, controller, connectivity, lane_workers)
    window_ref["w"] = window
    connectivity.start()
    sync.start()
    window.showMaximized()
    if startup_error:
        from PySide6.QtWidgets import QMessageBox

        QMessageBox.warning(window, "eParking Edge", startup_error)
    code = app.exec()

    for w in lane_workers.values():
        w.stop()
    for c in cameras:
        c.stop()
    sync.stop()
    connectivity.stop()
    db.close()
    return code


if __name__ == "__main__":
    sys.exit(main())
