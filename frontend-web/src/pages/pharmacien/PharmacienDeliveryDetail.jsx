import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBan,
  faBoxOpen,
  faCalendarCheck,
  faCheck,
  faCreditCard,
  faLocationDot,
  faRotateRight,
  faTruck,
  faTruckFast,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import {
  cancelDelivery,
  getPharmacienDeliveryDetail,
  markDeliveryDelivered,
  markDeliveryInProgress,
} from "../../services/pharmacienDeliveryService";

// ── Constantes ────────────────────────────────────────────────────────────────

const DELIVERY_LABELS = {
  en_attente: "En attente",
  en_cours: "En cours",
  livree: "Livrée",
  annulee: "Annulée",
};
const DELIVERY_CLS = {
  en_attente: "bg-amber-100 text-amber-700",
  en_cours: "bg-blue-100 text-blue-700",
  livree: "bg-emerald-100 text-emerald-700",
  annulee: "bg-slate-100 text-slate-600",
};
const PAY_LABELS = {
  en_attente_verification: "En attente de vérification",
  valide: "Paiement validé",
  refuse: "Paiement refusé",
  annule: "Paiement annulé",
  rembourse: "Remboursé",
};
const PAY_CLS = {
  en_attente_verification: "bg-amber-100 text-amber-700",
  valide: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
  annule: "bg-slate-100 text-slate-600",
  rembourse: "bg-violet-100 text-violet-700",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  if (err?.response?.status === 401) return "Session expirée.";
  if (err?.response?.status === 403) return "Action non autorisée.";
  if (err?.response?.status === 404) return "Livraison introuvable.";
  const d = err?.response?.data;
  if (typeof d?.error === "string") return d.error;
  if (typeof d?.detail === "string") return d.detail;
  return err?.message || "Erreur réseau.";
}

// ── Micro-composants ─────────────────────────────────────────────────────────

