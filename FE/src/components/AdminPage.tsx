import { Shield, Users, Car, AlertCircle, Camera, FileText, Settings, CheckCircle, Edit, Trash2, Lock, Unlock, DollarSign, Eye, Search } from "lucide-react";
import { useState } from "react";

interface User {
    id: number;
    name: string;
    studentId: string;
    phone: string;
    vehicles: number;
    balance: number;
}

export function AdminPage() {
    const [selectedTab, setSelectedTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState("");
    const [adminPassword, setAdminPassword] = useState("");

    const systemStats = [
        {
            title: "Tổng người dùng",
            value: "1,247",
            icon: Users,
            color: "bg-gradient-to-r from-cyan-500 to-cyan-600"
        },
        {
            title: "Tổng phương tiện",
            value: "2,156",
            icon: Car,
            color: "bg-gradient-to-r from-emerald-500 to-emerald-600"
        },
        {
            title: "Lỗi nhận diện",
            value: "8",
            icon: AlertCircle,
            color: "bg-gradient-to-r from-amber-500 to-amber-600"
        },
        {
            title: "Camera hoạt động",
            value: "4",
            icon: Camera,
            color: "bg-gradient-to-r from-violet-500 to-violet-600"
        }
    ];

    const users: User[] = [
        {
            id: 1,
            name: "Triệu Quang Học",
            studentId: "2212375",
            phone: "0123456789",
            vehicles: 2,
            balance: 45000
        },
        {
            id: 2,
            name: "Nguyễn Văn A",
            studentId: "2212376",
            phone: "0987654321",
            vehicles: 1,
            balance: 25000
        },
        {
            id: 3,
            name: "Trần Thị B",
            studentId: "2212377",
            phone: "0369852147",
            vehicles: 3,
            balance: 5000
        }
    ];

    const systemLogs = [
        {
            id: 1,
            action: "Nhận diện biển số",
            user: "Hệ thống",
            time: "2024-01-15 10:30",
            type: "Recognition"
        },
        {
            id: 2,
            action: "Trừ phí gửi xe",
            user: "Hệ thống",
            time: "2024-01-15 09:15",
            type: "Payment"
        },
        {
            id: 3,
            action: "Nạp tiền thành công",
            user: "Triệu Quang Học",
            time: "2024-01-15 08:45",
            type: "Payment"
        },
        {
            id: 4,
            action: "Đăng ký xe mới",
            user: "Nguyễn Văn A",
            time: "2024-01-15 08:30",
            type: "Vehicle"
        }
    ];

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
    );

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setNewBalance(user.balance.toString());
        setShowEditModal(true);
    };

    const handleUpdateBalance = () => {
        if (!adminPassword) {
            alert("Vui lòng nhập mật khẩu admin để xác nhận!");
            return;
        }
        if (!newBalance || isNaN(Number(newBalance))) {
            alert("Vui lòng nhập số dư hợp lệ!");
            return;
        }
        
        // Simulate API call to update balance
        console.log(`Updating balance for user ${selectedUser?.id} to ${newBalance}`);
        
        // Reset form
        setShowEditModal(false);
        setSelectedUser(null);
        setNewBalance("");
        setAdminPassword("");
        alert("Cập nhật số dư thành công!");
    };

    const getLogIcon = (type: string) => {
        if (type === "Recognition") return <Camera className="h-4 w-4 text-cyan-600" />;
        if (type === "Payment") return <DollarSign className="h-4 w-4 text-emerald-600" />;
        return <Car className="h-4 w-4 text-violet-600" />;
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
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Quản trị hệ thống</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">Quản lý toàn bộ hệ thống eParking</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 lg:p-4 rounded-full self-start lg:self-auto">
                        <Shield className="h-6 w-6 lg:h-8 lg:w-8 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {systemStats.map((stat, index) => {
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

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setSelectedTab("overview")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "overview"
                                ? "border-cyan-500 text-cyan-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Tổng quan
                        </button>
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
                    {selectedTab === "overview" && (
                        <div className="space-y-6">
                            {/* System Overview */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Tổng quan hệ thống</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-cyan-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Tổng lượt gửi xe</span>
                                                <span className="font-bold text-cyan-600">15,678</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Doanh thu tháng</span>
                                                <span className="font-bold text-emerald-600">31,356,000₫</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-violet-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Độ chính xác TB</span>
                                                <span className="font-bold text-violet-600">96.5%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Lỗi nhận diện</span>
                                                <span className="font-bold text-amber-600">8</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Camera hoạt động</span>
                                                <span className="font-bold text-blue-600">4/4</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                                                <span className="text-sm text-gray-600">Cảnh báo hệ thống</span>
                                                <span className="font-bold text-red-600">3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            {filteredUsers.map((user) => (
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
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Phí gửi xe mỗi lượt</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="2,000" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">₫/lượt</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Ngưỡng cảnh báo số dư thấp</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="5,000" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Số tiền nạp tối thiểu</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="10,000" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                                                        <span className="text-sm text-gray-600">₫</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <span className="text-sm text-gray-700">Số tiền nạp tối đa</span>
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value="1,000,000" className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
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
                                            <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                                Lưu cấu hình
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
        </div>
    );
} 