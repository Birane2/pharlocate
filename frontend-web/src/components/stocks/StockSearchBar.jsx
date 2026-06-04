import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function StockSearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F6E9E]/55"
      />
      <input
        value={value}
        onChange={onChange}
        placeholder="Rechercher un medicament..."
        className="w-full rounded-xl border border-[#2F6E9E]/15 bg-white py-2.5 pl-10 pr-3 text-sm text-[#1F2937] outline-none transition duration-200 placeholder:text-[#6B7280]/70 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
      />
    </div>
  );
}

export default StockSearchBar;
