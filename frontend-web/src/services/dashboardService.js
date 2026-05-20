import API from "../api/axios";

export const getPharmacienDashboardStats = async () => {
  const res = await API.get("/api/pharmacien/dashboard/stats/");
  return res.data;
};
