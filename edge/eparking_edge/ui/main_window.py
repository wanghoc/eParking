"""Giao diện POS cho bảo vệ tại cổng (PySide6)."""
from __future__ import annotations

import json
import threading
from datetime import datetime
from typing import Optional

import numpy as np
from PySide6.QtCore import QObject, Qt, QTimer, Signal
from PySide6.QtGui import QFont, QImage, QPixmap
from PySide6.QtWidgets import (
    QApplication, QGroupBox, QHBoxLayout, QHeaderView, QInputDialog, QLabel, QLineEdit, QMainWindow,
    QMessageBox, QPushButton, QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget,
)

from ..gate_controller import GateOutcome

_LEVELS = {
    "ok": ("#e8f7ee", "2px solid #22a55b", "#14532d"),
    "warn": ("#fff7e0", "2px solid #e0a800", "#713f12"),
    "danger": ("#fde2e2", "3px solid #dc2626", "#7f1d1d"),
    "idle": ("#f3f4f6", "1px solid #d1d5db", "#374151"),
}
LEVEL_STYLE = {
    k: f"#card {{ background:{bg}; border:{border}; border-radius:6px; }} #card QLabel {{ color:{fg}; border:none; }}"
    for k, (bg, border, fg) in _LEVELS.items()
}
STATUS_LABEL = {
    "SYNCED": "Đã đồng bộ", "PENDING_SYNC": "Chờ đồng bộ", "BLOCKED": "Bị chặn",
    "REJECTED": "Từ chối", "LOCAL_ONLY": "Chỉ lưu cục bộ", "DECIDING": "Đang xử lý",
}


class Bridge(QObject):
    """Chuyển sự kiện từ thread nền sang thread giao diện (queued signal)."""
    outcome = Signal(object)
    online = Signal(bool)


def local_time(iso_utc: str) -> str:
    return datetime.fromisoformat(iso_utc.replace("Z", "+00:00")).astimezone().strftime("%H:%M:%S")


def to_pixmap(frame: np.ndarray, width: int, height: int) -> QPixmap:
    rgb = np.ascontiguousarray(frame[:, :, ::-1])
    h, w = rgb.shape[:2]
    img = QImage(rgb.data, w, h, 3 * w, QImage.Format.Format_RGB888)
    return QPixmap.fromImage(img).scaled(width, height, Qt.AspectRatioMode.KeepAspectRatio,
                                         Qt.TransformationMode.FastTransformation)


class LanePanel(QGroupBox):
    def __init__(self, lane: str, window: "MainWindow"):
        super().__init__("LÀN VÀO" if lane == "IN" else "LÀN RA")
        self.lane = lane
        self.window = window
        self.pending: Optional[GateOutcome] = None

        self.video = QLabel("Chưa có camera")
        self.video.setMinimumSize(480, 270)
        self.video.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.video.setStyleSheet("background:#111; color:#aaa;")

        self.plate = QLabel("—")
        self.plate.setFont(QFont("Consolas", 30, QFont.Weight.Bold))
        self.plate.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.info = QLabel("")
        self.info.setWordWrap(True)
        self.info.setFont(QFont("Segoe UI", 12))
        self.card = QWidget()
        self.card.setObjectName("card")
        self.card.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        card_layout = QVBoxLayout(self.card)
        card_layout.addWidget(self.plate)
        card_layout.addWidget(self.info)
        self.card.setStyleSheet(LEVEL_STYLE["idle"])

        self.override_btn = QPushButton("Mở barrier thủ công")
        self.override_btn.setEnabled(False)
        self.override_btn.setStyleSheet("font-weight:bold; padding:8px;")
        self.override_btn.clicked.connect(self._override)
        self.manual_btn = QPushButton("Nhập biển số tay")
        self.manual_btn.clicked.connect(self._manual)
        buttons = QHBoxLayout()
        buttons.addWidget(self.override_btn)
        buttons.addWidget(self.manual_btn)

        layout = QVBoxLayout(self)
        layout.addWidget(self.video, stretch=3)
        layout.addWidget(self.card, stretch=1)
        layout.addLayout(buttons)

    def show_outcome(self, o: GateOutcome) -> None:
        self.plate.setText(o.plate)
        lines = [o.message]
        if o.owner:
            who = " - ".join(x for x in (o.owner.get("name"), o.owner.get("mssv")) if x)
            if who:
                lines.append(f"Chủ xe: {who}")
            if o.owner.get("debt"):
                lines.append(f"ĐANG NỢ: {o.owner['debt']:,.0f}₫")
        lines.append(f"{o.mode} · {o.latency_ms or 0:.0f} ms" if o.latency_ms else o.mode)
        lines += o.warnings
        self.info.setText("\n".join(lines))
        self.card.setStyleSheet(LEVEL_STYLE[o.level])
        self.pending = o if o.needs_guard else None
        self.override_btn.setEnabled(self.pending is not None)
        if o.level == "danger":
            QApplication.beep()

    def _override(self) -> None:
        if not self.pending:
            return
        guard = self.window.guard_name()
        if not guard:
            return
        reason, ok = QInputDialog.getText(self, "Mở thủ công", f"Lý do mở cổng cho {self.pending.plate}:")
        if not ok:
            return
        event_id = self.pending.event_id
        self.pending = None
        self.override_btn.setEnabled(False)
        threading.Thread(target=self._run_override, args=(event_id, guard, reason), daemon=True).start()

    def _run_override(self, event_id: str, guard: str, reason: str) -> None:
        try:
            self.window.controller.override(event_id, guard, reason)
        except ValueError:
            pass  # đã được xử lý (bấm 2 lần)

    def _manual(self) -> None:
        plate, ok = QInputDialog.getText(self, "Nhập biển số", "Biển số (vd 49G1-11111):")
        if ok and plate.strip():
            threading.Thread(
                target=self.window.controller.handle_plate, args=(self.lane, plate.strip().upper()), daemon=True,
            ).start()


