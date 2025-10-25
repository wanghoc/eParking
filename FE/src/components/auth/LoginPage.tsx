import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Bike, ArrowLeft } from 'lucide-react';
import { useAuth, LoginData } from '../../contexts/AuthContext';

interface LoginPageProps {
    onSwitchToRegister: () => void;
    onBack: () => void;
}

export function LoginPage({ onSwitchToRegister, onBack }: LoginPageProps) {
    const { login, isLoading } = useAuth();
    const [formData, setFormData] = useState<LoginData>({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<Partial<LoginData>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

    const validateForm = (): boolean => {
        const newErrors: Partial<LoginData> = {};

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        if (!validateForm()) {
            return;
        }

        const result = await login(formData);
        if (!result.success) {
            setLoginError(result.error || 'Đăng nhập thất bại');
        }
    };

    const handleInputChange = (field: keyof LoginData, value: string) => {
        setFormData((prev: LoginData) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: '' }));
        }
        if (loginError) {
            setLoginError('');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Back button */}
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Quay lại
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bike className="h-8 w-8 text-cyan-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
                        <p className="text-gray-600">Hệ thống eParking - Trường Đại học Đà Lạt</p>
                    </div>

                    {/* Login error */}
                    {loginError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {loginError}
                        </div>
                    )}

                    {/* Demo accounts info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-blue-900 mb-2">Tài khoản demo:</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                            <div>📧 <strong>Sinh viên:</strong> 2212375@dlu.edu.vn / 123456</div>
                            <div>🔑 <strong>Admin:</strong> admin@dlu.edu.vn / 123456</div>
                        </div>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
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

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu
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
                                    placeholder="Nhập mật khẩu của bạn"
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

                        {/* Remember me and forgot password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>
                            <button
                                type="button"
                                className="text-sm text-cyan-600 hover:text-cyan-500 font-medium"
                            >
                                Quên mật khẩu?
                            </button>
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
                                    Đang đăng nhập...
                                </div>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    {/* Switch to register */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Chưa có tài khoản?{' '}
                            <button
                                onClick={onSwitchToRegister}
                                className="text-cyan-600 hover:text-cyan-500 font-medium"
                            >
                                Đăng ký ngay
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
                    <Bike className="h-24 w-24 mb-8 opacity-90" />
                    <h2 className="text-4xl font-bold mb-4">Chào mừng đến với eParking</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Hệ thống quản lý bãi đỗ xe thông minh
                    </p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Nhận diện biển số tự động</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Thanh toán không tiền mặt</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Theo dõi lịch sử gửi xe</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                            <span>Quản lý tài khoản dễ dàng</span>
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