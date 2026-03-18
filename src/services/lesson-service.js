import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function createLesson(payload) {
  const response = await axiosClient.post(ENDPOINTS.LESSON_CREATE, payload);
  return response.data;
}

async function getLessonsPaged(params) {
  const response = await axiosClient.get(ENDPOINTS.LESSON_PAGED, { params });
  return response.data;
}

async function getLessonsBySession(sessionId) {
  const response = await axiosClient.get(
    ENDPOINTS.LESSON_BY_SESSION(sessionId),
  );
  return response.data;
}

async function getLessonDetail(lessonId) {
  const response = await axiosClient.get(ENDPOINTS.LESSON_DETAIL(lessonId));
  return response.data;
}

async function updateLesson(lessonId, payload) {
  const response = await axiosClient.put(
    ENDPOINTS.LESSON_UPDATE(lessonId),
    payload,
  );
  return response.data;
}

async function deleteLesson(lessonId) {
  const response = await axiosClient.delete(
    ENDPOINTS.LESSON_DELETE(lessonId),
  );
  return response.data;
}

const lessonService = {
  createLesson,
  getLessonsPaged,
  getLessonsBySession,
  getLessonDetail,
  updateLesson,
  deleteLesson,
};

export default lessonService;
