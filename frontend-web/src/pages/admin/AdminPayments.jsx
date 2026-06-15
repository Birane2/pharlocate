import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { EmptyState, PageCard, StatCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  getAdminPaymentCenter,
  getAdminPaymentDetail,
  getAdminPaymentSummary,
  rejectAdminPayment,
  validateAdminPayment,
} from "../../services/financeService";

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "en_attente_verification", label: "En attente" },
  { value: "valide", label: "Validés" },
  { value: "refuse", label: "Refusés" },
  { value: "annule", label: "Annulés" },
  { value: "rembourse", label: "Remboursés" },
];

const typeOptions = [
  { value: "", label: "Tous les types" },
  { value: "reservation_payment", label: "Réservations" },
  { value: "subscription_payment", label: "Abonnements" },
];

const defaultFilters = {
  status: "",
  payment_type: "",
  pharmacy: "",
  date: "",
  search: "",
};

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value || "").trim())
  );
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionId, setActionId] = useState(null);

  const params = useMemo(() => cleanFilters(filters), [filters]);

  const reload = async (nextParams = params) => {
    const [items, stats] = await Promise.all([
      getAdminPaymentCenter(nextParams),
      getAdminPaymentSummary(nextParams),
    ]);
    setPayments(items);
    setSummary(stats);
  };

  useEffect(() => {
    let ignore = false;

    Promise.resolve()
      .then(async () => {
        setLoading(true);
        setError("");
        const [items, stats] = await Promise.all([
          getAdminPaymentCenter(params),
          getAdminPaymentSummary(params),
        ]);
        if (!ignore) {
          setPayments(items);
          setSummary(stats);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError.response?.data?.detail ||
              requestError.response?.data?.error ||
              "Impossible de charger les paiements."
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [params]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const openDetail = async (payment) => {
    setSelected(payment);
    try {
      setSelected(await getAdminPaymentDetail(payment.id));
    } catch {
      setSelected(payment);
    }
  };

  const runAction = async (payment, action) => {
    setActionId(payment.id);
    setError("");
    try {
      await action();
      await reload(params);
      setSelected(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.detail ||
          "Action impossible."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (payment) => {
    const reason = window.prompt("Motif du refus");
    if (reason) {
      runAction(payment, () => rejectAdminPayment(payment.id, reason));
    }
  };

  return (
    <AdminLayout title="Paiements" subtitle="Centre de supervision des paiements.">
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Paiements" value={summary?.total_payments ?? payments.length} />
          <StatCard label="En attente" value={summary?.pending_payments ?? 0} />
          <StatCard
            label="Validés"
            value={summary?.validated_payments ?? 0}
            hint={money(summary?.validated_amount)}
          />
          <StatCard label="Refusés" value={summary?.rejected_payments ?? 0} />
          <StatCard label="Remboursés" value={summary?.refunded_payments ?? 0} />
        </section>

        <PageCard title="Filtres">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.payment_type}
              onChange={(event) => updateFilter("payment_type", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              value={filters.pharmacy}
              onChange={(event) => updateFilter("pharmacy", event.target.value)}
              placeholder="ID pharmacie"
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold"
            />

            <input
              type="date"
              value={filters.date}
              onChange={(event) => updateFilter("date", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold"
            />

            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Transaction ID"
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold xl:col-span-2"
            />
          </div>
        </PageCard>

        <PageCard title="Tous les paiements">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
              Chargement des paiements...
            </div>
          ) : payments.length === 0 ? (
            <EmptyState label="Aucun paiement disponible." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F2] text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Utilisateur</th>
                    <th className="px-3 py-3">Pharmacie</th>
                    <th className="px-3 py-3">Méthode</th>
                    <th className="px-3 py-3">Montant</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F2]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="align-top">
                      <td className="px-3 py-3 font-black text-[#1C2B4A]">
                        {payment.reference}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#6B7280]">
                        {payment.payment_type === "subscription_payment"
                          ? "Abonnement"
                          : "Réservation"}
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {payment.user_name || "-"}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1C2B4A]">
                        {payment.pharmacy_name || "-"}
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {payment.payment_method || "-"}
                        {payment.transaction_id && (
                          <span className="block text-xs font-bold text-[#2F6E9E]">
                            {payment.transaction_id}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-black text-[#2F6E9E]">
                        {money(payment.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {dateTime(payment.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(payment)}
                            className="rounded-xl bg-[#2F6E9E] px-3 py-2 text-xs font-black text-white"
                          >
                            Détails
                          </button>
                          {payment.proof_image_url && (
                            <a
                              href={payment.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-xs font-black text-[#2F6E9E]"
                            >
                              Preuve
                            </a>
                          )}
                          {payment.status === "en_attente_verification" && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === payment.id}
                                onClick={() =>
                                  runAction(payment, () => validateAdminPayment(payment.id))
                                }
                                className="rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                Valider
                              </button>
                              <button
                                type="button"
                                disabled={actionId === payment.id}
                                onClick={() => handleReject(payment)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60"
                              >
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1C2B4A]">
                  {selected.reference}
                </h2>
                <p className="text-sm font-semibold text-[#6B7280]">
                  {selected.payment_type === "subscription_payment"
                    ? "Paiement abonnement"
                    : "Paiement réservation"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm font-black text-[#2F6E9E]"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="Utilisateur" value={selected.user_name} />
              <Detail label="Pharmacie" value={selected.pharmacy_name} />
              <Detail label="Transaction ID" value={selected.transaction_id} />
              <Detail label="Téléphone client" value={selected.client_phone} />
              <Detail label="Médicaments" value={money(selected.amount_medicines)} />
              <Detail label="Livraison" value={money(selected.delivery_fee)} />
              <Detail label="Total" value={money(selected.amount)} />
              <Detail label="Validation" value={dateTime(selected.validated_at)} />
              <Detail label="Validé par" value={selected.validated_by || "-"} />
              <Detail label="Motif refus" value={selected.rejection_reason || "-"} />
            </div>

            {selected.proof_image_url && (
              <a
                href={selected.proof_image_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-black text-[#2F6E9E]"
              >
                Ouvrir la preuve paiement
              </a>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#1C2B4A]">
        {value || "-"}
      </p>
    </div>
  );
}

export default AdminPayments;
