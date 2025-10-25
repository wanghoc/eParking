import { Shield, Users, Edit, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "../api";

interface User {
    id: number;
    name: string;
    studentId: string;
    phone: string;
    vehicles: number;
    balance: number;
}

interface VehicleRow {
    id: number;
    license_plate: string;
    brand?: string | null;
    model?: string | null;
    vehicle_type: string;
    created_at: string;
    owner: { id: number | null; name: string; mssv: string };
    status: string;
}

export function AdminPage() {
    const [selectedTab, setSelectedTab] = useState("users");
    const [searchTerm, setSearchTerm] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [deleteAdminPassword, setDeleteAdminPassword] = useState("");

    const [users, setUsers] = useState<User[]>([]);
    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Payment settings state
    const [feePerTurn, setFeePerTurn] = useState("2000");
    const [minTopup, setMinTopup] = useState("10000");
    const [maxTopup, setMaxTopup] = useState("1000000");
    const [lowBalanceThreshold, setLowBalanceThreshold] = useState("5000");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const [uRes, vRes, settingsRes] = await Promise.all([
                    fetch(apiUrl('/admin/users')),
                    fetch(apiUrl('/admin/vehicles')),
                    fetch(apiUrl('/system-settings'))
                ]);
                if (uRes.ok) setUsers(await uRes.json());
                if (vRes.ok) setVehicles(await vRes.json());
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    if (settings.fee_per_turn) setFeePerTurn(settings.fee_per_turn.toString());
                    if (settings.min_topup) setMinTopup(settings.min_topup.toString());
                    if (settings.max_topup) setMaxTopup(settings.max_topup.toString());
                    if (settings.low_balance_threshold) setLowBalanceThreshold(settings.low_balance_threshold.toString());
                }
            } catch (e) {
                console.error('Failed to fetch admin data', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // const systemLogs = [
    //     {
    //         id: 1,
    //         action: "Nhận diện biển số",
    //         user: "Hệ thống",
    //         time: "2024-01-15 10:30",
    //         type: "Recognition"
    //     },
    //     {
    //         id: 2,
    //         action: "Trừ phí gửi xe",
    //         user: "Hệ thống",
    //         time: "2024-01-15 09:15",
    //         type: "Payment"
    //     },
    //     {
    //         id: 3,
    //         action: "Nạp tiền thành công",
    //         user: "Triệu Quang Học",
    //         time: "2024-01-15 08:45",
    //         type: "Payment"
    //     },
    //     {
    //         id: 4,
    //         action: "Đăng ký xe mới",
    //         user: "Nguyễn Văn A",
    //         time: "2024-01-15 08:30",
    //         type: "Vehicle"
    //     }
    // ];

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        (user.studentId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.phone?.includes(searchTerm) || false)
    );

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setNewBalance(user.balance.toString());
        setShowEditModal(true);
    };

    const handleUpdateBalance = async () => {
        if (!adminPassword) {
            alert("Vui lòng nhập mật khẩu admin để xác nhận!");
            return;
        }
        if (!newBalance || isNaN(Number(newBalance))) {
            alert("Vui lòng nhập số dư hợp lệ!");
            return;
        }
        
        try {
            const response = await fetch(apiUrl(`/admin/users/${selectedUser?.id}/balance`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newBalance: Number(newBalance),
                    adminPassword: adminPassword
                })
            });
            
            if (response.ok) {
                alert("Cập nhật số dư thành công!");
                setShowEditModal(false);
                setSelectedUser(null);
                setNewBalance("");
                setAdminPassword("");
                // Reload users list
                const load = async () => {
                    try {
                        setIsLoading(true);
                        const uRes = await fetch(apiUrl('/admin/users'));
                        if (uRes.ok) setUsers(await uRes.json());
                    } catch (e) {
                        console.error('Failed to fetch admin data', e);
                    } finally {
                        setIsLoading(false);
                    }
                };
                load();
            } else {
                const data = await response.json();
                alert(data.message || 'Lỗi khi cập nhật số dư!');
            }
        } catch (error) {
            console.error('Update balance error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteAdminPassword) {
            alert("Vui lòng nhập mật khẩu admin để xác nhận!");
            return;
        }
        
        try {
            const response = await fetch(apiUrl(`/admin/users/${selectedUser?.id}`), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminPassword: deleteAdminPassword
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                alert(data.message || "Xóa tài khoản thành công!");
                setShowDeleteModal(false);
                setSelectedUser(null);
                setDeleteAdminPassword("");
                // Reload users list
                const load = async () => {
                    try {
                        setIsLoading(true);
                        const uRes = await fetch(apiUrl('/admin/users'));
                        if (uRes.ok) setUsers(await uRes.json());
                    } catch (e) {
                        console.error('Failed to fetch admin data', e);
                    } finally {
                        setIsLoading(false);
                    }
                };
                load();
            } else {
                const data = await response.json();
                alert(data.message || 'Lỗi khi xóa tài khoản!');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Lỗi kết nối server!');
        }
    };

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            const response = await fetch(apiUrl('/system-settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        fee_per_turn: parseFloat(feePerTurn),
                        min_topup: parseFloat(minTopup),
                        max_topup: parseFloat(maxTopup),
                        low_balance_threshold: parseFloat(lowBalanceThreshold)
                    }
                })
            });
            
            if (response.ok) {
                alert('Lưu cấu hình thành công!');
            } else {
                const data = await response.json();
                alert(data.message || 'Lỗi khi lưu cấu hình!');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            alert('Lỗi kết nối server!');
        } finally {
            setIsSavingSettings(false);
        }
    };

    // const getLogIcon = (type: string) => {
    //     if (type === "Recognition") return <Camera className="h-4 w-4 text-cyan-600" />;
    //     if (type === "Payment") return <DollarSign className="h-4 w-4 text-emerald-600" />;
    //     return <Bike className="h-4 w-4 text-violet-600" />;
    // };

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
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Quản trị hệ thống</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">Quản lý toàn bộ hệ thống eParking</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                        <Shield className="h-6 w-6 lg:h-8 lg:w-8 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setSelectedTab("users")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "users"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Quản lý người dùng
                        </button>
                        <button
                            onClick={() => setSelectedTab("vehicles")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "vehicles"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Quản lý phương tiện
                        </button>
                        <button
                            onClick={() => setSelectedTab("payment-config")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "payment-config"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Cấu hình thanh toán
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {selectedTab === "users" && (
                        <div className="space-y-6">
                            {/* Users Management */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h2>
                                        <div className="relative w-80">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm theo MSSV hoặc SĐT..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Người dùng
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    MSSV
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số điện thoại
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số xe
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số dư
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(isLoading ? [] : filteredUsers).map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-cyan-100 p-3 rounded-full mr-4">
                                                                <Users className="h-5 w-5 text-cyan-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.studentId}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.phone}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {user.vehicles} xe
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.balance.toLocaleString()}₫
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button 
                                                                onClick={() => handleEditUser(user)}
                                                                className="text-cyan-600 hover:text-cyan-900 transition-colors"
                                                                title="Chỉnh sửa số dư"
                                                            >
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                                title="Xóa tài khoản"
                                                                disabled={user.balance !== 0}
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
                        </div>
                    )}

                    {selectedTab === "vehicles" && (
                        <div className="space-y-6">
                            {/* Vehicles Management */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Quản lý phương tiện</h2>
                                        <div className="relative w-80">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm theo MSSV hoặc biển số..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biển số</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ sở hữu</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhãn hiệu/Mẫu</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(isLoading ? [] : vehicles.filter(v => 
                                                (v.owner?.mssv?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                                (v.license_plate?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                                            )).map(v => (
                                                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{v.license_plate}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{v.owner?.name || '-'}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{v.owner?.mssv || '-'}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{v.brand || '-'} / {v.model || '-'}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">{new Date(v.created_at).toLocaleString('vi-VN')}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">{v.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "payment-config" && (
                        <div className="space-y-6">
                            {/* Payment Configuration */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Cấu hình thanh toán</h2>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Cài đặt phí gửi xe</h3>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-blue-800">
                                                            Phí gửi xe toàn hệ thống
                                                        </h3>
                                                        <div className="mt-2 text-sm text-blue-700">
                                                            <p>Phí gửi xe này sẽ áp dụng cho TẤT CẢ các bãi xe trong hệ thống. Khi bạn thay đổi mức phí ở đây, tất cả các bãi xe (hiện tại và tương lai) sẽ tự động sử dụng mức phí mới.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">Phí gửi xe mỗi lượt</span>
                                                        <span className="text-xs text-gray-500 mt-1">Áp dụng cho tất cả bãi xe</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="number" 
                                                            value={feePerTurn} 
                                                            onChange={(e) => setFeePerTurn(e.target.value)}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                                        />
                                                        <span className="text-sm text-gray-600">₫/lượt</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Ngưỡng cảnh báo số dư thấp</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="number" 
                                                            value={lowBalanceThreshold} 
                                                            onChange={(e) => setLowBalanceThreshold(e.target.value)}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                                        />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Số tiền nạp tối thiểu</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="number" 
                                                            value={minTopup} 
                                                            onChange={(e) => setMinTopup(e.target.value)}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                                        />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Số tiền nạp tối đa</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="number" 
                                                            value={maxTopup} 
                                                            onChange={(e) => setMaxTopup(e.target.value)}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" 
                                                        />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Phương thức thanh toán</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-emerald-800">Momo</span>
                                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Hoạt động</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-blue-800">VNPay</span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Hoạt động</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-600">ZaloPay</span>
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Tạm ngưng</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button 
                                                onClick={handleSaveSettings}
                                                disabled={isSavingSettings}
                                                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Balance Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa số dư</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người dùng: <span className="font-semibold">{selectedUser.name}</span>
                                </label>
                                <label className="block text-sm text-gray-600 mb-4">
                                    MSSV: {selectedUser.studentId} | SĐT: {selectedUser.phone}
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số dư hiện tại: <span className="text-emerald-600 font-semibold">{selectedUser.balance.toLocaleString()}₫</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số dư mới</label>
                                <input
                                    type="number"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập số dư mới"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu Admin (xác nhận)</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="Nhập mật khẩu admin"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateBalance}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Cập nhật số dư
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete User Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-red-600">Xóa tài khoản</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Cảnh báo: Hành động này không thể hoàn tác!
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người dùng sẽ bị xóa: <span className="font-semibold text-red-600">{selectedUser.name}</span>
                                </label>
                                <label className="block text-sm text-gray-600 mb-4">
                                    MSSV: {selectedUser.studentId} | SĐT: {selectedUser.phone}
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số dư hiện tại: <span className="text-emerald-600 font-semibold">{selectedUser.balance.toLocaleString()}₫</span>
                                </label>
                                {selectedUser.balance !== 0 && (
                                    <p className="text-sm text-red-600 mt-1">
                                        ⚠️ Chỉ có thể xóa tài khoản khi số dư bằng 0₫
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu Admin (xác nhận)</label>
                                <input
                                    type="password"
                                    value={deleteAdminPassword}
                                    onChange={(e) => setDeleteAdminPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nhập mật khẩu admin"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={selectedUser.balance !== 0}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 