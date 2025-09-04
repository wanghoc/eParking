import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { AppSidebar } from "./components/common/AppSidebar";
import { HomePage } from "./components/HomePage";
import { VehiclesPage } from "./components/VehiclesPage";
import { HistoryPage } from "./components/HistoryPage";
import { PaymentPage } from "./components/PaymentPage";
import { ManagementPage } from "./components/ManagementPage";
import { AdminPage } from "./components/AdminPage";
import { CameraPage } from "./components/CameraPage";
import { FAQPage } from "./components/FAQPage";
import { ProfileModal } from "./components/ProfileModal";

function AuthenticatedApp() {
    const [activeItem, setActiveItem] = useState("home");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

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
                return (
                    <ProtectedRoute requiredRole="admin">
                        <AdminPage />
                    </ProtectedRoute>
                );
            case "camera":
                return (
                    <ProtectedRoute requiredRole="admin">
                        <CameraPage />
                    </ProtectedRoute>
                );
            case "faq":
                return <FAQPage />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
                    <AppSidebar 
                        activeItem={activeItem} 
                        onItemClick={(item) => {
                            setActiveItem(item);
                            setSidebarOpen(false); // Close sidebar on mobile after item click
                        }}
                        onClose={() => setSidebarOpen(false)}
                        onProfileClick={() => setShowProfileModal(true)}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    {/* Mobile Header */}
                    <div className="lg:hidden bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m3-6h4m-4 6h4m7-14h2m-2 0h-2m2-6h2v6z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">eParking</span>
                        </div>
                        <div className="w-7"></div> {/* Spacer for centering */}
                    </div>

                    <div className="p-3 lg:p-8">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Profile Modal - Moved from AppSidebar to App level for proper positioning */}
            <ProfileModal 
                isOpen={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
            />
        </div>
    );
}

function AuthFlow() {
    const { isAuthenticated } = useAuth();
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'welcome'>('welcome');

    if (isAuthenticated) {
        return (
            <ProtectedRoute>
                <AuthenticatedApp />
            </ProtectedRoute>
        );
    }

    if (authMode === 'welcome') {
        return (
            <div className="min-h-screen flex">
                {/* Left side - Welcome content */}
                <div className="flex-1 flex items-center justify-center p-8 bg-white">
                    <div className="w-full max-w-lg text-center">
                        <div className="bg-cyan-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="h-10 w-10 text-cyan-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m3-6h4m-4 6h4m7-14h2m-2 0h-2m2-6h2v6z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Chào mừng đến với eParking
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Hệ thống quản lý bãi đỗ xe thông minh<br />
                            Trường Đại học Đà Lạt
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => setAuthMode('login')}
                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-4 px-6 rounded-lg shadow-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 font-medium text-lg"
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => setAuthMode('register')}
                                className="w-full bg-white text-cyan-600 py-4 px-6 rounded-lg shadow-lg border-2 border-cyan-600 hover:bg-cyan-50 transition-all duration-200 font-medium text-lg"
                            >
                                Tạo tài khoản mới
                            </button>
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-6 text-sm text-gray-600">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                                <span>Nhận diện biển số tự động</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                                <span>Thanh toán không tiền mặt</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                                <span>Theo dõi lịch sử gửi xe</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                                <span>Hỗ trợ 24/7</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Image/illustration */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
                        <div className="text-center">
                            <svg
                                className="h-32 w-32 mx-auto mb-8 opacity-90"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m3-6h4m-4 6h4m7-14h2m-2 0h-2m2-6h2v6z"
                                />
                            </svg>
                            
                            <h2 className="text-3xl font-bold mb-4">Công nghệ hiện đại</h2>
                            <p className="text-lg opacity-90">
                                Ứng dụng AI và IoT trong quản lý bãi đỗ xe
                            </p>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white border-opacity-20 rounded-full"></div>
                    <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-white border-opacity-20 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (authMode === 'login') {
        return (
            <LoginPage
                onSwitchToRegister={() => setAuthMode('register')}
                onBack={() => setAuthMode('welcome')}
            />
        );
    }

    return (
        <RegisterPage
            onSwitchToLogin={() => setAuthMode('login')}
            onBack={() => setAuthMode('welcome')}
        />
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AuthFlow />
        </AuthProvider>
    );
} 