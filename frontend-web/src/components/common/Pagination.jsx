import Button from "../ui/Button";

function Pagination({ page, totalPages, previous, next, loading, onPageChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 px-4 py-3 shadow-[0_16px_36px_rgba(47,110,158,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-pharmaTextLight">
        Page <span className="font-bold text-pharmaText">{page}</span> sur{" "}
        <span className="font-bold text-pharmaText">{totalPages}</span>
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!previous || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </Button>
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
