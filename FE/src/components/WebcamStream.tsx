import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, ScanLine } from 'lucide-react';
import { apiUrl } from '../api';

interface WebcamStreamProps {
    cameraId: number;
    name: string;
    onError?: (error: string) => void;
}

interface DetectionResult {
    success: boolean;
    plate_number?: string;
    confidence?: number;
    message?: string;
}

export function WebcamStream({
    cameraId,
    name,
    onError
}: WebcamStreamProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

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
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsLoading(false);
                        setIsConnected(true);
                        
                        // Start plate detection after 2 seconds
                        setTimeout(() => {
                            startPlateDetection();
                        }, 2000);
                    };
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
        };
    }, [cameraId, onError]);

    // Capture frame from video and convert to base64
    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    // Send frame to backend for plate detection
    const detectPlate = async () => {
        if (isDetecting || !isConnected) return;

        const frameBase64 = captureFrame();
        if (!frameBase64) return;

        setIsDetecting(true);

        try {
            const response = await fetch(apiUrl('/ml/detect-plate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_base64: frameBase64,
                    camera_id: cameraId
                })
            });

            if (response.ok) {
                const result: DetectionResult = await response.json();
                
                if (result.success && result.plate_number) {
                    console.log(`[Webcam ${cameraId}] Detected plate:`, result.plate_number, `(${(result.confidence! * 100).toFixed(1)}%)`);
                    setLastDetection(result);
                    
                    // Clear detection after 5 seconds
                    setTimeout(() => {
                        setLastDetection(null);
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('[Webcam] Detection error:', error);
        } finally {
            setIsDetecting(false);
        }
    };

    // Start continuous plate detection
    const startPlateDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        // Detect every 2 seconds
        detectionIntervalRef.current = setInterval(() => {
            detectPlate();
        }, 2000);

        console.log(`[Webcam ${cameraId}] Started plate detection`);
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
            
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
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

            {/* Detection result overlay */}
            {lastDetection && lastDetection.plate_number && (
                <div className="absolute top-14 left-2 right-2 bg-green-600 bg-opacity-90 px-3 py-2 rounded shadow-lg animate-fade-in">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                        <div className="flex-1">
                            <div className="text-white font-bold text-lg">{lastDetection.plate_number}</div>
                            <div className="text-white text-xs opacity-90">
                                Độ chính xác: {((lastDetection.confidence || 0) * 100).toFixed(1)}%
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

