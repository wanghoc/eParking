"""SQLite cục bộ: hàng chờ sự kiện/thanh toán (outbox), phiên đang mở tại trạm, cache xe cho chế độ offline."""
from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# Vòng đời 1 bản ghi payment_queue:
#   DECIDING -----(Cloud OPEN)------------------> SYNCED
#      |     -----(Cloud chặn: nợ / không đủ tiền)-> BLOCKED --(bảo vệ override)--> SYNCED | PENDING_SYNC
#      |     -----(xe chưa đăng ký)--------------> REJECTED --(override)--> LOCAL_ONLY
#      +-----(mất mạng / timeout / 5xx)----------> PENDING_SYNC --(sync worker)--> SYNCED | REJECTED
SCHEMA = """
CREATE TABLE IF NOT EXISTS payment_queue (
    event_id          TEXT PRIMARY KEY,
    event_type        TEXT NOT NULL CHECK (event_type IN ('CHECK_IN', 'CHECK_OUT')),
    lane              TEXT NOT NULL,
    plate             TEXT NOT NULL,
    plate_key         TEXT NOT NULL,
    event_time        TEXT NOT NULL,
    entry_time        TEXT,
    fee               REAL,
    confidence        REAL,
    plate_image_path  TEXT,
    frame_image_path  TEXT,
    decision          TEXT CHECK (decision IN ('OPEN', 'DENY')),
    decided_by        TEXT CHECK (decided_by IN ('CLOUD', 'OFFLINE', 'GUARD')),
    override_by       TEXT,
    override_reason   TEXT,
    sync_status       TEXT NOT NULL DEFAULT 'DECIDING'
                      CHECK (sync_status IN ('DECIDING', 'PENDING_SYNC', 'SYNCED', 'BLOCKED', 'REJECTED', 'LOCAL_ONLY')),
    attempts          INTEGER NOT NULL DEFAULT 0,
    next_attempt_at   TEXT,
    last_error        TEXT,
    cloud_result      TEXT,
    cloud_session_id  INTEGER,
    created_at        TEXT NOT NULL,
    synced_at         TEXT
);
CREATE INDEX IF NOT EXISTS ix_queue_due ON payment_queue (sync_status, next_attempt_at, event_time);
CREATE INDEX IF NOT EXISTS ix_queue_plate ON payment_queue (plate_key, event_time);

CREATE TABLE IF NOT EXISTS local_sessions (
    plate_key       TEXT PRIMARY KEY,
    plate           TEXT NOT NULL,
    entry_event_id  TEXT NOT NULL,
    entry_time      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_cache (
    plate_key    TEXT PRIMARY KEY,
    plate        TEXT NOT NULL,
    user_id      INTEGER,
    owner_name   TEXT,
    mssv         TEXT,
    balance      REAL,
    in_debt      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kv (
    key    TEXT PRIMARY KEY,
    value  TEXT
);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class LocalDB:
    def __init__(self, path: str | Path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path), check_same_thread=False, isolation_level=None)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.RLock()
        with self._lock:
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA synchronous=NORMAL")
            self._conn.execute("PRAGMA busy_timeout=5000")
            self._conn.executescript(SCHEMA)

    def close(self):
        with self._lock:
            self._conn.close()

    def _exec(self, sql: str, params: tuple | dict = ()) -> sqlite3.Cursor:
        with self._lock:
            return self._conn.execute(sql, params)

    # ---------- payment_queue ----------
    def insert_event(self, ev: dict[str, Any]) -> None:
        row = {
            "entry_time": None, "fee": None, "confidence": None,
            "plate_image_path": None, "frame_image_path": None,
            **ev,
            "sync_status": "DECIDING",
            "created_at": utc_now(),
        }
        cols = ", ".join(row)
        self._exec(f"INSERT INTO payment_queue ({cols}) VALUES ({', '.join(':' + c for c in row)})", row)

    def get_event(self, event_id: str) -> Optional[dict]:
        r = self._exec("SELECT * FROM payment_queue WHERE event_id = ?", (event_id,)).fetchone()
        return dict(r) if r else None

    def set_status(
        self,
        event_id: str,
        status: str,
        *,
        decision: Optional[str] = None,
        decided_by: Optional[str] = None,
        cloud_result: Optional[dict] = None,
        override_by: Optional[str] = None,
        override_reason: Optional[str] = None,
        last_error: Optional[str] = None,
    ) -> None:
        session_id = (cloud_result or {}).get("session_id")
        self._exec(
            """UPDATE payment_queue SET
                 sync_status = :status,
                 decision = COALESCE(:decision, decision),
                 decided_by = COALESCE(:decided_by, decided_by),
                 cloud_result = COALESCE(:cloud_result, cloud_result),
                 cloud_session_id = COALESCE(:session_id, cloud_session_id),
                 override_by = COALESCE(:override_by, override_by),
                 override_reason = COALESCE(:override_reason, override_reason),
                 last_error = :last_error,
                 synced_at = CASE WHEN :status = 'SYNCED' THEN :now ELSE synced_at END
               WHERE event_id = :event_id""",
            {
                "status": status, "decision": decision, "decided_by": decided_by,
                "cloud_result": json.dumps(cloud_result, ensure_ascii=False) if cloud_result else None,
                "session_id": session_id, "override_by": override_by, "override_reason": override_reason,
                "last_error": last_error, "now": utc_now(), "event_id": event_id,
            },
        )

    def fetch_due(self, limit: int, now: Optional[str] = None) -> list[dict]:
        rows = self._exec(
            """SELECT * FROM payment_queue
               WHERE sync_status = 'PENDING_SYNC' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
               ORDER BY event_time ASC LIMIT ?""",
            (now or utc_now(), limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def schedule_retry(self, event_id: str, error: str, next_attempt_at: str) -> None:
        self._exec(
            """UPDATE payment_queue SET attempts = attempts + 1, last_error = ?, next_attempt_at = ?
               WHERE event_id = ? AND sync_status = 'PENDING_SYNC'""",
            (error[:500], next_attempt_at, event_id),
        )

    def count_by_status(self) -> dict[str, int]:
        rows = self._exec("SELECT sync_status, COUNT(*) AS n FROM payment_queue GROUP BY sync_status").fetchall()
        return {r["sync_status"]: r["n"] for r in rows}

    def count_pending(self) -> int:
        return self.count_by_status().get("PENDING_SYNC", 0)

    def recent_events(self, limit: int = 50) -> list[dict]:
        rows = self._exec("SELECT * FROM payment_queue ORDER BY event_time DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

    def recover_after_crash(self) -> int:
        """Bản ghi kẹt ở DECIDING (app tắt giữa chừng): không biết xe đã qua hay chưa -> chuyển BLOCKED để đối soát tay."""
        cur = self._exec(
            "UPDATE payment_queue SET sync_status = 'BLOCKED', last_error = 'App stopped while deciding' "
            "WHERE sync_status = 'DECIDING'"
        )
        return cur.rowcount

    # ---------- local_sessions ----------
    def open_local_session(self, plate_key: str, plate: str, event_id: str, entry_time: str) -> None:
        self._exec(
            "INSERT OR REPLACE INTO local_sessions (plate_key, plate, entry_event_id, entry_time) VALUES (?, ?, ?, ?)",
            (plate_key, plate, event_id, entry_time),
        )

    def get_local_session(self, plate_key: str) -> Optional[dict]:
        r = self._exec("SELECT * FROM local_sessions WHERE plate_key = ?", (plate_key,)).fetchone()
        return dict(r) if r else None

    def close_local_session(self, plate_key: str) -> None:
        self._exec("DELETE FROM local_sessions WHERE plate_key = ?", (plate_key,))

    # ---------- vehicle_cache / kv ----------
    def replace_vehicle_cache(self, vehicles: list[dict]) -> None:
        with self._lock:
            self._conn.execute("BEGIN")
            try:
                self._conn.execute("DELETE FROM vehicle_cache")
                self._conn.executemany(
                    """INSERT OR REPLACE INTO vehicle_cache
                       (plate_key, plate, user_id, owner_name, mssv, balance, in_debt)
                       VALUES (:plate_key, :plate, :user_id, :owner_name, :mssv, :balance, :in_debt)""",
                    [{**v, "in_debt": int(bool(v.get("in_debt")))} for v in vehicles],
                )
                self._conn.execute("COMMIT")
            except Exception:
                self._conn.execute("ROLLBACK")
                raise
        self.set_kv("vehicle_cache_at", utc_now())

    def lookup_vehicle(self, plate_key: str) -> Optional[dict]:
        r = self._exec("SELECT * FROM vehicle_cache WHERE plate_key = ?", (plate_key,)).fetchone()
        return dict(r) if r else None

    def vehicle_cache_size(self) -> int:
        return self._exec("SELECT COUNT(*) FROM vehicle_cache").fetchone()[0]

    def set_kv(self, key: str, value: Any) -> None:
        self._exec("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", (key, json.dumps(value)))

    def get_kv(self, key: str, default: Any = None) -> Any:
        r = self._exec("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
        return json.loads(r["value"]) if r else default
