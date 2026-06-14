import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCapsules,
  faCircleExclamation,
  faCircleInfo,
  faCreditCard,
  faPhone,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import MedicamentReservationCard from "../../components/reservations/MedicamentReservationCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";
import DeliveryAddressForm from "../../components/delivery/DeliveryAddressForm";
import PaymentMethodCard from "../../components/payment/PaymentMethodCard";
import PaymentProofUpload from "../../components/payment/PaymentProofUpload";
import OrderSummary from "../../components/reservation/OrderSummary";
import ReservationTypeSelector from "../../components/reservation/ReservationTypeSelector";
import { getPublicPharmacyDetail } from "../../services/pharmacyService";
import { getPharmacyPaymentMethods } from "../../services/paymentService";
import { checkoutReservation } from "../../services/reservationService";
import { getStocksByPharmacy } from "../../services/stockService";

const initialDelivery = {
  address: "",
  phone: "",
  note: "",
};

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
      stock?.medicament_categorie || medicamentData?.categorie || "General",
    medicament_photo: stock?.medicament_photo || medicamentData?.photo || "",
    status:
      stock?.status ||
      stock?.statut ||
      (Number(stock?.quantite || 0) > 0 ? "Disponible" : "Rupture"),
  };
}

function extractFirstApiMessage(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return extractFirstApiMessage(value[0]);
  if (typeof value === "object") return extractFirstApiMessage(Object.values(value)[0]);
  return "";
}

function getApiErrorMessage(error, fallback) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Votre compte n'est pas autorise a effectuer cette action.";
  }

  const data = error.response?.data;
  const message =
    data?.error ||
    data?.message ||
    data?.detail ||
    extractFirstApiMessage(data) ||
    fallback;

  return String(message);
}

