import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function createVNPayUrl(orderId, returnUrl) {
  const response = await axiosClient.post(ENDPOINTS.VNPAY_CREATE_URL, {
    order_id: orderId,
    returnUrl,
  });
  return response.data;
}

async function handleVNPayReturn(params) {
  const response = await axiosClient.get(ENDPOINTS.VNPAY_RETURN, { params });
  return response.data;
}

const vnpayService = {
  createVNPayUrl,
  handleVNPayReturn,
};

export default vnpayService;
