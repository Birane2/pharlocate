import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const tones = {
  blue: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
  lightBlue: "bg-[#4A8BBE]/10 text-[#4A8BBE]",
  teal: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
  green: "bg-[#10B981]/10 text-[#047857]",
  orange: "bg-[#F59E0B]/12 text-[#B45309]",
  danger: "bg-[#EF4444]/10 text-[#DC2626]",
  purple: "bg-[#8B5CF6]/10 text-[#7C3AED]",
};

function AdminStatsCard({ label, value, helper, icon, tone = "blue" }) {
  const selectedTone = tones[tone] || tones.blue;

  return (
    <article className="min-h-[104px] rounded-2xl border border-[#E2E8F2] bg-white px-4 py-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-full items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selectedTone}`}>
          <FontAwesomeIcon icon={icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-[#1C2B4A]">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#6B7280]">{label}</p>
          {helper && <p className="mt-1 text-[11px] font-semibold text-[#94A3B8]">{helper}</p>}
        </div>
      </div>
    </article>
  );
}

export default AdminStatsCard;
