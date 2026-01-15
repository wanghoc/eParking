import { cameraStreamUrl } from "../api";

export async function getCameraStream(rtspUrl: string) {
  const res = await fetch(cameraStreamUrl("/create-stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rtsp_url: rtspUrl,
    }),
  });

  const { streamId } = await res.json();
  return streamId;
}

interface Camera {
  username?: string;
  password?: string;
  ip_address?: string;
  port?: number;
  channel?: number;
}

export function getRTSPUrl(camera: Camera) {
  return `rtsp://${
    camera.username && camera.password
      ? `${camera.username}:${camera.password}@`
      : ""
  }${camera.ip_address}:${camera.port || 554}/live/cam/realmonitor?channel=${
    camera.channel || 1
  }&subtype=0`;
}
