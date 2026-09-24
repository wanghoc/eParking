"""Hợp đồng dữ liệu Edge -> Cloud (xem docs/EDGE_CLOUD_ARCHITECTURE.md)."""
from __future__ import annotations

import base64
from pathlib import Path
from typing import Optional


def _b64_file(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    p = Path(path)
    return base64.b64encode(p.read_bytes()).decode("ascii") if p.exists() else None


def event_payload(row: dict, include_images: bool = True) -> dict:
    payload = {
        "event_id": row["event_id"],
        "type": row["event_type"],
        "plate": row["plate"],
        "event_time": row["event_time"],
        "entry_time": row.get("entry_time"),
        "fee": row.get("fee"),
        "confidence": row.get("confidence"),
        "lane": row.get("lane"),
    }
    if row.get("override_by"):
        payload["override"] = {"by": row["override_by"], "reason": row.get("override_reason") or ""}
    if include_images:
        images = {"plate": _b64_file(row.get("plate_image_path")), "frame": _b64_file(row.get("frame_image_path"))}
        payload["images"] = {k: v for k, v in images.items() if v}
    return payload
