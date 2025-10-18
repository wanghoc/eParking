import { useState } from 'react';
import { Camera, X, TestTube, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '../api';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCameraAdded: () => void;
}

interface CameraFormData {
    name: string;
    location: string;
    type: 'Vao' | 'Ra';
    ip_address: string;
    camera_brand: string;
    protocol: 'RTSP' | 'HTTP' | 'ONVIF' | 'Yoosee' | 'Custom';
    username: string;
    password: string;
    port: number;
    channel: number;
    rtsp_url: string;
    http_url: string;
    main_stream_url: string;
    sub_stream_url: string;
    audio_enabled: boolean;
    ptz_enabled: boolean;
    device_id: string;
    mac_address: string;
    serial_number: string;
    onvif_id: string;
    resolution: string;
    fps: number;
}

export function AddCameraModal({ isOpen, onClose, onCameraAdded }: AddCameraModalProps) {
    const [formData, setFormData] = useState<CameraFormData>({
        name: '',
        location: '',
        type: 'Vao',
        ip_address: '',
        camera_brand: 'Yoosee',
        protocol: 'RTSP',
        username: '',
        password: '',
        port: 554,
        channel: 0,
        rtsp_url: '',
        http_url: '',
        main_stream_url: '',
        sub_stream_url: '',
        audio_enabled: false,
        ptz_enabled: false,
        device_id: '',
        mac_address: '',
        serial_number: '',
        onvif_id: '',
        resolution: '1080p',
        fps: 30
    });

    const [errors, setErrors] = useState<Partial<CameraFormData>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const brands = ['Yoosee', 'Hikvision', 'Dahua', 'TP-Link', 'Xiaomi', 'Generic', 'Other'];
    const protocols = ['RTSP', 'HTTP', 'ONVIF', 'Yoosee', 'Custom'];
    const resolutions = ['720p', '1080p', '4K', '2K'];

    const validateForm = (): boolean => {
        const newErrors: Partial<CameraFormData> = {};

        if (!formData.name) {
            newErrors.name = 'Tên camera là bắt buộc';
        }

        // IP address is required for most protocols except Yoosee (can use Device ID only)
        if (!formData.ip_address && formData.protocol !== 'Yoosee') {
            newErrors.ip_address = 'Địa chỉ IP là bắt buộc';
        }

        // For Yoosee, require either Device ID or IP
        if (formData.protocol === 'Yoosee' && !formData.device_id && !formData.ip_address) {
            newErrors.device_id = 'Device ID hoặc IP là bắt buộc cho Yoosee';
        }

        // Auto generate URLs if not provided
        if (formData.protocol === 'RTSP' && !formData.rtsp_url && formData.ip_address) {
            const rtspUrl = `rtsp://${formData.username ? formData.username + ':' + formData.password + '@' : ''}${formData.ip_address}:${formData.port}/live/ch${formData.channel || 0}`;
            setFormData(prev => ({ ...prev, rtsp_url: rtspUrl }));
        }

        if (formData.protocol === 'HTTP' && !formData.http_url && formData.ip_address) {
            const httpUrl = `http://${formData.ip_address}:${formData.port}/videostream.cgi`;
            setFormData(prev => ({ ...prev, http_url: httpUrl }));
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof CameraFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }

        // Auto-fill Yoosee defaults when selecting Yoosee brand
        if (field === 'camera_brand' && value === 'Yoosee') {
            setFormData(prev => ({
                ...prev,
                protocol: 'Yoosee',
                port: 8000,
                camera_brand: 'Yoosee'
            }));
        }

        // Auto-update protocol when brand is Yoosee
        if (field === 'protocol' && value === 'Yoosee') {
            setFormData(prev => ({
                ...prev,
                port: 8000
            }));
        }

        // Auto-update related fields
        if (field === 'protocol') {
            setFormData(prev => ({
                ...prev,
                port: value === 'RTSP' ? 554 : value === 'HTTP' ? 80 : prev.port
            }));
        }

        if (field === 'camera_brand' && value === 'Yoosee') {
            setFormData(prev => ({
                ...prev,
                protocol: 'Yoosee',
                port: 8000
            }));
        }
    };

    const testConnection = async () => {
        if (!formData.ip_address && formData.protocol !== 'Yoosee') {
            setTestResult({ success: false, message: 'Vui lòng nhập địa chỉ IP trước khi test' });
            return;
        }

        setIsLoading(true);
        setTestResult(null);

        try {
            const response = await fetch(apiUrl('/cameras/test-connection'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ip_address: formData.ip_address,
                    port: formData.port,
                    username: formData.username,
                    password: formData.password,
                    protocol: formData.protocol,
                    rtsp_url: formData.rtsp_url,
                    http_url: formData.http_url
                }),
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            console.error('Test connection error:', error);
            setTestResult({ 
                success: false, 
                message: 'Lỗi kết nối tới server. Vui lòng thử lại.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(apiUrl('/cameras'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Lỗi tạo camera');
            }

            onCameraAdded();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Create camera error:', error);
            setTestResult({ 
                success: false, 
                message: error.message || 'Lỗi tạo camera. Vui lòng thử lại.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            type: 'Vao',
            ip_address: '',
            camera_brand: 'Yoosee',
            protocol: 'RTSP',
            username: '',
            password: '',
            port: 554,
            channel: 0,
            rtsp_url: '',
            http_url: '',
            main_stream_url: '',
            sub_stream_url: '',
            audio_enabled: false,
            ptz_enabled: false,
            device_id: '',
            mac_address: '',
            serial_number: '',
            onvif_id: '',
            resolution: '1080p',
            fps: 30
        });
        setErrors({});
        setTestResult(null);
        setCurrentStep(1);
    };

    const nextStep = () => {
        if (currentStep === 1) {
            // Validate basic info before proceeding
            if (!formData.name || !formData.type) {
                const newErrors: Partial<CameraFormData> = {};
                if (!formData.name) newErrors.name = 'Tên camera là bắt buộc';
                if (!formData.type) newErrors.type = 'Loại camera là bắt buộc' as any;
                setErrors(newErrors);
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Camera className="h-6 w-6" />
                            <h2 className="text-xl font-semibold">Thêm Camera Mới</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Step indicator */}
                    <div className="mt-4 flex items-center space-x-4">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step <= currentStep ? 'bg-white text-cyan-500' : 'bg-cyan-600 text-white opacity-50'
                                }`}>
                                    {step}
                                </div>
                                <div className={`ml-2 text-sm ${step === currentStep ? 'text-white' : 'text-cyan-100'}`}>
                                    {step === 1 && 'Thông tin cơ bản'}
                                    {step === 2 && 'Cấu hình kết nối'}
                                    {step === 3 && 'Cài đặt nâng cao'}
                                </div>
                                {step < 3 && <div className="ml-4 w-8 h-0.5 bg-cyan-300"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên Camera *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                            errors.name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Ví dụ: Camera A1 - Cổng vào"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vị trí
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Ví dụ: Bãi xe A - Cổng vào"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại Camera *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleInputChange('type', e.target.value as 'Vao' | 'Ra')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="Vao">Vào</option>
                                        <option value="Ra">Ra</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thương hiệu
                                    </label>
                                    <select
                                        value={formData.camera_brand}
                                        onChange={(e) => handleInputChange('camera_brand', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        {brands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Quick Start Guide */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                                    <span className="text-xl mr-2">�</span> Bắt đầu nhanh - Thông tin cần thiết
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                                        <p className="font-semibold text-blue-900 mb-2">✅ BẮT BUỘC:</p>
                                        <ul className="space-y-1 text-blue-800">
                                            <li>• Tên camera</li>
                                            <li>• Loại (Vào/Ra)</li>
                                            <li>• IP hoặc Device ID</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                                        <p className="font-semibold text-blue-900 mb-2">📝 TÙY CHỌN:</p>
                                        <ul className="space-y-1 text-blue-800">
                                            <li>• Username/Password</li>
                                            <li>• Channel, Port</li>
                                            <li>• MAC, Serial, ONVIF ID</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-xs text-blue-700">
                                        <strong>💡 Mẹo:</strong> Camera Yoosee của bạn: Device ID <strong>7804144881</strong>, 
                                        IP <strong>192.168.1.16</strong> - chỉ cần 2 thông tin này là đủ!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Connection Config */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Protocol
                                    </label>
                                    <select
                                        value={formData.protocol}
                                        onChange={(e) => handleInputChange('protocol', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        {protocols.map(protocol => (
                                            <option key={protocol} value={protocol}>{protocol}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ IP * (IP mạng cục bộ)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ip_address}
                                        onChange={(e) => handleInputChange('ip_address', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                            errors.ip_address ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Ví dụ: 192.168.1.16"
                                    />
                                    {errors.ip_address && <p className="mt-1 text-sm text-red-600">{errors.ip_address}</p>}
                                    <p className="mt-1 text-xs text-gray-500">Xem trong app Yoosee → Settings → Device Info</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Port <span className="text-gray-400 text-xs">(tự động điền)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.port}
                                        onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 554)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50"
                                        placeholder="554"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Mặc định: RTSP(554), HTTP(80), Yoosee(8000)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Channel <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.channel}
                                        onChange={(e) => handleInputChange('channel', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50"
                                        placeholder="0"
                                        min="0"
                                        max="15"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Thường là 0 hoặc 1. Để mặc định nếu không biết.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="admin"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Tài khoản admin camera (nếu có)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="******"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Mật khẩu admin camera (nếu có)
                                    </p>
                                </div>
                            </div>

                            {formData.protocol === 'Yoosee' && (
                                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Device ID (ID máy ảnh) *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.device_id}
                                            onChange={(e) => handleInputChange('device_id', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                errors.device_id ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Ví dụ: 7804144881"
                                        />
                                        {errors.device_id && <p className="mt-1 text-sm text-red-600">{errors.device_id}</p>}
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">📱 Cách lấy Device ID từ app Yoosee:</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Mở app Yoosee → chọn camera</li>
                                            <li>Vào Settings (⚙️) → Device Info (Thông tin thiết bị)</li>
                                            <li>Sao chép "ID máy ảnh" (Device ID)</li>
                                        </ol>
                                    </div>
                                </div>
                            )}

                            {/* Stream URLs - Auto generated */}
                            {(formData.protocol === 'RTSP' || formData.protocol === 'HTTP') && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Stream URLs <span className="text-gray-400 text-xs">(tự động tạo)</span>
                                    </h4>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        ⚠️ URLs sẽ được tự động tạo dựa trên IP, Port và Protocol. Bạn không cần điền thủ công.
                                    </p>
                                    
                                    {formData.protocol === 'RTSP' && formData.ip_address && (
                                        <div className="bg-white p-3 rounded border border-yellow-300">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                RTSP URL (preview):
                                            </label>
                                            <code className="text-xs text-gray-700 break-all">
                                                rtsp://{formData.username && formData.password ? `${formData.username}:****@` : ''}{formData.ip_address}:{formData.port}/live/ch{formData.channel || 0}
                                            </code>
                                        </div>
                                    )}

                                    {formData.protocol === 'HTTP' && formData.ip_address && (
                                        <div className="bg-white p-3 rounded border border-yellow-300">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                HTTP URL (preview):
                                            </label>
                                            <code className="text-xs text-gray-700 break-all">
                                                http://{formData.ip_address}:{formData.port}/videostream.cgi
                                            </code>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.protocol === 'Yoosee' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">
                                        📡 Kết nối Yoosee
                                    </h4>
                                    <p className="text-sm text-blue-800">
                                        Yoosee sử dụng protocol riêng. Chỉ cần Device ID và IP là đủ. 
                                        Hệ thống sẽ tự động kết nối qua app Yoosee hoặc P2P.
                                    </p>
                                </div>
                            )}

                            {formData.protocol === 'ONVIF' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-900 mb-2">
                                        🔌 ONVIF Protocol
                                    </h4>
                                    <p className="text-sm text-green-800">
                                        ONVIF là chuẩn kết nối camera IP quốc tế. Hệ thống sẽ tự động phát hiện 
                                        stream URLs thông qua ONVIF Discovery.
                                    </p>
                                </div>
                            )}

                            {/* Test Connection */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">Test Kết Nối</h4>
                                    <button
                                        onClick={testConnection}
                                        disabled={isLoading}
                                        className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                                    >
                                        <TestTube className="h-4 w-4" />
                                        <span>{isLoading ? 'Testing...' : 'Test'}</span>
                                    </button>
                                </div>

                                {testResult && (
                                    <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                                        testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                    }`}>
                                        {testResult.success ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5" />
                                        )}
                                        <span className="text-sm">{testResult.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Advanced Settings */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Resolution
                                    </label>
                                    <select
                                        value={formData.resolution}
                                        onChange={(e) => handleInputChange('resolution', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        {resolutions.map(res => (
                                            <option key={res} value={res}>{res}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        FPS
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.fps}
                                        onChange={(e) => handleInputChange('fps', parseInt(e.target.value) || 30)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="30"
                                        min="1"
                                        max="60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        MAC Address <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.mac_address}
                                        onChange={(e) => handleInputChange('mac_address', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Ví dụ: 78:22:88:4b:d2:b3"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        📱 App Yoosee → Settings → Device Info<br/>
                                        💡 Hoặc xem ở mặt sau camera (nếu có)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Serial Number <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={(e) => handleInputChange('serial_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Không biết? Để trống"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Thường ở mặt sau camera hoặc trong hộp đựng
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ONVIF ID <span className="text-gray-400 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.onvif_id}
                                        onChange={(e) => handleInputChange('onvif_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Ví dụ: 2024DPP9340(M)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        🏷️ Xem trên tem camera (nếu có in sẵn)<br/>
                                        💡 Ví dụ của bạn: 2024DPP9340(M)
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Tính năng</h4>
                                
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.audio_enabled}
                                            onChange={(e) => handleInputChange('audio_enabled', e.target.checked)}
                                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span className="text-sm text-gray-700">Hỗ trợ âm thanh</span>
                                    </label>

                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.ptz_enabled}
                                            onChange={(e) => handleInputChange('ptz_enabled', e.target.checked)}
                                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span className="text-sm text-gray-700">PTZ (Pan-Tilt-Zoom)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Stream URLs Nâng Cao</h4>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Main Stream URL
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.main_stream_url}
                                        onChange={(e) => handleInputChange('main_stream_url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="rtsp://camera/main_stream"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sub Stream URL
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sub_stream_url}
                                        onChange={(e) => handleInputChange('sub_stream_url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="rtsp://camera/sub_stream"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <div className="flex space-x-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Quay lại
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        
                        {currentStep < 3 ? (
                            <button
                                onClick={nextStep}
                                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                            >
                                Tiếp theo
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                <span>{isLoading ? 'Đang tạo...' : 'Tạo Camera'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}