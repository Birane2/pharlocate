import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateOnly, money } from "../finance/financeFormat";
import { getMyCommissionInvoices } from "../../services/commissionInvoiceService";

function InvoiceStatusTag({ status }) {
  if (status === "overdue") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        En retard — Urgent
      </span>
    );
  }
  return <StatusBadge status={status} />;
}

function CommissionInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyCommissionInvoices()
      .then(setInvoices)
      .catch(() => setError("Impossible de charger les factures commissions."))
      .finally(() => setLoading(false));
  }, []);

  const pending = invoices.filter((i) => i.status === "pending" || i.status === "overdue");
  const totalDue = pending.reduce((s, i) => s + Number(i.commission_amount), 0);

  return (
    <PharmacienLayout
      title="Factures commissions"
      headerSubtitle="Vos factures mensuelles PharmaLocate"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        {!loading && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                Total factures
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C2B4A]">{invoices.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-600">
                En attente
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">{pending.length}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-600">
                Montant du
              </p>
              <p className="mt-2 text-2xl font-black text-red-800">{money(totalDue)}</p>
            </div>
          </div>
        )}

        <PageCard title="Mes factures de commissions">
          {loading ? (
            <p className="text-sm font-semibold text-[#6B7280]">Chargement...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm font-semibold text-[#6B7280]">
              Aucune facture commission pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`rounded-2xl border p-4 ${
                    inv.status === "overdue"
                      ? "border-red-200 bg-red-50"
                      : "border-[#E2E8F2] bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-[#1C2B4A]">
                          {inv.invoice_number}
                        </p>
                        <InvoiceStatusTag status={inv.status} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                        Période : {dateOnly(inv.period_start)} → {dateOnly(inv.period_end)}
                      </p>
                      <p className="text-xs font-semibold text-[#6B7280]">
                        Échéance :{" "}
                        <span
                          className={
                            inv.status === "overdue" ? "font-black text-red-700" : ""
                          }
                        >
                          {dateOnly(inv.payment_due_date || inv.due_date)}
                        </span>
                      </p>
                      {inv.paid_at && (
                        <p className="text-xs font-semibold text-emerald-700">
                          Payée le {dateOnly(inv.paid_at)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="text-xl font-black text-[#1C2B4A]">
                        {money(inv.commission_amount)}
                      </p>
                      <p className="text-xs font-semibold text-[#9CA3AF]">
                        {Number(inv.commission_rate * 100).toFixed(0)}% sur{" "}
                        {money(inv.total_sales)}
                      </p>
                    </div>
                  </div>

                  {/* Pending payments indicator */}
                  {inv.payments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {inv.payments.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full bg-[#F0F4F8] px-2 py-0.5 text-xs font-semibold text-[#6B7280]"
                        >
                          Paiement #{p.id} — <StatusBadge status={p.status} />
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/pharmacien/finance/invoices/${inv.id}`}
                      className="rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-bold text-[#2F6E9E]"
                    >
                      Voir détail
                    </Link>
                    {(inv.status === "pending" || inv.status === "overdue") &&
                      !inv.payments?.some((p) => p.status === "pending_validation") && (
                        <Link
                          to={`/pharmacien/finance/invoices/${inv.id}`}
                          state={{ openPayment: true }}
                          className="rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-black text-white"
                        >
                          Payer cette facture
                        </Link>
                      )}
                    {inv.payments?.some((p) => p.status === "pending_validation") && (
                      <span className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                        Paiement en cours de validation
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageCard>
      </div>
    </PharmacienLayout>
  );
}

export default CommissionInvoices;
