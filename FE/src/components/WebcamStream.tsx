import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle, ScanLine } from "lucide-react";
import { apiUrl } from "../api";
import { io, Socket } from "socket.io-client";

interface WebcamStreamProps {
  cameraId: number;
  name: string;
  cameraType?: string; // 'Vào' | 'Ra' - Loại camera để hiển thị trạng thái đúng
  onError?: (error: string) => void;
  onDetection?: (plateNumber: string, confidence: number) => void; // NEW: Callback for detected plates
  hideIndicators?: boolean; // NEW: Hide status indicators (for AdminDashboard)
}

interface DetectionResult {
  success: boolean;
  plate_number?: string;
  confidence?: number;
  message?: string;
  annotated_image_base64?: string;
  database?: {
    registered: boolean;
    camera_type?: string;
    status_message?: string;
    payment_status?: string;
  };
}

export function WebcamStream({
  cameraId,
  name,
  cameraType,
  onError,
  onDetection,
  hideIndicators = false,
}: WebcamStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConnectedRef = useRef<boolean>(false); // CRITICAL: Use ref for immediate access
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    // Initialize SocketIO connection
    const initializeWebSocket = () => {
      console.log(`[Webcam ${cameraId}] 🔌 Connecting to SocketIO detector...`);

      // Determine the Socket.IO URL from an environment variable so the deployed frontend
      // can connect to the server running in Railway. In development this falls back to
      // the local detector on port 5001.
      const WS_URL =
        process.env.REACT_APP_WS_URL && process.env.REACT_APP_WS_URL.length > 0
          ? process.env.REACT_APP_WS_URL
          : "http://localhost:5001";

      console.log(`[Webcam ${cameraId}] 🌐 WebSocket URL: ${WS_URL}`);

      const socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 3000,
      });

      socket.on("connect", () => {
        console.log(`[Webcam ${cameraId}] ✅ SocketIO connected!`);

        // Register camera
        socket.emit("register_camera", {
          cameraId: cameraId,
        });
      });

      socket.on("camera_registered", (data: any) => {
        console.log(`[Webcam ${cameraId}] 📹 Camera registered:`, data);
      });

      socket.on("detection_result", async (data) => {
        if (!data?.detection?.is_valid) {
          clearOverlay();
          return;
        }

        drawDetectionOverlay(data.detection);

        const plate = data.detection.text;
        const confidence = data.detection.confidence;

        setLastDetection({
          success: true,
          plate_number: plate,
          confidence,
        });

        onDetection?.(plate, confidence);

        setTimeout(() => {
          setLastDetection(null);
          clearOverlay();
        }, 7000);
      });

      socket.on("detection_error", (data: any) => {
        console.error(`[Webcam ${cameraId}] ❌ Detection error:`, data);
      });

      socket.on("disconnect", () => {
        console.log(`[Webcam ${cameraId}] 🔌 SocketIO disconnected`);
      });

      socket.on("connect_error", (error) => {
        console.error(
          `[Webcam ${cameraId}] ❌ SocketIO connection error:`,
          error
        );
      });

      socketRef.current = socket;
    };

    const initializeWebcam = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request access to webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment", // Use back camera on mobile if available
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Set connected immediately after stream assigned
          console.log(
            `[Webcam ${cameraId}] ✅ Stream assigned to video element`
          );

          videoRef.current.onloadedmetadata = async () => {
            console.log(`[Webcam ${cameraId}] 📹 Video metadata loaded`);
            try {
              await videoRef.current?.play();
              console.log(`[Webcam ${cameraId}] ▶️ Video playing`);
              setIsLoading(false);

              // CRITICAL FIX: Set both state AND ref
              isConnectedRef.current = true;

              console.log(
                `[Webcam ${cameraId}] 🟢 Connection state & ref set to TRUE`
              );

              // Initialize WebSocket FIRST
              initializeWebSocket();

              // Start detection after WebSocket ready
              setTimeout(() => {
                console.log(
                  `[Webcam ${cameraId}] 🚀 Starting detection (ref=${isConnectedRef.current})`
                );
                startPlateDetection();
              }, 1000); // Wait 1s for WebSocket connection
            } catch (playError) {
              console.error(
                `[Webcam ${cameraId}] ❌ Failed to play video:`,
                playError
              );
              setError("Không thể phát video từ webcam");
              setIsLoading(false);
            }
          };

          // Fallback: Set timeout to check if metadata loaded
          setTimeout(() => {
            const readyState = videoRef.current?.readyState || 0;
            if (!isConnectedRef.current && readyState >= 2) {
              console.log(
                `[Webcam ${cameraId}] ⚡ Forcing connection (readyState: ${readyState})`
              );
              setIsLoading(false);
              isConnectedRef.current = true;
              initializeWebSocket();
              startPlateDetection();
            }
          }, 3000);
        }
      } catch (err: any) {
        console.error("Webcam error:", err);
        let errorMsg = "Không thể truy cập webcam";

        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMsg = "Vui lòng cấp quyền truy cập webcam";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMsg = "Không tìm thấy webcam";
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          errorMsg = "Webcam đang được sử dụng bởi ứng dụng khác";
        } else if (
          err.name === "OverconstrainedError" ||
          err.name === "ConstraintNotSatisfiedError"
        ) {
          errorMsg = "Webcam không hỗ trợ cấu hình yêu cầu";
        }

        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    initializeWebcam();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [cameraId, onError]);

  // Draw detection overlay on canvas
  const drawDetectionOverlay = (detection: any) => {
    if (!overlayCanvasRef.current || !videoRef.current || !canvasRef.current)
      return;

    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const captureCanvas = canvasRef.current;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;

    // Match overlay canvas size to video display size
    const rect = video.getBoundingClientRect();
    overlayCanvas.width = rect.width;
    overlayCanvas.height = rect.height;

    // CRITICAL FIX: Bbox coordinates are from RESIZED FRAME (captureCanvas size)
    // Need to scale from captureCanvas -> original video -> display size
    const captureWidth = captureCanvas.width;
    const captureHeight = captureCanvas.height;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate scale: captureCanvas -> originalVideo
    const captureToVideoScaleX = videoWidth / captureWidth;
    const captureToVideoScaleY = videoHeight / captureHeight;

    // Calculate scale: originalVideo -> displaySize
    const videoToDisplayScaleX = rect.width / videoWidth;
    const videoToDisplayScaleY = rect.height / videoHeight;

    // Combined scale: captureCanvas -> displaySize
    const totalScaleX = captureToVideoScaleX * videoToDisplayScaleX;
    const totalScaleY = captureToVideoScaleY * videoToDisplayScaleY;

    // Clear canvas
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw bounding box ONLY (no text label)
    const bbox = detection.bbox;
    if (bbox && bbox.length === 4) {
      const [x1, y1, x2, y2] = bbox;
      const x = x1 * totalScaleX;
      const y = y1 * totalScaleY;
      const w = (x2 - x1) * totalScaleX;
      const h = (y2 - y1) * totalScaleY;

      // Draw green box only - no text overlay
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
  };

  // Clear overlay canvas
  const clearOverlay = () => {
    if (!overlayCanvasRef.current) return;
    const ctx = overlayCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(
      0,
      0,
      overlayCanvasRef.current.width,
      overlayCanvasRef.current.height
    );
  };

  // Capture frame from video and convert to base64
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // OPTIMIZE: Resize to max 800x600 to reduce payload size
    const maxWidth = 800;
    const maxHeight = 600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    // Calculate scaling to fit within max dimensions
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);

    canvas.width = width;
    canvas.height = height;

    // Draw current video frame to canvas with scaling
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    // Convert to base64 with quality 0.7 (lower = smaller file)
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  // SocketIO connection (REALTIME - NO BLOCKING!)
  const socketRef = useRef<Socket | null>(null);

  // Send frame via SocketIO for REALTIME detection
  const detectPlate = async () => {
    // CRITICAL: Check ref instead of state for immediate value
    if (!isConnectedRef.current) {
      console.log(
        `[Webcam ${cameraId}] ⚠️ Not connected (ref=${isConnectedRef.current}), skipping detection`
      );
      return;
    }

    // Check SocketIO connection
    if (!socketRef.current || !socketRef.current.connected) {
      console.log(
        `[Webcam ${cameraId}] ⚠️ SocketIO not connected, skipping detection`
      );
      return;
    }

    const frameBase64 = captureFrame();
    if (!frameBase64) {
      console.log(`[Webcam ${cameraId}] ❌ Failed to capture frame`);
      return;
    }

    console.log(
      `[Webcam ${cameraId}] 📸 Captured frame, sending via SocketIO...`
    );

    try {
      // Send frame via SocketIO event (NON-BLOCKING!)
      socketRef.current.emit("video_frame", {
        cameraId: cameraId,
        frame: frameBase64,
        timestamp: Date.now(),
      });
      console.log(`[Webcam ${cameraId}] ✅ Frame sent via SocketIO`);
    } catch (error) {
      console.error(`[Webcam ${cameraId}] ❌ SocketIO send error:`, error);
    }
  };

  // Start continuous plate detection via WebSocket
  const startPlateDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    console.log(
      `[Webcam ${cameraId}] ⚡ Starting REALTIME WebSocket detection...`
    );

    // Run first detection immediately
    const video = videoRef.current;
    if (!video) return;

    const loop = () => {
      detectPlate();
      video.requestVideoFrameCallback(loop);
    };

    video.requestVideoFrameCallback(loop);
    console.log(
      `[Webcam ${cameraId}] ✅ REALTIME detection started (1s interval via WebSocket)`
    );
  };

  if (error) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-white text-sm font-medium">{error}</p>
          <p className="text-gray-400 text-xs mt-2">
            Kiểm tra lại quyền truy cập webcam trong trình duyệt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-2"></div>
            <p className="text-white text-sm">Đang khởi động webcam...</p>
          </div>
        </div>
      )}

      {/* ALWAYS show video (REALTIME STREAM) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        className="w-full h-full object-contain"
      />

      {/* Overlay canvas for drawing detection boxes (REALTIME OVERLAY) */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        style={{ display: isLoading ? "none" : "block" }}
      />

      {/* Status indicators removed per user request */}

      {/* Detection result badge with status message */}
      {lastDetection &&
        lastDetection.plate_number &&
        (() => {
          // Xác định màu sắc và trạng thái dựa trên database response
          const db = lastDetection.database;
          let bgColor = "bg-green-600";
          let borderColor = "border-green-400";
          let statusText = "";
          let statusIcon = <CheckCircle className="w-5 h-5 text-white" />;

          if (db) {
            // Xe chưa đăng ký
            if (db.registered === false) {
              bgColor = "bg-red-600";
              borderColor = "border-red-400";
              statusText = db.status_message || "Chưa đăng ký xe";
              statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
            }
            // Xe đã đăng ký - kiểm tra trạng thái thanh toán (camera Ra)
            else if (db.payment_status === "insufficient") {
              bgColor = "bg-yellow-600";
              borderColor = "border-yellow-400";
              statusText = db.status_message || "Số dư không đủ";
              statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
            }
            // Xe đã đăng ký - có status_message từ backend
            else if (db.status_message) {
              // Check-in thành công (camera Vào)
              if (
                db.status_message.includes("Check-in") ||
                db.status_message.includes("thành công")
              ) {
                bgColor = "bg-green-600";
                borderColor = "border-green-400";
                statusText = db.status_message;
              }
              // Đã thanh toán (camera Ra)
              else if (
                db.status_message.includes("thanh toán") ||
                db.status_message.includes("Đã thanh toán")
              ) {
                bgColor = "bg-green-600";
                borderColor = "border-green-400";
                statusText = db.status_message;
              }
              // Xe chưa check-in (camera Ra)
              else if (db.status_message.includes("chưa check-in")) {
                bgColor = "bg-red-600";
                borderColor = "border-red-400";
                statusText = db.status_message;
                statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
              }
              // Xe đã đang gửi (camera Vào)
              else if (db.status_message.includes("đang gửi")) {
                bgColor = "bg-yellow-600";
                borderColor = "border-yellow-400";
                statusText = db.status_message;
                statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
              }
              // Mặc định
              else {
                statusText = db.status_message;
              }
            }
            // Xe đã đăng ký nhưng không có status_message - dựa vào camera type
            else if (cameraType === "Vào" || cameraType === "Vao") {
              statusText = "Đang xử lý check-in...";
            } else if (cameraType === "Ra") {
              statusText = "Đang xử lý checkout...";
            }
          } else {
            // Không có database response - hiển thị dựa vào camera type
            if (cameraType === "Vào" || cameraType === "Vao") {
              statusText = "Đang kiểm tra...";
            } else if (cameraType === "Ra") {
              statusText = "Đang kiểm tra...";
            }
          }

          return (
            <div
              className={`absolute top-2 right-2 px-4 py-3 rounded-lg shadow-xl animate-fade-in border-2 ${bgColor} bg-opacity-95 ${borderColor} z-50`}
            >
              <div className="flex items-center space-x-2">
                {statusIcon}
                <div>
                  <div className="text-white font-bold text-lg">
                    {lastDetection.plate_number}
                  </div>
                  {statusText && (
                    <div className="text-white text-sm font-semibold mt-1 whitespace-nowrap">
                      {statusText}
                    </div>
                  )}
                  <div className="text-white text-xs opacity-90 mt-1">
                    Độ chính xác:{" "}
                    {((lastDetection.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Camera info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        <div className="space-y-2">
          {/* Camera name - moved to top */}
          <div className="flex items-center space-x-2 text-white">
            <Camera className="w-5 h-5" />
            <div className="text-base font-medium">{name}</div>
            <span className="text-sm opacity-75">Webcam • AI Detection</span>
          </div>

          {/* Detected plate number - below camera name */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-300">
              Biển số nhận dạng:
            </span>
            {lastDetection && lastDetection.plate_number ? (
              <span className="text-lg font-bold text-green-400">
                {lastDetection.plate_number}
              </span>
            ) : (
              <span className="text-sm text-gray-500 italic">
                Chưa phát hiện
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
