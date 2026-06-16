import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateOnly, dateTime, money } from "../finance/financeFormat";
import {
  adminGetCommissionInvoiceDetail,
  adminRejectPayment,
  adminValidatePayment,
} from "../../services/commissionInvoiceService";

function RejectModal({ payment, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Le motif est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      await adminRejectPayment(payment.id, reason.trim());
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Refus impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-black text-[#1C2B4A]">
          Refuser paiement #{payment.id}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label>
            <span className="text-sm font-bold text-[#1C2B4A]">
              Motif du refus <span className="text-red-500">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3]"
            />
          </label>
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-black text-[#2F6E9E]">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60">
              {loading ? "Refus..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminCommissionInvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [validatingId, setValidatingId] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);

  const load = async () => {
    try {
      setInvoice(await adminGetCommissionInvoiceDetail(id));
    } catch {
      setError("Impossible de charger cette facture.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleValidate = async (paymentId) => {
    setValidatingId(paymentId);
    setError("");
    setMessage("");
    try {
      const result = await adminValidatePayment(paymentId);
      setInvoice(result.invoice || invoice);
      setMessage("Paiement validé. Facture marquée payée.");
    } catch (err) {
      setError(err.response?.data?.error || "Validation impossible.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleRejected = async () => {
    setRejectingPayment(null);
    setMessage("Paiement refusé.");
    await load();
  };

  return (
    <AdminLayout title="Détail facture commission" subtitle="Consulter et traiter la facture">
      <div className="space-y-4">
        <Link
          to="/admin/finance/commission-invoices"
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Pharmacie</p>
                  <p className="mt-1 text-base font-black text-[#2F6E9E]">{invoice.pharmacy_name}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Statut</p>
                  <div className="mt-1"><StatusBadge status={invoice.status} /></div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Commission due</p>
                  <p className="mt-1 text-2xl font-black text-[#1C2B4A]">{money(invoice.commission_amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Période</p>
                  <p className="mt-1 text-sm font-bold text-[#1C2B4A]">
                    {dateOnly(invoice.period_start)} → {dateOnly(invoice.period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Date limite</p>
                  <p className={`mt-1 text-sm font-bold ${invoice.status === "overdue" ? "text-red-700" : "text-[#1C2B4A]"}`}>
                    {dateOnly(invoice.payment_due_date || invoice.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Ventes totales</p>
                  <p className="mt-1 text-sm font-bold text-[#1C2B4A]">{money(invoice.total_sales)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Taux commission</p>
                  <p className="mt-1 text-sm font-bold text-[#1C2B4A]">
                    {Number(invoice.commission_rate * 100).toFixed(0)}%
                  </p>
                </div>
                {invoice.paid_at && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Payée le</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{dateTime(invoice.paid_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">Créée le</p>
                  <p className="mt-1 text-sm font-semibold text-[#6B7280]">{dateTime(invoice.created_at)}</p>
                </div>
              </div>
            </PageCard>

            <PageCard title={`Paiements soumis (${invoice.payments?.length || 0})`}>
              {!invoice.payments?.length ? (
                <p className="text-sm font-semibold text-[#6B7280]">
                  Aucun paiement soumis pour cette facture.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-[#E2E8F2] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-[#1C2B4A]">Paiement #{p.id}</p>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                            Méthode : {p.payment_method_label || p.payment_method}
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            Référence : {p.transaction_id}
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            Soumis le : {dateTime(p.created_at)}
                          </p>
                          {p.validated_at && (
                            <p className="text-xs font-semibold text-[#6B7280]">
                              Traité le : {dateTime(p.validated_at)}
                            </p>
                          )}
                          {p.rejection_reason && (
                            <p className="mt-1 text-xs font-bold text-red-700">
                              Motif refus : {p.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <p className="text-lg font-black text-[#1C2B4A]">{money(p.amount)}</p>
                          {p.proof_image_url && (
                            <a
                              href={p.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-[#DDEBF0] px-3 py-1.5 text-xs font-bold text-[#2F6E9E]"
                            >
                              Voir la capture de paiement
                            </a>
                          )}
                          {p.status === "pending_validation" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setMessage("");
                                  setError("");
                                  handleValidate(p.id);
                                }}
                                disabled={validatingId === p.id}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                              >
                                {validatingId === p.id ? "Validation..." : "Valider"}
                              </button>
                              <button
                                onClick={() => {
                                  setMessage("");
                                  setError("");
                                  setRejectingPayment(p);
                                }}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>
          </>
        ) : null}
      </div>

      {rejectingPayment && (
        <RejectModal
          payment={rejectingPayment}
          onClose={() => setRejectingPayment(null)}
          onDone={handleRejected}
        />
      )}
    </AdminLayout>
  );
}

export default AdminCommissionInvoiceDetail;
