import API from "../api/axios";

export const getNotifications = async () => {
  const res = await API.get("/api/notifications/");
  const items = res.data.results || res.data || [];

  return Array.isArray(items) ? items : [];
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await API.patch(`/api/notifications/${notificationId}/read/`);
  return res.data;
};
