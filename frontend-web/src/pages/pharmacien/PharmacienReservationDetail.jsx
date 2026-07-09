import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faCalendarCheck,
  faCheck,
  faClipboardCheck,
  faCreditCard,
  faImage,
  faLocationDot,
  faRotateRight,
  faStore,
  faTimes,
  faTrashCan,
  faTruck,
  faTruckFast,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import {
  confirmOrder,
  deleteOrder,
  deliveredOrder,
  getPharmacienOrderDetail,
  pickedUpOrder,
  prepareOrder,
  readyOrder,
  rejectOrderPayment,
  startDeliveryOrder,
  validateOrderPayment,
} from "../../services/pharmacienReservationService";

// ── Constantes ────────────────────────────────────────────────────────────────

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

const RES_LABELS = {
  en_attente:      "En attente",
  confirmee:       "Confirmée",
  en_preparation:  "En préparation",
  // Retrait
  prete_a_retirer: "Prête à retirer",
  retiree:         "Retirée",
  // Livraison
  prete:           "Prête",
  en_livraison:    "En livraison",
  livree:          "Livrée",
  refusee:         "Refusée",
  annulee:         "Annulée",
};
const RES_CLS = {
  en_attente:      "bg-amber-100 text-amber-700",
  confirmee:       "bg-blue-100 text-blue-700",
  en_preparation:  "bg-purple-100 text-purple-700",
  prete_a_retirer: "bg-teal-100 text-teal-700",
  retiree:         "bg-emerald-100 text-emerald-700",
  prete:           "bg-cyan-100 text-cyan-700",
  en_livraison:    "bg-indigo-100 text-indigo-700",
  livree:          "bg-emerald-100 text-emerald-700",
  refusee:         "bg-red-100 text-red-700",
  annulee:         "bg-slate-100 text-slate-600",
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
  if (err?.response?.status === 404) return "Commande introuvable.";
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
      <FontAwesomeIcon icon={icon} className="h-4 w-4 text-[#2F6E9E]" />
      <h3 className="text-sm font-bold text-slate-700">{label}</h3>
    </div>
  );
}

