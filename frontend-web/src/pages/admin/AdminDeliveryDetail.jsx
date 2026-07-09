import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarCheck,
  faCreditCard,
  faFileInvoice,
  faLocationDot,
  faTruckFast,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminDeliveryDetail } from "../../services/adminDeliveryService";

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
  en_attente_verification: "En attente de vérification",
  valide: "Paiement validé",
  refuse: "Paiement refusé",
  annule: "Paiement annulé",
  rembourse: "Remboursé",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(v) {
  return `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} MRU`;
}

function fmtDate(v) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(v));
}

function fmtKm(v) {
  if (!v || Number(v) === 0) return "—";
  return `${Number(v).toFixed(1)} km`;
}

function parseError(err) {
  const s = err?.response?.status;
  if (s === 401) return "Session expirée.";
  if (s === 403) return "Accès refusé.";
  if (s === 404) return "Livraison introuvable.";
  return err?.response?.data?.detail || err?.message || "Erreur réseau.";
}

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Badge({ value, labels, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls[value] || "bg-gray-100 text-gray-600"}`}>
      {labels[value] || value || "—"}
    </span>
  );
}

function InfoCard({ label, value, span = 1 }) {
  return (
    <div className={`rounded-xl bg-slate-50 p-3.5 ${span === 2 ? "sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ icon, label, color = "text-[#2FA6A3]" }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${color}`} />
      <h3 className="text-sm font-bold text-slate-700">{label}</h3>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AdminDeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDeliveryDetail(id);
      setDelivery(data);
    } catch (err) {
      console.error("[AdminDeliveryDetail] Error:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (loading) {
    return (
      <AdminLayout title="Livraison" subtitle="Chargement en cours…">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2FA6A3]/20 border-t-[#2FA6A3]" />
        </div>
      </AdminLayout>
    );
  }

  // ── Erreur ──
  if (error) {
    return (
      <AdminLayout title="Livraison" subtitle="Erreur de chargement">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button type="button" onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Retour
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!delivery) return null;

  return (
    <AdminLayout
      title={`Livraison #${delivery.id}`}
      subtitle={`Réservation #${delivery.reservation} · ${fmtDate(delivery.date_creation)}`}
    >
      <div className="space-y-5">

        {/* ── Barre de navigation ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/deliveries")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Toutes les livraisons
          </button>
          <div className="flex flex-wrap gap-2">
            <Badge value={delivery.statut} labels={DELIVERY_LABELS} cls={DELIVERY_CLS} />
            <Badge value={delivery.reservation_statut_paiement} labels={PAY_LABELS} cls={PAY_CLS} />
          </div>
          {delivery.google_maps_url && (
            <a
              href={delivery.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
              Ouvrir dans Google Maps
            </a>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Colonne principale (2/3) ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Client */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faUser} label="Client" color="text-[#2FA6A3]" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCard label="Nom" value={delivery.user_name} />
                <InfoCard label="Email" value={delivery.user_email} />
                <InfoCard label="Tél. livraison" value={delivery.telephone || delivery.user_phone} />
              </div>
            </section>

            {/* Adresse */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faLocationDot} label="Adresse de livraison" color="text-emerald-600" />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label="Adresse complète" value={delivery.adresse_livraison} span={2} />
                <InfoCard label="Note livraison" value={delivery.note} span={2} />
              </div>
              {delivery.google_maps_url && (
                <a
                  href={delivery.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                  Ouvrir dans Google Maps
                </a>
              )}
            </section>

            {/* Dates */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faTruckFast} label="Calendrier de livraison" color="text-[#2FA6A3]" />
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard label="Créée le" value={fmtDate(delivery.date_creation)} />
                <InfoCard label="Livraison estimée" value={fmtDate(delivery.date_livraison_estimee)} />
                <InfoCard label="Livraison réelle" value={fmtDate(delivery.date_livraison_reelle)} />
              </div>
            </section>

          </div>

          {/* ── Colonne latérale (1/3) ── */}
          <div className="space-y-5">

            {/* Pharmacie */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCalendarCheck} label="Pharmacie" />
              <InfoCard label="Pharmacie" value={delivery.pharmacy_name || `#${delivery.pharmacy}`} />
            </section>

            {/* Financier */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCreditCard} label="Détails financiers" />
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-500">Distance</span>
                  <span className="font-semibold text-slate-700">{fmtKm(delivery.distance_km)}</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-500">Tarif / km</span>
                  <span className="font-semibold text-slate-700">
                    {Number(delivery.tarif_par_km) > 0 ? `${Number(delivery.tarif_par_km).toFixed(0)} MRU` : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-500">Frais livraison</span>
                  <span className="font-bold text-[#2FA6A3]">{money(delivery.frais_livraison)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm font-bold text-slate-700">Total réservation</span>
                  <span className="text-sm font-black text-[#1C2B4A]">{money(delivery.reservation_montant_total)}</span>
                </div>
              </div>
            </section>

            {/* Liens rapides */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Liens rapides</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/reservations/${delivery.reservation}`)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faCalendarCheck} className="h-3.5 w-3.5 text-[#2F6E9E]" />
                  Voir la réservation #{delivery.reservation}
                </button>
                <Link
                  to="/admin/payments"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faCreditCard} className="h-3.5 w-3.5 text-[#2F6E9E]" />
                  Voir le paiement
                </Link>
                <Link
                  to="/admin/finance/commission-invoices"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faFileInvoice} className="h-3.5 w-3.5 text-[#2F6E9E]" />
                  Voir les factures
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
