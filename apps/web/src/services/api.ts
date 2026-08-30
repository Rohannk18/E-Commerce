import axios from 'axios';
import { handleMockRequest } from './mockAdapter';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with automatic client-side fallback if backend API is unreachable
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request failed with 404, network error, or connection refused (e.g. static host on Netlify)
    const isNetworkOr404 =
      !error.response ||
      error.response.status === 404 ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error');

    if (isNetworkOr404 && error.config) {
      try {
        const mockRes = await handleMockRequest(error.config);
        if (mockRes.status >= 200 && mockRes.status < 300) {
          return {
            data: mockRes.data,
            status: mockRes.status,
            statusText: mockRes.statusText,
            headers: {},
            config: error.config,
          };
        }
      } catch (mockErr) {
        console.warn('Mock adapter fallback error:', mockErr);
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
