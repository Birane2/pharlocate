import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  faClock,
  faCreditCard,
  faFileInvoice,
  faCalendarCheck,
  faHospital,
  faMoneyBillWave,
  faRotateLeft,
  faTruck,
  faTriangleExclamation,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";

import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboardStats } from "../../services/adminService";
import { getNotifications, markAllNotificationsRead } from "../../services/notificationService";

import AnalyticsSection from "../../components/admin/dashboard/AnalyticsSection";
import AlertCard from "../../components/admin/dashboard/AlertCard";
import DashboardKpiGrid from "../../components/admin/dashboard/DashboardKpiGrid";
import QuickAccessGrid from "../../components/admin/dashboard/QuickAccessGrid";
import RecentActivities from "../../components/admin/dashboard/RecentActivities";
import RecentNotifications from "../../components/admin/dashboard/RecentNotifications";
import TopPharmacies from "../../components/admin/dashboard/TopPharmacies";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// ─── Default state ────────────────────────────────────────────────────────────

const emptyStats = {
  pharmacies: { total: 0, validees: 0, en_attente: 0, suspendues: 0 },
  users: { total: 0, by_role: { admin: 0, pharmacien: 0, utilisateur: 0 } },
  reservations: { total: 0, en_attente: 0, confirmees: 0, refusees: 0, recuperees: 0 },
  medicaments: { total: 0 },
  stocks: { total: 0, faibles: 0, rupture: 0 },
  latest_activities: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getApiErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.status === 401) return "Votre session a expiré. Veuillez vous reconnecter.";
  if (error.response?.status === 403) return "Accès refusé. Cette page est réservée aux administrateurs.";
  return "Impossible de charger les statistiques du dashboard.";
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MRU`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const hasLoadedDashboard = useRef(false);

  // Load recent notifications once on mount
  useEffect(() => {
    getNotifications({ page: 1, page_size: 5 })
      .then((data) => {
        setRecentNotifs(data.results || []);
        setUnreadNotifCount((data.results || []).filter((n) => !n.est_lue).length);
      })
      .catch(() => {});
  }, []);

  // Load dashboard stats
  useEffect(() => {
    let isMounted = true;
    getAdminDashboardStats({ startDate, endDate })
      .then((data) => { if (isMounted) setStats(data); })
      .catch((err) => { if (isMounted) setError(getApiErrorMessage(err)); })
      .finally(() => {
        if (isMounted) {
          hasLoadedDashboard.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { isMounted = false; };
  }, [startDate, endDate, refreshKey]);

  const handleMarkAllNotifRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, est_lue: true })));
      setUnreadNotifCount(0);
    } catch { /* silent */ }
  }, []);

  // ─── Period helpers ──────────────────────────────────────────────────────────

  const applyPeriod = (nextStart, nextEnd) => {
    setError("");
    setRefreshing(hasLoadedDashboard.current);
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setRefreshKey((k) => k + 1);
  };

  const handleRefresh = () => {
    setError("");
    setRefreshing(hasLoadedDashboard.current);
    setRefreshKey((k) => k + 1);
  };

  // ─── Derived data ────────────────────────────────────────────────────────────

  const apiAlerts = useMemo(() => stats.alerts || {}, [stats.alerts]);
  const kpis = useMemo(() => stats.stats || {}, [stats.stats]);
  const charts = stats.charts || {};
  const pharmacies = stats.pharmacies || emptyStats.pharmacies;
  const users = stats.users || emptyStats.users;
  const reservations = stats.reservations || emptyStats.reservations;
  const activities = stats.recent_activities || stats.latest_activities || [];
  const topPharmacies = stats.top_pharmacies || [];
  const activePeriodKey = `${startDate || "all"}-${endDate || "all"}`;

  const hasPeriodFilter = Boolean(startDate || endDate);
  const hasNoDataForSelectedDate =
    hasPeriodFilter &&
    !loading &&
    !refreshing &&
    !error &&
    (pharmacies.total || 0) === 0 &&
    (users.total || 0) === 0 &&
    (reservations.total || 0) === 0;

  // 6 main KPI cards
  const kpiCards = useMemo(
    () => [
      {
        label: "Utilisateurs",
        value: kpis.total_users ?? users.total ?? 0,
        icon: faUsersGear,
        tone: "blue",
      },
      {
        label: "Pharmacies",
        value: kpis.total_pharmacies ?? pharmacies.total ?? 0,
        icon: faHospital,
        tone: "teal",
      },
      {
        label: "Réservations",
        value: kpis.total_reservations ?? reservations.total ?? 0,
        icon: faCalendarCheck,
        tone: "lightBlue",
      },
      {
        label: "Revenus",
        value: formatMoney(kpis.subscription_revenue ?? kpis.commission_revenue ?? 0),
        icon: faMoneyBillWave,
        tone: "green",
      },
      {
        label: "Pmts en attente",
        value: kpis.pending_payments ?? apiAlerts.pending_payments ?? 0,
        icon: faCreditCard,
        tone: "orange",
      },
      {
        label: "Livraisons actives",
        value: kpis.active_deliveries ?? apiAlerts.active_deliveries ?? 0,
        icon: faTruck,
        tone: "teal",
      },
    ],
    [apiAlerts, kpis, pharmacies.total, reservations.total, users.total]
  );

  // 4 priority alerts
  const alertCards = useMemo(
    () => [
      {
        label: "Paiements en attente",
        value: kpis.pending_payments ?? apiAlerts.pending_payments ?? 0,
        icon: faCreditCard,
        tone: "orange",
        to: "/admin/payments",
      },
      {
        label: "Pharmacies à valider",
        value: kpis.pending_pharmacies ?? pharmacies.en_attente ?? 0,
        icon: faClock,
        tone: "yellow",
        to: "/admin/pharmacies-validation",
      },
      {
        label: "Factures impayées",
        value: kpis.unpaid_commission_invoices ?? apiAlerts.unpaid_commission_invoices ?? 0,
        icon: faTriangleExclamation,
        tone: "danger",
        to: "/admin/finance/commission-invoices",
      },
      {
        label: "Remboursements",
        value: kpis.pending_refunds ?? apiAlerts.pending_refunds ?? 0,
        icon: faRotateLeft,
        tone: "orange",
        to: "/admin/refunds",
      },
    ],
    [apiAlerts, kpis, pharmacies.en_attente]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      title="Dashboard administrateur"
      subtitle="Vue générale de l'activité PharmaLocate."
      showDateFilter
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={(d) => applyPeriod(d, endDate)}
      onEndDateChange={(d) => applyPeriod(startDate, d)}
      onTodayClick={() => { const t = getTodayDate(); applyPeriod(t, t); }}
      onAllDataClick={() => applyPeriod("", "")}
      onResetClick={handleRefresh}
      actionLoading={refreshing}
    >
      <div className="space-y-4">

        {/* Status banners */}
        {refreshing && (
          <div className="rounded-xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/8 px-4 py-2.5 text-xs font-bold text-[#167769]">
            Actualisation en cours…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700">
            {error}
          </div>
        )}
        {hasNoDataForSelectedDate && (
          <div className="rounded-xl border border-[#2F6E9E]/10 bg-white px-4 py-2.5 text-xs font-semibold text-[#6B7280]">
            Aucune donnée disponible pour cette période.
          </div>
        )}

        {/* KPI grid */}
        <DashboardKpiGrid cards={kpiCards} loading={loading} />

        {/* Priority alerts */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {alertCards.map((alert) => (
            <AlertCard key={alert.label} {...alert} />
          ))}
        </section>

        {/* Main area: Analytics + Sidebar */}
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          {/* Charts */}
          <AnalyticsSection charts={charts} periodKey={activePeriodKey} />

          {/* Right sidebar */}
          <aside className="space-y-4">
            <QuickAccessGrid />
            <TopPharmacies pharmacies={topPharmacies} />
          </aside>
        </div>

        {/* Bottom: Activities + Notifications */}
        <div className="grid gap-4 xl:grid-cols-2">
          <RecentActivities activities={activities} />
          <RecentNotifications
            notifications={recentNotifs}
            unreadCount={unreadNotifCount}
            onMarkAllRead={handleMarkAllNotifRead}
          />
        </div>

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
