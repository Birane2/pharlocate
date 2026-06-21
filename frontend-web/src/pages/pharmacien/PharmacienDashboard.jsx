import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  faBell,
  faBoxesStacked,
  faCalendarCheck,
  faCheckCircle,
  faClock,
  faCreditCard,
  faInfoCircle,
  faMoneyBillWave,
  faPills,
  faShieldHalved,
  faTruck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ActivitySummary from "../../components/dashboard/ActivitySummary";
import CompactCharts from "../../components/dashboard/CompactCharts";
import CompactStatCard from "../../components/dashboard/CompactStatCard";
import PriorityAlerts from "../../components/dashboard/PriorityAlerts";
import RecentReservations from "../../components/dashboard/RecentReservations";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { getPharmacienDashboardStats } from "../../services/dashboardService";
import { getPharmacienPaymentMethods } from "../../services/financeService";
import { getNotifications, markAllNotificationsRead } from "../../services/notificationService";

const emptyStats = {
  pharmacie: null,
  stocks: {
    total: 0,
    disponibles: 0,
    rupture: 0,
    faibles: 0,
    ruptures_liste: [],
    faibles_liste: [],
  },
  reservations: {
    total: 0,
    en_attente: 0,
    confirmees: 0,
    annulees: 0,
    recuperees: 0,
    refusees: 0,
    recentes: [],
  },
  payments: {
    pending: 0,
    validated: 0,
    rejected: 0,
    refunded: 0,
  },
  deliveries: {
    active: 0,
    pending: 0,
    in_progress: 0,
    delivered: 0,
  },
  finance: {
    monthly_revenue: 0,
    total_revenue: 0,
    commission_due: 0,
    pending_commission_invoices: 0,
  },
  subscription: {
    plan: "Gratuit",
    status: "inactive",
    end_date: null,
    commission_rate: 0.05,
  },
  charts: {
    reservations_by_status: {},
    monthly_revenue: [],
    payments_by_status: {},
    stock_health: {},
  },
  horaires: {
    total: 0,
    jours_ouverts: 0,
    jours_garde: 0,
  },
  avis: {
    note_moyenne: 0,
    total: 0,
  },
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} MRU`;
}

function formatDate(value) {
  if (!value) return "Non definie";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse au tableau de bord pharmacien.";
  }

  if (error.response?.status === 404) {
    return "Aucune pharmacie associee a ce compte.";
  }

  return "Impossible de charger les statistiques pour le moment.";
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-2xl bg-white" />
      <div className="h-28 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  );
}

function hasConfiguredPaymentMethod(config) {
  if (!config || config.is_active === false) {
    return false;
  }

  return [
    config.bankily_number,
    config.masrivi_number,
    config.click_number,
    config.sedad_number,
    config.bci_pay_number,
  ].some((value) => String(value || "").trim().length > 0);
}

const NOTIF_ICONS = {
  reservation: faCalendarCheck,
  payment: faCreditCard,
  delivery: faTruck,
  subscription: faShieldHalved,
  commission: faCreditCard,
  system: faInfoCircle,
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

function PharmacienDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const handleMarkAllNotifRead = async () => {
    try {
      await markAllNotificationsRead();
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, est_lue: true })));
      setUnreadNotifCount(0);
    } catch { /* silent */ }
  };

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
    let active = true;

    Promise.all([
      getPharmacienDashboardStats(),
      getPharmacienPaymentMethods().catch(() => null),
    ])
      .then(([data, paymentConfig]) => {
        if (active) {
          setStats(data);
          setShowPaymentAlert(!hasConfiguredPaymentMethod(paymentConfig));
        }
      })
      .catch((err) => {
        if (active) {
          setStats(emptyStats);
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".dashboard-reveal").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [loading, stats]);

  const availabilityRate = stats.stocks.total
    ? Math.round((stats.stocks.disponibles / stats.stocks.total) * 100)
    : 0;

  const statCards = useMemo(
    () => [
      {
        label: "Total reservations",
        value: stats.stats?.total_reservations ?? stats.reservations.total,
        icon: faCalendarCheck,
        tone: "blue",
      },
      {
        label: "Reservations en attente",
        value: stats.stats?.pending_reservations ?? stats.reservations.en_attente,
        icon: faClock,
        tone: stats.reservations.en_attente > 0 ? "orange" : "green",
      },
      {
        label: "Commandes confirmees",
        value: stats.stats?.confirmed_orders ?? stats.reservations.confirmees,
        icon: faCheckCircle,
        tone: "blue",
      },
      {
        label: "Paiements en attente",
        value: stats.stats?.pending_payments ?? stats.payments.pending,
        icon: faCreditCard,
        tone: stats.payments.pending > 0 ? "orange" : "green",
      },
      {
        label: "Paiements valides",
        value: stats.stats?.validated_payments ?? stats.payments.validated,
        icon: faCreditCard,
        tone: "turquoise",
      },
      {
        label: "CA du mois",
        value: formatMoney(stats.stats?.monthly_revenue ?? stats.finance.monthly_revenue),
        icon: faMoneyBillWave,
        tone: "green",
      },
      {
        label: "Commissions dues",
        value: formatMoney(stats.stats?.commission_due ?? stats.finance.commission_due),
        icon: faShieldHalved,
        tone: (Number(stats.finance.commission_due) || 0) > 0 ? "orange" : "green",
      },
      {
        label: "Stocks faibles",
        value: stats.stats?.low_stock ?? stats.stocks.faibles,
        icon: faTriangleExclamation,
        tone: stats.stocks.faibles > 0 ? "orange" : "green",
      },
      {
        label: "Ruptures",
        value: stats.stats?.out_of_stock ?? stats.stocks.rupture,
        icon: faPills,
        tone: stats.stocks.rupture > 0 ? "red" : "green",
      },
      {
        label: "Livraisons en cours",
        value: stats.stats?.active_deliveries ?? stats.deliveries.active,
        icon: faTruck,
        tone: "turquoise",
      },
      {
        label: "Disponibilite pharmacie",
        value: `${availabilityRate}%`,
        icon: faBoxesStacked,
        tone: stats.stocks.rupture > 0 ? "red" : "green",
      },
    ],
    [availabilityRate, stats]
  );

  return (
    <DashboardLayout
      title="Tableau de bord"
      links={pharmacistLinks}
      pharmacy={stats.pharmacie}
      pharmacyHeader
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {!loading && showPaymentAlert && (
          <div className="dashboard-reveal rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                <FontAwesomeIcon icon={faCreditCard} />
              </div>
              <div>
                <p className="text-sm font-black text-[#1C2B4A]">
                  Vous n'avez configure aucun mode de paiement.
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                  Ajoutez Bankily, Masrivi, Click, Sedad ou BCI Pay pour permettre
                  aux clients de finaliser leurs reservations.
                </p>
              </div>
            </div>
            <Link
              to="/pharmacien/payment-methods"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#2F6E9E] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255879] sm:mt-0"
            >
              Configurer mes paiements
            </Link>
          </div>
        )}

        {loading ? (
          <SkeletonDashboard />
        ) : (
          <>
            <PriorityAlerts
              reservations={stats.reservations}
              stocks={stats.stocks}
            />

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <CompactStatCard key={card.label} {...card} />
              ))}
            </section>

            <section className="dashboard-reveal grid gap-3 rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm md:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2FA6A3]">
                  Abonnement actuel
                </p>
                <p className="mt-1 text-lg font-black text-[#1C2B4A]">
                  {stats.subscription?.plan || "Gratuit"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                  Statut
                </p>
                <p className="mt-1 inline-flex rounded-full bg-[#2F6E9E]/10 px-3 py-1 text-xs font-black text-[#2F6E9E]">
                  {stats.subscription?.status || "inactive"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                  Expiration
                </p>
                <p className="mt-1 text-sm font-bold text-[#1C2B4A]">
                  {formatDate(stats.subscription?.end_date)}
                </p>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <RecentReservations reservations={stats.reservations.recentes || []} />
              <ActivitySummary
                horaires={stats.horaires}
                avis={stats.avis}
                stocks={stats.stocks}
              />
            </div>

            <CompactCharts
              stocks={stats.stocks}
              reservations={stats.reservations}
              payments={stats.payments}
              charts={stats.charts}
            />

            {/* Recent notifications panel */}
            <section className="dashboard-reveal rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F2] px-4 py-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-[#2F6E9E]" />
                  <h2 className="text-sm font-bold text-[#1C2B4A]">Notifications récentes</h2>
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
                    to="/pharmacien/notifications"
                    className="rounded-full bg-[#2F6E9E]/8 px-3 py-1.5 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
                  >
                    Voir tout
                  </Link>
                </div>
              </div>

              {recentNotifs.length === 0 ? (
                <p className="px-4 py-6 text-sm font-semibold text-[#6B7280]">Aucune notification récente.</p>
              ) : (
                <ul>
                  {recentNotifs.map((notif) => {
                    const iconKey = notif.notification_type || "system";
                    const icon = NOTIF_ICONS[iconKey] || faInfoCircle;
                    const colorClass = notif.type === "alerte"
                      ? "text-[#EF4444] bg-[#EF4444]/10"
                      : NOTIF_COLORS[iconKey] || NOTIF_COLORS.system;
                    return (
                      <li
                        key={notif.id}
                        className={`flex items-start gap-3 border-b border-[#F1F5F9] px-4 py-3 last:border-0 ${!notif.est_lue ? "bg-[#EFF6FF]" : ""}`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                          <FontAwesomeIcon icon={notif.type === "alerte" ? faTriangleExclamation : icon} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1C2B4A]">{notif.titre || notif.title || "Notification"}</p>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-[#6B7280]">{notif.message}</p>
                          <p className="mt-1 text-[10px] font-semibold text-[#9CA3AF]">{formatRelativeDate(notif.date || notif.date_creation)}</p>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacienDashboard;
