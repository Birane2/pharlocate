import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBell,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import NotificationCard from "../../components/notifications/NotificationCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse a vos notifications.";
  }

  return (
    error.response?.data?.error ||
    "Impossible de charger vos notifications pour le moment."
  );
}

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getNotifications();

        if (isMounted) {
          setNotifications(data || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setNotifications([]);
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.est_lue).length,
    [notifications]
  );

  const handleMarkAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      const response = await markNotificationAsRead(notificationId);
      const updatedNotification = response?.data;

      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === notificationId
            ? { ...item, ...(updatedNotification || {}), est_lue: true }
            : item
        )
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5FB]">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-14 sm:h-16" to="/" />
          <Button
            type="button"
            variant="outline"
            icon={faArrowLeft}
            onClick={() => navigate("/")}
          >
            Retour a l'accueil
          </Button>
        </div>

        <div className="mt-8 space-y-8">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
            <Badge
              variant="info"
              className="border border-white/10 bg-white/15 text-white ring-white/10"
            >
              Notifications utilisateur
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Restez informe de l'avancement de vos reservations.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
              Retrouvez les confirmations, alertes et informations utiles envoyees
              pendant votre parcours utilisateur.
            </p>
          </div>

          <Card
            title="Centre de notifications"
            subtitle="Consultez les messages les plus recents et marquez-les comme lus."
            action={<Badge variant="blue">{unreadCount} non lue(s)</Badge>}
            hover={false}
            className="border-[#2F6E9E]/10 bg-white/95"
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <Card key={item} hover={false} className="animate-pulse border-[#E2E8F2]">
                    <div className="space-y-4">
                      <div className="h-5 w-24 rounded-full bg-[#2F6E9E]/10" />
                      <div className="h-6 w-3/4 rounded-full bg-[#2F6E9E]/10" />
                      <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faBell} className="text-2xl" />
                </div>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[#6B7A99]">
                  Vous n'avez aucune notification pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {!error && unreadCount > 0 && (
                  <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F8FBFF] px-4 py-3 text-sm text-[#1C2B4A]">
                    <div className="flex items-start gap-2">
                      <FontAwesomeIcon
                        icon={faCircleInfo}
                        className="mt-0.5 text-[#2F6E9E]"
                      />
                      <span>
                        Vous avez encore {unreadCount} notification(s) a consulter.
                      </span>
                    </div>
                  </div>
                )}

                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    loading={updatingId === notification.id}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
