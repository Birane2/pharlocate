/**
 * Composant Pagination PharmaLocate.
 *
 * Props :
 *   currentPage  — numéro de la page active (nombre, commence à 1)
 *   totalPages   — nombre total de pages
 *   onPageChange — callback appelé avec le nouveau numéro de page
 *
 * Comportement :
 *   - Affiche "Page X sur Y"
 *   - Desktop / tablette : ← Précédent | 1 2 3 4 5 | Suivant →
 *   - Mobile : ← Précédent | page active | Suivant →
 *   - Disparaît si totalPages ≤ 1
 */

function buildPageNumbers(current, total) {
  const MAX = 5;
  const safeTotal = Math.max(total || 1, 1);
  const safeCurrent = Math.min(Math.max(current || 1, 1), safeTotal);
  const half = Math.floor(MAX / 2);
  let start = Math.max(1, safeCurrent - half);
  const end = Math.min(safeTotal, start + MAX - 1);
  start = Math.max(1, end - MAX + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  const safeTotal = Math.max(totalPages || 1, 1);
  const safePage = Math.min(Math.max(currentPage || 1, 1), safeTotal);

  if (safeTotal <= 1) return null;

  const hasNext = safePage < safeTotal;
  const hasPrev = safePage > 1;
  const pages = buildPageNumbers(safePage, safeTotal);

  const go = (target) => {
    if (!onPageChange) return;
    const clamped = Math.min(Math.max(target, 1), safeTotal);
    if (clamped !== safePage) onPageChange(clamped);
  };

  return (
    <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-between">
      {/* Résumé — "Page X sur Y" */}
      <p className="text-xs font-semibold text-slate-500">
        Page{" "}
        <span className="font-black text-[#1C2B4A]">{safePage}</span>
        {" "}sur{" "}
        <span className="font-black text-[#1C2B4A]">{safeTotal}</span>
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-1.5">
        <PageBtn
          label="← Précédent"
          disabled={!hasPrev}
          onClick={() => go(safePage - 1)}
        />

        {/* Numéros de page — masqués sur mobile sauf la page active */}
        {pages.map((n) => (
          <span
            key={n}
            className={n === safePage ? "inline-flex" : "hidden sm:inline-flex"}
          >
            <PageBtn
              label={n}
              active={n === safePage}
              onClick={() => go(n)}
            />
          </span>
        ))}

        <PageBtn
          label="Suivant →"
          disabled={!hasNext}
          onClick={() => go(safePage + 1)}
        />
      </div>
    </div>
  );
}

function PageBtn({ label, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled || active}
      onClick={onClick}
      className={[
        "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3",
        "text-xs font-bold shadow-sm transition-all duration-150",
        active
          ? "bg-[#2F6E9E] text-white cursor-default shadow-md"
          : disabled
            ? "border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-40"
            : "border border-slate-200 bg-white text-slate-600 hover:border-[#2F6E9E] hover:text-[#2F6E9E]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
