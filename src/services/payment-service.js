import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function createPaymentFromOrder(orderId, paymentMethod = 'vnpay') {
  const response = await axiosClient.post(
    ENDPOINTS.PAYMENT_CREATE_FROM_ORDER,
    {
      order_id: orderId,
      paymentMethod,
    },
  );
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
  const response = await axiosClient.put(
    ENDPOINTS.PAYMENT_UPDATE_STATUS(paymentId),
    payload,
  );
  return response.data;
}

const paymentService = {
  createPaymentFromOrder,
  getPaymentHistoryByUser,
  getPaymentDetail,
  updatePaymentStatus,
};

export default paymentService;
