import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCalendarCheck } from "@fortawesome/free-solid-svg-icons";

const NOTIF_ICONS = {
  reservation: faCalendarCheck,
  payment: faBell,
  delivery: faBell,
  subscription: faBell,
  commission: faBell,
  system: faBell,
};

const NOTIF_COLORS = {
  reservation: "text-[#2F6E9E] bg-[#2F6E9E]/10",
  payment: "text-[#10B981] bg-[#10B981]/10",
  delivery: "text-[#2FA6A3] bg-[#2FA6A3]/10",
  subscription: "text-[#8B5CF6] bg-[#8B5CF6]/10",
  commission: "text-[#F59E0B] bg-[#F59E0B]/10",
  system: "text-[#6B7280] bg-[#6B7280]/10",
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
  return days < 7
    ? `Il y a ${days} j`
    : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(
        new Date(dateStr)
      );
}

export default function RecentNotifications({ notifications, unreadCount, onMarkAllRead }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F2] px-4 py-3">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5 text-[#2F6E9E]" />
          <h2 className="text-sm font-bold text-[#1C2B4A]">Notifications récentes</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#EF4444]/10 px-1.5 py-0.5 text-[10px] font-black text-[#EF4444]">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="rounded-full bg-[#2FA6A3]/8 px-2.5 py-1 text-[10px] font-bold text-[#2FA6A3] transition hover:bg-[#2FA6A3] hover:text-white"
            >
              Tout lire
            </button>
          )}
          <Link
            to="/admin/notifications"
            className="rounded-full bg-[#2F6E9E]/8 px-2.5 py-1 text-[10px] font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
          >
            Voir tout
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm font-semibold text-[#6B7280]">
          Aucune notification récente.
        </p>
      ) : (
        <ul>
          {notifications.map((notif) => {
            const key = notif.notification_type || "system";
            const icon = NOTIF_ICONS[key] || faBell;
            const colorCls =
              notif.type === "alerte"
                ? "text-[#EF4444] bg-[#EF4444]/10"
                : NOTIF_COLORS[key] || NOTIF_COLORS.system;

            return (
              <li
                key={notif.id}
                className={`flex items-start gap-3 border-b border-[#F1F5F9] px-4 py-2.5 last:border-0 ${
                  !notif.est_lue ? "bg-[#EFF6FF]" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${colorCls}`}
                >
                  <FontAwesomeIcon icon={icon} className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[#1C2B4A]">
                    {notif.titre || notif.title || "Notification"}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[#6B7280]">
                    {notif.message}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[#9CA3AF]">
                    {formatRelativeDate(notif.date || notif.date_creation)}
                  </p>
                </div>
                {!notif.est_lue && (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6E9E]" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
