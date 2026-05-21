import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCapsules,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import Card from "../ui/Card";
import ReservationStatusBadge from "./ReservationStatusBadge";

function formatPrice(value) {
  const numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return String(value || "0");
  }

  return numericValue.toFixed(2);
}

function ReservationCard({ reservation }) {
  return (
    <Card className="border-[#2F6E9E]/10 bg-white/95" hover={false}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
              Reservation #{reservation.id}
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-[#16324A]">
              {reservation.pharmacie_nom}
            </h2>
          </div>

          <ReservationStatusBadge status={reservation.statut} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faHospital} />
              Pharmacie
            </p>
            <p className="mt-2 text-sm font-semibold text-[#16324A]">
              {reservation.pharmacie_nom}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faCalendarDays} />
              Date
            </p>
            <p className="mt-2 text-sm font-semibold text-[#16324A]">
              {new Date(reservation.date_reservation).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.96),_rgba(255,255,255,0.98))] p-4">
          <p className="text-sm font-black tracking-tight text-[#16324A]">
            Medicaments reserves
          </p>
          <div className="mt-4 space-y-3">
            {reservation.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                    <FontAwesomeIcon icon={faCapsules} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#16324A]">
                      {item.medicament_nom}
                    </p>
                    <p className="text-xs text-pharmaTextLight">
                      Quantite: {item.quantite}
                    </p>
                  </div>
                </div>

                <div className="text-sm font-semibold text-[#16324A]">
                  {formatPrice(item.sous_total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="rounded-2xl bg-[#2F6E9E]/10 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              Total
            </p>
            <p className="mt-1 text-xl font-black text-[#16324A]">
              {formatPrice(reservation.total)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ReservationCard;
