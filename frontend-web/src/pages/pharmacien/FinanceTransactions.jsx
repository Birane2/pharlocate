import { useEffect, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { getPharmacienTransactions } from "../../services/financeService";

function FinanceTransactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    getPharmacienTransactions().then(setTransactions);
  }, []);

  return (
    <PharmacienLayout title="Transactions" headerSubtitle="Historique financier pharmacie">
      <PageCard title="Historique">
        <div className="grid gap-3">
          {transactions.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-black text-[#1C2B4A]">{item.reference_transaction}</p>
                <p className="text-sm font-semibold text-[#6B7280]">{dateTime(item.date_creation)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.type_transaction} />
                <strong>{money(item.montant_brut)}</strong>
              </div>
            </article>
          ))}
        </div>
      </PageCard>
    </PharmacienLayout>
  );
}

export default FinanceTransactions;
