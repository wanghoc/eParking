import { Building2, Car, Users, DollarSign, CheckCircle, AlertCircle, Plus, Edit, Eye, Activity, QrCode } from "lucide-react";
import { useState } from "react";

export function ManagementPage() {
    const [selectedTab, setSelectedTab] = useState("overview");

    const parkingLots = [
        {
            id: 1,
            name: "Bãi xe A",
            capacity: 50,
            occupied: 32,
            fee: "2,000₫/lượt",
            status: "Hoạt động"
        },
        {
            id: 2,
            name: "Bãi xe B",
            capacity: 40,
            occupied: 28,
            fee: "2,000₫/lượt",
            status: "Hoạt động"
        }
    ];

    const recentActivities = [
        {
            id: 1,
            type: "Xe vào bãi",
            plateNumber: "49P1-12345",
            time: "10:30 AM",
            location: "Bãi xe A",
            recognitionMethod: "Tự động"
        },
        {
            id: 2,
            type: "Xe ra bãi",
            plateNumber: "49P2-67890",
            time: "11:15 AM",
            location: "Bãi xe B",
            recognitionMethod: "Tự động"
        },
        {
            id: 3,
            type: "Lỗi nhận diện",
            plateNumber: "49P3-54321",
            time: "09:45 AM",
            location: "Bãi xe A",
            recognitionMethod: "Thủ công"
        },
        {
            id: 4,
            type: "Thanh toán thủ công",
            plateNumber: "49P4-98765",
            time: "08:30 AM",
            location: "Bãi xe B",
            recognitionMethod: "Thủ công"
        }
    ];

    const systemAlerts = [
        {
            id: 1,
            type: "Lỗi nhận diện biển số",
            message: "Camera Bãi xe A không nhận diện được biển số 49P3-54321",
            time: "09:45 AM",
            priority: "Cao"
        },
        {
            id: 2,
            type: "Tài khoản không đủ tiền",
            message: "Tài khoản của xe 49P4-98765 không đủ tiền để trừ phí",
            time: "08:30 AM",
            priority: "Trung bình"
        },
        {
            id: 3,
            type: "Xe quá thời gian gửi",
            message: "Xe 49P1-12345 đã gửi quá 24 giờ tại Bãi xe A",
            time: "07:15 AM",
            priority: "Thấp"
        }
    ];

    const getStatusColor = (status: string) => {
        if (status === "Hoạt động") return "bg-emerald-100 text-emerald-800";
        return "bg-red-100 text-red-800";
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "Cao") return "bg-red-100 text-red-800";
        if (priority === "Trung bình") return "bg-amber-100 text-amber-800";
        return "bg-cyan-100 text-cyan-800";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Quản lý bãi xe</h1>
                        <p className="text-cyan-100 text-lg">Hệ thống quản lý bãi xe - Đại học Đà Lạt</p>
                    </div>
                    <div className="flex space-x-4">
                        <button className="bg-white bg-opacity-20 px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-opacity-30 transition-all duration-300">
                            <Eye className="h-5 w-5" />
                            <span>Kiểm tra camera</span>
                        </button>
                        <button className="bg-white bg-opacity-20 px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-opacity-30 transition-all duration-300">
                            <QrCode className="h-5 w-5" />
                            <span>Quét mã QR</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Xe vào hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">45</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                            <Car className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Xe ra hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">42</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                            <Car className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Doanh thu hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">84,000₫</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Độ chính xác nhận diện</p>
                            <p className="text-2xl font-bold text-gray-900">96%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
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
                            onClick={() => setSelectedTab("parking")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "parking"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Quản lý bãi xe
                        </button>
                        <button
                            onClick={() => setSelectedTab("activities")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "activities"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Hoạt động gần đây
                        </button>
                        <button
                            onClick={() => setSelectedTab("alerts")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "alerts"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Cảnh báo
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {selectedTab === "overview" && (
                        <div className="space-y-6">
                            {/* Quick Support */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Hỗ trợ nhanh</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Car className="h-5 w-5" />
                                            <span>Nhập biển số thủ công</span>
                                        </button>
                                        <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <QrCode className="h-5 w-5" />
                                            <span>Quét mã QR</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "parking" && (
                        <div className="space-y-6">
                            {/* Parking Lots */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Quản lý bãi xe</h2>
                                        <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Plus className="h-4 w-4" />
                                            <span>Thêm bãi xe</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Bãi xe
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Sức chứa
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Đã sử dụng
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phí gửi xe
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {parkingLots.map((lot) => (
                                                <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                                <Building2 className="h-5 w-5 text-cyan-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{lot.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {lot.capacity} xe
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {lot.occupied}/{lot.capacity} xe
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {lot.fee}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                                                            {lot.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button className="text-cyan-600 hover:text-cyan-900 transition-colors">
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                            <button className="text-emerald-600 hover:text-emerald-900 transition-colors">
                                                                <Edit className="h-5 w-5" />
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

                    {selectedTab === "activities" && (
                        <div className="space-y-6">
                            {/* Recent Activities */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Hoạt động
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Biển số
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vị trí
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phương thức
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentActivities.map((activity) => (
                                                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`p-2 rounded-lg ${activity.type === "Xe vào bãi" ? "bg-emerald-100" :
                                                                    activity.type === "Xe ra bãi" ? "bg-blue-100" :
                                                                        "bg-amber-100"
                                                                }`}>
                                                                {activity.type === "Xe vào bãi" ? (
                                                                    <Car className="h-4 w-4 text-emerald-600" />
                                                                ) : activity.type === "Xe ra bãi" ? (
                                                                    <Car className="h-4 w-4 text-blue-600" />
                                                                ) : (
                                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                                )}
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{activity.type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {activity.plateNumber}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {activity.location}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {activity.time}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activity.recognitionMethod === "Tự động" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                            }`}>
                                                            {activity.recognitionMethod}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "alerts" && (
                        <div className="space-y-6">
                            {/* System Alerts */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Cảnh báo hệ thống</h2>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-4">
                                        {systemAlerts.map((alert) => (
                                            <div key={alert.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-3 rounded-full ${alert.priority === "Cao" ? "bg-red-100" :
                                                        alert.priority === "Trung bình" ? "bg-amber-100" : "bg-cyan-100"}`}>
                                                        <AlertCircle className={`h-5 w-5 ${alert.priority === "Cao" ? "text-red-600" :
                                                            alert.priority === "Trung bình" ? "text-amber-600" : "text-cyan-600"}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-lg ${alert.priority === "Cao" ? "text-red-900" :
                                                            alert.priority === "Trung bình" ? "text-amber-900" : "text-cyan-900"}`}>
                                                            {alert.type}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                                        <p className="text-sm text-gray-500 mt-2">{alert.time}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-3">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                                                        {alert.priority}
                                                    </span>
                                                    <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors">Xử lý</button>
                                                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Chi tiết</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 