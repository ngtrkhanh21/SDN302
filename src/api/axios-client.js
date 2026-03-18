import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL ở mức root, vì một số API (Auth, Users) không có prefix /api,
// còn các API khác (course, order, ...) đã tự thêm /api trong endpoint.
const BASE_URL = 'https://final-project-tawny-two-47.vercel.app';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Logout callback được đăng ký từ auth-store để tránh circular import
let _logoutCallback = null;

export function setLogoutCallback(fn) {
  _logoutCallback = fn;
}

axiosClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to read auth token', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request, logging out');
      try {
        // Xóa toàn bộ auth data
        await AsyncStorage.multiRemove(['authToken', 'authUser', 'refreshToken']);
      } catch (storageError) {
        console.warn('Failed to clear auth storage', storageError);
      }
      // Trigger logout ở auth-store nếu callback đã được đăng ký
      if (_logoutCallback) {
        _logoutCallback();
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
