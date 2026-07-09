import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faBoxOpen,
  faCheck,
  faClipboardCheck,
  faClock,
  faEye,
  faGear,
  faImage,
  faMagnifyingGlass,
  faMapLocationDot,
  faMotorcycle,
  faPhone,
  faRotateRight,
  faStore,
  faTimes,
  faTrashCan,
  faTruck,
  faTruckFast,
  faUser,
  faXmark,
  faReceipt,
  faListCheck,
  faArrowUpRightFromSquare,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import Pagination from "../../components/common/Pagination";
import {
  confirmOrder,
  deleteOrder,
  deliveredOrder,
  getReservations,
  getReservationStats,
  pickedUpOrder,
  prepareOrder,
  readyOrder,
  rejectOrderPayment,
  startDeliveryOrder,
  validateOrderPayment,
} from "../../services/pharmacienReservationService";

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

// ── Design tokens ─────────────────────────────────────────────────────────────

const PAY = {
  en_attente_verification: { label: "En attente", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  valide:                  { label: "Validé",     cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  refuse:                  { label: "Refusé",     cls: "bg-red-50 text-red-700 border border-red-200" },
  annule:                  { label: "Annulé",     cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  rembourse:               { label: "Remboursé",  cls: "bg-violet-50 text-violet-700 border border-violet-200" },
};

const RES = {
  en_attente:      { label: "En attente",        cls: "bg-orange-50 text-orange-700 border border-orange-200" },
  confirmee:       { label: "Confirmée",          cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  en_preparation:  { label: "En préparation",     cls: "bg-purple-50 text-purple-700 border border-purple-200" },
  // Retrait
  prete_a_retirer: { label: "Prête à retirer",    cls: "bg-teal-50 text-teal-700 border border-teal-200" },
  retiree:         { label: "Retirée",            cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  // Livraison
  prete:           { label: "Prête",              cls: "bg-cyan-50 text-cyan-700 border border-cyan-200" },
  en_livraison:    { label: "En livraison",        cls: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  livree:          { label: "Livrée",             cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  refusee:         { label: "Refusée",            cls: "bg-red-50 text-red-700 border border-red-200" },
  annulee:         { label: "Annulée",            cls: "bg-slate-100 text-slate-500 border border-slate-200" },
};

// id "all" → no filter; "payment_pending" → statut payment; others → reservation statut
const STAT_CARDS = [
  { id: "all",             label: "Total",              icon: faListCheck,    accent: "#2F6E9E" },
  { id: "payment_pending", label: "Pmt en attente",     icon: faClock,        accent: "#D97706" },
  { id: "en_attente",      label: "En attente",         icon: faClock,        accent: "#EA580C" },
  { id: "confirmee",       label: "Confirmées",         icon: faCheck,        accent: "#2FA6A3" },
  { id: "en_preparation",  label: "En préparation",     icon: faGear,         accent: "#7C3AED" },
  { id: "prete_a_retirer", label: "Prêtes à retirer",   icon: faStore,        accent: "#0D9488" },
  { id: "prete",           label: "Prêtes livraison",   icon: faBoxOpen,      accent: "#0891B2" },
  { id: "en_livraison",    label: "En livraison",        icon: faTruck,        accent: "#1D4ED8" },
  { id: "retiree",         label: "Retirées",           icon: faCircleCheck,  accent: "#059669" },
  { id: "livree",          label: "Livrées",            icon: faTruckFast,    accent: "#059669" },
  { id: "annulee",         label: "Annulées",           icon: faBan,          accent: "#64748B" },
];

// ── Micro-composants ─────────────────────────────────────────────────────────

function PayBadge({ value }) {
  const cfg = PAY[value] || { label: value || "—", cls: "bg-slate-100 text-slate-500 border border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ResBadge({ value }) {
  const cfg = RES[value] || { label: value || "—", cls: "bg-slate-100 text-slate-500 border border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const isDelivery = type === "livraison";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      isDelivery
        ? "bg-[#2FA6A3]/10 text-[#167769] border border-[#2FA6A3]/30"
        : "bg-slate-100 text-slate-600 border border-slate-200"
    }`}>
      <FontAwesomeIcon icon={isDelivery ? faMotorcycle : faBoxOpen} className="h-2.5 w-2.5" />
      {isDelivery ? "Livraison" : "Retrait"}
    </span>
  );
}

function Toast({ msg, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-xl
        ${type === "error" ? "bg-red-600 text-white" : "bg-[#059669] text-white"}`}
    >
      <span className="flex-1">{msg}</span>
      <button type="button" onClick={onDismiss}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ card, count, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={isActive ? { borderColor: card.accent, backgroundColor: `${card.accent}10` } : {}}
      className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all
        ${isActive ? "shadow-md" : "border-slate-200 bg-white hover:shadow-sm hover:border-slate-300"}`}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${card.accent}18` }}
      >
        <FontAwesomeIcon icon={card.icon} className="h-3 w-3" style={{ color: card.accent }} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {card.label}
        </p>
        <p className="text-lg font-black text-[#1C2B4A]">
          {count !== null && count !== undefined ? count : "—"}
        </p>
      </div>
    </button>
  );
}

// ── Squelettes ───────────────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 7 }, (_, i) => (
    <tr key={i} className="border-t border-slate-100">
      {Array.from({ length: 8 }, (__, j) => (
        <td key={j} className="px-3 py-3">
          <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  ));
}

function CardSkeleton() {
  return Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
  ));
}

// ── Ligne de tableau (desktop/tablette) ──────────────────────────────────────

function TableRow({ order, isBusy, onView, onOpenPage, onValidate, onReject, onConfirm, onPrepare, onReady, onPickedUp, onStartDelivery, onDeliver, onDelete, canDelete }) {
  return (
    <tr className="border-t border-slate-100 text-sm transition-colors hover:bg-[#F8FAFC]">

      {/* N° Réservation */}
      <td className="px-3 py-2.5">
        <p className="font-black text-[#2F6E9E]">#{order.reservation}</p>
        <p className="text-[10px] text-slate-400">{fmtDate(order.reservation_created_at)}</p>
      </td>

      {/* Client */}
      <td className="px-3 py-2.5">
        <p className="font-semibold text-[#1C2B4A]">{order.client_name || `Client #${order.user}`}</p>
        <p className="text-[10px] text-slate-400">{order.client_phone || "—"}</p>
      </td>

      {/* Médicaments — masqué sur tablette */}
      <td className="hidden lg:table-cell max-w-[160px] px-3 py-2.5">
        <p className="truncate text-xs text-slate-600">
          {(order.items || []).length === 0
            ? "—"
            : (order.items || [])
                .slice(0, 2)
                .map(i => `${i.medicament_nom} ×${i.quantite}`)
                .join(", ") +
              ((order.items || []).length > 2 ? ` +${(order.items || []).length - 2}` : "")}
        </p>
      </td>

      {/* Montant */}
      <td className="px-3 py-2.5 text-right font-black text-[#1C2B4A]">
        {money(order.montant_total)}
      </td>

      {/* Paiement */}
      <td className="px-3 py-2.5">
        <PayBadge value={order.statut} />
      </td>

      {/* Type */}
      <td className="hidden md:table-cell px-3 py-2.5">
        <TypeBadge type={order.reservation_type} />
      </td>

      {/* Statut réservation */}
      <td className="px-3 py-2.5">
        <ResBadge value={order.reservation_status} />
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          {/* Voir drawer */}
          <ActionBtn
            icon={faEye}
            title="Voir le détail"
            onClick={onView}
            color="blue"
            disabled={isBusy}
          />
          {/* Ouvrir page complète */}
          <ActionBtn
            icon={faArrowUpRightFromSquare}
            title="Ouvrir page complète"
            onClick={onOpenPage}
            color="blue"
            disabled={isBusy}
          />

          {/* Preuve de paiement */}
          {order.capture_paiement_url && (
            <a
              href={order.capture_paiement_url}
              target="_blank"
              rel="noreferrer"
              title="Preuve de paiement"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#2FA6A3]/10 text-[#2FA6A3] transition hover:bg-[#2FA6A3] hover:text-white"
            >
              <FontAwesomeIcon icon={faImage} className="h-3 w-3" />
            </a>
          )}

          {/* Actions selon statut */}
          {order.statut === "en_attente_verification" && (
            <>
              <ActionBtn icon={faCheck}  title="Valider paiement" onClick={onValidate} color="green"  disabled={isBusy} label="Valider" />
              <ActionBtn icon={faTimes}  title="Refuser paiement" onClick={onReject}   color="red"    disabled={isBusy} label="Refuser" />
            </>
          )}
          {order.statut === "valide" && order.reservation_status === "en_attente" && (
            <ActionBtn icon={faClipboardCheck} title="Confirmer" onClick={onConfirm} color="blue" disabled={isBusy} label="Confirmer" />
          )}
          {order.reservation_status === "confirmee" && (
            <ActionBtn icon={faGear} title="Préparer" onClick={onPrepare} color="purple" disabled={isBusy} label="Préparer" />
          )}
          {order.reservation_status === "en_preparation" && (
            order.reservation_type === "retrait"
              ? <ActionBtn icon={faBoxOpen} title="Prête à retirer" onClick={onReady} color="teal" disabled={isBusy} label="Prête" />
              : <ActionBtn icon={faBoxOpen} title="Prête pour livraison" onClick={onReady} color="cyan" disabled={isBusy} label="Prête" />
          )}
          {/* Retrait: prete_a_retirer → retiree */}
          {order.reservation_status === "prete_a_retirer" && (
            <ActionBtn icon={faStore} title="Confirmer le retrait" onClick={onPickedUp} color="teal" disabled={isBusy} label="Retiré" />
          )}
          {/* Livraison: prete → en_livraison */}
          {order.reservation_status === "prete" && order.reservation_type === "livraison" && (
            <ActionBtn icon={faTruck} title="Démarrer la livraison" onClick={onStartDelivery} color="indigo" disabled={isBusy} label="Livraison" />
          )}
          {/* Livraison: en_livraison → livree */}
          {order.reservation_status === "en_livraison" && (
            <ActionBtn icon={faTruckFast} title="Marquer livrée" onClick={onDeliver} color="green" disabled={isBusy} label="Livrée" />
          )}
          {/* Supprimer */}
          {canDelete && (
            <ActionBtn icon={faTrashCan} title="Supprimer" onClick={onDelete} color="red" disabled={isBusy} label="Suppr." />
          )}
        </div>
      </td>
    </tr>
  );
}

const ACTION_COLORS = {
  blue:   { base: "bg-[#2F6E9E]/10 text-[#2F6E9E]",     hover: "hover:bg-[#2F6E9E] hover:text-white" },
  green:  { base: "bg-emerald-50 text-emerald-700",       hover: "hover:bg-emerald-600 hover:text-white" },
  red:    { base: "bg-red-50 text-red-700",               hover: "hover:bg-red-600 hover:text-white" },
  purple: { base: "bg-purple-50 text-purple-700",         hover: "hover:bg-purple-600 hover:text-white" },
  cyan:   { base: "bg-cyan-50 text-cyan-700",             hover: "hover:bg-cyan-600 hover:text-white" },
  teal:   { base: "bg-teal-50 text-teal-700",             hover: "hover:bg-teal-600 hover:text-white" },
  indigo: { base: "bg-indigo-50 text-indigo-700",         hover: "hover:bg-indigo-600 hover:text-white" },
};

function ActionBtn({ icon, title, onClick, color = "blue", disabled, label }) {
  const c = ACTION_COLORS[color] || ACTION_COLORS.blue;
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 items-center gap-1 rounded-lg text-[10px] font-bold transition disabled:opacity-40
        ${label ? "px-2" : "w-7 justify-center"}
        ${c.base} ${c.hover}`}
    >
      <FontAwesomeIcon icon={icon} className="h-2.5 w-2.5 shrink-0" />
      {label && <span className="hidden xl:inline">{label}</span>}
    </button>
  );
}

// ── Carte mobile ─────────────────────────────────────────────────────────────

function MobileCard({ order, isBusy, onView, onOpenPage, onValidate, onReject, onConfirm, onPrepare, onReady, onPickedUp, onStartDelivery, onDeliver, onDelete, canDelete }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-[#2F6E9E]">#{order.reservation}</p>
            <TypeBadge type={order.reservation_type} />
          </div>
          <p className="mt-0.5 text-sm font-semibold text-[#1C2B4A]">{order.client_name || `Client #${order.user}`}</p>
          {order.client_phone && (
            <p className="text-xs text-slate-500">{order.client_phone}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-black text-[#1C2B4A]">{money(order.montant_total)}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(order.reservation_created_at)}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <PayBadge value={order.statut} />
        <ResBadge value={order.reservation_status} />
      </div>

      {(order.items || []).length > 0 && (
        <p className="mt-2 truncate text-xs text-slate-500">
          {(order.items || []).slice(0, 2).map(i => `${i.medicament_nom} ×${i.quantite}`).join(", ")}
          {(order.items || []).length > 2 && ` +${(order.items || []).length - 2}`}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#2F6E9E]/10 px-2 text-[11px] font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
        >
          <FontAwesomeIcon icon={faEye} className="h-2.5 w-2.5" />
          Détail
        </button>
        <button
          type="button"
          onClick={onOpenPage}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#2F6E9E]/10 px-2 text-[11px] font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-2.5 w-2.5" />
          Page
        </button>

        {order.statut === "en_attente_verification" && (
          <>
            <button type="button" disabled={isBusy} onClick={onValidate}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-40">
              <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" /> Valider
            </button>
            <button type="button" disabled={isBusy} onClick={onReject}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-50 px-2 text-[11px] font-bold text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-40">
              <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" /> Refuser
            </button>
          </>
        )}
        {order.statut === "valide" && order.reservation_status === "en_attente" && (
          <button type="button" disabled={isBusy} onClick={onConfirm}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#2F6E9E]/10 px-2 text-[11px] font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faClipboardCheck} className="h-2.5 w-2.5" /> Confirmer
          </button>
        )}
        {order.reservation_status === "confirmee" && (
          <button type="button" disabled={isBusy} onClick={onPrepare}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-purple-50 px-2 text-[11px] font-bold text-purple-700 transition hover:bg-purple-600 hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faGear} className="h-2.5 w-2.5" /> Préparer
          </button>
        )}
        {order.reservation_status === "en_preparation" && (
          order.reservation_type === "retrait"
            ? (
              <button type="button" disabled={isBusy} onClick={onReady}
                className="inline-flex h-7 items-center gap-1 rounded-lg bg-teal-50 px-2 text-[11px] font-bold text-teal-700 transition hover:bg-teal-600 hover:text-white disabled:opacity-40">
                <FontAwesomeIcon icon={faBoxOpen} className="h-2.5 w-2.5" /> Prête
              </button>
            ) : (
              <button type="button" disabled={isBusy} onClick={onReady}
                className="inline-flex h-7 items-center gap-1 rounded-lg bg-cyan-50 px-2 text-[11px] font-bold text-cyan-700 transition hover:bg-cyan-600 hover:text-white disabled:opacity-40">
                <FontAwesomeIcon icon={faBoxOpen} className="h-2.5 w-2.5" /> Prête
              </button>
            )
        )}
        {/* Retrait: prete_a_retirer → retiree */}
        {order.reservation_status === "prete_a_retirer" && (
          <button type="button" disabled={isBusy} onClick={onPickedUp}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-teal-50 px-2 text-[11px] font-bold text-teal-700 transition hover:bg-teal-600 hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faStore} className="h-2.5 w-2.5" /> Confirmer retrait
          </button>
        )}
        {/* Livraison: prete → en_livraison */}
        {order.reservation_status === "prete" && order.reservation_type === "livraison" && (
          <button type="button" disabled={isBusy} onClick={onStartDelivery}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-indigo-50 px-2 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faTruck} className="h-2.5 w-2.5" /> Démarrer livraison
          </button>
        )}
        {/* Livraison: en_livraison → livree */}
        {order.reservation_status === "en_livraison" && (
          <button type="button" disabled={isBusy} onClick={onDeliver}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faTruckFast} className="h-2.5 w-2.5" /> Livrée
          </button>
        )}
        {/* Supprimer */}
        {canDelete && (
          <button type="button" disabled={isBusy} onClick={onDelete}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-50 px-2 text-[11px] font-bold text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-40">
            <FontAwesomeIcon icon={faTrashCan} className="h-2.5 w-2.5" /> Supprimer
          </button>
        )}
      </div>
    </article>
  );
}

// ── Drawer de détail ─────────────────────────────────────────────────────────

function DetailDrawer({ order, onClose, onOpenPage }) {
  const delivery = order.delivery;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1C2B4A]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

        {/* Sticky header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#2FA6A3]">Détail</p>
            <h2 className="text-base font-black text-[#1C2B4A]">Réservation #{order.reservation}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              <PayBadge value={order.statut} />
              <ResBadge value={order.reservation_status} />
            </div>
            <button
              type="button"
              title="Page complète"
              onClick={onOpenPage}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[#2F6E9E] transition hover:bg-[#2F6E9E]/10"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Client ── */}
          <DrawerSection icon={faUser} title="Client">
            <DrawerRow label="Nom" value={order.client_name || `Utilisateur #${order.user}`} />
            <DrawerRow label="Téléphone" value={order.client_phone || "—"} icon={faPhone} />
          </DrawerSection>

          {/* ── Médicaments ── */}
          <DrawerSection icon={faListCheck} title={`Médicaments (${(order.items || []).length})`}>
            {(order.items || []).length === 0 ? (
              <p className="text-xs text-slate-400">Aucun médicament.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {(order.items || []).map((item) => (
                  <div key={item.id || item.medicament} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-semibold text-[#1C2B4A]">
                      {item.medicament_nom}
                    </span>
                    <div className="flex items-center gap-3 text-right text-slate-500">
                      <span>×{item.quantite}</span>
                      <span className="font-bold text-[#1C2B4A]">{money(item.sous_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DrawerSection>

          {/* ── Montants ── */}
          <DrawerSection icon={faReceipt} title="Montants">
            <div className="space-y-1.5">
              <DrawerRow label="Médicaments"  value={money(order.montant_medicaments)} />
              <DrawerRow label="Livraison"    value={money(order.frais_livraison)} />
              <div className="flex items-center justify-between rounded-xl bg-[#2F6E9E]/5 px-3 py-2">
                <span className="text-xs font-black text-[#1C2B4A]">Total</span>
                <span className="text-sm font-black text-[#2F6E9E]">{money(order.montant_total)}</span>
              </div>
            </div>
          </DrawerSection>

          {/* ── Paiement ── */}
          <DrawerSection icon={faReceipt} title="Paiement">
            <DrawerRow label="Méthode"    value={order.payment_method_name || "—"} />
            <DrawerRow label="Référence"  value={order.reference_paiement || "Sans référence"} />
            <DrawerRow label="Type"       value={<TypeBadge type={order.reservation_type} />} />
            {order.capture_paiement_url && (
              <div className="mt-2">
                <a
                  href={order.capture_paiement_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#2FA6A3]/30 bg-[#2FA6A3]/10 px-3 py-2 text-xs font-bold text-[#167769] transition hover:bg-[#2FA6A3] hover:text-white"
                >
                  <FontAwesomeIcon icon={faImage} />
                  Voir la preuve de paiement
                </a>
              </div>
            )}
          </DrawerSection>

          {/* ── Livraison ── */}
          {delivery && (
            <DrawerSection icon={faTruckFast} title="Livraison">
              {delivery.address && <DrawerRow label="Adresse" value={delivery.address} />}
              {delivery.phone   && <DrawerRow label="Téléphone" value={delivery.phone} />}
              {delivery.note    && <DrawerRow label="Note" value={delivery.note} />}
              {delivery.fee     && <DrawerRow label="Frais livraison" value={money(delivery.fee)} />}
              {delivery.google_maps_url && (
                <div className="mt-2">
                  <a
                    href={delivery.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2FA6A3] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#238985]"
                  >
                    <FontAwesomeIcon icon={faMapLocationDot} />
                    Ouvrir dans Google Maps
                  </a>
                </div>
              )}
            </DrawerSection>
          )}

          {/* ── Dates ── */}
          <DrawerSection icon={faClock} title="Dates">
            <DrawerRow label="Réservation" value={fmtDate(order.reservation_created_at || order.date_creation)} />
          </DrawerSection>

        </div>
      </div>
    </div>
  );
}

function DrawerSection({ icon, title, children }) {
  return (
    <div className="border-b border-slate-100 px-4 py-4">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
        <FontAwesomeIcon icon={icon} className="h-3 w-3" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DrawerRow({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 font-semibold text-slate-400">{label}</span>
      <span className="text-right font-semibold text-[#1C2B4A]">
        {icon && <FontAwesomeIcon icon={icon} className="mr-1 h-2.5 w-2.5 text-slate-400" />}
        {value}
      </span>
    </div>
  );
}

// ── Dialog refus de paiement ─────────────────────────────────────────────────

function DeleteDialog({ target, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        {/* Icône */}
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
          <FontAwesomeIcon icon={faTrashCan} className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="text-base font-black text-[#1C2B4A]">Supprimer la réservation #{target.reservation}</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Toutes les informations de cette réservation seront supprimées définitivement.
          <br />
          Voulez-vous continuer ?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectDialog({ target, reason, processing, onReasonChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1C2B4A]/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h3 className="text-base font-black text-[#1C2B4A]">Refuser le paiement #{target.id}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Indiquez un motif clair. Le patient en sera informé.
        </p>
        <textarea
          autoFocus
          required
          rows={3}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ex : référence introuvable, montant incorrect…"
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-[#1C2B4A] outline-none focus:border-[#2F6E9E] focus:ring-2 focus:ring-[#2F6E9E]/20"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={processing || !reason.trim()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? "Traitement…" : "Confirmer le refus"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function PharmacienReservations() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [busyId, setBusyId]           = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [rejectReason, setRejectReason]   = useState("");
  const [toast, setToast]             = useState(null);
  const [stats, setStats]             = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Chargement ────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      const data = await getReservationStats();
      setStats(data);
    } catch {
      // stats failure is non-critical
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReservations({
        page: currentPage,
        filter: activeFilter,
        search,
      });
      setOrders(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      setToast({ msg: parseError(err), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Gestion filtres ───────────────────────────────────────────────────────

  const handleFilterChange = (value) => {
    setActiveFilter(prev => (prev === value ? "all" : value));
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const runAction = async (orderId, fn, successMsg) => {
    setBusyId(orderId);
    try {
      await fn(orderId);
      setToast({ msg: successMsg, type: "success" });
      await load();
      loadStats();
    } catch (err) {
      setToast({ msg: parseError(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectOrderPayment(rejectTarget.id, rejectReason.trim());
      setToast({ msg: "Paiement refusé. Le patient a été notifié.", type: "success" });
      setRejectTarget(null);
      setRejectReason("");
      await load();
      loadStats();
    } catch (err) {
      setToast({ msg: parseError(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  // ── Stats cards ───────────────────────────────────────────────────────────

  const getCardCount = (card) => {
    if (stats) {
      if (card.id === "all") return stats.total;
      if (card.id === "payment_pending") return stats.payment_pending;
      return stats[card.id] ?? 0;
    }
    // Avant que les stats soient chargées, afficher totalCount pour la carte active
    if (card.id === "all") return totalCount;
    if (activeFilter === card.id) return totalCount;
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const DELETABLE_STATUSES = new Set(["annulee", "refusee"]);
  const canDeleteOrder = (order) =>
    DELETABLE_STATUSES.has(order.reservation_status) ||
    (order.reservation_status === "en_attente" && order.statut !== "valide");

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setBusyId(id);
    try {
      await deleteOrder(id);
      setToast({ msg: "Réservation supprimée.", type: "success" });
      if (selectedOrder?.id === id) setSelectedOrder(null);
      await load();
      loadStats();
    } catch (err) {
      setToast({ msg: parseError(err), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const makeActions = (order) => ({
    onView:           () => setSelectedOrder(order),
    onOpenPage:       () => navigate(`/pharmacien/reservations/${order.id}`),
    onValidate:       () => runAction(order.id, validateOrderPayment, "Paiement validé."),
    onReject:         () => { setRejectTarget(order); setRejectReason(""); },
    onConfirm:        () => runAction(order.id, confirmOrder, "Commande confirmée."),
    onPrepare:        () => runAction(order.id, prepareOrder, "En préparation."),
    onReady:          () => runAction(order.id, readyOrder,
      order.reservation_type === "retrait" ? "Commande prête à retirer." : "Commande prête pour la livraison."),
    onPickedUp:       () => runAction(order.id, pickedUpOrder, "Retrait confirmé."),
    onStartDelivery:  () => runAction(order.id, startDeliveryOrder, "Livraison démarrée."),
    onDeliver:        () => runAction(order.id, deliveredOrder, "Commande livrée."),
    onDelete:         () => canDeleteOrder(order) ? setDeleteTarget(order) : null,
    canDelete:        canDeleteOrder(order),
  });

  return (
    <PharmacienLayout
      title="Réservations"
      headerSubtitle="Gérez les commandes et paiements de votre pharmacie."
    >
      <div className="space-y-3">

        {/* ── En-tête compact ── */}
        <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-[#1C2B4A]">Réservations</h1>
            <p className="text-xs font-semibold text-slate-500">
              {loading ? "Chargement…" : `${totalCount} réservation${totalCount !== 1 ? "s" : ""} au total`}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotateRight} spin={loading} className="h-3.5 w-3.5" />
            Actualiser
          </button>
        </header>

        {/* ── Cartes statistiques ── */}
        <section className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-11">
          {STAT_CARDS.map((card) => (
            <StatCard
              key={card.id}
              card={card}
              count={getCardCount(card)}
              isActive={activeFilter === card.id}
              onClick={() => handleFilterChange(card.id)}
            />
          ))}
        </section>

        {/* ── Recherche ── */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par client, téléphone, N° réservation…"
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-medium text-[#1C2B4A] outline-none transition focus:border-[#2F6E9E] focus:ring-2 focus:ring-[#2F6E9E]/10"
          />
        </div>

        {/* ── Tableau (tablette / desktop) ── */}
        <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-2.5">N° Rés.</th>
                  <th className="px-3 py-2.5">Client</th>
                  <th className="hidden lg:table-cell px-3 py-2.5">Médicaments</th>
                  <th className="px-3 py-2.5 text-right">Montant</th>
                  <th className="px-3 py-2.5">Paiement</th>
                  <th className="hidden md:table-cell px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <TableSkeleton />
                  : orders.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-sm font-semibold text-slate-400">
                          Aucune réservation dans cette catégorie.
                        </td>
                      </tr>
                    )
                    : orders.map((order) => {
                      const a = makeActions(order);
                      return (
                        <TableRow
                          key={order.id}
                          order={order}
                          isBusy={busyId === order.id}
                          onView={a.onView}
                          onOpenPage={a.onOpenPage}
                          onValidate={a.onValidate}
                          onReject={a.onReject}
                          onConfirm={a.onConfirm}
                          onPrepare={a.onPrepare}
                          onReady={a.onReady}
                          onPickedUp={a.onPickedUp}
                          onStartDelivery={a.onStartDelivery}
                          onDeliver={a.onDeliver}
                          onDelete={a.onDelete}
                          canDelete={a.canDelete}
                        />
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* ── Cartes (mobile) ── */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <CardSkeleton />
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm font-semibold text-slate-400">
              Aucune réservation.
            </div>
          ) : (
            <>
              {orders.map((order) => {
                const a = makeActions(order);
                return (
                  <MobileCard
                    key={order.id}
                    order={order}
                    isBusy={busyId === order.id}
                    onView={a.onView}
                    onOpenPage={a.onOpenPage}
                    onValidate={a.onValidate}
                    onReject={a.onReject}
                    onConfirm={a.onConfirm}
                    onPrepare={a.onPrepare}
                    onReady={a.onReady}
                    onPickedUp={a.onPickedUp}
                    onStartDelivery={a.onStartDelivery}
                    onDeliver={a.onDeliver}
                    onDelete={a.onDelete}
                    canDelete={a.canDelete}
                  />
                );
              })}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>

      </div>

      {/* ── Drawer de détail ── */}
      {selectedOrder && (
        <DetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOpenPage={() => navigate(`/pharmacien/reservations/${selectedOrder.id}`)}
        />
      )}

      {/* ── Dialog refus ── */}
      {rejectTarget && (
        <RejectDialog
          target={rejectTarget}
          reason={rejectReason}
          processing={busyId === rejectTarget.id}
          onReasonChange={setRejectReason}
          onClose={() => { setRejectTarget(null); setRejectReason(""); }}
          onSubmit={handleReject}
        />
      )}

      {/* ── Dialog suppression ── */}
      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </PharmacienLayout>
  );
}
