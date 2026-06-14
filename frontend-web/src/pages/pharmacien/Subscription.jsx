import { useEffect, useState } from "react";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import { PageCard, StatusBadge } from "../finance/FinanceUI";
import { money } from "../finance/financeFormat";
import { cancelSubscription, getPharmacienSubscription, getSubscriptionPlans, subscribeToPlan } from "../../services/financeService";

function Subscription() {
  const [current, setCurrent] = useState(null);
  const [plans, setPlans] = useState([]);

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

  return (
    <PharmacienLayout title="Abonnement" headerSubtitle="Gerez votre plan PharmaLocate">
      <div className="space-y-4">
        <PageCard title="Plan actuel">
          <p className="text-2xl font-black text-[#1C2B4A]">{current?.subscription?.plan_detail?.nom || "-"}</p>
          <div className="mt-2"><StatusBadge status={current?.subscription?.statut} /></div>
        </PageCard>
        <section className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-[#1C2B4A]">{plan.nom}</h3>
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">{plan.description}</p>
              <p className="mt-4 text-2xl font-black text-[#2F6E9E]">{money(plan.prix_mensuel)} / mois</p>
              <button onClick={() => subscribeToPlan({ plan: plan.id }).then(load)} className="mt-4 w-full rounded-xl bg-[#2F6E9E] px-3 py-2 text-sm font-bold text-white">
                Choisir ce plan
              </button>
            </article>
          ))}
        </section>
        {current?.subscription?.id && (
          <button onClick={() => cancelSubscription(current.subscription.id).then(load)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
            Annuler mon abonnement
          </button>
        )}
      </div>
    </PharmacienLayout>
  );
}

export default Subscription;
