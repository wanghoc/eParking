"""Logic check-in/check-out tại cổng: quyết định mở barrier online/offline, ghi hàng chờ, override của bảo vệ."""
from __future__ import annotations

import logging
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import cv2
import numpy as np

from .ai.postprocess import is_plausible_plate, plate_key
from .errors import CloudUnavailable, DeviceUnauthorized
from .local_db import LocalDB, utc_now
from .payload import event_payload

log = logging.getLogger(__name__)

FRAME_EVIDENCE_MAX_WIDTH = 960


@dataclass
class GateOutcome:
    event_id: str
    lane: str
    event_type: str
    plate: str
    decision: str  # OPEN | DENY
    mode: str  # ONLINE | OFFLINE | GUARD
    level: str  # ok | warn | danger
    message: str
    code: Optional[str] = None
    owner: Optional[dict] = None
    fee: Optional[float] = None
    needs_guard: bool = False
    latency_ms: Optional[float] = None
    warnings: list = field(default_factory=list)


class PlateVoter:
    """Chốt biển số khi cùng 1 kết quả xuất hiện ở N khung liên tiếp; chống phát sự kiện lặp trong thời gian cooldown."""

    def __init__(self, confirm_frames: int, cooldown_s: float, clock: Callable[[], float] = time.monotonic):
        self.confirm_frames = max(1, confirm_frames)
        self.cooldown_s = cooldown_s
        self.clock = clock
        self._last: Optional[str] = None
        self._count = 0
        self._cooldown: dict[str, float] = {}

    def feed(self, text: Optional[str]) -> Optional[str]:
        if not text or not is_plausible_plate(text):
            self._last, self._count = None, 0
            return None
        if text == self._last:
            self._count += 1
        else:
            self._last, self._count = text, 1
        if self._count < self.confirm_frames:
            return None
        self._last, self._count = None, 0
        key, now = plate_key(text), self.clock()
        if now - self._cooldown.get(key, float("-inf")) < self.cooldown_s:
            return None
        self._cooldown[key] = now
        return text


