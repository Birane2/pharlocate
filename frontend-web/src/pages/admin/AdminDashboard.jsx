import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBoxesStacked,
  faCalendarCheck,
  faBell,
  faBolt,
  faChartLine,
  faCircleCheck,
  faClock,
  faCreditCard,
  faHospital,
  faMoneyBillWave,
  faReceipt,
  faRotateLeft,
  faShieldHalved,
  faTriangleExclamation,
  faTruck,
  faUserDoctor,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
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
import { Bar, Doughnut, Line } from "react-chartjs-2";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboardStats } from "../../services/adminService";
import { getNotifications, markAllNotificationsRead } from "../../services/notificationService";

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

const emptyStats = {
  pharmacies: { total: 0, validees: 0, en_attente: 0, suspendues: 0 },
  users: { total: 0, by_role: { admin: 0, pharmacien: 0, utilisateur: 0 } },
  reservations: {
    total: 0,
    en_attente: 0,
    confirmees: 0,
    refusees: 0,
    recuperees: 0,
  },
  medicaments: { total: 0 },
  stocks: { total: 0, faibles: 0, rupture: 0 },
  latest_activities: [],
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getApiErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse. Cette page est reservee aux administrateurs.";
  }

  return "Impossible de charger les statistiques du dashboard.";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} MRU`;
}

function formatMonth(value) {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
    new Date(Number(year), Number(month) - 1, 1)
  );
}

function getStatusLabel(status) {
  const labels = {
    validee: "Validee",
    en_attente: "En attente",
    suspendue: "Suspendue",
    refusee: "Refusee",
    confirmee: "Confirmee",
    recuperee: "Recuperee",
    annulee: "Annulee",
  };

  return labels[status] || status || "Info";
}

function getStatusClass(status) {
  if (["refusee", "annulee", "suspendue"].includes(status)) {
    return "bg-[#EF4444]/10 text-[#DC2626]";
  }

  if (status === "en_attente") {
    return "bg-[#F59E0B]/12 text-[#B45309]";
  }

  if (["validee", "confirmee", "recuperee"].includes(status)) {
    return "bg-[#10B981]/10 text-[#047857]";
  }

  return "bg-[#2F6E9E]/10 text-[#2F6E9E]";
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="h-[92px] animate-pulse rounded-2xl bg-white/80" />
      ))}
    </div>
  );
}

function PriorityAlert({ label, value, icon, tone = "blue" }) {
  const toneClass =
    tone === "danger"
      ? "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]"
      : tone === "orange"
        ? "bg-[#FFF7ED] text-[#D97706] border-[#FED7AA]"
        : tone === "yellow"
          ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
        : "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";

  return (
    <article className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
        <div>
          <p className="text-base font-black">{value}</p>
          <p className="text-xs font-semibold text-[#1C2B4A]">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 opacity-70" />
      </div>
    </article>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
      <h2 className="text-sm font-bold text-[#1C2B4A]">{title}</h2>
      <div className="mt-3 h-[280px] max-h-[280px]">{children}</div>
    </article>
  );
}

const NOTIF_ICONS = {
  reservation: faCalendarCheck,
  payment: faBell,
  delivery: faBell,
  subscription: faBell,
  commission: faBell,
  system: faBell,
};

const NOTIF_COLORS = {
  reservation: "text-[#2F6E9E] bg-[#2F6E9E]/10",
  payment: "text-[#10B981] bg-[#10B981]/10",
  delivery: "text-[#2FA6A3] bg-[#2FA6A3]/10",
  subscription: "text-[#8B5CF6] bg-[#8B5CF6]/10",
  commission: "text-[#F59E0B] bg-[#F59E0B]/10",
  system: "text-[#6B7280] bg-[#6B7280]/10",
};

function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `Il y a ${days} j` : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(dateStr));
}

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

  const handleMarkAllNotifRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, est_lue: true })));
      setUnreadNotifCount(0);
    } catch { /* silent */ }
  }, []);

  // Load recent notifications once on mount
  useEffect(() => {
    getNotifications({ page: 1, page_size: 5 })
      .then((data) => {
        setRecentNotifs(data.results || []);
        setUnreadNotifCount((data.results || []).filter((n) => !n.est_lue).length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    getAdminDashboardStats({ startDate, endDate })
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (isMounted) {
          hasLoadedDashboard.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, refreshKey]);

  const apiAlerts = useMemo(() => stats.alerts || {}, [stats.alerts]);
  const pharmacies = stats.pharmacies || emptyStats.pharmacies;
  const users = stats.users || emptyStats.users;
  const kpis = useMemo(() => stats.stats || {}, [stats.stats]);
  const charts = stats.charts || {};
  const usersByRole = users.by_role || emptyStats.users.by_role;
  const reservations = stats.reservations || emptyStats.reservations;
  const medicaments = stats.medicaments || emptyStats.medicaments;
  const stocks = stats.stocks || emptyStats.stocks;
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
    (reservations.total || 0) === 0 &&
    (medicaments.total || 0) === 0 &&
    (stocks.total || 0) === 0;

  const statCards = useMemo(
    () => [
      {
        label: "Utilisateurs",
        value: kpis.total_users ?? users.total ?? 0,
        icon: faUsersGear,
        tone: "blue",
      },
      {
        label: "Pharmaciens",
        value: kpis.total_pharmacists ?? usersByRole.pharmacien ?? 0,
        icon: faUserDoctor,
        tone: "purple",
      },
      {
        label: "Pharmacies",
        value: kpis.total_pharmacies ?? pharmacies.total ?? 0,
        icon: faHospital,
        tone: "blue",
      },
      {
        label: "En validation",
        value: kpis.pending_pharmacies ?? pharmacies.en_attente ?? 0,
        icon: faClock,
        tone: "orange",
      },
      {
        label: "Validees",
        value: kpis.validated_pharmacies ?? pharmacies.validees ?? 0,
        icon: faCircleCheck,
        tone: "green",
      },
      {
        label: "Reservations",
        value: kpis.total_reservations ?? reservations.total ?? 0,
        icon: faCalendarCheck,
        tone: "lightBlue",
      },
      {
        label: "Paiements attente",
        value: kpis.pending_payments ?? apiAlerts.pending_payments ?? 0,
        icon: faCreditCard,
        tone: "orange",
      },
      {
        label: "Paiements valides",
        value: kpis.validated_payments ?? 0,
        icon: faCreditCard,
        tone: "teal",
      },
      {
        label: "Revenus abonnements",
        value: formatMoney(kpis.subscription_revenue),
        icon: faMoneyBillWave,
        tone: "green",
      },
      {
        label: "Commissions",
        value: formatMoney(kpis.commissions_generated ?? kpis.commission_revenue),
        icon: faReceipt,
        tone: "blue",
      },
      {
        label: "Factures impayees",
        value: kpis.unpaid_commission_invoices ?? apiAlerts.unpaid_commission_invoices ?? 0,
        icon: faTriangleExclamation,
        tone: "danger",
      },
      {
        label: "Remb. attente",
        value: kpis.pending_refunds ?? apiAlerts.pending_refunds ?? 0,
        icon: faRotateLeft,
        tone: "orange",
      },
      {
        label: "Livraisons actives",
        value: kpis.active_deliveries ?? apiAlerts.active_deliveries ?? 0,
        icon: faTruck,
        tone: "teal",
      },
      {
        label: "Standard",
        value: kpis.standard_subscriptions ?? 0,
        icon: faShieldHalved,
        tone: "lightBlue",
      },
      {
        label: "Premium",
        value: kpis.premium_subscriptions ?? 0,
        icon: faShieldHalved,
        tone: "purple",
      },
    ],
    [apiAlerts, kpis, pharmacies, reservations.total, users.total, usersByRole.pharmacien]
  );

  const pharmacyChartData = useMemo(
    () => ({
      labels: ["Validees", "En attente", "Suspendues"],
      datasets: [
        {
          data: [
            pharmacies.validees || 0,
            pharmacies.en_attente || 0,
            pharmacies.suspendues || 0,
          ],
          backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
          borderColor: "#FFFFFF",
          borderWidth: 5,
          hoverOffset: 6,
        },
      ],
    }),
    [pharmacies.en_attente, pharmacies.suspendues, pharmacies.validees]
  );

  const reservationChartData = useMemo(
    () => ({
      labels: ["En attente", "Confirmees", "Recuperees", "Refusees"],
      datasets: [
        {
          label: "Reservations",
          data: [
            reservations.en_attente || 0,
            reservations.confirmees || 0,
            reservations.recuperees || 0,
            reservations.refusees || 0,
          ],
          backgroundColor: ["#F59E0B", "#2F6E9E", "#2FA6A3", "#EF4444"],
          borderRadius: 10,
          maxBarThickness: 36,
        },
      ],
    }),
    [
      reservations.confirmees,
      reservations.en_attente,
      reservations.recuperees,
      reservations.refusees,
    ]
  );

  const reservationsByMonthData = useMemo(
    () => ({
      labels: (charts.reservations_by_month || []).map((item) => formatMonth(item.month)),
      datasets: [
        {
          label: "Reservations",
          data: (charts.reservations_by_month || []).map((item) => item.count || 0),
          borderColor: "#2F6E9E",
          backgroundColor: "rgba(47,110,158,0.12)",
          pointBackgroundColor: "#2FA6A3",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [charts.reservations_by_month]
  );

  const revenueByMonthData = useMemo(
    () => ({
      labels: (charts.revenue_by_month || []).map((item) => formatMonth(item.month)),
      datasets: [
        {
          label: "Revenus plateforme",
          data: (charts.revenue_by_month || []).map((item) => Number(item.amount || 0)),
          borderColor: "#2FA6A3",
          backgroundColor: "rgba(47,166,163,0.12)",
          pointBackgroundColor: "#2F6E9E",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [charts.revenue_by_month]
  );

  const subscriptionsChartData = useMemo(
    () => {
      const plans = charts.subscriptions_by_plan || {};
      return {
        labels: ["Gratuit", "Standard", "Premium"],
        datasets: [
          {
            data: [plans.free || 0, plans.standard || 0, plans.premium || 0],
            backgroundColor: ["#4A8BBE", "#2FA6A3", "#1C2B4A"],
            borderColor: "#FFFFFF",
            borderWidth: 5,
            hoverOffset: 6,
          },
        ],
      };
    },
    [charts.subscriptions_by_plan]
  );

  const paymentsChartData = useMemo(
    () => {
      const paymentsByStatus = charts.payments_by_status || {};
      return {
        labels: ["Attente", "Valides", "Refuses", "Rembourses"],
        datasets: [
          {
            label: "Paiements",
            data: [
              paymentsByStatus.pending || 0,
              paymentsByStatus.validated || 0,
              paymentsByStatus.rejected || 0,
              paymentsByStatus.refunded || 0,
            ],
            backgroundColor: ["#F59E0B", "#2FA6A3", "#EF4444", "#4A8BBE"],
            borderRadius: 10,
            maxBarThickness: 36,
          },
        ],
      };
    },
    [charts.payments_by_status]
  );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 9,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#6B7280",
          font: { size: 11, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1C2B4A",
        bodyColor: "#1C2B4A",
        borderColor: "#E2E8F2",
        borderWidth: 1,
        displayColors: false,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1C2B4A",
        bodyColor: "#1C2B4A",
        borderColor: "#E2E8F2",
        borderWidth: 1,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: { size: 11, weight: "600" } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#EEF2F7" },
        ticks: { precision: 0, color: "#6B7280", font: { size: 11 } },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#1C2B4A",
        bodyColor: "#1C2B4A",
        borderColor: "#E2E8F2",
        borderWidth: 1,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: { size: 11, weight: "600" } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#EEF2F7" },
        ticks: { precision: 0, color: "#6B7280", font: { size: 11 } },
      },
    },
  };

  const applyPeriod = (nextStartDate, nextEndDate) => {
    setError("");
    setRefreshing(hasLoadedDashboard.current);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleStartDateChange = (date) => {
    applyPeriod(date, endDate);
  };

  const handleEndDateChange = (date) => {
    applyPeriod(startDate, date);
  };

  const handleToday = () => {
    const today = getTodayDate();
    applyPeriod(today, today);
  };

  const handleAllData = () => {
    applyPeriod("", "");
  };

  const handleRefresh = () => {
    setError("");
    setRefreshing(hasLoadedDashboard.current);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  return (
    <AdminLayout
      title="Dashboard administrateur"
      subtitle="Vue generale de l'activite PharmaLocate."
      showDateFilter
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onTodayClick={handleToday}
      onAllDataClick={handleAllData}
      onResetClick={handleRefresh}
      actionLoading={refreshing}
    >
      <div className="space-y-5">
        {refreshing && (
          <div className="rounded-2xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/8 px-4 py-3 text-sm font-bold text-[#167769] shadow-sm">
            Actualisation du dashboard en cours...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {hasNoDataForSelectedDate && (
          <div className="rounded-2xl border border-[#2F6E9E]/10 bg-white px-4 py-3 text-sm font-bold text-[#6B7280] shadow-sm">
            Aucune donnee disponible pour cette periode.
          </div>
        )}

        {loading ? (
          <SkeletonCards />
        ) : (
          <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {statCards.map((card) => (
              <AdminStatsCard key={card.label} {...card} />
            ))}
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[1.65fr_0.75fr]">
          <div id="analyse" className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 text-[#2F6E9E]" />
              <h2 className="text-base font-bold text-[#1C2B4A]">
                Apercu des statistiques
              </h2>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ChartCard title="Repartition des pharmacies">
                <Doughnut
                  key={`pharmacies-${activePeriodKey}`}
                  data={pharmacyChartData}
                  options={doughnutOptions}
                />
              </ChartCard>
              <ChartCard title="Reservations par statut">
                <Bar
                  key={`reservations-${activePeriodKey}`}
                  data={reservationChartData}
                  options={barOptions}
                />
              </ChartCard>
              <ChartCard title="Reservations par mois">
                <Line
                  key={`reservation-month-${activePeriodKey}`}
                  data={reservationsByMonthData}
                  options={lineOptions}
                />
              </ChartCard>
              <ChartCard title="Revenus plateforme">
                <Line
                  key={`revenue-${activePeriodKey}`}
                  data={revenueByMonthData}
                  options={lineOptions}
                />
              </ChartCard>
              <ChartCard title="Abonnements par plan">
                <Doughnut
                  key={`subscriptions-${activePeriodKey}`}
                  data={subscriptionsChartData}
                  options={doughnutOptions}
                />
              </ChartCard>
              <ChartCard title="Paiements par statut">
                <Bar
                  key={`payments-${activePeriodKey}`}
                  data={paymentsChartData}
                  options={barOptions}
                />
              </ChartCard>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-[#6B7280]" />
              <h2 className="text-base font-bold text-[#1C2B4A]">Alertes prioritaires</h2>
            </div>
            <div className="mt-4 space-y-3">
              <PriorityAlert
                label="Pharmacies en attente"
                value={apiAlerts.pending_pharmacies ?? pharmacies.en_attente ?? 0}
                icon={faClock}
                tone="orange"
              />
              <PriorityAlert
                label="Stocks en rupture"
                value={apiAlerts.out_of_stocks ?? stocks.rupture ?? 0}
                icon={faTriangleExclamation}
                tone="danger"
              />
              <PriorityAlert
                label="Stocks faibles"
                value={apiAlerts.low_stocks ?? stocks.faibles ?? 0}
                icon={faBoxesStacked}
                tone="yellow"
              />
              <PriorityAlert
                label="Reservations en attente"
                value={apiAlerts.pending_reservations ?? reservations.en_attente ?? 0}
                icon={faCalendarCheck}
                tone="blue"
              />
              <PriorityAlert
                label="Paiements a verifier"
                value={apiAlerts.pending_payments ?? 0}
                icon={faCreditCard}
                tone="orange"
              />
              <PriorityAlert
                label="Factures commissions impayees"
                value={apiAlerts.unpaid_commission_invoices ?? 0}
                icon={faReceipt}
                tone="danger"
              />
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <article className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1C2B4A]">Top pharmacies</h2>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                  Classement par revenus enregistrés.
                </p>
              </div>
              <FontAwesomeIcon icon={faHospital} className="h-4 w-4 text-[#2FA6A3]" />
            </div>
            {topPharmacies.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[#F8FAFC] px-3 py-4 text-sm font-semibold text-[#6B7280]">
                Aucune pharmacie avec revenus pour cette période.
              </p>
            ) : (
              <div className="mt-4 grid gap-2">
                {topPharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#1C2B4A]">
                        {pharmacy.name || pharmacy.pharmacy_name || "Pharmacie non renseignée"}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">
                        {pharmacy.orders || 0} commande(s)
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-[#2F6E9E]">
                      {formatMoney(pharmacy.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1C2B4A]">Synthèse pharmacies</h2>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                  Validation et activité globale.
                </p>
              </div>
              <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 text-[#2F6E9E]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#2FA6A3]/10 px-3 py-3">
                <p className="text-xl font-black text-[#1C2B4A]">{pharmacies.validees || 0}</p>
                <p className="text-[11px] font-semibold text-[#6B7280]">Validées</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-3">
                <p className="text-xl font-black text-[#1C2B4A]">{pharmacies.en_attente || 0}</p>
                <p className="text-[11px] font-semibold text-[#6B7280]">En attente</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5">
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faBolt} className="h-4 w-4 text-[#6B7280]" />
              <h2 className="text-base font-bold text-[#1C2B4A]">Dernieres activites</h2>
            </div>
            <button
              type="button"
              className="rounded-full bg-[#2F6E9E]/8 px-3 py-1.5 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
            >
              Voir tout
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="px-4 py-6 text-sm font-semibold text-[#6B7280]">
              Aucune activite recente.
            </p>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.slice(0, 5).map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6E9E]/8 px-3 py-1 text-xs font-bold text-[#2F6E9E]">
                          <FontAwesomeIcon
                            icon={activity.type === "pharmacy" ? faHospital : faCalendarCheck}
                          />
                          {activity.type === "pharmacy" ? "Pharmacie" : "Reservation"}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-2.5">
                        <p className="font-bold">{activity.title}</p>
                        <p className="truncate text-xs font-semibold text-[#6B7280]">
                          {activity.description}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                        {formatDate(activity.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex min-w-24 justify-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(activity.status)}`}
                        >
                          {getStatusLabel(activity.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-2 p-3 md:hidden">
              {activities.slice(0, 5).map((activity) => (
                <article
                  key={activity.id}
                  className="rounded-xl border border-[#E2E8F2] px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1C2B4A]">{activity.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-[#6B7280]">
                        {activity.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClass(activity.status)}`}
                    >
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#6B7280]">
                    <span>{activity.type === "pharmacy" ? "Pharmacie" : "Reservation"}</span>
                    <span>{formatDate(activity.date)}</span>
                  </div>
                </article>
              ))}
            </div>
            </>
          )}
        </div>
        </section>

        {/* Recent system notifications */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F2] px-4 py-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-[#2F6E9E]" />
              <h2 className="text-base font-bold text-[#1C2B4A]">Notifications récentes</h2>
              {unreadNotifCount > 0 && (
                <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-black text-[#EF4444]">
                  {unreadNotifCount} non lues
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotifRead}
                  className="rounded-full bg-[#2FA6A3]/8 px-3 py-1.5 text-xs font-bold text-[#2FA6A3] transition hover:bg-[#2FA6A3] hover:text-white"
                >
                  Tout lire
                </button>
              )}
              <Link
                to="/admin/notifications"
                className="rounded-full bg-[#2F6E9E]/8 px-3 py-1.5 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
              >
                Voir tout
              </Link>
            </div>
          </div>

          {recentNotifs.length === 0 ? (
            <p className="px-4 py-6 text-sm font-semibold text-[#6B7280]">
              Aucune notification récente.
            </p>
          ) : (
            <ul>
              {recentNotifs.map((notif) => {
                const iconKey = notif.notification_type || "system";
                const icon = NOTIF_ICONS[iconKey] || faBell;
                const colorClass = notif.type === "alerte"
                  ? "text-[#EF4444] bg-[#EF4444]/10"
                  : NOTIF_COLORS[iconKey] || NOTIF_COLORS.system;
                return (
                  <li
                    key={notif.id}
                    className={`flex items-start gap-3 border-b border-[#F1F5F9] px-4 py-3 last:border-0 ${!notif.est_lue ? "bg-[#EFF6FF]" : ""}`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1C2B4A]">{notif.titre || notif.title || "Notification"}</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-[#6B7280]">{notif.message}</p>
                      <p className="mt-1 text-[10px] font-semibold text-[#9CA3AF]">
                        {formatRelativeDate(notif.date || notif.date_creation)}
                      </p>
                    </div>
                    {!notif.est_lue && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2F6E9E]" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
