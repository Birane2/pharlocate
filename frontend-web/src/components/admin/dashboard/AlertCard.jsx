import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const TONES = {
  danger: "bg-red-50 border-red-200 text-[#DC2626]",
  orange: "bg-orange-50 border-orange-200 text-[#D97706]",
  yellow: "bg-yellow-50 border-yellow-100 text-[#B45309]",
  blue: "bg-blue-50 border-blue-100 text-[#2563EB]",
};

export default function AlertCard({ label, value, icon, tone = "blue", to }) {
  const cls = TONES[tone] ?? TONES.blue;

  const inner = (
    <article
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm ${cls}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">{value}</p>
          <p className="truncate text-[10px] font-semibold text-[#1C2B4A]">{label}</p>
        </div>
      </div>
      <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 shrink-0 opacity-60" />
    </article>
  );

  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}
