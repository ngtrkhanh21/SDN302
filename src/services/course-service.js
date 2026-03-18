import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function getCourses(params) {
  const response = await axiosClient.get(ENDPOINTS.COURSE_LIST, { params });
  return response.data;
}

async function getMyCourses() {
  const response = await axiosClient.get(ENDPOINTS.COURSE_MY_COURSES);
  return response.data;
}

async function getCourseDetail(courseId) {
  const response = await axiosClient.get(ENDPOINTS.COURSE_DETAIL(courseId));
  return response.data;
}

async function createCourse(payload) {
  const response = await axiosClient.post(ENDPOINTS.COURSE_CREATE, payload);
  return response.data;
}

async function updateCourse(courseId, payload) {
  const response = await axiosClient.put(
    ENDPOINTS.COURSE_UPDATE(courseId),
    payload,
  );
  return response.data;
}

async function deleteCourse(courseId) {
  const response = await axiosClient.delete(
    ENDPOINTS.COURSE_DELETE(courseId),
  );
  return response.data;
}

const courseService = {
  getCourses,
  getMyCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
};

export default courseService;

