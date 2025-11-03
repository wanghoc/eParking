import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, ScanLine } from 'lucide-react';
import { apiUrl } from '../api';
import { io, Socket } from 'socket.io-client';

interface WebcamStreamProps {
    cameraId: number;
    name: string;
    onError?: (error: string) => void;
    onDetection?: (plateNumber: string, confidence: number) => void; // NEW: Callback for detected plates
}

interface DetectionResult {
    success: boolean;
    plate_number?: string;
    confidence?: number;
    message?: string;
    annotated_image_base64?: string;
}

export function WebcamStream({
    cameraId,
    name,
    onError,
    onDetection
}: WebcamStreamProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isConnectedRef = useRef<boolean>(false); // CRITICAL: Use ref for immediate access
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

        // Initialize SocketIO connection
        const initializeWebSocket = () => {
            console.log(`[Webcam ${cameraId}] 🔌 Connecting to SocketIO detector...`);
            
            // SocketIO URL - port 5001 for detector
            const socket = io('http://localhost:5001', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 3000
            });
            
            socket.on('connect', () => {
                console.log(`[Webcam ${cameraId}] ✅ SocketIO connected!`);
                
                // Register camera
                socket.emit('register_camera', {
                    cameraId: cameraId
                });
            });
            
            socket.on('camera_registered', (data: any) => {
                console.log(`[Webcam ${cameraId}] 📹 Camera registered:`, data);
            });
            
            socket.on('detection_result', (data: any) => {
                try {
                    console.log(`[Webcam ${cameraId}] 📦 Detection result:`, data);
                    
                    // Got detection result!
                    setIsDetecting(false);
                    
                    // REALTIME: Draw overlay on canvas
                    if (data.detection && data.detection.is_valid) {
                        console.log(`[Webcam ${cameraId}] 🎯 DETECTED:`, data.detection.text);
                        
                        // Update detection state for badge
                        setLastDetection({
                            success: true,
                            plate_number: data.detection.text,
                            confidence: data.detection.confidence
                        });
                        
                        // Callback to parent component (for AdminDashboard)
                        if (onDetection) {
                            onDetection(data.detection.text, data.detection.confidence);
                        }
                        
                        // Draw bounding box on overlay canvas
                        drawDetectionOverlay(data.detection);
                        
                        // Clear after 3s
                        setTimeout(() => {
                            setLastDetection(null);
                            clearOverlay();
                        }, 3000);
                    } else if (data.detection === null) {
                        // No plate detected - clear overlay
                        clearOverlay();
                    }
                } catch (error) {
                    console.error(`[Webcam ${cameraId}] ❌ Detection result parse error:`, error);
                }
            });
            
            socket.on('detection_error', (data: any) => {
                console.error(`[Webcam ${cameraId}] ❌ Detection error:`, data);
                setIsDetecting(false);
            });
            
            socket.on('disconnect', () => {
                console.log(`[Webcam ${cameraId}] 🔌 SocketIO disconnected`);
            });
            
            socket.on('connect_error', (error) => {
                console.error(`[Webcam ${cameraId}] ❌ SocketIO connection error:`, error);
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
                        facingMode: 'environment' // Use back camera on mobile if available
                    },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    
                    // Set connected immediately after stream assigned
                    console.log(`[Webcam ${cameraId}] ✅ Stream assigned to video element`);
                    
                    videoRef.current.onloadedmetadata = async () => {
                        console.log(`[Webcam ${cameraId}] 📹 Video metadata loaded`);
                        try {
                            await videoRef.current?.play();
                            console.log(`[Webcam ${cameraId}] ▶️ Video playing`);
                            setIsLoading(false);
                            
                            // CRITICAL FIX: Set both state AND ref
                            setIsConnected(true);
                            isConnectedRef.current = true;
                            
                            console.log(`[Webcam ${cameraId}] 🟢 Connection state & ref set to TRUE`);
                            
                            // Initialize WebSocket FIRST
                            initializeWebSocket();
                            
                            // Start detection after WebSocket ready
                            setTimeout(() => {
                                console.log(`[Webcam ${cameraId}] 🚀 Starting detection (ref=${isConnectedRef.current})`);
                                startPlateDetection();
                            }, 1000); // Wait 1s for WebSocket connection
                        } catch (playError) {
                            console.error(`[Webcam ${cameraId}] ❌ Failed to play video:`, playError);
                            setError('Không thể phát video từ webcam');
                            setIsLoading(false);
                        }
                    };
                    
                    // Fallback: Set timeout to check if metadata loaded
                    setTimeout(() => {
                        const readyState = videoRef.current?.readyState || 0;
                        if (!isConnectedRef.current && readyState >= 2) {
                            console.log(`[Webcam ${cameraId}] ⚡ Forcing connection (readyState: ${readyState})`);
                            setIsLoading(false);
                            setIsConnected(true);
                            isConnectedRef.current = true;
                            initializeWebSocket();
                            startPlateDetection();
                        }
                    }, 3000);
                }
            } catch (err: any) {
                console.error('Webcam error:', err);
                let errorMsg = 'Không thể truy cập webcam';
                
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMsg = 'Vui lòng cấp quyền truy cập webcam';
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMsg = 'Không tìm thấy webcam';
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    errorMsg = 'Webcam đang được sử dụng bởi ứng dụng khác';
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    errorMsg = 'Webcam không hỗ trợ cấu hình yêu cầu';
                }

                setError(errorMsg);
                setIsLoading(false);
                setIsConnected(false);
                onError?.(errorMsg);
            }
        };

        initializeWebcam();

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
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
        if (!overlayCanvasRef.current || !videoRef.current || !canvasRef.current) return;
        
        const overlayCanvas = overlayCanvasRef.current;
        const video = videoRef.current;
        const captureCanvas = canvasRef.current;
        const ctx = overlayCanvas.getContext('2d');
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
        
        // Draw bounding box
        const bbox = detection.bbox;
        if (bbox && bbox.length === 4) {
            const [x1, y1, x2, y2] = bbox;
            const x = x1 * totalScaleX;
            const y = y1 * totalScaleY;
            const w = (x2 - x1) * totalScaleX;
            const h = (y2 - y1) * totalScaleY;
            
            // Draw green box
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            
            // Draw label background
            ctx.fillStyle = '#00FF00';
            const text = detection.text || 'License Plate';
            const confText = `${(detection.confidence * 100).toFixed(1)}%`;
            const fontSize = 16;
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            const textWidth = Math.max(ctx.measureText(text).width, ctx.measureText(confText).width);
            const padding = 10;
            const boxHeight = fontSize * 2 + padding * 2;
            
            ctx.fillRect(x, y - boxHeight, textWidth + padding * 2, boxHeight);
            
            // Draw text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + padding, y - fontSize - padding);
            ctx.fillText(confText, x + padding, y - padding);
        }
    };
    
    // Clear overlay canvas
    const clearOverlay = () => {
        if (!overlayCanvasRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
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
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert to base64 with quality 0.7 (lower = smaller file)
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    // SocketIO connection (REALTIME - NO BLOCKING!)
    const socketRef = useRef<Socket | null>(null);

    // Send frame via SocketIO for REALTIME detection
    const detectPlate = async () => {
        if (isDetecting) {
            console.log(`[Webcam ${cameraId}] ⏳ Already detecting, skipping...`);
            return;
        }
        
        // CRITICAL: Check ref instead of state for immediate value
        if (!isConnectedRef.current) {
            console.log(`[Webcam ${cameraId}] ⚠️ Not connected (ref=${isConnectedRef.current}), skipping detection`);
            return;
        }

        // Check SocketIO connection
        if (!socketRef.current || !socketRef.current.connected) {
            console.log(`[Webcam ${cameraId}] ⚠️ SocketIO not connected, skipping detection`);
            return;
        }

        const frameBase64 = captureFrame();
        if (!frameBase64) {
            console.log(`[Webcam ${cameraId}] ❌ Failed to capture frame`);
            return;
        }

        console.log(`[Webcam ${cameraId}] 📸 Captured frame, sending via SocketIO...`);
        setIsDetecting(true);

        try {
            // Send frame via SocketIO event (NON-BLOCKING!)
            socketRef.current.emit('video_frame', {
                cameraId: cameraId,
                frame: frameBase64,
                timestamp: Date.now()
            });
            console.log(`[Webcam ${cameraId}] ✅ Frame sent via SocketIO`);
        } catch (error) {
            console.error(`[Webcam ${cameraId}] ❌ SocketIO send error:`, error);
            setIsDetecting(false);
        }
    };

    // Start continuous plate detection via WebSocket
    const startPlateDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        console.log(`[Webcam ${cameraId}] ⚡ Starting REALTIME WebSocket detection...`);

        // Run first detection immediately
        detectPlate();

        // Detect every 500ms for TRUE REALTIME (WebSocket is non-blocking!)
        detectionIntervalRef.current = setInterval(() => {
            console.log(`[Webcam ${cameraId}] 🔄 Sending frame via WebSocket...`);
            detectPlate();
        }, 500); // 500ms = 2 FPS detection rate

        console.log(`[Webcam ${cameraId}] ✅ REALTIME detection started (500ms interval via WebSocket)`);
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
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
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
                className="w-full h-full object-contain"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
            
            {/* Overlay canvas for drawing detection boxes (REALTIME OVERLAY) */}
            <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                style={{ display: isLoading ? 'none' : 'block' }}
            />

            {/* Connection status indicator */}
            <div className="absolute top-2 right-2 flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                {isConnected ? (
                    <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500">Webcam Online</span>
                    </>
                ) : (
                    <>
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-yellow-500">Connecting...</span>
                    </>
                )}
            </div>

            {/* Detection status indicator */}
            {isConnected && (
                <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                    <ScanLine className={`w-4 h-4 ${isDetecting ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                    <span className="text-xs text-white">
                        {isDetecting ? 'Đang quét...' : 'Sẵn sàng'}
                    </span>
                </div>
            )}

            {/* Detection result badge - minimal để không che khuất annotated image */}
            {lastDetection && lastDetection.plate_number && (
                <div className="absolute top-12 right-2 bg-green-600 bg-opacity-95 px-3 py-2 rounded-lg shadow-xl animate-fade-in border-2 border-green-400">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                        <div>
                            <div className="text-white font-bold text-base">{lastDetection.plate_number}</div>
                            <div className="text-white text-xs opacity-90">
                                {((lastDetection.confidence || 0) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <div className="flex items-center space-x-2 text-white">
                    <Camera className="w-4 h-4" />
                    <div className="text-sm font-medium">{name}</div>
                    <span className="text-xs opacity-75">Webcam • AI Detection</span>
                </div>
            </div>
        </div>
    );
}

