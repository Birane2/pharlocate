import { useEffect, useMemo, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { EmptyState, PageCard, StatCard } from "../finance/FinanceUI";
import { dateTime, money } from "../finance/financeFormat";
import {
  exportPharmacistTransactionsExcel,
  exportPharmacistTransactionsPDF,
  exportPharmacistTransactionsWord,
} from "../../services/financeService";
import { getPharmacienTransactions } from "../../services/financeService";

const TYPE_STYLE = {
  paiement: "bg-blue-50 text-blue-700",
  commission: "bg-purple-50 text-purple-700",
  remboursement: "bg-teal-50 text-teal-700",
  ajustement: "bg-amber-50 text-amber-700",
  abonnement: "bg-emerald-50 text-emerald-700",
};

function TypeBadge({ type, label }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${TYPE_STYLE[type] || "bg-slate-100 text-slate-600"}`}>
      {label || type || "-"}
    </span>
  );
}

function ExportButtons({ params, disabled }) {
  const [loading, setLoading] = useState(null);

  const handle = async (fn, key) => {
    setLoading(key);
    try {
      await fn(params);
    } catch {
      // silently fail — browser will show nothing downloaded
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportPharmacistTransactionsPDF, "pdf")}
        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 disabled:opacity-50"
      >
        {loading === "pdf" ? "..." : "PDF"}
      </button>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportPharmacistTransactionsExcel, "excel")}
        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 disabled:opacity-50"
      >
        {loading === "excel" ? "..." : "Excel"}
      </button>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => handle(exportPharmacistTransactionsWord, "word")}
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

const PAGE_SIZE = 10;

function FinanceTransactions() {
  const [data, setData] = useState({ count: 0, total_pages: 1, page: 1, results: [] });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({ page: currentPage, page_size: PAGE_SIZE, ...(search.trim() ? { search: search.trim() } : {}) }),
    [currentPage, search]
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    getPharmacienTransactions(params)
      .then((d) => { if (!ignore) setData(d || {}); })
      .catch((err) => {
        if (!ignore)
          setError(err.response?.data?.error || err.response?.data?.detail || "Impossible de charger les transactions.");
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [params]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const transactions = data.results || [];

  return (
    <PharmacienLayout title="Transactions" headerSubtitle="Historique financier de votre pharmacie">
      <div className="space-y-4">
        {/* Summary cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total" value={data.count ?? 0} hint="Transactions enregistrées" />
          <StatCard label="Page affichée" value={transactions.length} hint={`Page ${data.page ?? 1} / ${data.total_pages ?? 1}`} />
          <StatCard
            label="Total brut (page)"
            value={money(transactions.reduce((s, t) => s + Number(t.montant_brut || 0), 0))}
            hint="Avant commissions"
          />
          <StatCard
            label="Net pharmacie (page)"
            value={money(transactions.reduce((s, t) => s + Number(t.montant_pharmacie || 0), 0))}
            hint="Après commissions"
          />
        </section>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm">
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par référence..."
            className="w-full max-w-xs rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Télécharger :</span>
            <ExportButtons params={params} disabled={loading} />
          </div>
        </div>

        {/* Table */}
        <PageCard title="Historique des transactions">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState label="Aucune transaction trouvée." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E2E8F2] text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#6B7280]">
                    <tr>
                      <th className="px-3 py-3">Référence</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Client</th>
                      <th className="px-3 py-3">Méthode</th>
                      <th className="px-3 py-3">Montant brut</th>
                      <th className="px-3 py-3">Commission</th>
                      <th className="px-3 py-3">Net</th>
                      <th className="px-3 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F2]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="align-top hover:bg-[#F8FAFC]">
                        <td className="px-3 py-3">
                          <p className="font-black text-[#1C2B4A]">{t.reference_transaction}</p>
                          {t.reservation_id && (
                            <p className="text-xs font-semibold text-[#6B7280]">Rés. #{t.reservation_id}</p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <TypeBadge type={t.type_transaction} label={t.type_label} />
                        </td>
                        <td className="px-3 py-3 text-[#6B7280]">{t.user_name || "-"}</td>
                        <td className="px-3 py-3 text-[#6B7280]">{t.payment_method || "-"}</td>
                        <td className="px-3 py-3 font-black text-[#2F6E9E]">{money(t.montant_brut)}</td>
                        <td className="px-3 py-3 font-semibold text-red-600">{money(t.commission)}</td>
                        <td className="px-3 py-3 font-black text-emerald-700">{money(t.montant_pharmacie)}</td>
                        <td className="px-3 py-3 text-[#6B7280]">{dateTime(t.date_creation)}</td>
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
    </PharmacienLayout>
  );
}

export default FinanceTransactions;
