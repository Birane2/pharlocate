import API from "../api/axios";

// ── Liste paginée ──────────────────────────────────────────────────────────────
// Endpoint : GET /api/pharmacien/payments/?page=1[&status=...]
// Réponse  : { count, next, previous, current_page, total_pages, results }

export async function getPayments({ page = 1, filter = "all" } = {}) {
  const params = { page };
  if (filter !== "all") params.status = filter;
  const { data } = await API.get("/api/pharmacien/payments/", { params });
  return data;
}

// ── Actions (conservées pour compatibilité avec PharmacienPayments.jsx) ───────

export async function validatePharmacienPayment(id) {
  const { data } = await API.patch(`/api/pharmacien/payments/${id}/validate-payment/`);
  return data;
}

export async function rejectPharmacienPayment(id, motif_refus) {
  const { data } = await API.patch(`/api/pharmacien/payments/${id}/reject-payment/`, { motif_refus });
  return data;
}
