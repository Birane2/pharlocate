import API from "../api/axios";

const PAYMENT_METHODS = [
  {
    code: "bankily",
    name: "Bankily",
    numberKey: "bankily_number",
    color: "from-[#2F6E9E] to-[#4A8BBE]",
  },
  {
    code: "masrivi",
    name: "Masrivi",
    numberKey: "masrivi_number",
    color: "from-[#2FA6A3] to-[#5EC6B8]",
  },
  {
    code: "click",
    name: "Click",
    numberKey: "click_number",
    color: "from-[#4A8BBE] to-[#2FA6A3]",
  },
  {
    code: "sedad",
    name: "Sedad",
    numberKey: "sedad_number",
    color: "from-amber-500 to-orange-500",
  },
  {
    code: "bci_pay",
    name: "BCI Pay",
    numberKey: "bci_pay_number",
    color: "from-cyan-600 to-[#2F6E9E]",
  },
];

function normalizePaymentMethods(data = {}) {
  const apiMethods = Array.isArray(data.methods)
    ? data.methods
    : PAYMENT_METHODS.map((method) => ({
        code: method.code,
        name: method.name,
        account_number: data[method.numberKey] || "",
      })).filter((method) => String(method.account_number).trim());

  return apiMethods
    .map((apiMethod, index) => {
      const method =
        PAYMENT_METHODS.find(
          (item) => item.code === String(apiMethod.code).toLowerCase()
        ) || PAYMENT_METHODS[index];
      const accountNumber =
        apiMethod?.account_number ||
        apiMethod?.number ||
        data[method?.numberKey] ||
        "";

      return {
        ...method,
        id: apiMethod?.id || index + 1,
        code: apiMethod?.code || method.code,
        name: apiMethod?.label || apiMethod?.nom || apiMethod?.name || method.name,
        accountNumber: String(accountNumber).trim(),
        requiresProof: apiMethod?.requires_proof !== false,
        configured: Boolean(String(accountNumber).trim()),
        beneficiaryName: data.beneficiary_name || data.pharmacy_name || "",
        instructions: data.payment_instructions || "",
        color: method.color,
      };
    })
    .filter((method) => method.configured);
}

export const getPharmacyPaymentMethods = async (pharmacyId) => {
  if (!pharmacyId) {
    throw new Error("Identifiant de pharmacie manquant.");
  }

  const response = await API.get(`/api/pharmacies/${pharmacyId}/payment-methods/`);
  const data = response.data || {};
  const methods = normalizePaymentMethods(data);

  return {
    pharmacyId: data.pharmacy || pharmacyId,
    pharmacyName: data.pharmacy_name || "",
    beneficiaryName: data.beneficiary_name || data.pharmacy_name || "",
    instructions: data.payment_instructions || "",
    methods,
    hasConfiguredMethods: methods.some((method) => method.configured),
    configurationExists: data.configuration_exists !== false,
    isActive: data.is_active !== false,
    message: data.message || data.error || "",
  };
};
