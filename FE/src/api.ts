// Centralized API base URL for the frontend
// Reads build-time env REACT_APP_API_URL, defaults to host's backend port 5001
export const API_BASE_URL = `${
  process.env.REACT_APP_API_URL || 'http://localhost:5001'
}/api`;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;



