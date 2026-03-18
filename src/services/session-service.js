import axiosClient from '../api/axios-client';
import ENDPOINTS from '../api/endpoints';

async function createSession(payload) {
  const response = await axiosClient.post(ENDPOINTS.SESSION_CREATE, payload);
  return response.data;
}

async function getAllSessions(params) {
  const response = await axiosClient.get(ENDPOINTS.SESSION_ALL, { params });
  return response.data;
}

async function getSessionsByCourse(courseId) {
  const response = await axiosClient.get(
    ENDPOINTS.SESSION_BY_COURSE(courseId),
  );
  return response.data;
}

async function getSessionDetail(sessionId) {
  const response = await axiosClient.get(ENDPOINTS.SESSION_DETAIL(sessionId));
  return response.data;
}

async function updateSession(sessionId, payload) {
  const response = await axiosClient.put(
    ENDPOINTS.SESSION_UPDATE(sessionId),
    payload,
  );
  return response.data;
}

async function deleteSession(sessionId) {
  const response = await axiosClient.delete(
    ENDPOINTS.SESSION_DELETE(sessionId),
  );
  return response.data;
}

const sessionService = {
  createSession,
  getAllSessions,
  getSessionsByCourse,
  getSessionDetail,
  updateSession,
  deleteSession,
};

export default sessionService;
