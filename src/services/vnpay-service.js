import axiosClient from "../api/axios-client";
import ENDPOINTS from "../api/endpoints";

async function createVNPayUrl(paymentId, orderInfo) {
  try {
    const response = await axiosClient.post(ENDPOINTS.VNPAY_CREATE_URL, {
      paymentId,
      orderInfo,
    });
    return response.data;
  } catch (_error) {
    const response = await axiosClient.post(ENDPOINTS.VNPAY_CREATE_URL, {
      payment_id: paymentId,
      orderInfo,
    });
    return response.data;
  }
}

async function handleVNPayReturn(params) {
  const response = await axiosClient.get(ENDPOINTS.VNPAY_RETURN, { params });
  return response.data;
}

async function handleVNPayIPN(params) {
  const response = await axiosClient.get(ENDPOINTS.VNPAY_IPN, { params });
  return response.data;
}

const vnpayService = {
  createVNPayUrl,
  handleVNPayReturn,
  handleVNPayIPN,
};

export default vnpayService;
