import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { getMyPayments } from "../../services/financeService";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayments().then(setPayments).finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <PageCard title="Mes paiements">
          {loading ? (
            <p className="text-sm font-semibold text-[#6B7280]">Chargement...</p>
          ) : payments.length === 0 ? (
            <EmptyState label="Aucun paiement pour le moment." />
          ) : (
            <div className="grid gap-3">
              {payments.map((payment) => (
                <article key={payment.id} className="rounded-xl border border-[#E2E8F2] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-[#1C2B4A]">{money(payment.montant_total)}</p>
                      <p className="text-sm font-semibold text-[#6B7280]">
                        {payment.payment_method_name} - {payment.reference_paiement || "Sans reference"}
                      </p>
                      <p className="text-xs font-semibold text-[#94A3B8]">{dateTime(payment.date_creation)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={payment.statut} />
                      <Link className="rounded-xl bg-[#2F6E9E] px-3 py-2 text-sm font-bold text-white" to={`/payments/${payment.id}`}>
                        Detail
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </PageCard>
      </div>
    </main>
  );
}

export default Payments;
