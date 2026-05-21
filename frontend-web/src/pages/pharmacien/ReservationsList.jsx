import { useEffect, useState } from "react";
import ReservationActions from "../../components/reservations/ReservationActions";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  cancelReservation,
  confirmReservation,
  getReservations,
  markReservationPickedUp,
  markReservationReady,
} from "../../services/reservationService";

const statusStyles = {
  en_attente: "bg-orange-100 text-orange-700",
  confirmee: "bg-pharmaBlue/10 text-pharmaBlue",
  prete: "bg-pharmaTurquoise/10 text-pharmaTurquoise",
  recuperee: "bg-pharmaGreenLight/20 text-pharmaTurquoise",
  annulee: "bg-pharmaDanger/10 text-pharmaDanger",
};

const statusLabels = {
  en_attente: "En attente",
  confirmee: "Confirmee",
  prete: "Prete",
  recuperee: "Recuperee",
  annulee: "Annulee",
};

function ReservationsList() {
  const [reservations, setReservations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    currentPage: 1,
    next: null,
    previous: null,
  });

  const totalPages = Math.max(1, Math.ceil(pagination.count / 5));

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
      "Reservation annulee avec succes."
    );
  };

  return (
    <DashboardLayout title="Reservations" links={pharmacistLinks}>
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-pharmaBlue">
              Reservations recues
            </h2>
            <p className="mt-2 text-sm text-pharmaTextLight">
              Confirmez, refusez et suivez les reservations de votre pharmacie.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-pharmaTurquoise/30 bg-pharmaTurquoise/10 px-4 py-3 text-sm text-pharmaTurquoise">
            {successMessage}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {loading && (
            <p className="text-sm text-pharmaText">
              Chargement des reservations...
            </p>
          )}

          {!loading &&
            reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-xl border border-pharmaBorder bg-white p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-pharmaBlue">
                        Reservation #{reservation.id}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[reservation.statut] ||
                          "bg-pharmaSurface text-pharmaTextLight"
                        }`}
                      >
                        {statusLabels[reservation.statut] || reservation.statut}
                      </span>
                    </div>

                    <p className="mt-2 text-sm">
                      Client : {reservation.user_username}
                    </p>
                    <p className="text-sm">
                      Pharmacie : {reservation.pharmacie_nom}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="px-4 py-2"
                      onClick={() =>
                        setExpandedId(
                          expandedId === reservation.id ? null : reservation.id
                        )
                      }
                    >
                      Voir detail
                    </Button>
                    <ReservationActions
                      reservation={reservation}
                      loading={actionLoadingId === reservation.id}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      onReady={(reservationId) =>
                        runAction(
                          reservationId,
                          markReservationReady,
                          "Reservation marquee comme prete."
                        )
                      }
                      onPickedUp={(reservationId) =>
                        runAction(
                          reservationId,
                          markReservationPickedUp,
                          "Reservation marquee comme recuperee."
                        )
                      }
                    />
                  </div>
                </div>

                {expandedId === reservation.id && (
                  <div className="mt-4 rounded-xl bg-pharmaSurface p-4">
                    <p className="text-sm font-semibold text-pharmaBlue">
                      Medicaments reserves
                    </p>
                    <div className="mt-2 space-y-1">
                      {reservation.items?.map((item) => (
                        <p key={item.id} className="text-sm text-pharmaText">
                          {item.medicament_nom} x {item.quantite}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

          {!loading && reservations.length === 0 && !error && (
            <p className="text-sm text-pharmaText">
              Aucune reservation pour le moment.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-pharmaBorder pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-pharmaTextLight">
            Page {pagination.currentPage} sur {totalPages}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="px-4 py-2"
              disabled={!pagination.previous || loading}
              onClick={() => loadReservations(pagination.currentPage - 1)}
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2"
              disabled={!pagination.next || loading}
              onClick={() => loadReservations(pagination.currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default ReservationsList;
