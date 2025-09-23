import { Car, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../api";

interface Vehicle {
    id: number;
    license_plate: string;
    brand?: string;
    model?: string;
    vehicle_type: string;
    created_at: string;
}

export function VehiclesPage() {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ license_plate: "", brand: "", model: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>("");

    // Fetch vehicles khi component mount
    useEffect(() => {
        if (user?.id) {
            fetchVehicles();
        }
    }, [user?.id]);

    const fetchVehicles = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(apiUrl(`/users/${user.id}/vehicles`));
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            } else {
                setError('Không thể tải danh sách phương tiện');
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setError('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.license_plate || !newVehicle.brand || !newVehicle.model) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (!user?.id) {
            setError('Không tìm thấy thông tin người dùng');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            
            const response = await fetch(apiUrl(`/vehicles`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    license_plate: newVehicle.license_plate,
                    brand: newVehicle.brand,
                    model: newVehicle.model,
                    vehicle_type: 'Xe_may' // Chỉ hỗ trợ xe máy
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Thêm phương tiện thành công');
                setShowAddModal(false);
                setNewVehicle({ license_plate: "", brand: "", model: "" });
                fetchVehicles(); // Reload danh sách
                setTimeout(() => window.location.reload(), 400);
            } else {
                setError(result.message || 'Không thể thêm phương tiện');
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            setError('Không thể kết nối đến server');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteVehicle = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) {
            return;
        }

        try {
            const response = await fetch(apiUrl(`/vehicles/${id}`), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                fetchVehicles(); // Reload danh sách
                // Auto reload trang để đồng bộ
                setTimeout(() => window.location.reload(), 600);
            } else {
                setError(result.message || 'Không thể xóa phương tiện');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            setError('Không thể kết nối đến server');
        }
    };

    const isAddDisabled = vehicles.length >= 3;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Phương tiện</h1>
                            <p className="text-cyan-100 text-base lg:text-lg">Quản lý xe máy đã đăng ký</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                            <Car className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải...</span>
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
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Phương tiện</h1>
                        <p className="text-cyan-100 text-base lg:text-lg">Quản lý xe máy đã đăng ký</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                        <Car className="h-6 w-6 lg:h-8 lg:w-8" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                            {vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">Chưa có phương tiện nào</p>
                                        <p className="text-sm">Nhấn "Thêm phương tiện" để đăng ký xe máy của bạn</p>
                                    </td>
                                </tr>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                    <Car className="h-5 w-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{vehicle.license_plate}</div>
                                                    <div className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {vehicle.license_plate}
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
                                ))
                            )}
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
                                    value={newVehicle.license_plate}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
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

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Lưu ý:</strong> Hệ thống chỉ hỗ trợ đăng ký xe máy.
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewVehicle({ license_plate: "", brand: "", model: "" });
                                    setError('');
                                }}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddVehicle}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang thêm...
                                    </div>
                                ) : (
                                    'Thêm xe'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 