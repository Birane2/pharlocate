import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { PageCard } from "../finance/FinanceUI";
import {
  getAdminPlatformPaymentMethods,
  updateAdminPlatformPaymentMethods,
} from "../../services/financeService";

const methodFields = [
  { name: "bankily_number", label: "Bankily" },
  { name: "masrivi_number", label: "Masrivi" },
  { name: "click_number", label: "Click" },
  { name: "sedad_number", label: "Sedad" },
  { name: "bci_pay_number", label: "BCI Pay" },
];

const emptyForm = {
  bankily_number: "",
  masrivi_number: "",
  click_number: "",
  sedad_number: "",
  bci_pay_number: "",
  beneficiary_name: "PharmaLocate",
  payment_instructions: "",
  is_active: true,
};

function AdminPlatformPaymentMethods() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminPlatformPaymentMethods()
      .then((data) => {
        setForm({
          ...emptyForm,
          ...data,
          beneficiary_name: data.beneficiary_name || "PharmaLocate",
        });
      })
      .catch(() => {
        setError("Impossible de charger les modes de paiement.");
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateAdminPlatformPaymentMethods(form);
      setForm({ ...emptyForm, ...(response.config || response) });
      setMessage("Modes de paiement PharmaLocate sauvegardés.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          "Sauvegarde impossible."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Modes de paiement"
      subtitle="Configurez les numéros PharmaLocate pour les abonnements."
    >
      <PageCard title="Configuration plateforme">
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-semibold text-[#6B7280]">
            Chargement...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {methodFields.map((field) => (
                <label
                  key={field.name}
                  className="rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-4"
                >
                  <span className="text-sm font-black text-[#1C2B4A]">
                    {field.label}
                  </span>
                  <input
                    value={form[field.name] || ""}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    placeholder="Numéro de paiement"
                    className="mt-3 w-full rounded-xl border border-[#DDEBF0] bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-[#1C2B4A]">
                  Nom bénéficiaire
                </span>
                <input
                  value={form.beneficiary_name || ""}
                  onChange={(event) => updateField("beneficiary_name", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[#DDEBF0] px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(event) => updateField("is_active", event.target.checked)}
                  className="h-4 w-4 accent-[#2FA6A3]"
                />
                <span className="text-sm font-bold text-[#1C2B4A]">
                  Activer les paiements d'abonnement
                </span>
              </label>
            </div>

            <label>
              <span className="text-sm font-bold text-[#1C2B4A]">
                Instructions de paiement
              </span>
              <textarea
                value={form.payment_instructions || ""}
                onChange={(event) => updateField("payment_instructions", event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                placeholder="Ex: Envoyez le montant puis renseignez l'ID transaction."
              />
            </label>

            {message && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#2F6E9E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#245A82] disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </form>
        )}
      </PageCard>
    </AdminLayout>
  );
}

export default AdminPlatformPaymentMethods;
