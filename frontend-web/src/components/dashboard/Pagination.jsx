function Pagination({ page, totalPages, onPrevious, onNext }) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-pharmaBorder pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold text-pharmaTextLight">
        Page {page} sur {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="rounded-xl border border-pharmaBorder px-4 py-2 font-semibold text-pharmaText transition hover:border-[#0085AA] hover:text-[#0085AA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Precedent
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded-xl bg-gradient-to-r from-[#2F6E9E] to-[#1681FF] px-4 py-2 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

export default Pagination;
