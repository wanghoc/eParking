import { Settings, Users, Shield, Database, Activity, BarChart3, UserPlus, Key, Bell } from "lucide-react";

export function AdminPage() {
    const systemStats = [
        {
            title: "Tổng người dùng",
            value: "1,247",
            icon: Users,
            color: "bg-blue-500",
            change: "+12%",
            changeType: "positive"
        },
        {
            title: "Hoạt động hôm nay",
            value: "156",
            icon: Activity,
            color: "bg-green-500",
            change: "+8%",
            changeType: "positive"
        },
        {
            title: "Bảo mật",
            value: "100%",
            icon: Shield,
            color: "bg-purple-500",
            change: "An toàn",
            changeType: "neutral"
        },
        {
            title: "Dung lượng DB",
            value: "2.4GB",
            icon: Database,
            color: "bg-orange-500",
            change: "+5%",
            changeType: "warning"
        }
    ];

    const recentUsers = [
        {
            id: 1,
            name: "Nguyễn Văn A",
            email: "nguyenvana@email.com",
            role: "User",
            status: "Active",
            lastLogin: "2024-01-15 10:30"
        },
        {
            id: 2,
            name: "Trần Thị B",
            email: "tranthib@email.com",
            role: "Manager",
            status: "Active",
            lastLogin: "2024-01-15 09:15"
        },
        {
            id: 3,
            name: "Lê Văn C",
            email: "levanc@email.com",
            role: "Admin",
            status: "Active",
            lastLogin: "2024-01-15 08:45"
        }
    ];

    const systemLogs = [
        {
            id: 1,
            type: "Login",
            user: "nguyenvana@email.com",
            action: "Đăng nhập thành công",
            time: "2024-01-15 10:30",
            status: "Success"
        },
        {
            id: 2,
            type: "Payment",
            user: "tranthib@email.com",
            action: "Thanh toán gửi xe",
            time: "2024-01-15 09:15",
            status: "Success"
        },
        {
            id: 3,
            type: "System",
            user: "System",
            action: "Backup database",
            time: "2024-01-15 08:00",
            status: "Success"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quản trị hệ thống</h1>
                    <p className="text-gray-600">Quản lý và giám sát hệ thống eParking</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
                        <UserPlus className="h-4 w-4" />
                        <span>Thêm người dùng</span>
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Cài đặt</span>
                    </button>
                </div>
            </div>

            {/* Thống kê hệ thống */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {systemStats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                <p className={`text-sm ${stat.changeType === "positive" ? "text-green-600" :
                                        stat.changeType === "warning" ? "text-yellow-600" : "text-gray-600"
                                    }`}>
                                    {stat.change}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quản lý người dùng */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Quản lý người dùng</h2>
                        <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-2">
                            <UserPlus className="h-4 w-4" />
                            <span>Thêm mới</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đăng nhập cuối
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === "Admin" ? "bg-red-100 text-red-800" :
                                                    user.role === "Manager" ? "bg-blue-100 text-blue-800" :
                                                        "bg-gray-100 text-gray-800"
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.lastLogin}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Nhật ký hệ thống */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Nhật ký hệ thống</h2>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {systemLogs.map((log) => (
                                <div key={log.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${log.type === "Login" ? "bg-blue-100" :
                                                log.type === "Payment" ? "bg-green-100" : "bg-purple-100"
                                            }`}>
                                            {log.type === "Login" ? (
                                                <Key className="h-4 w-4 text-blue-600" />
                                            ) : log.type === "Payment" ? (
                                                <BarChart3 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Database className="h-4 w-4 text-purple-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{log.action}</p>
                                            <p className="text-sm text-gray-500">{log.user}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{log.time}</p>
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {log.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cài đặt hệ thống */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Cài đặt hệ thống</h2>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-md font-semibold text-gray-900">Bảo mật</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Xác thực 2 yếu tố</span>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Bật</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Mã hóa dữ liệu</span>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Bật</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Backup tự động</span>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Bật</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-md font-semibold text-gray-900">Thông báo</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Email thông báo</span>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Bật</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">SMS thông báo</span>
                                    <button className="bg-gray-300 text-gray-600 px-3 py-1 rounded text-sm">Tắt</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Push notification</span>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Bật</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thông báo hệ thống */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Thông báo hệ thống</h2>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-900">Cập nhật hệ thống</p>
                                <p className="text-sm text-blue-700">Phiên bản mới v2.1.0 đã sẵn sàng cài đặt</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                            <Bell className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-green-900">Backup thành công</p>
                                <p className="text-sm text-green-700">Dữ liệu đã được sao lưu tự động</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                            <Bell className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-900">Cảnh báo dung lượng</p>
                                <p className="text-sm text-yellow-700">Dung lượng database đã sử dụng 85%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 