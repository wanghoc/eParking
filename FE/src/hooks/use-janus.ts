import Janus, { JanusJS } from "janus-gateway";
import { useEffect, useRef } from "react";
import { getCameraStream } from "../utils";

export function useJanus(
  rtspUrl: string,
  janusUrl?: string
) {
  // Auto-detect Janus URL: use localhost for local dev, otherwise use current hostname
  const defaultJanusUrl = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8088/janus`
    : "http://localhost:8088/janus";

  const finalJanusUrl = janusUrl || defaultJanusUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const janusRef = useRef<Janus | null>(null);
  const pluginRef = useRef<JanusJS.PluginHandle | null>(null);
  const streamIdRef = useRef<number | null>(null);

  useEffect(() => {
    console.log({ adapter: (window as any).adapter });
    Janus.init({
      debug: "all",
      callback: () => {
        janusRef.current = new Janus({
          server: finalJanusUrl,

          success: async () => {
            const streamId = await getCameraStream(rtspUrl);
            streamIdRef.current = streamId;
            attachStreamingPlugin();
          },

          error: (err) => {
            console.error("Janus error", err);
          },

          destroyed: () => {
            console.log("Janus session destroyed");
          },
        });
      },
    });

    return () => {
      pluginRef.current?.detach();
      janusRef.current?.destroy({});
    };
  }, [rtspUrl, finalJanusUrl]);

  function attachStreamingPlugin() {
    janusRef.current!.attach({
      plugin: "janus.plugin.streaming",

      success: (handle) => {
        pluginRef.current = handle;
        watchStream(streamIdRef.current!);
      },

      error: (err) => {
        console.error("Plugin attach failed", err);
      },

      onmessage: (msg, jsep) => {
        if (jsep) {
          pluginRef.current!.createAnswer({
            jsep,
            media: { audioSend: false, videoSend: false },
            success: (answer) => {
              pluginRef.current!.send({
                message: { request: "start" },
                jsep: answer,
              });
            },
          });
        }
      },

      onremotetrack: (track, _, on) => {
        if (!on || !videoRef.current) return;

        const stream =
          (videoRef.current.srcObject as MediaStream) || new MediaStream();
        stream.addTrack(track);
        videoRef.current.srcObject = stream;
      },
    });
  }

  function watchStream(streamId: number) {
    pluginRef.current!.send({
      message: { request: "watch", id: streamId },
    });
  }

  return videoRef;
}
