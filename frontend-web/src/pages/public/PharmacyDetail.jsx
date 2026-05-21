import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCapsules,
  faCircleInfo,
  faStar,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import PharmacyHoraires from "../../components/pharmacies/PharmacyHoraires";
import PharmacyInfoCard from "../../components/pharmacies/PharmacyInfoCard";
import PharmacyReviews from "../../components/pharmacies/PharmacyReviews";
import MedicamentCard from "../../components/medicaments/MedicamentCard";
import Navbar from "../../components/layout/Navbar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";
import { useAuth } from "../../context/AuthContext";
import { createAvis } from "../../services/avisService";
import { getPublicPharmacyDetail, getPublicMediaUrl } from "../../services/pharmacyService";
import { getStocksByPharmacy } from "../../services/stockService";

function getApiErrorMessage(error) {
  if (error.response?.status === 404) {
    return "Cette pharmacie n'est pas disponible publiquement ou n'existe pas.";
  }

  return (
    error.response?.data?.error ||
    "Impossible de charger les details de cette pharmacie."
  );
}

function PharmacyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, role } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [noteMoyenne, setNoteMoyenne] = useState(0);
  const [totalAvis, setTotalAvis] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPharmacy = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPublicPharmacyDetail(id);

        if (isMounted) {
          setPharmacy(data);
          setReviews(data.avis || []);
          setNoteMoyenne(data.note_moyenne || 0);
          setTotalAvis(data.total_avis || 0);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getApiErrorMessage(requestError));
          setPharmacy(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPharmacy();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadStocks = async () => {
      try {
        setStocksLoading(true);
        setStocksError("");
        const data = await getStocksByPharmacy(id);

        if (isMounted) {
          setStocks(data.results || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setStocks([]);
          setStocksError(
            requestError.response?.data?.error ||
              "Impossible de charger les medicaments disponibles."
          );
        }
      } finally {
        if (isMounted) {
          setStocksLoading(false);
        }
      }
    };

    loadStocks();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const stockSummary = useMemo(() => {
    const availableItems = stocks.filter((stock) => Number(stock.quantite || 0) > 0);
    const totalQuantity = stocks.reduce(
      (total, stock) => total + Number(stock.quantite || 0),
      0
    );

    return {
      availableItemsCount: availableItems.length,
      totalQuantity,
    };
  }, [stocks]);

  const handleOpenDirections = () => {
    if (!pharmacy?.latitude || !pharmacy?.longitude) {
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const handleReserve = (stock) => {
    const stockIdentifier = stock?.id_stock || stock?.id;
    const targetStock = stockIdentifier ? `?stock=${stockIdentifier}` : "";
    navigate(`/reservations/new/${pharmacy.id}${targetStock}`);
  };

  const handleSubmitReview = async ({ note, commentaire, reset }) => {
    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");

      const response = await createAvis({
        pharmacie: Number(id),
        note,
        commentaire,
      });

      const createdReview = response?.data;

      if (createdReview) {
        setReviews((currentReviews) => [createdReview, ...currentReviews]);
        const nextTotal = totalAvis + 1;
        const nextAverage = Number(
          ((noteMoyenne * totalAvis + Number(note)) / nextTotal).toFixed(1)
        );
        setTotalAvis(nextTotal);
        setNoteMoyenne(nextAverage);
      }

      setReviewSuccess(response?.message || "Avis ajoute avec succes.");
      reset();
    } catch (requestError) {
      setReviewError(
        requestError.response?.data?.error ||
          requestError.response?.data?.detail ||
          "Impossible de publier votre avis pour le moment."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLeaveReview = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const reviewSection = document.getElementById("pharmacy-reviews");
    reviewSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      const commentField = document.getElementById("pharmacy-review-commentaire");
      commentField?.focus();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,166,163,0.12),_transparent_26%),linear-gradient(180deg,_#f5fbff_0%,_#ffffff_48%,_#f7fcfb_100%)]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-14 sm:h-16" to="/" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              icon={faArrowLeft}
              onClick={() => navigate("/pharmacies")}
            >
              Retour a la liste
            </Button>
            <Button
              type="button"
              variant="ghost"
              icon={faRotateRight}
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <Card hover={false}>
              <div className="py-16 text-center text-sm font-semibold text-pharmaBlue">
                Chargement des details de la pharmacie...
              </div>
            </Card>
          ) : error ? (
            <Card hover={false}>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <FontAwesomeIcon icon={faCircleInfo} />
                </div>
                <h1 className="mt-4 text-xl font-semibold text-pharmaText">
                  Pharmacie introuvable
                </h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-pharmaTextLight">
                  {error}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
                <Badge
                  variant="info"
                  className="border border-white/10 bg-white/15 text-white ring-white/10"
                >
                  Fiche pharmacie publique
                </Badge>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Consultez toutes les informations utiles avant de vous deplacer.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
                  Horaires, avis, medicaments disponibles, reservation et itineraire:
                  tout est rassemble sur cette page pour aider l'utilisateur a agir rapidement.
                </p>
              </div>

              <PharmacyInfoCard
                pharmacy={pharmacy}
                photoUrl={getPublicMediaUrl(pharmacy.photo)}
                onOpenDirections={handleOpenDirections}
                onReserve={() => handleReserve()}
                medicamentsCount={stockSummary.availableItemsCount}
              />

              <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                <PharmacyHoraires horaires={pharmacy.horaires || []} />
                <div id="pharmacy-reviews">
                  <PharmacyReviews
                    avis={reviews}
                    noteMoyenne={noteMoyenne}
                    totalAvis={totalAvis}
                    canReview={isAuthenticated && role === "utilisateur"}
                    isAuthenticated={isAuthenticated}
                    submittingReview={reviewSubmitting}
                    reviewError={reviewError}
                    reviewSuccess={reviewSuccess}
                    onSubmitReview={handleSubmitReview}
                    onGoToLogin={() => navigate("/login")}
                  />
                </div>
              </div>

              <Card
                title="Medicaments disponibles"
                subtitle="Stocks publics recuperes depuis l'API des medicaments."
                action={
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <Badge variant="blue">
                      {stockSummary.availableItemsCount} disponible(s)
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={faStar}
                      onClick={handleLeaveReview}
                    >
                      Laisser un avis
                    </Button>
                  </div>
                }
              >
                {!stocksLoading && !stocksError && stocks.length > 0 && (
                  <div className="mb-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                        Produits visibles
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#16324A]">
                        {stocks.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                        Disponibles
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#16324A]">
                        {stockSummary.availableItemsCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                        Quantite totale
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#16324A]">
                        {stockSummary.totalQuantity}
                      </p>
                    </div>
                  </div>
                )}

                {stocksLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <Card key={item} hover={false} className="animate-pulse">
                        <div className="space-y-4">
                          <div className="h-40 rounded-[1.5rem] bg-[#2F6E9E]/10" />
                          <div className="h-5 w-24 rounded-full bg-[#2F6E9E]/10" />
                          <div className="h-7 w-3/4 rounded-full bg-[#2F6E9E]/10" />
                          <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : stocksError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {stocksError}
                  </div>
                ) : stocks.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35C3A3]/15 text-[#13795f]">
                      <FontAwesomeIcon icon={faCapsules} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-pharmaTextLight">
                      Aucun medicament disponible pour le moment dans cette pharmacie.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {stocks.map((stock) => (
                      <MedicamentCard
                        key={stock.id_stock}
                        stock={stock}
                        onReserve={handleReserve}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PharmacyDetail;