function getPreselectedStockInfo(stockId, stocks) {
  if (!stockId || stocks.length === 0) {
    return { stock: null, message: "", type: "" };
  }

  const targetStock = stocks.find(
    (stock) => String(stock.id_stock) === String(stockId)
  );

  if (!targetStock || Number(targetStock.quantite || 0) <= 0) {
    return {
      stock: null,
      type: "error",
      message: "Le medicament selectionne est indisponible.",
    };
  }

  return {
    stock: targetStock,
    type: "success",
    message: `${targetStock.medicament_nom} a ete ajoute automatiquement au panier.`,
  };
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { pharmacyId } = useParams();
  const [searchParams] = useSearchParams();
  const stockId = searchParams.get("stock");

  const [pharmacy, setPharmacy] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [reservationType, setReservationType] = useState("retrait");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [clientPhone, setClientPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [delivery, setDelivery] = useState(initialDelivery);
  const [clientLocation, setClientLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [paymentMethodsMessage, setPaymentMethodsMessage] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        setError("");
        setPaymentMethodsError("");
        setPaymentMethodsMessage("");

        if (import.meta.env.DEV) {
          console.debug("[Checkout] pharmacyId =", pharmacyId);
        }

        const paymentRequest = getPharmacyPaymentMethods(pharmacyId).catch(
          (paymentError) => ({
            methods: [],
            loadError: getApiErrorMessage(
              paymentError,
              "Impossible de charger les méthodes de paiement."
            ),
          })
        );

        const [pharmacyData, stocksData, paymentData] = await Promise.all([
          getPublicPharmacyDetail(pharmacyId),
          getStocksByPharmacy(pharmacyId),
          paymentRequest,
        ]);

        if (!isMounted) return;

        if (import.meta.env.DEV) {
          console.debug("[Checkout] payment methods =", paymentData);
        }

        const nextStocks = (stocksData.results || []).map(normalizePublicStock);
        const nextDrafts = {};
        nextStocks.forEach((stock) => {
          nextDrafts[stock.id_stock] = 1;
        });
        const preselected = getPreselectedStockInfo(stockId, nextStocks);

        setPharmacy(pharmacyData);
        setStocks(nextStocks);
        setDraftQuantities(nextDrafts);
        setPaymentMethods(paymentData.methods || []);
        setPaymentMethodsError(paymentData.loadError || "");
        setPaymentMethodsMessage(paymentData.message || "");
        setSelectedPaymentMethod(
          (paymentData.methods || []).find((method) => method.configured) || null
        );
        setCartItems(
          preselected.stock
            ? [
                {
                  ...preselected.stock,
                  quantite: 1,
                  quantite_disponible: Number(preselected.stock.quantite || 0),
                },
              ]
            : []
        );
      } catch (requestError) {
        if (isMounted) {
          setError(
            getApiErrorMessage(
              requestError,
              "Impossible de charger les informations du checkout."
            )
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, [pharmacyId, stockId]);

  useEffect(() => {
    if (reservationType !== "livraison") return;

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClientLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("Position GPS recuperee automatiquement.");
      },
      () => {
        setClientLocation(null);
        setLocationStatus(
          "Autorisez la position GPS pour continuer avec la livraison."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [reservationType]);

  const selectedStockInfo = useMemo(
    () => getPreselectedStockInfo(stockId, stocks),
    [stockId, stocks]
  );

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

  const medicinesAmount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.quantite || 0) * Number(item.prix || 0),
        0
      ),
    [cartItems]
  );

  const updateDelivery = (key, value) => {
    setDelivery((currentDelivery) => ({
      ...currentDelivery,
      [key]: value,
    }));
  };

  const handleReservationTypeChange = (nextType) => {
    setReservationType(nextType);

    if (nextType === "livraison") {
      setLocationStatus("Recuperation automatique de votre position...");
      return;
    }

    setClientLocation(null);
    setLocationStatus("");
  };

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
          quantite: desiredQuantity,
          quantite_disponible: maxQuantity,
        },
      ];
    });

    setToast({ type: "success", message: `${stock.medicament_nom} ajoute au panier.` });
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

  const validateCheckout = () => {
    if (cartItems.length === 0) {
      return "Ajoutez au moins un medicament avant de confirmer.";
    }

    if (!selectedPaymentMethod) {
      return "Choisissez une methode de paiement.";
    }

    if (!clientPhone.trim()) {
      return "Le numero de telephone client est obligatoire.";
    }

    if (!transactionId.trim()) {
      return "Le transaction ID est obligatoire.";
    }

    if (!paymentProof) {
      return "La capture de paiement est obligatoire.";
    }

    if (reservationType === "livraison") {
      if (!delivery.address.trim()) {
        return "Ajoutez l'adresse de livraison.";
      }

      if (!delivery.phone.trim()) {
        return "Ajoutez le telephone de livraison.";
      }

      if (!clientLocation) {
        return "La position GPS est obligatoire pour la livraison.";
      }
    }

    return "";
  };

  const handleSubmitCheckout = async () => {
    const validationMessage = validateCheckout();
    if (validationMessage) {
      setToast({ type: "error", message: validationMessage });
      return;
    }

    try {
      setSubmitting(true);
      setToast(null);

      const items = cartItems.map((item) => ({
        stock: item.id_stock,
        medicament: extractMedicamentId(item),
        quantite: Number(item.quantite),
      }));

      await checkoutReservation({
        pharmacie: Number(pharmacyId),
        typeReservation: reservationType,
        items,
        paymentMethod: selectedPaymentMethod.id,
        clientPhone: clientPhone.trim(),
        transactionId: transactionId.trim(),
        paymentProof,
        delivery:
          reservationType === "livraison"
            ? {
                adresse_livraison: delivery.address.trim(),
                telephone: delivery.phone.trim(),
                note: delivery.note.trim(),
                latitude: clientLocation.latitude,
                longitude: clientLocation.longitude,
              }
            : null,
      });

      setToast({
        type: "success",
        message: "Commande envoyee. Le paiement est en attente de verification.",
      });
      setTimeout(() => navigate("/user/reservations"), 900);
    } catch (requestError) {
      setToast({
        type: "error",
        message: getApiErrorMessage(
          requestError,
          "Impossible d'envoyer la commande pour le moment."
        ),
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
            Retour pharmacie
          </Button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-6 text-white shadow-[0_26px_80px_rgba(47,110,158,0.2)] sm:p-8">
          <Badge
            variant="info"
            className="border border-white/10 bg-white/15 text-white ring-white/10"
          >
            Paiement manuel + livraison
          </Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Finalisez votre commande PharmaLocate.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
            Choisissez le retrait ou la livraison, payez directement la pharmacie,
            puis envoyez la preuve de paiement.
          </p>
        </div>

        {loading ? (
          <Card hover={false} className="mt-8">
            <div className="py-16 text-center text-sm font-semibold text-[#2F6E9E]">
              Chargement du checkout...
            </div>
          </Card>
        ) : error ? (
          <Card hover={false} className="mt-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[#1C2B4A]">
                Checkout indisponible
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">
                {error}
              </p>
            </div>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card
                title="Medicaments disponibles"
                subtitle="Ajoutez les produits souhaites au panier."
                action={<Badge variant="blue">{sortedStocks.length} produit(s)</Badge>}
                hover={false}
              >
                <div className="mb-5 rounded-2xl border border-[#2F6E9E]/10 bg-[#F8FBFF] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                    Pharmacie
                  </p>
                  <p className="mt-2 text-base font-black text-[#16324A]">
                    {pharmacy?.nom || `Pharmacie #${pharmacyId}`}
                  </p>
                </div>

                {selectedStockInfo.message && (
                  <div
                    className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      selectedStockInfo.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#2FA6A3]/20 bg-[#E8F7F3] text-[#13795f]"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        selectedStockInfo.type === "error"
                          ? faCircleExclamation
                          : faCircleInfo
                      }
                      className="mr-2"
                    />
                    {selectedStockInfo.message}
                  </div>
                )}

                {sortedStocks.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faCapsules} className="text-2xl" />
                    </div>
                    <h2 className="mt-5 text-xl font-black tracking-tight text-[#16324A]">
                      Aucun medicament reservable
                    </h2>
                  </div>
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
              </Card>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <Card title="Type de commande" hover={false}>
                <ReservationTypeSelector
                  value={reservationType}
                  disabled={submitting}
                  onChange={handleReservationTypeChange}
                />
              </Card>

              {reservationType === "livraison" && (
                <Card title="Livraison" subtitle="Coordonnees visibles uniquement par la pharmacie." hover={false}>
                  <DeliveryAddressForm
                    values={delivery}
                    disabled={submitting}
                    locationStatus={locationStatus}
                    onChange={updateDelivery}
                  />
                </Card>
              )}

              <Card
                title="Méthode de paiement"
                subtitle="Paiement direct à la pharmacie."
                hover={false}
              >
                <div className="space-y-3">
                  {paymentMethodsError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {paymentMethodsError}
                    </div>
                  )}

                  {!paymentMethodsError &&
                    !paymentMethods.some((method) => method.configured) && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    {paymentMethodsMessage ||
                        "Cette pharmacie n'a pas encore configuré ses modes de paiement."}
                    </div>
                  )}

                  {paymentMethods.length > 0 &&
                    paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.code}
                        method={method}
                        disabled={submitting || Boolean(paymentMethodsError)}
                        selected={selectedPaymentMethod?.code === method.code}
                        onClick={setSelectedPaymentMethod}
                      />
                    ))}
                </div>

                {selectedPaymentMethod && (
                  <div className="mt-4 rounded-2xl border border-[#2FA6A3]/20 bg-[#E8F7F3] p-4">
                    <p className="text-sm font-black text-[#1C2B4A]">
                      Paiement via {selectedPaymentMethod.name}
                    </p>
                    <p className="mt-1 text-sm text-[#167769]">
                      Numero pharmacie : {selectedPaymentMethod.accountNumber}
                    </p>
                    {selectedPaymentMethod.instructions && (
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#167769]">
                        {selectedPaymentMethod.instructions}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-[#167769]">
                      Beneficiaire :{" "}
                      {selectedPaymentMethod.beneficiaryName ||
                        pharmacy?.nom ||
                        "Pharmacie"}
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faPhone} className="text-[#2F6E9E]" />
                      Numero client
                    </span>
                    <input
                      value={clientPhone}
                      disabled={submitting}
                      onChange={(event) => setClientPhone(event.target.value)}
                      className="w-full rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 text-sm font-semibold text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                      placeholder="+22233613535"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faCreditCard} className="text-[#2F6E9E]" />
                      Transaction ID
                    </span>
                    <input
                      value={transactionId}
                      disabled={submitting}
                      onChange={(event) => setTransactionId(event.target.value)}
                      className="w-full rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 text-sm font-semibold text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10"
                      placeholder="Reference de paiement"
                    />
                  </label>

                  <PaymentProofUpload
                    file={paymentProof}
                    disabled={submitting}
                    onChange={setPaymentProof}
                  />
                </div>
              </Card>

              <Card
                title="Panier"
                action={<Badge variant="blue">{totalItems} article(s)</Badge>}
                hover={false}
              >
                {cartItems.length === 0 ? (
                  <p className="rounded-2xl bg-[#F8FBFF] px-4 py-5 text-center text-sm font-semibold text-[#6B7280]">
                    Aucun medicament selectionne.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id_stock}
                        className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#1C2B4A]">
                              {item.medicament_nom}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                              {Number(item.prix || 0).toFixed(2)} MRU / unite
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleRemoveCartItem(item.id_stock)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-xl border border-[#E2E8F2] bg-white">
                            <button
                              type="button"
                              disabled={submitting || Number(item.quantite) <= 1}
                              onClick={() =>
                                handleCartQuantityChange(
                                  item.id_stock,
                                  Number(item.quantite) - 1
                                )
                              }
                              className="px-3 py-2 text-sm font-black text-[#2F6E9E] disabled:opacity-40"
                            >
                              -
                            </button>
                            <span className="min-w-8 px-2 text-center text-sm font-black text-[#1C2B4A]">
                              {item.quantite}
                            </span>
                            <button
                              type="button"
                              disabled={
                                submitting ||
                                Number(item.quantite) >=
                                  Number(item.quantite_disponible || 1)
                              }
                              onClick={() =>
                                handleCartQuantityChange(
                                  item.id_stock,
                                  Number(item.quantite) + 1
                                )
                              }
                              className="px-3 py-2 text-sm font-black text-[#2F6E9E] disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-black text-[#1C2B4A]">
                            {(
                              Number(item.prix || 0) * Number(item.quantite || 0)
                            ).toFixed(2)}{" "}
                            MRU
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <OrderSummary
                totalItems={totalItems}
                medicinesAmount={medicinesAmount}
                deliveryFee={0}
                reservationType={reservationType}
                paymentMethod={selectedPaymentMethod}
                submitting={submitting}
                onSubmit={handleSubmitCheckout}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;
