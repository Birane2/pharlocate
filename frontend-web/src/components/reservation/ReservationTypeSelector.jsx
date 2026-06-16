import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faTruckFast } from "@fortawesome/free-solid-svg-icons";

const options = [
  {
    value: "retrait",
    title: "Retrait",
    description: "Je recupere a la pharmacie.",
    icon: faBagShopping,
  },
  {
    value: "livraison",
    title: "Livraison",
    description: "Livraison a domicile.",
    icon: faTruckFast,
  },
];

function ReservationTypeSelector({ value, onChange, disabled = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`group rounded-2xl border p-3 text-left transition duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? "border-[#2FA6A3] bg-[#E8F7F3] shadow-sm"
                : "border-[#E2E8F2] bg-white hover:-translate-y-0.5 hover:border-[#2F6E9E]/40 hover:shadow-sm"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                selected ? "bg-[#2FA6A3] text-white" : "bg-[#F0F5FB] text-[#2F6E9E]"
              }`}
            >
              <FontAwesomeIcon icon={option.icon} />
            </span>
            <span className="mt-2 block text-sm font-black text-[#1C2B4A]">
              {option.title}
            </span>
            <span className="mt-1 block text-xs font-semibold text-[#6B7280]">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default ReservationTypeSelector;
