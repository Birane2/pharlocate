import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import StockFilters from "./StockFilters";
import StockPagination from "./StockPagination";
import StockSearchBar from "./StockSearchBar";
import EmptyStockState from "./EmptyStockState";
import Card from "../ui/Card";
import StockStatusBadge from "./StockStatusBadge";

function getMedicament(stock) {
  return stock.medicament_data || stock.medicament || {};
}

function formatPrice(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)} MRU`;
}

function ActionButton({ label, tone = "blue", icon, loading = false, onClick }) {
  const toneClass =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50 focus:ring-red-100"
      : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8 focus:ring-[#2F6E9E]/15";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={loading}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

function StockTable({
  stocks,
  onEdit,
  onDelete,
  deletingStockId,
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              <th className="px-4 py-3">Medicament</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Quantite</th>
              <th className="px-4 py-3">Prix MRU</th>
              <th className="px-4 py-3">Seuil</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const medicament = getMedicament(stock);
              const stockId = stock.id_stock || stock.id;

              return (
                <tr
                  key={stockId}
                  className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
                >
                  <td className="px-4 py-2.5 font-bold text-[#2F6E9E]">
                    {medicament.nom || stock.medicament_nom || "Medicament"}
                  </td>
                  <td className="max-w-xs px-4 py-2.5">
                    <p className="truncate text-[#6B7280]">
                      {medicament.description || "Aucune description"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 font-black">{stock.quantite}</td>
                  <td className="px-4 py-2.5 font-semibold">{formatPrice(stock.prix)}</td>
                  <td className="px-4 py-2.5 font-semibold">{stock.seuil_alerte}</td>
                  <td className="px-4 py-2.5">
                    <StockStatusBadge stock={stock} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <ActionButton
                        label="Modifier"
                        icon={faPen}
                        onClick={() => onEdit(stock)}
                      />
                      <ActionButton
                        label="Supprimer"
                        tone="danger"
                        icon={faTrash}
                        loading={deletingStockId === stockId}
                        onClick={() => onDelete(stock)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 p-3 md:hidden">
        {stocks.map((stock) => {
          const medicament = getMedicament(stock);
          const stockId = stock.id_stock || stock.id;

          return (
            <article
              key={stockId}
              className="rounded-xl border border-[#E2E8F2] bg-white px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#2F6E9E]">
                    {medicament.nom || stock.medicament_nom || "Medicament"}
                  </h3>
                  <p className="mt-1 truncate text-xs text-[#6B7280]">
                    {medicament.description || "Aucune description"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <ActionButton
                    label="Modifier"
                    icon={faPen}
                    onClick={() => onEdit(stock)}
                  />
                  <ActionButton
                    label="Supprimer"
                    tone="danger"
                    icon={faTrash}
                    loading={deletingStockId === stockId}
                    onClick={() => onDelete(stock)}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold text-[#6B7280]">Quantite</p>
                  <p className="font-black text-[#1C2B4A]">{stock.quantite}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#6B7280]">Prix</p>
                  <p className="font-black text-[#1C2B4A]">{formatPrice(stock.prix)}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#6B7280]">Seuil</p>
                  <p className="font-black text-[#1C2B4A]">{stock.seuil_alerte}</p>
                </div>
              </div>

              <div className="mt-3">
                <StockStatusBadge stock={stock} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function StockDisponibles({
  stocks = [],
  count = 0,
  next = null,
  previous = null,
  currentPage = 1,
  pageSize = 6,
  loading = false,
  error = "",
  search = "",
  statusFilter = "all",
  onSearchChange,
  onStatusChange,
  onPageChange,
  onResetFilters,
  onEdit,
  onDelete,
  deletingStockId = null,
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <Card
      hover={false}
      className="overflow-hidden border-[#2F6E9E]/10 bg-white"
      bodyClassName="p-0"
    >
      <div className="border-b border-[#E2E8F2] p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <StockSearchBar value={search} onChange={onSearchChange} />
          </div>

          <StockFilters
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            onReset={onResetFilters}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2">
        <p className="text-xs font-bold text-[#1C2B4A]">
          {count} stock(s)
        </p>
        <p className="text-xs font-semibold text-[#6B7280]">
          Page {currentPage} / {totalPages}
        </p>
      </div>

      {error && (
        <div className="m-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
          Chargement des stocks...
        </div>
      ) : stocks.length === 0 ? (
        <div className="p-3">
          <EmptyStockState
            title="Aucun stock a afficher"
            description="Aucun stock ne correspond aux filtres actuels."
          />
        </div>
      ) : (
        <>
          <StockTable
            stocks={stocks}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingStockId={deletingStockId}
          />

          <StockPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasPrevious={Boolean(previous)}
            hasNext={Boolean(next)}
            onPageChange={onPageChange}
            disabled={loading}
          />
        </>
      )}
    </Card>
  );
}

export default StockDisponibles;
