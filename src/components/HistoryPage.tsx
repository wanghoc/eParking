import { Clock, Car, MapPin, Calendar, Filter, Search } from "lucide-react";

export function HistoryPage() {
    const historyData = [
        {
            id: 1,
            plateNumber: "29A-12345",
            type: "Xe máy",
            location: "Bãi xe A - Tầng 1",
            checkIn: "2024-01-15 10:30",
            checkOut: "2024-01-15 16:45",
            duration: "6 giờ 15 phút",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 2,
            plateNumber: "30F-67890",
            type: "Xe máy",
            location: "Bãi xe B - Tầng 2",
            checkIn: "2024-01-14 08:15",
            checkOut: "2024-01-14 18:30",
            duration: "10 giờ 15 phút",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 3,
            plateNumber: "51G-54321",
            type: "Xe máy",
            location: "Bãi xe C - Tầng 3",
            checkIn: "2024-01-13 14:20",
            checkOut: "2024-01-13 20:45",
            duration: "6 giờ 25 phút",
            fee: "2,000₫",
            status: "Hoàn thành"
        },
        {
            id: 4,
            plateNumber: "29A-12345",
            type: "Xe máy",
            location: "Bãi xe A - Tầng 1",
            checkIn: "2024-01-12 09:00",
            checkOut: "2024-01-12 17:30",
            duration: "8 giờ 30 phút",
            fee: "2,000₫",
            status: "Hoàn thành"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Lịch sử gửi xe</h1>
                    <p className="text-gray-600">Xem lại các lần gửi xe và chi phí</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
                        <Filter className="h-4 w-4" />
                        <span>Lọc</span>
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
                        <Search className="h-4 w-4" />
                        <span>Tìm kiếm</span>
                    </button>
                </div>
            </div>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 p-2 rounded-full">
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng lần gửi</p>
                            <p className="text-xl font-semibold text-gray-900">127</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-500 p-2 rounded-full">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Thời gian TB</p>
                            <p className="text-xl font-semibold text-gray-900">6.5h</p>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-500 p-2 rounded-full">
                            <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Bãi xe ưa thích</p>
                            <p className="text-xl font-semibold text-gray-900">Bãi A</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-500 p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tháng này</p>
                            <p className="text-xl font-semibold text-gray-900">23 lần</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bảng lịch sử */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Lịch sử gửi xe</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phương tiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vị trí
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian vào
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian ra
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian gửi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chi phí
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {historyData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <Car className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{item.plateNumber}</div>
                                                <div className="text-sm text-gray-500">{item.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">{item.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.checkIn}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.checkOut}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.duration}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{item.fee}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {item.status}
                                        </span>
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