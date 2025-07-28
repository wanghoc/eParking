import { useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { HomePage } from "./components/HomePage";
import { VehiclesPage } from "./components/VehiclesPage";
import { HistoryPage } from "./components/HistoryPage";
import { PaymentPage } from "./components/PaymentPage";
import { ManagementPage } from "./components/ManagementPage";
import { AdminPage } from "./components/AdminPage";
import { CameraPage } from "./components/CameraPage";
import { FAQPage } from "./components/FAQPage";

export default function App() {
    const [activeItem, setActiveItem] = useState("home");

    const renderContent = () => {
        switch (activeItem) {
            case "home":
                return <HomePage />;
            case "vehicles":
                return <VehiclesPage />;
            case "history":
                return <HistoryPage />;
            case "payment":
                return <PaymentPage />;
            case "management":
                return <ManagementPage />;
            case "admin":
                return <AdminPage />;
            case "camera":
                return <CameraPage />;
            case "faq":
                return <FAQPage />;
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