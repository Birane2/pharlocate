import API from "../api/axios";

// ── Pharmacien ─────────────────────────────────────────────────────────────

export async function getMyCommissionInvoices(params = {}) {
  const response = await API.get("/api/pharmacien/finance/invoices/", { params });
  return Array.isArray(response.data) ? response.data : response.data?.results || [];
}

export async function getMyCommissionInvoiceDetail(id) {
  const response = await API.get(`/api/pharmacien/finance/invoices/${id}/`);
  return response.data;
}

export async function payMyCommissionInvoice(id, formData) {
  const response = await API.post(
    `/api/pharmacien/finance/invoices/${id}/pay/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function adminListCommissionInvoices(params = {}) {
  const response = await API.get("/api/admin/finance/commission-invoices/", { params });
  return Array.isArray(response.data) ? response.data : response.data?.results || [];
}

export async function adminGetCommissionInvoiceDetail(id) {
  const response = await API.get(`/api/admin/finance/commission-invoices/${id}/`);
  return response.data;
}

export async function adminGenerateInvoice(payload) {
  const response = await API.post(
    "/api/admin/finance/commission-invoices/generate/",
    payload
  );
  return response.data;
}

export async function adminValidatePayment(paymentId) {
  const response = await API.patch(
    `/api/admin/finance/commission-invoice-payments/${paymentId}/validate/`
  );
  return response.data;
}

export async function adminRejectPayment(paymentId, reason) {
  const response = await API.patch(
    `/api/admin/finance/commission-invoice-payments/${paymentId}/reject/`,
    { reason }
  );
  return response.data;
}
