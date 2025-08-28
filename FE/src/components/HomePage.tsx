import { Home, Car, CreditCard, History, MapPin, Users, DollarSign, CheckCircle, AlertCircle, Camera } from "lucide-react";

export function HomePage() {
    const quickStats = [
        {
            title: "Xe đang gửi",
            value: "2",
            icon: Car,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Số dư hiện tại",
            value: "45,000₫",
            icon: CreditCard,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Lượt gửi tháng này",
            value: "45",
            icon: History,
            color: "bg-gradient-to-r from-blue-500 to-blue-600"
        },
        {
            title: "Phương tiện đã đăng ký",
            value: "3",
            icon: Car,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const recentActivities = [
        {
            id: 1,
            type: "Xe vào bãi",
            plateNumber: "49P1-12345",
            time: "10:30 AM",
            // status: "Thành công",
            // fee: "2,000₫"
        },
        {
            id: 2,
            type: "Xe ra bãi",
            plateNumber: "49P2-67890",
            time: "11:15 AM",
            status: "Thành công",
            fee: "2,000₫"
        },
        {
            id: 3,
            type: "Nạp tiền",
            plateNumber: "-",
            time: "09:45 AM",
            status: "Thành công",
            fee: "+50,000₫"
        }
    ];

    const notifications = [
        {
            id: 1,
            type: "success",
            title: "Nạp tiền thành công",
            message: "Đã nạp 50,000₫ vào tài khoản",
            time: "2 phút trước"
        },
        {
            id: 2,
            type: "info",
            title: "Xe vào bãi thành công",
            message: "Biển số 49P1-12345 đã được nhận diện thành công",
            time: "1 giờ trước"
        }
    ];

    const getStatusColor = (status: string | undefined) => {
        if (status === "Thành công") return "bg-emerald-100 text-emerald-800";
        return "bg-amber-100 text-amber-800";
    };

    const getNotificationColor = (type: string) => {
        if (type === "success") return "bg-emerald-50 border-emerald-200";
        return "bg-cyan-50 border-cyan-200";
    };

    const getNotificationIcon = (type: string) => {
        if (type === "success") return <CheckCircle className="h-5 w-5 text-emerald-600" />;
        return <Camera className="h-5 w-5 text-cyan-600" />;
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section - Enhanced */}
            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white opacity-8 rounded-full animate-bounce delay-500"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                            Chào mừng trở lại!
                        </h1>
                        <p className="text-cyan-100 text-xl font-medium mb-1">Triệu Quang Học - 2212375</p>
                        <p className="text-cyan-200 flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Hệ thống eParking - Trường Đại học Đà Lạt
                        </p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-5 rounded-2xl border border-white border-opacity-30 shadow-xl">
                        <Home className="h-10 w-10 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="relative group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-cyan-200 transform hover:-translate-y-2">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                                    <Icon className="h-7 w-7 text-white drop-shadow-md" />
                                </div>
                            </div>
                            {/* Gradient overlay effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activities */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
                                <button className="text-cyan-600 hover:text-cyan-700 font-medium">Xem tất cả</button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-lg ${activity.type === "Xe vào bãi" ? "bg-emerald-100" :
                                                activity.type === "Xe ra bãi" ? "bg-blue-100" :
                                                    "bg-violet-100"
                                                }`}>
                                                {activity.type === "Xe vào bãi" ? (
                                                    <Car className="h-5 w-5 text-emerald-600" />
                                                ) : activity.type === "Xe ra bãi" ? (
                                                    <Car className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <CreditCard className="h-5 w-5 text-violet-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{activity.type}</p>
                                                <p className="text-sm text-gray-500">
                                                    {activity.plateNumber !== "-" ? activity.plateNumber : "Nạp tiền"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{activity.time}</p>
                                            <p className="font-medium text-gray-900">{activity.fee}</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                                {activity.status || "Đang gửi"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Quick Actions */}
                <div className="space-y-6">
                    {/* Notifications */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className={`p-4 rounded-xl border ${getNotificationColor(notification.type)}`}>
                                        <div className="flex items-start space-x-3">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{notification.title}</p>
                                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Thao tác nhanh</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <Car className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Thêm xe</span>
                                </button>
                                <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <CreditCard className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Nạp tiền</span>
                                </button>
                                <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <History className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Lịch sử</span>
                                </button>
                                <button className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    <MapPin className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Bãi xe</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Status
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Trạng thái hệ thống</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-900">Hệ thống hoạt động bình thường</span>
                                    </div>
                                    <span className="text-xs text-emerald-600">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Camera className="h-5 w-5 text-cyan-600" />
                                        <span className="text-sm font-medium text-cyan-900">Camera nhận diện</span>
                                    </div>
                                    <span className="text-xs text-cyan-600">96%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Người dùng online</span>
                                    </div>
                                    <span className="text-xs text-blue-600">1,247</span>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
} 