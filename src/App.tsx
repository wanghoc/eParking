import { useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { HomePage } from "./components/HomePage";
import { VehiclesPage } from "./components/VehiclesPage";

export default function App() {
    const [activeItem, setActiveItem] = useState("home");

    const renderContent = () => {
        switch (activeItem) {
            case "home":
                return <HomePage />;
            case "vehicles":
                return <VehiclesPage />;
            case "history":
                return (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Lịch sử gửi xe</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case "payment":
                return (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Nạp tiền</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case "management":
                return (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Quản lý bãi xe</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case "admin":
                return (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Quản trị hệ thống</h1>
                        <p className="text-gray-600">Tính năng đang được phát triển...</p>
                    </div>
                );
            case "faq":
                return (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-semibold text-gray-900">FAQ</h1>
                        <p className="text-gray-600">Câu hỏi thường gặp sẽ được cập nhật...</p>
                    </div>
                );
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Banner */}
            <div className="bg-green-400 h-3 w-full"></div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <AppSidebar activeItem={activeItem} onItemClick={setActiveItem} />

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-8">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
} 