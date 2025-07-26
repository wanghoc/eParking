import { Car, Plus, Edit, Trash2 } from "lucide-react";

export function VehiclesPage() {
    const vehicles = [
        {
            id: 1,
            plateNumber: "29A-12345",
            type: "Xe máy",
            brand: "Honda",
            model: "Wave Alpha",
            status: "Đang gửi",
            lastUsed: "2024-01-15 10:30"
        },
        {
            id: 2,
            plateNumber: "30F-67890",
            type: "Xe máy",
            brand: "Yamaha",
            model: "Exciter 150",
            status: "Đã lấy",
            lastUsed: "2024-01-15 11:15"
        },
        {
            id: 3,
            plateNumber: "51G-54321",
            type: "Ô tô",
            brand: "Toyota",
            model: "Vios",
            status: "Đang gửi",
            lastUsed: "2024-01-15 09:00"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quản lý phương tiện</h1>
                    <p className="text-gray-600">Danh sách các phương tiện đã đăng ký</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Thêm phương tiện</span>
                </button>
            </div>

            {/* Vehicles List */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Danh sách phương tiện</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Biển số
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại xe
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hãng/Model
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lần cuối sử dụng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vehicles.map((vehicle) => (
                                <tr key={vehicle.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <Car className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{vehicle.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{vehicle.brand} {vehicle.model}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vehicle.status === "Đang gửi"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {vehicle.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {vehicle.lastUsed}
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
        </div>
    );
} 