import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxesStacked, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import StockCard from "./StockCard";
import StockFilters from "./StockFilters";
import StockPagination from "./StockPagination";
import StockSearchBar from "./StockSearchBar";
import StockSkeleton from "./StockSkeleton";
import EmptyStockState from "./EmptyStockState";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

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
      title="Stocks disponibles"
      subtitle="Recherchez, filtrez et gerez rapidement les medicaments deja presents dans votre pharmacie."
      action={<Badge variant="blue">{count} stock(s)</Badge>}
      hover={false}
      className="border-[#2F6E9E]/10 bg-white/95"
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <StockSearchBar value={search} onChange={onSearchChange} />

          <StockFilters
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            sortBy="recent"
            onSortChange={() => {}}
            onReset={onResetFilters}
            showSort={false}
          />
        </div>

        <div className="rounded-[1.5rem] border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.98),_rgba(255,255,255,0.98))] px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                <FontAwesomeIcon icon={faBoxesStacked} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-[#16324A]">
                  Inventaire affiche
                </p>
                <p className="text-sm text-pharmaTextLight">
                  {count} resultat(s) correspondant a votre recherche.
                </p>
              </div>
            </div>

            <div className="rounded-full bg-[#2FA6A3]/10 px-3 py-1 text-xs font-black text-[#2FA6A3]">
              Page {currentPage} / {totalPages}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <StockSkeleton key={item} />
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <EmptyStockState
            title="Aucun stock a afficher"
            description="Aucun stock ne correspond aux filtres actuels pour cette page."
          />
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              {stocks.map((stock) => (
                <StockCard
                  key={stock.id_stock || stock.id}
                  stock={stock}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  deleting={deletingStockId === (stock.id_stock || stock.id)}
                />
              ))}
            </div>

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
      </div>
    </Card>
  );
}

export default StockDisponibles;
