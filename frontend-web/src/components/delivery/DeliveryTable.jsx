import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faEye,
  faLocationDot,
  faPhone,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import DeliveryStatusBadge from "./DeliveryStatusBadge";
import GoogleMapsButton from "./GoogleMapsButton";

const paymentLabels = {
  en_attente_verification: "En verification",
  valide: "Valide",
  refuse: "Refuse",
  annule: "Annule",
  rembourse: "Rembourse",
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} MRU`;
}

function DeliveryTable({ deliveries, busyId, onView, onInProgress, onDelivered, onCancel }) {
  if (!deliveries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
        <p className="text-base font-black text-[#1C2B4A]">Aucune livraison pour le moment</p>
        <p className="mt-1 text-sm font-semibold text-[#6B7280]">
          Les commandes en livraison apparaitront ici des leur creation.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E2E8F2]">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Commande
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Adresse
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Paiement
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Livraison
              </th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-[#6B7280]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {deliveries.map((delivery) => {
              const isBusy = busyId === delivery.id;
              const isFinal = ["livree", "annulee"].includes(delivery.delivery_status);

              return (
                <tr key={delivery.id} className="transition hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-[#1C2B4A]">
                      #{delivery.reservation_id}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                      {formatMoney(delivery.total_amount)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-[#1C2B4A]">
                      {delivery.client_name}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
                      <FontAwesomeIcon icon={faPhone} className="text-[#2F6E9E]" />
                      {delivery.client_phone || "Telephone indisponible"}
                    </p>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="line-clamp-2 text-sm font-semibold text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#2FA6A3]" />
                      {delivery.address || "Adresse indisponible"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#2F6E9E]/10 px-2.5 py-1 text-xs font-black text-[#2F6E9E]">
                      {paymentLabels[delivery.payment_status] || delivery.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DeliveryStatusBadge status={delivery.delivery_status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onView(delivery)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D8E3EE] bg-white px-3 py-2 text-xs font-black text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Detail
                      </button>
                      <GoogleMapsButton
                        latitude={delivery.latitude_client}
                        longitude={delivery.longitude_client}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() => onInProgress(delivery)}
                        disabled={isBusy || isFinal || delivery.delivery_status === "en_cours"}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={isBusy ? faSpinner : faSpinner} />
                        En cours
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelivered(delivery)}
                        disabled={isBusy || isFinal}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Livree
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(delivery)}
                        disabled={isBusy || isFinal}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faBan} />
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeliveryTable;
