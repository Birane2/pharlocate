import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { dateOnly, money } from "../finance/financeFormat";
import {
  cancelSubscription,
  getPharmacienSubscription,
  getSubscriptionPlans,
  requestSubscriptionRefund,
  subscribeToPlan,
} from "../../services/financeService";

function Subscription() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setCurrent(await getPharmacienSubscription());
    setPlans(await getSubscriptionPlans());
  };

  useEffect(() => {
    Promise.all([getPharmacienSubscription(), getSubscriptionPlans()]).then(
      ([subscription, availablePlans]) => {
        setCurrent(subscription);
        setPlans(availablePlans);
      }
    );
  }, []);

  const handleChoosePlan = async (plan) => {
    setLoadingPlanId(plan.id);
    setError("");
    setMessage("");
    try {
      const response = await subscribeToPlan({ plan: plan.id });
      const subscriptionId = response.subscription?.id;
      if (plan.is_free) {
        await load();
        return;
      }
      navigate(`/pharmacien/subscription/payment?subscription=${subscriptionId}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          "Impossible de choisir ce plan."
      );
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleRenew = () => {
    if (!currentPlan) return;
    handleChoosePlan(currentPlan);
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError("");
    setMessage("");
    try {
      const response = await cancelSubscription();
      setMessage(response.message || "Annulation abonnement enregistree.");
      setShowCancelModal(false);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          "Impossible d'annuler cet abonnement."
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!activeSubscription?.latest_payment_id) {
      setError("Aucun paiement valide disponible pour une demande de remboursement.");
      return;
    }

    const reason = window.prompt("Motif de la demande de remboursement");
    if (!reason) {
      return;
    }

    setRequestingRefund(true);
    setError("");
    setMessage("");
    try {
      const response = await requestSubscriptionRefund({
        subscription_payment: activeSubscription.latest_payment_id,
        reason,
      });
      setMessage(response.message || "Demande de remboursement envoyee.");
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          requestError.response?.data?.subscription_payment ||
          "Impossible d'envoyer la demande de remboursement."
      );
    } finally {
      setRequestingRefund(false);
    }
  };

  const activeSubscription = current?.subscription;
  const currentPlan = activeSubscription?.plan_detail;
  const isPaidPlan = currentPlan && !currentPlan.is_free;
  const isCancelled = activeSubscription?.statut === "annulee";
  const isExpired = activeSubscription?.statut === "expiree";
  const isActive = activeSubscription?.statut === "active";

  return (
    <PharmacienLayout title="Abonnement" headerSubtitle="Gerez votre plan PharmaLocate">
      <div className="space-y-4">
        {/* Bannière expiration */}
        {isExpired && isPaidPlan && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-red-800">
                Abonnement {currentPlan?.nom} expire
              </p>
              <p className="mt-1 text-xs font-semibold text-red-600">
                Renouvelez votre abonnement pour continuer a beneficier de votre plan.
                {activeSubscription?.expired_at && (
                  <> Expire le {dateOnly(activeSubscription.expired_at)}.</>
                )}
              </p>
            </div>
            <button
              onClick={handleRenew}
              disabled={loadingPlanId === currentPlan?.id}
              className="shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-60"
            >
              {loadingPlanId === currentPlan?.id ? "Preparation..." : "Renouveler mon abonnement"}
            </button>
          </div>
        )}

        <PageCard title="Plan actuel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-2xl font-black text-[#1C2B4A]">
                {currentPlan?.nom || "-"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={activeSubscription?.statut} />
                {isCancelled && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    Annulation programmee
                  </span>
                )}
                {isExpired && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                    Renouvellement requis
                  </span>
                )}
                {activeSubscription?.commission_rate && (
                  <span className="rounded-full bg-[#2F6E9E]/10 px-3 py-1 text-xs font-black text-[#2F6E9E]">
                    Commission {Number(activeSubscription.commission_rate * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-1 text-sm font-semibold text-[#6B7280] lg:text-right">
              <span>Debut : {dateOnly(activeSubscription?.date_debut)}</span>
              <span>
                Expiration :{" "}
                {activeSubscription?.date_fin
                  ? dateOnly(activeSubscription.date_fin)
                  : "Illimitee"}
              </span>
              {isCancelled && (
                <span>Actif jusqu'au : {dateOnly(activeSubscription?.cancel_effective_at)}</span>
              )}
              {isExpired && activeSubscription?.expired_at && (
                <span className="text-red-500">
                  Expire le : {dateOnly(activeSubscription.expired_at)}
                </span>
              )}
            </div>
          </div>

          {isCancelled && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              Votre abonnement reste actif jusqu'a sa date d'expiration. Aucun
              remboursement automatique ne sera effectue.
            </div>
          )}
        </PageCard>

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

        <section className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-[#1C2B4A]">{plan.nom}</h3>
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">{plan.description}</p>
              <p className="mt-4 text-2xl font-black text-[#2F6E9E]">
                {money(plan.prix_mensuel)} / mois
              </p>
              <p className="mt-1 text-xs font-black text-[#2FA6A3]">
                Commission {Number(plan.commission_rate * 100).toFixed(0)}%
              </p>
              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm font-semibold text-[#6B7280]">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => handleChoosePlan(plan)}
                disabled={loadingPlanId === plan.id}
                className="mt-4 w-full rounded-xl bg-[#2F6E9E] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {loadingPlanId === plan.id ? "Preparation..." : "Choisir ce plan"}
              </button>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          {isPaidPlan && isActive && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Annuler mon abonnement
            </button>
          )}
          {isPaidPlan && isExpired && (
            <button
              onClick={handleRenew}
              disabled={loadingPlanId === currentPlan?.id}
              className="rounded-xl bg-[#2F6E9E] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {loadingPlanId === currentPlan?.id ? "Preparation..." : "Renouveler mon abonnement"}
            </button>
          )}
          {isPaidPlan && isCancelled && activeSubscription?.can_request_refund && (
            <button
              onClick={handleRefundRequest}
              disabled={requestingRefund}
              className="rounded-xl border border-[#DDEBF0] bg-white px-4 py-2 text-sm font-bold text-[#2F6E9E] disabled:opacity-60"
            >
              {requestingRefund ? "Envoi..." : "Demander un remboursement"}
            </button>
          )}
          {currentPlan?.is_free && (
            <span className="rounded-xl bg-[#F8FAFC] px-4 py-2 text-sm font-bold text-[#6B7280]">
              Plan Gratuit non annulable.
            </span>
          )}
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-black text-[#1C2B4A]">
                Annuler l'abonnement ?
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#6B7280]">
                Votre abonnement restera actif jusqu'a sa date d'expiration. Aucun
                remboursement automatique ne sera effectue. Vous pourrez envoyer une
                demande separee si necessaire.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-xl border border-[#DDEBF0] px-4 py-2 text-sm font-black text-[#2F6E9E]"
                >
                  Garder mon abonnement
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                >
                  {cancelling ? "Annulation..." : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PharmacienLayout>
  );
}

export default Subscription;
