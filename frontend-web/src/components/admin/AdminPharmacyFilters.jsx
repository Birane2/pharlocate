import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const filters = [
  { label: "Toutes", value: "" },
  { label: "Validees", value: "validee" },
  { label: "En attente", value: "en_attente" },
  { label: "Suspendues", value: "suspendue" },
];

function AdminPharmacyFilters({
  search,
  statutValidation,
  loading = false,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <section className="rounded-2xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F6E9E]/55"
          />
          <input
            value={search}
            disabled={loading}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher par nom, adresse, telephone ou pharmacien..."
            className="w-full rounded-xl border border-[#2F6E9E]/15 bg-white py-2.5 pl-10 pr-3 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
          {filters.map((filter) => {
            const active = statutValidation === filter.value;

            return (
              <button
                key={filter.label}
                type="button"
                disabled={loading}
                onClick={() => onStatusChange(filter.value)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "bg-[#2F6E9E] text-white shadow-sm"
                    : "bg-[#2F6E9E]/8 text-[#2F6E9E] hover:bg-[#2F6E9E]/14"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AdminPharmacyFilters;
