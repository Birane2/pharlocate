import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { EmptyState, PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  getAdminSubscriptionPayments,
  rejectSubscriptionPayment,
  validateSubscriptionPayment,
} from "../../services/financeService";

function AdminSubscriptionPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      setPayments(await getAdminSubscriptionPayments());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminSubscriptionPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const runAction = async (id, action) => {
    setActionId(id);
    try {
      await action();
      await loadPayments();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id) => {
    const reason = window.prompt("Motif du refus");
    if (reason !== null) {
      runAction(id, () => rejectSubscriptionPayment(id, reason));
    }
  };

  return (
    <AdminLayout
      title="Paiements abonnements"
      subtitle="Validez les paiements envoyés par les pharmacies."
    >
      <PageCard title="Demandes de paiement">
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
            Chargement...
          </div>
        ) : payments.length === 0 ? (
          <EmptyState label="Aucun paiement d'abonnement disponible." />
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-black text-[#1C2B4A]">
                      {payment.pharmacy_name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                      {payment.plan_name} • {payment.payment_method_label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                      Transaction : {payment.transaction_id}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-[#2F6E9E]">
                      {money(payment.amount)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F2] pt-3">
                  <p className="text-xs font-semibold text-[#6B7280]">
                    Envoyé le {dateTime(payment.created_at)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {payment.proof_image_url && (
                      <a
                        href={payment.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-xs font-black text-[#2F6E9E]"
                      >
                        Voir capture
                      </a>
                    )}
                    {payment.status === "en_attente_validation" && (
                      <>
                        <button
                          type="button"
                          disabled={actionId === payment.id}
                          onClick={() =>
                            runAction(payment.id, () => validateSubscriptionPayment(payment.id))
                          }
                          className="rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          disabled={actionId === payment.id}
                          onClick={() => handleReject(payment.id)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageCard>
    </AdminLayout>
  );
}

export default AdminSubscriptionPayments;
