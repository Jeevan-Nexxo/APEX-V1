import api from "./api";

export const getProjectFiles = async (projectId) => {
  const response = await api.get(`/project-files/${projectId}`);
  return response.data;
};

export const deleteProjectFile = async (fileId) => {
  const response = await api.delete(`/project-files/${fileId}`);
  return response.data;
};

export const uploadProjectFile = async (projectId, file) => {
  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("file", file);

  const response = await api.post("/project-files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
