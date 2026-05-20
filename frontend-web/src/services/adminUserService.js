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

export const getAdminUsers = async ({
  page = 1,
  pageSize = 4,
  search = "",
  role = "",
} = {}) => {
  const res = await API.get("/api/admin/users/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      role: role || undefined,
    },
  });

  return normalizePaginatedResponse(res.data);
};

export const getAdminUserDetail = async (id) => {
  const res = await API.get(`/api/admin/users/${id}/`);
  return res.data;
};

export const activateAdminUser = async (id) => {
  const res = await API.patch(`/api/admin/users/${id}/activate/`);
  return res.data;
};

export const suspendAdminUser = async (id) => {
  const res = await API.patch(`/api/admin/users/${id}/suspend/`);
  return res.data;
};

export const deleteAdminUser = async (id) => {
  const res = await API.delete(`/api/admin/users/${id}/`);
  return res.data;
};
