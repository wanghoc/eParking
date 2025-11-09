import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, ScanLine, CheckCircle } from 'lucide-react';
import { apiUrl } from '../api';

interface IPCameraStreamProps {
    cameraId: number;
    name: string;
    cameraType?: string; // 'Vào' | 'Ra' - Loại camera để hiển thị trạng thái đúng
    ipAddress?: string;
    port?: number;
    protocol?: string;
    deviceId?: string;
    username?: string;
    password?: string;
    rtspUrl?: string;
    httpUrl?: string;
    onError?: (error: string) => void;
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

export function IPCameraStream({
    cameraId,
    name,
    cameraType,
    ipAddress,
    port,
    protocol,
    deviceId,
    username,
    password,
    rtspUrl,
    httpUrl,
    onError,
    hideIndicators = false
}: IPCameraStreamProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
    const [annotatedImageUrl, setAnnotatedImageUrl] = useState<string | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let url = '';
        
        // Construct stream URL based on protocol
        switch (protocol) {
            case 'HTTP':
                // HTTP snapshot stream
                if (httpUrl) {
                    url = httpUrl;
                } else if (ipAddress) {
                    url = `http://${ipAddress}:${port || 80}/videostream.cgi`;
                }
                break;
                
            case 'RTSP':
                // RTSP stream - need to proxy through backend
                if (rtspUrl) {
                    url = `/api/cameras/${cameraId}/stream`;
                } else if (ipAddress) {
                    const auth = username && password ? `${username}:${password}@` : '';
                    const rtspPath = `rtsp://${auth}${ipAddress}:${port || 554}/live/ch0`;
                    url = `/api/cameras/${cameraId}/stream?rtsp=${encodeURIComponent(rtspPath)}`;
                }
                break;
                
            case 'ONVIF':
                // ONVIF stream - use backend proxy
                url = `/api/cameras/${cameraId}/stream?protocol=onvif`;
                break;
                
            case 'Yoosee':
                // Yoosee stream - use backend proxy with device ID
                if (deviceId) {
                    url = `/api/cameras/${cameraId}/stream?protocol=yoosee&deviceId=${deviceId}`;
                } else if (ipAddress) {
                    // Fallback to HTTP snapshot
                    url = `http://${ipAddress}:${port || 8000}/snapshot.jpg`;
                }
                break;
                
            default:
                // Generic HTTP snapshot
                if (ipAddress) {
                    url = `http://${ipAddress}:${port || 80}/snapshot.jpg`;
                }
        }

        if (url) {
            setStreamUrl(url);
        } else {
            const errorMsg = 'Không thể tạo URL stream cho camera';
            setError(errorMsg);
            setConnectionStatus('error');
            onError?.(errorMsg);
        }
    }, [cameraId, ipAddress, port, protocol, deviceId, username, password, rtspUrl, httpUrl, onError]);

    useEffect(() => {
        if (!streamUrl || !imgRef.current) return;

        const img = imgRef.current;
        let refreshInterval: NodeJS.Timeout;

        const loadImage = () => {
            if (!img) return;
            
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const separator = streamUrl.includes('?') ? '&' : '?';
            img.src = `${streamUrl}${separator}t=${timestamp}`;
        };

        const handleLoad = () => {
            setIsLoading(false);
            setConnectionStatus('connected');
            setError(null);
            
            // Start plate detection after first successful load
            if (!detectionIntervalRef.current) {
                setTimeout(() => {
                    startPlateDetection();
                }, 2000);
            }
        };

        const handleError = () => {
            setIsLoading(false);
            setConnectionStatus('error');
            const errorMsg = `Không thể kết nối tới camera ${name}`;
            setError(errorMsg);
            onError?.(errorMsg);
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        // Initial load
        loadImage();

        // Refresh snapshot every second for HTTP/Yoosee
        if (protocol === 'HTTP' || protocol === 'Yoosee') {
            refreshInterval = setInterval(loadImage, 1000);
        }

        return () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            if (refreshInterval) clearInterval(refreshInterval);
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
        };
    }, [streamUrl, name, protocol, onError]);

    // Capture frame from image and convert to base64
    const captureFrame = (): string | null => {
        if (!imgRef.current || !canvasRef.current) return null;

        const img = imgRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas size to image size
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw current image to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    // Send frame to backend for plate detection
    const detectPlate = async () => {
        if (isDetecting || connectionStatus !== 'connected') return;

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
                
                // Update annotated image if available
                if (result.annotated_image_base64) {
                    setAnnotatedImageUrl(result.annotated_image_base64);
                }
                
                if (result.success && result.plate_number) {
                    console.log(`[IPCamera ${cameraId}] Detected plate:`, result.plate_number, `(${(result.confidence! * 100).toFixed(1)}%)`);
                    console.log(`[IPCamera ${cameraId}] Database result:`, result.database);
                    setLastDetection(result);
                    
                    // Clear detection after 5 seconds (tăng thời gian để người dùng đọc được)
                    setTimeout(() => {
                        setLastDetection(null);
                        setAnnotatedImageUrl(null);
                    }, 5000);
                } else {
                    // Clear annotated image if no detection
                    setTimeout(() => {
                        setAnnotatedImageUrl(null);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('[IPCamera] Detection error:', error);
        } finally {
            setIsDetecting(false);
        }
    };

    // Start continuous plate detection
    const startPlateDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        // Detect every 1 second for more realtime feel
        detectionIntervalRef.current = setInterval(() => {
            detectPlate();
        }, 1000);

        console.log(`[IPCamera ${cameraId}] Started realtime plate detection (1s interval)`);
    };

    if (error) {
        return (
            <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-white text-sm">{error}</p>
                    <p className="text-gray-400 text-xs mt-2">
                        {protocol === 'Yoosee' && deviceId && (
                            <>Device ID: {deviceId}</>
                        )}
                        {ipAddress && (
                            <>IP: {ipAddress}:{port}</>
                        )}
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
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                        <p className="text-white text-sm">Đang kết nối...</p>
                    </div>
                </div>
            )}
            
            {/* Show annotated image when detection occurs, otherwise show normal stream */}
            {annotatedImageUrl ? (
                <img
                    src={annotatedImageUrl}
                    alt="Detected plate"
                    className="w-full h-full object-contain"
                    style={{ display: isLoading ? 'none' : 'block' }}
                />
            ) : (
                <img
                    ref={imgRef}
                    alt={name}
                    className="w-full h-full object-contain"
                    style={{ display: isLoading ? 'none' : 'block' }}
                    crossOrigin="anonymous"
                />
            )}

            {/* Status indicators removed per user request */}

            {/* Detection result badge with status message */}
            {lastDetection && lastDetection.plate_number && (() => {
                // Xác định màu sắc và trạng thái dựa trên database response
                const db = lastDetection.database;
                let bgColor = 'bg-green-600';
                let borderColor = 'border-green-400';
                let statusText = '';
                let statusIcon = <CheckCircle className="w-5 h-5 text-white" />;

                if (db) {
                    // Xe chưa đăng ký
                    if (db.registered === false) {
                        bgColor = 'bg-red-600';
                        borderColor = 'border-red-400';
                        statusText = db.status_message || 'Chưa đăng ký xe';
                        statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
                    }
                    // Xe đã đăng ký - kiểm tra trạng thái thanh toán (camera Ra)
                    else if (db.payment_status === 'insufficient') {
                        bgColor = 'bg-yellow-600';
                        borderColor = 'border-yellow-400';
                        statusText = db.status_message || 'Số dư không đủ';
                        statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
                    }
                    // Xe đã đăng ký - có status_message từ backend
                    else if (db.status_message) {
                        // Check-in thành công (camera Vào)
                        if (db.status_message.includes('Check-in') || db.status_message.includes('thành công')) {
                            bgColor = 'bg-green-600';
                            borderColor = 'border-green-400';
                            statusText = db.status_message;
                        }
                        // Đã thanh toán (camera Ra)
                        else if (db.status_message.includes('thanh toán') || db.status_message.includes('Đã thanh toán')) {
                            bgColor = 'bg-green-600';
                            borderColor = 'border-green-400';
                            statusText = db.status_message;
                        }
                        // Xe chưa check-in (camera Ra)
                        else if (db.status_message.includes('chưa check-in')) {
                            bgColor = 'bg-red-600';
                            borderColor = 'border-red-400';
                            statusText = db.status_message;
                            statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
                        }
                        // Xe đã đang gửi (camera Vào)
                        else if (db.status_message.includes('đang gửi')) {
                            bgColor = 'bg-yellow-600';
                            borderColor = 'border-yellow-400';
                            statusText = db.status_message;
                            statusIcon = <AlertCircle className="w-5 h-5 text-white" />;
                        }
                        // Mặc định
                        else {
                            statusText = db.status_message;
                        }
                    }
                    // Xe đã đăng ký nhưng không có status_message - dựa vào camera type
                    else if (cameraType === 'Vào' || cameraType === 'Vao') {
                        statusText = 'Đang xử lý check-in...';
                    } else if (cameraType === 'Ra') {
                        statusText = 'Đang xử lý checkout...';
                    }
                } else {
                    // Không có database response - hiển thị dựa vào camera type
                    if (cameraType === 'Vào' || cameraType === 'Vao') {
                        statusText = 'Đang kiểm tra...';
                    } else if (cameraType === 'Ra') {
                        statusText = 'Đang kiểm tra...';
                    }
                }

                return (
                    <div className={`absolute top-2 right-2 px-4 py-3 rounded-lg shadow-xl animate-fade-in border-2 ${bgColor} bg-opacity-95 ${borderColor} z-50`}>
                        <div className="flex items-center space-x-2">
                            {statusIcon}
                            <div>
                                <div className="text-white font-bold text-lg">{lastDetection.plate_number}</div>
                                {statusText && (
                                    <div className="text-white text-sm font-semibold mt-1 whitespace-nowrap">
                                        {statusText}
                                    </div>
                                )}
                                <div className="text-white text-xs opacity-90 mt-1">
                                    Độ chính xác: {((lastDetection.confidence || 0) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Camera info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="space-y-2">
                    {/* Camera name */}
                    <div className="text-white text-base font-medium">{name}</div>
                    <div className="text-gray-300 text-sm">
                        {protocol} • {ipAddress}:{port} • AI Detection
                    </div>
                    
                    {/* Detected plate number */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-300">Biển số nhận dạng:</span>
                        {lastDetection && lastDetection.plate_number ? (
                            <span className="text-lg font-bold text-green-400">
                                {lastDetection.plate_number}
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
