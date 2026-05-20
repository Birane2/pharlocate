import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort, faFilter, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";

const statusOptions = [
  { value: "all", label: "Tous" },
  { value: "disponible", label: "Disponible" },
  { value: "faible", label: "Faible stock" },
  { value: "rupture", label: "Rupture" },
];



function StockFilters({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset,
  showSort = true,
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-black tracking-tight text-[#1F2937]">
          <FontAwesomeIcon icon={faFilter} className="text-[#2F6E9E]" />
          Filtres de statut
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                statusFilter === option.value
                  ? "bg-[#2F6E9E] text-white shadow-[0_12px_24px_rgba(47,110,158,0.22)]"
                  : "bg-[#2F6E9E]/8 text-[#2F6E9E] hover:bg-[#2F6E9E]/14"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {showSort && (
          <div className="min-w-[220px]">
            <label className="mb-2 flex items-center gap-2 text-sm font-black tracking-tight text-[#1F2937]">
              <FontAwesomeIcon icon={faArrowDownWideShort} className="text-[#2F6E9E]" />
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
              className="w-full rounded-2xl border border-[#2F6E9E]/15 bg-white px-4 py-3 text-[#1F2937] outline-none transition duration-200 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type="button" variant="ghost" size="sm" icon={faRotateLeft} onClick={onReset}>
          Reinitialiser
        </Button>
      </div>
    </div>
  );
}

export default StockFilters;
