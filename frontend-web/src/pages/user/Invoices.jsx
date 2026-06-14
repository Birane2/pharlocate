import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { getMyInvoices } from "../../services/financeService";

function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getMyInvoices().then(setInvoices);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <PageCard title="Mes factures">
          {invoices.length === 0 ? (
            <EmptyState label="Aucune facture disponible." />
          ) : (
            <div className="grid gap-3">
              {invoices.map((invoice) => (
                <article key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F2] p-4">
                  <div>
                    <p className="font-black text-[#1C2B4A]">{invoice.numero_facture}</p>
                    <p className="text-sm font-semibold text-[#6B7280]">{money(invoice.montant_total)} - {dateTime(invoice.date_emission)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.statut} />
                    <Link className="rounded-xl bg-[#2F6E9E] px-3 py-2 text-sm font-bold text-white" to={`/invoices/${invoice.id}`}>
                      Voir
                    </Link>
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

export default Invoices;
