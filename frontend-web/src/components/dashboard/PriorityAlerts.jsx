import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBoxOpen,
  faCalendarCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const alerts = [
  {
    key: "pending",
    label: "Reservations en attente",
    icon: faCalendarCheck,
    tone: "border-[#2F6E9E]/15 bg-[#2F6E9E]/5 text-[#2F6E9E]",
    to: "/pharmacien/reservations",
  },
  {
    key: "weak",
    label: "Stocks faibles",
    icon: faTriangleExclamation,
    tone: "border-orange-200 bg-orange-50 text-orange-700",
    to: "/pharmacien/stocks",
  },
  {
    key: "rupture",
    label: "Ruptures",
    icon: faBoxOpen,
    tone: "border-red-200 bg-red-50 text-red-600",
    to: "/pharmacien/stocks",
  },
];

function PriorityAlerts({ reservations, stocks }) {
  const values = {
    pending: reservations.en_attente,
    weak: stocks.faibles,
    rupture: stocks.rupture,
  };

  return (
    <section className="dashboard-reveal rounded-2xl border border-pharmaBorder bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2FA6A3]">
            Priorites
          </p>
          <h2 className="mt-1 text-base font-bold text-[#1C2B4A]">
            Alertes operationnelles
          </h2>
        </div>
        <span className="rounded-lg bg-[#2FA6A3]/10 p-1.5 text-[#2FA6A3]">
          <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {alerts.map((alert) => (
          <Link
            key={alert.key}
            to={alert.to}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm ${alert.tone}`}
          >
            <FontAwesomeIcon icon={alert.icon} className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{alert.label}</p>
              <p className="mt-0.5 text-xl font-black">{values[alert.key]}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PriorityAlerts;
