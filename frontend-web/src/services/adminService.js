import API from "../api/axios";

export const getAdminDashboardStats = async () => {
  const res = await API.get("/api/admin/dashboard/stats/");
  return res.data;
};
