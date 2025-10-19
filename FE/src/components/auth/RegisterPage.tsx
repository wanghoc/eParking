import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, Bike, ArrowLeft } from 'lucide-react';
import { useAuth, RegisterData } from '../../contexts/AuthContext';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
    onBack: () => void;
}

export function RegisterPage({ onSwitchToLogin, onBack }: RegisterPageProps) {
    const { register, isLoading } = useAuth();
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        mssv: '',
        phone: ''
    });
    const [errors, setErrors] = useState<Partial<RegisterData>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [step, setStep] = useState(1); // 1: Thông tin cơ bản, 2: Thông tin bổ sung

    const validateStep1 = (): boolean => {
        const newErrors: Partial<RegisterData> = {};

        if (!formData.email) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không đúng định dạng';
        }

        if (!formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (!formData.username) {
            newErrors.username = 'Họ và tên là bắt buộc';
        } else if (formData.username.length < 2) {
            newErrors.username = 'Họ và tên phải có ít nhất 2 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Partial<RegisterData> = {};

        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không đúng định dạng';
        }

        if (formData.mssv && !/^[0-9]{7}$/.test(formData.mssv)) {
            newErrors.mssv = 'Mã sinh viên phải có 7 số';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError('');

        if (!validateStep2()) {
            return;
        }

        const result = await register(formData);
        if (!result.success) {
            setRegisterError(result.error || 'Đăng ký thất bại');
        }
    };

    const handleInputChange = (field: keyof RegisterData, value: string) => {
        setFormData((prev: RegisterData) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: '' }));
        }
        if (registerError) {
            setRegisterError('');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Register form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Back button */}
                    <button
                        onClick={step === 1 ? onBack : () => setStep(1)}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        {step === 1 ? 'Quay lại' : 'Bước trước'}
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bike className="h-8 w-8 text-cyan-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h1>
                        <p className="text-gray-600">Hệ thống eParking - Trường Đại học Đà Lạt</p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        1
                                    </div>
                                    <div className="flex-1 ml-4">
                                        <p className="text-sm font-medium text-gray-900">Thông tin cơ bản</p>
                                        <p className="text-xs text-gray-500">Email, mật khẩu, họ tên</p>
                                    </div>
                                </div>
                            </div>
                            <div className={`w-8 border-t-2 ${step >= 2 ? 'border-cyan-600' : 'border-gray-200'}`}></div>
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        2
                                    </div>
                                    <div className="flex-1 ml-4">
                                        <p className="text-sm font-medium text-gray-900">Thông tin bổ sung</p>
                                        <p className="text-xs text-gray-500">Mã SV, số điện thoại</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Register error */}
                    {registerError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {registerError}
                        </div>
                    )}

                    {step === 1 ? (
                        /* Step 1: Basic Information */
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                            {/* Email field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nhập email của bạn"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Username field */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nhập họ và tên đầy đủ"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-2 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Password field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm password field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Nhập lại mật khẩu"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Next button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                            >
                                Tiếp tục
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Additional Information */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* MSSV field */}
                            <div>
                                <label htmlFor="mssv" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã sinh viên
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <GraduationCap className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="mssv"
                                        type="text"
                                        value={formData.mssv}
                                        onChange={(e) => handleInputChange('mssv', e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.mssv ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Ví dụ: 2212375"
                                    />
                                </div>
                                {errors.mssv && (
                                    <p className="mt-2 text-sm text-red-600">{errors.mssv}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Tùy chọn - Để xác thực tài khoản sinh viên</p>
                            </div>

                            {/* Phone field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Ví dụ: 0123456789"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Tùy chọn - Để nhận thông báo qua SMS</p>
                            </div>

                            {/* Terms and conditions */}
                            <div className="flex items-start">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded mt-1"
                                />
                                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700">
                                    Tôi đồng ý với{' '}
                                    <button type="button" className="text-cyan-600 hover:text-cyan-500 font-medium">
                                        Điều khoản sử dụng
                                    </button>{' '}
                                    và{' '}
                                    <button type="button" className="text-cyan-600 hover:text-cyan-500 font-medium">
                                        Chính sách bảo mật
                                    </button>{' '}
                                    của hệ thống eParking
                                </label>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Đang đăng ký...
                                    </div>
                                ) : (
                                    'Hoàn tất đăng ký'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Switch to login */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Đã có tài khoản?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-cyan-600 hover:text-cyan-500 font-medium"
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - DLU Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
                    <GraduationCap className="h-24 w-24 mb-8 opacity-90" />
                    <h2 className="text-4xl font-bold mb-4">Tham gia cộng đồng eParking</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Trải nghiệm đỗ xe thông minh tại trường đại học
                    </p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Đăng ký nhanh chóng và dễ dàng</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Quản lý nhiều phương tiện</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Nạp tiền và thanh toán online</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white border-opacity-30 rounded-full"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-white border-opacity-30 rounded-full"></div>
                <div className="absolute top-1/2 left-12 w-16 h-16 border-4 border-white border-opacity-30 rounded-full"></div>
            </div>
        </div>
    );
}