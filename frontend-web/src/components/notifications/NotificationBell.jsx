import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarCheck,
  faCheck,
  faCreditCard,
  faInfoCircle,
  faShieldHalved,
  faTruck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  getUnreadCount,
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
  alerte: "text-[#EF4444] bg-[#EF4444]/10",
};

function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(dateStr));
}

function NotificationBell({ notificationsPath = "/pharmacien/notifications" }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchDropdown = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ page: 1, page_size: 5 });
      setItems(data.results || []);
      setUnreadCount((prev) => {
        const unread = (data.results || []).filter((n) => !n.est_lue).length;
        return Math.max(prev, unread);
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 60 s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Open / close dropdown
  useEffect(() => {
    if (open) fetchDropdown();
  }, [open, fetchDropdown]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, est_lue: true })));
    } catch {
      // silent
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markNotificationAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, est_lue: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2F6E9E]/30 hover:text-[#2F6E9E] hover:shadow-md"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F2] px-4 py-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5 text-[#2F6E9E]" />
              <span className="text-sm font-bold text-[#1C2B4A]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-black text-[#EF4444]">
                  {unreadCount} non lues
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-[#2FA6A3] transition hover:bg-[#2FA6A3]/8"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[#F8FAFC]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm font-semibold text-[#6B7280]">
                <FontAwesomeIcon icon={faBell} className="h-8 w-8 opacity-25" />
                Aucune notification
              </div>
            ) : (
              <ul>
                {items.map((notif) => {
                  const iconKey = notif.type === "alerte" ? "alerte" : notif.notification_type;
                  const iconColor = NTYPE_COLORS[iconKey] || NTYPE_COLORS.system;
                  const icon = NTYPE_ICONS[notif.notification_type] || faInfoCircle;
                  const isAlert = notif.type === "alerte";

                  return (
                    <li
                      key={notif.id}
                      className={`flex gap-3 border-b border-[#F1F5F9] px-4 py-3 transition last:border-0 ${
                        !notif.est_lue ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                        <FontAwesomeIcon icon={isAlert ? faTriangleExclamation : icon} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${!notif.est_lue ? "text-[#1C2B4A]" : "text-[#374151]"}`}>
                          {notif.titre || notif.title || "Notification"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-[#6B7280]">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-[#9CA3AF]">
                          {formatRelativeDate(notif.date || notif.date_creation)}
                        </p>
                      </div>
                      {!notif.est_lue && (
                        <button
                          type="button"
                          onClick={() => handleMarkOne(notif.id)}
                          title="Marquer comme lu"
                          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2F6E9E]/10 text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
                        >
                          <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E2E8F2] px-4 py-2.5">
            <Link
              to={notificationsPath}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/8"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
