import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

const variants = {
  success: {
    className: "bg-[#5EC6B8]/18 text-[#167769] ring-[#5EC6B8]/30",
    icon: faCircleCheck,
  },
  active: {
    className: "bg-[#5EC6B8]/18 text-[#167769] ring-[#5EC6B8]/30",
    icon: faCircleCheck,
  },
  warning: {
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: faClock,
  },
  danger: {
    className: "bg-red-50 text-red-600 ring-red-100",
    icon: faCircleExclamation,
  },
  info: {
    className: "bg-[#2FA6A3]/10 text-[#2FA6A3] ring-[#2FA6A3]/20",
    icon: faCircleInfo,
  },
  blue: {
    className: "bg-[#2F6E9E]/10 text-[#2F6E9E] ring-[#2F6E9E]/20",
    icon: faCircleInfo,
  },
};

function Badge({ children, variant = "success", icon, showIcon = false, className = "" }) {
  const selected = variants[variant] || variants.success;
  const iconDefinition = icon || selected.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${selected.className} ${className}`}
    >
      {showIcon && <FontAwesomeIcon icon={iconDefinition} className="h-3 w-3" />}
      {children}
    </span>
  );
}

export default Badge;
