import { History, Car, Clock, DollarSign, CheckCircle, Calendar } from "lucide-react";

export function HistoryPage() {
    const historyData = [
        {
            id: 1,
            plateNumber: "49P1-12345",
            brand: "Honda",
            model: "Wave Alpha",
            checkIn: "2024-01-15 10:30",
            checkOut: "2024-01-15 16:45",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 2,
            plateNumber: "49P2-67890",
            brand: "Yamaha",
            model: "Exciter 150",
            checkIn: "2024-01-15 08:15",
            checkOut: "---",
            fee: "2,000₫",
            status: "Đang gửi"
        },
        {
            id: 3,
            plateNumber: "49P1-12345",
            brand: "Honda",
            model: "Wave Alpha",
            checkIn: "2024-01-14 14:20",
            checkOut: "2024-01-14 18:30",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 4,
            plateNumber: "49P2-67890",
            brand: "Yamaha",
            model: "Exciter 150",
            checkIn: "2024-01-14 09:45",
            checkOut: "2024-01-14 17:15",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 5,
            plateNumber: "49P1-12345",
            brand: "Honda",
            model: "Wave Alpha",
            checkIn: "2024-01-13 11:30",
            checkOut: "2024-01-13 15:45",
            fee: "2,000₫",
            status: "Hoàn thành"
        }
    ];

    const quickStats = [
        {
            title: "Tổng lượt gửi",
            value: "45",
            icon: Car,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Đã hoàn thành",
            value: "44",
            icon: CheckCircle,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Đang gửi",
            value: "1",
            icon: Clock,
            color: "bg-gradient-to-r from-amber-500 to-amber-600"
        },
        {
            title: "Tổng chi phí",
            value: "90,000₫",
            icon: DollarSign,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const getStatusIcon = (status: string) => {
        if (status === "Hoàn thành") return <CheckCircle className="h-4 w-4 text-emerald-600" />;
        return <Clock className="h-4 w-4 text-amber-600" />;
    };

    const getStatusColor = (status: string) => {
        if (status === "Hoàn thành") return "bg-emerald-100 text-emerald-800";
        return "bg-amber-100 text-amber-800";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Lịch sử gửi xe</h1>
                        <p className="text-cyan-100 text-lg">Theo dõi tất cả hoạt động gửi xe của bạn</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-full">
                        <History className="h-8 w-8" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            {historyData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                <Car className="h-5 w-5 text-cyan-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{item.plateNumber}</div>
                                                <div className="text-sm text-gray-500">{item.brand} {item.model}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{item.checkIn}</td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{item.checkOut}</td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">{item.fee}</td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getStatusIcon(item.status)}
                                            <span className={`ml-2 inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 