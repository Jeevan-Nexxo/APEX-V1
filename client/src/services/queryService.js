import api from "./api";

export const createQuery = async (payload) => {
  const response = await api.post("/queries", payload);
  return response.data;
};

export const getMyQueries = async () => {
  const response = await api.get("/queries/mine");
  return response.data;
};

export const getQueryUnreadCount = async () => {
  const response = await api.get("/queries/unread-count");
  return response.data;
};

export const getQueryThread = async (threadId) => {
  const response = await api.get(`/queries/thread/${threadId}`);
  return response.data;
};

export const sendQueryFollowUp = async (threadId, message) => {
  const response = await api.post(`/queries/thread/${threadId}/messages`, { message });
  return response.data;
};

export const getAllQueries = async () => {
  const response = await api.get("/queries/all");
  return response.data;
};

export const replyToQuery = async (threadId, message) => {
  const response = await api.post(`/queries/thread/${threadId}/reply`, { message });
  return response.data;
};

export const closeQuery = async (threadId) => {
  const response = await api.patch(`/queries/thread/${threadId}/close`);
  return response.data;
};
