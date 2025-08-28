import { Home, Car, History, CreditCard, MapPin, Settings, HelpCircle, Building2, Camera, LogOut, User } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { ProfileModal } from "./ProfileModal";
import { useState } from "react";

interface AppSidebarProps {
    activeItem: string;
    onItemClick: (item: string) => void;
}

export function AppSidebar({ activeItem, onItemClick }: AppSidebarProps) {
    const { user, logout } = useAuth();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuItems = [
        { id: "home", label: "Trang chủ", icon: Home },
        { id: "vehicles", label: "Phương tiện", icon: Car },
        { id: "history", label: "Lịch sử gửi xe", icon: History },
        { id: "payment", label: "Nạp tiền", icon: CreditCard },
        { id: "management", label: "Quản lý bãi xe", icon: MapPin },
        ...(user?.role === 'admin' ? [
            { id: "camera", label: "Quản lý Camera", icon: Camera },
            { id: "admin", label: "Quản trị hệ thống", icon: Settings },
        ] : []),
        { id: "faq", label: "FAQ", icon: HelpCircle },
    ];

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };


    return (
        <div className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 h-full flex flex-col shadow-lg">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl border border-white border-opacity-30">
                        <Building2 className="h-7 w-7 text-white drop-shadow-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white drop-shadow-md">eParking</h2>
                        <p className="text-sm text-cyan-100">Quản lý bãi xe thông minh</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-200">
                <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors group"
                    onClick={() => setShowProfileModal(true)}
                >
                    <Avatar className="group-hover:ring-2 group-hover:ring-cyan-200 transition-all">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200">
                            <User className="h-5 w-5" />
                        </div>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 group-hover:text-cyan-700 transition-colors">{user?.fullName}</p>
                            <User className="h-4 w-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                            {user?.studentId || user?.email}
                        </p>
                        <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 group-hover:bg-purple-200'
                                : 'bg-green-100 text-green-800 group-hover:bg-green-200'
                                } transition-colors`}>
                                {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Nhấn để quản lý tài khoản</p>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onItemClick(item.id)}
                                    className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${activeItem === item.id
                                        ? "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border border-cyan-200 shadow-md"
                                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-600 hover:text-gray-800 hover:shadow-sm"
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 transition-all duration-300 ${activeItem === item.id ? "text-cyan-600" : "text-gray-500 group-hover:text-gray-700"}`} />
                                    <span className="font-medium">{item.label}</span>
                                    {activeItem === item.id && (
                                        <div className="ml-auto w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-gray-200">
                {showLogoutConfirm ? (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-700 text-center">Bạn có chắc muốn đăng xuất?</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleLogout}
                                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                Đăng xuất
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Đăng xuất</span>
                    </button>
                )}
            </div>

            {/* Profile Modal */}
            <ProfileModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
            />
        </div>
    );
} 