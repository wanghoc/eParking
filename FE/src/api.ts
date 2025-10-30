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



