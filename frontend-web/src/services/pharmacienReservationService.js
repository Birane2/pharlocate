import API from "../api/axios";

// ── Liste paginée ──────────────────────────────────────────────────────────────
// Endpoint : GET /api/pharmacien/reservations/?page=1[&search=...][&status=...][&reservation_status=...]
// Réponse  : { count, current_page, total_pages, next, previous, results }

export async function getReservations({ page = 1, filter = "all", search = "" } = {}) {
  const params = { page };
  if (search.trim()) params.search = search.trim();
  if (filter === "payment_pending") {
    params.status = "en_attente_verification";
  } else if (filter !== "all") {
    params.reservation_status = filter;
  }
  const { data } = await API.get("/api/pharmacien/reservations/", { params });
  return data;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getReservationStats() {
  const { data } = await API.get("/api/pharmacien/reservations/stats/");
  return data;
}

// ── Détail ────────────────────────────────────────────────────────────────────

export async function getPharmacienOrderDetail(id) {
  const { data } = await API.get(`/api/pharmacien/orders/${id}/`);
  return data;
}

// ── Actions paiement ──────────────────────────────────────────────────────────

export async function validateOrderPayment(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/validate-payment/`);
  return data;
}

export async function rejectOrderPayment(id, motif_refus) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/reject-payment/`, { motif_refus });
  return data;
}

// ── Workflow commande ─────────────────────────────────────────────────────────

export async function confirmOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/confirm/`);
  return data;
}

export async function prepareOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/prepare/`);
  return data;
}

export async function readyOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/ready/`);
  return data;
}

export async function pickedUpOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/picked-up/`);
  return data;
}

export async function startDeliveryOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/start-delivery/`);
  return data;
}

export async function deliveredOrder(id) {
  const { data } = await API.patch(`/api/pharmacien/reservations/${id}/delivered/`);
  return data;
}

export async function deleteOrder(id) {
  const { data } = await API.delete(`/api/pharmacien/reservations/${id}/delete/`);
  return data;
}
