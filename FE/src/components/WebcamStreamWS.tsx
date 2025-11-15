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
    const [statusMessage, setStatusMessage] = useState<{
        text: string;
        type: 'success' | 'error' | 'info';
        plateNumber?: string;
    } | null>(null);
    
    // Refs for intervals
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                    
                    // ✨ AUTO-SAVE TO DATABASE - REALTIME!
                    handlePlateDetected(result.detection.text);
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
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
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

        // Stream frames every 200ms (5fps) - tối ưu cho realtime với OCR
        // OCR rất nặng nên giảm FPS để tránh lag
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
        }, 200); // 5fps - tối ưu cho OCR processing

        console.log(`[Camera ${cameraId}] ✅ Frame streaming started (5fps - optimized for OCR)`);
    };

    // Handle plate detected - save to database with debounce
    const lastSavedPlateRef = useRef<string>('');
    const lastSavedTimeRef = useRef<number>(0);
    
    const handlePlateDetected = async (plateNumber: string) => {
        const now = Date.now();
        const DEBOUNCE_TIME = 3000; // 3 seconds - tránh lưu trùng
        
        // Skip if same plate detected within 3 seconds
        if (lastSavedPlateRef.current === plateNumber && (now - lastSavedTimeRef.current) < DEBOUNCE_TIME) {
            return;
        }
        
        try {
            console.log(`[Camera ${cameraId}] 💾 Saving to database: ${plateNumber}`);
            
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/ml/check-vehicle-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plate_number: plateNumber,
                    camera_id: cameraId
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.database) {
                console.log(`[Camera ${cameraId}] ✅ Database saved:`, result.database.status_message);
                
                // Update last saved
                lastSavedPlateRef.current = plateNumber;
                lastSavedTimeRef.current = now;
                
                // Show status message for 2 seconds
                const statusType = result.database.status_message.includes('thành công') || 
                                 result.database.status_message.includes('thanh toán') ? 'success' : 
                                 result.database.status_message.includes('không đủ') || 
                                 result.database.status_message.includes('chưa') ? 'error' : 'info';
                
                setStatusMessage({
                    text: result.database.status_message,
                    type: statusType,
                    plateNumber: plateNumber
                });
                
                // Clear status after 2 seconds
                if (statusTimeoutRef.current) {
                    clearTimeout(statusTimeoutRef.current);
                }
                statusTimeoutRef.current = setTimeout(() => {
                    setStatusMessage(null);
                }, 2000);
            } else {
                console.error(`[Camera ${cameraId}] ❌ Database save failed:`, result.error);
                setStatusMessage({
                    text: 'Lỗi lưu dữ liệu',
                    type: 'error'
                });
                setTimeout(() => setStatusMessage(null), 2000);
            }
        } catch (error) {
            console.error(`[Camera ${cameraId}] ❌ Error saving to database:`, error);
            setStatusMessage({
                text: 'Lỗi kết nối',
                type: 'error'
            });
            setTimeout(() => setStatusMessage(null), 2000);
        }
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

            {/* Status indicators - Left column (stacked vertically) */}
            <div className="absolute top-2 left-2 flex flex-col space-y-2">
                {/* Detection status only */}
                <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                    <ScanLine className={`w-5 h-5 ${annotatedFrame ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-white">
                        {annotatedFrame ? 'Đang quét...' : 'Sẵn sàng'}
                    </span>
                </div>
            </div>

            {/* Status indicators - Right column (stacked vertically) */}
            <div className="absolute top-2 right-2 flex flex-col space-y-2">
                {/* WebSocket status */}
                <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                    {wsConnected ? (
                        <>
                            <Wifi className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-green-500">WebSocket</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-red-500">Offline</span>
                        </>
                    )}
                </div>

                {/* FPS counter */}
                {fps > 0 && (
                    <div className="bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium text-cyan-400">FPS: {fps.toFixed(1)}</span>
                    </div>
                )}
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

            {/* Status Message Overlay - Check-in/Check-out Success */}
            {statusMessage && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
                    <div className={`px-8 py-6 rounded-2xl shadow-2xl animate-fade-in border-4 ${
                        statusMessage.type === 'success' ? 'bg-green-600 border-green-400' :
                        statusMessage.type === 'error' ? 'bg-red-600 border-red-400' :
                        'bg-blue-600 border-blue-400'
                    }`}>
                        <div className="flex flex-col items-center space-y-3">
                            {statusMessage.type === 'success' ? (
                                <CheckCircle className="w-16 h-16 text-white" />
                            ) : (
                                <AlertCircle className="w-16 h-16 text-white" />
                            )}
                            {statusMessage.plateNumber && (
                                <div className="text-white font-bold text-3xl">
                                    {statusMessage.plateNumber}
                                </div>
                            )}
                            <div className="text-white font-semibold text-xl text-center">
                                {statusMessage.text}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom: Camera info + Stats + Detected Plate */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="space-y-2">
                    {/* Camera name and stats row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-white">
                            <Camera className="w-5 h-5" />
                            <div className="text-base font-medium">{name}</div>
                            <span className="text-sm opacity-75">AI Detection (WS)</span>
                        </div>
                        
                        {/* Stats */}
                        {stats && (
                            <div className="text-sm text-white opacity-75">
                                Frames: {stats.total_frames} | Detections: {stats.total_detections}
                            </div>
                        )}
                    </div>
                    
                    {/* Detected plate number */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-300">Biển số nhận dạng:</span>
                        {lastDetection && lastDetection.is_valid ? (
                            <span className="text-lg font-bold text-green-400">
                                {lastDetection.text}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-500 italic">Chưa phát hiện</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
