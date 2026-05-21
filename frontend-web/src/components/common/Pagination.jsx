import Button from "../ui/Button";

function buildVisiblePages(currentPage, totalPages) {
  const pages = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);

  if (start > 1) {
    pages.push(1);
  }

  if (start > 2) {
    pages.push("ellipsis-start");
  }

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.push(pageNumber);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis-end");
  }

  if (end < totalPages) {
    pages.push(totalPages);
  }

  return pages;
}

function Pagination({ page, totalPages, previous, next, loading, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = buildVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 px-4 py-4 shadow-[0_16px_36px_rgba(47,110,158,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-pharmaTextLight">
        Page <span className="font-bold text-pharmaText">{page}</span> sur{" "}
        <span className="font-bold text-pharmaText">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!previous || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Precedent
        </Button>

        {visiblePages.map((item) => {
          if (typeof item !== "number") {
            return (
              <span
                key={item}
                className="px-2 text-sm font-semibold text-[#6B7A99]"
              >
                ...
              </span>
            );
          }

          const isActive = item === page;

          return (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(item)}
              className={`min-w-10 rounded-2xl px-3 py-2 text-sm font-bold transition ${
                isActive
                  ? "bg-[#2F6E9E] text-white shadow-sm"
                  : "border border-[#E2E8F2] bg-white text-[#1C2B4A] hover:border-[#2F6E9E] hover:text-[#2F6E9E]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {item}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={!next || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
