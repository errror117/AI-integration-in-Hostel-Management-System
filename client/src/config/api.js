// API Configuration
// This file exports the base API URL for all fetch calls
// In production, VITE_API_URL should be set in environment variables

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_BASE = `${API_URL}/api`;

export default API_URL;
