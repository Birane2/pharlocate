import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { StatCard } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { getAdminFinanceDashboard } from "../../services/financeService";
import { adminListCommissionInvoices } from "../../services/commissionInvoiceService";

function AdminFinance() {
  const [data, setData] = useState(null);
  const [commissionInvoices, setCommissionInvoices] = useState([]);

  useEffect(() => {
    getAdminFinanceDashboard({ period: "month" }).then(setData);
    adminListCommissionInvoices().then(setCommissionInvoices).catch(() => {});
  }, []);

  const summary = data?.summary || {};
  const overdueInvoices = commissionInvoices.filter((i) => i.status === "overdue");
  const pendingPayments = commissionInvoices.flatMap((i) =>
    (i.payments || []).filter((p) => p.status === "pending_validation")
  );
  const totalCommissionBilled = commissionInvoices.reduce(
    (s, i) => s + Number(i.commission_amount), 0
  );
  const totalCommissionPaid = commissionInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.commission_amount), 0);

  return (
    <AdminLayout title="Finance globale" subtitle="Pilotage financier PharmaLocate">
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenu plateforme" value={money(summary.revenu_total_plateforme)} />
          <StatCard label="Commissions" value={money(summary.total_commissions)} />
          <StatCard label="Remboursements" value={money(summary.total_remboursements)} />
          <StatCard label="Revenu abonnements" value={money(summary.revenu_abonnements)} />
          <StatCard label="Paiements valides" value={summary.paiements_valides || 0} />
          <StatCard label="Paiements en attente" value={summary.paiements_en_attente || 0} />
          <StatCard label="Abonnements actifs" value={summary.nombre_abonnements_actifs || 0} />
          <StatCard label="Livraisons" value={summary.livraisons_totales || 0} />
        </section>

        {/* Commission invoices summary */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#1C2B4A]">Factures commissions</h2>
            <Link
              to="/admin/finance/commission-invoices"
              className="text-sm font-bold text-[#2F6E9E] underline"
            >
              Tout voir →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                Total facturé
              </p>
              <p className="mt-2 text-xl font-black text-[#1C2B4A]">
                {money(totalCommissionBilled)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                Commissions payées
              </p>
              <p className="mt-2 text-xl font-black text-emerald-800">
                {money(totalCommissionPaid)}
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-600">
                Factures en retard
              </p>
              <p className="mt-2 text-2xl font-black text-red-800">{overdueInvoices.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-600">
                Paiements à valider
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {pendingPayments.length}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminFinance;
