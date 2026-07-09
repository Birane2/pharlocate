import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faCalendarCheck,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status) {
  const labels = {
    validee: "Validée",
    en_attente: "Attente",
    suspendue: "Suspendue",
    refusee: "Refusée",
    confirmee: "Confirmée",
    recuperee: "Récupérée",
    annulee: "Annulée",
  };
  return labels[status] || status || "Info";
}

function getStatusCls(status) {
  if (["refusee", "annulee", "suspendue"].includes(status))
    return "bg-[#EF4444]/10 text-[#DC2626]";
  if (status === "en_attente") return "bg-[#F59E0B]/10 text-[#B45309]";
  if (["validee", "confirmee", "recuperee"].includes(status))
    return "bg-[#10B981]/10 text-[#047857]";
  return "bg-[#2F6E9E]/10 text-[#2F6E9E]";
}

function ActivityTypeTag({ type }) {
  const isPharmacy = type === "pharmacy";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2F6E9E]/8 px-2 py-0.5 text-[10px] font-bold text-[#2F6E9E]">
      <FontAwesomeIcon icon={isPharmacy ? faHospital : faCalendarCheck} className="h-2.5 w-2.5" />
      {isPharmacy ? "Pharmacie" : "Réservation"}
    </span>
  );
}

export default function RecentActivities({ activities }) {
  const list = (activities || []).slice(0, 5);

  return (
    <section className="overflow-hidden rounded-xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F2] px-4 py-3">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt} className="h-3.5 w-3.5 text-[#6B7280]" />
          <h2 className="text-sm font-bold text-[#1C2B4A]">Activités récentes</h2>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#2F6E9E]/8 px-3 py-1 text-[10px] font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
        >
          Voir toutes les activités
        </button>
      </div>

      {list.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm font-semibold text-[#6B7280]">
          Aucune activité récente.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody>
                {list.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-2">
                      <ActivityTypeTag type={activity.type} />
                    </td>
                    <td className="max-w-xs px-4 py-2">
                      <p className="text-[11px] font-bold">{activity.title}</p>
                      <p className="truncate text-[10px] font-semibold text-[#6B7280]">
                        {activity.description}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-[10px] font-bold text-[#6B7280]">
                      {formatDate(activity.date)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusCls(activity.status)}`}
                      >
                        {getStatusLabel(activity.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2 p-3 md:hidden">
            {list.map((activity) => (
              <article
                key={activity.id}
                className="rounded-xl border border-[#E2E8F2] px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#1C2B4A]">{activity.title}</p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[#6B7280]">
                      {activity.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusCls(activity.status)}`}
                  >
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <ActivityTypeTag type={activity.type} />
                  <span className="text-[10px] font-bold text-[#6B7280]">
                    {formatDate(activity.date)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
