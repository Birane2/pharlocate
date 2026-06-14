import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCreditCard,
  faMobileScreenButton,
  faSave,
  faToggleOff,
  faToggleOn,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import {
  getPharmacienPaymentMethods,
  updatePharmacienPaymentMethods,
} from "../../services/financeService";

const initialForm = {
  bankily_number: "",
  masrivi_number: "",
  click_number: "",
  sedad_number: "",
  bci_pay_number: "",
  is_active: true,
};

const paymentFields = [
  {
    key: "bankily_number",
    label: "Bankily",
    hint: "Numero Bankily de la pharmacie",
  },
  {
    key: "masrivi_number",
    label: "Masrvi",
    hint: "Numero Masrvi de la pharmacie",
  },
  {
    key: "click_number",
    label: "Click",
    hint: "Numero Click de la pharmacie",
  },
  {
    key: "sedad_number",
    label: "Sedad",
    hint: "Numero Sedad de la pharmacie",
  },
  {
    key: "bci_pay_number",
    label: "BCI Pay",
    hint: "Numero BCI Pay de la pharmacie",
  },
];

function PaymentMethodsConfig() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const configuredCount = useMemo(
    () =>
      paymentFields.filter((field) => form[field.key]?.trim()).length,
    [form]
  );

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPharmacienPaymentMethods();
      setForm({
        bankily_number: data.bankily_number || "",
        masrivi_number: data.masrivi_number || "",
        click_number: data.click_number || "",
        sedad_number: data.sedad_number || "",
        bci_pay_number: data.bci_pay_number || "",
        is_active: data.is_active !== false,
      });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Impossible de charger les methodes de paiement."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitial = async () => {
      try {
        const data = await getPharmacienPaymentMethods();

        if (ignore) {
          return;
        }

        setForm({
          bankily_number: data.bankily_number || "",
          masrivi_number: data.masrivi_number || "",
          click_number: data.click_number || "",
          sedad_number: data.sedad_number || "",
          bci_pay_number: data.bci_pay_number || "",
          is_active: data.is_active !== false,
        });
      } catch (err) {
        if (ignore) {
          return;
        }

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Impossible de charger les methodes de paiement."
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      ignore = true;
    };
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await updatePharmacienPaymentMethods(form);
      const data = response.payment_methods || response;
      setForm({
        bankily_number: data.bankily_number || "",
        masrivi_number: data.masrivi_number || "",
        click_number: data.click_number || "",
        sedad_number: data.sedad_number || "",
        bci_pay_number: data.bci_pay_number || "",
        is_active: data.is_active !== false,
      });
      setSuccess("Methodes de paiement mises a jour avec succes.");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Impossible d'enregistrer les methodes de paiement."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PharmacienLayout
      title="Methodes de paiement"
      headerSubtitle="Configurez les numeros affiches aux patients."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-[#E2E8F2] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#2FA6A3]">
                Paiement mobile manuel
              </p>
              <h2 className="mt-1 text-xl font-black text-[#1C2B4A]">
                Numeros de reception
              </h2>
              <p className="mt-1 text-sm font-medium text-[#6B7280]">
                Les patients verront uniquement les moyens renseignes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateField("is_active", !form.is_active)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black shadow-sm transition ${
                form.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <FontAwesomeIcon icon={form.is_active ? faToggleOn : faToggleOff} />
              {form.is_active ? "Actif" : "Masque"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] p-8 text-center text-sm font-bold text-[#6B7280]">
              Chargement des methodes de paiement...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {paymentFields.map((field) => (
                  <label
                    key={field.key}
                    className="rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-4"
                  >
                    <span className="flex items-center gap-2 text-sm font-black text-[#1C2B4A]">
                      <FontAwesomeIcon
                        icon={faMobileScreenButton}
                        className="text-[#2F6E9E]"
                      />
                      {field.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#6B7280]">
                      {field.hint}
                    </span>
                    <input
                      value={form[field.key]}
                      onChange={(event) =>
                        updateField(field.key, event.target.value)
                      }
                      placeholder="+222..."
                      className="mt-3 w-full rounded-xl border border-[#D8E3EE] bg-white px-3 py-2 text-sm font-bold text-[#1C2B4A] outline-none transition focus:border-[#2F6E9E] focus:ring-4 focus:ring-[#2F6E9E]/10"
                    />
                  </label>
                ))}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  {success}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={load}
                  className="rounded-xl border border-[#D8E3EE] bg-white px-4 py-2 text-sm font-black text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                >
                  Recharger
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2F6E9E] px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255C86] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="rounded-2xl border border-[#E2E8F2] bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <h3 className="mt-4 text-lg font-black text-[#1C2B4A]">
            Resume
          </h3>
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">
            {configuredCount} methode(s) mobile money configuree(s).
          </p>
          <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
              Visibilite patients
            </p>
            <p
              className={`mt-2 text-sm font-black ${
                form.is_active ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {form.is_active
                ? "Les methodes configurees sont visibles."
                : "Les methodes sont masquees."}
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold leading-5 text-[#6B7280]">
            Les paiements mobiles restent manuels : le patient paie depuis son
            application, puis ajoute une reference ou une capture. Vous validez
            ensuite le paiement dans la page Paiements.
          </p>
        </aside>
      </div>
    </PharmacienLayout>
  );
}

export default PaymentMethodsConfig;