class MainWindow(QMainWindow):
    def __init__(self, cfg, db, controller, connectivity, lane_workers: dict):
        super().__init__()
        self.cfg = cfg
        self.db = db
        self.controller = controller
        self.connectivity = connectivity
        self.lane_workers = lane_workers
        self.bridge = Bridge()
        self.bridge.outcome.connect(self._on_outcome)
        self.bridge.online.connect(self._set_online)

        self.setWindowTitle(f"eParking Edge - {cfg.station_name}")
        self.status_badge = QLabel()
        self.status_badge.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        self.pending_label = QLabel()
        self.guard_input = QLineEdit()
        self.guard_input.setPlaceholderText("Tên bảo vệ ca trực")
        self.guard_input.setMaximumWidth(220)
        top = QHBoxLayout()
        top.addWidget(QLabel(f"<b>{cfg.station_name}</b>"))
        top.addStretch()
        top.addWidget(self.pending_label)
        top.addWidget(self.status_badge)
        top.addWidget(QLabel("Ca trực:"))
        top.addWidget(self.guard_input)

        lanes = QHBoxLayout()
        self.panels = {}
        for lane in [lc.lane for lc in cfg.lanes] or ["IN", "OUT"]:
            self.panels[lane] = LanePanel(lane, self)
            lanes.addWidget(self.panels[lane])

        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["Thời gian", "Làn", "Biển số", "Quyết định", "Đồng bộ", "Ghi chú"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setMaximumHeight(220)

        root = QWidget()
        layout = QVBoxLayout(root)
        layout.addLayout(top)
        layout.addLayout(lanes, stretch=1)
        layout.addWidget(self.table)
        self.setCentralWidget(root)

        self._set_online(connectivity.online)
        self._video_timer = QTimer(self, interval=66, timeout=self._refresh_video)
        self._video_timer.start()
        self._table_timer = QTimer(self, interval=2000, timeout=self._refresh_table)
        self._table_timer.start()
        self._refresh_table()

    def guard_name(self) -> Optional[str]:
        name = self.guard_input.text().strip()
        if not name:
            QMessageBox.warning(self, "Thiếu thông tin", "Nhập tên bảo vệ ca trực trước khi mở cổng thủ công.")
            self.guard_input.setFocus()
        return name or None

    def _on_outcome(self, o: GateOutcome) -> None:
        panel = self.panels.get(o.lane)
        if panel:
            panel.show_outcome(o)
        self._refresh_table()

    def _set_online(self, online: bool) -> None:
        if self.connectivity.auth_error:
            text, color = "SAI KHÓA THIẾT BỊ", "#dc2626"
        elif online:
            text, color = "● ONLINE", "#16a34a"
        else:
            text, color = "● OFFLINE (tự chủ)", "#d97706"
        self.status_badge.setText(text)
        self.status_badge.setStyleSheet(f"color:{color}; padding:0 12px;")

    def _refresh_video(self) -> None:
        for lane, worker in self.lane_workers.items():
            frame = worker.preview()
            panel = self.panels.get(lane)
            if frame is not None and panel:
                panel.video.setPixmap(to_pixmap(frame, panel.video.width(), panel.video.height()))

    def _refresh_table(self) -> None:
        counts = self.db.count_by_status()
        self.pending_label.setText(
            f"Chờ đồng bộ: {counts.get('PENDING_SYNC', 0)}  ·  Bị chặn: {counts.get('BLOCKED', 0)}"
        )
        rows = self.db.recent_events(30)
        self.table.setRowCount(len(rows))
        for i, r in enumerate(rows):
            note = r.get("last_error") or ""
            if r.get("cloud_result"):
                res = json.loads(r["cloud_result"])
                if res.get("overdraft"):
                    note = f"Nợ cước, số dư {res.get('balance_after', 0):,.0f}₫"
            if r.get("override_by"):
                note = f"Override: {r['override_by']} {r.get('override_reason') or ''}".strip()
            values = [
                local_time(r["event_time"]), "Vào" if r["lane"] == "IN" else "Ra", r["plate"],
                r.get("decision") or "-", STATUS_LABEL.get(r["sync_status"], r["sync_status"]), note,
            ]
            for j, v in enumerate(values):
                self.table.setItem(i, j, QTableWidgetItem(str(v)))
