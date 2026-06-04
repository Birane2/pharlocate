import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";

const statusOptions = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponibles" },
  { value: "faible", label: "Stocks faibles" },
  { value: "rupture", label: "Ruptures" },
];

function StockFilters({
  statusFilter,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onStatusChange(option.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            statusFilter === option.value
              ? "bg-[#2F6E9E] text-white shadow-sm"
              : "bg-[#2F6E9E]/8 text-[#2F6E9E] hover:bg-[#2F6E9E]/14"
          }`}
        >
          {option.label}
        </button>
      ))}

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:bg-[#F1F5F9]"
      >
        <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
        Reset
      </button>
    </div>
  );
}

export default StockFilters;
