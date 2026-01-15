// Centralized API base URL for the frontend
// Reads build-time env REACT_APP_API_URL, defaults to local backend port 5000
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    REACT_APP_CAMERA_STREAM_URL?: string;
  };
};

export const API_BASE_URL = `${
  process.env.REACT_APP_API_URL || "http://localhost:5000"
}/api`;

export const CAMERA_STREAM_BASE_URL = `${
  process.env.REACT_APP_CAMERA_STREAM_URL || "http://localhost:9000"
}/api`;
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const cameraStreamUrl = (path: string) =>
  `${CAMERA_STREAM_BASE_URL}${path}`;
