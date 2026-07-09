import API from "../api/axios";

// ── Liste paginée ──────────────────────────────────────────────────────────────
// Endpoint : GET /api/pharmacien/deliveries/?page=1[&status=...][&search=...]
// Réponse  : { count, next, previous, current_page, total_pages, results }

export async function getDeliveries({ page = 1, filter = "all", search = "" } = {}) {
  const params = { page };
  if (filter !== "all") params.delivery_status = filter;
  if (search.trim()) params.search = search.trim();
  const { data } = await API.get("/api/pharmacien/deliveries/", { params });
  return data;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getDeliveryStats() {
  const { data } = await API.get("/api/pharmacien/deliveries/stats/");
  return data;
}

// ── Détail ────────────────────────────────────────────────────────────────────

export async function getPharmacienDeliveryDetail(id) {
  const { data } = await API.get(`/api/pharmacien/deliveries/${id}/`);
  return data;
}

// ── Actions statut ────────────────────────────────────────────────────────────

export async function markDeliveryInProgress(id) {
  const { data } = await API.patch(`/api/pharmacien/deliveries/${id}/in-progress/`);
  return data;
}

export async function markDeliveryDelivered(id) {
  const { data } = await API.patch(`/api/pharmacien/deliveries/${id}/delivered/`);
  return data;
}

export async function cancelDelivery(id) {
  const { data } = await API.patch(`/api/pharmacien/deliveries/${id}/cancel/`);
  return data;
}
