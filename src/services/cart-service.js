import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function addCourseToCart(courseId) {
  const response = await axiosClient.post(ENDPOINTS.CART_ADD, {
    course_id: courseId,
  });
  return response.data;
}

async function getMyCart() {
  const response = await axiosClient.get(ENDPOINTS.CART_GET_MY_CART);
  return response.data;
}

async function removeCartItem(cartItemId) {
  const response = await axiosClient.delete(
    ENDPOINTS.CART_REMOVE_ITEM(cartItemId),
  );
  return response.data;
}

async function clearCart() {
  const response = await axiosClient.delete(ENDPOINTS.CART_CLEAR);
  return response.data;
}

const cartService = {
  addCourseToCart,
  getMyCart,
  removeCartItem,
  clearCart,
};

export default cartService;
