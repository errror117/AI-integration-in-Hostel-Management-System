// API Configuration for production/development environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api`;

// Socket URL for real-time features
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export { API_BASE_URL, API_URL, SOCKET_URL };
export default API_URL;
