import API from "../api/axios";

export const getAvis = async (params = {}) => {
  const res = await API.get("/api/avis/", { params });
  return res.data.results || res.data || [];
};

export const createAvis = async (payload) => {
  const res = await API.post("/api/avis/", payload);
  return res.data;
};

export const getPharmacienAvis = async () => {
  const res = await API.get("/api/pharmacien/avis/");
  return res.data;
};

export const postReply = async (reviewId, message) => {
  const res = await API.post(`/api/pharmacien/avis/${reviewId}/reply/`, { message });
  return res.data;
};

export const updateReply = async (replyId, message) => {
  const res = await API.put(`/api/pharmacien/replies/${replyId}/`, { message });
  return res.data;
};

export const deleteReply = async (replyId) => {
  await API.delete(`/api/pharmacien/replies/${replyId}/`);
};
