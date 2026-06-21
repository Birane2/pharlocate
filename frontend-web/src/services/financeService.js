import API from "../api/axios";

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return data?.results || [];
}

export async function getMyPayments(params = {}) {
  const response = await API.get("/api/payments/my-payments/", { params });
  return normalizeList(response.data);
}

export async function getPaymentDetail(id) {
  const response = await API.get(`/api/payments/${id}/`);
  return response.data;
}

export async function getMyInvoices(params = {}) {
  const response = await API.get("/api/invoices/", { params });
  return normalizeList(response.data);
}

export async function getInvoiceDetail(id) {
  const response = await API.get(`/api/invoices/${id}/`);
  return response.data;
}

export async function downloadInvoicePdf(id) {
  const response = await API.get(`/api/invoices/${id}/download/`, {
    responseType: "blob",
  });
  const contentType = response.headers["content-type"] || "application/pdf";
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `facture-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getPharmacienFinanceDashboard(params = {}) {
  const response = await API.get("/api/pharmacien/finance/dashboard/", { params });
  return response.data;
}

export async function getPharmacienTransactions(params = {}) {
  const response = await API.get("/api/pharmacien/finance/transactions/", { params });
  // Returns paginated object: { count, total_pages, page, page_size, results }
  return response.data;
}

export async function getPharmacienPayments(params = {}) {
  const response = await API.get("/api/pharmacien/finance/payments/", { params });
  return normalizeList(response.data);
}

export async function getPharmacienOrders(params = {}) {
  const response = await API.get("/api/pharmacien/orders/", { params });
  return normalizeList(response.data);
}

export async function getPharmacienOrderDetail(id) {
  const response = await API.get(`/api/pharmacien/orders/${id}/`);
  return response.data;
}

export async function getPharmacienPaymentMethods() {
  const response = await API.get("/api/pharmacien/payment-methods/");
  return response.data;
}

export async function updatePharmacienPaymentMethods(payload) {
  const response = await API.put("/api/pharmacien/payment-methods/", payload);
  return response.data;
}

export async function validatePayment(id) {
  const response = await API.post(`/api/payments/${id}/validate/`);
  return response.data;
}

export async function rejectPayment(id, motif_refus) {
  const response = await API.post(`/api/payments/${id}/reject/`, { motif_refus });
  return response.data;
}

export async function confirmOrder(id) {
  const response = await API.post(`/api/pharmacien/orders/${id}/confirm/`);
  return response.data;
}

export async function prepareOrder(id) {
  const response = await API.post(`/api/pharmacien/orders/${id}/prepare/`);
  return response.data;
}

export async function markOrderReady(id) {
  const response = await API.post(`/api/pharmacien/orders/${id}/ready/`);
  return response.data;
}

export async function markOrderDelivered(id) {
  const response = await API.post(`/api/pharmacien/orders/${id}/delivered/`);
  return response.data;
}

export async function getPharmacienSubscription() {
  const response = await API.get("/api/pharmacien/subscription/");
  return response.data;
}

export async function getSubscriptionPlans() {
  const response = await API.get("/api/subscriptions/plans/");
  return normalizeList(response.data);
}

export async function subscribeToPlan(payload) {
  const response = await API.post("/api/pharmacien/subscription/subscribe/", payload);
  return response.data;
}

export async function getPlatformPaymentMethods() {
  const response = await API.get("/api/platform/payment-methods/");
  return response.data;
}

export async function sendSubscriptionPayment(payload) {
  const response = await API.post("/api/pharmacien/subscription/payment/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function cancelSubscription() {
  const response = await API.patch("/api/pharmacien/subscription/cancel/");
  return response.data;
}

export async function requestSubscriptionRefund(payload) {
  const response = await API.post("/api/pharmacien/subscription/refund-request/", payload);
  return response.data;
}

export async function getAdminFinanceDashboard(params = {}) {
  const response = await API.get("/api/admin/finance/dashboard/", { params });
  return response.data;
}

export async function getAdminTransactions(params = {}) {
  const response = await API.get("/api/admin/transactions/", { params });
  // Returns paginated object: { count, total_pages, page, page_size, results }
  return response.data;
}

export async function getAdminTransactionDetail(id) {
  const response = await API.get(`/api/admin/transactions/${id}/`);
  return response.data;
}

export async function getAdminTransactionSummary(params = {}) {
  const response = await API.get("/api/admin/transactions/summary/", { params });
  return response.data;
}

export async function getAdminPendingPayments(params = {}) {
  const response = await API.get("/api/payments/admin/pending/", { params });
  return normalizeList(response.data);
}

export async function getAdminPaymentCenter(params = {}) {
  const response = await API.get("/api/admin/payments/", { params });
  return normalizeList(response.data);
}

export async function getAdminPaymentSummary(params = {}) {
  const response = await API.get("/api/admin/payments/summary/", { params });
  return response.data;
}

export async function getAdminPaymentDetail(id) {
  const response = await API.get(`/api/admin/payments/${id}/`);
  return response.data;
}

export async function validateAdminPayment(id) {
  const response = await API.patch(`/api/admin/payments/${id}/validate/`);
  return response.data;
}

export async function rejectAdminPayment(id, reason) {
  const response = await API.patch(`/api/admin/payments/${id}/reject/`, {
    reason,
  });
  return response.data;
}

export async function getAdminRefunds(params = {}) {
  const response = await API.get("/api/admin/refunds/", { params });
  return normalizeList(response.data);
}

export async function approveRefund(id, payload = {}) {
  const response = await API.post(`/api/refunds/${id}/approve/`, payload);
  return response.data;
}

export async function rejectRefund(id, commentaire_admin) {
  const response = await API.post(`/api/refunds/${id}/reject/`, {
    commentaire_admin,
  });
  return response.data;
}

export async function executeRefund(id) {
  const response = await API.post(`/api/refunds/${id}/execute/`);
  return response.data;
}

export async function getAdminFinancePayments(params = {}) {
  const response = await API.get("/api/admin/finance/payments/", { params });
  return response.data;
}

export async function getAdminFinanceSubscriptions(params = {}) {
  const response = await API.get("/api/admin/finance/subscriptions/", { params });
  return normalizeList(response.data);
}

export async function getAdminFinanceRefunds(params = {}) {
  const response = await API.get("/api/admin/finance/refunds/", { params });
  return response.data;
}

export async function getAdminPlatformPaymentMethods() {
  const response = await API.get("/api/admin/payment-methods/");
  return response.data;
}

export async function updateAdminPlatformPaymentMethods(payload) {
  const response = await API.put("/api/admin/payment-methods/", payload);
  return response.data;
}

export async function getAdminSubscriptionPayments(params = {}) {
  const response = await API.get("/api/admin/subscription-payments/", { params });
  return normalizeList(response.data);
}

export async function validateSubscriptionPayment(id) {
  const response = await API.patch(`/api/admin/subscription-payments/${id}/validate/`);
  return response.data;
}

export async function rejectSubscriptionPayment(id, rejection_reason) {
  const response = await API.patch(`/api/admin/subscription-payments/${id}/reject/`, {
    rejection_reason,
  });
  return response.data;
}

export async function getAdminSubscriptionRefunds(params = {}) {
  const response = await API.get("/api/admin/subscription-refunds/", { params });
  return normalizeList(response.data);
}

export async function approveSubscriptionRefund(id, admin_note = "") {
  const response = await API.patch(`/api/admin/subscription-refunds/${id}/approve/`, {
    admin_note,
  });
  return response.data;
}

export async function rejectSubscriptionRefund(id, admin_note = "") {
  const response = await API.patch(`/api/admin/subscription-refunds/${id}/reject/`, {
    admin_note,
  });
  return response.data;
}

export async function markSubscriptionRefundProcessed(id, admin_note = "") {
  const response = await API.patch(`/api/admin/subscription-refunds/${id}/processed/`, {
    admin_note,
  });
  return response.data;
}

export async function getAdminSubscriptionDashboard() {
  const response = await API.get("/api/admin/subscriptions/dashboard/");
  return response.data;
}

// ── Commission invoices — pharmacien ──────────────────────────────────────

export async function getPharmacienCommissionInvoices(params = {}) {
  const response = await API.get("/api/pharmacien/finance/commission-invoices/", { params });
  return response.data;
}

export async function getPharmacienCommissionInvoiceDetail(id) {
  const response = await API.get(`/api/pharmacien/finance/commission-invoices/${id}/`);
  return response.data;
}

export async function payCommissionInvoice(id, formData) {
  const response = await API.post(
    `/api/pharmacien/finance/commission-invoices/${id}/pay/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

// ── Commission invoices — admin ───────────────────────────────────────────

export async function adminGetCommissionInvoices(params = {}) {
  const response = await API.get("/api/admin/finance/commission-invoices/", { params });
  return response.data;
}

export async function adminGetCommissionInvoiceDetail(id) {
  const response = await API.get(`/api/admin/finance/commission-invoices/${id}/`);
  return response.data;
}

export async function adminGenerateCommissionInvoice(payload) {
  const response = await API.post("/api/admin/finance/commission-invoices/generate/", payload);
  return response.data;
}

export async function adminValidateCommissionPayment(id) {
  const response = await API.patch(
    `/api/admin/finance/commission-invoices/payments/${id}/validate/`
  );
  return response.data;
}

export async function adminRejectCommissionPayment(id, reason) {
  const response = await API.patch(
    `/api/admin/finance/commission-invoices/payments/${id}/reject/`,
    { reason }
  );
  return response.data;
}

// ── Transaction exports ───────────────────────────────────────────────────────

function _triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportPharmacistTransactionsPDF(params = {}) {
  const response = await API.get("/api/pharmacien/transactions/export/pdf/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-pharmacie.pdf");
}

export async function exportPharmacistTransactionsExcel(params = {}) {
  const response = await API.get("/api/pharmacien/transactions/export/excel/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-pharmacie.xlsx");
}

export async function exportPharmacistTransactionsWord(params = {}) {
  const response = await API.get("/api/pharmacien/transactions/export/word/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-pharmacie.docx");
}

export async function exportAdminTransactionsPDF(params = {}) {
  const response = await API.get("/api/admin/transactions/export/pdf/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-admin.pdf");
}

export async function exportAdminTransactionsExcel(params = {}) {
  const response = await API.get("/api/admin/transactions/export/excel/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-admin.xlsx");
}

export async function exportAdminTransactionsWord(params = {}) {
  const response = await API.get("/api/admin/transactions/export/word/", {
    params,
    responseType: "blob",
  });
  _triggerDownload(response.data, "transactions-admin.docx");
}
