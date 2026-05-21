import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClockRotateLeft,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import ReservationCard from "../../components/reservations/ReservationCard";
import Pagination from "../../components/common/Pagination";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import { getUserReservations } from "../../services/reservationService";

const PAGE_SIZE = 5;
const emptyPagination = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse a l'historique des reservations.";
  }

  if (error.response?.status >= 500) {
    return "Le service des reservations est temporairement indisponible.";
  }

  return (
    error.response?.data?.error ||
    "Impossible de charger vos reservations pour le moment."
  );
}

function UserReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  useEffect(() => {
    let isMounted = true;

    const loadReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          page_size: PAGE_SIZE,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (statusFilter) {
          params.statut = statusFilter;
        }

        const data = await getUserReservations(params);

        if (isMounted) {
          setPagination(data);
          setReservations(data.results || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setPagination(emptyPagination);
          setReservations([]);
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      isMounted = false;
    };
  }, [page, search, statusFilter]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F0F5FB]">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-14 sm:h-16" to="/" />
          <Button
            type="button"
            variant="outline"
            icon={faArrowLeft}
            onClick={() => navigate("/")}
          >
            Retour a l'accueil
          </Button>
        </div>

        <div className="mt-8 space-y-8">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
            <Badge
              variant="info"
              className="border border-white/10 bg-white/15 text-white ring-white/10"
            >
              Historique utilisateur
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Suivez toutes vos reservations en un seul endroit.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
              Consultez le statut de vos demandes, les medicaments reserves et les details
              de chaque pharmacie concernee.
            </p>
          </div>

          <Card
            hover={false}
            className="border-[#2F6E9E]/10 bg-white/95"
            bodyClassName="space-y-5"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-[#16324A]">
                  Filtrer vos reservations
                </h2>
                <p className="mt-1 text-sm leading-6 text-pharmaTextLight">
                  Recherchez par pharmacie ou par medicament, puis filtrez par statut.
                </p>
              </div>

              <Badge variant="blue">{pagination.count} reservation(s)</Badge>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Rechercher une pharmacie ou un medicament"
                  className="flex-1"
                />
                <Button type="submit" icon={faMagnifyingGlass} className="lg:min-w-[220px]">
                  Rechercher
                </Button>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={statusFilter === "en_attente" ? "secondary" : "outline"}
                    onClick={() => {
                      setPage(1);
                      setStatusFilter((current) =>
                        current === "en_attente" ? "" : "en_attente"
                      );
                    }}
                  >
                    En attente
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={statusFilter === "confirmee" ? "secondary" : "outline"}
                    onClick={() => {
                      setPage(1);
                      setStatusFilter((current) =>
                        current === "confirmee" ? "" : "confirmee"
                      );
                    }}
                  >
                    Confirmees
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={statusFilter === "annulee" ? "secondary" : "outline"}
                    onClick={() => {
                      setPage(1);
                      setStatusFilter((current) =>
                        current === "annulee" ? "" : "annulee"
                      );
                    }}
                  >
                    Annulees
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
                    Reinitialiser
                  </Button>
                </div>

                <div className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] px-4 py-3 text-sm text-[#6B7A99]">
                  Page <span className="font-bold text-[#16324A]">{page}</span> sur{" "}
                  <span className="font-bold text-[#16324A]">{totalPages}</span>
                </div>
              </div>
            </form>
          </Card>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5">
              {[1, 2, 3].map((item) => (
                <Card key={item} hover={false} className="animate-pulse">
                  <div className="space-y-4">
                    <div className="h-6 w-32 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-8 w-2/3 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-24 w-full rounded-2xl bg-[#2F6E9E]/10" />
                  </div>
                </Card>
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <Card hover={false}>
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="text-2xl" />
                </div>
                <h2 className="mt-5 text-xl font-black tracking-tight text-[#16324A]">
                  Aucune reservation a afficher
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-pharmaTextLight">
                  Vos reservations apparaitront ici des que vous aurez valide une demande.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-5">
                {reservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                previous={pagination.previous}
                next={pagination.next}
                loading={loading}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserReservations;
