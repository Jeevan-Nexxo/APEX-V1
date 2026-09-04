import api from "./api";

export const getStudentProjects = async (studentId) => {
  const response = await api.get(`/project/mine${studentId ? `?studentId=${studentId}` : ""}`);
  return response.data;
};

export const getProjectForManagement = async (id) => {
  const response = await api.get(`/project/manage/${id}`);
  return response.data;
};

export const searchProjects = async (params = {}) => {
  const response = await api.get("/project/search", { params });
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post("/project", projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  const response = await api.put(`/project/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/project/${id}`);
  return response.data;
};


