import API from "../api/axios";

function normalizePaginatedResponse(data) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return {
    count: Number(data?.count) || 0,
    next: data?.next || null,
    previous: data?.previous || null,
    results: Array.isArray(data?.results) ? data.results : [],
  };
}

export const getPendingPharmacies = async ({ page = 1, pageSize = 5 } = {}) => {
  const res = await API.get("/api/admin/pharmacies/pending/", {
    params: {
      page,
      page_size: pageSize,
    },
  });

  return normalizePaginatedResponse(res.data);
};

export const getAdminPharmacies = async ({
  page = 1,
  pageSize = 5,
  search = "",
  statutValidation = "",
} = {}) => {
  const res = await API.get("/api/admin/pharmacies/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      statut_validation: statutValidation || undefined,
    },
  });

  return normalizePaginatedResponse(res.data);
};

export const getAdminPharmacyDetail = async (id) => {
  const res = await API.get(`/api/admin/pharmacies/${id}/`);
  return res.data;
};

export const validateAdminPharmacy = async (id) => {
  const res = await API.patch(`/api/admin/pharmacies/${id}/validate/`);
  return res.data;
};

export const updateAdminPharmacy = async (id, payload) => {
  const res = await API.patch(`/api/admin/pharmacies/${id}/`, payload);
  return res.data;
};

export const suspendAdminPharmacy = async (id, motif = "") => {
  const res = await API.patch(`/api/admin/pharmacies/${id}/suspend/`, {
    motif,
  });
  return res.data;
};

export const reactivateAdminPharmacy = async (id) => {
  const res = await API.patch(`/api/admin/pharmacies/${id}/reactivate/`);
  return res.data;
};

export const deleteAdminPharmacy = async (id) => {
  const res = await API.delete(`/api/admin/pharmacies/${id}/`);
  return res.data;
};

export const rejectAdminPharmacy = async (id, motifRefus) => {
  const res = await API.patch(`/api/admin/pharmacies/${id}/reject/`, {
    motif_refus: motifRefus,
  });
  return res.data;
};
