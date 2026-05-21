import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function getNotificationMeta(type) {
  if (type === "confirmation") {
    return {
      icon: faCircleCheck,
      accentClass: "text-[#13795f] bg-[#5EC6B8]/12",
      badgeVariant: "success",
      label: "Confirmation",
    };
  }

  if (type === "alerte") {
    return {
      icon: faCircleExclamation,
      accentClass: "text-red-600 bg-red-50",
      badgeVariant: "danger",
      label: "Alerte",
    };
  }

  return {
    icon: faCircleInfo,
    accentClass: "text-[#2F6E9E] bg-[#2F6E9E]/10",
    badgeVariant: "blue",
    label: "Information",
  };
}

function NotificationCard({ notification, onMarkAsRead, loading = false }) {
  const meta = getNotificationMeta(notification.type);

  return (
    <Card
      hover={false}
      className={`border-[#2F6E9E]/10 bg-white/95 ${
        notification.est_lue ? "opacity-90" : "shadow-md"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.accentClass}`}
            >
              <FontAwesomeIcon icon={meta.icon || faBell} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                <Badge variant={notification.est_lue ? "active" : "warning"}>
                  {notification.est_lue ? "Lue" : "Non lue"}
                </Badge>
              </div>

              <p className="mt-3 text-base font-semibold leading-7 text-[#1C2B4A]">
                {notification.message}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[#6B7A99]">
                {new Date(notification.date).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          {!notification.est_lue && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={loading}
              onClick={() => onMarkAsRead(notification.id)}
            >
              Marquer comme lue
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default NotificationCard;
