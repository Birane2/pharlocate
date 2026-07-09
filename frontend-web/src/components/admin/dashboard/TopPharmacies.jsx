import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHospital } from "@fortawesome/free-solid-svg-icons";

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MRU`;
}

const STATUS_CLS = {
  validee: "bg-[#10B981]/10 text-[#047857]",
  en_attente: "bg-[#F59E0B]/10 text-[#B45309]",
  suspendue: "bg-[#EF4444]/10 text-[#DC2626]",
};

const STATUS_LABEL = {
  validee: "Validée",
  en_attente: "Attente",
  suspendue: "Suspendue",
};

export default function TopPharmacies({ pharmacies }) {
  return (
    <section className="rounded-xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faHospital} className="h-3.5 w-3.5 text-[#2FA6A3]" />
          <h2 className="text-xs font-bold text-[#1C2B4A]">Top pharmacies</h2>
        </div>
        <Link
          to="/admin/pharmacies"
          className="text-[10px] font-bold text-[#2F6E9E] transition hover:underline"
        >
          Voir tout →
        </Link>
      </div>

      {pharmacies.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-[#6B7280]">
          Aucune donnée disponible.
        </p>
      ) : (
        <div className="space-y-1.5">
          {pharmacies.slice(0, 5).map((pharmacy, idx) => {
            const statusCls =
              STATUS_CLS[pharmacy.status] || "bg-[#2F6E9E]/10 text-[#2F6E9E]";
            const statusLabel = STATUS_LABEL[pharmacy.status] || "Active";
            return (
              <div
                key={pharmacy.id || idx}
                className="flex items-center justify-between gap-2 rounded-lg bg-[#F8FAFC] px-2.5 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-center text-[10px] font-black text-[#6B7280]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-[#1C2B4A]">
                      {pharmacy.name || pharmacy.pharmacy_name || "—"}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      {pharmacy.orders || 0} cmd.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-[11px] font-black text-[#2F6E9E]">
                    {formatMoney(pharmacy.revenue)}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusCls}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
