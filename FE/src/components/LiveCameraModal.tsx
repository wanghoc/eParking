import { X, Camera, Video, VideoOff, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, Settings, Cloud, Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface LiveCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    cameraCount?: number;
}

interface CameraDevice {
    id: string;
    label: string;
    stream?: MediaStream;
    isActive: boolean;
    location: string;
    type: 'Vào' | 'Ra';
}

export function LiveCameraModal({ isOpen, onClose, cameraCount = 4 }: LiveCameraModalProps) {
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Khởi tạo webcam streams
    useEffect(() => {
        if (isOpen) {
            initializeStreams();
        } else {
            // Dọn dẹp streams khi đóng modal
            cameras.forEach(camera => {
                if (camera.stream) {
                    camera.stream.getTracks().forEach(track => track.stop());
                }
            });
            setCameras([]);
        }

        return () => {
            // Cleanup khi component unmount
            cameras.forEach(camera => {
                if (camera.stream) {
                    camera.stream.getTracks().forEach(track => track.stop());
                }
            });
        };
    }, [isOpen]);

    const initializeStreams = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Kiểm tra quyền truy cập camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Trình duyệt không hỗ trợ truy cập camera');
            }

            // Lấy danh sách thiết bị camera
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('Tìm thấy camera devices:', videoDevices);
            
            if (videoDevices.length === 0) {
                throw new Error('Không tìm thấy camera nào trên thiết bị. Vui lòng kiểm tra kết nối camera.');
            }

            const newCameras: CameraDevice[] = [];
            
            // Tạo camera devices cho số lượng cần thiết (tối đa 4)
            const maxCameras = Math.min(cameraCount, 4, videoDevices.length);
            
            for (let i = 0; i < maxCameras; i++) {
                const deviceId = videoDevices[i % videoDevices.length].deviceId;
                const deviceLabel = videoDevices[i % videoDevices.length].label || `Camera ${i + 1}`;
                
                const camera: CameraDevice = {
                    id: deviceId,
                    label: deviceLabel,
                    isActive: false,
                    location: `Bãi xe ${String.fromCharCode(65 + i)} - Cổng ${i % 2 === 0 ? 'vào' : 'ra'}`,
                    type: i % 2 === 0 ? 'Vào' : 'Ra'
                };

                try {
                    console.log(`Đang khởi tạo camera ${i + 1} với deviceId:`, deviceId);
                    
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: deviceId },
                            width: { ideal: 640, max: 1280 },
                            height: { ideal: 480, max: 720 },
                            frameRate: { ideal: 30, max: 60 }
                        },
                        audio: false
                    });
                    
                    camera.stream = stream;
                    camera.isActive = true;
                    console.log(`Camera ${i + 1} khởi tạo thành công`);
                } catch (err) {
                    console.warn(`Không thể khởi tạo camera ${i + 1}:`, err);
                    
                    // Thử với constraints đơn giản hơn
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: false
                        });
                        camera.stream = stream;
                        camera.isActive = true;
                        console.log(`Camera ${i + 1} khởi tạo thành công với constraints mặc định`);
                    } catch (fallbackErr) {
                        console.warn(`Camera ${i + 1} thất bại hoàn toàn:`, fallbackErr);
                    }
                }

                newCameras.push(camera);
            }

            if (newCameras.filter(c => c.isActive).length === 0) {
                throw new Error('Không thể khởi tạo bất kỳ camera nào. Vui lòng kiểm tra quyền truy cập camera và thử lại.');
            }

            console.log(`Khởi tạo thành công ${newCameras.filter(c => c.isActive).length} camera`);
            setCameras(newCameras);
        } catch (err) {
            console.error('Lỗi khởi tạo camera:', err);
            setError(err instanceof Error ? err.message : 'Lỗi không xác định khi khởi tạo camera');
        } finally {
            setIsLoading(false);
        }
    };

    // Gán stream cho video element
    useEffect(() => {
        cameras.forEach((camera, index) => {
            const videoElement = videoRefs.current[index];
            if (videoElement && camera.stream) {
                videoElement.srcObject = camera.stream;
            }
        });
    }, [cameras]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleCameraDoubleClick = (cameraId: string) => {
        console.log('Double click on camera:', cameraId);
        if (viewMode === 'grid') {
            setSelectedCamera(cameraId);
            setViewMode('single');
        } else {
            setViewMode('grid');
            setSelectedCamera(null);
        }
    };

    const getActiveCameras = () => cameras.filter(camera => camera.isActive);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl ${isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-7xl h-[90vh]'} transition-all duration-300 flex flex-col shadow-2xl`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                        <Camera className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Xem trực tiếp camera</h2>
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                            {getActiveCameras().length} camera
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                        >
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Camera List */}
                    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col rounded-l-2xl">
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm camera..."
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <Camera className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Camera List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                </div>
                            )}

                            {error && (
                                <div className="text-center py-8">
                                    <VideoOff className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                                    <button
                                        onClick={initializeStreams}
                                        className="bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-cyan-600 transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}

                            {!isLoading && !error && cameras.map((camera, index) => (
                                <div
                                    key={camera.id}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        selectedCamera === camera.id
                                            ? 'border-cyan-500 bg-cyan-50'
                                            : camera.isActive
                                            ? 'border-green-200 bg-white hover:border-green-300'
                                            : 'border-gray-200 bg-gray-100'
                                    }`}
                                    onClick={() => setSelectedCamera(camera.id)}
                                    onDoubleClick={() => handleCameraDoubleClick(camera.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            {camera.isActive ? (
                                                <div className="w-16 h-12 bg-gray-900 rounded-lg overflow-hidden">
                                                    <video
                                                        ref={el => videoRefs.current[index] = el}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                                                    <VideoOff className="h-6 w-6 text-gray-500" />
                                                </div>
                                            )}
                                            {camera.isActive && (
                                                <div className="absolute top-1 right-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">{camera.label}</h3>
                                            <p className="text-sm text-gray-500 truncate">{camera.location}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    camera.type === 'Vào' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {camera.type}
                                                </span>
                                                {camera.isActive && (
                                                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Camera Grid */}
                    <div className="flex-1 bg-gray-100 flex flex-col rounded-r-2xl">
                        {/* Grid Header */}
                        <div className="p-4 border-b border-gray-200 bg-white rounded-tr-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-gray-900 font-medium">
                                    {viewMode === 'grid' ? 'Xem lưới camera' : 'Xem camera đơn'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">
                                        {getActiveCameras().length} camera hoạt động
                                    </span>
                                    <button
                                        onClick={() => setViewMode(viewMode === 'grid' ? 'single' : 'grid')}
                                        className="px-3 py-1 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors"
                                    >
                                        {viewMode === 'grid' ? 'Xem đơn' : 'Xem lưới'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Camera Grid */}
                        <div className="flex-1 p-4">
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {Array.from({ length: 4 }, (_, index) => {
                                        const camera = cameras[index];
                                        return (
                                            <div
                                                key={index}
                                                className={`relative rounded-xl overflow-hidden border-2 ${
                                                    camera?.isActive 
                                                        ? 'border-cyan-500 bg-white' 
                                                        : 'border-gray-300 bg-gray-200'
                                                }`}
                                                onDoubleClick={() => camera && handleCameraDoubleClick(camera.id)}
                                            >
                                                {camera?.isActive ? (
                                                    <>
                                                        <video
                                                            ref={el => videoRefs.current[index] = el}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-2 left-2">
                                                            <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                                {camera.label}
                                                            </span>
                                                        </div>
                                                        <div className="absolute top-2 right-2">
                                                            <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-lg text-xs">
                                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                                <span>LIVE</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span>{camera.location}</span>
                                                                    <span>1080p @ 30fps</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                        <div className="text-center">
                                                            <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                            <p className="text-gray-500 text-sm">Không có camera</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full">
                                    {selectedCamera ? (
                                        (() => {
                                            const camera = cameras.find(c => c.id === selectedCamera);
                                            const cameraIndex = cameras.findIndex(c => c.id === selectedCamera);
                                            return camera?.isActive ? (
                                                <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-cyan-500 bg-white">
                                                    <video
                                                        ref={el => {
                                                            if (videoRefs.current[cameraIndex]) {
                                                                videoRefs.current[cameraIndex] = el;
                                                            }
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-4 left-4">
                                                        <span className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium">
                                                            {camera.label}
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-4 right-4">
                                                        <div className="flex items-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm">
                                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                            <span>LIVE</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <div className="bg-black bg-opacity-50 text-white px-4 py-3 rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <span>{camera.location}</span>
                                                                <span>1080p @ 30fps</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
                                                    <div className="text-center">
                                                        <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                        <p className="text-gray-500 text-lg">Camera không hoạt động</p>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
                                            <div className="text-center">
                                                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">Chọn camera để xem</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Controls */}
                        <div className="p-4 border-t border-gray-200 bg-white rounded-br-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                                    >
                                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                                    >
                                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                    </button>
                                    <span className="text-sm text-gray-500">HD 1080p</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">Grid: 2x2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
