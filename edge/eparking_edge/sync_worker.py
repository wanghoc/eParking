"""Tiến trình nền: đẩy các sự kiện PENDING_SYNC lên Cloud theo lô khi có mạng."""
from __future__ import annotations

import logging
import random
import threading
from datetime import datetime, timedelta, timezone

from .config import SyncConfig
from .errors import CloudUnavailable, DeviceUnauthorized
from .local_db import LocalDB
from .payload import event_payload

log = logging.getLogger(__name__)

SYNCED_CODES = {"ACCEPTED", "DUPLICATE"}


def backoff_delay(attempts: int, cfg: SyncConfig) -> float:
    return min(cfg.backoff_max_s, cfg.backoff_base_s * (2 ** attempts)) * random.uniform(0.8, 1.2)


def _iso_in(seconds: float) -> str:
    t = datetime.now(timezone.utc) + timedelta(seconds=seconds)
    return t.isoformat(timespec="milliseconds").replace("+00:00", "Z")


class SyncWorker:
    def __init__(self, db: LocalDB, client, connectivity, cfg: SyncConfig):
        self.db = db
        self.client = client
        self.connectivity = connectivity
        self.cfg = cfg
        self._wake = threading.Event()
        self._stop = threading.Event()
        self._failures = 0
        self._thread = threading.Thread(target=self._run, daemon=True, name="sync-worker")

    def start(self) -> "SyncWorker":
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()
        self._wake.set()
        self._thread.join(timeout=5)

    def wake(self) -> None:
        self._wake.set()

    def run_once(self) -> dict:
        """Đồng bộ 1 lô. Trả về thống kê {sent, synced, rejected, retry, failed}."""
        stats = {"sent": 0, "synced": 0, "rejected": 0, "retry": 0, "failed": False}
        rows = self.db.fetch_due(self.cfg.batch_size)
        if not rows:
            return stats
        stats["sent"] = len(rows)
        try:
            resp = self.client.sync_batch([event_payload(r) for r in rows], self.cfg.request_timeout_s)
        except DeviceUnauthorized as exc:
            self.connectivity.report_unauthorized(str(exc))
            stats["failed"] = True
            return stats
        except CloudUnavailable as exc:
            self.connectivity.report_failure(f"sync: {exc}")
            self._failures += 1
            stats["failed"] = True
            return stats

        self._failures = 0
        self.connectivity.report_success()
        results = {str(r.get("event_id")).lower(): r for r in resp.get("results", [])}
        for row in rows:
            r = results.get(row["event_id"].lower())
            code = (r or {}).get("code")
            if code in SYNCED_CODES:
                self.db.set_status(row["event_id"], "SYNCED", cloud_result=r)
                stats["synced"] += 1
            elif code and code.startswith("REJECTED"):
                # Lỗi nghiệp vụ vĩnh viễn (xe chưa đăng ký, payload sai): không retry, chờ admin đối soát.
                self.db.set_status(row["event_id"], "REJECTED", cloud_result=r, last_error=r.get("message"))
                stats["rejected"] += 1
            else:
                reason = (r or {}).get("message") or resp.get("message") or "no result for event"
                self.db.schedule_retry(row["event_id"], reason, _iso_in(backoff_delay(row["attempts"], self.cfg)))
                stats["retry"] += 1
        log.info("Sync batch: %s", stats)
        return stats

    def _run(self) -> None:
        while not self._stop.is_set():
            if not self.connectivity.wait_online(timeout=self.cfg.interval_s):
                continue
            stats = self.run_once()
            if stats["failed"]:
                self._stop.wait(backoff_delay(self._failures, self.cfg))
            elif stats["sent"] < self.cfg.batch_size:
                self._wake.wait(self.cfg.interval_s)
                self._wake.clear()
