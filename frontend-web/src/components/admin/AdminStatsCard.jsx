import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const tones = {
  blue: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
  lightBlue: "bg-[#4A8BBE]/10 text-[#4A8BBE]",
  teal: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
  green: "bg-[#10B981]/10 text-[#047857]",
  orange: "bg-[#F59E0B]/10 text-[#B45309]",
  danger: "bg-[#EF4444]/10 text-[#DC2626]",
  purple: "bg-[#8B5CF6]/10 text-[#7C3AED]",
};

function AdminStatsCard({ label, value, helper, icon, tone = "blue" }) {
  const selectedTone = tones[tone] || tones.blue;

  return (
    <article className="rounded-xl border border-[#E2E8F2] bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selectedTone}`}
        >
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-extrabold tracking-tight text-[#1C2B4A]">{value}</p>
          <p className="truncate text-[10px] font-semibold text-[#6B7280]">{label}</p>
          {helper && (
            <p className="truncate text-[10px] font-semibold text-[#94A3B8]">{helper}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default AdminStatsCard;
