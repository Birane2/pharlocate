import API from "../api/axios";

export const getHoraires = async (params = {}) => {
  const res = await API.get("/api/horaires/", { params });
  return res.data;
};

export const getHoraireDetail = async (horaireId) => {
  const res = await API.get(`/api/horaires/${horaireId}/`);
  return res.data;
};

export const createHoraire = async (data) => {
  const res = await API.post("/api/horaires/", data);
  return res.data;
};

export const updateHoraire = async (horaireId, data) => {
  const res = await API.put(`/api/horaires/${horaireId}/`, data);
  return res.data;
};

export const deleteHoraire = async (horaireId) => {
  const res = await API.delete(`/api/horaires/${horaireId}/`);
  return res.data;
};
