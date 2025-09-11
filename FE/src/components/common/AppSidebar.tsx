import { Home, Car, History, CreditCard, MapPin, Settings, HelpCircle, Building2, Camera, LogOut, User } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { useAuth } from "../../contexts/AuthContext";

interface AppSidebarProps {
    activeItem: string;
    onItemClick: (item: string) => void;
    onClose?: () => void;
    onProfileClick: () => void;
}

export function AppSidebar({ activeItem, onItemClick, onClose, onProfileClick }: AppSidebarProps) {
    const { user } = useAuth();

    const menuItems = [
        { id: "home", label: "Trang chủ", icon: Home },
        { id: "vehicles", label: "Phương tiện", icon: Car },
        { id: "history", label: "Lịch sử gửi xe", icon: History },
        ...(user?.role !== 'admin' ? [{ id: "payment", label: "Nạp tiền", icon: CreditCard }] : []),
        { id: "management", label: "Quản lý bãi xe", icon: MapPin },
        ...(user?.role === 'admin' ? [
            { id: "camera", label: "Quản lý Camera", icon: Camera },
            { id: "admin", label: "Quản trị hệ thống", icon: Settings },
        ] : []),
        { id: "faq", label: "FAQ", icon: HelpCircle },
    ];




    return (
        <div className="w-64 lg:w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 h-full flex flex-col shadow-lg">
            {/* Mobile Close Button */}
            {onClose && (
                <div className="lg:hidden p-3 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600">
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-between text-white"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-lg border border-white border-opacity-30">
                                <img 
                                    src="/img/DLU_logo.png" 
                                    alt="DLU Logo" 
                                    className="h-6 w-6 object-contain drop-shadow-lg"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white drop-shadow-md">eParking</h2>
                                <p className="text-xs text-cyan-100">Quản lý bãi xe thông minh</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Logo */}
            <div className={`${onClose ? 'hidden lg:block' : ''} p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600`}>
                <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 lg:p-3 rounded-xl border border-white border-opacity-30">
                        <img 
                            src="/img/DLU_logo.png" 
                            alt="DLU Logo" 
                            className="h-8 w-8 lg:h-10 lg:w-10 object-contain drop-shadow-lg"
                        />
                    </div>
                    <div>
                        <h2 className="text-lg lg:text-xl font-bold text-white drop-shadow-md">eParking</h2>
                        <p className="text-xs lg:text-sm text-cyan-100">Quản lý bãi xe thông minh</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 lg:p-6 border-b border-gray-200">
                <div 
                    className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors group"
                    onClick={onProfileClick}
                >
                    <Avatar className="group-hover:ring-2 group-hover:ring-cyan-200 transition-all">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200">
                            <User className="h-4 w-4 lg:h-5 lg:w-5" />
                        </div>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 group-hover:text-cyan-700 transition-colors text-sm lg:text-base truncate">{user?.fullName}</p>
                            <User className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 group-hover:text-gray-600 transition-colors truncate">
                            {user?.studentId || user?.email}
                        </p>
                        <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin'
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
            <nav className="flex-1 p-3 lg:p-4">
                <ul className="space-y-1 lg:space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onItemClick(item.id)}
                                    className={`group w-full flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-left transition-all duration-300 ${activeItem === item.id
                                        ? "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border border-cyan-200 shadow-md"
                                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-600 hover:text-gray-800 hover:shadow-sm"
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 lg:h-5 lg:w-5 transition-all duration-300 flex-shrink-0 ${activeItem === item.id ? "text-cyan-600" : "text-gray-500 group-hover:text-gray-700"}`} />
                                    <span className="font-medium text-sm lg:text-base truncate">{item.label}</span>
                                    {activeItem === item.id && (
                                        <div className="ml-auto w-1.5 h-1.5 lg:w-2 lg:h-2 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">© 2025 eParking</p>
                    <p className="text-xs text-gray-400">Đại học Đà Lạt</p>
                </div>
            </div>

            {/* Profile Modal - moved to App.tsx */}
        </div>
    );
} 