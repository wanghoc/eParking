import { History, Bike, Clock, DollarSign, CheckCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../api";

interface ParkingSession {
    id: number;
    vehicle_id: number;
    entry_time: string;
    exit_time?: string;
    fee: number;
    status: string;
    payment_status: string;
    vehicle: {
        license_plate: string;
        brand?: string;
        model?: string;
    };
}

interface HistoryStats {
    totalSessions: number;
    completedSessions: number;
    currentParking: number;
    totalAmount: number;
}

export function HistoryPage() {
    const { user } = useAuth();
    const [historyData, setHistoryData] = useState<ParkingSession[]>([]);
    const [stats, setStats] = useState<HistoryStats>({
        totalSessions: 0,
        completedSessions: 0,
        currentParking: 0,
        totalAmount: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (user?.id) {
            fetchParkingHistory();
        }
    }, [user?.id]);

    const fetchParkingHistory = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            setError("");
            
            // Fetch parking sessions for user vehicles
            const response = await fetch(apiUrl(`/users/${user.id}/vehicles`));
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu');
            }
            
            const vehicles = await response.json();
            
            // Calculate stats from the sessions
            const totalSessions = historyData.length;
            const completedSessions = historyData.filter(session => session.exit_time).length;
            const currentParking = historyData.filter(session => !session.exit_time).length;
            const totalAmount = historyData.reduce((sum, session) => sum + session.fee, 0);
            
            setStats({
                totalSessions,
                completedSessions, 
                currentParking,
                totalAmount
            });

        } catch (error) {
            console.error('Error fetching parking history:', error);
            setError('Không thể tải lịch sử gửi xe');
        } finally {
            setIsLoading(false);
        }
    };

    const quickStats = [
        {
            title: "Tổng lượt gửi",
            value: isLoading ? "..." : stats.totalSessions.toString(),
            icon: Bike,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Đã hoàn thành",
            value: isLoading ? "..." : stats.completedSessions.toString(),
            icon: CheckCircle,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Đang gửi",
            value: isLoading ? "..." : stats.currentParking.toString(),
            icon: Clock,
            color: "bg-gradient-to-r from-amber-500 to-amber-600"
        },
        {
            title: "Tổng chi phí",
            value: isLoading ? "..." : `${stats.totalAmount.toLocaleString('vi-VN')}₫`,
            icon: DollarSign,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const getStatusIcon = (session: ParkingSession) => {
        if (session.exit_time) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
        return <Clock className="h-4 w-4 text-amber-600" />;
    };

    const getStatusColor = (session: ParkingSession) => {
        if (session.exit_time) return "bg-emerald-100 text-emerald-800";
        return "bg-amber-100 text-amber-800";
    };

    const getStatusText = (session: ParkingSession) => {
        return session.exit_time ? "Hoàn thành" : "Đang gửi";
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Lịch sử gửi xe</h1>
                            <p className="text-cyan-100 text-base lg:text-lg">Theo dõi tất cả hoạt động gửi xe của bạn</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                            <History className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải lịch sử...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Lịch sử gửi xe</h1>
                        <p className="text-cyan-100 text-base lg:text-lg">Theo dõi tất cả hoạt động gửi xe của bạn</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                        <History className="h-6 w-6 lg:h-8 lg:w-8" />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {quickStats.map((stat, index) => {
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

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Chi tiết lịch sử gửi xe</h2>
                        <div className="flex items-center space-x-4">
                            <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-700 transition-colors">
                                <Calendar className="h-4 w-4" />
                                <span>Lọc theo ngày</span>
                            </button>
                            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition-colors">
                                <DollarSign className="h-4 w-4" />
                                <span>Xuất báo cáo</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phương tiện
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian vào
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian ra
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chi phí
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {historyData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">Chưa có lịch sử gửi xe</p>
                                        <p className="text-sm">Hãy đăng ký phương tiện và bắt đầu sử dụng dịch vụ</p>
                                    </td>
                                </tr>
                            ) : (
                                historyData.map((session) => (
                                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                    <Bike className="h-5 w-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{session.vehicle.license_plate}</div>
                                                    <div className="text-sm text-gray-500">{session.vehicle.brand} {session.vehicle.model}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                            {formatDateTime(session.entry_time)}
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                            {session.exit_time ? formatDateTime(session.exit_time) : "---"}
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {session.fee.toLocaleString('vi-VN')}₫
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(session)}
                                                <span className={`ml-2 inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(session)}`}>
                                                    {getStatusText(session)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 