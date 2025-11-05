/**
 * WebSocket Realtime License Plate Detection Component
 * 
 * Giống y hệt project test - STREAMING detection với PERSISTENT detector
 * 
 * Architecture:
 * - Frontend: Capture frames từ webcam
 * - Send qua WebSocket đến backend
 * - Backend: Process với YOLO + EasyOCR (loaded 1 lần duy nhất!)
 * - Receive annotated frames realtime
 * - Display video with detection overlay
 */

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, ScanLine, Wifi, WifiOff } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface WebcamStreamWSProps {
    cameraId: number;
    name: string;
    onError?: (error: string) => void;
}

interface DetectionInfo {
    text: string;
    confidence: number;
    is_valid: boolean;
    bbox: [number, number, number, number];
    fps: number;
}

interface DetectionResult {
    cameraId: string;
    timestamp: number;
    annotated_frame: string;
    detection: DetectionInfo | null;
    stats: {
        total_frames: number;
        total_detections: number;
        runtime_seconds: number;
        avg_fps: number;
    };
}

export function WebcamStreamWS({
    cameraId,
    name,
    onError
}: WebcamStreamWSProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);
    
    // States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [lastDetection, setLastDetection] = useState<DetectionInfo | null>(null);
    const [annotatedFrame, setAnnotatedFrame] = useState<string | null>(null);
    const [stats, setStats] = useState<DetectionResult['stats'] | null>(null);
    const [fps, setFps] = useState<number>(0);
    
    // Refs for intervals
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // WebSocket URL - auto-detect from current window location
    const getWebSocketURL = () => {
            const envUrl = process.env.REACT_APP_WS_URL;
    if (envUrl && envUrl.length > 0) {
      return envUrl;
    }
        // If accessing via localhost/127.0.0.1, use localhost:5001
        // Otherwise use current hostname with port 5001
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5001';
        }
        return `http://${hostname}:5001`;
    };
    const WS_URL = getWebSocketURL();

    // Initialize WebSocket connection
    useEffect(() => {
        console.log(`[Camera ${cameraId}] 🔌 Connecting to WebSocket server...`);
        
        const socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log(`[Camera ${cameraId}] ✅ WebSocket connected: ${socket.id}`);
            setWsConnected(true);
            
            // Register camera
            socket.emit('register_camera', { cameraId: `camera_${cameraId}` });
        });

        socket.on('disconnect', () => {
            console.log(`[Camera ${cameraId}] ❌ WebSocket disconnected`);
            setWsConnected(false);
        });

        socket.on('connection_response', (data: any) => {
            console.log(`[Camera ${cameraId}] 📡 Connection response:`, data);
        });

        socket.on('camera_registered', (data: any) => {
            console.log(`[Camera ${cameraId}] 📹 Camera registered:`, data);
        });

        // Detection result handler
        socket.on('detection_result', (result: DetectionResult) => {
            // Update annotated frame
            setAnnotatedFrame(result.annotated_frame);
            
            // Update stats
            setStats(result.stats);
            
            // Update detection info
            if (result.detection) {
                setLastDetection(result.detection);
                setFps(result.detection.fps);
                
                // Log if valid plate detected
                if (result.detection.is_valid) {
                    console.log(`[Camera ${cameraId}] 🎯 DETECTED: ${result.detection.text} ` +
                               `(Conf: ${(result.detection.confidence * 100).toFixed(1)}%, FPS: ${result.detection.fps.toFixed(1)})`);
                }
                
                // Clear detection after 3 seconds if no new detection
                if (detectionTimeoutRef.current) {
                    clearTimeout(detectionTimeoutRef.current);
                }
                
                detectionTimeoutRef.current = setTimeout(() => {
                    setLastDetection(null);
                }, 3000);
            } else {
                // No detection in this frame
                setLastDetection(null);
            }
        });

        socket.on('detection_error', (error: any) => {
            console.error(`[Camera ${cameraId}] ❌ Detection error:`, error);
        });

        // Cleanup
        return () => {
            console.log(`[Camera ${cameraId}] 🔌 Disconnecting WebSocket...`);
            socket.disconnect();
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
            }
            if (detectionTimeoutRef.current) {
                clearTimeout(detectionTimeoutRef.current);
            }
        };
    }, [cameraId]);

    // Initialize webcam
    useEffect(() => {
        let stream: MediaStream | null = null;

        const initializeWebcam = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log(`[Camera ${cameraId}] 📹 Requesting webcam access...`);

                // Request webcam access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment'
                    },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    
                    videoRef.current.onloadedmetadata = async () => {
                        console.log(`[Camera ${cameraId}] 📹 Video metadata loaded`);
                        try {
                            await videoRef.current?.play();
                            console.log(`[Camera ${cameraId}] ▶️ Video playing`);
                            setIsLoading(false);
                            setIsConnected(true);
                            
                            // Start streaming frames after video is playing
                            setTimeout(() => {
                                startFrameStreaming();
                            }, 500);
                        } catch (playError) {
                            console.error(`[Camera ${cameraId}] ❌ Failed to play video:`, playError);
                            setError('Không thể phát video từ webcam');
                            setIsLoading(false);
                        }
                    };
                }
            } catch (err: any) {
                console.error(`[Camera ${cameraId}] ❌ Webcam error:`, err);
                let errorMsg = 'Không thể truy cập webcam';
                
                if (err.name === 'NotAllowedError') {
                    errorMsg = 'Vui lòng cấp quyền truy cập webcam';
                } else if (err.name === 'NotFoundError') {
                    errorMsg = 'Không tìm thấy webcam';
                } else if (err.name === 'NotReadableError') {
                    errorMsg = 'Webcam đang được sử dụng';
                }

                setError(errorMsg);
                setIsLoading(false);
                onError?.(errorMsg);
            }
        };

        initializeWebcam();

        // Cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [cameraId, onError]);

    // Capture frame from video
    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Optimize: resize to max 800x600
        const maxWidth = 800;
        const maxHeight = 600;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert to base64 JPEG
        return canvas.toDataURL('image/jpeg', 0.7);
    };

    // Stream frames to WebSocket server
    const startFrameStreaming = () => {
        if (!socketRef.current || !isConnected) {
            console.log(`[Camera ${cameraId}] ⚠️ Cannot start streaming: socket or video not ready`);
            return;
        }

        console.log(`[Camera ${cameraId}] 🚀 Starting frame streaming...`);

        // Stream frames every 100ms (10fps) - điều chỉnh cho realtime
        // Có thể tăng frequency nếu backend handle được
        streamIntervalRef.current = setInterval(() => {
            if (!wsConnected || !isConnected) {
                return;
            }

            const frameData = captureFrame();
            if (!frameData || !socketRef.current) {
                return;
            }

            // Send frame to backend via WebSocket
            socketRef.current.emit('video_frame', {
                cameraId: `camera_${cameraId}`,
                frame: frameData,
                timestamp: Date.now()
            });
        }, 100); // 10fps - có thể điều chỉnh: 50ms = 20fps, 33ms = 30fps

        console.log(`[Camera ${cameraId}] ✅ Frame streaming started (10fps)`);
    };

    // Error display
    if (error) {
        return (
            <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">{error}</p>
                    <p className="text-gray-400 text-xs mt-2">
                        Kiểm tra lại quyền truy cập webcam
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-gray-900">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                        <p className="text-white text-sm">Đang khởi động webcam...</p>
                    </div>
                </div>
            )}
            
            {/* Display: Annotated frame (if available) OR raw video */}
            {annotatedFrame ? (
                <img
                    src={annotatedFrame}
                    alt="Detection result"
                    className="w-full h-full object-contain"
                    style={{ display: isLoading ? 'none' : 'block' }}
                />
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                    style={{ display: isLoading ? 'none' : 'block' }}
                />
            )}

            {/* Top-right: Status indicators */}
            <div className="absolute top-2 right-2 space-y-2">
                {/* Webcam status */}
                <div className="flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                    {isConnected ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500">Webcam</span>
                        </>
                    ) : (
                        <>
                            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-yellow-500">Connecting</span>
                        </>
                    )}
                </div>

                {/* WebSocket status */}
                <div className="flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                    {wsConnected ? (
                        <>
                            <Wifi className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500">WS</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-500">WS</span>
                        </>
                    )}
                </div>

                {/* FPS counter */}
                {fps > 0 && (
                    <div className="bg-black bg-opacity-60 px-2 py-1 rounded">
                        <span className="text-xs text-cyan-400">FPS: {fps.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Top-left: Detection status */}
            <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                <ScanLine className={`w-4 h-4 ${annotatedFrame ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-xs text-white">
                    {annotatedFrame ? 'Đang quét...' : 'Sẵn sàng'}
                </span>
            </div>

            {/* Detection result badge */}
            {lastDetection && lastDetection.is_valid && (
                <div className="absolute top-16 right-2 bg-green-600 bg-opacity-95 px-3 py-2 rounded-lg shadow-xl animate-fade-in border-2 border-green-400">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                        <div>
                            <div className="text-white font-bold text-base">{lastDetection.text}</div>
                            <div className="text-white text-xs opacity-90">
                                {(lastDetection.confidence * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom: Camera info + Stats */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white">
                        <Camera className="w-4 h-4" />
                        <div className="text-sm font-medium">{name}</div>
                        <span className="text-xs opacity-75">AI Detection (WS)</span>
                    </div>
                    
                    {/* Stats */}
                    {stats && (
                        <div className="text-xs text-white opacity-75">
                            Frames: {stats.total_frames} | Detections: {stats.total_detections}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
