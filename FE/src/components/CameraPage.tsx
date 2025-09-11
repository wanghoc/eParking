import { Camera, Video, Settings, AlertCircle, CheckCircle, Eye, Edit, Trash2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";

export function CameraPage() {
    const [selectedTab, setSelectedTab] = useState("overview");

    const cameras = [
        {
            id: 1,
            name: "Camera A1",
            location: "Bãi xe A - Cổng vào",
            type: "Vào",
            status: "Hoạt động",
            ipAddress: "192.168.1.101",
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
            ipAddress: "192.168.1.102",
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
            ipAddress: "192.168.1.103",
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
            ipAddress: "192.168.1.104",
            resolution: "1080p",
            fps: 0,
            lastActivity: "2024-01-15 08:30",
            recognitionAccuracy: "0%",
            connection: "Offline",
            battery: "45%"
        }
    ];

    const cameraAlerts = [
        {
            id: 1,
            type: "Camera lỗi",
            message: "Camera B2 không phản hồi",
            time: "08:30 AM",
            priority: "Cao",
            camera: "Camera B2"
        },
        {
            id: 2,
            type: "Pin yếu",
            message: "Pin Camera A2 dưới 20%",
            time: "10:15 AM",
            priority: "Trung bình",
            camera: "Camera A2"
        },
        {
            id: 3,
            type: "Kết nối chậm",
            message: "Độ trễ Camera B1 cao",
            time: "09:45 AM",
            priority: "Thấp",
            camera: "Camera B1"
        }
    ];

    const recognitionStats = {
        totalRecognitions: 156,
        successfulRecognitions: 148,
        failedRecognitions: 8,
        averageAccuracy: "94.8%",
        averageResponseTime: "1.2s"
    };

    const getStatusColor = (status: string) => {
        if (status === "Hoạt động") return "bg-emerald-100 text-emerald-800";
        if (status === "Lỗi") return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    };

    const getConnectionColor = (connection: string) => {
        if (connection === "Online") return "bg-emerald-100 text-emerald-800";
        return "bg-red-100 text-red-800";
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
                        <button className="bg-white bg-opacity-20 px-4 lg:px-6 py-2 lg:py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-opacity-30 transition-all duration-300">
                            <Camera className="h-4 w-4 lg:h-5 lg:w-5" />
                            <span className="text-sm lg:text-base">Thêm camera</span>
                        </button>
                        <button className="bg-white bg-opacity-20 px-4 lg:px-6 py-2 lg:py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-opacity-30 transition-all duration-300">
                            <RefreshCw className="h-4 w-4 lg:h-5 lg:w-5" />
                            <span className="text-sm lg:text-base">Kiểm tra tất cả</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setSelectedTab("overview")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "overview"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Tổng quan
                        </button>
                        <button
                            onClick={() => setSelectedTab("cameras")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "cameras"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Quản lý camera
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Tab Content */}
                    {selectedTab === "overview" && (
                        <div className="space-y-8">
                            {/* Thống kê tổng quan */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 rounded-2xl text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-cyan-100 text-sm font-medium">Tổng camera</p>
                                            <p className="text-3xl font-bold">4</p>
                                        </div>
                                        <Camera className="h-8 w-8 text-cyan-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-emerald-100 text-sm font-medium">Đang hoạt động</p>
                                            <p className="text-3xl font-bold">3</p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-emerald-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-violet-100 text-sm font-medium">Độ chính xác TB</p>
                                            <p className="text-3xl font-bold">{recognitionStats.averageAccuracy}</p>
                                        </div>
                                        <Video className="h-8 w-8 text-violet-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-amber-100 text-sm font-medium">Cảnh báo</p>
                                            <p className="text-3xl font-bold">3</p>
                                        </div>
                                        <AlertCircle className="h-8 w-8 text-amber-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Thống kê nhận diện */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">Thống kê nhận diện hôm nay</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center p-4 bg-cyan-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Tổng lượt nhận diện</span>
                                                <span className="font-bold text-cyan-600">{recognitionStats.totalRecognitions}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Thành công</span>
                                                <span className="font-bold text-emerald-600">{recognitionStats.successfulRecognitions}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Thất bại</span>
                                                <span className="font-bold text-red-600">{recognitionStats.failedRecognitions}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-violet-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Độ chính xác trung bình</span>
                                                <span className="font-bold text-violet-600">{recognitionStats.averageAccuracy}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Thời gian phản hồi TB</span>
                                                <span className="font-bold text-amber-600">{recognitionStats.averageResponseTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">Hỗ trợ nhanh</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                <Camera className="h-5 w-5" />
                                                <span>Xem trực tiếp camera</span>
                                            </button>
                                            <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                <RefreshCw className="h-5 w-5" />
                                                <span>Khởi động lại camera</span>
                                            </button>
                                            <button className="w-full bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                <Settings className="h-5 w-5" />
                                                <span>Cài đặt nhận diện</span>
                                            </button>
                                            <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                <Video className="h-5 w-5" />
                                                <span>Xem lịch sử video</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "cameras" && (
                        <div className="space-y-6">
                            {/* Danh sách camera */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Danh sách camera</h2>
                                </div>

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
                                                    Pin
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Độ chính xác
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {cameras.map((camera) => (
                                                <tr key={camera.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                                <Camera className="h-5 w-5 text-cyan-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{camera.name}</div>
                                                                <div className="text-sm text-gray-500">{camera.ipAddress}</div>
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
                                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConnectionColor(camera.connection)}`}>
                                                            {camera.connection === "Online" ? (
                                                                <Wifi className="h-4 w-4 mr-1" />
                                                            ) : (
                                                                <WifiOff className="h-4 w-4 mr-1" />
                                                            )}
                                                            {camera.connection}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-20 bg-gray-200 rounded-full h-3 mr-3">
                                                                <div
                                                                    className={`h-3 rounded-full transition-all duration-300 ${parseInt(camera.battery) > 50 ? "bg-emerald-500" :
                                                                            parseInt(camera.battery) > 20 ? "bg-amber-500" : "bg-red-500"
                                                                        }`}
                                                                    style={{ width: `${camera.battery}` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm text-gray-900">{camera.battery}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {camera.recognitionAccuracy}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button className="text-cyan-600 hover:text-cyan-900 transition-colors">
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
                    )}

                </div>
            </div>
        </div>
    );
} 