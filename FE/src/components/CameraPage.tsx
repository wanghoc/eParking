import { Camera, Video, AlertCircle, CheckCircle, Eye, Edit, Trash2, Wifi, WifiOff, RefreshCw, ChevronDown, X, Maximize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { LiveCameraModal } from "./LiveCameraModal";
import { AddCameraModal } from "./AddCameraModal";
import { IPCameraStream } from "./IPCameraStream";
import { apiUrl } from "../api";

interface CameraData {
    id: number;
    name: string;
    location: string | null;
    type: string;
    status: string;
    ip_address?: string;
    port?: number;
    protocol?: string;
    device_id?: string;
    username?: string;
    password?: string;
    rtsp_url?: string;
    http_url?: string;
    camera_brand?: string;
    resolution?: string;
    fps?: number;
    lastActivity?: string;
    recognitionAccuracy?: string;
    connection?: string;
    battery?: string;
}

export function CameraPage() {
    const [showLiveModal, setShowLiveModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [cameras, setCameras] = useState<CameraData[]>([]);
    const [showCameraSelector, setShowCameraSelector] = useState(false);
    const [selectedCameraForFull, setSelectedCameraForFull] = useState<number | null>(null);
    const cameraRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        loadCameras();
    }, []);

    // No longer need webcam initialization - using IP camera streams instead

    const loadCameras = async () => {
        try {
            const response = await fetch(apiUrl('/cameras'));
            if (response.ok) {
                const data = await response.json();
                setCameras(data);
            }
        } catch (error) {
            console.error('Failed to load cameras:', error);
        }
    };

    const handleCameraSelect = (cameraId: number) => {
        setShowCameraSelector(false);
        // Open camera in full view mode
        setSelectedCameraForFull(cameraId);
    };

    const mockCameras: CameraData[] = [
        {
            id: 1,
            name: "Camera A1",
            location: "Bãi xe A - Cổng vào",
            type: "Vào",
            status: "Hoạt động",
            ip_address: "192.168.1.101",
            resolution: "1080p",
            fps: 30,
            lastActivity: "2024-01-15 10:30",
            recognitionAccuracy: "96%",
            connection: "Online",
            battery: "100%"
        },
        {
            id: 2,
            name: "Camera A2",
            location: "Bãi xe A - Cổng ra",
            type: "Ra",
            status: "Hoạt động",
            ip_address: "192.168.1.102",
            resolution: "1080p",
            fps: 30,
            lastActivity: "2024-01-15 11:15",
            recognitionAccuracy: "94%",
            connection: "Online",
            battery: "95%"
        },
        {
            id: 3,
            name: "Camera B1",
            location: "Bãi xe B - Cổng vào",
            type: "Vào",
            status: "Hoạt động",
            ip_address: "192.168.1.103",
            resolution: "1080p",
            fps: 30,
            lastActivity: "2024-01-15 09:45",
            recognitionAccuracy: "92%",
            connection: "Online",
            battery: "88%"
        },
        {
            id: 4,
            name: "Camera B2",
            location: "Bãi xe B - Cổng ra",
            type: "Ra",
            status: "Lỗi",
            ip_address: "192.168.1.104",
            resolution: "1080p",
            fps: 0,
            lastActivity: "2024-01-15 08:30",
            recognitionAccuracy: "0%",
            connection: "Offline",
            battery: "45%"
        }
    ];


    const getStatusColor = (status: string) => {
        if (status === "Hoạt động") return "bg-emerald-100 text-emerald-800";
        if (status === "Lỗi") return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    };

    const getConnectionColor = (connection: string) => {
        if (connection === "Online") return "bg-emerald-100 text-emerald-800";
        return "bg-red-100 text-red-800";
    };

    // Organize cameras by parking lot (2 cameras per row)
    const organizeCamerasByParkingLot = () => {
        const camerasToUse = cameras.length > 0 ? cameras : mockCameras;
        const activeCameras = camerasToUse.filter(cam => cam.status === "Hoạt động");
        
        // Group cameras by parking lot
        const parkingLotMap = new Map<string, CameraData[]>();
        
        activeCameras.forEach(camera => {
            // Extract parking lot name from location (e.g., "Bãi xe A - Cổng vào" -> "Bãi xe A")
            const location = camera.location || '';
            const parkingLot = location.split('-')[0].trim();
            
            if (!parkingLotMap.has(parkingLot)) {
                parkingLotMap.set(parkingLot, []);
            }
            parkingLotMap.get(parkingLot)!.push(camera);
        });
        
        // Convert to array of rows (2 cameras per row from same parking lot)
        const rows: CameraData[][] = [];
        
        parkingLotMap.forEach((cameras) => {
            for (let i = 0; i < cameras.length; i += 2) {
                const row = cameras.slice(i, i + 2);
                rows.push(row);
            }
        });
        
        return rows;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-2xl p-4 lg:p-8 text-white shadow-2xl overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Quản lý Camera</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">Hệ thống nhận diện biển số - Đại học Đà Lạt</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-white bg-opacity-20 px-4 lg:px-6 py-2 lg:py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-opacity-30 transition-all duration-300"
                        >
                            <Camera className="h-4 w-4 lg:h-5 lg:w-5" />
                            <span className="text-sm lg:text-base">Thêm camera</span>
                        </button>
                        <button 
                            onClick={() => setShowLiveModal(true)}
                            className="bg-white bg-opacity-20 px-4 lg:px-6 py-2 lg:py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-opacity-30 transition-all duration-300"
                        >
                            <RefreshCw className="h-4 w-4 lg:h-5 lg:w-5" />
                            <span className="text-sm lg:text-base">Kiểm tra tất cả</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Camera Grid Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Video className="h-5 w-5 text-cyan-600" />
                            <h2 className="text-xl font-semibold text-gray-900">Luồng camera trực tiếp</h2>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowCameraSelector(!showCameraSelector)}
                                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2"
                            >
                                <Eye className="h-5 w-5" />
                                <span>Xem camera</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showCameraSelector && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                    <div className="p-2 max-h-64 overflow-y-auto">
                                        {(cameras.length > 0 ? cameras : mockCameras).map((camera) => (
                                            <button
                                                key={camera.id}
                                                onClick={() => handleCameraSelect(camera.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-cyan-50 rounded-lg transition-colors flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{camera.name}</p>
                                                    <p className="text-xs text-gray-500">{camera.location}</p>
                                                </div>
                                                {camera.status === "Hoạt động" && (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* 2-N Grid Layout organized by parking lot */}
                    <div className="space-y-4">
                        {organizeCamerasByParkingLot().map((row, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {row.map((camera) => {
                                    return (
                                        <div
                                            key={camera.id}
                                            ref={(el) => cameraRefs.current[camera.id] = el}
                                            className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-cyan-500"
                                            onClick={() => setSelectedCameraForFull(camera.id)}
                                        >
                                            {/* IP Camera Stream */}
                                            {camera.ip_address || camera.device_id ? (
                                                <IPCameraStream
                                                    cameraId={camera.id}
                                                    name={camera.name}
                                                    ipAddress={camera.ip_address}
                                                    port={camera.port}
                                                    protocol={camera.protocol}
                                                    deviceId={camera.device_id}
                                                    username={camera.username}
                                                    password={camera.password}
                                                    rtspUrl={camera.rtsp_url}
                                                    httpUrl={camera.http_url}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm opacity-75">{camera.name}</p>
                                                        <p className="text-xs opacity-50">{camera.location}</p>
                                                        <p className="text-xs opacity-50 mt-2">Chưa cấu hình IP/Device ID</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Camera info overlay */}
                                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                        <span className="text-white text-xs font-medium">LIVE</span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${camera.type === 'Vào' ? 'bg-emerald-500' : 'bg-blue-500'} text-white`}>
                                                        {camera.type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Camera name at bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{camera.name}</p>
                                                        <p className="text-white text-xs opacity-75">{camera.location}</p>
                                                    </div>
                                                    <Maximize2 className="h-5 w-5 text-white opacity-75" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Camera Management Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Quản lý camera</h2>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Camera
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vị trí
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kết nối
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(cameras.length > 0 ? cameras : mockCameras).map((camera) => (
                                    <tr key={camera.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                    <Camera className="h-5 w-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{camera.name}</div>
                                                    <div className="text-sm text-gray-500">{camera.ip_address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                            {camera.location}
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${camera.type === "Vào" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                                }`}>
                                                {camera.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(camera.status)}`}>
                                                {camera.status === "Hoạt động" ? (
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                )}
                                                {camera.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConnectionColor(camera.connection || "Offline")}`}>
                                                {camera.connection === "Online" ? (
                                                    <Wifi className="h-4 w-4 mr-1" />
                                                ) : (
                                                    <WifiOff className="h-4 w-4 mr-1" />
                                                )}
                                                {camera.connection || "Offline"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button 
                                                    onClick={() => setSelectedCameraForFull(camera.id)}
                                                    className="text-cyan-600 hover:text-cyan-900 transition-colors"
                                                    title="Xem trực tiếp"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <button className="text-emerald-600 hover:text-emerald-900 transition-colors">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-900 transition-colors">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Live Camera Modal */}
            <LiveCameraModal 
                isOpen={showLiveModal}
                onClose={() => setShowLiveModal(false)}
                cameraCount={(cameras.length > 0 ? cameras : mockCameras).length}
            />

            {/* Add Camera Modal */}
            <AddCameraModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCameraAdded={() => {
                    loadCameras();
                    setShowAddModal(false);
                }}
            />

            {/* Full Camera View Modal */}
            {selectedCameraForFull && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedCameraForFull(null)}
                            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70 transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Camera info header */}
                        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg text-white">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">LIVE</span>
                            </div>
                        </div>

                        {/* Full camera view */}
                        {(() => {
                            const camera = (cameras.length > 0 ? cameras : mockCameras).find(c => c.id === selectedCameraForFull);
                            
                            if (!camera) return null;

                            return (
                                <>
                                    {camera.ip_address || camera.device_id ? (
                                        <IPCameraStream
                                            cameraId={camera.id}
                                            name={camera.name}
                                            ipAddress={camera.ip_address}
                                            port={camera.port}
                                            protocol={camera.protocol}
                                            deviceId={camera.device_id}
                                            username={camera.username}
                                            password={camera.password}
                                            rtspUrl={camera.rtsp_url}
                                            httpUrl={camera.http_url}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <Camera className="h-24 w-24 mx-auto mb-4 opacity-50" />
                                                <p className="text-xl opacity-75">{camera.name}</p>
                                                <p className="text-sm opacity-50 mt-2">{camera.location}</p>
                                                <p className="text-xs opacity-50 mt-2">Chưa cấu hình IP/Device ID</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Camera info bottom */}
                                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 px-6 py-4 rounded-lg text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">{camera.name}</h3>
                                                <p className="text-sm opacity-90">{camera.location}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className={`px-3 py-1 rounded-full text-sm ${camera.type === 'Vào' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                                    {camera.type}
                                                </span>
                                                <span className="text-sm opacity-90">1080p @ 30fps</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
} 