import { Fragment, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faBoxOpen,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEye,
  faReceipt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  cancelReservation,
  confirmReservation,
  getReservations,
  markReservationPickedUp,
  markReservationReady,
} from "../../services/reservationService";

const PAGE_SIZE = 5;

const statusConfig = {
  en_attente: {
    label: "En attente",
    className: "bg-orange-50 text-orange-700",
  },
  confirmee: {
    label: "Confirmee",
    className: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
  },
  prete: {
    label: "Prete",
    className: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
  },
  recuperee: {
    label: "Recuperee",
    className: "bg-[#10B981]/10 text-[#047857]",
  },
  refusee: {
    label: "Refusee",
    className: "bg-red-50 text-red-600",
  },
  annulee: {
    label: "Annulee",
    className: "bg-red-50 text-red-600",
  },
};

const filters = [
  { value: "all", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmees" },
  { value: "refusee", label: "Refusees" },
];

function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status || "Inconnu",
    className: "bg-[#F1F5F9] text-[#6B7280]",
  };

  return (
    <span className={`inline-flex min-w-24 justify-center rounded-full px-3 py-1 text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTotal(value) {
  return `${Number(value || 0).toFixed(0)} MRU`;
}

function getItemsSummary(reservation) {
  const items = reservation.items || [];

  if (items.length === 0) {
    return "Aucun medicament";
  }

  return items
    .map((item) => `${item.medicament_nom} x${item.quantite}`)
    .join(", ");
}

function IconButton({ label, icon, tone = "blue", loading = false, onClick }) {
  const toneClass =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50 focus:ring-red-100"
      : tone === "success"
        ? "text-[#047857] hover:bg-[#10B981]/10 focus:ring-[#10B981]/15"
        : tone === "turquoise"
          ? "text-[#2FA6A3] hover:bg-[#2FA6A3]/10 focus:ring-[#2FA6A3]/15"
          : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8 focus:ring-[#2F6E9E]/15";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={loading}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

function ReservationsList() {
  const [reservations, setReservations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    count: 0,
    currentPage: 1,
    next: null,
    previous: null,
  });

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  const getErrorMessage = (err) => {
    if (err.response?.status === 401) {
      return "Votre session a expire. Veuillez vous reconnecter.";
    }

    if (err.response?.status === 403) {
      return "Acces refuse.";
    }

    if (err.response?.status === 500) {
      return "Erreur serveur. Reessayez plus tard.";
    }

    return (
      err.response?.data?.error ||
      err.response?.data?.detail ||
      "Impossible de traiter cette action."
    );
  };

  const loadReservations = async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const data = await getReservations({ page });
      setReservations(data.results || []);
      setPagination({
        count: data.count || 0,
        currentPage: page,
        next: data.next || null,
        previous: data.previous || null,
      });
    } catch (err) {
      setReservations([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getReservations({ page: 1 });
        setReservations(data.results || []);
        setPagination({
          count: data.count || 0,
          currentPage: 1,
          next: data.next || null,
          previous: data.previous || null,
        });
      } catch (err) {
        setReservations([]);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const kpis = useMemo(
    () => [
      { label: "Total reservations", value: pagination.count, icon: faReceipt, tone: "blue" },
      {
        label: "En attente",
        value: reservations.filter((item) => item.statut === "en_attente").length,
        icon: faClock,
        tone: "orange",
      },
      {
        label: "Confirmees",
        value: reservations.filter((item) => item.statut === "confirmee").length,
        icon: faCheck,
        tone: "blue",
      },
      {
        label: "Pretes",
        value: reservations.filter((item) => item.statut === "prete").length,
        icon: faBoxOpen,
        tone: "turquoise",
      },
    ],
    [pagination.count, reservations]
  );

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      return statusFilter === "all" || reservation.statut === statusFilter;
    });
  }, [reservations, statusFilter]);

  const runAction = async (reservationId, action, successText) => {
    setActionLoadingId(reservationId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await action(reservationId);

      if (response?.reservation) {
        setReservations((currentReservations) =>
          currentReservations.map((reservation) =>
            reservation.id === reservationId ? response.reservation : reservation
          )
        );
      }

      setSuccessMessage(response?.message || successText);
      await loadReservations(pagination.currentPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirm = async (reservationId) => {
    const confirmed = window.confirm("Voulez-vous vraiment confirmer cette reservation ?");

    if (!confirmed) {
      return;
    }

    await runAction(
      reservationId,
      confirmReservation,
      "Reservation confirmee avec succes."
    );
  };

  const handleCancel = async (reservationId) => {
    const confirmed = window.confirm("Voulez-vous vraiment refuser cette reservation ?");

    if (!confirmed) {
      return;
    }

    await runAction(
      reservationId,
      cancelReservation,
      "Reservation refusee avec succes."
    );
  };

  const renderActions = (reservation) => {
    const isLoading = actionLoadingId === reservation.id;

    return (
      <div className="flex flex-wrap justify-end gap-1">
        <IconButton
          label="Voir"
          icon={faEye}
          loading={isLoading}
          onClick={() =>
            setExpandedId(expandedId === reservation.id ? null : reservation.id)
          }
        />
        {reservation.statut === "en_attente" && (
          <>
            <IconButton
              label="Confirmer"
              icon={faCheck}
              tone="success"
              loading={isLoading}
              onClick={() => handleConfirm(reservation.id)}
            />
            <IconButton
              label="Refuser"
              icon={faTimes}
              tone="danger"
              loading={isLoading}
              onClick={() => handleCancel(reservation.id)}
            />
          </>
        )}
        {reservation.statut === "confirmee" && (
          <IconButton
            label="Marquer prete"
            icon={faBoxOpen}
            tone="turquoise"
            loading={isLoading}
            onClick={() =>
              runAction(
                reservation.id,
                markReservationReady,
                "Reservation marquee comme prete."
              )
            }
          />
        )}
        {reservation.statut === "prete" && (
          <IconButton
            label="Marquer recuperee"
            icon={faBagShopping}
            tone="success"
            loading={isLoading}
            onClick={() =>
              runAction(
                reservation.id,
                markReservationPickedUp,
                "Reservation marquee comme recuperee."
              )
            }
          />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Reservations"
      links={pharmacistLinks}
      headerSubtitle="Suivez et traitez les demandes des patients."
    >
      <div className="mx-auto max-w-7xl space-y-3">
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-black text-[#1C2B4A]">{item.value}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#6B7280]">{item.label}</p>
                </div>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    item.tone === "orange"
                      ? "bg-orange-50 text-orange-700"
                      : item.tone === "turquoise"
                        ? "bg-[#2FA6A3]/10 text-[#2FA6A3]"
                        : "bg-[#2F6E9E]/10 text-[#2F6E9E]"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                </span>
              </div>
            </article>
          ))}
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-[#2FA6A3]/30 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-semibold text-[#2FA6A3]">
            {successMessage}
          </div>
        )}

        <Card hover={false} className="overflow-hidden p-0" bodyClassName="p-0">
          <div className="border-b border-[#E2E8F2] px-3 py-2.5">
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === filter.value
                      ? "bg-[#2F6E9E] text-white shadow-sm"
                      : "bg-[#2F6E9E]/8 text-[#2F6E9E] hover:bg-[#2F6E9E]/14"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              Chargement des reservations...
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              Aucune reservation a afficher.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead className="bg-[#F8FAFC]">
                    <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                      <th className="px-4 py-3">Reservation</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Medicaments</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => (
                      <Fragment key={reservation.id}>
                        <tr
                          className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-4 py-2.5 font-bold text-[#2F6E9E]">
                            #{reservation.id}
                          </td>
                          <td className="px-4 py-2.5 font-semibold">
                            {reservation.user_username || "Client"}
                          </td>
                          <td className="max-w-xs px-4 py-2.5">
                            <p className="truncate text-[#6B7280]">
                              {getItemsSummary(reservation)}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 font-semibold">
                            {formatDate(reservation.date_reservation)}
                          </td>
                          <td className="px-4 py-2.5 font-bold">
                            {formatTotal(reservation.total)}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={reservation.statut} />
                          </td>
                          <td className="px-4 py-2.5">{renderActions(reservation)}</td>
                        </tr>
                        {expandedId === reservation.id && (
                          <tr>
                            <td colSpan="7" className="border-t border-[#E2E8F2] bg-[#F8FAFC] px-4 py-3">
                              <p className="text-xs font-bold text-[#1C2B4A]">
                                Medicaments reserves
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(reservation.items || []).map((item) => (
                                  <span
                                    key={item.id}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B7280]"
                                  >
                                    {item.medicament_nom} x{item.quantite}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-2 p-3 md:hidden">
                {filteredReservations.map((reservation) => (
                  <article
                    key={reservation.id}
                    className="rounded-xl border border-[#E2E8F2] bg-white px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#2F6E9E]">
                          Reservation #{reservation.id}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-[#1C2B4A]">
                          {reservation.user_username || "Client"}
                        </p>
                      </div>
                      {renderActions(reservation)}
                    </div>
                    <p className="mt-2 truncate text-xs text-[#6B7280]">
                      {getItemsSummary(reservation)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-[#6B7280]">Date</p>
                        <p className="font-black text-[#1C2B4A]">
                          {formatDate(reservation.date_reservation)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#6B7280]">Total</p>
                        <p className="font-black text-[#1C2B4A]">
                          {formatTotal(reservation.total)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={reservation.statut} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2">
            <p className="text-xs font-semibold text-[#6B7280]">
              Page {pagination.currentPage} sur {totalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={!pagination.previous || loading}
                onClick={() => loadReservations(pagination.currentPage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                aria-label="Page precedente"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={!pagination.next || loading}
                onClick={() => loadReservations(pagination.currentPage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                aria-label="Page suivante"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default ReservationsList;
