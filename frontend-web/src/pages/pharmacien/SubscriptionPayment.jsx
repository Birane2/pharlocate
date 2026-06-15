import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard } from "../finance/FinanceUI";
import {
  getPlatformPaymentMethods,
  sendSubscriptionPayment,
} from "../../services/financeService";

function SubscriptionPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subscriptionId = params.get("subscription");

  const [config, setConfig] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPlatformPaymentMethods()
      .then((data) => {
        setConfig(data);
        setSelectedMethod(data.methods?.[0]?.code || "");
      })
      .catch(() => setError("Impossible de charger les modes de paiement PharmaLocate."))
      .finally(() => setLoading(false));
  }, []);

  const methods = useMemo(() => config?.methods || [], [config]);
  const selected = useMemo(
    () => methods.find((method) => method.code === selectedMethod),
    [methods, selectedMethod]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!subscriptionId) {
      setError("Abonnement introuvable. Choisissez d'abord un plan.");
      return;
    }
    if (!selectedMethod) {
      setError("Veuillez choisir une méthode de paiement.");
      return;
    }
    if (!transactionId.trim()) {
      setError("Veuillez renseigner l'ID transaction.");
      return;
    }

    const formData = new FormData();
    formData.append("subscription", subscriptionId);
    formData.append("payment_method", selectedMethod);
    formData.append("transaction_id", transactionId.trim());
    if (proofImage) {
      formData.append("proof_image", proofImage);
    }

    setSending(true);
    try {
      await sendSubscriptionPayment(formData);
      setMessage("Paiement envoyé. L'administration va le vérifier.");
      setTimeout(() => navigate("/pharmacien/subscription"), 900);
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(
        data?.detail ||
          data?.payment_method ||
          data?.subscription ||
          "Envoi du paiement impossible."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <PharmacienLayout
      title="Paiement abonnement"
      headerSubtitle="Payez PharmaLocate et envoyez votre preuve."
    >
      <div className="space-y-4">
        <PageCard title="Modes de paiement PharmaLocate">
          {loading ? (
            <p className="text-sm font-semibold text-[#6B7280]">Chargement...</p>
          ) : methods.length === 0 ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
              Aucun mode de paiement PharmaLocate n'est disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {methods.map((method) => (
                <button
                  key={method.code}
                  type="button"
                  onClick={() => setSelectedMethod(method.code)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedMethod === method.code
                      ? "border-[#2FA6A3] bg-[#2FA6A3]/8 shadow-sm"
                      : "border-[#E2E8F2] bg-white hover:border-[#2F6E9E]/40"
                  }`}
                >
                  <p className="text-base font-black text-[#1C2B4A]">
                    {method.label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#2F6E9E]">
                    {method.number}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                    {method.beneficiary_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </PageCard>

        <PageCard title="Envoyer la preuve">
          {selected?.instructions && (
            <div className="mb-4 rounded-2xl bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7280]">
              {selected.instructions}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label>
              <span className="text-sm font-bold text-[#1C2B4A]">
                ID transaction
              </span>
              <input
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                placeholder="Ex: BK-2026-0001"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-[#1C2B4A]">
                Capture paiement
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setProofImage(event.target.files?.[0] || null)}
                className="mt-2 w-full rounded-xl border border-[#DDEBF0] px-3 py-2 text-sm font-semibold"
              />
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={sending || methods.length === 0}
                className="rounded-xl bg-[#2F6E9E] px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
              >
                {sending ? "Envoi..." : "Envoyer la demande"}
              </button>
              <Link
                to="/pharmacien/subscription"
                className="rounded-xl border border-[#DDEBF0] px-5 py-3 text-sm font-black text-[#2F6E9E]"
              >
                Retour
              </Link>
            </div>
          </form>
        </PageCard>
      </div>
    </PharmacienLayout>
  );
}

export default SubscriptionPayment;
