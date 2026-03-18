import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getAllUsers() {
  const response = await axiosClient.get(ENDPOINTS.USER_ALL);
  return response.data;
}

async function getUserById(id) {
  const response = await axiosClient.get(ENDPOINTS.USER_DETAIL(id));
  return response.data;
}

async function getMe() {
  const response = await axiosClient.post(ENDPOINTS.USER_ME);
  return response.data;
}

async function updateMe(payload) {
  const response = await axiosClient.post(ENDPOINTS.USER_UPDATE_ME, payload);
  return response.data;
}

const userService = {
  getAllUsers,
  getUserById,
  getMe,
  updateMe,
};

export default userService;
