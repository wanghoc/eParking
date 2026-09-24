"""REST client tới Cloud backend (/api/edge/*)."""
from __future__ import annotations

from typing import Any

import requests

from . import __version__
from .config import CloudConfig
from .errors import CloudUnavailable, DeviceUnauthorized


class CloudClient:
    def __init__(self, cfg: CloudConfig):
        self.cfg = cfg
        self.base = cfg.base_url.rstrip("/") + "/api/edge"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Device {cfg.device_key}",
            "User-Agent": f"eparking-edge/{__version__}",
        })

    def _request(self, method: str, path: str, timeout: tuple[float, float], **kwargs) -> Any:
        try:
            resp = self.session.request(method, self.base + path, timeout=timeout, **kwargs)
        except requests.RequestException as exc:
            raise CloudUnavailable(str(exc)) from exc
        if resp.status_code == 401:
            raise DeviceUnauthorized(resp.text[:200])
        if resp.status_code >= 500:
            raise CloudUnavailable(f"HTTP {resp.status_code}")
        try:
            body = resp.json()
        except ValueError as exc:
            raise CloudUnavailable(f"Invalid JSON (HTTP {resp.status_code})") from exc
        if resp.status_code >= 400 and "code" not in body:
            raise CloudUnavailable(f"HTTP {resp.status_code}: {body}")
        return body

    def heartbeat(self, pending_events: int) -> dict:
        return self._request(
            "POST", "/heartbeat", (self.cfg.connect_timeout_s, 3.0),
            json={"app_version": __version__, "pending_events": pending_events},
        )

    def vehicle_snapshot(self) -> dict:
        return self._request("GET", "/vehicles/snapshot", (self.cfg.connect_timeout_s, 15.0))

    def post_event(self, event: dict) -> dict:
        """Chế độ online: ngân sách thời gian ngắn vì xe đang đứng chờ tại barrier."""
        return self._request(
            "POST", "/events", (self.cfg.connect_timeout_s, self.cfg.read_timeout_s), json=event,
        )

    def sync_batch(self, events: list[dict], timeout_s: float) -> dict:
        return self._request(
            "POST", "/sync/batch", (self.cfg.connect_timeout_s * 3, timeout_s), json={"events": events},
        )
