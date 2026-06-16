import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateOnly, dateTime, money } from "../finance/financeFormat";
import {
  getMyCommissionInvoiceDetail,
  payMyCommissionInvoice,
} from "../../services/commissionInvoiceService";

const METHODS = [
  { code: "bankily", label: "Bankily" },
  { code: "masrivi", label: "Masrivi" },
  { code: "click", label: "Click" },
  { code: "sedad", label: "Sedad" },
  { code: "bci_pay", label: "BCI Pay" },
];

function PaymentForm({ invoice, onSuccess }) {
  const [method, setMethod] = useState(METHODS[0].code);
  const [transactionId, setTransactionId] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!transactionId.trim()) {
      setError("L'ID de transaction est obligatoire.");
      return;
    }
    if (!proofImage) {
      setError("La capture du paiement est obligatoire.");
      return;
    }
    const formData = new FormData();
    formData.append("payment_method", method);
    formData.append("transaction_id", transactionId.trim());
    formData.append("proof_image", proofImage);
    formData.append("amount", invoice.commission_amount);

    setSending(true);
    try {
      const result = await payMyCommissionInvoice(invoice.id, formData);
      onSuccess(result.invoice || invoice);
    } catch (err) {
      const d = err.response?.data;
      setError(
        d?.error || d?.detail || d?.transaction_id || d?.proof_image || "Envoi impossible."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <PageCard title="Envoyer le paiement">
      <div className="mb-4 rounded-2xl bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-800">
          Montant à régler : {money(invoice.commission_amount)}
        </p>
        <p className="mt-1 text-xs font-semibold text-amber-700">
          Échéance : {dateOnly(invoice.payment_due_date || invoice.due_date)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-bold text-[#1C2B4A]">Méthode de paiement</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => setMethod(m.code)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  method === m.code
                    ? "border-[#2FA6A3] bg-[#2FA6A3]/10 text-[#2FA6A3]"
                    : "border-[#E2E8F2] text-[#6B7280]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span className="text-sm font-bold text-[#1C2B4A]">
            ID transaction <span className="text-red-500">*</span>
          </span>
          <input
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Ex: BK-2026-0001"
            className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
          />
        </label>

        <label>
          <span className="text-sm font-bold text-[#1C2B4A]">
            Capture paiement <span className="text-red-500">*</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setProofImage(e.target.files?.[0] || null)}
            className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Screenshot ou photo du reçu obligatoire.
          </p>
        </label>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[#2FA6A3] px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-60"
          >
            {sending ? "Envoi en cours..." : "Envoyer la preuve de paiement"}
          </button>
        </div>
      </form>
    </PageCard>
  );
}

function CommissionInvoiceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPayForm, setShowPayForm] = useState(
    location.state?.openPayment === true
  );

  const load = async () => {
    try {
      const data = await getMyCommissionInvoiceDetail(id);
      setInvoice(data);
    } catch {
      setError("Impossible de charger cette facture.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePaySuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    setShowPayForm(false);
    setMessage(
      "Paiement soumis avec succès. L'administration va le vérifier sous peu."
    );
  };

  const canPay =
    invoice &&
    (invoice.status === "pending" || invoice.status === "overdue") &&
    !invoice.payments?.some((p) => p.status === "pending_validation");

  return (
    <PharmacienLayout
      title="Détail facture commission"
      headerSubtitle="Consultez et payez votre facture"
    >
      <div className="space-y-4">
        <Link
          to="/pharmacien/finance/invoices"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#2F6E9E]"
        >
          ← Retour aux factures
        </Link>

        {message && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm font-semibold text-[#6B7280]">Chargement...</p>
        ) : invoice ? (
          <>
            <PageCard title={invoice.invoice_number}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Statut
                  </p>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Commission due
                  </p>
                  <p className="text-2xl font-black text-[#1C2B4A]">
                    {money(invoice.commission_amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Période
                  </p>
                  <p className="text-sm font-bold text-[#1C2B4A]">
                    {dateOnly(invoice.period_start)} → {dateOnly(invoice.period_end)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Date limite de paiement
                  </p>
                  <p
                    className={`text-sm font-black ${
                      invoice.status === "overdue" ? "text-red-700" : "text-[#1C2B4A]"
                    }`}
                  >
                    {dateOnly(invoice.payment_due_date || invoice.due_date)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Ventes totales
                  </p>
                  <p className="text-sm font-bold text-[#1C2B4A]">
                    {money(invoice.total_sales)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                    Taux commission
                  </p>
                  <p className="text-sm font-bold text-[#1C2B4A]">
                    {Number(invoice.commission_rate * 100).toFixed(0)}%
                  </p>
                </div>
                {invoice.paid_at && (
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                      Payée le
                    </p>
                    <p className="text-sm font-bold text-emerald-700">
                      {dateTime(invoice.paid_at)}
                    </p>
                  </div>
                )}
              </div>

              {invoice.status === "overdue" && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-800">
                    Cette facture est en retard. Veuillez régler dès que possible.
                  </p>
                </div>
              )}
            </PageCard>

            {/* Payments history */}
            {invoice.payments?.length > 0 && (
              <PageCard title="Historique des paiements envoyés">
                <div className="space-y-3">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-[#E2E8F2] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-[#1C2B4A]">
                            Paiement #{p.id} — {p.payment_method_label || p.payment_method}
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            Réf: {p.transaction_id}
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            Envoyé le {dateTime(p.created_at)}
                          </p>
                          {p.rejection_reason && (
                            <p className="mt-1 text-xs font-bold text-red-700">
                              Motif refus : {p.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-1 sm:items-end">
                          <StatusBadge status={p.status} />
                          <p className="text-base font-black text-[#1C2B4A]">
                            {money(p.amount)}
                          </p>
                          {p.proof_image_url && (
                            <a
                              href={p.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-[#2F6E9E] underline"
                            >
                              Voir la capture
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PageCard>
            )}

            {/* Payment form */}
            {canPay && (
              <>
                {!showPayForm ? (
                  <div className="flex">
                    <button
                      onClick={() => setShowPayForm(true)}
                      className="rounded-xl bg-[#2FA6A3] px-6 py-3 text-sm font-black text-white shadow-sm"
                    >
                      Payer cette facture
                    </button>
                  </div>
                ) : (
                  <PaymentForm invoice={invoice} onSuccess={handlePaySuccess} />
                )}
              </>
            )}

            {invoice.payments?.some((p) => p.status === "pending_validation") && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-800">
                  Un paiement est en attente de validation par l'administration.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </PharmacienLayout>
  );
}

export default CommissionInvoiceDetail;
