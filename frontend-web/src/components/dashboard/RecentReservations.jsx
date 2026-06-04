import { Link } from "react-router-dom";

const statusLabels = {
  en_attente: "En attente",
  confirmee: "Confirmee",
  annulee: "Annulee",
  recuperee: "Recuperee",
  refusee: "Refusee",
  prete: "Prete",
};

const statusStyles = {
  en_attente: "bg-orange-50 text-orange-700",
  confirmee: "bg-[#2FA6A3]/10 text-[#167769]",
  annulee: "bg-[#6B7280]/10 text-[#6B7280]",
  recuperee: "bg-[#5EC6B8]/18 text-[#167769]",
  refusee: "bg-red-50 text-red-600",
  prete: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
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

function RecentReservations({ reservations }) {
  const items = reservations.slice(0, 3);

  return (
    <section className="dashboard-reveal rounded-2xl border border-pharmaBorder bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2FA6A3]">
            Reservations
          </p>
          <h2 className="mt-1 text-base font-bold text-[#1C2B4A]">
            Demandes recentes
          </h2>
        </div>
        <Link
          to="/pharmacien/reservations"
          className="rounded-lg px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/8"
        >
          Voir tout
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <p className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm text-[#6B7280]">
            Aucune demande recente.
          </p>
        )}

        {items.map((reservation) => (
          <article
            key={reservation.id}
            className="flex flex-col gap-2 rounded-xl border border-[#E2E8F2] px-3 py-3 transition hover:border-[#2F6E9E]/25 hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#1C2B4A]">
                  Reservation #{reservation.id}
                </p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[reservation.statut] || "bg-[#F8FAFC] text-[#6B7280]"}`}>
                  {statusLabels[reservation.statut] || reservation.statut}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-[#6B7280]">
                {reservation.client || "Client"} ·{" "}
                {(reservation.items || [])
                  .map((item) => `${item.medicament_nom} x${item.quantite}`)
                  .join(", ") || "Aucun medicament"}
              </p>
            </div>
            <time className="shrink-0 text-[11px] font-semibold text-[#6B7280]">
              {formatDate(reservation.date_reservation)}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecentReservations;
