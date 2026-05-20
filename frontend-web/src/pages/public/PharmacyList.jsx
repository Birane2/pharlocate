import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClinicMedical,
  faMagnifyingGlass,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../../components/common/Pagination";
import PharmacyCard from "../../components/pharmacies/PharmacyCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import { getPharmacies } from "../../services/pharmacyService";

const PAGE_SIZE = 6;

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
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const estGarde = searchParams.get("est_garde") === "true";
  const isOpen = searchParams.get("is_open") === "true";
  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const nextPage = Number(searchParams.get("page")) || 1;
    setPage(nextPage);
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

        if (search) {
          params.search = search;
        }

        if (garde) {
          params.est_garde = garde;
        }

        if (open) {
          params.is_open = open;
        }

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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPharmacies();

    return () => {
      isMounted = false;
    };
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,166,163,0.12),_transparent_28%),linear-gradient(180deg,_#f5fbff_0%,_#ffffff_44%,_#f7fcfb_100%)]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Logo className="h-14 sm:h-16" to="/" />
              <Badge
                variant="info"
                className="mt-5 border border-white/10 bg-white/15 text-white ring-white/10"
              >
                Annuaire public PharmaLocate
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Toutes les pharmacies publiques validees en un seul endroit.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                Recherchez une pharmacie par nom, adresse ou telephone, puis filtrez
                les etablissements de garde ou actuellement ouverts.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
              icon={faRotateRight}
              onClick={() => handlePageChange(page)}
              loading={loading}
            >
              Actualiser
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Card
          hover={false}
          className="border-[#2F6E9E]/10 bg-white/92 shadow-[0_18px_52px_rgba(47,110,158,0.1)]"
          bodyClassName="space-y-5"
        >
          <form onSubmit={handleSearchSubmit} className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Rechercher par nom, adresse ou telephone"
                className="flex-1"
              />
              <Button type="submit" icon={faMagnifyingGlass} className="lg:min-w-[220px]">
                Rechercher
              </Button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={estGarde ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateFilters({ est_garde: estGarde ? null : "true" })
                  }
                >
                  {estGarde ? "Garde activee" : "Pharmacie de garde"}
                </Button>
                <Button
                  type="button"
                  variant={isOpen ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => updateFilters({ is_open: isOpen ? null : "true" })}
                >
                  {isOpen ? "Ouverte activee" : "Ouverte maintenant"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                  Reinitialiser
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="blue">Total: {pagination.count}</Badge>
                {estGarde && <Badge variant="info">Filtre garde</Badge>}
                {isOpen && <Badge variant="active">Filtre ouverte</Badge>}
              </div>
            </div>
          </form>
        </Card>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} hover={false} className="animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 w-28 rounded-full bg-[#2F6E9E]/10" />
                  <div className="h-8 w-3/4 rounded-full bg-[#2F6E9E]/10" />
                  <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                  <div className="h-4 w-5/6 rounded-full bg-[#2F6E9E]/10" />
                  <div className="h-11 w-full rounded-2xl bg-[#2F6E9E]/10" />
                </div>
              </Card>
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <Card hover={false} className="mt-8">
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35C3A3]/15 text-[#13795f]">
                <FontAwesomeIcon icon={faClinicMedical} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                Aucune pharmacie trouvee
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-pharmaTextLight">
                Ajustez votre recherche ou desactivez les filtres pour voir plus de
                resultats publics.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            <div className="mt-8">
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
      </section>
    </div>
  );
}

export default PharmacyList;
