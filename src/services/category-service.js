import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getCategories() {
  const response = await axiosClient.get(ENDPOINTS.CATEGORY_LIST);
  return response.data;
}

async function getCategoryDetail(categoryId) {
  const response = await axiosClient.get(ENDPOINTS.CATEGORY_DETAIL(categoryId));
  return response.data;
}

const categoryService = {
  getCategories,
  getCategoryDetail,
};

export default categoryService;
