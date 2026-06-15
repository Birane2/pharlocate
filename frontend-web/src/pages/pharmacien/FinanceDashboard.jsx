import { useEffect, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { StatCard, StatusBadge } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { getPharmacienFinanceDashboard } from "../../services/financeService";
import { useLocation, Link } from "react-router-dom";

const FinanceDashboardCardLink = ({ to, children }) => (
  <Link
    to={to}
    className="group flex items-center justify-between rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm transition hover:border-[#BFD3E4] hover:shadow"
  >
    <span className="min-w-0">{children}</span>
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E] transition group-hover:bg-[#2F6E9E]/15">
      ➜
    </span>
  </Link>
);


function FinanceDashboard() {
  // Debug temporaire (à supprimer après validation)
  const location = useLocation();
  console.log(location.pathname);
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
          <FinanceDashboardCardLink to="/pharmacien/payments">
            <StatCard label="Revenu total" value={money(summary.revenu_total)} />
          </FinanceDashboardCardLink>
          <FinanceDashboardCardLink to="/pharmacien/finance">
            <StatCard label="Revenu du mois" value={money(summary.revenus_mois)} />
          </FinanceDashboardCardLink>
          <FinanceDashboardCardLink to="/pharmacien/finance">
            <StatCard label="Commissions" value={money(summary.commissions_prelevees)} />
          </FinanceDashboardCardLink>
          <FinanceDashboardCardLink to="/pharmacien/finance">
            <StatCard label="Net pharmacie" value={money(summary.montant_net_pharmacie)} />
          </FinanceDashboardCardLink>
        </section>


        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1C2B4A]">Paiements</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <FinanceDashboardCardLink to="/pharmacien/payments">
                <StatCard label="Valides" value={payments.valides || 0} />
              </FinanceDashboardCardLink>
              <FinanceDashboardCardLink to="/pharmacien/payments">
                <StatCard label="En attente" value={payments.en_attente || 0} />
              </FinanceDashboardCardLink>
              <FinanceDashboardCardLink to="/pharmacien/payments">
                <StatCard label="Refuses" value={payments.refuses || 0} />
              </FinanceDashboardCardLink>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-[#1C2B4A]">Abonnement</h2>
            <p className="mt-3 text-sm font-semibold text-[#6B7280]">Plan actuel</p>
            <p className="mt-1 text-2xl font-black text-[#1C2B4A]">{summary.abonnement_actuel || "-"}</p>
            <div className="mt-3">
              <StatusBadge
                status={summary.date_expiration_abonnement ? "active" : "gratuit"}
              />
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FinanceDashboardCardLink to="/pharmacien/transactions">
                <div className="w-full">
                  <StatCard label="Transactions" value={summary.total_transactions || 0} />
                </div>
              </FinanceDashboardCardLink>
              <FinanceDashboardCardLink to="/pharmacien/payments">
                <div className="w-full">
                  <StatCard label="Paiements" value={summary.total_payments || 0} />
                </div>
              </FinanceDashboardCardLink>
            </div>
          </div>
        </section>
      </div>
    </PharmacienLayout>
  );
}

export default FinanceDashboard;
