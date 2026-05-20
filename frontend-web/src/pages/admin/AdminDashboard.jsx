import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faBuildingShield,
  faCalendarCheck,
  faClock,
  faHospital,
  faPills,
  faRotateRight,
  faUsers,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDashboardStats } from "../../services/adminService";

const emptyStats = {
  pharmacies: { total: 0, validees: 0, en_attente: 0 },
  users: { total: 0, by_role: { admin: 0, pharmacien: 0, utilisateur: 0 } },
  reservations: { total: 0, en_attente: 0, confirmees: 0, recuperees: 0 },
  medicaments: { total: 0 },
  stocks: { total: 0, rupture: 0 },
  latest_activities: [],
};

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Accès refusé. Cette page est réservée aux administrateurs.";
  }

  return "Impossible de charger les statistiques administrateur.";
}

function formatDate(value) {
  if (!value) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SkeletonCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-36 animate-pulse rounded-[1.5rem] bg-white/80" />
      ))}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      setStats(await getAdminDashboardStats());
    } catch (err) {
      setStats(emptyStats);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getAdminDashboardStats()
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
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Total pharmacies",
        value: stats.pharmacies.total,
        helper: `${stats.pharmacies.validees} validées`,
        icon: faHospital,
        tone: "blue",
      },
      {
        label: "En attente",
        value: stats.pharmacies.en_attente,
        helper: "Pharmacies à valider",
        icon: faClock,
        tone: "orange",
      },
      {
        label: "Utilisateurs",
        value: stats.users.total,
        helper: `${stats.users.by_role.pharmacien} pharmaciens`,
        icon: faUsers,
        tone: "teal",
      },
      {
        label: "Réservations",
        value: stats.reservations.total,
        helper: `${stats.reservations.en_attente} en attente`,
        icon: faCalendarCheck,
        tone: "green",
      },
      {
        label: "Médicaments",
        value: stats.medicaments.total,
        helper: "Catalogue global",
        icon: faPills,
        tone: "blue",
      },
      {
        label: "Stocks",
        value: stats.stocks.total,
        helper: `${stats.stocks.rupture} ruptures`,
        icon: faBoxesStacked,
        tone: stats.stocks.rupture > 0 ? "danger" : "teal",
      },
      {
        label: "Administrateurs",
        value: stats.users.by_role.admin,
        helper: "Comptes de supervision",
        icon: faUserShield,
        tone: "blue",
      },
      {
        label: "Public",
        value: stats.users.by_role.utilisateur,
        helper: "Utilisateurs simples",
        icon: faBuildingShield,
        tone: "green",
      },
    ],
    [stats]
  );

  return (
    <AdminLayout title="Dashboard administrateur">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] p-5 text-white shadow-[0_22px_60px_rgba(47,110,158,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Administration
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                Pilotage global
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-normal leading-6 text-white/85">
                Suivez les pharmacies, utilisateurs, réservations, médicaments et
                stocks depuis une vue centrale sécurisée.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
              icon={faRotateRight}
              onClick={loadStats}
              loading={loading}
            >
              Actualiser
            </Button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <SkeletonCards />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <AdminStatsCard key={card.label} {...card} />
            ))}
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card
            title="Utilisateurs par rôle"
            subtitle="Répartition des accès dans la plateforme."
            hover={false}
          >
            <div className="space-y-4">
              {[
                ["Administrateurs", stats.users.by_role.admin, "blue"],
                ["Pharmaciens", stats.users.by_role.pharmacien, "teal"],
                ["Utilisateurs", stats.users.by_role.utilisateur, "green"],
              ].map(([label, value, tone]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-pharmaTextLight">{label}</span>
                    <span className="font-bold text-pharmaText">{value}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#EEF3F7]">
                    <div
                      className={`h-full rounded-full ${
                        tone === "blue"
                          ? "bg-[#2F6E9E]"
                          : tone === "teal"
                            ? "bg-[#2FA6A3]"
                            : "bg-[#35C3A3]"
                      }`}
                      style={{
                        width: `${stats.users.total ? Math.max(6, (value / stats.users.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Dernières activités"
            subtitle="Aperçu des événements récents à surveiller."
            hover={false}
          >
            <div className="space-y-3">
              {stats.latest_activities.length === 0 && (
                <p className="rounded-2xl bg-pharmaSurface p-4 text-sm text-pharmaTextLight">
                  Aucune activité récente.
                </p>
              )}

              {stats.latest_activities.map((activity) => (
                <article
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#2F6E9E]/10 bg-white p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                    <FontAwesomeIcon
                      icon={activity.type === "pharmacy" ? faHospital : faCalendarCheck}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="truncate text-sm font-semibold text-pharmaText">
                        {activity.title}
                      </h3>
                      <span className="text-xs font-medium text-pharmaTextLight">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-normal leading-5 text-pharmaTextLight">
                      {activity.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
