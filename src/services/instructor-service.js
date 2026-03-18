import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getInstructors(params) {
  const response = await axiosClient.get(ENDPOINTS.INSTRUCTOR_LIST, {
    params,
  });
  return response.data;
}

async function getOrderHistory(params) {
  const response = await axiosClient.get(
    ENDPOINTS.INSTRUCTOR_ORDER_HISTORY,
    { params },
  );
  return response.data;
}

async function getCourseSalesSummary() {
  const response = await axiosClient.get(
    ENDPOINTS.INSTRUCTOR_SALES_SUMMARY,
  );
  return response.data;
}

async function getInstructorRequests(params) {
  const response = await axiosClient.get(
    ENDPOINTS.INSTRUCTOR_REQUEST_LIST,
    { params },
  );
  return response.data;
}

async function getInstructorDetail(instructorId) {
  const response = await axiosClient.get(
    ENDPOINTS.INSTRUCTOR_DETAIL(instructorId),
  );
  return response.data;
}

async function updateInstructor(instructorId, payload) {
  const response = await axiosClient.put(
    ENDPOINTS.INSTRUCTOR_UPDATE(instructorId),
    payload,
  );
  return response.data;
}

async function deleteInstructor(instructorId) {
  const response = await axiosClient.delete(
    ENDPOINTS.INSTRUCTOR_DELETE(instructorId),
  );
  return response.data;
}

async function reviewInstructorRequest(requestId, payload) {
  const response = await axiosClient.patch(
    ENDPOINTS.INSTRUCTOR_REQUEST_REVIEW(requestId),
    payload,
  );
  return response.data;
}

async function becomeInstructor(payload) {
  const response = await axiosClient.post(
    ENDPOINTS.USER_BECOME_INSTRUCTOR,
    payload,
  );
  return response.data;
}

const instructorService = {
  getInstructors,
  getOrderHistory,
  getCourseSalesSummary,
  getInstructorRequests,
  getInstructorDetail,
  updateInstructor,
  deleteInstructor,
  reviewInstructorRequest,
  becomeInstructor,
};

export default instructorService;
