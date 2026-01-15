import requests
import random

JANUS_ADMIN = "http://localhost:7088/admin"


def create_rtsp_stream(rtsp_url: str) -> int:
    stream_id = random.randint(1000, 9999)

    payload = {
        "janus": "message",
        "transaction": "create-rtsp",
        "body": {
            "request": "create",
            "type": "rtsp",
            "id": stream_id,
            "url": rtsp_url,
            "video": True,
            "audio": False,
            "videopt": 96,
            "videortpmap": "H264/90000",
            "videofmtp": "profile-level-id=42e01f;packetization-mode=1",
        },
    }

    r = requests.post(JANUS_ADMIN, json=payload, timeout=5)
    r.raise_for_status()

    return stream_id
