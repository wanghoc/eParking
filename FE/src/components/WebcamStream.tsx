import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle } from 'lucide-react';

interface WebcamStreamProps {
    cameraId: number;
    name: string;
    onError?: (error: string) => void;
}

export function WebcamStream({
    cameraId,
    name,
    onError
}: WebcamStreamProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

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
        };
    }, [cameraId, onError]);

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

            {/* Camera info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <div className="flex items-center space-x-2 text-white">
                    <Camera className="w-4 h-4" />
                    <div className="text-sm font-medium">{name}</div>
                    <span className="text-xs opacity-75">Webcam</span>
                </div>
            </div>
        </div>
    );
}

