import { Home, Bike, CreditCard, History, MapPin, Users, DollarSign, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../api";

interface DashboardStats {
    vehiclesCount: number;
    currentParking: number;
    monthlyParking: number;
    balance: number;
}

interface ParkingActivity {
    id: number;
    entry_time: string;
    exit_time: string | null;
    fee: number;
    payment_status: string;
    vehicle: {
        license_plate: string;
    };
}

interface SystemLog {
    id: string;
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
    time: string;
    icon: string;
}

interface HomePageProps {
    onNavigate?: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps = {}) {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        vehiclesCount: 0,
        currentParking: 0,
        monthlyParking: 0,
        balance: 0
    });
    const [recentActivities, setRecentActivities] = useState<ParkingActivity[]>([]);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchDashboardStats();
            fetchRecentActivities();
            fetchSystemLogs();
        }
    }, [user?.id]);

    const fetchRecentActivities = async () => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(apiUrl(`/users/${user.id}/parking-sessions`));
            if (response.ok) {
                const data = await response.json();
                // Get last 5 sessions
                setRecentActivities(data.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching recent activities:', error);
        }
    };
    
    const fetchSystemLogs = async () => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(apiUrl(`/users/${user.id}/system-logs?limit=5`));
            if (response.ok) {
                const data = await response.json();
                setSystemLogs(data);
            }
        } catch (error) {
            console.error('Error fetching system logs:', error);
        }
    };

    const fetchDashboardStats = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(apiUrl(`/dashboard/stats?userId=${user.id}`));
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const quickStats = [
        {
            title: "Xe đang gửi",
            value: isLoading ? "..." : stats.currentParking.toString(),
            icon: Bike,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Số dư hiện tại",
            value: isLoading ? "..." : `${stats.balance.toLocaleString('vi-VN')}₫`,
            icon: CreditCard,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Lượt gửi tháng này",
            value: isLoading ? "..." : stats.monthlyParking.toString(),
            icon: History,
            color: "bg-gradient-to-r from-blue-500 to-blue-600"
        },
        {
            title: "Phương tiện đã đăng ký",
            value: isLoading ? "..." : stats.vehiclesCount.toString(),
            icon: Bike,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const getStatusColor = (status: string) => {
        if (status === "Da_thanh_toan") return "bg-emerald-100 text-emerald-800";
        if (status === "insufficient") return "bg-yellow-100 text-yellow-800";
        return "bg-amber-100 text-amber-800";
    };
    
    const getStatusText = (session: ParkingActivity) => {
        if (session.exit_time) {
            if (session.payment_status === "Da_thanh_toan") return "Đã thanh toán";
            if (session.payment_status === "insufficient") return "Số dư không đủ";
            return "Chưa thanh toán";
        }
        return "Đang gửi";
    };
    
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };
    
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return '✓';
            case 'info': return 'ℹ';
            case 'warning': return '⚠';
            default: return '•';
        }
    };
    
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-emerald-50 border-emerald-200';
            case 'info': return 'bg-blue-50 border-blue-200';
            case 'warning': return 'bg-amber-50 border-amber-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section - Enhanced */}
            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl p-4 lg:p-8 text-white shadow-2xl overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-16 lg:w-32 h-16 lg:h-32 bg-white opacity-10 rounded-full -translate-y-8 lg:-translate-y-16 translate-x-8 lg:translate-x-16 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-12 lg:w-24 h-12 lg:h-24 bg-white opacity-5 rounded-full translate-y-6 lg:translate-y-12 -translate-x-6 lg:-translate-x-12 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-1/4 w-8 lg:w-16 h-8 lg:h-16 bg-white opacity-8 rounded-full animate-bounce delay-500"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                            Chào mừng trở lại!
                        </h1>
                        <p className="text-cyan-100 text-base lg:text-xl font-medium mb-1">
                            {user?.username} {user?.mssv ? `- ${user.mssv}` : ''}
                        </p>
                        <p className="text-cyan-200 flex items-center text-sm lg:text-base">
                            <MapPin className="h-4 w-4 mr-2" />
                            Hệ thống eParking - Trường Đại học Đà Lạt
                        </p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 lg:p-5 rounded-2xl border border-white border-opacity-30 shadow-xl self-start lg:self-auto">
                        <Home className="h-8 w-8 lg:h-10 lg:w-10 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
                                {recentActivities.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">Chưa có hoạt động gần đây</p>
                                ) : (
                                    recentActivities.map((activity) => {
                                        const activityType = activity.exit_time ? "Xe ra bãi" : "Xe vào bãi";
                                        const activityIcon = activity.exit_time ? "bg-blue-100" : "bg-emerald-100";
                                        const iconColor = activity.exit_time ? "text-blue-600" : "text-emerald-600";
                                        const timeString = activity.exit_time 
                                            ? new Date(activity.exit_time).toLocaleString('vi-VN', { 
                                                month: '2-digit', 
                                                day: '2-digit', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })
                                            : new Date(activity.entry_time).toLocaleString('vi-VN', { 
                                                month: '2-digit', 
                                                day: '2-digit', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            });
                                        
                                        return (
                                            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-lg ${activityIcon}`}>
                                                        <Bike className={`h-5 w-5 ${iconColor}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{activityType}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {activity.vehicle.license_plate}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">{timeString}</p>
                                                    <p className="font-medium text-gray-900">{activity.fee.toLocaleString('vi-VN')}₫</p>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.payment_status)}`}>
                                                        {getStatusText(activity)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
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
                                {systemLogs.length > 0 ? (
                                    systemLogs.map((log) => (
                                        <div key={log.id} className={`p-4 rounded-xl border ${getNotificationColor(log.type)}`}>
                                            <div className="flex items-start space-x-3">
                                                <span className="text-lg">{getNotificationIcon(log.type)}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{log.title}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                                                    <p className="text-xs text-gray-500 mt-2">{getTimeAgo(log.time)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Chưa có thông báo nào</p>
                                    </div>
                                )}
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
                                <button 
                                    onClick={() => onNavigate?.('vehicles')}
                                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <Bike className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Thêm xe</span>
                                </button>
                                <button 
                                    onClick={() => onNavigate?.('payment')}
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <CreditCard className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">Nạp tiền</span>
                                </button>
                                <button 
                                    onClick={() => onNavigate?.('history')}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
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