import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StockDisponibles from "../../components/stocks/StockDisponibles";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
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
    loadStocks({ page: 1, searchValue: search, statusValue: statusFilter });
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
    <DashboardLayout title="Gestion des stocks" links={pharmacistLinks}>
      <div className="space-y-6">
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

        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#2F6E9E] via-[#4A8BBE] to-[#2FA6A3] p-5 text-white shadow-[0_22px_60px_rgba(47,110,158,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Stock pharmacie
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                Gestion des stocks
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85">
                Consultez l'inventaire de votre pharmacie, retrouvez rapidement un
                medicament, appliquez des filtres utiles et gardez une vue claire sur
                les disponibilites et les ruptures.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              icon={faCapsules}
              className="shadow-[0_18px_38px_rgba(47,166,163,0.22)]"
              onClick={() => navigate("/pharmacien/stocks/ajouter")}
            >
              Ajouter un medicament
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

        <Card
          hover={false}
          className="border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.95),_rgba(255,255,255,0.98))]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black tracking-tight text-[#16324A]">
                Conseils de gestion
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-pharmaTextLight">
                Une surveillance reguliere des seuils d'alerte aide a limiter les ruptures,
                a mieux preparer les commandes et a garantir la continuite du service patient.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
                <span>Confirmez toujours la suppression d'un stock avant validation.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PharmacienStocks;
