import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

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

  return (
    <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2">
      <p className="text-xs font-semibold text-[#6B7280]">
        Page {currentPage} sur {totalPages}
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={disabled || !hasPrevious}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
          aria-label="Page precedente"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
          aria-label="Page suivante"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default StockPagination;
