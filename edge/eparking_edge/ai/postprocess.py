"""Hậu xử lý không gian: ghép các ký tự YOLO11n thành chuỗi biển số (1 dòng / 2 dòng)."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Sequence

TWO_LINE_SPREAD_RATIO = 0.3
TWO_LINE_MIN_CHARS = 4

# Biển VN sau khi bỏ ký tự phân cách: 2 số mã tỉnh + 1-2 chữ seri + 4-6 số (vd 49G111111, 51F12345, 29AB12345)
_PLATE_KEY_RE = re.compile(r"^\d{2}[A-Z]{1,2}\d{4,6}$")


@dataclass(frozen=True)
class CharBox:
    label: str
    x: float  # tâm theo trục hoành, gốc (0,0) ở góc trên-trái ảnh biển số đã cắt
    y: float  # tâm theo trục tung
    conf: float = 1.0


def is_two_line(chars: Sequence[CharBox], crop_height: float) -> bool:
    """T(C): biển 2 dòng nếu Δy = max(y) - min(y) > 0.3·H và n ≥ 4."""
    if len(chars) < TWO_LINE_MIN_CHARS:
        return False
    ys = [c.y for c in chars]
    return (max(ys) - min(ys)) > TWO_LINE_SPREAD_RATIO * crop_height


def assemble_plate(chars: Sequence[CharBox], crop_height: float) -> str:
    if not chars:
        return ""
    if not is_two_line(chars, crop_height):
        return "".join(c.label for c in sorted(chars, key=lambda c: c.x))

    y_mid = sum(c.y for c in chars) / len(chars)
    top = sorted((c for c in chars if c.y < y_mid), key=lambda c: c.x)
    bottom = sorted((c for c in chars if c.y >= y_mid), key=lambda c: c.x)
    return "".join(c.label for c in top) + "-" + "".join(c.label for c in bottom)


def plate_key(plate: str) -> str:
    """Khóa so khớp giống Cloud (lib/edge_events.js#plateKey)."""
    return re.sub(r"[^A-Z0-9]", "", (plate or "").upper())


def is_plausible_plate(plate: str) -> bool:
    return bool(_PLATE_KEY_RE.match(plate_key(plate)))
