import axios from "axios";

const defaultApiUrl = "http://127.0.0.1:8000";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || defaultApiUrl;

const API = axios.create({ baseURL: apiBaseUrl });

// ── Request: attach access token ───────────────────────────────────────────────

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: transparent token refresh on 401 ────────────────────────────────

let isRefreshing = false;
let pendingQueue = [];

function drainQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
}

function forceLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url ?? "";

    // Never intercept auth routes or already-retried requests
    const isAuthRoute =
      url.includes("/api/auth/login/") ||
      url.includes("/api/auth/register/") ||
      url.includes("/api/auth/refresh/");

    if (status !== 401 || isAuthRoute || original._retried) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    // Another request is already refreshing — queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        pendingQueue.push({ resolve, reject })
      ).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      });
    }

    original._retried = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/refresh/`, {
        refresh: refreshToken,
      });

      localStorage.setItem("access_token", data.access);
      if (data.refresh) {
        // Store rotated refresh token when ROTATE_REFRESH_TOKENS=True
        localStorage.setItem("refresh_token", data.refresh);
      }

      API.defaults.headers.common.Authorization = `Bearer ${data.access}`;
      drainQueue(null, data.access);

      original.headers.Authorization = `Bearer ${data.access}`;
      return API(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
