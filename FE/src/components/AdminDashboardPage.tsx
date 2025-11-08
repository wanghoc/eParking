import { Shield, Camera, AlertCircle, CheckCircle, DollarSign, Bike, Clock, Video, RefreshCw, Settings as SettingsIcon, FileText, Map, XCircle, ChevronDown, Maximize2, Minimize2, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "../api";
import { WebcamStream } from "./WebcamStream"; // CHANGED: Use WebcamStream instead of WebcamStreamWS
import { IPCameraStream } from "./IPCameraStream";

interface DashboardStats {
    currentParking: number;
    totalVehicles: number;
    monthlyParking: number;
}

interface ParkingSession {
    id: number;
    license_plate: string;
    entry_time: string;
    exit_time?: string;
    fee: number;
    payment_status: string;
    balance: number;
    user_id: number;
}

interface CameraFeed {
    id: number;
    name: string;
    location: string;
    parking_lot_id: number;
    type: string;
    status: string;
    device_id?: string;
    ip_address?: string;
    port?: number;
    protocol?: string;
    username?: string;
    password?: string;
    rtsp_url?: string;
    http_url?: string;
    lastPlate?: string;
    lastStatus?: 'paid' | 'insufficient' | 'unregistered' | 'checkin_success' | 'checkin_failed';
    detectionTime?: number;
}

// interface Alert {
//     id: number;
//     type: 'error' | 'warning' | 'info';
//     title: string;
//     message: string;
//     time: string;
//     priority: string;
// }

interface ParkingLot {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
}

interface AdminDashboardPageProps {
    onNavigate?: (page: string) => void;
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps = {}) {
    const [stats, setStats] = useState<DashboardStats>({
        currentParking: 0,
        totalVehicles: 0,
        monthlyParking: 0
    });
    const [sessions, setSessions] = useState<ParkingSession[]>([]);
    const [cameras, setCameras] = useState<CameraFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState<number | null>(null);
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [selectedParkingLot, setSelectedParkingLot] = useState<number | null>(null);
    const [showParkingLotSelector, setShowParkingLotSelector] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [processingPlates, setProcessingPlates] = useState<Set<string>>(new Set()); // Track plates being processed

    // Fetch initial data
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Don't show loading spinner after initial load
            if (stats.currentParking === 0 && stats.totalVehicles === 0) {
                setIsLoading(true);
            }
            
            // Fetch stats
            try {
                const statsRes = await fetch(apiUrl('/admin/stats'));
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats({
                        currentParking: statsData.currentParking ?? 0,
                        totalVehicles: statsData.totalVehicles ?? 0,
                        monthlyParking: statsData.monthlyParking ?? 0
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            }

            // Fetch cameras
            try {
                const camerasRes = await fetch(apiUrl('/cameras'));
                if (camerasRes.ok) {
                    const camerasData = await camerasRes.json();
                    setCameras(prevCameras => {
                        const newCameras = (camerasData || []).map((cam: any) => {
                            const prevCam = prevCameras.find(c => c.id === cam.id);
                            
                            // Base camera object - keep all fields from backend
                            const baseCamera = {
                                id: cam.id,
                                name: cam.name || 'Camera',
                                location: cam.location || '-',
                                parking_lot_id: cam.parking_lot_id || 0, // CRITICAL: Keep parking_lot_id!
                                type: cam.type || 'Vào',
                                status: cam.status || 'Hoạt động',
                                device_id: cam.device_id || undefined, // Keep device_id for webcam detection
                                ip_address: cam.ip_address,
                                port: cam.port,
                                protocol: cam.protocol,
                                username: cam.username,
                                password: cam.password,
                                rtsp_url: cam.rtsp_url,
                                http_url: cam.http_url,
                                // Preserve existing status from previous state
                                lastPlate: prevCam?.lastPlate,
                                lastStatus: prevCam?.lastStatus,
                                detectionTime: prevCam?.detectionTime
                            };
                            
                            return baseCamera;
                        });
                        
                        return newCameras;
                    });
                }
            } catch (err) {
                console.error('Error fetching cameras:', err);
            }

            // Fetch parking lots
            try {
                const lotsRes = await fetch(apiUrl('/parking-lots/overview'));
                if (lotsRes.ok) {
                    const lotsData = await lotsRes.json();
                    setParkingLots(lotsData || []);
                }
            } catch (err) {
                console.error('Error fetching parking lots:', err);
            }

            // Fetch active parking sessions
            try {
                const sessionsRes = await fetch(apiUrl('/admin/parking-sessions/active'));
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    setSessions(sessionsData || []);
                } else {
                    // Fallback to mock data if API fails
                    setSessions([
                        {
                            id: 1,
                            license_plate: "49P1-12345",
                            entry_time: new Date(Date.now() - 3600000).toISOString(),
                            fee: 2000,
                            payment_status: "Chưa thanh toán",
                            balance: 5000,
                            user_id: 1
                        },
                        {
                            id: 2,
                            license_plate: "49P2-67890",
                            entry_time: new Date(Date.now() - 7200000).toISOString(),
                            fee: 2000,
                            payment_status: "Chưa thanh toán",
                            balance: 500,
                            user_id: 2
                        }
                    ]);
                }
            } catch (err) {
                console.error('Error fetching parking sessions:', err);
                // Set empty array on error
                setSessions([]);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmCashPayment = async (sessionId: number) => {
        setProcessingPayment(sessionId);
        
        try {
            const response = await fetch(apiUrl(`/admin/parking-sessions/${sessionId}/confirm-cash`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Update local state
                setSessions(prev => prev.map(s => 
                    s.id === sessionId 
                        ? { ...s, payment_status: "Đã thu tiền mặt" }
                        : s
                ));
                
                // Show success message
                console.log('Đã xác nhận thu tiền mặt thành công');
            } else {
                console.error('Failed to confirm cash payment');
                alert('Không thể xác nhận thu tiền. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Error confirming cash payment:', error);
            alert('Đã xảy ra lỗi. Vui lòng thử lại!');
        } finally {
            setProcessingPayment(null);
        }
    };

    // Handle plate detection from camera
    const handlePlateDetection = async (cameraId: number, plateNumber: string, cameraType: string) => {
        console.log(`[Camera ${cameraId}] Plate detected: ${plateNumber}, Type: ${cameraType}`);
        
        // Prevent duplicate processing for same plate within short time
        const plateKey = `${cameraId}-${plateNumber}`;
        if (processingPlates.has(plateKey)) {
            console.log(`[Camera ${cameraId}] ⚠️ Already processing plate: ${plateNumber}`);
            return;
        }
        
        // Mark as processing
        setProcessingPlates(prev => new Set(prev).add(plateKey));
        
        try {
            if (cameraType === 'Vào') {
                // Entrance camera - Check-in logic
                const response = await fetch(apiUrl('/parking-sessions/check-in'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        license_plate: plateNumber,
                        lot_id: selectedParkingLot,
                        recognition_method: 'Tự động'
                    })
                });

                if (response.ok) {
                    // Check-in successful
                    console.log(`[Camera ${cameraId}] ✅ Check-in successful: ${plateNumber}`);
                    updateCameraStatus(cameraId, 'checkin_success', plateNumber);
                    
                    // Refresh dashboard data
                    fetchDashboardData();
                } else if (response.status === 404) {
                    // Vehicle not registered
                    console.log(`[Camera ${cameraId}] ⚠️ Vehicle not registered: ${plateNumber}`);
                    updateCameraStatus(cameraId, 'unregistered', plateNumber);
                } else {
                    // Other errors (e.g., already checked in)
                    const error = await response.json();
                    console.log(`[Camera ${cameraId}] ❌ Check-in error: ${error.message}`);
                    updateCameraStatus(cameraId, 'checkin_failed', plateNumber);
                }
            } else if (cameraType === 'Ra') {
                // Exit camera - Check-out logic
                const response = await fetch(apiUrl('/parking-sessions/check-out'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        license_plate: plateNumber
                    })
                });

                if (response.ok) {
                    // Check-out successful - payment done
                    console.log(`[Camera ${cameraId}] ✅ Check-out & payment successful: ${plateNumber}`);
                    updateCameraStatus(cameraId, 'paid', plateNumber);
                    
                    // Refresh dashboard data
                    fetchDashboardData();
                } else if (response.status === 400) {
                    const error = await response.json();
                    if (error.message === 'Insufficient balance') {
                        // Insufficient balance
                        console.log(`[Camera ${cameraId}] ⚠️ Insufficient balance: ${plateNumber}`);
                        updateCameraStatus(cameraId, 'insufficient', plateNumber);
                    } else {
                        // Other errors
                        console.log(`[Camera ${cameraId}] ❌ Check-out error: ${error.message}`);
                        updateCameraStatus(cameraId, 'unregistered', plateNumber);
                    }
                } else if (response.status === 404) {
                    // Vehicle not registered
                    console.log(`[Camera ${cameraId}] ⚠️ Vehicle not registered: ${plateNumber}`);
                    updateCameraStatus(cameraId, 'unregistered', plateNumber);
                }
            }
        } catch (error) {
            console.error(`[Camera ${cameraId}] ❌ Error processing detection:`, error);
        } finally {
            // Remove from processing set after 3 seconds (allow time for status to show)
            setTimeout(() => {
                setProcessingPlates(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(plateKey);
                    return newSet;
                });
            }, 3000);
        }
    };

    // Update camera status in state
    const updateCameraStatus = (cameraId: number, status: CameraFeed['lastStatus'], plateNumber: string) => {
        setCameras(prevCameras => 
            prevCameras.map(cam => 
                cam.id === cameraId 
                    ? { 
                        ...cam, 
                        lastPlate: plateNumber, 
                        lastStatus: status,
                        detectionTime: Date.now()
                    }
                    : cam
            )
        );

        // Clear status after 5 seconds
        setTimeout(() => {
            setCameras(prevCameras => 
                prevCameras.map(cam => 
                    cam.id === cameraId 
                        ? { ...cam, lastStatus: undefined }
                        : cam
                )
            );
        }, 5000);
    };

    const quickStats = [
        {
            title: "Xe đang gửi",
            value: isLoading ? "..." : (stats?.currentParking ?? 0).toString(),
            icon: Bike,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Phương tiện đã đăng ký",
            value: isLoading ? "..." : (stats?.totalVehicles ?? 0).toString(),
            icon: Bike,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Lượt gửi tháng này",
            value: isLoading ? "..." : (stats?.monthlyParking ?? 0).toString(),
            icon: Clock,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const getPaymentStatusColor = (status: string, balance: number, fee: number) => {
        if (status === "Đã thanh toán") return "bg-emerald-100 text-emerald-800";
        if (status === "Đã thu tiền mặt") return "bg-blue-100 text-blue-800";
        if (balance < fee) return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    };

    const getCameraStatusBadge = (camera: CameraFeed) => {
        const status = camera.lastStatus;
        
        // For entrance cameras: show check-in status
        // Position: next to detection status (horizontal layout)
        if (camera.type === 'Vào') {
            if (status === 'checkin_success') {
                // Check-in successful - vehicle registered
                return (
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
                        {/* Detection status */}
                        <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">Đang quét...</span>
                        </div>
                        {/* Check-in status */}
                        <div className="flex items-center space-x-2 bg-emerald-500 bg-opacity-95 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-medium text-white">Check-in thành công</span>
                        </div>
                    </div>
                );
            }
            if (status === 'unregistered' || status === 'checkin_failed') {
                // Vehicle not registered or check-in failed
                return (
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
                        {/* Detection status */}
                        <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">Đang quét...</span>
                        </div>
                        {/* Unregistered status */}
                        <div className="flex items-center space-x-2 bg-amber-500 bg-opacity-95 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-medium text-white">Chưa đăng ký xe</span>
                        </div>
                    </div>
                );
            }
            // Normal state - show only detection status
            return (
                <div className="absolute top-2 left-2 z-20">
                    <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                        <ScanLine className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-white">Sẵn sàng</span>
                    </div>
                </div>
            );
        }
        
        // For exit cameras: show payment status next to detection status
        // Position: horizontal layout
        if (camera.type === 'Ra') {
            if (status === 'paid') {
                // Payment successful
                return (
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
                        {/* Detection status */}
                        <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">Đang quét...</span>
                        </div>
                        {/* Payment status */}
                        <div className="flex items-center space-x-2 bg-emerald-500 bg-opacity-95 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-medium text-white">Đã thanh toán</span>
                        </div>
                    </div>
                );
            }
            if (status === 'insufficient') {
                // Insufficient balance
                return (
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
                        {/* Detection status */}
                        <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">Đang quét...</span>
                        </div>
                        {/* Insufficient balance status */}
                        <div className="flex items-center space-x-2 bg-red-500 bg-opacity-95 px-3 py-2 rounded-lg">
                            <XCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-medium text-white">Số dư không đủ</span>
                        </div>
                    </div>
                );
            }
            if (status === 'unregistered') {
                // Vehicle not registered
                return (
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-2">
                        {/* Detection status */}
                        <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">Đang quét...</span>
                        </div>
                        {/* Unregistered status */}
                        <div className="flex items-center space-x-2 bg-amber-500 bg-opacity-95 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-white" />
                            <span className="text-sm font-medium text-white">Chưa đăng ký xe</span>
                        </div>
                    </div>
                );
            }
            // Normal state for exit - show only detection status
            return (
                <div className="absolute top-2 left-2 z-20">
                    <div className="flex items-center space-x-2 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                        <ScanLine className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-white">Sẵn sàng</span>
                    </div>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl p-4 lg:p-8 text-white shadow-2xl overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Giám sát trực tiếp</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">Quản trị hệ thống eParking - Real-time Monitoring</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={fetchDashboardData}
                            className="bg-white bg-opacity-20 p-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className="h-5 w-5 drop-shadow-lg" />
                        </button>
                        <div className="bg-white bg-opacity-20 p-3 rounded-full">
                            <Shield className="h-6 w-6 lg:h-8 lg:w-8 drop-shadow-lg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {quickStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                                    <Icon className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'grid grid-cols-1 xl:grid-cols-4 gap-6'}`}>
                {/* Camera Feeds - Left Side (3/4 width) */}
                <div className={isFullscreen ? 'w-full h-full' : 'xl:col-span-3 space-y-6'}>
                    {/* Camera Grid */}
                    <div className={`${isFullscreen ? 'h-full' : ''} bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden`}>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Video className="h-5 w-5 text-cyan-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Luồng Camera Trực Tiếp</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                                        title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
                                    >
                                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                        <span className="hidden sm:inline">{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowParkingLotSelector(!showParkingLotSelector)}
                                            className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2"
                                        >
                                            <Map className="h-5 w-5" />
                                            <span>{selectedParkingLot ? parkingLots.find(l => l.id === selectedParkingLot)?.name : 'Chọn bãi xe'}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    
                                        {showParkingLotSelector && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                                                <div className="p-2 max-h-64 overflow-y-auto">
                                                    {parkingLots.map((lot) => (
                                                        <button
                                                            key={lot.id}
                                                            onClick={() => {
                                                                setSelectedParkingLot(lot.id);
                                                                setShowParkingLotSelector(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-cyan-50 rounded-lg transition-colors"
                                                        >
                                                            <p className="font-medium text-gray-900">{lot.name}</p>
                                                            <p className="text-xs text-gray-500">Đã sử dụng: {lot.occupied}/{lot.capacity}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={isFullscreen ? 'p-4 h-[calc(100vh-80px)]' : 'p-6'}>
                            {!selectedParkingLot ? (
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isFullscreen ? 'h-full' : ''}`}>
                                    {[1, 2].map((idx) => (
                                        <div key={idx} className={`relative bg-gray-200 rounded-xl overflow-hidden ${isFullscreen ? 'h-full' : 'aspect-video'} flex items-center justify-center`}>
                                            <div className="text-center text-gray-500">
                                                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm font-medium">Vui lòng chọn bãi xe</p>
                                                <p className="text-xs opacity-75">Camera {idx === 1 ? 'Vào' : 'Ra'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (() => {
                                const filteredCameras = cameras.filter(cam => {
                                    // Filter cameras by selected parking lot using parking_lot_id
                                    return cam.parking_lot_id === selectedParkingLot;
                                });

                                // If no cameras found for this parking lot, show placeholder with error message
                                if (filteredCameras.length === 0) {
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2].map((idx) => (
                                                <div key={idx} className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                                        <div className="text-center text-white">
                                                            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                                                            <p className="text-sm font-medium">Không tìm thấy camera</p>
                                                            <p className="text-xs opacity-50 mt-2">Camera {idx === 1 ? 'Vào' : 'Ra'}</p>
                                                            <p className="text-xs opacity-50 mt-1">Vui lòng thêm camera cho bãi xe này</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Camera type badge */}
                                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                                <span className="text-white text-xs font-medium opacity-50">OFFLINE</span>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded ${idx === 1 ? 'bg-emerald-500' : 'bg-blue-500'} text-white opacity-50`}>
                                                                {idx === 1 ? 'Vào' : 'Ra'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                // Show actual cameras (webcam for test lots with device_id='webcam', IP camera for others)
                                return (
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isFullscreen ? 'h-full' : ''}`}>
                                        {filteredCameras.slice(0, 2).map((camera) => (
                                            <div key={camera.id} className={`relative bg-gray-900 rounded-xl overflow-hidden ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
                                                {/* Use WebcamStream for realtime detection (device_id === 'webcam'), IP camera for others */}
                                                {camera.device_id === 'webcam' ? (
                                                    <WebcamStream
                                                        cameraId={camera.id}
                                                        name={camera.name}
                                                        hideIndicators={true}
                                                        onDetection={(plateNumber, confidence) => {
                                                            console.log(`[AdminDashboard] Detection from camera ${camera.id}: ${plateNumber}`);
                                                            // Process check-in or check-out based on camera type
                                                            handlePlateDetection(camera.id, plateNumber, camera.type);
                                                        }}
                                                    />
                                                ) : camera.ip_address || camera.device_id ? (
                                                    <IPCameraStream
                                                        cameraId={camera.id}
                                                        name={camera.name}
                                                        hideIndicators={true}
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
                                                            <p className="text-xs opacity-50 mt-2">Chưa cấu hình camera</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Camera type badge - top right */}
                                                <div className="absolute top-2 right-2 z-10">
                                                    <span className={`text-sm px-3 py-1.5 rounded-lg ${camera.type === 'Vào' ? 'bg-emerald-500' : 'bg-blue-500'} text-white font-medium`}>
                                                        {camera.type}
                                                    </span>
                                                </div>

                                                {/* Payment status badge - below detection status on left */}
                                                {getCameraStatusBadge(camera)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Vehicle List Table */}
                    {!isFullscreen && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {selectedParkingLot 
                                    ? `Xe đang gửi tại ${parkingLots.find(l => l.id === selectedParkingLot)?.name}`
                                    : 'Danh sách xe đang gửi'}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            {!selectedParkingLot ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Bike className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Chọn bãi xe để xem danh sách</p>
                                    <p className="text-sm mt-2">Vui lòng chọn bãi xe từ menu bên trên</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biển số</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian vào</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số dư</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sessions.map((session) => {
                                        const hasInsufficientBalance = session.balance < session.fee && session.payment_status === "Chưa thanh toán";
                                        return (
                                            <tr key={session.id} className={`hover:bg-gray-50 transition-colors ${hasInsufficientBalance ? 'bg-red-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                                                            <Bike className="h-4 w-4 text-cyan-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{session.license_plate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(session.entry_time).toLocaleString('vi-VN', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {session.fee.toLocaleString()}₫
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={hasInsufficientBalance ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                                                        {session.balance.toLocaleString()}₫
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(session.payment_status, session.balance, session.fee)}`}>
                                                        {hasInsufficientBalance ? "Không đủ tiền" : session.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {hasInsufficientBalance && session.payment_status === "Chưa thanh toán" && (
                                                        <button
                                                            onClick={() => handleConfirmCashPayment(session.id)}
                                                            disabled={processingPayment === session.id}
                                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                                        >
                                                            {processingPayment === session.id ? (
                                                                <>
                                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                                    <span>Đang xử lý...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DollarSign className="h-4 w-4" />
                                                                    <span>Thu tiền mặt</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {session.payment_status === "Đã thanh toán" && (
                                                        <span className="text-emerald-600 flex items-center space-x-1">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>Hoàn tất</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                    )}
                </div>

                {/* Right Sidebar - Quick Actions */}
                {!isFullscreen && (
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h2>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => onNavigate?.('management')}
                                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-3 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <Map className="h-5 w-5" />
                                    <span className="text-sm font-medium">Quản lý bãi</span>
                                </button>
                                <button 
                                    onClick={() => onNavigate?.('camera')}
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <Camera className="h-5 w-5" />
                                    <span className="text-sm font-medium">Quản lý camera</span>
                                </button>
                                <button 
                                    onClick={() => onNavigate?.('history')}
                                    className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-3 rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <FileText className="h-5 w-5" />
                                    <span className="text-sm font-medium">Lịch sử</span>
                                </button>
                                <button 
                                    onClick={() => onNavigate?.('admin')}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <SettingsIcon className="h-5 w-5" />
                                    <span className="text-sm font-medium">Cài đặt</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Trạng thái</h2>
                        </div>
                        <div className="p-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-medium text-emerald-900">Server</span>
                                    </div>
                                    <span className="text-xs text-emerald-600 font-semibold">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-cyan-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Camera className="h-4 w-4 text-cyan-600" />
                                        <span className="text-xs font-medium text-cyan-900">Camera</span>
                                    </div>
                                    <span className="text-xs text-cyan-600 font-semibold">{cameras.filter(c => c.status === 'Hoạt động').length}/{cameras.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-violet-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="h-4 w-4 text-violet-600" />
                                        <span className="text-xs font-medium text-violet-900">Thanh toán</span>
                                    </div>
                                    <span className="text-xs text-violet-600 font-semibold">96%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}


