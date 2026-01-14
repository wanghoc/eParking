import { useState, useEffect } from 'react';
import { Camera, X, TestTube, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { apiUrl } from '../api';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCameraAdded: () => void;
}

interface ParkingLot {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    status: string;
}

interface CameraFormData {
    name: string;
    parking_lot_id: number;
    type: 'Vao' | 'Ra';
    rtsp_url: string;
}

interface CameraFormErrors {
    name?: string;
    parking_lot_id?: string;
    rtsp_url?: string;
}

export function AddCameraModal({ isOpen, onClose, onCameraAdded }: AddCameraModalProps) {
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [formData, setFormData] = useState<CameraFormData>({
        name: '',
        parking_lot_id: 0,
        type: 'Vao',
        rtsp_url: ''
    });

    const [errors, setErrors] = useState<CameraFormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Load parking lots when modal opens
    useEffect(() => {
        if (isOpen) {
            loadParkingLots();
        }
    }, [isOpen]);

    const loadParkingLots = async () => {
        try {
            const response = await fetch(apiUrl('/parking-lots'));
            if (response.ok) {
                const lots = await response.json();
                setParkingLots(lots);
            }
        } catch (error) {
            console.error('Error loading parking lots:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: CameraFormErrors = {};

        if (!formData.name) {
            newErrors.name = 'Tên camera là bắt buộc';
        }

        if (!formData.parking_lot_id) {
            newErrors.parking_lot_id = 'Vui lòng chọn bãi xe';
        }

        if (!formData.rtsp_url) {
            newErrors.rtsp_url = 'RTSP URL là bắt buộc';
        } else if (!formData.rtsp_url.startsWith('rtsp://')) {
            newErrors.rtsp_url = 'RTSP URL phải bắt đầu bằng rtsp://';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof CameraFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof CameraFormErrors]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const testConnection = async () => {
        if (!formData.rtsp_url) {
            setTestResult({ success: false, message: 'Vui lòng nhập RTSP URL trước khi test' });
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
                    rtsp_url: formData.rtsp_url
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
            parking_lot_id: 0,
            type: 'Vao',
            rtsp_url: ''
        });
        setErrors({});
        setTestResult(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="space-y-6">
                        {/* Info Box */}
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                <span className="text-xl mr-2">📹</span> Thêm Camera qua RTSP URL
                            </h4>
                            <p className="text-sm text-blue-800">
                                Chỉ cần điền RTSP URL của camera. Ví dụ: <code className="bg-blue-100 px-2 py-1 rounded">rtsp://username:password@192.168.1.16:554/stream</code>
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên Camera *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Ví dụ: Camera A1 - Cổng vào"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bãi xe *
                                    </label>
                                    <select
                                        value={formData.parking_lot_id}
                                        onChange={(e) => handleInputChange('parking_lot_id', parseInt(e.target.value))}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.parking_lot_id ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value={0}>Chọn bãi xe</option>
                                        {parkingLots.map(lot => (
                                            <option key={lot.id} value={lot.id}>
                                                {lot.name} ({lot.occupied}/{lot.capacity})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.parking_lot_id && <p className="mt-1 text-sm text-red-600">{errors.parking_lot_id}</p>}
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    RTSP URL *
                                </label>
                                <input
                                    type="text"
                                    value={formData.rtsp_url}
                                    onChange={(e) => handleInputChange('rtsp_url', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.rtsp_url ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="rtsp://username:password@192.168.1.16:554/stream"
                                />
                                {errors.rtsp_url && <p className="mt-1 text-sm text-red-600">{errors.rtsp_url}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    Nhập URL RTSP đầy đủ bao gồm username và password (nếu có)
                                </p>
                            </div>

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
                                    <div className={`p-3 rounded-lg flex items-center space-x-2 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        <span>{isLoading ? 'Đang lưu...' : 'Lưu Camera'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}