function Badge({ value, labels, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${cls[value] || "bg-slate-100 text-slate-600"}`}>
      {labels[value] || value || "—"}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#1C2B4A]">{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <FontAwesomeIcon icon={icon} className="h-4 w-4 text-[#2FA6A3]" />
      <h3 className="text-sm font-bold text-slate-700">{label}</h3>
    </div>
  );
}

function ActionBtn({ label, icon, tone = "primary", loading, disabled, onClick }) {
  const cls = {
    primary: "bg-[#2F6E9E] hover:bg-[#255C84] text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
  }[tone] || "bg-[#2FA6A3] hover:bg-[#167769] text-white";
  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      {loading ? "Traitement…" : label}
    </button>
  );
}

// ── Bouton Google Maps (URL générée côté backend) ─────────────────────────────

function MapsButton({ url }) {
  if (!url) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed">
        <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
        GPS indisponible
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA6A3] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#167769]"
    >
      <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
      Ouvrir dans Google Maps
    </a>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function PharmacienDeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPharmacienDeliveryDetail(id);
      setDelivery(data);
    } catch (err) {
      console.error("[PharmacienDeliveryDetail] Error:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const runAction = useCallback(async (action, successMsg) => {
    setBusyAction(action.name);
    setActionError(null);
    setActionSuccess(null);
    try {
      await action(id);
      setActionSuccess(successMsg);
      await load();
    } catch (err) {
      setActionError(parseError(err));
    } finally {
      setBusyAction(null);
    }
  }, [id, load]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PharmacienLayout title="Livraison" headerSubtitle="Chargement en cours…">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2FA6A3]/20 border-t-[#2FA6A3]" />
        </div>
      </PharmacienLayout>
    );
  }

  if (error) {
    return (
      <PharmacienLayout title="Livraison" headerSubtitle="Erreur">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/pharmacien/deliveries")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Retour aux livraisons
          </button>
        </div>
      </PharmacienLayout>
    );
  }

  if (!delivery) return null;

  const isFinal = ["livree", "annulee"].includes(delivery.delivery_status);
  const isBusy = busyAction !== null;

  return (
    <PharmacienLayout
      title={`Livraison #${delivery.id}`}
      headerSubtitle={`Réservation #${delivery.reservation_id} — Créée le ${fmtDate(delivery.created_at)}`}
    >
      <div className="space-y-5">

        {/* Barre navigation + bouton Maps */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/pharmacien/deliveries")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              Toutes les livraisons
            </button>
            <Badge value={delivery.delivery_status} labels={DELIVERY_LABELS} cls={DELIVERY_CLS} />
            <Badge value={delivery.payment_status} labels={PAY_LABELS} cls={PAY_CLS} />
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" />
              Rafraîchir
            </button>
          </div>
          {/* Bouton Maps en haut de page pour accès rapide */}
          {delivery.google_maps_url && (
            <a
              href={delivery.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#167769]"
            >
              <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
              Ouvrir dans Google Maps
            </a>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Colonne principale (2/3) */}
          <div className="space-y-5 lg:col-span-2">

            {/* Client */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faUser} label="Informations client" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Nom du client" value={delivery.client_name} />
                <InfoCard label="Téléphone" value={delivery.client_phone} />
              </div>
            </section>

            {/* Adresse livraison */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faLocationDot} label="Adresse de livraison" />
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Adresse</p>
                  <p className="mt-1 text-sm font-semibold text-[#1C2B4A]">{delivery.address || "—"}</p>
                </div>
                {delivery.note && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Note client</p>
                    <p className="mt-1 text-sm text-slate-600">{delivery.note}</p>
                  </div>
                )}
                <MapsButton url={delivery.google_maps_url} />
              </div>
            </section>

            {/* Médicaments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faBoxOpen} label={`Médicaments commandés (${(delivery.medicines || []).length})`} />
              {(delivery.medicines || []).length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">Aucun médicament.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <th className="px-4 py-2.5 text-left">Médicament</th>
                        <th className="px-4 py-2.5 text-right">Qté</th>
                        <th className="px-4 py-2.5 text-right">Prix unitaire</th>
                        <th className="px-4 py-2.5 text-right">Sous-total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(delivery.medicines || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-[#1C2B4A]">{item.name}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{money(item.unit_price)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#2FA6A3]">{money(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* ── Colonne latérale (1/3) */}
          <div className="space-y-4">

            {/* Financier */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCreditCard} label="Financier" />
              <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                {delivery.distance_km && (
                  <FinRow label="Distance" value={`${Number(delivery.distance_km).toFixed(1)} km`} />
                )}
                {delivery.tarif_par_km && (
                  <FinRow label="Tarif / km" value={money(delivery.tarif_par_km)} />
                )}
                <FinRow label="Frais de livraison" value={money(delivery.frais_livraison)} />
                <div className="border-t border-slate-200 pt-2">
                  <FinRow label="Total commande" value={money(delivery.total_amount)} bold />
                </div>
              </div>
            </section>

            {/* Calendrier */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCalendarCheck} label="Calendrier" />
              <div className="space-y-3">
                <InfoCard label="Date de création" value={fmtDate(delivery.created_at)} />
                <InfoCard label="Livraison estimée" value={fmtDate(delivery.date_livraison_estimee)} />
                <InfoCard label="Livraison réelle" value={fmtDate(delivery.date_livraison_reelle)} />
              </div>
            </section>

            {/* Alertes actions */}
            {actionSuccess && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {actionError}
              </div>
            )}

            {/* Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faTruckFast} label="Actions" />
              <div className="space-y-2">
                {/* En cours */}
                {!isFinal && delivery.delivery_status === "en_attente" && (
                  <ActionBtn
                    label="Marquer en cours"
                    icon={faTruck}
                    tone="blue"
                    loading={busyAction === "markDeliveryInProgress"}
                    disabled={isBusy}
                    onClick={() => runAction(markDeliveryInProgress, "Livraison marquée en cours.")}
                  />
                )}
                {/* Livrée */}
                {!isFinal && (
                  <ActionBtn
                    label="Marquer comme livrée"
                    icon={faCheck}
                    tone="success"
                    loading={busyAction === "markDeliveryDelivered"}
                    disabled={isBusy}
                    onClick={() => runAction(markDeliveryDelivered, "Livraison marquée comme livrée. Client notifié.")}
                  />
                )}
                {/* Annuler */}
                {!isFinal && (
                  <ActionBtn
                    label="Annuler la livraison"
                    icon={faBan}
                    tone="danger"
                    loading={busyAction === "cancelDelivery"}
                    disabled={isBusy}
                    onClick={() => runAction(cancelDelivery, "Livraison annulée.")}
                  />
                )}
                {isFinal && (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Cette livraison est terminée.
                  </p>
                )}
              </div>
            </section>

            {/* Liens rapides */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Liens rapides</p>
              <div className="flex flex-col gap-2">
                <Link
                  to={
                    delivery.payment_id
                      ? `/pharmacien/reservations/${delivery.payment_id}`
                      : "/pharmacien/reservations"
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faBoxOpen} className="h-3.5 w-3.5 text-[#2F6E9E]" />
                  Voir la réservation #{delivery.reservation_id}
                </Link>
                <Link
                  to="/pharmacien/deliveries"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faTruckFast} className="h-3.5 w-3.5 text-[#2FA6A3]" />
                  Toutes les livraisons
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PharmacienLayout>
  );
}

function FinRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? "font-black text-[#1C2B4A]" : "font-semibold text-slate-700"}`}>{value}</span>
    </div>
  );
}
