import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Cần đăng nhập</h1>
                    <p className="text-gray-600">Vui lòng đăng nhập để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    if (requiredRole && user?.role !== requiredRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
                    <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
