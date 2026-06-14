import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBoxesStacked,
  faCalendarCheck,
  faBell,
  faBolt,
  faChartLine,
  faCheckCircle,
  faCircleCheck,
  faClock,
  faHospital,
  faPills,
  faTriangleExclamation,
  faUserDoctor,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboardStats } from "../../services/adminService";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  return "Impossible de charger les statistiques pour cette date.";
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

function QuickAction({ label, to, icon, tone = "blue", onClick }) {
  const toneClass =
    tone === "turquoise"
      ? "text-[#2FA6A3] group-hover:bg-[#2FA6A3]"
      : tone === "green"
        ? "text-[#10B981] group-hover:bg-[#10B981]"
      : "text-[#2F6E9E] group-hover:bg-[#2F6E9E]";

  const className = "group inline-flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#E2E8F2] bg-white px-3 py-4 text-center text-xs font-bold text-[#1C2B4A] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const iconClass = `flex h-11 w-11 items-center justify-center rounded-2xl bg-current/10 text-xl transition group-hover:text-white ${toneClass}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <span className={iconClass}>
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </span>
        {label}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={className}
    >
      <span className={iconClass}>
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDate);

  useEffect(() => {
    let isMounted = true;

    getAdminDashboardStats(selectedDate)
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStats(emptyStats);
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const apiAlerts = stats.alerts || {};
  const pharmacies = stats.pharmacies || emptyStats.pharmacies;
  const users = stats.users || emptyStats.users;
  const usersByRole = users.by_role || emptyStats.users.by_role;
  const reservations = stats.reservations || emptyStats.reservations;
  const medicaments = stats.medicaments || emptyStats.medicaments;
  const stocks = stats.stocks || emptyStats.stocks;
  const activities = stats.recent_activities || stats.latest_activities || [];
  const hasNoDataForSelectedDate =
    Boolean(selectedDate) &&
    !loading &&
    !error &&
    (pharmacies.total || 0) === 0 &&
    (users.total || 0) === 0 &&
    (reservations.total || 0) === 0 &&
    (medicaments.total || 0) === 0 &&
    (stocks.total || 0) === 0;

  const statCards = useMemo(
    () => [
      {
        label: "Pharmacies totales",
        value: pharmacies.total || 0,
        icon: faHospital,
        tone: "blue",
      },
      {
        label: "En attente",
        value: pharmacies.en_attente || 0,
        icon: faClock,
        tone: "orange",
      },
      {
        label: "Validees",
        value: pharmacies.validees || 0,
        icon: faCircleCheck,
        tone: "green",
      },
      {
        label: "Pharmaciens",
        value: usersByRole.pharmacien || 0,
        icon: faUserDoctor,
        tone: "purple",
      },
      {
        label: "Medicaments",
        value: medicaments.total || 0,
        icon: faPills,
        tone: "teal",
      },
      {
        label: "Stocks",
        value: stocks.total || 0,
        icon: faBoxesStacked,
        tone: (stocks.rupture || 0) > 0 ? "danger" : "lightBlue",
      },
    ],
    [medicaments.total, pharmacies, stocks, usersByRole.pharmacien]
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

  const handleDateChange = (date) => {
    setLoading(true);
    setError("");
    setStats(emptyStats);
    setSelectedDate(date);
  };

  const handleToday = () => {
    handleDateChange(getTodayDate());
  };

  const handleReset = () => {
    handleDateChange("");
  };

  return (
    <AdminLayout
      title="Dashboard administrateur"
      subtitle="Vue generale de l'activite PharmaLocate."
      showDateFilter
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
      onTodayClick={handleToday}
      onResetClick={handleReset}
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {hasNoDataForSelectedDate && (
          <div className="rounded-2xl border border-[#2F6E9E]/10 bg-white px-4 py-3 text-sm font-bold text-[#6B7280] shadow-sm">
            Aucune donnee disponible pour cette date.
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
                  key={`pharmacies-${selectedDate || "all"}`}
                  data={pharmacyChartData}
                  options={doughnutOptions}
                />
              </ChartCard>
              <ChartCard title="Reservations par statut">
                <Bar
                  key={`reservations-${selectedDate || "all"}`}
                  data={reservationChartData}
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
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
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

        <aside className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faBolt} className="h-4 w-4 text-[#6B7280]" />
            <h2 className="text-base font-bold text-[#1C2B4A]">Actions rapides</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickAction
              label="Valider pharmacies"
              to="/admin/pharmacies-validation"
              icon={faCheckCircle}
            />
            <QuickAction
              label="Gerer pharmacies"
              to="/admin/pharmacies"
              icon={faHospital}
              tone="turquoise"
            />
            <QuickAction
              label="Gerer utilisateurs"
              to="/admin/users"
              icon={faUsersGear}
              tone="green"
            />
            <QuickAction
              label="Voir statistiques"
              icon={faChartLine}
              onClick={() =>
                document.getElementById("analyse")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
        </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
