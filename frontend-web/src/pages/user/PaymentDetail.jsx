import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { getPaymentDetail } from "../../services/financeService";

function PaymentDetail() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    getPaymentDetail(id).then(setPayment);
  }, [id]);

  if (!payment) {
    return <main className="min-h-screen bg-[#F8FAFC] p-6">Chargement...</main>;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <PageCard title={`Paiement #${payment.id}`}>
          <div className="grid gap-3 text-sm font-semibold text-[#1C2B4A] sm:grid-cols-2">
            <p>Montant : {money(payment.montant_total)}</p>
            <p>Methode : {payment.payment_method_name}</p>
            <p>Reference : {payment.reference_paiement || "-"}</p>
            <p>Date : {dateTime(payment.date_creation)}</p>
            <p>Pharmacie : {payment.pharmacy_name}</p>
            <p><StatusBadge status={payment.statut} /></p>
          </div>
          {payment.capture_paiement_url && (
            <img className="mt-4 max-h-96 rounded-2xl border object-contain" src={payment.capture_paiement_url} alt="Capture paiement" />
          )}
          <Link className="mt-5 inline-flex rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-bold text-white" to="/invoices">
            Voir mes factures
          </Link>
        </PageCard>
      </div>
    </main>
  );
}

export default PaymentDetail;
