import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { EmptyState, PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  approveSubscriptionRefund,
  getAdminSubscriptionRefunds,
  markSubscriptionRefundProcessed,
  rejectSubscriptionRefund,
} from "../../services/financeService";

function AdminSubscriptionRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadRefunds = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      setRefunds(await getAdminSubscriptionRefunds());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminSubscriptionRefunds()
      .then(setRefunds)
      .finally(() => setLoading(false));
  }, []);

  const runAction = async (id, action) => {
    setActionId(id);
    try {
      await action();
      await loadRefunds();
    } finally {
      setActionId(null);
    }
  };

  const askNote = (fallback = "") => window.prompt("Note administrateur", fallback) || "";

  return (
    <AdminLayout
      title="Remboursements abonnements"
      subtitle="Traitez les demandes liees aux paiements d'abonnement."
    >
      <PageCard title="Demandes de remboursement">
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
            Chargement...
          </div>
        ) : refunds.length === 0 ? (
          <EmptyState label="Aucune demande de remboursement abonnement." />
        ) : (
          <div className="space-y-3">
            {refunds.map((refund) => (
              <article
                key={refund.id}
                className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-black text-[#1C2B4A]">
                      {refund.pharmacy_name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                      {refund.plan_name || "Abonnement"} - Paiement #{refund.subscription_payment}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm font-semibold text-[#6B7280]">
                      {refund.reason}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-[#2F6E9E]">
                      {money(refund.amount)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={refund.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F2] pt-3">
                  <p className="text-xs font-semibold text-[#6B7280]">
                    Demandee le {dateTime(refund.created_at)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {refund.status === "requested" && (
                      <>
                        <button
                          type="button"
                          disabled={actionId === refund.id}
                          onClick={() =>
                            runAction(refund.id, () =>
                              approveSubscriptionRefund(refund.id, askNote("Approuve."))
                            )
                          }
                          className="rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          disabled={actionId === refund.id}
                          onClick={() =>
                            runAction(refund.id, () =>
                              rejectSubscriptionRefund(refund.id, askNote("Refuse."))
                            )
                          }
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {["requested", "approved"].includes(refund.status) && (
                      <button
                        type="button"
                        disabled={actionId === refund.id}
                        onClick={() =>
                          runAction(refund.id, () =>
                            markSubscriptionRefundProcessed(refund.id, askNote("Traite."))
                          )
                        }
                        className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-xs font-black text-[#2F6E9E] disabled:opacity-60"
                      >
                        Marquer traite
                      </button>
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

export default AdminSubscriptionRefunds;
