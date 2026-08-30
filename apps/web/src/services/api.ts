import axios, { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { handleMockRequest } from './mockAdapter';

const HAS_CUSTOM_BACKEND = Boolean(import.meta.env.VITE_API_URL);

// Custom client-side mock adapter for static deployments (Netlify/Vercel)
const clientStorageAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  try {
    const res = await handleMockRequest(config);
    return {
      data: res.data,
      status: res.status,
      statusText: res.statusText,
      headers: {},
      config,
    };
  } catch (err: any) {
    return Promise.reject({
      response: {
        data: { message: err.message || 'Storage engine error' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config,
      },
    });
  }
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: HAS_CUSTOM_BACKEND ? undefined : clientStorageAdapter,
});

// Inject JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with automatic client-side fallback if custom backend API is unreachable
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (HAS_CUSTOM_BACKEND && error.config) {
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
