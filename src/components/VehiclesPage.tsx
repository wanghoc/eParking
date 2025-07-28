import { Car, Plus, Edit, Trash2, X } from "lucide-react";
import { useState } from "react";

export function VehiclesPage() {
    const [vehicles, setVehicles] = useState([
        {
            id: 1,
            plateNumber: "29A-12345",
            brand: "Honda",
            model: "Wave Alpha",
            status: "Đang gửi"
        },
        {
            id: 2,
            plateNumber: "30F-67890",
            brand: "Yamaha",
            model: "Exciter 150",
            status: "Đã lấy"
        }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        plateNumber: "",
        brand: "",
        model: ""
    });

    const handleAddVehicle = () => {
        if (newVehicle.plateNumber && newVehicle.brand && newVehicle.model) {
            const vehicle = {
                id: Date.now(),
                ...newVehicle,
                status: "Đã lấy"
            };
            setVehicles([...vehicles, vehicle]);
            setNewVehicle({ plateNumber: "", brand: "", model: "" });
            setShowAddModal(false);
        }
    };

    const handleDeleteVehicle = (id: number) => {
        setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    };

    const canAddVehicle = vehicles.length < 3;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quản lý phương tiện</h1>
                    <p className="text-gray-600">Quản lý danh sách xe máy của bạn</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    disabled={!canAddVehicle}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${canAddVehicle
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm phương tiện</span>
                </button>
            </div>

            {/* Thông báo giới hạn */}
            {vehicles.length >= 3 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3">
                            <Car className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="font-medium text-yellow-800">Đã đạt giới hạn phương tiện</p>
                            <p className="text-sm text-yellow-700">Bạn đã đăng ký tối đa 3 xe máy. Hãy xóa bớt xe để thêm xe mới.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 p-2 rounded-full">
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng xe máy</p>
                            <p className="text-xl font-semibold text-gray-900">{vehicles.length}/3</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-500 p-2 rounded-full">
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Đang gửi</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {vehicles.filter(v => v.status === "Đang gửi").length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-500 p-2 rounded-full">
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Đã lấy</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {vehicles.filter(v => v.status === "Đã lấy").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách phương tiện */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Danh sách xe máy</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phương tiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hãng/Model
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
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
                                                <div className="text-sm text-gray-500">Xe máy</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {vehicle.brand} {vehicle.model}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vehicle.status === "Đang gửi"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {vehicle.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
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

            {/* Modal thêm phương tiện */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Thêm xe máy mới</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Biển số xe *
                                </label>
                                <input
                                    type="text"
                                    value={newVehicle.plateNumber}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                                    placeholder="VD: 29A-12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hãng xe *
                                </label>
                                <input
                                    type="text"
                                    value={newVehicle.brand}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                    placeholder="VD: Honda"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Model *
                                </label>
                                <input
                                    type="text"
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    placeholder="VD: Wave Alpha"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddVehicle}
                                disabled={!newVehicle.plateNumber || !newVehicle.brand || !newVehicle.model}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${newVehicle.plateNumber && newVehicle.brand && newVehicle.model
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Thêm xe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 