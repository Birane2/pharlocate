import API from "../api/axios";

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return data?.results || data?.data || [];
}

export async function getPharmacistDeliveries(params = {}) {
  const response = await API.get("/api/pharmacien/deliveries/", { params });
  return normalizeList(response.data);
}

export async function getPharmacistDeliveryDetail(id) {
  const response = await API.get(`/api/pharmacien/deliveries/${id}/`);
  return response.data?.data || response.data;
}

export async function markDeliveryInProgress(id) {
  const response = await API.patch(`/api/pharmacien/deliveries/${id}/in-progress/`);
  return response.data;
}

export async function markDeliveryDelivered(id) {
  console.debug("delivery id =", id);
  const response = await API.patch(`/api/pharmacien/deliveries/${id}/delivered/`);
  console.debug("mark delivered response =", response.data);
  return response.data;
}

export async function cancelDelivery(id) {
  const response = await API.patch(`/api/pharmacien/deliveries/${id}/cancel/`);
  return response.data;
}
