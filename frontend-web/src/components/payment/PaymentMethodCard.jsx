import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronRight,
  faMobileScreenButton,
} from "@fortawesome/free-solid-svg-icons";
import bankilyLogo from "../../assets/payments/Bankily.png";
import masriviLogo from "../../assets/payments/Masrvi.png";
import sedadLogo from "../../assets/payments/sedad.png";

const METHOD_LOGOS = {
  bankily: bankilyLogo,
  masrivi: masriviLogo,
  sedad: sedadLogo,
};

function PaymentMethodCard({
  method,
  selected,
  onClick,
  onSelect,
  disabled = false,
}) {
  const logo = METHOD_LOGOS[method.code];
  const unavailable = !method.configured;
  const isDisabled = disabled || unavailable;

  const handleClick = () => {
    if (isDisabled) return;
    (onClick || onSelect)?.(method);
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-300 disabled:cursor-not-allowed ${
        selected
          ? "border-[#2FA6A3] bg-[#E8F7F3] shadow-sm"
          : unavailable
            ? "border-[#E2E8F2] bg-[#F8FAFC] opacity-70"
            : "border-[#E2E8F2] bg-white hover:-translate-y-0.5 hover:border-[#2F6E9E]/40 hover:shadow-sm"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white ${
          method.color || "from-[#2F6E9E] to-[#2FA6A3]"
        }`}
      >
        {logo ? (
          <img
            src={logo}
            alt={`Logo ${method.name}`}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <FontAwesomeIcon icon={faMobileScreenButton} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-sm font-black text-[#1C2B4A]">
            {method.name}
          </span>
          {selected && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2FA6A3] text-[10px] text-white">
              <FontAwesomeIcon icon={faCheck} />
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-[#6B7280]">
          {method.accountNumber || "Non configuré par la pharmacie"}
        </span>
      </span>

      <FontAwesomeIcon
        icon={faChevronRight}
        className={
          selected
            ? "text-[#2FA6A3]"
            : unavailable
              ? "text-[#CBD5E1]"
              : "text-[#94A3B8]"
        }
      />
    </button>
  );
}

export default PaymentMethodCard;
