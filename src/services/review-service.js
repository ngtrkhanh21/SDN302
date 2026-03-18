import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getReviews(params) {
  const response = await axiosClient.get(ENDPOINTS.REVIEW_LIST, { params });
  return response.data;
}

async function createCourseReview(payload) {
  const response = await axiosClient.post(
    ENDPOINTS.REVIEW_CREATE_FOR_COURSE,
    payload,
  );
  return response.data;
}

async function getReviewsByCourse(courseId) {
  const response = await axiosClient.get(
    ENDPOINTS.REVIEW_BY_COURSE(courseId),
  );
  return response.data;
}

async function getReviewsByUser(userId) {
  const response = await axiosClient.get(
    ENDPOINTS.REVIEW_BY_USER(userId),
  );
  return response.data;
}

const reviewService = {
  getReviews,
  createCourseReview,
  getReviewsByCourse,
  getReviewsByUser,
};

export default reviewService;
