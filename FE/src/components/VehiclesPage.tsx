import { Car, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export function VehiclesPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ plateNumber: "", brand: "", model: "" });

    const vehicles = [
        {
            id: 1,
            plateNumber: "49P1-12345",
            brand: "Honda",
            model: "Wave Alpha"
        },
        {
            id: 2,
            plateNumber: "49P2-67890",
            brand: "Yamaha",
            model: "Exciter 150"
        }
    ];

    const handleAddVehicle = () => {
        if (newVehicle.plateNumber && newVehicle.brand && newVehicle.model) {
            // Logic thêm xe
            setShowAddModal(false);
            setNewVehicle({ plateNumber: "", brand: "", model: "" });
        }
    };

    const handleDeleteVehicle = (id: number) => {
        // Logic xóa xe
    };

    const isAddDisabled = vehicles.length >= 3;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Phương tiện</h1>
                        <p className="text-cyan-100 text-lg">Quản lý xe máy đã đăng ký</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-full">
                        <Car className="h-8 w-8" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Tổng xe đã đăng ký</p>
                            <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                            <Car className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Giới hạn xe</p>
                            <p className="text-2xl font-bold text-gray-900">3 xe</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Còn lại</p>
                            <p className="text-2xl font-bold text-gray-900">{3 - vehicles.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg">
                            <Plus className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicles List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Danh sách phương tiện</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            disabled={isAddDisabled}
                            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ${isAddDisabled
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-lg hover:shadow-xl"
                                }`}
                        >
                            <Plus className="h-4 w-4" />
                            <span>Thêm phương tiện</span>
                        </button>
                    </div>
                </div>

                {isAddDisabled && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                            <div className="ml-3">
                                <p className="text-sm text-amber-700">
                                    Bạn đã đăng ký tối đa 3 phương tiện. Vui lòng xóa một phương tiện để thêm mới.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phương tiện
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Biển số
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hãng/Model
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vehicles.map((vehicle) => (
                                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                <Car className="h-5 w-5 text-cyan-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                                                <div className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {vehicle.plateNumber}
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                        {vehicle.brand} {vehicle.model}
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button className="text-cyan-600 hover:text-cyan-900 transition-colors">
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                            >
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

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Thêm phương tiện mới</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Biển số xe</label>
                                <input
                                    type="text"
                                    value={newVehicle.plateNumber}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Ví dụ: 49P1-12345"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hãng xe</label>
                                <input
                                    type="text"
                                    value={newVehicle.brand}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Ví dụ: Honda"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Ví dụ: Wave Alpha"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddVehicle}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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