class GateController:
    def __init__(self, db: LocalDB, client, connectivity, barrier, evidence_dir: str | Path,
                 offline_open_unknown: bool = False,
                 on_outcome: Optional[Callable[[GateOutcome], None]] = None,
                 on_queue_changed: Optional[Callable[[], None]] = None):
        self.db = db
        self.client = client
        self.connectivity = connectivity
        self.barrier = barrier
        self.evidence_dir = Path(evidence_dir)
        self.offline_open_unknown = offline_open_unknown
        self.on_outcome = on_outcome
        self.on_queue_changed = on_queue_changed
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ public API
    def handle_plate(self, lane: str, plate: str, *, confidence: Optional[float] = None,
                     plate_img: Optional[np.ndarray] = None, frame: Optional[np.ndarray] = None,
                     captured_at: Optional[float] = None) -> GateOutcome:
        started = captured_at if captured_at is not None else time.monotonic()
        event_type = "CHECK_IN" if lane == "IN" else "CHECK_OUT"
        key = plate_key(plate)
        event_id = str(uuid.uuid4())
        plate_path, frame_path = self._save_evidence(event_id, plate_img, frame)

        with self._lock:
            local = self.db.get_local_session(key) if event_type == "CHECK_OUT" else None
            row = {
                "event_id": event_id,
                "event_type": event_type,
                "lane": lane,
                "plate": plate,
                "plate_key": key,
                "event_time": utc_now(),
                "entry_time": local["entry_time"] if local else None,
                "fee": self.db.get_kv("fee_per_turn") if event_type == "CHECK_OUT" else None,
                "confidence": confidence,
                "plate_image_path": plate_path,
                "frame_image_path": frame_path,
            }
            # Outbox: ghi xuống đĩa TRƯỚC khi gọi mạng -> không mất sự kiện kể cả khi app sập.
            self.db.insert_event(row)

        # Không giữ lock khi gọi mạng: 2 làn vào/ra xử lý song song.
        outcome = None
        if self.connectivity.online:
            outcome = self._try_online(row)
        if outcome is None:
            outcome = self._decide_offline(row)

        outcome.latency_ms = (time.monotonic() - started) * 1000
        log.info("[%s] %s %s -> %s/%s (%s) %.0fms", lane, event_type, plate, outcome.decision,
                 outcome.mode, outcome.code or "-", outcome.latency_ms)
        self._emit(outcome)
        return outcome

    def override(self, event_id: str, guard: str, reason: str = "") -> GateOutcome:
        """Bảo vệ mở barrier thủ công cho sự kiện đang bị chặn (nợ cước / không đủ tiền / xe lạ)."""
        with self._lock:
            row = self.db.get_event(event_id)
            if not row or row["sync_status"] not in ("BLOCKED", "REJECTED"):
                raise ValueError(f"Event {event_id} is not waiting for override")
            # Chuyển sang DECIDING ngay để lần bấm thứ 2 (double-click) bị từ chối.
            self.db.set_status(event_id, "DECIDING", override_by=guard, override_reason=reason)
            row = self.db.get_event(event_id)

        self.barrier.open(row["lane"])
        status, code, result = "PENDING_SYNC", None, None
        if self.connectivity.online:
            try:
                result = self.client.post_event(event_payload(row))
                code = result.get("code")
                self.connectivity.report_success()
            except DeviceUnauthorized as exc:
                self.connectivity.report_unauthorized(str(exc))
            except CloudUnavailable as exc:
                self.connectivity.report_failure(str(exc))
        if code in ("ACCEPTED", "DUPLICATE"):
            status = "SYNCED"
        elif code == "REJECTED_UNKNOWN_VEHICLE":
            status = "LOCAL_ONLY"  # Cloud không có xe này -> chỉ lưu vết cục bộ

        self.db.set_status(event_id, status, decision="OPEN", decided_by="GUARD", cloud_result=result)
        self._apply_local_session(row)

        outcome = GateOutcome(
            event_id=event_id, lane=row["lane"], event_type=row["event_type"], plate=row["plate"],
            decision="OPEN", mode="GUARD", level="warn", code=code,
            message=f"Mở thủ công bởi {guard}", owner=(result or {}).get("owner"),
        )
        self._emit(outcome)
        return outcome

    # ------------------------------------------------------------------ decisions
    def _try_online(self, row: dict) -> Optional[GateOutcome]:
        try:
            resp = self.client.post_event(event_payload(row))
        except DeviceUnauthorized as exc:
            self.connectivity.report_unauthorized(str(exc))
            return None
        except CloudUnavailable as exc:
            # Timeout/mất mạng: không để xe chờ -> xử lý như offline, sự kiện sẽ được sync sau.
            self.connectivity.report_failure(str(exc))
            return None
        self.connectivity.report_success()

        code = resp.get("code")
        base = dict(event_id=row["event_id"], lane=row["lane"], event_type=row["event_type"],
                    plate=row["plate"], mode="ONLINE", code=code, owner=resp.get("owner"),
                    fee=resp.get("fee"), warnings=resp.get("warnings") or [])

        if code in ("ACCEPTED", "DUPLICATE"):
            self.db.set_status(row["event_id"], "SYNCED", decision="OPEN", decided_by="CLOUD", cloud_result=resp)
            self._apply_local_session(row)
            self.barrier.open(row["lane"])
            overdraft = bool(resp.get("overdraft"))
            return GateOutcome(**base, decision="OPEN", level="warn" if overdraft or base["warnings"] else "ok",
                               message=self._open_message(row, resp))

        if code in ("BLOCKED_DEBT", "BLOCKED_INSUFFICIENT"):
            self.db.set_status(row["event_id"], "BLOCKED", decision="DENY", decided_by="CLOUD",
                               cloud_result=resp, last_error=resp.get("message"))
            return GateOutcome(**base, decision="DENY", level="danger", needs_guard=True,
                               message=resp.get("message") or "Tài khoản bị chặn")

        if code == "REJECTED_UNKNOWN_VEHICLE":
            self.db.set_status(row["event_id"], "REJECTED", decision="DENY", decided_by="CLOUD",
                               cloud_result=resp, last_error=resp.get("message"))
            return GateOutcome(**base, decision="DENY", level="danger", needs_guard=True,
                               message="Biển số chưa đăng ký trong hệ thống")

        if code == "REJECTED_INVALID":
            self.db.set_status(row["event_id"], "REJECTED", decision="DENY", decided_by="CLOUD",
                               cloud_result=resp, last_error=resp.get("message"))
            return GateOutcome(**base, decision="DENY", level="danger", needs_guard=True,
                               message=f"Dữ liệu không hợp lệ: {resp.get('message')}")

        log.warning("Unexpected cloud response %s, falling back to offline", resp)
        return None

    def _decide_offline(self, row: dict) -> GateOutcome:
        cached = self.db.lookup_vehicle(row["plate_key"])
        base = dict(event_id=row["event_id"], lane=row["lane"], event_type=row["event_type"],
                    plate=row["plate"], mode="OFFLINE", fee=row.get("fee"))

        if cached is None and self.db.vehicle_cache_size() > 0 and not self.offline_open_unknown:
            self.db.set_status(row["event_id"], "REJECTED", decision="DENY", decided_by="OFFLINE",
                               last_error="Unknown plate (offline cache)")
            return GateOutcome(**base, decision="DENY", level="danger", needs_guard=True,
                               code="REJECTED_UNKNOWN_VEHICLE",
                               message="OFFLINE: biển số không có trong danh sách xe đã đăng ký")

        # Offline: không chặn xe đã đăng ký kể cả khi đang nợ (chỉ cảnh báo); Cloud trừ tiền khi sync (cho phép âm).
        self.db.set_status(row["event_id"], "PENDING_SYNC", decision="OPEN", decided_by="OFFLINE")
        self._apply_local_session(row)
        self.barrier.open(row["lane"])
        if self.on_queue_changed:
            self.on_queue_changed()

        owner = None
        level, message = "ok", "OFFLINE: đã mở cổng, sự kiện chờ đồng bộ"
        if cached:
            owner = {"name": cached["owner_name"], "mssv": cached["mssv"], "plate": cached["plate"],
                     "balance": cached["balance"],
                     "debt": -cached["balance"] if (cached["balance"] or 0) < 0 else 0}
            if cached["in_debt"]:
                level = "warn"
                message = f"OFFLINE: xe đang nợ cước {owner['debt']:,.0f}₫ (không chặn khi mất mạng)"
        return GateOutcome(**base, decision="OPEN", level=level, message=message, owner=owner,
                           code="PENDING_SYNC")

    # ------------------------------------------------------------------ helpers
    def _apply_local_session(self, row: dict) -> None:
        if row["event_type"] == "CHECK_IN":
            self.db.open_local_session(row["plate_key"], row["plate"], row["event_id"], row["event_time"])
        else:
            self.db.close_local_session(row["plate_key"])

    @staticmethod
    def _open_message(row: dict, resp: dict) -> str:
        if row["event_type"] == "CHECK_IN":
            return "Mời vào"
        balance = resp.get("balance_after")
        msg = f"Đã trừ {resp.get('fee', 0):,.0f}₫"
        if balance is not None:
            msg += f" - số dư {balance:,.0f}₫"
        if resp.get("overdraft"):
            msg += " (NỢ CƯỚC)"
        return msg

    def _save_evidence(self, event_id: str, plate_img, frame) -> tuple[Optional[str], Optional[str]]:
        day_dir = self.evidence_dir / time.strftime("%Y-%m-%d")
        plate_path = frame_path = None
        try:
            day_dir.mkdir(parents=True, exist_ok=True)
            if plate_img is not None and plate_img.size:
                plate_path = str(day_dir / f"{event_id}_plate.jpg")
                cv2.imwrite(plate_path, plate_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if frame is not None and frame.size:
                h, w = frame.shape[:2]
                if w > FRAME_EVIDENCE_MAX_WIDTH:
                    frame = cv2.resize(frame, (FRAME_EVIDENCE_MAX_WIDTH, int(h * FRAME_EVIDENCE_MAX_WIDTH / w)),
                                       interpolation=cv2.INTER_AREA)
                frame_path = str(day_dir / f"{event_id}_frame.jpg")
                cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        except (OSError, cv2.error):
            log.exception("Failed to save evidence for %s", event_id)
        return plate_path, frame_path

    def _emit(self, outcome: GateOutcome) -> None:
        if self.on_outcome:
            try:
                self.on_outcome(outcome)
            except Exception:
                log.exception("on_outcome callback failed")
