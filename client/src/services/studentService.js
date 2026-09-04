import api from "./api";

export const getDashboard = async () => {
  const response = await api.get("/student/dashboard");
  return response.data;
};
