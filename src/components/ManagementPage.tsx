import { MapPin, Car, Users, Clock, AlertCircle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";

export function ManagementPage() {
    const parkingLots = [
        {
            id: 1,
            name: "Bãi xe A",
            location: "Tầng 1 - Tòa nhà chính",
            totalSpaces: 50,
            availableSpaces: 12,
            occupiedSpaces: 38,
            status: "Hoạt động",
            hourlyRate: "2,000₫/giờ",
            manager: "Nguyễn Văn A"
        },
        {
            id: 2,
            name: "Bãi xe B",
            location: "Tầng 2 - Tòa nhà chính",
            totalSpaces: 30,
            availableSpaces: 5,
            occupiedSpaces: 25,
            status: "Hoạt động",
            hourlyRate: "2,000₫/giờ",
            manager: "Trần Thị B"
        },
        {
            id: 3,
            name: "Bãi xe C",
            location: "Tầng 3 - Tòa nhà chính",
            totalSpaces: 40,
            availableSpaces: 20,
            occupiedSpaces: 20,
            status: "Bảo trì",
            hourlyRate: "2,000₫/giờ",
            manager: "Lê Văn C"
        }
    ];

    const recentActivities = [
        {
            id: 1,
            type: "Xe vào bãi",
            plateNumber: "29A-12345",
            location: "Bãi xe A",
            time: "10:30 AM",
            status: "Thành công"
        },
        {
            id: 2,
            type: "Xe ra bãi",
            plateNumber: "30F-67890",
            location: "Bãi xe B",
            time: "11:15 AM",
            status: "Thành công"
        },
        {
            id: 3,
            type: "Bảo trì",
            location: "Bãi xe C",
            time: "09:00 AM",
            status: "Đang thực hiện"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quản lý bãi xe</h1>
                    <p className="text-gray-600">Theo dõi và quản lý các bãi xe</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Thêm bãi xe</span>
                </button>
            </div>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 p-2 rounded-full">
                            <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng bãi xe</p>
                            <p className="text-xl font-semibold text-gray-900">3</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-500 p-2 rounded-full">
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng chỗ đỗ</p>
                            <p className="text-xl font-semibold text-gray-900">120</p>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-500 p-2 rounded-full">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Đang sử dụng</p>
                            <p className="text-xl font-semibold text-gray-900">83</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-500 p-2 rounded-full">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tỷ lệ sử dụng</p>
                            <p className="text-xl font-semibold text-gray-900">69%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách bãi xe */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Danh sách bãi xe</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên bãi xe
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vị trí
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sức chứa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đang sử dụng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Giá vé
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quản lý
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {parkingLots.map((lot) => (
                                <tr key={lot.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{lot.name}</div>
                                                <div className="text-sm text-gray-500">{lot.location}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lot.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{lot.totalSpaces} chỗ</div>
                                        <div className="text-sm text-gray-500">{lot.availableSpaces} còn trống</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${(lot.occupiedSpaces / lot.totalSpaces) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-900">{lot.occupiedSpaces}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lot.hourlyRate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lot.status === "Hoạt động"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                            }`}>
                                            {lot.status === "Hoạt động" ? (
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {lot.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lot.manager}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hoạt động gần đây */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${activity.type === "Xe vào bãi" ? "bg-green-100" :
                                        activity.type === "Xe ra bãi" ? "bg-blue-100" : "bg-yellow-100"
                                        }`}>
                                        {activity.type === "Xe vào bãi" ? (
                                            <Car className="h-4 w-4 text-green-600" />
                                        ) : activity.type === "Xe ra bãi" ? (
                                            <Car className="h-4 w-4 text-blue-600" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{activity.type}</p>
                                        <p className="text-sm text-gray-500">
                                            {activity.plateNumber && `${activity.plateNumber} - `}{activity.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">{activity.time}</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activity.status === "Thành công"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                        }`}>
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 