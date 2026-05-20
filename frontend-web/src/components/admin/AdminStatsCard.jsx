import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const tones = {
  blue: "from-[#2F6E9E] to-[#1681FF] text-[#2F6E9E]",
  teal: "from-[#2FA6A3] to-[#35C3A3] text-[#2FA6A3]",
  green: "from-[#35C3A3] to-[#5EC6B8] text-[#13795f]",
  orange: "from-orange-400 to-amber-300 text-orange-700",
  danger: "from-red-500 to-rose-400 text-red-600",
};

function AdminStatsCard({ label, value, helper, icon, tone = "blue" }) {
  const selectedTone = tones[tone] || tones.blue;

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 p-5 shadow-[0_18px_44px_rgba(47,110,158,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(0,133,170,0.16)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${selectedTone}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium leading-5 text-[#6B7280]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937]">
            {value}
          </p>
          {helper && <p className="mt-2 text-sm font-normal leading-5 text-[#6B7280]">{helper}</p>}
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-current/10 ${selectedTone.split(" ").at(-1)}`}>
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export default AdminStatsCard;
