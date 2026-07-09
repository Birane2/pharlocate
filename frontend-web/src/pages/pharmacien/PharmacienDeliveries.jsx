import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faClock,
  faEye,
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faRotateRight,
  faTimes,
  faTruck,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import Pagination from "../../components/common/Pagination";
import {
  cancelDelivery,
  getDeliveries,
  getDeliveryStats,
  markDeliveryDelivered,
  markDeliveryInProgress,
} from "../../services/pharmacienDeliveryService";

// ── Constantes ────────────────────────────────────────────────────────────────

const DELIVERY_LABELS = {
  en_attente: "En attente",
  en_cours:   "En cours",
  livree:     "Livrée",
  annulee:    "Annulée",
};
const DELIVERY_CLS = {
  en_attente: "bg-amber-100 text-amber-700",
  en_cours:   "bg-blue-100 text-blue-700",
  livree:     "bg-emerald-100 text-emerald-700",
  annulee:    "bg-slate-100 text-slate-600",
};

const PAY_LABELS = {
  en_attente_verification: "Pmt en attente",
  valide:    "Pmt validé",
  refuse:    "Pmt refusé",
  annule:    "Pmt annulé",
  rembourse: "Remboursé",
};
const PAY_CLS = {
  en_attente_verification: "bg-amber-100 text-amber-700",
  valide:    "bg-emerald-100 text-emerald-700",
  refuse:    "bg-red-100 text-red-700",
  annule:    "bg-slate-100 text-slate-600",
  rembourse: "bg-violet-100 text-violet-700",
};

const FILTERS = [
  { value: "all",       label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "en_cours",   label: "En cours" },
  { value: "livree",     label: "Livrées" },
  { value: "annulee",    label: "Annulées" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function money(v) {
  return `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MRU`;
}

function fmtDate(v) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(v));
}

function parseError(err) {
  if (err?.response?.status === 401) return "Session expirée. Reconnectez-vous.";
  if (err?.response?.status === 403) return "Action non autorisée.";
  const d = err?.response?.data;
  if (typeof d?.error === "string") return d.error;
  if (typeof d?.detail === "string") return d.detail;
  return err?.message || "Erreur réseau.";
}

// ── Micro-composants ─────────────────────────────────────────────────────────

function Badge({ value, labels, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${cls[value] || "bg-slate-100 text-slate-600"}`}>
      {labels[value] || value || "—"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded-lg bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

function Toast({ msg, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg text-sm font-bold ${type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
      <span>{msg}</span>
      <button type="button" onClick={onDismiss}><FontAwesomeIcon icon={faTimes} /></button>
    </div>
  );
}

// Affiche uniquement le lien Google Maps — jamais les coordonnées brutes
function MapsButton({ url, compact = false }) {
  if (!url) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"} font-bold`}>
        <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
        GPS indisponible
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-xl bg-[#2FA6A3] text-white transition hover:bg-[#167769] ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"} font-bold`}
    >
      <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
      Google Maps
    </a>
  );
}

