import API from "../api/axios";

export const getNotifications = async (params = {}) => {
  const res = await API.get("/api/notifications/", { params });
  const data = res.data;
  if (data && typeof data === 'object' && 'results' in data) {
    return data;
  }
  const items = Array.isArray(data) ? data : [];
  return { count: items.length, total_pages: 1, page: 1, page_size: items.length, results: items };
};

export const getUnreadCount = async () => {
  const res = await API.get("/api/notifications/unread-count/");
  return res.data.unread_count ?? 0;
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await API.patch(`/api/notifications/${notificationId}/read/`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await API.patch("/api/notifications/mark-all-read/");
  return res.data;
};

export const deleteNotification = async (notificationId) => {
  const res = await API.delete(`/api/notifications/${notificationId}/`);
  return res.data;
};

export const clearAllNotifications = async () => {
  const res = await API.delete("/api/notifications/clear-all/");
  return res.data;
};
