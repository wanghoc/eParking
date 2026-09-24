"""Heartbeat tới Cloud: xác định trạng thái Online/Offline và làm mới cache xe cho chế độ offline."""
from __future__ import annotations

import logging
import threading
import time
from typing import Callable, Optional

from .config import CloudConfig
from .errors import CloudUnavailable, DeviceUnauthorized
from .local_db import LocalDB

log = logging.getLogger(__name__)


class ConnectivityMonitor:
    def __init__(self, client, db: LocalDB, cfg: CloudConfig,
                 on_change: Optional[Callable[[bool], None]] = None):
        self.client = client
        self.db = db
        self.cfg = cfg
        self.on_change = on_change
        self.auth_error: Optional[str] = None
        self._online = threading.Event()
        self._failures = 0
        self._last_snapshot: Optional[float] = None
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="connectivity")

    @property
    def online(self) -> bool:
        return self._online.is_set()

    def wait_online(self, timeout: float) -> bool:
        return self._online.wait(timeout)

    def start(self) -> "ConnectivityMonitor":
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=3)

    def report_success(self) -> None:
        with self._lock:
            self._failures = 0
            changed = not self._online.is_set()
            self._online.set()
            self.auth_error = None
        if changed:
            log.info("Cloud ONLINE")
            if self.on_change:
                self.on_change(True)

    def report_failure(self, reason: str) -> None:
        with self._lock:
            self._failures += 1
            changed = self._online.is_set() and self._failures >= self.cfg.failures_before_offline
            if changed:
                self._online.clear()
        if changed:
            log.warning("Cloud OFFLINE: %s", reason)
            if self.on_change:
                self.on_change(False)

    def report_unauthorized(self, reason: str) -> None:
        with self._lock:
            self._failures = self.cfg.failures_before_offline - 1
        self.report_failure(f"unauthorized: {reason}")
        self.auth_error = reason

    def check_once(self) -> None:
        try:
            hb = self.client.heartbeat(self.db.count_pending())
            self.db.set_kv("fee_per_turn", hb.get("fee_per_turn"))
            self.db.set_kv("device", hb.get("device"))
            self.report_success()
            due = self._last_snapshot is None or time.monotonic() - self._last_snapshot > self.cfg.snapshot_interval_s
            if due:
                snap = self.client.vehicle_snapshot()
                self.db.replace_vehicle_cache(snap.get("vehicles", []))
                self.db.set_kv("fee_per_turn", snap.get("fee_per_turn"))
                self._last_snapshot = time.monotonic()
                log.info("Vehicle cache refreshed: %d vehicles", len(snap.get("vehicles", [])))
        except DeviceUnauthorized as exc:
            log.error("Device key rejected by Cloud: %s", exc)
            self.report_unauthorized(str(exc))
        except CloudUnavailable as exc:
            self.report_failure(str(exc))

    def _run(self) -> None:
        while not self._stop.is_set():
            self.check_once()
            interval = self.cfg.heartbeat_interval_s if self.online else min(3.0, self.cfg.heartbeat_interval_s)
            self._stop.wait(interval)
