import API from "../api/axios";

const defaultApiUrl = "http://127.0.0.1:8000";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || defaultApiUrl;

export const getPharmacies = async (params = {}) => {
  const res = await API.get("/api/pharmacies/", { params });
  return res.data;
};

export const getPublicPharmacyDetail = async (id) => {
  const res = await API.get(`/api/pharmacies/${id}/`);
  return res.data;
};

export const getPublicMediaUrl = (mediaPath) => {
  if (!mediaPath) {
    return "";
  }

  const normalizedPath = String(mediaPath).trim();

  if (!normalizedPath) {
    return "";
  }

  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/media/")) {
    return `${apiBaseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("media/")) {
    return `${apiBaseUrl}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/")) {
    return `${apiBaseUrl}${normalizedPath}`;
  }

  return `${apiBaseUrl}/${normalizedPath}`;
};

export const createPharmacy = async (data) => {
  const res = await API.post("/api/pharmacies/", data);
  return res.data;
};

export const getMyPharmacyStatus = async () => {
  try {
    const res = await API.get("/api/pharmacies/my-pharmacy/");
    return res.data;
  } catch (error) {
    const data = error.response?.data;

    if (error.response?.status === 404 && data?.has_pharmacy === false) {
      return data;
    }

    throw error;
  }
};

export const getMyPharmacyProfile = async () => {
  const data = await getMyPharmacyStatus();

  if (data?.has_pharmacy === false) {
    const error = new Error(data.message);
    error.hasPharmacy = false;
    error.response = {
      status: 404,
      data,
    };
    throw error;
  }

  return data?.data || data;
};

export const updateMyPharmacyProfile = async (data) => {
  const res = await API.patch("/api/pharmacien/pharmacie/", data);
  return res.data;
};

export const updateMyPharmacyPhoto = async (photo) => {
  const formData = new FormData();
  formData.append("photo", photo);

  const res = await API.post("/api/pharmacien/pharmacie/photo/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getHoraires = async () => {
  const res = await API.get("/api/pharmacies/horaires/");
  return res.data;
};

export const createHoraire = async (data) => {
  const res = await API.post("/api/pharmacies/horaires/", data);
  return res.data;
};
