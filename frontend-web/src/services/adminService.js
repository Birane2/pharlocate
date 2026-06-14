import API from "../api/axios";

const normalizeDashboardStats = (data = {}) => {
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

export const getAdminDashboardStats = async (date) => {
  const params = date ? { date } : {};
  const res = await API.get("/api/admin/dashboard/", { params });
  return normalizeDashboardStats(res.data);
};
