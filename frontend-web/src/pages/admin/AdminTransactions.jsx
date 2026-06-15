import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { EmptyState, PageCard, StatCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  getAdminTransactionDetail,
  getAdminTransactions,
  getAdminTransactionSummary,
} from "../../services/financeService";

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "validated", label: "Validées" },
  { value: "rejected", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
  { value: "refunded", label: "Remboursées" },
];

const typeOptions = [
  { value: "", label: "Tous les types" },
  { value: "reservation_payment", label: "Réservations" },
  { value: "subscription_payment", label: "Abonnements" },
  { value: "commission", label: "Commissions" },
  { value: "refund", label: "Remboursements" },
  { value: "adjustment", label: "Ajustements" },
];

const defaultFilters = {
  status: "",
  type: "",
  pharmacy: "",
  date_start: "",
  date_end: "",
  search: "",
};

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value || "").trim())
  );
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const params = useMemo(() => cleanFilters(filters), [filters]);

  useEffect(() => {
    let ignore = false;

    Promise.resolve()
      .then(async () => {
        setLoading(true);
        setError("");
        const [items, stats] = await Promise.all([
          getAdminTransactions(params),
          getAdminTransactionSummary(params),
        ]);
        if (!ignore) {
          setTransactions(items);
          setSummary(stats);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError.response?.data?.detail ||
              requestError.response?.data?.error ||
              "Impossible de charger les transactions."
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

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const openDetail = async (transaction) => {
    setSelected(transaction);
    setDetailLoading(true);
    try {
      setSelected(await getAdminTransactionDetail(transaction.id));
    } catch {
      setSelected(transaction);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Transactions"
      subtitle="Supervisez les flux financiers PharmaLocate."
    >
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Transactions"
            value={summary?.total_transactions ?? transactions.length}
            hint="Tous flux"
          />
          <StatCard
            label="Validées"
            value={summary?.total_validated ?? 0}
            hint={money(summary?.validated_amount)}
          />
          <StatCard
            label="En attente"
            value={summary?.total_pending ?? 0}
            hint="À superviser"
          />
          <StatCard
            label="Refusées"
            value={summary?.total_rejected ?? 0}
            hint="Paiements rejetés"
          />
          <StatCard
            label="Commissions"
            value={money(summary?.total_commissions)}
            hint="Plateforme"
          />
        </section>

        <PageCard title="Filtres">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(event) => updateFilter("type", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
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
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
            />

            <input
              type="date"
              value={filters.date_start}
              onChange={(event) => updateFilter("date_start", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
            />

            <input
              type="date"
              value={filters.date_end}
              onChange={(event) => updateFilter("date_end", event.target.value)}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
            />

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-black text-[#2F6E9E]"
            >
              Réinitialiser
            </button>
          </div>

          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Rechercher référence, transaction ID, pharmacie..."
            className="mt-3 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none"
          />
        </PageCard>

        <PageCard title="Liste des transactions">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState label="Aucune transaction disponible pour ces filtres." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F2] text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Pharmacie</th>
                    <th className="px-3 py-3">Utilisateur</th>
                    <th className="px-3 py-3">Méthode</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Commission</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F2]">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="align-top">
                      <td className="px-3 py-3 font-black text-[#1C2B4A]">
                        {transaction.reference}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#6B7280]">
                        {transaction.type_label}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1C2B4A]">
                        {transaction.pharmacy_name || "-"}
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {transaction.user_name || "-"}
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {transaction.payment_method || "-"}
                        {transaction.transaction_id && (
                          <span className="block text-xs font-bold text-[#2F6E9E]">
                            {transaction.transaction_id}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-black text-[#2F6E9E]">
                        {money(transaction.total_amount)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#1C2B4A]">
                        {money(transaction.platform_commission)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">
                        {dateTime(transaction.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(transaction)}
                          className="rounded-xl bg-[#2F6E9E] px-3 py-2 text-xs font-black text-white"
                        >
                          Détails
                        </button>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1C2B4A]">
                  {selected.reference}
                </h2>
                <p className="text-sm font-semibold text-[#6B7280]">
                  {detailLoading ? "Chargement..." : selected.type_label}
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
              <Detail label="Pharmacie" value={selected.pharmacy_name} />
              <Detail label="Utilisateur" value={selected.user_name} />
              <Detail label="Réservation" value={selected.reservation_id || "-"} />
              <Detail label="Abonnement" value={selected.subscription_id || "-"} />
              <Detail label="Méthode" value={selected.payment_method || "-"} />
              <Detail label="Transaction ID" value={selected.transaction_id || "-"} />
              <Detail label="Médicaments" value={money(selected.amount_medicines)} />
              <Detail label="Livraison" value={money(selected.delivery_fee)} />
              <Detail label="Total" value={money(selected.total_amount)} />
              <Detail label="Commission" value={money(selected.platform_commission)} />
              <Detail label="Montant pharmacie" value={money(selected.pharmacy_amount)} />
              <Detail label="Validation" value={dateTime(selected.validated_at)} />
            </div>

            {selected.proof_url && (
              <a
                href={selected.proof_url}
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

export default AdminTransactions;
