import { Shield, Users, Car, AlertCircle, Camera, FileText, Settings, CheckCircle, Edit, Trash2, Lock, Unlock, DollarSign, Eye } from "lucide-react";
import { useState } from "react";

export function AdminPage() {
    const [selectedTab, setSelectedTab] = useState("overview");

    const systemStats = [
        {
            title: "Tổng người dùng",
            value: "1,247",
            icon: Users,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Tổng phương tiện",
            value: "2,156",
            icon: Car,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Lỗi nhận diện",
            value: "8",
            icon: AlertCircle,
            color: "bg-gradient-to-r from-amber-500 to-amber-600"
        },
        {
            title: "Camera hoạt động",
            value: "4",
            icon: Camera,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const users = [
        {
            id: 1,
            name: "Triệu Quang Học",
            studentId: "2212375",
            phone: "0123456789",
            vehicles: 2,
            status: "active"
        },
        {
            id: 2,
            name: "Nguyễn Văn A",
            studentId: "2212376",
            phone: "0987654321",
            vehicles: 1,
            status: "active"
        },
        {
            id: 3,
            name: "Trần Thị B",
            studentId: "2212377",
            phone: "0369852147",
            vehicles: 3,
            status: "inactive"
        }
    ];

    const systemLogs = [
        {
            id: 1,
            action: "Nhận diện biển số",
            user: "Hệ thống",
            time: "2024-01-15 10:30",
            type: "Recognition"
        },
        {
            id: 2,
            action: "Trừ phí gửi xe",
            user: "Hệ thống",
            time: "2024-01-15 09:15",
            type: "Payment"
        },
        {
            id: 3,
            action: "Nạp tiền thành công",
            user: "Triệu Quang Học",
            time: "2024-01-15 08:45",
            type: "Payment"
        },
        {
            id: 4,
            action: "Đăng ký xe mới",
            user: "Nguyễn Văn A",
            time: "2024-01-15 08:30",
            type: "Vehicle"
        }
    ];

    const getStatusColor = (status: string) => {
        if (status === "active") return "bg-emerald-100 text-emerald-800";
        return "bg-red-100 text-red-800";
    };

    const getLogIcon = (type: string) => {
        if (type === "Recognition") return <Camera className="h-4 w-4 text-cyan-600" />;
        if (type === "Payment") return <DollarSign className="h-4 w-4 text-emerald-600" />;
        return <Car className="h-4 w-4 text-violet-600" />;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Quản trị hệ thống</h1>
                        <p className="text-cyan-100 text-lg drop-shadow-md">Quản lý toàn bộ hệ thống eParking</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-full">
                        <Shield className="h-8 w-8 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                            onClick={() => setSelectedTab("users")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "users"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Quản lý người dùng
                        </button>
                        <button
                            onClick={() => setSelectedTab("logs")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "logs"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Nhật ký hệ thống
                        </button>
                        <button
                            onClick={() => setSelectedTab("settings")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "settings"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Cài đặt hệ thống
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {selectedTab === "overview" && (
                        <div className="space-y-6">
                            {/* System Overview */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Tổng quan hệ thống</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-cyan-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Tổng lượt gửi xe</span>
                                                <span className="font-bold text-cyan-600">15,678</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Doanh thu tháng</span>
                                                <span className="font-bold text-emerald-600">31,356,000₫</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-violet-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Độ chính xác TB</span>
                                                <span className="font-bold text-violet-600">96.5%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Lỗi nhận diện</span>
                                                <span className="font-bold text-amber-600">8</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Camera hoạt động</span>
                                                <span className="font-bold text-blue-600">4/4</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Cảnh báo hệ thống</span>
                                                <span className="font-bold text-red-600">3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "users" && (
                        <div className="space-y-6">
                            {/* Users Management */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Người dùng
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    MSSV
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số điện thoại
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số xe
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
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                                <Users className="h-5 w-5 text-cyan-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.studentId}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.phone}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.vehicles} xe
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                                            {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button className="text-cyan-600 hover:text-cyan-900 transition-colors">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button className="text-emerald-600 hover:text-emerald-900 transition-colors">
                                                                <Eye className="h-5 w-5" />
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

                    {selectedTab === "logs" && (
                        <div className="space-y-6">
                            {/* System Logs */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Nhật ký hệ thống</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Hành động
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Người dùng
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Loại
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {systemLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {getLogIcon(log.type)}
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{log.action}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {log.user}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {log.time}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${log.type === "Recognition" ? "bg-cyan-100 text-cyan-800" :
                                                            log.type === "Payment" ? "bg-emerald-100 text-emerald-800" :
                                                                "bg-violet-100 text-violet-800"
                                                            }`}>
                                                            {log.type}
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

                    {selectedTab === "settings" && (
                        <div className="space-y-6">
                            {/* System Settings */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Cài đặt hệ thống</h2>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Cấu hình nhận diện</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Độ chính xác tối thiểu</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="85" className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Thời gian xử lý tối đa</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="3" className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">giây</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Số lần thử lại</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="2" className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">lần</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Cấu hình thanh toán</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Phí gửi xe</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="2,000" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">₫/lượt</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Ngưỡng cảnh báo số dư thấp</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="3,000" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                Lưu cài đặt
                                            </button>
                                        </div>
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