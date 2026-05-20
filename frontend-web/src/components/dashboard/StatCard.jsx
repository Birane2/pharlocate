import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCalendarCheck,
  faChartLine,
  faClock,
  faExclamationTriangle,
  faHeartPulse,
  faPills,
  faReceipt,
  faStar,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";

const toneMap = {
  blue: {
    shell: "border-[#2F6E9E]/15 bg-white/90",
    icon: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
    accent: "from-[#2F6E9E] to-[#4A8BBE]",
  },
  cyan: {
    shell: "border-[#0085AA]/15 bg-white/90",
    icon: "bg-[#0085AA]/10 text-[#0085AA]",
    accent: "from-[#0085AA] to-[#1681FF]",
  },
  teal: {
    shell: "border-[#2FA6A3]/15 bg-white/90",
    icon: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
    accent: "from-[#2FA6A3] to-[#35C3A3]",
  },
  green: {
    shell: "border-[#35C3A3]/15 bg-white/90",
    icon: "bg-[#35C3A3]/10 text-[#16815f]",
    accent: "from-[#35C3A3] to-[#5EC6B8]",
  },
  danger: {
    shell: "border-red-100 bg-white/90",
    icon: "bg-red-50 text-red-600",
    accent: "from-red-500 to-orange-400",
  },
  warning: {
    shell: "border-orange-100 bg-white/90",
    icon: "bg-orange-50 text-orange-600",
    accent: "from-orange-400 to-amber-300",
  },
};

const iconMap = {
  stock: faBoxOpen,
  available: faPills,
  rupture: faExclamationTriangle,
  weak: faHeartPulse,
  reservation: faReceipt,
  confirmed: faCalendarCheck,
  recovered: faTruckFast,
  calendar: faClock,
  review: faStar,
  trend: faChartLine,
};

function useCountUp(value, duration = 700) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const startTime = performance.now();
    const target = Number(value) || 0;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return displayValue;
}

function StatCard({ label, value, helper, tone = "blue", icon = "stock", suffix = "" }) {
  const tones = toneMap[tone] || toneMap.blue;
  const animatedValue = useCountUp(value);
  const iconDefinition = iconMap[icon] || iconMap.trend;

  return (
    <article
      className={`dashboard-reveal group relative overflow-hidden rounded-3xl border p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(0,133,170,0.18)] ${tones.shell}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tones.accent}`} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-white/20 to-[#35C3A3]/10 opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-pharmaTextLight">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-pharmaText">
            {animatedValue}
            {suffix}
          </p>
          <p className="mt-2 text-sm text-pharmaTextLight">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-105 ${tones.icon}`}>
          <FontAwesomeIcon icon={iconDefinition} className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export default StatCard;
