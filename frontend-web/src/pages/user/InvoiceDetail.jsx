import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { downloadInvoicePdf, getInvoiceDetail } from "../../services/financeService";

function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    getInvoiceDetail(id).then(setInvoice);
  }, [id]);

  if (!invoice) {
    return <main className="min-h-screen bg-[#F8FAFC] p-6">Chargement...</main>;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <PageCard
          title={invoice.numero_facture}
          action={<StatusBadge status={invoice.statut} />}
        >
          <div className="grid gap-3 text-sm font-semibold text-[#1C2B4A] sm:grid-cols-2">
            <p>Date emission : {dateTime(invoice.date_emission)}</p>
            <p>Pharmacie : {invoice.pharmacy_name}</p>
            <p>Total : {money(invoice.montant_total)}</p>
            <p>Commission : {money(invoice.commission)}</p>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F8FAFC] text-left text-[#6B7280]">
                <tr>
                  <th className="px-3 py-2">Medicament</th>
                  <th className="px-3 py-2">Quantite</th>
                  <th className="px-3 py-2">Prix</th>
                  <th className="px-3 py-2">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">{item.medicament_nom}</td>
                    <td className="px-3 py-2">{item.quantite}</td>
                    <td className="px-3 py-2">{money(item.prix_unitaire)}</td>
                    <td className="px-3 py-2">{money(item.sous_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {downloadError ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {downloadError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              setDownloadError("");
              try {
                await downloadInvoicePdf(invoice.id);
              } catch {
                setDownloadError("Impossible de telecharger la facture pour le moment.");
              }
            }}
            className="mt-5 inline-flex rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-bold text-white"
          >
            Telecharger PDF
          </button>
        </PageCard>
      </div>
    </main>
  );
}

export default InvoiceDetail;
