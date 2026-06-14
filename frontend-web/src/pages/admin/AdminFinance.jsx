import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { StatCard } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { getAdminFinanceDashboard } from "../../services/financeService";

function AdminFinance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAdminFinanceDashboard({ period: "month" }).then(setData);
  }, []);

  const summary = data?.summary || {};

  return (
    <AdminLayout title="Finance globale" subtitle="Pilotage financier PharmaLocate">
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
    </AdminLayout>
  );
}

export default AdminFinance;
