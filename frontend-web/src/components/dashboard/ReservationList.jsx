import { Link } from "react-router-dom";
import Pagination from "./Pagination";

const statusClass = {
  en_attente: "bg-orange-100 text-orange-700 ring-orange-200",
  confirmee: "bg-[#2F6E9E]/10 text-[#2F6E9E] ring-[#2F6E9E]/20",
  prete: "bg-[#2FA6A3]/10 text-[#2FA6A3] ring-[#2FA6A3]/20",
  recuperee: "bg-[#35C3A3]/15 text-[#16815f] ring-[#35C3A3]/20",
  annulee: "bg-red-50 text-red-600 ring-red-100",
};

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

function ReservationList({ reservations, page, totalPages, onPrevious, onNext }) {
  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
            Reservations
          </p>
          <h2 className="mt-1 text-xl font-black text-pharmaText">
            Demandes recentes
          </h2>
          <p className="mt-1 text-sm text-pharmaTextLight">
            Suivi rapide des patients et des commandes en cours.
          </p>
        </div>
        <Link
          to="/pharmacien/reservations"
          className="rounded-xl border border-[#2F6E9E]/20 px-4 py-2 text-sm font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
        >
          Tout voir
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {reservations.length === 0 && (
          <p className="rounded-2xl bg-pharmaSurface p-4 text-sm text-pharmaTextLight">
            Aucune reservation recente.
          </p>
        )}

        {reservations.map((reservation) => (
          <article
            key={reservation.id}
            className="group rounded-2xl border border-pharmaBorder bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#0085AA]/30 hover:shadow-[0_18px_40px_rgba(0,133,170,0.12)]"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-pharmaText">
                    Reservation #{reservation.id}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                      statusClass[reservation.statut] ||
                      "bg-pharmaSurface text-pharmaTextLight ring-pharmaBorder"
                    }`}
                  >
                    {reservation.statut}
                  </span>
                </div>
                <p className="mt-2 text-sm text-pharmaTextLight">
                  Client :{" "}
                  <span className="font-semibold text-pharmaText">
                    {reservation.client || "Client"}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-pharmaTextLight">
                  {(reservation.items || [])
                    .map((item) => `${item.medicament_nom} x${item.quantite}`)
                    .join(", ") || "Aucun medicament renseigne"}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm font-bold text-[#0085AA]">
                  {formatDate(reservation.date_reservation)}
                </p>
                <p className="mt-1 text-xs text-pharmaTextLight">
                  Total : {reservation.total || 0} MRU
                </p>
              </div>
            </div>
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

export default ReservationList;
