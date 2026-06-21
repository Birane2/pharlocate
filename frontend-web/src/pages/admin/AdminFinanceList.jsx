import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  approveRefund,
  executeRefund,
  getAdminPendingPayments,
  getAdminRefunds,
  getAdminTransactions,
  rejectPayment,
  rejectRefund,
  validatePayment,
} from "../../services/financeService";

const loaders = {
  transactions: getAdminTransactions,
  payments: getAdminPendingPayments,
  refunds: getAdminRefunds,
};

function AdminFinanceList({ type, title }) {
  const [items, setItems] = useState([]);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const loadItems = () => loaders[type]().then(setItems);

  useEffect(() => {
    loaders[type]().then(setItems);
  }, [type]);

  const runAction = async (id, action) => {
    setLoadingActionId(id);
    try {
      await action();
      await loadItems();
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRejectPayment = (id) => {
    const reason = window.prompt("Motif du refus du paiement");
    if (reason) {
      runAction(id, () => rejectPayment(id, reason));
    }
  };

  const handleRejectRefund = (id) => {
    const reason = window.prompt("Motif du refus du remboursement");
    if (reason) {
      runAction(id, () => rejectRefund(id, reason));
    }
  };

  return (
    <AdminLayout title={title} subtitle="Gestion financiere PharmaLocate">
      <PageCard title={title}>
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-black text-[#1C2B4A]">
                  {item.reference_transaction || item.numero_facture || item.reference_paiement || item.invoice_number || item.plan_detail?.nom || `#${item.id}`}
                </p>
                <p className="text-sm font-semibold text-[#6B7280]">{dateTime(item.date_creation || item.date_emission || item.date_demande)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.statut || item.type_transaction} />
                <strong>{money(item.montant_total || item.montant_brut || item.montant_demande || item.plan_detail?.prix_mensuel)}</strong>
              </div>
              {type === "payments" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loadingActionId === item.id}
                    onClick={() => runAction(item.id, () => validatePayment(item.id))}
                    className="rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    disabled={loadingActionId === item.id}
                    onClick={() => handleRejectPayment(item.id)}
                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                  >
                    Refuser
                  </button>
                </div>
              ) : null}
              {type === "refunds" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loadingActionId === item.id}
                    onClick={() => runAction(item.id, () => approveRefund(item.id))}
                    className="rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    disabled={loadingActionId === item.id}
                    onClick={() => runAction(item.id, () => executeRefund(item.id))}
                    className="rounded-xl bg-[#2F6E9E] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                  >
                    Executer
                  </button>
                  <button
                    type="button"
                    disabled={loadingActionId === item.id}
                    onClick={() => handleRejectRefund(item.id)}
                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                  >
                    Refuser
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </PageCard>
    </AdminLayout>
  );
}

export default AdminFinanceList;
