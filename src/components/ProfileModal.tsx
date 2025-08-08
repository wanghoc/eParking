import { useState } from "react";
import { X, User, Mail, Phone, Lock, Edit2, Save, AlertCircle, CheckCircle, Eye, EyeOff, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Form states for profile info
    const [profileData, setProfileData] = useState({
        username: user?.fullName || "",
        phone: user?.phone || "",
    });

    // Form states for password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Password visibility states
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Logout confirmation state
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!isOpen) return null;

    const handleProfileSave = async () => {
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await fetch(`http://localhost:3000/api/users/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: profileData.username,
                    phone: profileData.phone,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
                setIsEditing(false);
                // Update local user data if needed
            } else {
                setMessage({ type: "error", text: data.message || "Có lỗi xảy ra. Vui lòng thử lại!" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại!" });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        setLoading(true);
        setMessage({ type: "", text: "" });

        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin!" });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "Mật khẩu mới không khớp!" });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/users/${user?.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                setMessage({ type: "error", text: data.message || "Có lỗi xảy ra. Vui lòng thử lại!" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại!" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>
                            <p className="text-cyan-100">Cập nhật thông tin cá nhân</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => {
                                setActiveTab("info");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                activeTab === "info"
                                    ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <User className="h-5 w-5 inline-block mr-2" />
                            Thông tin cá nhân
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("password");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                activeTab === "password"
                                    ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Lock className="h-5 w-5 inline-block mr-2" />
                            Đổi mật khẩu
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("logout");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                activeTab === "logout"
                                    ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                                    : "text-gray-500 hover:text-red-600"
                            }`}
                        >
                            <LogOut className="h-5 w-5 inline-block mr-2" />
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                            message.type === "success" 
                                ? "bg-green-50 text-green-700 border border-green-200" 
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {message.type === "success" ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertCircle className="h-5 w-5" />
                            )}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Profile Info Tab */}
                    {activeTab === "info" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="h-4 w-4 inline-block mr-1" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Không thể thay đổi</p>
                                </div>

                                {/* MSSV (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="h-4 w-4 inline-block mr-1" />
                                        MSSV
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.studentId || ""}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Không thể thay đổi</p>
                                </div>

                                {/* Username (Editable) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="h-4 w-4 inline-block mr-1" />
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                                            isEditing 
                                                ? "border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" 
                                                : "border-gray-300 bg-gray-50"
                                        }`}
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                {/* Phone (Editable) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="h-4 w-4 inline-block mr-1" />
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                                            isEditing 
                                                ? "border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" 
                                                : "border-gray-300 bg-gray-50"
                                        }`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span>Chỉnh sửa</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setProfileData({
                                                    username: user?.fullName || "",
                                                    phone: user?.phone || "",
                                                });
                                                setMessage({ type: "", text: "" });
                                            }}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleProfileSave}
                                            disabled={loading}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center space-x-2 shadow-lg disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            <span>{loading ? "Đang lưu..." : "Lưu thay đổi"}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Password Change Tab */}
                    {activeTab === "password" && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Lock className="h-4 w-4 inline-block mr-1" />
                                        Mật khẩu hiện tại
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Lock className="h-4 w-4 inline-block mr-1" />
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Lock className="h-4 w-4 inline-block mr-1" />
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Security Tips */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Lưu ý bảo mật:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
                                    <li>• Nên sử dụng kết hợp chữ, số và ký tự đặc biệt</li>
                                    <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                                    <li>• Thay đổi mật khẩu định kỳ để bảo mật tối ưu</li>
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center space-x-2 shadow-lg disabled:opacity-50"
                                >
                                    <Lock className="h-4 w-4" />
                                    <span>{loading ? "Đang xử lý..." : "Đổi mật khẩu"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logout Tab */}
                    {activeTab === "logout" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="bg-red-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                    <LogOut className="h-10 w-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Đăng xuất khỏi hệ thống</h3>
                                <p className="text-gray-600 mb-6">
                                    Bạn có chắc chắn muốn đăng xuất? Bạn sẽ cần đăng nhập lại để sử dụng hệ thống.
                                </p>
                            </div>

                            {/* User Info Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-cyan-100 p-2 rounded-full">
                                        <User className="h-5 w-5 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user?.fullName}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <p className="text-xs text-gray-400">
                                            {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h4 className="font-medium text-amber-900 mb-2">Lưu ý bảo mật:</h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Luôn đăng xuất khi sử dụng máy tính chung</li>
                                    <li>• Không chia sẻ thông tin đăng nhập với người khác</li>
                                    <li>• Đóng tất cả tab trình duyệt sau khi đăng xuất</li>
                                </ul>
                            </div>

                            {/* Logout Buttons */}
                            <div className="flex space-x-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setActiveTab("info")}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        onClose();
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg font-medium"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Đăng xuất ngay</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
