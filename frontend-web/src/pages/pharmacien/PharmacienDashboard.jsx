import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faBell,
  faCalendarDays,
  faCheckCircle,
  faClock,
  faLocationDot,
  faPhone,
  faShieldHeart,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import DashboardCharts from "../../components/dashboard/DashboardCharts";
import Pagination from "../../components/dashboard/Pagination";
import ReservationList from "../../components/dashboard/ReservationList";
import StatsGrid from "../../components/dashboard/StatsGrid";
import StockAlert from "../../components/dashboard/StockAlert";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { getPharmacienDashboardStats } from "../../services/dashboardService";

const PAGE_SIZE = 3;

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
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Accès refusé au dashboard pharmacien.";
  }

  if (error.response?.status === 404) {
    return "Aucune pharmacie associée à ce compte.";
  }

  if (error.response?.status === 500) {
    return "Erreur serveur lors du chargement du dashboard.";
  }

  return "Impossible de charger les statistiques.";
}

function useClientPagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
    next: () => setPage((current) => Math.min(current + 1, totalPages)),
    previous: () => setPage((current) => Math.max(current - 1, 1)),
  };
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-72 animate-pulse rounded-[2rem] bg-white/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-3xl bg-white/80" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-96 animate-pulse rounded-3xl bg-white/80" />
        ))}
      </div>
    </div>
  );
}

