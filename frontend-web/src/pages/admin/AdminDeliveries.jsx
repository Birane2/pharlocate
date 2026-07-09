import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faEye,
  faLocationDot,
  faMagnifyingGlass,
  faRotateRight,
  faTruckFast,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDeliveries } from "../../services/adminDeliveryService";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUT_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "en_cours", label: "En cours" },
  { value: "livree", label: "Livrée" },
  { value: "annulee", label: "Annulée" },
];

const DELIVERY_CLS = {
  en_attente: "bg-amber-100 text-amber-700",
  en_cours: "bg-blue-100 text-blue-700",
  livree: "bg-emerald-100 text-emerald-700",
  annulee: "bg-red-100 text-red-700",
};

const DELIVERY_LABELS = {
  en_attente: "En attente",
  en_cours: "En cours",
  livree: "Livrée",
  annulee: "Annulée",
};

const PAY_CLS = {
  en_attente_verification: "bg-amber-100 text-amber-700",
  valide: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
  annule: "bg-gray-100 text-gray-600",
  rembourse: "bg-violet-100 text-violet-700",
};

const PAY_LABELS = {
  en_attente_verification: "Paiement en attente",
  valide: "Payé",
  refuse: "Refusé",
  annule: "Annulé",
  rembourse: "Remboursé",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(v) {
  return `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MRU`;
}

function fmtDate(v) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(v));
}

function fmtKm(v) {
  if (!v || Number(v) === 0) return "—";
  return `${Number(v).toFixed(1)} km`;
}

function parseError(err) {
  const s = err?.response?.status;
  if (s === 401) return "Session expirée. Veuillez vous reconnecter.";
  if (s === 403) return "Accès refusé. Cette page est réservée aux administrateurs.";
  if (s === 404) return "Ressource introuvable.";
  return err?.response?.data?.detail || err?.response?.data?.error || err?.message || "Erreur réseau.";
}

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Badge({ value, labels, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${cls[value] || "bg-gray-100 text-gray-600"}`}>
      {labels[value] || value || "—"}
    </span>
  );
}

function GoogleMapsButton({ url, address }) {
  if (!url) return <span className="text-[10px] text-slate-300">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={address || "Ouvrir dans Google Maps"}
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700"
      onClick={e => e.stopPropagation()}
    >
      <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
      Maps
    </a>
  );
}

function Skeleton({ rows = 10 }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {Array.from({ length: 10 }).map((__, j) => (
                <td key={j} className="px-3 py-3">
                  <div className={`h-4 rounded bg-slate-100 ${j === 2 ? "w-24" : j === 3 ? "w-20" : "w-12"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, count, pageSize, onPage }) {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        <span className="font-bold text-slate-700">{start}–{end}</span> sur <span className="font-bold text-slate-700">{count}</span> livraisons
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
        </button>
        <span className="px-2 text-xs font-bold text-slate-700">{page} / {total}</span>
        <button
          type="button"
          disabled={page >= total}
          onClick={() => onPage(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

const INIT_FILTERS = { statut: "", search: "", start_date: "", end_date: "" };

export default function AdminDeliveries() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const p = { page, page_size: PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [page, filters]);

  const fetchData = useCallback(async (queryParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDeliveries(queryParams);
      setResults(data.results);
      setCount(data.count);
    } catch (err) {
      console.error("[AdminDeliveries] fetch error:", err);
      setError(parseError(err));
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(params);
  }, [fetchData, params]);

  function setFilter(key, value) {
    setPage(1);
    setFilters(f => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setPage(1);
    setFilters(INIT_FILTERS);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <AdminLayout
      title="Livraisons"
      subtitle="Supervision globale de toutes les livraisons à domicile."
    >
      <div className="space-y-4">

        {/* ── Filtres ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Filtres</p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                Réinitialiser
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilter("search", e.target.value)}
                placeholder="Nom, email, pharmacie, adresse…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/10"
              />
            </div>
            <select
              value={filters.statut}
              onChange={e => setFilter("statut", e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#2FA6A3]"
            >
              {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.start_date}
                onChange={e => setFilter("start_date", e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#2FA6A3]"
                title="Date début"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={e => setFilter("end_date", e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#2FA6A3]"
                title="Date fin"
              />
            </div>
          </div>
        </section>

        {/* ── Tableau ── */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2FA6A3]/10">
                <FontAwesomeIcon icon={faTruckFast} className="h-4 w-4 text-[#2FA6A3]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Toutes les livraisons</h2>
                {!loading && (
                  <p className="text-[11px] text-slate-400">{count} livraison{count !== 1 ? "s" : ""} au total</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchData(params)}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40"
              title="Actualiser"
            >
              <FontAwesomeIcon icon={faRotateRight} className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>
          )}

          {/* Contenu */}
          {loading ? (
            <Skeleton rows={8} />
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FontAwesomeIcon icon={faTruckFast} className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Aucune livraison trouvée</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {hasFilters ? "Aucun résultat pour ces filtres." : "Il n'y a encore aucune livraison."}
                </p>
              </div>
              {hasFilters && (
                <button type="button" onClick={resetFilters}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <th className="whitespace-nowrap px-4 py-3 text-left">N°</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Réservation</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Client</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Pharmacie</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Adresse</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">Distance</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">Frais</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Paiement</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Statut</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">Date</th>
                      <th className="whitespace-nowrap px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map(row => (
                      <tr key={row.id} className="group transition hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-black text-[#1C2B4A]">#{row.id}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/reservations/${row.reservation}`)}
                            className="font-bold text-[#2F6E9E] underline-offset-2 hover:underline"
                          >
                            #{row.reservation}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{row.user_name || `#${row.user}`}</p>
                          {row.telephone && (
                            <p className="mt-0.5 text-[10px] text-slate-400">{row.telephone}</p>
                          )}
                        </td>
                        <td className="max-w-[130px] px-4 py-3">
                          <p className="truncate font-medium text-slate-700">
                            {row.pharmacy_name || `#${row.pharmacy}`}
                          </p>
                        </td>
                        <td className="max-w-[150px] px-4 py-3">
                          <p className="truncate text-slate-500" title={row.adresse_livraison}>
                            {row.adresse_livraison || "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-500">
                          {fmtKm(row.distance_km)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-black text-[#2FA6A3]">
                          {money(row.frais_livraison)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge value={row.reservation_statut_paiement} labels={PAY_LABELS} cls={PAY_CLS} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge value={row.statut} labels={DELIVERY_LABELS} cls={DELIVERY_CLS} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                          {fmtDate(row.date_creation)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/deliveries/${row.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#2FA6A3] px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#167769]"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                              Détail
                            </button>
                            <GoogleMapsButton url={row.google_maps_url} address={row.adresse_livraison} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} count={count} pageSize={PAGE_SIZE} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
