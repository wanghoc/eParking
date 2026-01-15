import adapter from "webrtc-adapter";

// Janus expects a GLOBAL symbol called `adapter`
(window as any).adapter = adapter;
