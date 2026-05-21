import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCapsules,
  faCircleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import MedicamentReservationCard from "../../components/reservations/MedicamentReservationCard";
import ReservationCart from "../../components/reservations/ReservationCart";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";
import { getPublicPharmacyDetail } from "../../services/pharmacyService";
import { createReservation } from "../../services/reservationService";
import { getStocksByPharmacy } from "../../services/stockService";

function extractMedicamentId(item) {
  const candidates = [
    item?.medicament_id,
    item?.medicament?.id,
    item?.medicament,
    item?.medicament_data?.id,
    item?.medicamentData?.id,
  ];

  for (const candidate of candidates) {
    const numericValue = Number(candidate);

    if (Number.isInteger(numericValue) && numericValue > 0) {
      return numericValue;
    }
  }

  return null;
}

function normalizePublicStock(stock) {
  const medicamentData =
    stock?.medicament && typeof stock.medicament === "object"
      ? stock.medicament
      : stock?.medicament_data || null;

  return {
    ...stock,
    id_stock: stock?.id_stock ?? stock?.id ?? null,
    medicament: medicamentData || stock?.medicament,
    medicament_id: extractMedicamentId(stock),
    medicament_nom: stock?.medicament_nom || medicamentData?.nom || "Medicament",
    medicament_description:
      stock?.medicament_description ||
      medicamentData?.description ||
      "Aucune description disponible pour ce medicament.",
    medicament_categorie:
      stock?.medicament_categorie ||
      medicamentData?.categorie ||
      "General",
    medicament_photo: stock?.medicament_photo || medicamentData?.photo || "",
    status:
      stock?.status ||
      stock?.statut ||
      (Number(stock?.quantite || 0) > 0 ? "Disponible" : "Rupture"),
  };
}

function extractFirstApiMessage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return extractFirstApiMessage(value[0]);
  }

  if (typeof value === "object") {
    const firstValue = Object.values(value)[0];
    return extractFirstApiMessage(firstValue);
  }

  return "";
}

function getLoadErrorMessage(error) {
  if (error.response?.status === 404) {
    return "Cette pharmacie ou ses stocks publics sont indisponibles.";
  }

  if (error.response?.status >= 500) {
    return "Le service de reservation est temporairement indisponible.";
  }

  return (
    error.response?.data?.error ||
    "Impossible de charger les informations de reservation."
  );
}

function getSubmitErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Votre compte n'est pas autorise a creer une reservation.";
  }

  if (error.response?.status === 400) {
    const data = error.response?.data;

    if (typeof data?.error === "string") {
      return data.error;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.items === "string") {
      return data.items;
    }

    if (Array.isArray(data?.items) && data.items[0]) {
      return String(data.items[0]);
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    const nestedMessage = extractFirstApiMessage(data);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (error.response?.status >= 500) {
    return "Une erreur serveur est survenue pendant la reservation.";
  }

  return "Impossible d'envoyer votre reservation pour le moment.";
}

function NewReservation() {
  const navigate = useNavigate();
  const { pharmacyId } = useParams();
  const [searchParams] = useSearchParams();
  const stockId = searchParams.get("stock");

  const [pharmacy, setPharmacy] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedStockInfo, setSelectedStockInfo] = useState({
    stock: null,
    message: "",
    type: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadReservationData = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedStockInfo({ stock: null, message: "", type: "" });

        const [pharmacyData, stocksData] = await Promise.all([
          getPublicPharmacyDetail(pharmacyId),
          getStocksByPharmacy(pharmacyId),
        ]);

        if (!isMounted) {
          return;
        }

        const nextStocks = (stocksData.results || []).map(normalizePublicStock);
        setPharmacy(pharmacyData);
        setStocks(nextStocks);

        const initialDrafts = {};
        nextStocks.forEach((stock) => {
          initialDrafts[stock.id_stock] = 1;
        });
        setDraftQuantities(initialDrafts);
      } catch (requestError) {
        if (isMounted) {
          setPharmacy(null);
          setStocks([]);
          setError(getLoadErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReservationData();

    return () => {
      isMounted = false;
    };
  }, [pharmacyId]);

  useEffect(() => {
    if (!stockId || stocks.length === 0) {
      return;
    }

    const targetStock = stocks.find(
      (stock) => String(stock.id_stock) === String(stockId)
    );

    if (!targetStock) {
      setSelectedStockInfo({
        stock: null,
        type: "error",
        message: "Le stock selectionne est introuvable dans cette pharmacie.",
      });
      return;
    }

    if (Number(targetStock.quantite || 0) <= 0) {
      setSelectedStockInfo({
        stock: targetStock,
        type: "error",
        message: "Ce medicament est en rupture de stock.",
      });
      setToast({ type: "error", message: "Ce medicament est en rupture de stock." });
      return;
    }

    setSelectedStockInfo({
      stock: targetStock,
      type: "success",
      message: `${targetStock.medicament_nom} a ete ajoute automatiquement au panier avec une quantite de 1.`,
    });

    setCartItems((currentCart) => {
      if (currentCart.some((item) => item.id_stock === targetStock.id_stock)) {
        return currentCart;
      }

      return [
        ...currentCart,
        {
          ...targetStock,
          medicament_id: extractMedicamentId(targetStock),
          quantite: 1,
          quantite_disponible: Number(targetStock.quantite || 0),
        },
      ];
    });
  }, [stockId, stocks]);

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((firstItem, secondItem) => {
      const firstAvailable = Number(firstItem.quantite || 0) > 0 ? 1 : 0;
      const secondAvailable = Number(secondItem.quantite || 0) > 0 ? 1 : 0;

      if (firstAvailable !== secondAvailable) {
        return secondAvailable - firstAvailable;
      }

      return String(firstItem.medicament_nom || "").localeCompare(
        String(secondItem.medicament_nom || "")
      );
    });
  }, [stocks]);

  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.quantite || 0), 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.quantite || 0) * Number(item.prix || 0),
        0
      ),
    [cartItems]
  );

  const handleDraftQuantityChange = (stockItemId, value) => {
    setDraftQuantities((currentDrafts) => ({
      ...currentDrafts,
      [stockItemId]: value,
    }));
  };

  const handleAddToCart = (stock) => {
    const desiredQuantity = Number(draftQuantities[stock.id_stock] || 1);
    const maxQuantity = Number(stock.quantite || 0);

    if (maxQuantity <= 0) {
      setToast({ type: "error", message: "Ce medicament est en rupture de stock." });
      return;
    }

    if (desiredQuantity > maxQuantity) {
      setToast({
        type: "error",
        message: `Quantite indisponible. Stock disponible: ${maxQuantity}.`,
      });
      return;
    }

    setCartItems((currentCart) => {
      const existingItem = currentCart.find((item) => item.id_stock === stock.id_stock);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id_stock === stock.id_stock
            ? {
                ...item,
                quantite: desiredQuantity,
                quantite_disponible: maxQuantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...stock,
          medicament_id: extractMedicamentId(stock),
          quantite: desiredQuantity,
          quantite_disponible: maxQuantity,
        },
      ];
    });

    setToast({ type: "success", message: `${stock.medicament_nom} a ete ajoute au panier.` });
  };

  const handleCartQuantityChange = (stockItemId, nextQuantity) => {
    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item.id_stock === stockItemId
          ? {
              ...item,
              quantite: Math.min(
                Math.max(Number(nextQuantity || 1), 1),
                Number(item.quantite_disponible || 1)
              ),
            }
          : item
      )
    );
  };

  const handleRemoveCartItem = (stockItemId) => {
    setCartItems((currentCart) =>
      currentCart.filter((item) => item.id_stock !== stockItemId)
    );
  };

  const handleSubmitReservation = async () => {
    if (cartItems.length === 0) {
      setToast({
        type: "error",
        message: "Ajoutez au moins un medicament avant de confirmer la reservation.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setToast(null);

      const invalidItem = cartItems.find((item) => !extractMedicamentId(item));

      if (invalidItem) {
        setToast({
          type: "error",
          message:
            "Un medicament du panier est invalide. Rechargez la page puis reessayez.",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        pharmacie: Number(pharmacyId),
        items: cartItems.map((item) => ({
          medicament: extractMedicamentId(item),
          quantite: Number(item.quantite),
        })),
      };

      const response = await createReservation(payload);

      setCartItems([]);
      setDraftQuantities((currentDrafts) => {
        const resetDrafts = { ...currentDrafts };
        stocks.forEach((stock) => {
          resetDrafts[stock.id_stock] = 1;
        });
        return resetDrafts;
      });

      setToast({
        type: "success",
        message: response?.message || "Reservation creee avec succes.",
      });
    } catch (requestError) {
      setToast({
        type: "error",
        message: getSubmitErrorMessage(requestError),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f5fbff_0%,_#ffffff_55%,_#f7fcfb_100%)]">
      <Navbar />

      {toast && (
        <div className="pointer-events-none fixed right-4 top-24 z-40">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              toast.type === "success"
                ? "border-[#5EC6B8]/40 bg-white text-[#13795f]"
                : "border-red-200 bg-white text-red-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-14 sm:h-16" to="/" />
          <Button
            type="button"
            variant="outline"
            icon={faArrowLeft}
            onClick={() =>
              navigate(pharmacyId ? `/pharmacies/${pharmacyId}` : "/pharmacies")
            }
          >
            Retour a la fiche pharmacie
          </Button>
        </div>

        <div className="mt-8 space-y-8">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
            <Badge
              variant="info"
              className="border border-white/10 bg-white/15 text-white ring-white/10"
            >
              Reservation utilisateur
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Preparez votre reservation en quelques etapes simples.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
              Selectionnez un ou plusieurs medicaments disponibles, ajustez les quantites
              et confirmez votre reservation aupres de la pharmacie.
            </p>
          </div>

          {loading ? (
            <Card hover={false}>
              <div className="py-16 text-center text-sm font-semibold text-pharmaBlue">
                Chargement des informations de reservation...
              </div>
            </Card>
          ) : error ? (
            <Card hover={false}>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <FontAwesomeIcon icon={faCircleInfo} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                  Reservation indisponible
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-pharmaTextLight">
                  {error}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card
                  title="Medicaments disponibles"
                  subtitle="Choisissez les produits a reserver dans cette pharmacie."
                  action={<Badge variant="blue">{sortedStocks.length} produit(s)</Badge>}
                  hover={false}
                  className="border-[#2F6E9E]/10 bg-white/95"
                >
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F8FBFF] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                        Pharmacie
                      </p>
                      <p className="mt-2 text-base font-black text-[#16324A]">
                        {pharmacy?.nom || `Pharmacie #${pharmacyId}`}
                      </p>
                    </div>

                    {stockId && (
                      <div
                        className={`rounded-2xl border px-4 py-3 ${
                          selectedStockInfo.type === "error"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-[#2FA6A3]/20 bg-[#E8F7F3] text-[#13795f]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FontAwesomeIcon
                            icon={
                              selectedStockInfo.type === "error"
                                ? faCircleExclamation
                                : faCircleInfo
                            }
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-black tracking-tight">
                              {selectedStockInfo.type === "error"
                                ? "Stock selectionne"
                                : "Medicament preselectionne"}
                            </p>
                            <p className="mt-1 text-sm leading-6">
                              {selectedStockInfo.message ||
                                "Un stock a ete transmis dans l'URL."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {sortedStocks.length === 0 ? (
                  <Card hover={false}>
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                        <FontAwesomeIcon icon={faCapsules} className="text-2xl" />
                      </div>
                      <h2 className="mt-5 text-xl font-black tracking-tight text-[#16324A]">
                        Aucun medicament reservable
                      </h2>
                      <p className="mt-3 max-w-md text-sm leading-7 text-pharmaTextLight">
                        Cette pharmacie ne propose actuellement aucun medicament disponible
                        a la reservation.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {sortedStocks.map((stock) => (
                      <MedicamentReservationCard
                        key={stock.id_stock}
                        stock={stock}
                        quantity={draftQuantities[stock.id_stock] || 1}
                        inCart={cartItems.some((item) => item.id_stock === stock.id_stock)}
                        disabled={submitting}
                        onQuantityChange={(value) =>
                          handleDraftQuantityChange(stock.id_stock, value)
                        }
                        onAddToCart={() => handleAddToCart(stock)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="xl:sticky xl:top-24 xl:self-start">
                <ReservationCart
                  pharmacyName={pharmacy?.nom}
                  cartItems={cartItems}
                  totalItems={totalItems}
                  totalAmount={totalAmount}
                  submitting={submitting}
                  onQuantityChange={handleCartQuantityChange}
                  onRemoveItem={handleRemoveCartItem}
                  onSubmit={handleSubmitReservation}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewReservation;
