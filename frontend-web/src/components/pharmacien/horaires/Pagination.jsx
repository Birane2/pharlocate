import Button from "../../ui/Button";

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  loading = false,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-pharmaBorder bg-pharmaSurface px-5 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-pharmaTextLight">
        Page {currentPage} sur {totalPages} - {pageSize} horaire(s) par page
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="px-4 py-2"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          className="px-4 py-2"
          disabled={!hasNext || loading}
          onClick={onNext}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