function StatCard({ label, value, icon, tone = "blue" }) {
  const tones = {
    blue:  "bg-[#2F6E9E]/10 text-[#2F6E9E]",
    teal:  "bg-[#2FA6A3]/10 text-[#167769]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red:   "bg-red-50 text-red-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xl font-black text-[#1C2B4A]">{value}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function PharmacienDeliveries() {
  const navigate = useNavigate();

  const [deliveries, setDeliveries]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busyId, setBusyId]           = useState(null);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [toast, setToast]             = useState(null);
  const [stats, setStats]             = useState({
    total: 0, pending: 0, inProgress: 0, delivered: 0, cancelled: 0,
  });

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  // ── Chargement ────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      const data = await getDeliveryStats();
      setStats({
        total:      data.total,
        pending:    data.en_attente,
        inProgress: data.en_cours,
        delivered:  data.livree,
        cancelled:  data.annulee,
      });
    } catch {
      // stats failure is non-critical
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeliveries({ page: currentPage, filter, search });
      setDeliveries(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      showToast(parseError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, search, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Reset la page à 1 quand le filtre ou la recherche change
  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const runAction = useCallback(async (deliveryId, action, successMsg) => {
    setBusyId(deliveryId);
    try {
      await action(deliveryId);
      showToast(successMsg);
      await load();
      loadStats();
    } catch (err) {
      showToast(parseError(err), "error");
    } finally {
      setBusyId(null);
    }
  }, [load, loadStats, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PharmacienLayout
      title="Livraisons"
      headerSubtitle="Gérez les commandes à livrer. Position client via Google Maps uniquement."
    >
      <div className="space-y-4">

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={faTruckFast} />
          <StatCard label="En attente" value={stats.pending} icon={faClock} tone="amber" />
          <StatCard label="En cours" value={stats.inProgress} icon={faTruck} tone="blue" />
          <StatCard label="Livrées" value={stats.delivered} icon={faCheck} tone="green" />
          <StatCard label="Annulées" value={stats.cancelled} icon={faBan} tone="red" />
        </section>

        {/* Tableau */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#2FA6A3]">Gestion livraisons</p>
              <h2 className="mt-0.5 text-lg font-black text-[#1C2B4A]">Commandes en livraison</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Rechercher client / adresse…"
                  className="h-9 w-56 rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-[#2FA6A3]"
                />
              </div>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#2F6E9E] transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotateRight} spin={loading} className="h-3.5 w-3.5" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilterChange(f.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === f.value ? "bg-[#2FA6A3] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">N° Livraison</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Adresse</th>
                  <th className="px-4 py-3">Frais / Distance</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  : deliveries.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-sm font-semibold text-slate-400">
                          Aucune livraison dans cette catégorie.
                        </td>
                      </tr>
                    )
                    : deliveries.map(delivery => {
                      const isBusy = busyId === delivery.id;
                      const isFinal = ["livree", "annulee"].includes(delivery.delivery_status);
                      return (
                        <tr key={delivery.id} className="border-t border-slate-100 text-sm transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-black text-[#2FA6A3]">#{delivery.id}</p>
                            <p className="text-[11px] text-slate-400">Rés. #{delivery.reservation_id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#1C2B4A]">{delivery.client_name}</p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-400">
                              <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                              {delivery.client_phone || "—"}
                            </p>
                          </td>
                          <td className="max-w-[200px] px-4 py-3">
                            <p className="line-clamp-2 text-xs text-slate-600">
                              <FontAwesomeIcon icon={faLocationDot} className="mr-1 text-[#2FA6A3]" />
                              {delivery.address || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <p className="font-bold text-[#1C2B4A]">{money(delivery.frais_livraison)}</p>
                            {delivery.distance_km && (
                              <p className="text-slate-400">{Number(delivery.distance_km).toFixed(1)} km</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge value={delivery.payment_status} labels={PAY_LABELS} cls={PAY_CLS} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge value={delivery.delivery_status} labels={DELIVERY_LABELS} cls={DELIVERY_CLS} />
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-400">
                            {fmtDate(delivery.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Voir le détail"
                                onClick={() => navigate(`/pharmacien/deliveries/${delivery.id}`)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-[#2F6E9E] hover:text-white"
                              >
                                <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                              </button>
                              <MapsButton url={delivery.google_maps_url} compact />
                              {!isFinal && delivery.delivery_status === "en_attente" && (
                                <button
                                  type="button"
                                  title="Marquer en cours"
                                  disabled={isBusy}
                                  onClick={() => runAction(delivery.id, markDeliveryInProgress, "Livraison marquée en cours.")}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-blue-100 px-2.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-200 disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faTruck} className="h-3 w-3" />
                                  En cours
                                </button>
                              )}
                              {!isFinal && (
                                <button
                                  type="button"
                                  title="Marquer comme livrée"
                                  disabled={isBusy}
                                  onClick={() => runAction(delivery.id, markDeliveryDelivered, "Livraison marquée comme livrée.")}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-100 px-2.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                                  Livrée
                                </button>
                              )}
                              {!isFinal && (
                                <button
                                  type="button"
                                  title="Annuler la livraison"
                                  disabled={isBusy}
                                  onClick={() => runAction(delivery.id, cancelDelivery, "Livraison annulée.")}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl bg-red-100 px-2.5 text-[11px] font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faBan} className="h-3 w-3" />
                                  Annuler
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </section>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </PharmacienLayout>
  );
}
