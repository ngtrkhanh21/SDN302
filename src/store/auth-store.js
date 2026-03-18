// src/store/auth-store.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';
import authService from '../services/auth-service';
import { ROLES } from '../constants/roles';
import { setLogoutCallback } from '../api/axios-client';


const initialState = {
  isInitializing: true,
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
};

const useAuthStore = create((set, get) => ({
  ...initialState,

  initializeAuth: async () => {
    try {
      const [token, userJson, refreshToken] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('authUser'),
        AsyncStorage.getItem('refreshToken'),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({
          isAuthenticated: true,
          user,
          token,
          refreshToken,
          isInitializing: false,
        });
      } else {
        set({ ...initialState, isInitializing: false });
      }
    } catch (error) {
      console.warn('Failed to initialize auth', error);
      set({ ...initialState, isInitializing: false });
    }
  },

  login: async credentials => {
    const data = await authService.login(credentials);
    const accessToken = data?.result?.access_token;
    const refreshToken = data?.result?.refresh_token;

    if (!accessToken) {
      throw new Error('Missing access token in login response');
    }

    await AsyncStorage.setItem('authToken', accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    // decode JWT
    let backendRole = null;
    let userId = null;
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(payloadPart);
        const payload = JSON.parse(json);
        backendRole = payload?.role;
        userId = payload?.user_id || payload?.sub;
      }
    } catch (error) {
      console.warn('Failed to decode access token payload', error);
    }

    // map role
    let mappedRole = ROLES.CUSTOMER;
    if (typeof backendRole === 'number') {
      if (backendRole === 0) mappedRole = ROLES.ADMIN;
      else if (backendRole === 1) mappedRole = ROLES.STAFF;
      else if (backendRole === 2) mappedRole = ROLES.CUSTOMER;
      else if (backendRole === 3) mappedRole = ROLES.INSTRUCTOR;
    } else if (typeof backendRole === 'string') {
      const lower = backendRole.toLowerCase();
      if (lower === 'admin') mappedRole = ROLES.ADMIN;
      else if (lower === 'staff') mappedRole = ROLES.STAFF;
      else if (lower === 'instructor' || lower === 'teacher')
        mappedRole = ROLES.INSTRUCTOR;
      else mappedRole = ROLES.CUSTOMER;
    }

    const mappedUser = {
      id: userId,
      _id: userId,
      name: null,
      email: null,
      role: mappedRole,
    };

    await AsyncStorage.setItem('authUser', JSON.stringify(mappedUser));

    set({
      isAuthenticated: true,
      user: mappedUser,
      token: accessToken,
      refreshToken,
    });

    return data;
  },

  register: async payload => {
    const data = await authService.register(payload);
    return data;
  },

  updateUserProfileLocally: async partial => {
    const { user } = get();
    const next = { ...(user || {}), ...partial };
    set({ user: next });
    await AsyncStorage.setItem('authUser', JSON.stringify(next));
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await authService.logout({ refresh_token: refreshToken });
      } else {
        await authService.logout({});
      }
    } catch (error) {
      console.warn('Logout error', error);
    }

    await AsyncStorage.multiRemove(['authToken', 'authUser', 'refreshToken']);
    set({ ...initialState, isInitializing: false });
  },
}));

// Đăng ký callback để axios-client có thể trigger logout khi nhận 401
// Dùng setTimeout để tránh circular init issues
setTimeout(() => {
  setLogoutCallback(() => {
    useAuthStore.setState({ ...initialState, isInitializing: false });
  });
}, 0);

export default useAuthStore;