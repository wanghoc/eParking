import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '../api';

// Types cho user và authentication
export interface User {
    id: number;
    email: string;
    username: string;
    mssv?: string;
    phone?: string;
    role: 'student' | 'admin';
    created_at: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    username: string;
    mssv?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra user đã đăng nhập từ localStorage khi app khởi động
    useEffect(() => {
        const checkAuth = () => {
            try {
                const storedUser = localStorage.getItem('eparking_user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                localStorage.removeItem('eparking_user');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        try {
            const { email, password } = data;

            // Validate input
            if (!email || !password) {
                return { success: false, error: 'Vui lòng nhập đầy đủ email và mật khẩu' };
            }

            // Call backend API
            const response = await fetch(apiUrl('/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.message || 'Đăng nhập thất bại' };
            }

            // Login successful
            const loggedInUser = result.user;
            setUser(loggedInUser);
            localStorage.setItem('eparking_user', JSON.stringify(loggedInUser));

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Không thể kết nối đến server. Vui lòng thử lại.' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        try {
            const { email, password, confirmPassword, username, mssv, phone } = data;

            // Validate input
            if (!email || !password || !confirmPassword || !username) {
                return { success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
            }

            if (password !== confirmPassword) {
                return { success: false, error: 'Mật khẩu xác nhận không khớp' };
            }

            if (password.length < 6) {
                return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return { success: false, error: 'Email không đúng định dạng' };
            }

            // Call backend API
            const response = await fetch(apiUrl('/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    username, 
                    mssv, 
                    phone 
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.message || 'Đăng ký thất bại' };
            }

            // Get user info after registration
            const userResponse = await fetch(apiUrl(`/users/${result.userId}`));
            if (userResponse.ok) {
                const newUser = await userResponse.json();
                setUser(newUser);
                localStorage.setItem('eparking_user', JSON.stringify(newUser));
            }

            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Không thể kết nối đến server. Vui lòng thử lại.' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('eparking_user');
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};