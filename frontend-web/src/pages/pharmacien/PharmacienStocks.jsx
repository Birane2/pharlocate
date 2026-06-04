import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  faCapsules,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StockDisponibles from "../../components/stocks/StockDisponibles";
import Button from "../../components/ui/Button";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { deleteStock, getStocks } from "../../services/stockService";

const PAGE_SIZE = 6;

function extractApiMessage(error, fallback) {
  const data = error.response?.data;

  const extract = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return extract(value[0]);
    }

    if (typeof value === "object") {
      if (typeof value.message === "string") {
        return value.message;
      }

      if (typeof value.error === "string") {
        return value.error;
      }

      if (typeof value.detail === "string") {
        return value.detail;
      }

      return extract(Object.values(value)[0]);
    }

    return "";
  };

  return extract(data) || fallback;
}

function getLoadErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse pour charger les donnees de stock.";
  }

  if (error.response?.status === 500) {
    return "Le serveur a rencontre une erreur lors du chargement.";
  }

  return "Impossible de charger les stocks.";
}

function getDeleteErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse pour cette suppression.";
  }

  if (error.response?.status === 404) {
    return "Le stock a supprimer est introuvable.";
  }

  return extractApiMessage(error, "Impossible de supprimer ce stock.");
}

function PharmacienStocks() {
  const navigate = useNavigate();
  const toastTimeoutRef = useRef(null);
  const [stocks, setStocks] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingData, setLoadingData] = useState(true);
  const [deletingStockId, setDeletingStockId] = useState(null);
  const [listError, setListError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const loadStocks = async ({
    page = currentPage,
    searchValue = search,
    statusValue = statusFilter,
  } = {}) => {
    setLoadingData(true);

    try {
      const params = { page };

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (statusValue && statusValue !== "all") {
        params.status = statusValue;
      }

      const data = await getStocks(params);
      setStocks(data.results || []);
      setCount(data.count || 0);
      setNextPageUrl(data.next || null);
      setPreviousPageUrl(data.previous || null);
      setCurrentPage(page);
      setListError("");
    } catch (error) {
      setStocks([]);
      setCount(0);
      setNextPageUrl(null);
      setPreviousPageUrl(null);
      setListError(getLoadErrorMessage(error));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Existing fetch-on-filter-change pattern; keep behavior unchanged.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStocks({ page: 1, searchValue: search, statusValue: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleEditStock = (stock) => {
    navigate("/pharmacien/stocks/ajouter", {
      state: {
        mode: "edit",
        stockId: stock.id_stock || stock.id,
        stock,
      },
    });
  };

  const handleDelete = async (stock) => {
    const stockId = stock.id_stock || stock.id;
    const label =
      stock?.medicament_data?.nom || stock?.medicament_nom || "ce medicament";
    const nextPageAfterDelete =
      stocks.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

    const confirmed = window.confirm(
      `Confirmez-vous la suppression du stock pour ${label} ?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingStockId(stockId);
    setListError("");

    try {
      const response = await deleteStock(stockId);
      await loadStocks({
        page: nextPageAfterDelete,
        searchValue: search,
        statusValue: statusFilter,
      });
      showToast(
        "success",
        response?.message || "Le stock a ete supprime avec succes."
      );
    } catch (error) {
      const nextError = getDeleteErrorMessage(error);
      setListError(nextError);
      showToast("error", nextError);
    } finally {
      setDeletingStockId(null);
    }
  };

  return (
    <DashboardLayout
      title="Gestion des stocks"
      links={pharmacistLinks}
      headerSubtitle="Gerez l'inventaire de votre pharmacie."
    >
      <div className="mx-auto max-w-7xl space-y-3">
        {toast && (
          <div className="pointer-events-none fixed right-4 top-4 z-40">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_24px_48px_rgba(17,24,39,0.16)] backdrop-blur ${
                toast.type === "success"
                  ? "border-[#5EC6B8]/30 bg-white text-[#13795f]"
                  : "border-red-200 bg-white text-red-600"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1C2B4A]">
                Gestion des stocks
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Inventaire de votre pharmacie
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              icon={faCapsules}
              className="w-full md:w-auto"
              onClick={() => navigate("/pharmacien/stocks/ajouter")}
            >
              + Ajouter un medicament
            </Button>
          </div>
        </section>

        <StockDisponibles
          stocks={stocks}
          count={count}
          next={nextPageUrl}
          previous={previousPageUrl}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          loading={loadingData}
          error={listError}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={(event) => setSearch(event.target.value)}
          onStatusChange={setStatusFilter}
          onPageChange={(page) => loadStocks({ page, searchValue: search, statusValue: statusFilter })}
          onResetFilters={() => {
            setSearch("");
            setStatusFilter("all");
          }}
          onEdit={handleEditStock}
          onDelete={handleDelete}
          deletingStockId={deletingStockId}
        />

      </div>
    </DashboardLayout>
  );
}

export default PharmacienStocks;