function HeroMetric({ label, value, icon, tone = "blue" }) {
  const tones = {
    blue: "bg-white/15 text-white ring-white/20",
    green: "bg-[#35C3A3]/20 text-white ring-white/20",
    orange: "bg-orange-400/20 text-white ring-orange-100/20",
  };

  return (
    <div className={`rounded-2xl p-4 ring-1 backdrop-blur ${tones[tone] || tones.blue}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">{label}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <article className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-dashboard">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0085AA]/10 text-[#0085AA]">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-pharmaTextLight">
            {label}
          </p>
          <p className="mt-1 font-black text-pharmaText">{value || "Non renseigné"}</p>
        </div>
      </div>
    </article>
  );
}

function OperationsPanel({ stats }) {
  const pending = stats.reservations.en_attente;
  const rupture = stats.stocks.rupture;
  const weak = stats.stocks.faibles;
  const priorities = [
    {
      label: "Réservations en attente",
      value: pending,
      message:
        pending > 0
          ? "À confirmer rapidement pour améliorer l'expérience patient."
          : "Aucune demande en attente pour le moment.",
      color: "text-orange-700",
    },
    {
      label: "Médicaments en rupture",
      value: rupture,
      message:
        rupture > 0
          ? "Réapprovisionnement prioritaire recommandé."
          : "Aucune rupture critique détectée.",
      color: "text-red-600",
    },
    {
      label: "Stocks faibles",
      value: weak,
      message:
        weak > 0
          ? "Surveillez les seuils avant rupture."
          : "Les seuils d'alerte sont maîtrisés.",
      color: "text-[#2F6E9E]",
    },
  ];

  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
            Priorités
          </p>
          <h2 className="mt-1 text-xl font-black text-pharmaText">
            Alertes opérationnelles
          </h2>
          <p className="mt-1 text-sm text-pharmaTextLight">
            Les actions les plus importantes à traiter aujourd'hui.
          </p>
        </div>
        <span className="rounded-2xl bg-[#35C3A3]/15 p-3 text-[#16815f]">
          <FontAwesomeIcon icon={faBell} />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {priorities.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-pharmaBorder bg-gradient-to-br from-white to-[#F5FBFC] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-pharmaText">{item.label}</p>
                <p className="mt-1 text-sm text-pharmaTextLight">{item.message}</p>
              </div>
              <strong className={`text-2xl ${item.color}`}>{item.value}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HoursGuardPanel({ horaires }) {
  const openRate = horaires.total
    ? Math.round((horaires.jours_ouverts / horaires.total) * 100)
    : 0;
  const guardRate = horaires.total
    ? Math.round((horaires.jours_garde / horaires.total) * 100)
    : 0;

  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
            Horaires & garde
          </p>
          <h2 className="mt-1 text-xl font-black text-pharmaText">
            Disponibilité pharmacie
          </h2>
          <p className="mt-1 text-sm text-pharmaTextLight">
            Résumé des jours configurés, ouverts et de garde.
          </p>
        </div>
        <Link
          to="/pharmacien/horaires"
          className="rounded-xl border border-[#2F6E9E]/20 px-4 py-2 text-sm font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
        >
          Gérer
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#2F6E9E]/10 p-4">
          <p className="text-xs font-bold uppercase text-[#2F6E9E]">Horaires</p>
          <p className="mt-2 text-3xl font-black text-pharmaText">{horaires.total}</p>
        </div>
        <div className="rounded-2xl bg-[#35C3A3]/15 p-4">
          <p className="text-xs font-bold uppercase text-[#16815f]">Jours ouverts</p>
          <p className="mt-2 text-3xl font-black text-pharmaText">
            {horaires.jours_ouverts}
          </p>
        </div>
        <div className="rounded-2xl bg-[#1681FF]/10 p-4">
          <p className="text-xs font-bold uppercase text-[#1681FF]">Jours de garde</p>
          <p className="mt-2 text-3xl font-black text-pharmaText">
            {horaires.jours_garde}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <ProgressRow label="Taux d'ouverture" value={openRate} color="bg-[#35C3A3]" />
        <ProgressRow label="Couverture garde" value={guardRate} color="bg-[#1681FF]" />
      </div>
    </section>
  );
}

function ProgressRow({ label, value, color }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-pharmaTextLight">{label}</span>
        <span className="font-black text-pharmaText">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#EEF3F7]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ActivityList({ activities, page, totalPages, onPrevious, onNext }) {
  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
          Activité
        </p>
        <h2 className="mt-1 text-xl font-black text-pharmaText">
          Résumé rapide
        </h2>
        <p className="mt-1 text-sm text-pharmaTextLight">
          Les signaux récents à garder sous les yeux.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {activities.length === 0 && (
          <p className="rounded-2xl bg-pharmaSurface p-4 text-sm text-pharmaTextLight">
            Aucune activité récente.
          </p>
        )}

        {activities.map((activity) => (
          <article
            key={activity.id}
            className="rounded-2xl border border-pharmaBorder bg-gradient-to-br from-white to-[#F5F7FA] p-4"
          >
            <p className="text-sm font-black text-pharmaText">{activity.title}</p>
            <p className="mt-1 text-sm text-pharmaTextLight">{activity.description}</p>
          </article>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </section>
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
    let isMounted = true;

    getPharmacienDashboardStats()
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
      { threshold: 0.14 }
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
        label: "Total médicaments",
        value: stats.stocks.total,
        helper: `${stats.stocks.disponibles} disponibles`,
        tone: "blue",
        icon: "stock",
      },
      {
        label: "Médicaments disponibles",
        value: stats.stocks.disponibles,
        helper: `${availabilityRate}% de disponibilité`,
        tone: "green",
        icon: "available",
      },
      {
        label: "Médicaments en rupture",
        value: stats.stocks.rupture,
        helper: `${stats.stocks.faibles} stocks faibles`,
        tone: stats.stocks.rupture > 0 ? "danger" : "green",
        icon: "rupture",
      },
      {
        label: "Stocks faibles",
        value: stats.stocks.faibles,
        helper: "Sous ou proche du seuil",
        tone: stats.stocks.faibles > 0 ? "warning" : "green",
        icon: "weak",
      },
      {
        label: "Total réservations",
        value: stats.reservations.total,
        helper: `${stats.reservations.en_attente} en attente`,
        tone: "cyan",
        icon: "reservation",
      },
      {
        label: "Réservations confirmées",
        value: stats.reservations.confirmees,
        helper: "Commandes validées",
        tone: "blue",
        icon: "confirmed",
      },
      {
        label: "Réservations récupérées",
        value: stats.reservations.recuperees,
        helper: "Commandes finalisées",
        tone: "green",
        icon: "recovered",
      },
      {
        label: "Avis clients",
        value: stats.avis.total,
        helper: `${stats.avis.note_moyenne}/5 de note moyenne`,
        tone: "teal",
        icon: "review",
      },
    ],
    [availabilityRate, stats]
  );

  const activities = useMemo(
    () => [
      ...((stats.reservations.recentes || []).slice(0, 4).map((reservation) => ({
        id: `reservation-${reservation.id}`,
        title: `Réservation #${reservation.id}`,
        description: `Statut ${reservation.statut} pour ${reservation.client || "un client"}.`,
      }))),
      ...((stats.stocks.ruptures_liste || []).slice(0, 3).map((stock) => ({
        id: `rupture-${stock.id_stock || stock.id}`,
        title: `${stock.medicament_nom || "Médicament"} en rupture`,
        description: "Réapprovisionnement recommandé pour éviter les refus de réservation.",
      }))),
      ...((stats.stocks.faibles_liste || []).slice(0, 3).map((stock) => ({
        id: `faible-${stock.id_stock || stock.id}`,
        title: `${stock.medicament_nom || "Médicament"} en stock faible`,
        description: `${stock.quantite} restant(s), seuil d'alerte ${stock.seuil_alerte}.`,
      }))),
    ],
    [stats]
  );

  const reservationPager = useClientPagination(stats.reservations.recentes || []);
  const weakStockPager = useClientPagination(stats.stocks.faibles_liste || []);
  const rupturePager = useClientPagination(stats.stocks.ruptures_liste || []);
  const activityPager = useClientPagination(activities);

  return (
    <DashboardLayout title="Tableau de bord pharmacien" links={pharmacistLinks}>
      <div className="overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_10%_0%,rgba(22,129,255,0.1),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(53,195,163,0.14),transparent_26%),linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_50%,#EFFAFA_100%)] p-4 sm:p-5 lg:p-6">
        <div className="space-y-6">
          <section className="dashboard-reveal relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] p-5 text-white shadow-[0_24px_70px_rgba(0,133,170,0.24)] md:p-6">
            <div className="dashboard-float absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-sm" />
            <div className="absolute -bottom-20 left-1/2 h-56 w-56 rounded-full bg-[#1681FF]/25 blur-3xl" />

            <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={stats.pharmacie?.est_valide ? "active" : "warning"}>
                    {stats.pharmacie?.est_valide
                      ? "Pharmacie validée"
                      : "Validation en attente"}
                  </Badge>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
                    Données API en temps réel
                  </span>
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-white/75">
                  Espace pharmacien
                </p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight md:text-3xl">
                  Bienvenue, {stats.pharmacie?.nom || "votre pharmacie"}
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-normal leading-6 text-white/85 md:text-base">
                  Pilotez vos médicaments, réservations, horaires de garde et avis
                  clients depuis un tableau de bord clair, priorisé et connecté au
                  backend.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/pharmacien/stocks"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#2F6E9E] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F5F7FA]"
                  >
                    Gérer les stocks
                  </Link>
                  <Link
                    to="/pharmacien/reservations"
                    className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    Voir les réservations
                  </Link>
                  <Button
                    variant="outline"
                    className="border-white bg-white/10 px-5 py-3 text-white hover:bg-white hover:text-[#2F6E9E]"
                    onClick={loadStats}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faArrowRotateRight} className="mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <HeroMetric
                  label="Disponibilité"
                  value={`${availabilityRate}%`}
                  icon={faCheckCircle}
                  tone="green"
                />
                <HeroMetric
                  label="En attente"
                  value={stats.reservations.en_attente}
                  icon={faClock}
                  tone="orange"
                />
                <HeroMetric
                  label="Note moyenne"
                  value={`${stats.avis.note_moyenne}/5`}
                  icon={faStar}
                  tone="blue"
                />
              </div>
            </div>
          </section>

          {stats.pharmacie && (
            <section className="grid gap-3 md:grid-cols-3">
              <InfoTile icon={faLocationDot} label="Adresse" value={stats.pharmacie.adresse} />
              <InfoTile icon={faPhone} label="Téléphone" value={stats.pharmacie.telephone} />
              <InfoTile
                icon={faShieldHeart}
                label="Statut pharmacie"
                value={stats.pharmacie.est_valide ? "Compte validé" : "En attente"}
              />
            </section>
          )}

          {error && (
            <div className="rounded-3xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-5 py-4 text-sm font-semibold text-pharmaDanger">
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonDashboard />
          ) : (
            <>
              <StatsGrid cards={statCards} />

              <DashboardCharts
                stocks={stats.stocks}
                reservations={stats.reservations}
                horaires={stats.horaires}
                avis={stats.avis}
              />

              <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <ReservationList
                  reservations={reservationPager.items}
                  page={reservationPager.page}
                  totalPages={reservationPager.totalPages}
                  onPrevious={reservationPager.previous}
                  onNext={reservationPager.next}
                />
                <OperationsPanel stats={stats} />
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <HoursGuardPanel horaires={stats.horaires} />
                <ActivityList
                  activities={activityPager.items}
                  page={activityPager.page}
                  totalPages={activityPager.totalPages}
                  onPrevious={activityPager.previous}
                  onNext={activityPager.next}
                />
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <StockAlert
                  title="Stocks faibles"
                  subtitle="Médicaments proches du seuil d'alerte."
                  items={weakStockPager.items}
                  tone="warning"
                  page={weakStockPager.page}
                  totalPages={weakStockPager.totalPages}
                  onPrevious={weakStockPager.previous}
                  onNext={weakStockPager.next}
                />
                <StockAlert
                  title="Ruptures de stock"
                  subtitle="Produits à remettre en stock en priorité."
                  items={rupturePager.items}
                  tone="danger"
                  page={rupturePager.page}
                  totalPages={rupturePager.totalPages}
                  onPrevious={rupturePager.previous}
                  onNext={rupturePager.next}
                />
              </section>

              <section className="dashboard-reveal grid gap-4 md:grid-cols-3">
                <InfoTile
                  icon={faCalendarDays}
                  label="Total horaires"
                  value={`${stats.horaires.total} créneau(x)`}
                />
                <InfoTile
                  icon={faShieldHeart}
                  label="Jours de garde"
                  value={`${stats.horaires.jours_garde} jour(s)`}
                />
                <InfoTile
                  icon={faStar}
                  label="Nombre d'avis"
                  value={`${stats.avis.total} avis client(s)`}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PharmacienDashboard;
