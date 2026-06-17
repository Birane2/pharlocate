import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarCheck,
  faCheck,
  faCreditCard,
  faInfoCircle,
  faShieldHalved,
  faTrash,
  faTruck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

const NTYPE_ICONS = {
  reservation: faCalendarCheck,
  payment: faCreditCard,
  delivery: faTruck,
  subscription: faShieldHalved,
  commission: faCreditCard,
  system: faInfoCircle,
};

const NTYPE_COLORS = {
  reservation: "text-[#2F6E9E] bg-[#2F6E9E]/10",
  payment: "text-[#10B981] bg-[#10B981]/10",
  delivery: "text-[#2FA6A3] bg-[#2FA6A3]/10",
  subscription: "text-[#8B5CF6] bg-[#8B5CF6]/10",
  commission: "text-[#F59E0B] bg-[#F59E0B]/10",
  system: "text-[#6B7280] bg-[#6B7280]/10",
};

const NTYPE_LABELS = {
  reservation: "Réservation",
  payment: "Paiement",
  delivery: "Livraison",
  subscription: "Abonnement",
  commission: "Commission",
  system: "Système",
  all: "Toutes",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function NotificationRow({ notif, onRead, onDelete }) {
  const isAlert = notif.type === "alerte";
  const iconKey = notif.notification_type || "system";
  const icon = NTYPE_ICONS[iconKey] || faInfoCircle;
  const colorClass = isAlert
    ? "text-[#EF4444] bg-[#EF4444]/10"
    : NTYPE_COLORS[iconKey] || NTYPE_COLORS.system;

  return (
    <article
      className={`flex gap-4 rounded-2xl border p-4 transition ${
        !notif.est_lue
          ? "border-[#2F6E9E]/20 bg-[#EFF6FF]"
          : "border-[#E2E8F2] bg-white hover:bg-[#F8FAFC]"
      }`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        <FontAwesomeIcon icon={isAlert ? faTriangleExclamation : icon} className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-bold ${!notif.est_lue ? "text-[#1C2B4A]" : "text-[#374151]"}`}>
              {notif.titre || notif.title || "Notification"}
            </p>
            <p className="mt-1 text-sm font-medium text-[#6B7280]">{notif.message}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!notif.est_lue && (
              <button
                type="button"
                onClick={() => onRead(notif.id)}
                title="Marquer comme lu"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2FA6A3]/10 text-[#2FA6A3] transition hover:bg-[#2FA6A3] hover:text-white"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(notif.id)}
              title="Supprimer"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EF4444]/10 text-[#EF4444] transition hover:bg-[#EF4444] hover:text-white"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${colorClass}`}>
            {NTYPE_LABELS[iconKey] || iconKey}
          </span>
          <span className="text-[11px] font-semibold text-[#9CA3AF]">
            {formatDate(notif.date || notif.date_creation)}
          </span>
          {!notif.est_lue && (
            <span className="h-2 w-2 rounded-full bg-[#2F6E9E]" title="Non lue" />
          )}
        </div>
      </div>
    </article>
  );
}

const FILTER_TYPES = ["all", "reservation", "payment", "delivery", "subscription", "commission", "system"];

function PharmacienNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [filterUnread, setFilterUnread] = useState(false);

  const load = useCallback(async (p = 1, ntype = filterType, unreadOnly = filterUnread) => {
    setLoading(true);
    try {
      const params = { page: p, page_size: 15 };
      if (ntype !== "all") params.notification_type = ntype;
      if (unreadOnly) params.unread = "1";
      const data = await getNotifications(params);
      setItems(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.count || 0);
      setPage(data.page || p);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterUnread]);

  useEffect(() => {
    load(1, filterType, filterUnread);
  }, [filterType, filterUnread, load]);

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, est_lue: true } : n)));
    } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, est_lue: true })));
    } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Supprimer toutes les notifications ?")) return;
    try {
      await clearAllNotifications();
      setItems([]);
      setTotal(0);
    } catch { /* silent */ }
  };

  const unreadCount = items.filter((n) => !n.est_lue).length;

  return (
    <DashboardLayout title="Notifications" links={pharmacistLinks}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-[#2F6E9E]" />
            <h1 className="text-xl font-bold text-[#1C2B4A]">Mes notifications</h1>
            <span className="rounded-full bg-[#2F6E9E]/10 px-2.5 py-0.5 text-xs font-black text-[#2F6E9E]">
              {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 rounded-xl border border-[#2FA6A3]/30 bg-white px-3 py-2 text-xs font-bold text-[#2FA6A3] shadow-sm transition hover:bg-[#2FA6A3]/8"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
            {total > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                Tout supprimer
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filterType === type
                  ? "bg-[#2F6E9E] text-white shadow"
                  : "border border-[#E2E8F2] bg-white text-[#6B7280] hover:border-[#2F6E9E]/30 hover:text-[#2F6E9E]"
              }`}
            >
              {NTYPE_LABELS[type]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilterUnread((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filterUnread
                ? "bg-[#EF4444] text-white shadow"
                : "border border-[#E2E8F2] bg-white text-[#6B7280] hover:border-red-300 hover:text-red-500"
            }`}
          >
            Non lues uniquement
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E2E8F2] bg-white py-16 text-center shadow-sm">
            <FontAwesomeIcon icon={faBell} className="h-12 w-12 text-[#CBD5E1]" />
            <p className="text-sm font-bold text-[#6B7280]">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="rounded-xl border border-[#E2E8F2] bg-white px-4 py-2 text-xs font-bold text-[#2F6E9E] shadow-sm transition hover:bg-[#2F6E9E]/8 disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-xs font-semibold text-[#6B7280]">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="rounded-xl border border-[#E2E8F2] bg-white px-4 py-2 text-xs font-bold text-[#2F6E9E] shadow-sm transition hover:bg-[#2F6E9E]/8 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacienNotifications;
