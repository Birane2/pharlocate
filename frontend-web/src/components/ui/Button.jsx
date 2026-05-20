import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const variants = {
  primary:
    "bg-[#2F6E9E] text-white shadow-sm hover:bg-[#1F5B87]",
  secondary:
    "bg-[#2FA6A3] text-white shadow-sm hover:bg-[#248C8A]",
  danger:
    "bg-red-500 text-white shadow-sm hover:bg-red-600",
  outline:
    "border border-[#2F6E9E] bg-white text-[#2F6E9E] shadow-sm hover:bg-[#2F6E9E] hover:text-white",
  ghost:
    "border border-[#E2E8F2] bg-white text-[#0B1E3D] shadow-sm hover:border-[#2F6E9E] hover:bg-[#F0F5FB]",
};

const sizes = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-6 py-3 text-base",
};

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;
  const iconNode = loading ? faSpinner : icon;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#2FA6A3]/18 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {iconNode && iconPosition === "left" && (
        <FontAwesomeIcon icon={iconNode} className={loading ? "animate-spin" : ""} />
      )}
      <span>{loading ? "Chargement..." : children}</span>
      {iconNode && iconPosition === "right" && (
        <FontAwesomeIcon icon={iconNode} className={loading ? "animate-spin" : ""} />
      )}
    </button>
  );
}

export default Button;
