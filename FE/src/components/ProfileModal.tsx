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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8">
            <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh] m-auto flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 sm:p-6 lg:p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-6 lg:right-6 p-1.5 sm:p-2 lg:p-2.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </button>
                    <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-xl">
                            <User className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-bold">Quản lý tài khoản</h2>
                            <p className="text-cyan-100 text-sm sm:text-base lg:text-lg xl:text-xl">Cập nhật thông tin cá nhân</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row">
                        <button
                            onClick={() => {
                                setActiveTab("info");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-3 px-3 sm:px-6 lg:px-8 lg:py-4 text-center font-medium transition-colors ${
                                activeTab === "info"
                                    ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 inline-block mr-1 sm:mr-2 lg:mr-3" />
                            <span className="text-sm sm:text-base lg:text-lg">Thông tin cá nhân</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("password");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-3 px-3 sm:px-6 lg:px-8 lg:py-4 text-center font-medium transition-colors ${
                                activeTab === "password"
                                    ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 inline-block mr-1 sm:mr-2 lg:mr-3" />
                            <span className="text-sm sm:text-base lg:text-lg">Đổi mật khẩu</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("logout");
                                setMessage({ type: "", text: "" });
                            }}
                            className={`flex-1 py-3 px-3 sm:px-6 lg:px-8 lg:py-4 text-center font-medium transition-colors ${
                                activeTab === "logout"
                                    ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                                    : "text-gray-500 hover:text-red-600"
                            }`}
                        >
                            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 inline-block mr-1 sm:mr-2 lg:mr-3" />
                            <span className="text-sm sm:text-base lg:text-lg">Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8 xl:p-10 flex-1 min-h-0 overflow-y-auto">
                    {/* Message */}
                    {message.text && (
                        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center space-x-2 sm:space-x-3 ${
                            message.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {message.type === "success" ? (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                            <span className="text-sm sm:text-base">{message.text}</span>
                        </div>
                    )}

                    {/* Profile Info Tab */}
                    {activeTab === "info" && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base lg:text-lg"
                                    />
                                    <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">Không thể thay đổi</p>
                                </div>

                                {/* MSSV (Read-only) */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <User className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">MSSV</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.studentId || ""}
                                        disabled
                                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base lg:text-lg"
                                    />
                                    <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">Không thể thay đổi</p>
                                </div>

                                {/* Username (Editable) */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <User className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Họ và tên</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                                        disabled={!isEditing}
                                        className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border rounded-lg transition-colors text-sm sm:text-base lg:text-lg ${
                                            isEditing
                                                ? "border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                                : "border-gray-300 bg-gray-50"
                                        }`}
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                {/* Phone (Editable) */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Số điện thoại</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        disabled={!isEditing}
                                        className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border rounded-lg transition-colors text-sm sm:text-base lg:text-lg ${
                                            isEditing
                                                ? "border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                                                : "border-gray-300 bg-gray-50"
                                        }`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 pt-4 lg:pt-6 border-t border-gray-200">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 lg:space-x-3 shadow-lg text-sm sm:text-base lg:text-lg"
                                    >
                                        <Edit2 className="h-4 w-4 lg:h-5 lg:w-5" />
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
                                            className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base lg:text-lg"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleProfileSave}
                                            disabled={loading}
                                            className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2 lg:space-x-3 shadow-lg disabled:opacity-50 text-sm sm:text-base lg:text-lg"
                                        >
                                            <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                                            <span>{loading ? "Đang lưu..." : "Lưu thay đổi"}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Password Change Tab */}
                    {activeTab === "password" && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <Lock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Mật khẩu hiện tại</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 pr-10 sm:pr-12 lg:pr-14 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors text-sm sm:text-base lg:text-lg"
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                            className="absolute right-2 sm:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <Lock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Mật khẩu mới</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 pr-10 sm:pr-12 lg:pr-14 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors text-sm sm:text-base lg:text-lg"
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                            className="absolute right-2 sm:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 lg:mb-3">
                                        <Lock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 inline-block mr-1 lg:mr-2" />
                                        <span className="text-xs sm:text-sm lg:text-base">Xác nhận mật khẩu mới</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 pr-10 sm:pr-12 lg:pr-14 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-colors text-sm sm:text-base lg:text-lg"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                            className="absolute right-2 sm:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Security Tips */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Lưu ý bảo mật:</h4>
                                <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                                    <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
                                    <li>• Nên sử dụng kết hợp chữ, số và ký tự đặc biệt</li>
                                    <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                                    <li>• Thay đổi mật khẩu định kỳ để bảo mật tối ưu</li>
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-end pt-4 lg:pt-6 border-t border-gray-200">
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={loading}
                                    className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 lg:space-x-3 shadow-lg disabled:opacity-50 text-sm sm:text-base lg:text-lg"
                                >
                                    <Lock className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span>{loading ? "Đang xử lý..." : "Đổi mật khẩu"}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logout Tab */}
                    {activeTab === "logout" && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                            <div className="text-center">
                                <div className="bg-red-100 p-4 sm:p-6 lg:p-8 rounded-full w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center">
                                    <LogOut className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-red-600" />
                                </div>
                                <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-2 lg:mb-4">Đăng xuất khỏi hệ thống</h3>
                                <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8">
                                    Bạn có chắc chắn muốn đăng xuất? Bạn sẽ cần đăng nhập lại để sử dụng hệ thống.
                                </p>
                            </div>

                            {/* User Info Summary */}
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="bg-cyan-100 p-1.5 sm:p-2 rounded-full">
                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user?.fullName}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</p>
                                        <p className="text-xs text-gray-400">
                                            {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                                <h4 className="font-medium text-amber-900 mb-2 text-sm sm:text-base">Lưu ý bảo mật:</h4>
                                <ul className="text-xs sm:text-sm text-amber-800 space-y-1">
                                    <li>• Luôn đăng xuất khi sử dụng máy tính chung</li>
                                    <li>• Không chia sẻ thông tin đăng nhập với người khác</li>
                                    <li>• Đóng tất cả tab trình duyệt sau khi đăng xuất</li>
                                </ul>
                            </div>

                            {/* Logout Buttons */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 pt-4 lg:pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setActiveTab("info")}
                                    className="flex-1 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base lg:text-lg"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        onClose();
                                    }}
                                    className="flex-1 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 lg:space-x-3 shadow-lg font-medium text-sm sm:text-base lg:text-lg"
                                >
                                    <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
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