function ActionBtn({ label, icon, tone = "primary", loading, disabled, onClick }) {
  const cls = {
    primary: "bg-[#2F6E9E] hover:bg-[#255C84] text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    cyan: "bg-cyan-600 hover:bg-cyan-700 text-white",
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
  }[tone] || "bg-[#2F6E9E] hover:bg-[#255C84] text-white";
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

// ── Page principale ──────────────────────────────────────────────────────────

export default function PharmacienReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPharmacienOrderDetail(id);
      setOrder(data);
    } catch (err) {
      console.error("[PharmacienReservationDetail] Error:", err);
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

  const handleReject = useCallback(async () => {
    const reason = window.prompt("Motif du refus du paiement :");
    if (!reason?.trim()) return;
    setBusyAction("reject");
    setActionError(null);
    setActionSuccess(null);
    try {
      await rejectOrderPayment(id, reason.trim());
      setActionSuccess("Paiement refusé. Le patient a été notifié.");
      await load();
    } catch (err) {
      setActionError(parseError(err));
    } finally {
      setBusyAction(null);
    }
  }, [id, load]);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setBusyAction("deleteOrder");
    setActionError(null);
    try {
      await deleteOrder(id);
      navigate("/pharmacien/reservations", { replace: true });
    } catch (err) {
      setActionError(parseError(err));
      setBusyAction(null);
    }
  }, [id, navigate]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PharmacienLayout title="Réservation" headerSubtitle="Chargement en cours…">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2F6E9E]/20 border-t-[#2F6E9E]" />
        </div>
      </PharmacienLayout>
    );
  }

  if (error) {
    return (
      <PharmacienLayout title="Réservation" headerSubtitle="Erreur">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/pharmacien/reservations")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Retour aux réservations
          </button>
        </div>
      </PharmacienLayout>
    );
  }

  if (!order) return null;

  const isPaymentPending = order.statut === "en_attente_verification";
  const isPaymentValid = order.statut === "valide";
  const resStatus = order.reservation_status;
  const isBusy = busyAction !== null;
  const canDelete =
    resStatus === "annulee" ||
    resStatus === "refusee" ||
    (resStatus === "en_attente" && order.statut !== "valide");

  return (
    <PharmacienLayout
      title={`Réservation #${order.reservation}`}
      headerSubtitle={`Créée le ${fmtDate(order.reservation_created_at || order.date_creation)}`}
    >
      <div className="space-y-5">

        {/* Barre navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/pharmacien/reservations")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Toutes les réservations
          </button>
          <div className="flex flex-wrap gap-2">
            <Badge value={order.statut} labels={PAY_LABELS} cls={PAY_CLS} />
            <Badge value={resStatus} labels={RES_LABELS} cls={RES_CLS} />
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" />
              Rafraîchir
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Colonne principale (2/3) */}
          <div className="space-y-5 lg:col-span-2">

            {/* Client */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faUser} label="Informations client" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoCard label="Nom" value={order.client_name || order.user_name} />
                <InfoCard label="Téléphone" value={order.client_phone} />
                <InfoCard label="Type de commande" value={order.reservation_type === "livraison" ? "Livraison à domicile" : "Retrait en pharmacie"} />
              </div>
            </section>

            {/* Médicaments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faBoxOpen} label={`Médicaments commandés (${(order.items || []).length})`} />
              {(order.items || []).length === 0 ? (
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
                      {(order.items || []).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-[#1C2B4A]">{item.medicament_nom}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{item.quantite}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{money(item.prix_unitaire)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#2F6E9E]">{money(item.sous_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Récapitulatif financier */}
              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
                <FinRow label="Médicaments" value={money(order.montant_medicaments)} />
                <FinRow label="Frais de livraison" value={money(order.frais_livraison)} />
                <div className="border-t border-slate-200 pt-2">
                  <FinRow label="Total à payer" value={money(order.montant_total)} bold />
                </div>
              </div>
            </section>

            {/* Livraison (si applicable) */}
            {order.delivery && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={faLocationDot} label="Adresse de livraison" />
                <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Adresse</p>
                    <p className="mt-1 text-sm font-semibold text-[#1C2B4A]">{order.delivery.address || "—"}</p>
                  </div>
                  {order.delivery.phone && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Téléphone livraison</p>
                      <p className="mt-1 text-sm font-semibold text-[#1C2B4A]">{order.delivery.phone}</p>
                    </div>
                  )}
                  {order.delivery.note && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Note client</p>
                      <p className="mt-1 text-sm text-slate-600">{order.delivery.note}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut livraison</p>
                    <Badge value={order.delivery.status} labels={{ en_attente: "En attente", en_cours: "En cours", livree: "Livrée", annulee: "Annulée" }} cls={{ en_attente: "bg-amber-100 text-amber-700", en_cours: "bg-blue-100 text-blue-700", livree: "bg-emerald-100 text-emerald-700", annulee: "bg-slate-100 text-slate-600" }} />
                  </div>
                  {order.delivery.google_maps_url && (
                    <a
                      href={order.delivery.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#255C84]"
                    >
                      <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5" />
                      Ouvrir la position dans Google Maps
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Colonne latérale (1/3) */}
          <div className="space-y-4">

            {/* Paiement */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle icon={faCreditCard} label="Paiement" />
              <div className="space-y-2.5">
                <InfoCard label="Méthode" value={order.payment_method_name || order.method} />
                <InfoCard label="Référence transaction" value={order.reference_paiement || order.transaction_id || "—"} />
                {order.capture_paiement_url && (
                  <a
                    href={order.capture_paiement_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#2FA6A3]/10 px-4 py-2.5 text-sm font-bold text-[#167769] transition hover:bg-[#2FA6A3]/20"
                  >
                    <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                    Voir la preuve de paiement
                  </a>
                )}
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
              <SectionTitle icon={faCalendarCheck} label="Actions disponibles" />
              <div className="space-y-2">

                {/* Valider paiement */}
                {isPaymentPending && (
                  <ActionBtn
                    label="Valider le paiement"
                    icon={faCheck}
                    tone="success"
                    loading={busyAction === "validateOrderPayment"}
                    disabled={isBusy}
                    onClick={() => runAction(validateOrderPayment, "Paiement validé avec succès.")}
                  />
                )}

                {/* Refuser paiement */}
                {isPaymentPending && (
                  <ActionBtn
                    label="Refuser le paiement"
                    icon={faTimes}
                    tone="danger"
                    loading={busyAction === "reject"}
                    disabled={isBusy}
                    onClick={handleReject}
                  />
                )}

                {/* Confirmer commande */}
                {isPaymentValid && resStatus === "en_attente" && (
                  <ActionBtn
                    label="Confirmer la commande"
                    icon={faClipboardCheck}
                    tone="primary"
                    loading={busyAction === "confirmOrder"}
                    disabled={isBusy}
                    onClick={() => runAction(confirmOrder, "Commande confirmée. Stock réservé.")}
                  />
                )}

                {/* Mettre en préparation */}
                {resStatus === "confirmee" && (
                  <ActionBtn
                    label="Mettre en préparation"
                    icon={faTruckFast}
                    tone="purple"
                    loading={busyAction === "prepareOrder"}
                    disabled={isBusy}
                    onClick={() => runAction(prepareOrder, "Commande en cours de préparation.")}
                  />
                )}

                {/* Prête (type-aware) */}
                {resStatus === "en_preparation" && (
                  order.reservation_type === "retrait"
                    ? (
                      <ActionBtn
                        label="Marquer prête à retirer"
                        icon={faBoxOpen}
                        tone="teal"
                        loading={busyAction === "readyOrder"}
                        disabled={isBusy}
                        onClick={() => runAction(readyOrder, "Commande prête à retirer.")}
                      />
                    ) : (
                      <ActionBtn
                        label="Marquer comme prête"
                        icon={faBoxOpen}
                        tone="cyan"
                        loading={busyAction === "readyOrder"}
                        disabled={isBusy}
                        onClick={() => runAction(readyOrder, "Commande prête pour la livraison.")}
                      />
                    )
                )}

                {/* Retrait: prete_a_retirer → retiree */}
                {resStatus === "prete_a_retirer" && (
                  <ActionBtn
                    label="Confirmer le retrait"
                    icon={faStore}
                    tone="teal"
                    loading={busyAction === "pickedUpOrder"}
                    disabled={isBusy}
                    onClick={() => runAction(pickedUpOrder, "Retrait confirmé. Commande retirée.")}
                  />
                )}

                {/* Livraison: prete → en_livraison */}
                {resStatus === "prete" && order.reservation_type === "livraison" && (
                  <ActionBtn
                    label="Démarrer la livraison"
                    icon={faTruck}
                    tone="indigo"
                    loading={busyAction === "startDeliveryOrder"}
                    disabled={isBusy}
                    onClick={() => runAction(startDeliveryOrder, "Livraison démarrée.")}
                  />
                )}

                {/* Livraison: en_livraison → livree */}
                {resStatus === "en_livraison" && (
                  <ActionBtn
                    label="Marquer comme livrée"
                    icon={faCheck}
                    tone="success"
                    loading={busyAction === "deliveredOrder"}
                    disabled={isBusy}
                    onClick={() => runAction(deliveredOrder, "Commande marquée comme livrée.")}
                  />
                )}

                {/* Aucune action */}
                {!isPaymentPending && !(isPaymentValid && [
                  "en_attente", "confirmee", "en_preparation",
                  "prete_a_retirer", "prete", "en_livraison",
                ].includes(resStatus)) && (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Aucune action disponible pour ce statut.
                  </p>
                )}
              </div>
            </section>

            {/* Liens rapides */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Liens rapides</p>
              <div className="flex flex-col gap-2">
                {order.delivery && (
                  <Link
                    to="/pharmacien/deliveries"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={faTruckFast} className="h-3.5 w-3.5 text-[#2FA6A3]" />
                    Voir les livraisons
                  </Link>
                )}
              </div>
            </section>

            {/* Zone dangereuse */}
            {canDelete && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-400">Zone dangereuse</p>
                <p className="mb-3 text-xs text-red-600">
                  Cette réservation est terminée et peut être supprimée définitivement.
                </p>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                  Supprimer la réservation
                </button>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialog suppression ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
              <FontAwesomeIcon icon={faTrashCan} className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-base font-black text-[#1C2B4A]">
              Supprimer la réservation #{order.reservation}
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Toutes les informations de cette réservation seront supprimées définitivement.
              <br />
              Voulez-vous continuer ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
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
