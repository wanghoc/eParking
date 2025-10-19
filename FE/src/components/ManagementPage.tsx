import { Building2, Bike, DollarSign, Activity, X, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiUrl } from "../api";
import { LiveCameraModal } from "./LiveCameraModal";

interface ParkingLot {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    fee_per_turn: number;
    status: string;
}

interface RecentActivity {
    id: string;
    type: string;
    plateNumber: string;
    time: string;
    location: string;
    recognitionMethod: string;
}


interface DashboardStats {
    vehiclesIn: number;
    vehiclesOut: number;
    revenue: number;
    accuracy: number;
}

export function ManagementPage() {
    const [selectedTab, setSelectedTab] = useState("parking");
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showManualCheckIn, setShowManualCheckIn] = useState(false);
    const [showManualCheckOut, setShowManualCheckOut] = useState(false);
    const [showAddParkingLot, setShowAddParkingLot] = useState(false);
    const [showEditParkingLot, setShowEditParkingLot] = useState(false);
    const [editingParkingLot, setEditingParkingLot] = useState<ParkingLot | null>(null);
    const [newParkingLot, setNewParkingLot] = useState({
        name: '',
        capacity: '',
        status: 'Hoạt động'
    });
    const [licensePlate, setLicensePlate] = useState("");
    const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        vehiclesIn: 0,
        vehiclesOut: 0,
        revenue: 0,
        accuracy: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [lotsRes, activitiesRes] = await Promise.all([
                fetch(apiUrl('/parking-lots/overview')),
                fetch(apiUrl('/activities/recent'))
            ]);

            if (lotsRes.ok) {
                const lotsData = await lotsRes.json();
                setParkingLots(lotsData);
            }
            
            if (activitiesRes.ok) {
                const activitiesData = await activitiesRes.json();
                setActivities(activitiesData);
                
                // Calculate stats from activities
                const today = new Date().toISOString().split('T')[0];
                const todayActivities = activitiesData.filter((a: RecentActivity) => 
                    a.time.startsWith(today)
                );
                
                const vehiclesIn = todayActivities.filter((a: RecentActivity) => 
                    a.type === 'Xe vào bãi'
                ).length;
                
                const vehiclesOut = todayActivities.filter((a: RecentActivity) => 
                    a.type === 'Xe ra bãi'
                ).length;
                
                const autoRecognition = todayActivities.filter((a: RecentActivity) => 
                    a.recognitionMethod === 'Tự động'
                ).length;
                
                setStats({
                    vehiclesIn,
                    vehiclesOut,
                    revenue: vehiclesOut * 2000, // 2000 VND per vehicle
                    accuracy: todayActivities.length > 0 
                        ? Math.round((autoRecognition / todayActivities.length) * 100) 
                        : 0
                });
            }
            
        } catch (error) {
            console.error('Failed to load management data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!licensePlate) {
            alert('Vui lòng nhập biển số xe!');
            return;
        }

        try {
            const response = await fetch(apiUrl('/parking-sessions/check-in'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_plate: licensePlate,
                    lot_id: selectedLotId,
                    recognition_method: 'Thủ công'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Check-in thành công!');
                setLicensePlate('');
                setShowManualCheckIn(false);
                loadData(); // Reload data
            } else {
                alert(data.message || 'Lỗi check-in!');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleCheckOut = async () => {
        if (!licensePlate) {
            alert('Vui lòng nhập biển số xe!');
            return;
        }

        try {
            const response = await fetch(apiUrl('/parking-sessions/check-out'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_plate: licensePlate
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(`Check-out thành công! Phí: ${data.fee.toLocaleString()}₫`);
                setLicensePlate('');
                setShowManualCheckOut(false);
                loadData(); // Reload data
            } else {
                alert(data.message || 'Lỗi check-out!');
            }
        } catch (error) {
            console.error('Check-out error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleAddParkingLot = async () => {
        if (!newParkingLot.name || !newParkingLot.capacity) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            const response = await fetch(apiUrl('/parking-lots'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newParkingLot.name,
                    capacity: parseInt(newParkingLot.capacity),
                    status: newParkingLot.status
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Thêm bãi xe thành công!');
                setNewParkingLot({
                    name: '',
                    capacity: '',
                    status: 'Hoạt động'
                });
                setShowAddParkingLot(false);
                loadData(); // Reload data
            } else {
                alert(data.message || 'Lỗi khi thêm bãi xe!');
            }
        } catch (error) {
            console.error('Add parking lot error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleEditParkingLot = (lot: ParkingLot) => {
        setEditingParkingLot(lot);
        setShowEditParkingLot(true);
    };

    const handleUpdateParkingLot = async () => {
        if (!editingParkingLot || !editingParkingLot.name || !editingParkingLot.capacity) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            const response = await fetch(apiUrl(`/parking-lots/${editingParkingLot.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingParkingLot.name,
                    capacity: editingParkingLot.capacity,
                    status: editingParkingLot.status
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Cập nhật bãi xe thành công!');
                setShowEditParkingLot(false);
                setEditingParkingLot(null);
                loadData(); // Reload data
            } else {
                alert(data.message || 'Lỗi khi cập nhật bãi xe!');
            }
        } catch (error) {
            console.error('Update parking lot error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleDeleteParkingLot = async (lot: ParkingLot) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bãi xe "${lot.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(apiUrl(`/parking-lots/${lot.id}`), {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Xóa bãi xe thành công!');
                loadData(); // Reload data
            } else {
                alert(data.message || 'Lỗi khi xóa bãi xe!');
            }
        } catch (error) {
            console.error('Delete parking lot error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const getStatusColor = (status: string) => {
        if (status === "Hoạt động") return "bg-emerald-100 text-emerald-800";
        return "bg-red-100 text-red-800";
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-2xl p-4 lg:p-8 text-white shadow-2xl overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Quản lý bãi xe</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">Quản lý thông tin bãi xe</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Xe vào hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.vehiclesIn}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                            <Bike className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Xe ra hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.vehiclesOut}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                            <Bike className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Doanh thu hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.revenue.toLocaleString()}₫</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Độ chính xác</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.accuracy}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setSelectedTab("parking")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "parking"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Quản lý bãi xe
                        </button>
                        <button
                            onClick={() => setSelectedTab("activities")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "activities"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Hoạt động gần đây
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {selectedTab === "parking" && (
                        <div className="space-y-6">
                            {/* Parking Lots */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Quản lý bãi xe</h2>
                                        <button
                                            onClick={() => setShowAddParkingLot(true)}
                                            className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Thêm bãi xe
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Bãi xe
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Sức chứa
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Đã sử dụng
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        Đang tải dữ liệu...
                                                    </td>
                                                </tr>
                                            ) : parkingLots.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        Chưa có bãi xe nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                parkingLots.map((lot) => (
                                                    <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-6 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                                    <Building2 className="h-5 w-5 text-cyan-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{lot.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            {lot.capacity} xe
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            <div className="flex items-center">
                                                                <span className="font-semibold">{lot.occupied}/{lot.capacity}</span>
                                                                <div className="ml-3 w-24 bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-cyan-500 h-2 rounded-full transition-all"
                                                                        style={{ width: `${(lot.occupied / lot.capacity) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                                                                {lot.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handleEditParkingLot(lot)}
                                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors duration-200"
                                                                >
                                                                    <Edit className="h-3 w-3 mr-1" />
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteParkingLot(lot)}
                                                                    className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors duration-200"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                    Xóa
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
                        </div>
                    )}

                    {selectedTab === "activities" && (
                        <div className="space-y-6">
                            {/* Recent Activities */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Hoạt động
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Biển số
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vị trí
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phương thức
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        Đang tải dữ liệu...
                                                    </td>
                                                </tr>
                                            ) : activities.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        Chưa có hoạt động nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                activities.map((activity) => (
                                                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-6 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className={`p-2 rounded-lg ${activity.type === "Xe vào bãi" ? "bg-emerald-100" : "bg-blue-100"}`}>
                                                                    <Bike className={`h-4 w-4 ${activity.type === "Xe vào bãi" ? "text-emerald-600" : "text-blue-600"}`} />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">{activity.type}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {activity.plateNumber}
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            {activity.location}
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDateTime(activity.time)}
                                                        </td>
                                                        <td className="px-6 py-6 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activity.recognitionMethod === "Tự động" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                                                {activity.recognitionMethod}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Camera Modal */}
            {showCameraModal && (
                <LiveCameraModal
                    isOpen={showCameraModal}
                    onClose={() => setShowCameraModal(false)}
                    cameraCount={0}
                />
            )}

            {/* Manual Check-In Modal */}
            {showManualCheckIn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Nhập xe thủ công</h3>
                            <button
                                onClick={() => setShowManualCheckIn(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Biển số xe</label>
                                <input
                                    type="text"
                                    value={licensePlate}
                                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Ví dụ: 49P1-12345"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bãi xe</label>
                                <select
                                    value={selectedLotId || ''}
                                    onChange={(e) => setSelectedLotId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="">Chọn bãi xe</option>
                                    {parkingLots.map(lot => (
                                        <option key={lot.id} value={lot.id}>{lot.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowManualCheckIn(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCheckIn}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Check-Out Modal */}
            {showManualCheckOut && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Xuất xe thủ công</h3>
                            <button
                                onClick={() => setShowManualCheckOut(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Biển số xe</label>
                                <input
                                    type="text"
                                    value={licensePlate}
                                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Ví dụ: 49P1-12345"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowManualCheckOut(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCheckOut}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Parking Lot Modal */}
            {showAddParkingLot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Thêm bãi xe mới</h3>
                            <button
                                onClick={() => setShowAddParkingLot(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên bãi xe</label>
                                <input
                                    type="text"
                                    value={newParkingLot.name}
                                    onChange={(e) => setNewParkingLot({...newParkingLot, name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập tên bãi xe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sức chứa</label>
                                <input
                                    type="number"
                                    value={newParkingLot.capacity}
                                    onChange={(e) => setNewParkingLot({...newParkingLot, capacity: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập sức chứa"
                                    min="1"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                <select
                                    value={newParkingLot.status}
                                    onChange={(e) => setNewParkingLot({...newParkingLot, status: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="Hoạt động">Hoạt động</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowAddParkingLot(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddParkingLot}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Thêm bãi xe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Parking Lot Modal */}
            {showEditParkingLot && editingParkingLot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Sửa bãi xe</h3>
                            <button
                                onClick={() => setShowEditParkingLot(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên bãi xe</label>
                                <input
                                    type="text"
                                    value={editingParkingLot.name}
                                    onChange={(e) => setEditingParkingLot({...editingParkingLot, name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập tên bãi xe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sức chứa</label>
                                <input
                                    type="number"
                                    value={editingParkingLot.capacity}
                                    onChange={(e) => setEditingParkingLot({...editingParkingLot, capacity: parseInt(e.target.value)})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập sức chứa"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                <select
                                    value={editingParkingLot.status}
                                    onChange={(e) => setEditingParkingLot({...editingParkingLot, status: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="Hoạt động">Hoạt động</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowEditParkingLot(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateParkingLot}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
