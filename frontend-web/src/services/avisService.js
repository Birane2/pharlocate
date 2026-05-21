import API from "../api/axios";

export const getAvis = async (params = {}) => {
  const res = await API.get("/api/avis/", { params });
  return res.data.results || res.data || [];
};

export const createAvis = async (payload) => {
  const res = await API.post("/api/avis/", payload);
  return res.data;
};
