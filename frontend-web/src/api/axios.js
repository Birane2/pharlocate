import axios from "axios";

const defaultApiUrl = "http://127.0.0.1:8000";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || defaultApiUrl;

const API = axios.create({
  baseURL: apiBaseUrl,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isAuthRequest =
        requestUrl.includes("/api/auth/login/") ||
        requestUrl.includes("/api/auth/register/");

      if (!isAuthRequest) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
