import numpy as np
import pytest

from eparking_edge.config import CloudConfig, SyncConfig
from eparking_edge.connectivity import ConnectivityMonitor
from eparking_edge.errors import CloudUnavailable
from eparking_edge.gate_controller import GateController
from eparking_edge.local_db import LocalDB
from eparking_edge.sync_worker import SyncWorker


class FakeCloud:
    """Mô phỏng Cloud: ví theo biển số, cho phép âm khi SYNC, chặn khi ONLINE nếu đang nợ."""

    def __init__(self, balances, fee=2000):
        self.balances = dict(balances)
        self.fee = fee
        self.down = False
        self.ledger = {}
        self.calls = []

    def _process(self, ev, mode):
        if ev["event_id"] in self.ledger:
            return {**self.ledger[ev["event_id"]], "code": "DUPLICATE"}
        plate = ev["plate"]
        if plate not in self.balances:
            return {"event_id": ev["event_id"], "code": "REJECTED_UNKNOWN_VEHICLE", "decision": "DENY"}
        bal = self.balances[plate]
        if mode == "ONLINE" and not ev.get("override"):
            if bal < 0:
                return {"event_id": ev["event_id"], "code": "BLOCKED_DEBT", "decision": "DENY",
                        "owner": {"plate": plate, "balance": bal, "debt": -bal}, "message": "no"}
            if ev["type"] == "CHECK_OUT" and bal < self.fee:
                return {"event_id": ev["event_id"], "code": "BLOCKED_INSUFFICIENT", "decision": "DENY"}
        res = {"event_id": ev["event_id"], "code": "ACCEPTED", "decision": "OPEN", "session_id": len(self.ledger) + 1}
        if ev["type"] == "CHECK_OUT":
            self.balances[plate] = bal - self.fee
            res.update(fee=self.fee, balance_after=self.balances[plate], overdraft=self.balances[plate] < 0)
        self.ledger[ev["event_id"]] = res
        return res

    def heartbeat(self, pending):
        if self.down:
            raise CloudUnavailable("down")
        return {"fee_per_turn": self.fee, "device": {"code": "GATE-A"}}

    def vehicle_snapshot(self):
        if self.down:
            raise CloudUnavailable("down")
        return {"fee_per_turn": self.fee, "vehicles": [
            {"plate": p, "plate_key": p.replace("-", ""), "user_id": i, "owner_name": f"U{i}", "mssv": str(i),
             "balance": b, "in_debt": b < 0}
            for i, (p, b) in enumerate(self.balances.items())
        ]}

    def post_event(self, ev):
        self.calls.append(("ONLINE", ev))
        if self.down:
            raise CloudUnavailable("timeout")
        return self._process(ev, "ONLINE")

    def sync_batch(self, events, timeout_s):
        self.calls.append(("SYNC", events))
        if self.down:
            raise CloudUnavailable("down")
        ordered = sorted(events, key=lambda e: e["event_time"])
        return {"results": [self._process(e, "SYNC") for e in ordered]}


class FakeBarrier:
    def __init__(self):
        self.opened = []

    def open(self, lane):
        self.opened.append(lane)


@pytest.fixture
def env(tmp_path):
    db = LocalDB(tmp_path / "edge.sqlite3")
    cloud = FakeCloud({"49G1-11111": 10000, "49H1-22222": -4000, "49K1-33333": 1000})
    conn = ConnectivityMonitor(cloud, db, CloudConfig(failures_before_offline=1))
    conn.check_once()  # online + nạp cache
    barrier = FakeBarrier()
    gate = GateController(db, cloud, conn, barrier, tmp_path / "evidence")
    sync = SyncWorker(db, cloud, conn, SyncConfig(backoff_base_s=0.01))
    yield db, cloud, conn, barrier, gate, sync
    db.close()


def img():
    return np.zeros((40, 120, 3), dtype=np.uint8)


def test_online_check_in_and_out_charges_and_opens(env):
    db, cloud, conn, barrier, gate, _ = env
    assert conn.online
    a = gate.handle_plate("IN", "49G1-11111", plate_img=img(), frame=img())
    b = gate.handle_plate("OUT", "49G1-11111")
    assert (a.decision, a.mode, b.decision) == ("OPEN", "ONLINE", "OPEN")
    assert barrier.opened == ["IN", "OUT"]
    assert cloud.balances["49G1-11111"] == 8000
    assert db.count_by_status() == {"SYNCED": 2}
    online_payload = cloud.calls[0][1]
    assert online_payload["images"]["plate"] and online_payload["images"]["frame"]


