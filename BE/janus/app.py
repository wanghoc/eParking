from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uuid
import os

# ---------------- CONFIG ----------------

JANUS_URL = os.getenv("JANUS_URL", "http://localhost:7088/janus")


REQUEST_TIMEOUT = 5

# ---------------- FASTAPI ----------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MODELS ----------------


class CreateStreamRequest(BaseModel):
    rtsp_url: str


class CreateStreamResponse(BaseModel):
    streamId: int


# ---------------- HELPERS ----------------
def janus_request(url: str, payload: dict) -> dict:
    payload["transaction"] = str(uuid.uuid4())
    r = requests.post(url, json=payload, timeout=5)
    r.raise_for_status()
    data = r.json()
    if data.get("janus") not in ("ack", "success"):
        raise HTTPException(500, f"Janus error: {data}")
    return data


@app.get("/api/health")
def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "service": "janus-proxy"}


@app.post("/api/create-stream", response_model=CreateStreamResponse)
def create_stream(req: CreateStreamRequest):

    # 1️⃣ Create session
    res = janus_request(JANUS_URL, {"janus": "create"})
    session_id = res["data"]["id"]

    # 2️⃣ Attach streaming plugin
    res = janus_request(
        f"{JANUS_URL}/{session_id}",
        {"janus": "attach", "plugin": "janus.plugin.streaming"},
    )
    handle_id = res["data"]["id"]

    # 3️⃣ Choose stream ID
    stream_id = int(uuid.uuid4().int % 1_000_000)

    # 4️⃣ Create RTSP stream
    janus_request(
        f"{JANUS_URL}/{session_id}/{handle_id}",
        {
            "janus": "message",
            "body": {
                "request": "create",
                "type": "rtsp",
                "id": stream_id,
                "description": "RTSP Camera",
                "url": req.rtsp_url,
                "video": True,
                "audio": False,
                "videocodec": "h264",
            },
        },
    )

    return {"streamId": stream_id}
