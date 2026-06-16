import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClinicMedical,
  faFilter,
  faMagnifyingGlass,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/layout/Navbar";
import PharmacyCard from "../../components/pharmacies/PharmacyCard";
import { getPharmacies } from "../../services/pharmacyService";

const PAGE_SIZE = 8;

const emptyPagination = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function getApiErrorMessage(error) {
  if (error.response?.status === 404) {
    return "Aucune pharmacie publique n'a ete trouvee.";
  }

  if (error.response?.status >= 500) {
    return "Le service des pharmacies est temporairement indisponible.";
  }

  return (
    error.response?.data?.error ||
    "Impossible de charger les pharmacies publiques pour le moment."
  );
}

function PharmacyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;
  const estGarde = searchParams.get("est_garde") === "true";
  const isOpen = searchParams.get("is_open") === "true";
  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.get("search")) count += 1;
    if (estGarde) count += 1;
    if (isOpen) count += 1;
    return count;
  }, [searchParams, estGarde, isOpen]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchInput(searchParams.get("search") || "");
    }, 0);
    return () => window.clearTimeout(id);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadPharmacies = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page: Number(searchParams.get("page")) || 1,
          page_size: PAGE_SIZE,
        };
        const search = searchParams.get("search");
        const garde = searchParams.get("est_garde");
        const open = searchParams.get("is_open");
        if (search) params.search = search;
        if (garde) params.est_garde = garde;
        if (open) params.is_open = open;

        const data = await getPharmacies(params);

        if (isMounted) {
          setPagination(data);
          setPharmacies(data.results || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getApiErrorMessage(requestError));
          setPagination(emptyPagination);
          setPharmacies([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPharmacies();
    return () => { isMounted = false; };
  }, [searchParams]);

  const updateFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined || value === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handlePageChange = (targetPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(targetPage));
    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams({ page: "1" }));
  };

  const handleViewDetails = (pharmacy) => {
    navigate(`/pharmacies/${pharmacy.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero compact */}
      <div className="border-b border-[#2F6E9E]/15 bg-gradient-to-r from-[#2F6E9E] to-[#2FA6A3]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
              Annuaire PharmaLocate
            </p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-white sm:text-2xl">
              Trouvez une pharmacie proche
            </h1>
            <p className="mt-0.5 text-[12px] text-white/75">
              Recherchez, filtrez et consultez les fiches en quelques secondes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(page)}
            disabled={loading}
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50 sm:flex"
          >
            <FontAwesomeIcon icon={faRotateRight} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">

        {/* Carte recherche + filtres fusionnee */}
        <div className="rounded-2xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher par nom, adresse ou telephone..."
                  className="w-full rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] py-2 pl-8 pr-3 text-sm text-[#1C2B4A] placeholder-[#9CA3AF] transition focus:border-[#2F6E9E]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6E9E]/12"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#255C86] active:scale-95"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Rechercher
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <FontAwesomeIcon icon={faFilter} className="text-[10px] text-[#9CA3AF]" />
                <button
                  type="button"
                  onClick={() => updateFilters({ est_garde: estGarde ? null : "true" })}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    estGarde
                      ? "bg-[#2F6E9E] text-white shadow-sm"
                      : "border border-[#E2E8F2] bg-white text-[#6B7280] hover:border-[#2F6E9E]/30 hover:text-[#2F6E9E]"
                  }`}
                >
                  De garde
                </button>
                <button
                  type="button"
                  onClick={() => updateFilters({ is_open: isOpen ? null : "true" })}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    isOpen
                      ? "bg-[#2FA6A3] text-white shadow-sm"
                      : "border border-[#E2E8F2] bg-white text-[#6B7280] hover:border-[#2FA6A3]/30 hover:text-[#2FA6A3]"
                  }`}
                >
                  Ouverte maintenant
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 transition hover:bg-red-100"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    Reinitialiser
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-lg bg-[#EEF4FA] px-2.5 py-1 font-bold text-[#2F6E9E]">
                  {pagination.count} pharmacie{pagination.count !== 1 ? "s" : ""}
                </span>
                {totalPages > 1 && (
                  <span className="text-[#9CA3AF]">
                    Page {page}/{totalPages}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Grille */}
        {loading ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white"
              >
                <div className="h-[128px] bg-[#EEF4FA]" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-3/4 rounded-full bg-[#EEF4FA]" />
                  <div className="h-3 w-full rounded-full bg-[#EEF4FA]" />
                  <div className="h-3 w-1/2 rounded-full bg-[#EEF4FA]" />
                  <div className="mt-2 h-8 w-full rounded-xl bg-[#EEF4FA]" />
                </div>
              </div>
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F2] bg-white py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FA] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faClinicMedical} className="text-xl" />
            </div>
            <h2 className="mt-3 text-base font-bold text-[#1C2B4A]">
              Aucune pharmacie trouvee
            </h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-[#6B7280]">
              Ajustez votre recherche ou desactivez les filtres pour voir plus de resultats.
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 rounded-xl border border-[#E2E8F2] bg-white px-4 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#EEF4FA]"
              >
                Reinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            <div className="mt-4 pb-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                previous={pagination.previous}
                next={pagination.next}
                loading={loading}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PharmacyList;
