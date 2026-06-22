import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import API from "../../api/axios";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateOnly, money } from "../finance/financeFormat";
import {
  adminGenerateInvoice,
  adminListCommissionInvoices,
  adminRejectPayment,
  adminValidatePayment,
} from "../../services/commissionInvoiceService";

const STATUS_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "overdue", label: "En retard" },
  { value: "paid", label: "Payees" },
  { value: "cancelled", label: "Annulees" },
];

function GenerateModal({ onClose, onDone }) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [pharmaciesError, setPharmaciesError] = useState("");

  useEffect(() => {
    const fetchPharmacies = async () => {
      setLoadingPharmacies(true);
      setPharmaciesError("");
      try {
        const res = await API.get("/api/admin/pharmacies/", {
          params: { statut_validation: "validee", page_size: 200 },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results || [];
        setPharmacies(list);
      } catch {
        setPharmaciesError("Impossible de charger les pharmacies.");
      } finally {
        setLoadingPharmacies(false);
      }
    };
    fetchPharmacies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pharmacyId) {
      setError("Veuillez sélectionner une pharmacie.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Les dates de début et fin de période sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const result = await adminGenerateInvoice({
        pharmacy: Number(pharmacyId),
        period_start: periodStart,
        period_end: periodEnd,
        ...(dueDate ? { due_date: dueDate } : {}),
      });
      onDone(result);
    } catch (err) {
      setError(err.response?.data?.error || "Génération impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2FA6A3]/10">
            <svg className="h-5 w-5 text-[#2FA6A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-[#1C2B4A]">
            Générer une facture commission
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Pharmacy select */}
          <div>
            <label className="block text-sm font-bold text-[#1C2B4A]">
              Sélectionner une pharmacie <span className="text-red-500">*</span>
            </label>
            {loadingPharmacies ? (
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#DDEBF0] px-3 py-2.5">
                <svg className="h-4 w-4 animate-spin text-[#2FA6A3]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm text-[#9CA3AF]">Chargement des pharmacies...</span>
              </div>
            ) : pharmaciesError ? (
              <div className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {pharmaciesError}
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                Aucune pharmacie validée disponible.
              </div>
            ) : (
              <select
                value={pharmacyId}
                onChange={(e) => setPharmacyId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DDEBF0] bg-white px-3 py-2.5 text-sm font-semibold text-[#1C2B4A] outline-none focus:border-[#2FA6A3] disabled:bg-[#F8FAFC]"
              >
                <option value="">— Sélectionner une pharmacie —</option>
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                    {p.adresse ? ` — ${p.adresse}` : ""}
                    {p.pharmacien_username ? ` — ${p.pharmacien_username}` : ""}
                    {" — Validée"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Period dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[#1C2B4A]">
                Début période <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm outline-none focus:border-[#2FA6A3]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1C2B4A]">
                Fin période <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm outline-none focus:border-[#2FA6A3]"
              />
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-bold text-[#1C2B4A]">
              Date limite paiement{" "}
              <span className="font-normal text-[#9CA3AF]">(optionnel)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm outline-none focus:border-[#2FA6A3]"
            />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Par défaut : fin de période + 15 jours.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-black text-[#2F6E9E] hover:bg-[#F8FAFC]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingPharmacies || pharmacies.length === 0}
              className="rounded-xl bg-[#2FA6A3] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? "Génération..." : "Générer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-black text-[#2F6E9E]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? "Refus..." : "Confirmer le refus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminCommissionInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [validatingId, setValidatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      setInvoices(await adminListCommissionInvoices(params));
    } catch {
      setError("Impossible de charger les factures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleGenerated = async (result) => {
    setShowGenerate(false);
    setMessage(
      result.created
        ? `Facture ${result.invoice?.invoice_number} créée.`
        : `Facture ${result.invoice?.invoice_number} déjà existante (retournée).`
    );
    await load();
  };

  const handleValidate = async (paymentId) => {
    setValidatingId(paymentId);
    setError("");
    setMessage("");
    try {
      await adminValidatePayment(paymentId);
      setMessage("Paiement validé. Facture marquée payée.");
      await load();
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

  const overdue = invoices.filter((i) => i.status === "overdue");
  const pendingPayments = invoices.flatMap((i) =>
    (i.payments || []).filter((p) => p.status === "pending_validation")
  );

  return (
    <AdminLayout title="Factures commissions" subtitle="Gestion des commissions pharmaciens">
      <div className="space-y-4">
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

        {/* Stats */}
        {!loading && (
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-[#9CA3AF]">
                Total factures
              </p>
              <p className="mt-2 text-2xl font-black text-[#1C2B4A]">{invoices.length}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-600">
                En retard
              </p>
              <p className="mt-2 text-2xl font-black text-red-800">{overdue.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-600">
                Paiements à valider
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">{pendingPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                Factures payées
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-800">
                {invoices.filter((i) => i.status === "paid").length}
              </p>
            </div>
          </div>
        )}

        {/* Filters + Generate */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setMessage(""); }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                  statusFilter === opt.value
                    ? "border-[#2FA6A3] bg-[#2FA6A3]/10 text-[#2FA6A3]"
                    : "border-[#E2E8F2] text-[#6B7280]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setMessage(""); setError(""); setShowGenerate(true); }}
            className="rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-black text-white"
          >
            + Générer une facture
          </button>
        </div>

        <PageCard title={`Factures (${invoices.length})`}>
          {loading ? (
            <p className="text-sm font-semibold text-[#6B7280]">Chargement...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm font-semibold text-[#6B7280]">Aucune facture trouvée.</p>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`rounded-2xl border p-4 ${
                    inv.status === "overdue"
                      ? "border-red-200 bg-red-50"
                      : "border-[#E2E8F2] bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-[#1C2B4A]">
                          {inv.invoice_number}
                        </p>
                        <StatusBadge status={inv.status} />
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#2F6E9E]">
                        {inv.pharmacy_name}
                      </p>
                      <p className="text-xs font-semibold text-[#6B7280]">
                        Période : {dateOnly(inv.period_start)} → {dateOnly(inv.period_end)}
                      </p>
                      <p className="text-xs font-semibold text-[#6B7280]">
                        Échéance :{" "}
                        <span className={inv.status === "overdue" ? "font-black text-red-700" : ""}>
                          {dateOnly(inv.payment_due_date || inv.due_date)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <p className="text-xl font-black text-[#1C2B4A]">
                        {money(inv.commission_amount)}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {Number(inv.commission_rate * 100).toFixed(0)}% sur{" "}
                        {money(inv.total_sales)}
                      </p>
                      <Link
                        to={`/admin/finance/commission-invoices/${inv.id}`}
                        className="text-xs font-bold text-[#2F6E9E] underline"
                      >
                        Voir détail →
                      </Link>
                    </div>
                  </div>

                  {/* Payments to action */}
                  {inv.payments?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {inv.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col gap-2 rounded-xl bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="text-xs font-semibold text-[#6B7280]">
                            <span className="font-bold text-[#1C2B4A]">
                              Paiement #{p.id}
                            </span>{" "}
                            · {p.payment_method_label || p.payment_method} · Réf:{" "}
                            {p.transaction_id} · {money(p.amount)}
                            {p.rejection_reason && (
                              <span className="ml-1 text-red-600">
                                ({p.rejection_reason})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={p.status} />
                            {p.proof_image_url && (
                              <a
                                href={p.proof_image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-[#DDEBF0] px-2 py-1 text-xs font-bold text-[#2F6E9E]"
                              >
                                Preuve
                              </a>
                            )}
                            {p.status === "pending_validation" && (
                              <>
                                <button
                                  onClick={() => {
                                    setMessage("");
                                    setError("");
                                    handleValidate(p.id);
                                  }}
                                  disabled={validatingId === p.id}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white disabled:opacity-60"
                                >
                                  {validatingId === p.id ? "..." : "Valider"}
                                </button>
                                <button
                                  onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setRejectingPayment(p);
                                  }}
                                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white"
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PageCard>
      </div>

      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onDone={handleGenerated} />
      )}
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

export default AdminCommissionInvoices;
