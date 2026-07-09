import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faCalendarCheck,
  faCreditCard,
  faFileInvoice,
  faTruckFast,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminReservationDetail } from "../../services/adminReservationService";

const ORDER_CLS = {
  en_attente: "bg-amber-100 text-amber-700",
  confirmee: "bg-blue-100 text-blue-700",
  en_preparation: "bg-purple-100 text-purple-700",
  prete: "bg-cyan-100 text-cyan-700",
  livree: "bg-emerald-100 text-emerald-700",
  annulee: "bg-red-100 text-red-700",
  refusee: "bg-rose-100 text-rose-700",
};

const ORDER_LABELS = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  prete: "Prête",
  livree: "Livrée",
  annulee: "Annulée",
  refusee: "Refusée",
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

function parseError(err) {
  const s = err?.response?.status;
  if (s === 401) return "Session expirée.";
  if (s === 403) return "Accès refusé.";
  if (s === 404) return "Réservation introuvable.";
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

function SectionTitle({ icon, label }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <FontAwesomeIcon icon={icon} className="h-4 w-4 text-[#2F6E9E]" />
      <h3 className="text-sm font-bold text-slate-700">{label}</h3>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AdminReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReservationDetail(id);
      setReservation(data);
    } catch (err) {
      console.error("[AdminReservationDetail] Error:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (loading) {
    return (
      <AdminLayout title="Réservation" subtitle="Chargement en cours…">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2F6E9E]/20 border-t-[#2F6E9E]" />
        </div>
      </AdminLayout>
    );
  }

  // ── Erreur ──
  if (error) {
    return (
      <AdminLayout title="Réservation" subtitle="Erreur de chargement">
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

  if (!reservation) return null;

  return (
    <AdminLayout
      title={`Réservation #${reservation.id}`}
      subtitle={`Créée le ${fmtDate(reservation.date_creation)}`}
    >
      <div className="space-y-5">

        {/* ── Barre de navigation ── */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/reservations")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Toutes les réservations
          </button>
          <div className="flex flex-wrap gap-2">
            <Badge value={reservation.statut} labels={ORDER_LABELS} cls={ORDER_CLS} />
            <Badge value={reservation.statut_paiement} labels={PAY_LABELS} cls={PAY_CLS} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Colonne principale (2/3) ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Client */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faUser} label="Informations client" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCard label="Nom" value={reservation.user_name} />
                <InfoCard label="Email" value={reservation.user_email} />
                <InfoCard label="Téléphone" value={reservation.user_phone} />
              </div>
            </section>

            {/* Médicaments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faBoxOpen} label={`Médicaments (${reservation.nb_items ?? reservation.items?.length ?? 0})`} />
              {reservation.items?.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <th className="px-4 py-2.5 text-left">Médicament</th>
                        <th className="px-4 py-2.5 text-right">Qté</th>
                        <th className="px-4 py-2.5 text-right">Prix unitaire</th>
                        <th className="px-4 py-2.5 text-right">Sous-total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reservation.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">
                            {item.medicament_nom || `#${item.medicament}`}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-700">{item.quantite}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{money(item.prix_unitaire)}</td>
                          <td className="px-4 py-2.5 text-right font-black text-[#2F6E9E]">{money(item.sous_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Aucun médicament</p>
              )}
            </section>

          </div>

          {/* ── Colonne latérale (1/3) ── */}
          <div className="space-y-5">

            {/* Pharmacie + Type */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCalendarCheck} label="Détails commande" />
              <div className="space-y-3">
                <InfoCard label="Pharmacie" value={reservation.pharmacie_nom || `#${reservation.pharmacie}`} />
                <InfoCard label="Type" value={reservation.type_reservation === "livraison" ? "Livraison à domicile" : "Retrait en pharmacie"} />
                <InfoCard label="Date création" value={fmtDate(reservation.date_creation)} />
                <InfoCard label="Dernière modif." value={fmtDate(reservation.date_modification)} />
              </div>
            </section>

            {/* Montants */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCreditCard} label="Récapitulatif financier" />
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-500">Médicaments</span>
                  <span className="font-semibold text-slate-700">{money(reservation.montant_medicaments)}</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-500">Frais de livraison</span>
                  <span className="font-semibold text-slate-500">
                    {Number(reservation.frais_livraison) > 0 ? money(reservation.frais_livraison) : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="text-sm font-black text-[#2F6E9E]">{money(reservation.montant_total)}</span>
                </div>
              </div>
            </section>

           

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
