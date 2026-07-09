import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClock,
  faCreditCard,
  faImage,
  faReceipt,
  faRotate,
  faTimes,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import Pagination from "../../components/common/Pagination";
import { EmptyState, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import { rejectPayment, validatePayment } from "../../services/financeService";
import { getPayments } from "../../services/pharmacienPaymentService";

const FILTERS = [
  { value: "all",                      label: "Tous" },
  { value: "en_attente_verification",  label: "En attente" },
  { value: "valide",                   label: "Valides" },
  { value: "refuse",                   label: "Refuses" },
  { value: "non_paye",                 label: "Non payes" },
];

function apiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error  === "string") return data.error;
  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    if (Array.isArray(first))         return first[0];
    if (typeof first === "string")    return first;
  }
  return fallback;
}

// ── Page principale ──────────────────────────────────────────────────────────

function PharmacienPayments() {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [activeFilter, setActiveFilter] = useState("en_attente_verification");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Chargement ────────────────────────────────────────────────────────────

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getPayments({ page: currentPage, filter: activeFilter })
      .then((data) => {
        if (!ignore) {
          setPayments(data.results || []);
          setTotalPages(data.total_pages || 1);
        }
      })
      .catch((err) => {
        if (!ignore) setError(apiErrorMessage(err, "Impossible de charger les paiements."));
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [activeFilter, currentPage]);

  const reload = () => {
    setLoading(true);
    setError("");
    getPayments({ page: currentPage, filter: activeFilter })
      .then((data) => {
        setPayments(data.results || []);
        setTotalPages(data.total_pages || 1);
      })
      .catch((err) => setError(apiErrorMessage(err, "Impossible de charger les paiements.")))
      .finally(() => setLoading(false));
  };

  // Reset page when filter changes
  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  // ── Compteurs par filtre ─────────────────────────────────────────────────

  const counts = useMemo(() => payments.reduce(
    (acc, p) => { acc.all += 1; acc[p.statut] = (acc[p.statut] || 0) + 1; return acc; },
    { all: 0 }
  ), [payments]);

  // ── Actions paiement ─────────────────────────────────────────────────────

  const handleValidate = async (payment) => {
    if (!window.confirm(`Valider le paiement #${payment.id} de ${money(payment.montant_total)} ?`)) return;
    setProcessingId(payment.id);
    setError(""); setSuccess("");
    try {
      await validatePayment(payment.id);
      setSuccess(`Le paiement #${payment.id} a ete valide.`);
      reload();
    } catch (err) {
      setError(apiErrorMessage(err, "Impossible de valider ce paiement."));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog  = (payment) => { setRejectTarget(payment); setRejectReason(""); setError(""); setSuccess(""); };
  const closeRejectDialog = () => { if (processingId) return; setRejectTarget(null); setRejectReason(""); };

  const handleReject = async (event) => {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!rejectTarget || !reason) return;
    setProcessingId(rejectTarget.id);
    setError(""); setSuccess("");
    try {
      await rejectPayment(rejectTarget.id, reason);
      setSuccess(`Le paiement #${rejectTarget.id} a ete refuse.`);
      setRejectTarget(null); setRejectReason("");
      reload();
    } catch (err) {
      setError(apiErrorMessage(err, "Impossible de refuser ce paiement."));
    } finally {
      setProcessingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PharmacienLayout title="Paiements" headerSubtitle="Validez les preuves de paiement de vos patients.">
      <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#2FA6A3]">Suivi des encaissements</p>
            <h2 className="mt-1 text-xl font-black text-[#1C2B4A]">Paiements recus</h2>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D8E3EE] bg-white px-4 py-2 text-sm font-black text-[#2F6E9E] transition hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRotate} spin={loading} />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition ${
                activeFilter === f.value
                  ? "bg-[#2F6E9E] text-white shadow-sm"
                  : "bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E8EEF5]"
              }`}
            >
              {f.label} ({counts[f.value] || 0})
            </button>
          ))}
        </div>

        {error   && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        {success && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div>}

        <div className="mt-4">
          {loading ? (
            <PaymentSkeleton />
          ) : payments.length === 0 ? (
            <EmptyState label="Aucun paiement dans cette categorie." />
          ) : (
            <>
              <div className="grid gap-3 xl:grid-cols-2">
                {payments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    processing={processingId === payment.id}
                    onValidate={() => handleValidate(payment)}
                    onReject={() => openRejectDialog(payment)}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>

      {rejectTarget && (
        <RejectDialog
          payment={rejectTarget}
          reason={rejectReason}
          processing={processingId === rejectTarget.id}
          onReasonChange={setRejectReason}
          onClose={closeRejectDialog}
          onSubmit={handleReject}
        />
      )}
    </PharmacienLayout>
  );
}

// ── Sous-composants (inchangés) ───────────────────────────────────────────────

function PaymentCard({ payment, processing, onValidate, onReject }) {
  const actionable = payment.statut === "en_attente_verification";
  return (
    <article className="rounded-2xl border border-[#E2E8F2] bg-[#FCFDFE] p-4 transition hover:border-[#BFD3E4] hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Paiement #{payment.id}</p>
          <p className="mt-1 text-xl font-black text-[#1C2B4A]">{money(payment.montant_total)}</p>
        </div>
        <StatusBadge status={payment.statut} />
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <PaymentInfo icon={faCreditCard} label="Methode"  value={payment.payment_method_name || "-"} />
        <PaymentInfo icon={faUser}       label="Patient"  value={payment.user_name || `Utilisateur #${payment.user}`} />
        <PaymentInfo icon={faReceipt}    label="Reference" value={payment.reference_paiement || "Sans reference"} />
        <PaymentInfo icon={faClock}      label="Reception" value={dateTime(payment.date_creation)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6B7280]">
        <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-[#E2E8F2]">Medicaments : {money(payment.montant_medicaments)}</span>
        <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-[#E2E8F2]">Livraison : {money(payment.frais_livraison)}</span>
      </div>
      {payment.capture_paiement_url && (
        <a href={payment.capture_paiement_url} target="_blank" rel="noreferrer"
          className="mt-3 flex items-center gap-3 rounded-xl border border-[#D8E3EE] bg-white p-3 text-sm font-black text-[#2F6E9E] transition hover:bg-[#F8FAFC]">
          <FontAwesomeIcon icon={faImage} />
          Voir la preuve de paiement
        </a>
      )}
      {payment.motif_refus && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Motif : {payment.motif_refus}</p>
      )}
      {actionable && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onReject} disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60">
            <FontAwesomeIcon icon={faTimes} /> Refuser
          </button>
          <button type="button" onClick={onValidate} disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
            <FontAwesomeIcon icon={faCheck} /> {processing ? "Traitement..." : "Valider"}
          </button>
        </div>
      )}
    </article>
  );
}

function PaymentInfo({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl bg-white p-2.5 ring-1 ring-[#EDF1F5]">
      <FontAwesomeIcon icon={icon} className="mt-0.5 text-[#2FA6A3]" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">{label}</p>
        <p className="truncate font-bold text-[#1C2B4A]">{value}</p>
      </div>
    </div>
  );
}

function RejectDialog({ payment, reason, processing, onReasonChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-[#1C2B4A]">Refuser le paiement #{payment.id}</h3>
        <p className="mt-1 text-sm font-semibold text-[#6B7280]">Indiquez un motif clair pour le patient.</p>
        <textarea autoFocus required rows={4} value={reason} onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Exemple : reference introuvable ou montant incorrect."
          className="mt-4 w-full resize-none rounded-2xl border border-[#D8E3EE] px-4 py-3 text-sm font-semibold text-[#1C2B4A] outline-none focus:border-[#2F6E9E] focus:ring-4 focus:ring-[#2F6E9E]/10"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={processing}
            className="rounded-xl border border-[#D8E3EE] px-4 py-2 text-sm font-black text-[#6B7280]">
            Annuler
          </button>
          <button type="submit" disabled={processing || !reason.trim()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {processing ? "Traitement..." : "Confirmer le refus"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {[1, 2].map((item) => (
        <div key={item} className="h-64 animate-pulse rounded-2xl bg-[#F1F5F9]" />
      ))}
    </div>
  );
}

export default PharmacienPayments;
