import axios from 'axios';
import { store } from '../store';
import { logoutAction } from '../store/authSlice';

// Change this URL to point to your live Spring Boot backend API
export const BASE_URL = 'http://localhost:8080/api';//'https://patel-samaj-backend.onrender.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject bearer token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth?.token;

    // Set Authorization header for all requests if token exists
    if (token && config.method) {
      if (config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';

  const response = error.response;
  if (response && response.data) {
    const data = response.data;

    // 1. Plain String error response (Exception.class)
    if (typeof data === 'string' && data.trim().length > 0 && !data.trim().startsWith('<html')) {
      return data.trim();
    }

    // 2. Map<String, String> response
    if (typeof data === 'object' && data !== null) {
      // ResourceNotFoundException or Conflict Exception -> { "error": "Message" } or { "message": "Message" }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }

      // MethodArgumentNotValidException -> { "fullName": "Full name cannot be empty", ... }
      const validationMessages = Object.values(data)
        .filter((val): val is string => typeof val === 'string' && val.trim().length > 0)
        .join('\n');

      if (validationMessages) {
        return validationMessages;
      }
    }
  }

  if (error.request) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

// Interceptor to handle global errors (like 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Automatic logout on token expiration / unauthorized
      store.dispatch(logoutAction());
    }

    // Attach extracted user-friendly error message
    error.userMessage = extractErrorMessage(error);

    return Promise.reject(error);
  }
);

export default apiClient;
