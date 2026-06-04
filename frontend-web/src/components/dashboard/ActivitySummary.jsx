import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCalendarDays,
  faClock,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

const items = [
  {
    key: "hours",
    label: "Horaires configures",
    icon: faClock,
    to: "/pharmacien/horaires",
  },
  {
    key: "guard",
    label: "Jours de garde",
    icon: faCalendarDays,
    to: "/pharmacien/horaires",
  },
  {
    key: "reviews",
    label: "Avis clients",
    icon: faStar,
    to: "/pharmacien/avis",
  },
  {
    key: "weak",
    label: "Stocks faibles",
    icon: faBoxesStacked,
    to: "/pharmacien/stocks",
  },
];

function ActivitySummary({ horaires, avis, stocks }) {
  const values = {
    hours: horaires.total,
    guard: horaires.jours_garde,
    reviews: avis.total,
    weak: stocks.faibles,
  };

  return (
    <section className="dashboard-reveal rounded-2xl border border-pharmaBorder bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-[#1C2B4A]">Resume activite</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-3 py-3 transition hover:bg-[#2F6E9E]/7"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2F6E9E]/10 text-[#2F6E9E]">
              <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-lg font-black text-[#1C2B4A]">{values[item.key]}</p>
              <p className="text-[11px] font-medium text-[#6B7280]">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ActivitySummary;
