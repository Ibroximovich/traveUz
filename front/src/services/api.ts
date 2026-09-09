import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Access Token & Language
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically remove default application/json header for FormData uploads
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    // Attach current language preference if available
    const lang = localStorage.getItem('tripuz_lang') || 'uz';
    if (config.headers) {
      config.headers['Accept-Language'] = lang;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized, trigger logout if refresh fails or token expired
    if (error.response?.status === 401 && originalRequest) {
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);
