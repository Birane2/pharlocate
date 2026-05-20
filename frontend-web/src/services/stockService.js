import API from "../api/axios";
import { getMedicaments } from "./medicamentService";

export { getMedicaments };

export const getStocks = async (params = {}) => {
  const res = await API.get("/api/stocks/", { params });

  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || [],
  };
};

export const getStocksByPharmacy = async (pharmacyId) => {
  const res = await API.get("/api/medicaments/stocks/", {
    params: { pharmacie_id: pharmacyId },
  });

  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || res.data || [],
  };
};

export const createStock = async (data) => {
  const res = await API.post("/api/medicaments/stocks/", data);
  return res.data;
};

export const addMedicamentToStock = async (data) => {
  const res = await API.post("/api/pharmacien/stocks/add-medicament/", data);
  return res.data;
};

export const updateStock = async (stockId, data) => {
  const res = await API.put(`/api/stocks/${stockId}/`, data);
  return res.data;
};

export const deleteStock = async (stockId) => {
  const res = await API.delete(`/api/stocks/${stockId}/`);
  return res.data;
};
