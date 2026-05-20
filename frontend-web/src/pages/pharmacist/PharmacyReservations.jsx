import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { getReservations } from "../../services/reservationService";

function PharmacyReservations() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getReservations();
        setReservations(data.results || []);
        setError("");
      } catch (err) {
        const message =
          err.response?.status === 401
            ? "Votre session a expire. Veuillez vous reconnecter."
            : err.response?.status === 403
              ? "Acces refuse aux reservations."
              : err.response?.status === 500
                ? "Erreur serveur lors du chargement des reservations."
                : "Impossible de charger les reservations.";

        setReservations([]);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DashboardLayout title="Reservations" links={pharmacistLinks}>
      <Card>
        <h2 className="text-xl font-bold text-pharmaBlue">
          Reservations recues
        </h2>

        {error && (
          <div className="mt-5 rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
            {error}
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
                className="rounded-xl border border-pharmaBorder p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-pharmaBlue">
                    Reservation #{reservation.id}
                  </h3>

                  <Badge variant="warning">{reservation.statut}</Badge>
                </div>

                <p className="mt-2 text-sm">
                  Client : {reservation.user_username}
                </p>
                <p className="text-sm">
                  Pharmacie : {reservation.pharmacie_nom}
                </p>

                <div className="mt-3">
                  {reservation.items?.map((item) => (
                    <p key={item.id} className="text-sm">
                      {item.medicament_nom} x {item.quantite}
                    </p>
                  ))}
                </div>
              </div>
            ))}

          {!loading && reservations.length === 0 && !error && (
            <p className="text-sm text-pharmaText">
              Aucune reservation pour le moment.
            </p>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default PharmacyReservations;
