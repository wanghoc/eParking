import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, ScanLine, CheckCircle } from 'lucide-react';
import { apiUrl } from '../api';

interface IPCameraStreamProps {
    cameraId: number;
    name: string;
    ipAddress?: string;
    port?: number;
    protocol?: string;
    deviceId?: string;
    username?: string;
    password?: string;
    rtspUrl?: string;
    httpUrl?: string;
    onError?: (error: string) => void;
}

interface DetectionResult {
    success: boolean;
    plate_number?: string;
    confidence?: number;
    message?: string;
}

export function IPCameraStream({
    cameraId,
    name,
    ipAddress,
    port,
    protocol,
    deviceId,
    username,
    password,
    rtspUrl,
    httpUrl,
    onError
}: IPCameraStreamProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
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
                
                if (result.success && result.plate_number) {
                    console.log(`[IPCamera ${cameraId}] Detected plate:`, result.plate_number, `(${(result.confidence! * 100).toFixed(1)}%)`);
                    setLastDetection(result);
                    
                    // Clear detection after 5 seconds
                    setTimeout(() => {
                        setLastDetection(null);
                    }, 5000);
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

        // Detect every 2 seconds
        detectionIntervalRef.current = setInterval(() => {
            detectPlate();
        }, 2000);

        console.log(`[IPCamera ${cameraId}] Started plate detection`);
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
            
            <img
                ref={imgRef}
                alt={name}
                className="w-full h-full object-contain"
                style={{ display: isLoading ? 'none' : 'block' }}
                crossOrigin="anonymous"
            />

            {/* Connection status indicator */}
            <div className="absolute top-2 right-2 flex items-center space-x-2 bg-black bg-opacity-60 px-2 py-1 rounded">
                {connectionStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                ) : connectionStatus === 'error' ? (
                    <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className={`text-xs ${
                    connectionStatus === 'connected' ? 'text-green-500' : 
                    connectionStatus === 'error' ? 'text-red-500' : 
                    'text-yellow-500'
                }`}>
                    {connectionStatus === 'connected' ? 'Online' : 
                     connectionStatus === 'error' ? 'Offline' : 
                     'Connecting...'}
                </span>
            </div>

            {/* Detection status indicator */}
            {connectionStatus === 'connected' && (
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
                <div className="text-white text-sm font-medium">{name}</div>
                <div className="text-gray-300 text-xs">
                    {protocol} • {ipAddress}:{port} • AI Detection
                </div>
            </div>
        </div>
    );
}
