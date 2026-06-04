import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const tones = {
  blue: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
  turquoise: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
  green: "bg-[#5EC6B8]/18 text-[#167769]",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-600",
};

function CompactStatCard({ icon, label, value, tone = "blue" }) {
  return (
    <article className="dashboard-reveal rounded-2xl border border-pharmaBorder bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-black tracking-tight text-[#1C2B4A]">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#6B7280]">{label}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

export default CompactStatCard;
