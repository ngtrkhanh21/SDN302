import axiosClient from "../api/axios-client";
import ENDPOINTS from "../api/endpoints";

async function createPaymentFromOrder(orderId, paymentMethod = "vnpay") {
  const response = await axiosClient.post(ENDPOINTS.PAYMENT_CREATE_FROM_ORDER, {
    order_id: orderId,
    paymentMethod,
  });
  return response.data;
}

async function getPaymentHistoryByUser(userId) {
  const response = await axiosClient.get(
    ENDPOINTS.PAYMENT_HISTORY_BY_USER(userId),
  );
  return response.data;
}

async function getPaymentDetail(paymentId) {
  const response = await axiosClient.get(ENDPOINTS.PAYMENT_DETAIL(paymentId));
  return response.data;
}

async function updatePaymentStatus(paymentId, payload) {
  try {
    const response = await axiosClient.put(
      ENDPOINTS.PAYMENT_UPDATE_STATUS(paymentId),
      payload,
    );
    return response.data;
  } catch (putError) {
    const status = putError?.response?.status;

    if (status === 404 || status === 405 || status === 501) {
      try {
        const response = await axiosClient.patch(
          ENDPOINTS.PAYMENT_UPDATE_STATUS(paymentId),
          payload,
        );
        return response.data;
      } catch (_patchError) {
        const response = await axiosClient.post(
          ENDPOINTS.PAYMENT_UPDATE_STATUS(paymentId),
          payload,
        );
        return response.data;
      }
    }

    throw putError;
  }
}

const paymentService = {
  createPaymentFromOrder,
  getPaymentHistoryByUser,
  getPaymentDetail,
  updatePaymentStatus,
};

export default paymentService;
