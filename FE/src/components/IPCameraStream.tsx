import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

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
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

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
        };
    }, [streamUrl, name, protocol, onError]);

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

            {/* Camera info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <div className="text-white text-sm font-medium">{name}</div>
                <div className="text-gray-300 text-xs">
                    {protocol} • {ipAddress}:{port}
                </div>
            </div>
        </div>
    );
}
