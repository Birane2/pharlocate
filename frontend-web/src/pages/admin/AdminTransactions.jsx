import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { EmptyState, PageCard, StatCard, StatusBadge } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  exportAdminTransactionsExcel,
  exportAdminTransactionsPDF,
  exportAdminTransactionsWord,
  getAdminTransactionDetail,
  getAdminTransactions,
  getAdminTransactionSummary,
} from "../../services/financeService";

const PAGE_SIZE = 10;

function ExportButtons({ params, disabled }) {
  const [loading, setLoading] = useState(null);

  const handle = async (fn, key) => {
    setLoading(key);
    try {
      await fn(params);
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportAdminTransactionsPDF, "pdf")}
        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 disabled:opacity-50"
      >
        {loading === "pdf" ? "..." : "PDF"}
      </button>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportAdminTransactionsExcel, "excel")}
        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 disabled:opacity-50"
      >
        {loading === "excel" ? "..." : "Excel"}
      </button>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportAdminTransactionsWord, "word")}
        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 disabled:opacity-50"
      >
        {loading === "word" ? "..." : "Word"}
      </button>
    </div>
  );
}

function Pagination({ page, totalPages, count, pageSize, onChange }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F2] pt-4">
      <p className="text-xs font-semibold text-[#6B7280]">
        {start}–{end} sur {count} transactions
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-xl border border-[#DDEBF0] px-3 py-1.5 text-sm font-black text-[#2F6E9E] disabled:opacity-40"
        >
          ← Précédent
        </button>
        <span className="text-sm font-bold text-[#1C2B4A]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-xl border border-[#DDEBF0] px-3 py-1.5 text-sm font-black text-[#2F6E9E] disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

function DetailModal({ selected, onClose }) {
  if (!selected) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#1C2B4A]">{selected.reference}</h2>
            <p className="text-sm font-semibold text-[#6B7280]">{selected.type_label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm font-black text-[#2F6E9E]"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Pharmacie", selected.pharmacy_name],
            ["Utilisateur", selected.user_name],
            ["Réservation", selected.reservation_id || "-"],
            ["Abonnement", selected.subscription_id || "-"],
            ["Méthode", selected.payment_method || "-"],
            ["Transaction ID", selected.transaction_id || "-"],
            ["Médicaments", money(selected.amount_medicines)],
            ["Livraison", money(selected.delivery_fee)],
            ["Total", money(selected.total_amount)],
            ["Commission", money(selected.platform_commission)],
            ["Montant pharmacie", money(selected.pharmacy_amount)],
            ["Validation", dateTime(selected.validated_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#F8FAFC] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p>
              <p className="mt-1 break-words text-sm font-black text-[#1C2B4A]">{value || "-"}</p>
            </div>
          ))}
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
  );
}

function AdminTransactions() {
  const [data, setData] = useState({ count: 0, total_pages: 1, page: 1, results: [] });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const params = useMemo(
    () => ({
      page: currentPage,
      page_size: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [currentPage, search]
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    Promise.all([getAdminTransactions(params), getAdminTransactionSummary(params)])
      .then(([txData, stats]) => {
        if (!ignore) {
          setData(txData || {});
          setSummary(stats);
        }
      })
      .catch((err) => {
        if (!ignore)
          setError(
            err.response?.data?.detail ||
              err.response?.data?.error ||
              "Impossible de charger les transactions."
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const openDetail = async (transaction) => {
    setSelected(transaction);
    try {
      const detail = await getAdminTransactionDetail(transaction.id);
      setSelected(detail);
    } catch {
      // keep current data
    }
  };

  const transactions = data.results || [];

  return (
    <AdminLayout title="Transactions" subtitle="Supervisez les flux financiers PharmaLocate.">
      <div className="space-y-4">
        {/* Summary cards */}
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={summary?.total_transactions ?? data.count ?? 0} hint="Tous flux" />
          <StatCard label="Validées" value={summary?.total_validated ?? 0} hint={money(summary?.validated_amount)} />
          <StatCard label="En attente" value={summary?.total_pending ?? 0} hint="À superviser" />
          <StatCard label="Refusées" value={summary?.total_rejected ?? 0} hint="Paiements rejetés" />
          <StatCard label="Commissions" value={money(summary?.total_commissions)} hint="Plateforme" />
        </section>

        {/* Toolbar: search + export */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm">
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher référence, pharmacie, utilisateur..."
            className="w-full max-w-sm rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Télécharger :</span>
            <ExportButtons params={params} disabled={loading} />
          </div>
        </div>

        {/* Table */}
        <PageCard title={`Liste des transactions${data.count ? ` (${data.count})` : ""}`}>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState label="Aucune transaction disponible." />
          ) : (
            <>
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
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F2]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="align-top hover:bg-[#F8FAFC]">
                        <td className="px-3 py-3 font-black text-[#1C2B4A]">{t.reference}</td>
                        <td className="px-3 py-3 font-semibold text-[#6B7280]">{t.type_label}</td>
                        <td className="px-3 py-3 font-semibold text-[#1C2B4A]">{t.pharmacy_name || "-"}</td>
                        <td className="px-3 py-3 text-[#6B7280]">{t.user_name || "-"}</td>
                        <td className="px-3 py-3 text-[#6B7280]">
                          {t.payment_method || "-"}
                          {t.transaction_id && (
                            <span className="block text-xs font-bold text-[#2F6E9E]">{t.transaction_id}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-black text-[#2F6E9E]">{money(t.total_amount)}</td>
                        <td className="px-3 py-3 font-semibold text-[#1C2B4A]">{money(t.platform_commission)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-3 py-3 text-[#6B7280]">{dateTime(t.created_at)}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => openDetail(t)}
                            className="rounded-xl bg-[#2F6E9E] px-3 py-1.5 text-xs font-black text-white"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <Pagination
                  page={data.page ?? 1}
                  totalPages={data.total_pages ?? 1}
                  count={data.count ?? 0}
                  pageSize={PAGE_SIZE}
                  onChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          )}
        </PageCard>
      </div>

      <DetailModal selected={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}

export default AdminTransactions;
