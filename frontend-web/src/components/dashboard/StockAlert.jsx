import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Pagination from "./Pagination";

function StockAlert({
  title,
  subtitle,
  items,
  tone = "warning",
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  const styles = {
    warning: {
      shell: "from-orange-50 to-white",
      icon: "bg-orange-100 text-orange-700",
      value: "text-orange-700",
      dot: "bg-orange-400",
    },
    danger: {
      shell: "from-red-50 to-white",
      icon: "bg-red-100 text-red-700",
      value: "text-red-600",
      dot: "bg-red-500",
    },
  };
  const style = styles[tone] || styles.warning;

  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
            Stocks
          </p>
          <h2 className="mt-1 text-xl font-black text-pharmaText">{title}</h2>
          <p className="mt-1 text-sm text-pharmaTextLight">{subtitle}</p>
        </div>
        <span className={`rounded-2xl p-3 ${style.icon}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl bg-pharmaSurface p-4 text-sm text-pharmaTextLight">
            Aucun element a signaler.
          </div>
        )}

        {items.map((stock) => (
          <article
            key={stock.id_stock || stock.id}
            className={`rounded-2xl bg-gradient-to-br p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-sm ${style.shell}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${style.dot}`} />
                <div>
                  <p className="font-black text-pharmaText">
                    {stock.medicament_nom || "Medicament"}
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${style.value}`}>
                    {stock.quantite} restant(s), seuil {stock.seuil_alerte}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPrevious={onPrevious}
        onNext={onNext}
      />

      <Link
        to="/pharmacien/stocks"
        className="mt-5 inline-flex rounded-xl bg-[#F5F7FA] px-4 py-2 text-sm font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
      >
        Gerer les stocks
      </Link>
    </section>
  );
}

export default StockAlert;
