import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getAdminOverview() {
  const [coursesRes, ordersRes] = await Promise.all([
    axiosClient.get(ENDPOINTS.COURSE_LIST),
    axiosClient.get(ENDPOINTS.ORDER_ALL),
  ]);

  const courses = coursesRes.data?.data || coursesRes.data || [];
  const orders = ordersRes.data?.data || ordersRes.data || [];

  return {
    totalCourses: Array.isArray(courses) ? courses.length : 0,
    totalOrders: Array.isArray(orders) ? orders.length : 0,
  };
}

const reportService = {
  getAdminOverview,
};

export default reportService;