def test_online_debt_blocks_barrier_until_guard_override(env):
    db, cloud, _, barrier, gate, _ = env
    out = gate.handle_plate("OUT", "49H1-22222")
    assert out.decision == "DENY" and out.needs_guard and out.level == "danger"
    assert out.owner["debt"] == 4000
    assert barrier.opened == []
    assert db.get_event(out.event_id)["sync_status"] == "BLOCKED"

    ov = gate.override(out.event_id, guard="Bảo vệ A", reason="Hứa nạp tiền")
    assert ov.decision == "OPEN" and barrier.opened == ["OUT"]
    row = db.get_event(out.event_id)
    assert row["sync_status"] == "SYNCED" and row["override_by"] == "Bảo vệ A"
    assert cloud.balances["49H1-22222"] == -6000
    with pytest.raises(ValueError):
        gate.override(out.event_id, guard="Bảo vệ A")


def test_offline_never_blocks_registered_vehicle_then_syncs_with_overdraft(env):
    db, cloud, conn, barrier, gate, sync = env
    cloud.down = True
    conn.check_once()
    assert not conn.online

    gate.handle_plate("IN", "49K1-33333")
    gate.handle_plate("IN", "49H1-22222")  # đang nợ: chỉ cảnh báo khi offline
    out = gate.handle_plate("OUT", "49K1-33333")  # số dư 1000 < phí 2000
    assert barrier.opened == ["IN", "IN", "OUT"]
    assert out.mode == "OFFLINE" and out.fee == 2000
    assert db.count_pending() == 3
    assert db.get_event(out.event_id)["entry_time"] is not None
    assert not [c for c in cloud.calls if c[0] == "ONLINE"]

    stats = sync.run_once()  # vẫn mất mạng
    assert stats["failed"] and db.count_pending() == 3

    cloud.down = False
    stats = sync.run_once()
    assert stats == {"sent": 3, "synced": 3, "rejected": 0, "retry": 0, "failed": False}
    assert cloud.balances["49K1-33333"] == -1000  # thấu chi
    assert db.count_by_status() == {"SYNCED": 3}

    # Có mạng trở lại: lượt kế tiếp bị chặn do số dư âm
    nxt = gate.handle_plate("IN", "49K1-33333")
    assert nxt.decision == "DENY" and nxt.code == "BLOCKED_DEBT"


def test_offline_debt_warning(env):
    _, cloud, conn, _, gate, _ = env
    cloud.down = True
    conn.check_once()
    o = gate.handle_plate("IN", "49H1-22222")
    assert o.decision == "OPEN" and o.level == "warn" and "nợ" in o.message


def test_timeout_during_online_call_falls_back_to_offline(env):
    db, cloud, conn, barrier, gate, _ = env
    cloud.down = True  # heartbeat chưa phát hiện, request online bị timeout
    o = gate.handle_plate("IN", "49G1-11111")
    assert o.decision == "OPEN" and o.mode == "OFFLINE"
    assert db.get_event(o.event_id)["sync_status"] == "PENDING_SYNC"


def test_unknown_plate_offline_denied_then_override_queues_for_cloud(env):
    db, cloud, conn, barrier, gate, sync = env
    cloud.down = True
    conn.check_once()
    o = gate.handle_plate("IN", "12A1-99999")
    assert o.decision == "DENY" and o.needs_guard and barrier.opened == []
    gate.override(o.event_id, guard="BV")
    assert barrier.opened == ["IN"]
    assert db.get_event(o.event_id)["sync_status"] == "PENDING_SYNC"
    cloud.down = False
    stats = sync.run_once()
    assert stats["rejected"] == 1
    assert db.get_event(o.event_id)["sync_status"] == "REJECTED"


def test_duplicate_on_resync_is_marked_synced(env):
    db, cloud, _, _, gate, sync = env
    o = gate.handle_plate("IN", "49G1-11111")
    db.set_status(o.event_id, "PENDING_SYNC")  # giả lập: Cloud đã xử lý nhưng Edge mất response
    assert sync.run_once()["synced"] == 1
    assert db.get_event(o.event_id)["sync_status"] == "SYNCED"


def test_missing_result_is_retried_with_backoff(env):
    db, cloud, _, _, gate, sync = env
    cloud.down = True
    o = gate.handle_plate("IN", "49G1-11111")
    cloud.down = False
    cloud.sync_batch = lambda events, timeout_s: {"results": []}
    assert sync.run_once()["retry"] == 1
    row = db.get_event(o.event_id)
    assert row["attempts"] == 1 and row["next_attempt_at"] and row["sync_status"] == "PENDING_SYNC"


def test_crash_recovery_moves_deciding_rows_to_blocked(tmp_path):
    db = LocalDB(tmp_path / "x.sqlite3")
    db.insert_event({"event_id": "e1", "event_type": "CHECK_IN", "lane": "IN", "plate": "49G1-11111",
                     "plate_key": "49G111111", "event_time": "2026-01-01T00:00:00.000Z"})
    assert db.recover_after_crash() == 1
    assert db.get_event("e1")["sync_status"] == "BLOCKED"
    db.close()
