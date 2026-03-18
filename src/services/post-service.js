import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getPosts(params) {
  const response = await axiosClient.get(ENDPOINTS.BLOG_LIST, { params });
  return response.data;
}

async function getPostById(id) {
  const response = await axiosClient.get(ENDPOINTS.BLOG_DETAIL(id));
  return response.data;
}

async function createPost(payload) {
  const response = await axiosClient.post(ENDPOINTS.BLOG_CREATE, payload);
  return response.data;
}

async function updatePost(id, payload) {
  const response = await axiosClient.put(ENDPOINTS.BLOG_UPDATE(id), payload);
  return response.data;
}

async function deletePost(id) {
  const response = await axiosClient.delete(ENDPOINTS.BLOG_DELETE(id));
  return response.data;
}

const postService = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};

export default postService;

