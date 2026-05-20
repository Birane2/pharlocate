import Button from "../ui/Button";

function StockPagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 px-4 py-4 shadow-[0_16px_36px_rgba(47,110,158,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-pharmaTextLight">
        Page <span className="font-black text-pharmaText">{currentPage}</span> sur{" "}
        <span className="font-black text-pharmaText">{totalPages}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !hasPrevious}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Precedent
        </Button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(pageNumber)}
            className={`min-w-10 rounded-xl px-3 py-2 text-sm font-black transition ${
              pageNumber === currentPage
                ? "bg-[#2F6E9E] text-white shadow-[0_12px_26px_rgba(47,110,158,0.22)]"
                : "bg-[#2F6E9E]/8 text-[#2F6E9E] hover:bg-[#2F6E9E]/14"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {pageNumber}
          </button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export default StockPagination;
