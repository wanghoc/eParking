import { Home, Car, History, CreditCard, MapPin, Settings, HelpCircle, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface AppSidebarProps {
    activeItem: string;
    onItemClick: (item: string) => void;
}

export function AppSidebar({ activeItem, onItemClick }: AppSidebarProps) {
    const menuItems = [
        { id: "home", label: "Trang chủ", icon: Home },
        { id: "vehicles", label: "Phương tiện", icon: Car },
        { id: "history", label: "Lịch sử gửi xe", icon: History },
        { id: "payment", label: "Nạp tiền", icon: CreditCard },
        { id: "management", label: "Quản lý bãi xe", icon: MapPin },
        { id: "admin", label: "Quản trị hệ thống", icon: Settings },
        { id: "faq", label: "FAQ", icon: HelpCircle },
    ];

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
                        <AvatarFallback>QH</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">Triệu Quang Học</p>
                        <p className="text-sm text-gray-500">2212375</p>
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
                                            ? "bg-green-100 text-green-700 border border-green-200"
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
        </div>
    );
} 