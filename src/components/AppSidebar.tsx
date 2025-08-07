import { Home, Car, History, CreditCard, MapPin, Settings, HelpCircle, Building2, Camera, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

interface AppSidebarProps {
    activeItem: string;
    onItemClick: (item: string) => void;
}

export function AppSidebar({ activeItem, onItemClick }: AppSidebarProps) {
    const { user, logout } = useAuth();
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">eParking</h2>
                        <p className="text-sm text-gray-500">Quản lý bãi xe</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-cyan-100 text-cyan-700">
                            {user ? getInitials(user.fullName) : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-sm text-gray-500">
                            {user?.studentId || user?.email}
                        </p>
                        <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                            </span>
                        </div>
                    </div>
                </div>
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
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeItem === item.id
                                        ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                                        : "hover:bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
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
        </div>
    );
} 