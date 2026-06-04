import { useEffect, useMemo, useState } from "react";
import {
  faBoxesStacked,
  faCheckCircle,
  faClock,
  faPills,
  faStar,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import ActivitySummary from "../../components/dashboard/ActivitySummary";
import CompactCharts from "../../components/dashboard/CompactCharts";
import CompactStatCard from "../../components/dashboard/CompactStatCard";
import DashboardQuickActions from "../../components/dashboard/DashboardQuickActions";
import PriorityAlerts from "../../components/dashboard/PriorityAlerts";
import RecentReservations from "../../components/dashboard/RecentReservations";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { getPharmacienDashboardStats } from "../../services/dashboardService";

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
    recentes: [],
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

function PharmacienDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      setStats(await getPharmacienDashboardStats());
    } catch (err) {
      setStats(emptyStats);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    getPharmacienDashboardStats()
      .then((data) => {
        if (active) {
          setStats(data);
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
        label: "Medicaments disponibles",
        value: stats.stocks.disponibles,
        icon: faPills,
        tone: "turquoise",
      },
      {
        label: "Reservations en attente",
        value: stats.reservations.en_attente,
        icon: faClock,
        tone: stats.reservations.en_attente > 0 ? "orange" : "green",
      },
      {
        label: "Reservations confirmees",
        value: stats.reservations.confirmees,
        icon: faCheckCircle,
        tone: "blue",
      },
      {
        label: "Stocks faibles",
        value: stats.stocks.faibles,
        icon: faTriangleExclamation,
        tone: stats.stocks.faibles > 0 ? "orange" : "green",
      },
      {
        label: "Avis clients",
        value: stats.avis.total,
        icon: faStar,
        tone: "blue",
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
        <DashboardQuickActions
          loading={loading}
          onRefresh={loadStats}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
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
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacienDashboard;
