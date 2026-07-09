import API from "../api/axios";

// ── Liste paginée ──────────────────────────────────────────────────────────────
// Endpoint : GET /api/pharmacien/transactions/?page=1[&search=...]
// Réponse  : { count, next, previous, current_page, total_pages, results }

export async function getTransactions({ page = 1, search = "" } = {}) {
  const params = { page };
  if (search.trim()) params.search = search.trim();
  const { data } = await API.get("/api/pharmacien/transactions/", { params });
  return data;
}
