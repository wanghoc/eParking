// Cổng web được nginx cấp qua /runtime-config.js: 3000 = "user" (sinh viên), 3001 = "admin". Dev server = "all".
export type Portal = 'user' | 'admin' | 'all';

export const PORTAL: Portal = ((window as any).EPARKING_PORTAL as Portal) || 'all';

export function portalRoleError(role: 'student' | 'admin'): string | null {
    if (PORTAL === 'admin' && role !== 'admin') {
        return 'Đây là trang quản trị. Tài khoản sinh viên vui lòng đăng nhập tại cổng 3000.';
    }
    if (PORTAL === 'user' && role === 'admin') {
        return 'Tài khoản quản trị vui lòng đăng nhập tại trang admin (cổng 3001).';
    }
    return null;
}
