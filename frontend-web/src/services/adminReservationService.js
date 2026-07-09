import API from "../api/axios";

const BASE = "/api/admin/reservations";

function buildParams(filters = {}) {
  const p = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) p[k] = v;
  });
  return p;
}

export async function getAdminReservations(params = {}) {
  const clean = buildParams(params);
  console.log("[Reservations] GET list params:", clean);
  const { data } = await API.get(`${BASE}/`, { params: clean });
  console.log("[Reservations] GET list response:", data);
  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : [],
  };
}

export async function getAdminReservationDetail(id) {
  console.log("[Reservations] GET detail id:", id);
  const { data } = await API.get(`${BASE}/${id}/`);
  console.log("[Reservations] GET detail response:", data);
  return data;
}

