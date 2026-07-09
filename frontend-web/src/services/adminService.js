import API from "../api/axios";

const normalizeDashboardStats = (data = {}) => {
  data = data || {};
  const stats = data.stats || {};
  const charts = data.charts || {};
  const alerts = data.alerts || {};
  const pharmaciesDistribution = charts.pharmacies_distribution || {};
  const reservationsByStatus = charts.reservations_by_status || {};

  return {
    ...data,
    pharmacies: data.pharmacies || {
      total: stats.total_pharmacies || 0,
      validees: stats.validated_pharmacies || 0,
      en_attente: stats.pending_pharmacies || 0,
      suspendues: pharmaciesDistribution.suspended || 0,
      refusees: pharmaciesDistribution.refused || 0,
    },
    users: data.users || {
      total: stats.total_users || 0,
      by_role: {
        admin: stats.total_admins || 0,
        pharmacien: stats.total_pharmacists || 0,
        utilisateur: stats.total_customers || 0,
      },
    },
    reservations: data.reservations || {
      total: stats.total_reservations || 0,
      en_attente: reservationsByStatus.en_attente || alerts.pending_reservations || 0,
      confirmees: reservationsByStatus.confirmee || 0,
      refusees: reservationsByStatus.refusee || 0,
      recuperees: reservationsByStatus.recuperee || 0,
      annulees: reservationsByStatus.annulee || 0,
    },
    medicaments: data.medicaments || {
      total: stats.total_medicaments || 0,
    },
    stocks: data.stocks || {
      total: stats.total_stocks || 0,
      faibles: alerts.low_stocks || 0,
      rupture: alerts.out_of_stocks || 0,
    },
    latest_activities: data.latest_activities || data.recent_activities || [],
    recent_activities: data.recent_activities || data.latest_activities || [],
  };
};

// ─── Admin Reservations ───────────────────────────────────────────────────────

export const getAdminReservations = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const res = await API.get("/api/admin/reservations/", { params: clean });
  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || [],
  };
};

export const getAdminReservationDetail = async (id) => {
  const res = await API.get(`/api/admin/reservations/${id}/`);
  return res.data;
};

// ─── Admin Deliveries ─────────────────────────────────────────────────────────

export const getAdminDeliveries = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const res = await API.get("/api/admin/deliveries/", { params: clean });
  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || [],
  };
};

export const getAdminDeliveryDetail = async (id) => {
  const res = await API.get(`/api/admin/deliveries/${id}/`);
  return res.data;
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getAdminDashboardStats = async (filters = {}) => {
  const params = {};
  const startDate = filters?.startDate || filters?.start_date || "";
  const endDate = filters?.endDate || filters?.end_date || "";

  if (startDate) {
    params.start_date = startDate;
  }

  if (endDate) {
    params.end_date = endDate;
  }

  const res = await API.get("/api/admin/dashboard/", { params });
  return normalizeDashboardStats(res.data);
};
