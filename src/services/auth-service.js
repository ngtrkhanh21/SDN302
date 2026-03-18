// src/services/auth-service.js
import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function login(payload) {
  const response = await axiosClient.post(ENDPOINTS.AUTH_LOGIN, payload);
  return response.data;
}

async function register(payload) {
  const response = await axiosClient.post(ENDPOINTS.AUTH_REGISTER, payload);
  return response.data;
}

async function logout(body) {
  const response = await axiosClient.post(ENDPOINTS.AUTH_LOGOUT, body);
  return response.data;
}

async function verifyEmail(params) {
  const response = await axiosClient.get(ENDPOINTS.AUTH_VERIFY_EMAIL, {
    params,
  });
  return response.data;
}

async function changePassword(payload) {
  const response = await axiosClient.put(
    ENDPOINTS.AUTH_CHANGE_PASSWORD,
    payload,
  );
  return response.data;
}

async function getCurrentUser() {
  const response = await axiosClient.post(ENDPOINTS.USER_ME);
  return response.data;
}

async function updateCurrentUser(payload) {
  const response = await axiosClient.post(ENDPOINTS.USER_UPDATE_ME, payload);
  return response.data;
}

const authService = {
  login,
  register,
  logout,
  verifyEmail,
  changePassword,
  getCurrentUser,
  updateCurrentUser,
};

export default authService;