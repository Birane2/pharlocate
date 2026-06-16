import { useEffect, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { StatCard, StatusBadge } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { getPharmacienFinanceDashboard } from "../../services/financeService";
import { getMyCommissionInvoices } from "../../services/commissionInvoiceService";
import { Link } from "react-router-dom";

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
  const [data, setData] = useState(null);
  const [commissionInvoices, setCommissionInvoices] = useState([]);

  useEffect(() => {
    getPharmacienFinanceDashboard({ period: "month" }).then(setData);
    getMyCommissionInvoices().then(setCommissionInvoices).catch(() => {});
  }, []);

  const summary = data?.summary || {};
  const payments = data?.payments || {};
  const pendingInvoices = commissionInvoices.filter(
    (i) => i.status === "pending" || i.status === "overdue"
  );
  const totalCommissionDue = pendingInvoices.reduce(
    (s, i) => s + Number(i.commission_amount),
    0
  );

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
            {summary.commission_rate && (
              <p className="mt-1 text-sm font-black text-[#2FA6A3]">
                Commission {Number(summary.commission_rate * 100).toFixed(0)}%
              </p>
            )}
            <div className="mt-3">
              <StatusBadge
                status={summary.statut_abonnement || "active"}
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

        {/* Commission invoices widget */}
        {pendingInvoices.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-amber-800">
                  {pendingInvoices.length} facture{pendingInvoices.length > 1 ? "s" : ""} commission{" "}
                  {pendingInvoices.some((i) => i.status === "overdue") ? "en retard" : "en attente"}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  Montant total dû à PharmaLocate : <strong>{money(totalCommissionDue)}</strong>
                </p>
              </div>
              <Link
                to="/pharmacien/finance/invoices"
                className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white shadow-sm"
              >
                Voir mes factures →
              </Link>
            </div>
          </div>
        )}
      </div>
    </PharmacienLayout>
  );
}

export default FinanceDashboard;
