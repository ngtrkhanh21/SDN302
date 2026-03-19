import axiosClient from "../api/axios-client";
import ENDPOINTS from "../api/endpoints";

async function createOrderFromCart(selectedCartItemIds) {
  const response = await axiosClient.post(ENDPOINTS.ORDER_CREATE_FROM_CART, {
    selectedCartItemIds,
  });
  return response.data;
}

async function getMyOrders() {
  const response = await axiosClient.get(ENDPOINTS.ORDER_MY_ORDERS);
  return response.data;
}

async function getAllOrders() {
  const response = await axiosClient.get(ENDPOINTS.ORDER_ALL);
  return response.data;
}

async function getOrderDetail(orderId) {
  const response = await axiosClient.get(ENDPOINTS.ORDER_DETAIL(orderId));
  return response.data;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await axiosClient.put(
      ENDPOINTS.ORDER_UPDATE_STATUS(orderId, newStatus),
    );
    return response.data;
  } catch (putError) {
    const status = putError?.response?.status;

    if (status === 404 || status === 405 || status === 501) {
      try {
        const response = await axiosClient.patch(
          ENDPOINTS.ORDER_UPDATE_STATUS(orderId, newStatus),
        );
        return response.data;
      } catch (_patchError) {
        const response = await axiosClient.post(
          ENDPOINTS.ORDER_UPDATE_STATUS(orderId, newStatus),
        );
        return response.data;
      }
    }

    throw putError;
  }
}

const orderService = {
  createOrderFromCart,
  getMyOrders,
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
};

export default orderService;
