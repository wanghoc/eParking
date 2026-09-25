// Centralized API base URL for the frontend
// Reads build-time env REACT_APP_API_URL, defaults to local backend port 5000
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

export const API_BASE_URL = `${
  process.env.REACT_APP_API_URL || 'http://localhost:5000'
}/api`;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;



// Ảnh bằng chứng do backend phục vụ tại /evidence/... (ngoài tiền tố /api)
export const assetUrl = (path?: string | null) =>
  !path ? null : /^https?:\/\//.test(path) ? path : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;

// Token đăng nhập (do backend cấp) dùng cho các API quản trị
export const TOKEN_KEY = 'eparking_token';
export const getAuthToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
