import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types cho user và authentication
export interface User {
    id: string;
    email: string;
    fullName: string;
    studentId?: string;
    phone?: string;
    role: 'student' | 'admin';
    createdAt: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    studentId?: string;
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

// Mock users data (trong thực tế sẽ kết nối với backend)
const mockUsers: User[] = [
    {
        id: '1',
        email: 'hocquang@student.dlu.edu.vn',
        fullName: 'Triệu Quang Học',
        studentId: '2212375',
        phone: '0123456789',
        role: 'student',
        createdAt: '2024-01-01'
    },
    {
        id: '2',
        email: 'admin@dlu.edu.vn',
        fullName: 'Quản trị viên',
        role: 'admin',
        createdAt: '2024-01-01'
    }
];

// Mock passwords (trong thực tế sẽ được hash và lưu trên server)
const mockPasswords: Record<string, string> = {
    'hocquang@student.dlu.edu.vn': '123456',
    'admin@dlu.edu.vn': 'admin123'
};

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
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { email, password } = data;

            // Validate input
            if (!email || !password) {
                return { success: false, error: 'Vui lòng nhập đầy đủ email và mật khẩu' };
            }

            // Check if user exists
            const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!foundUser) {
                return { success: false, error: 'Email không tồn tại trong hệ thống' };
            }

            // Check password
            const correctPassword = mockPasswords[foundUser.email];
            if (password !== correctPassword) {
                return { success: false, error: 'Mật khẩu không chính xác' };
            }

            // Login successful
            setUser(foundUser);
            localStorage.setItem('eparking_user', JSON.stringify(foundUser));

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Có lỗi xảy ra khi đăng nhập' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { email, password, confirmPassword, fullName, studentId, phone } = data;

            // Validate input
            if (!email || !password || !confirmPassword || !fullName) {
                return { success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
            }

            if (password !== confirmPassword) {
                return { success: false, error: 'Mật khẩu xác nhận không khớp' };
            }

            if (password.length < 6) {
                return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
            }

            // Check if email already exists
            const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                return { success: false, error: 'Email này đã được đăng ký' };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return { success: false, error: 'Email không đúng định dạng' };
            }

            // Create new user
            const newUser: User = {
                id: Date.now().toString(),
                email: email.toLowerCase(),
                fullName,
                studentId,
                phone,
                role: 'student',
                createdAt: new Date().toISOString()
            };

            // Add to mock data (trong thực tế sẽ gửi lên server)
            mockUsers.push(newUser);
            mockPasswords[newUser.email] = password;

            // Auto login after registration
            setUser(newUser);
            localStorage.setItem('eparking_user', JSON.stringify(newUser));

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Có lỗi xảy ra khi đăng ký' };
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