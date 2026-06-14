import { useEffect, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { StatCard, StatusBadge } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { getPharmacienFinanceDashboard } from "../../services/financeService";

function FinanceDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getPharmacienFinanceDashboard({ period: "month" }).then(setData);
  }, []);

  const summary = data?.summary || {};
  const payments = data?.payments || {};

  return (
    <PharmacienLayout title="Finance" headerSubtitle="Suivez vos revenus et paiements">
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenu total" value={money(summary.revenu_total)} />
          <StatCard label="Revenu du mois" value={money(summary.revenus_mois)} />
          <StatCard label="Commissions" value={money(summary.commissions_prelevees)} />
          <StatCard label="Net pharmacie" value={money(summary.montant_net_pharmacie)} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1C2B4A]">Paiements</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="Valides" value={payments.valides || 0} />
              <StatCard label="En attente" value={payments.en_attente || 0} />
              <StatCard label="Refuses" value={payments.refuses || 0} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1C2B4A]">Abonnement</h2>
            <p className="mt-3 text-sm font-semibold text-[#6B7280]">Plan actuel</p>
            <p className="mt-1 text-2xl font-black text-[#1C2B4A]">{summary.abonnement_actuel || "-"}</p>
            <div className="mt-3"><StatusBadge status={summary.date_expiration_abonnement ? "active" : "gratuit"} /></div>
          </div>
        </section>
      </div>
    </PharmacienLayout>
  );
}

export default FinanceDashboard;
