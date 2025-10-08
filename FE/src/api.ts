// Centralized API base URL for the frontend
// Reads build-time env REACT_APP_API_URL, defaults to local backend port 5000
export const API_BASE_URL = `${
  process.env.REACT_APP_API_URL || 'http://localhost:5001'
}/api`;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;



