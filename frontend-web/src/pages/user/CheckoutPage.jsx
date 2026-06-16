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
import DeliveryAddressForm from "../../components/delivery/DeliveryAddressForm";
import PaymentMethodCard from "../../components/payment/PaymentMethodCard";
import PaymentProofUpload from "../../components/payment/PaymentProofUpload";
import OrderSummary from "../../components/reservation/OrderSummary";
import ReservationTypeSelector from "../../components/reservation/ReservationTypeSelector";
import { getPublicPharmacyDetail } from "../../services/pharmacyService";
import { getPharmacyPaymentMethods } from "../../services/paymentService";
import { checkoutReservation } from "../../services/reservationService";
import { calculateDeliveryFee } from "../../services/deliveryService";
import { getStocksByPharmacy } from "../../services/stockService";

const initialDelivery = { address: "", note: "" };

function extractMedicamentId(item) {
  const candidates = [
    item?.medicament_id,
    item?.medicament?.id,
    item?.medicament,
    item?.medicament_data?.id,
    item?.medicamentData?.id,
  ];
  for (const candidate of candidates) {
    const v = Number(candidate);
    if (Number.isInteger(v) && v > 0) return v;
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
      "Aucune description disponible.",
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
  if (error.response?.status === 401) return "Votre session a expire. Veuillez vous reconnecter.";
  if (error.response?.status === 403) return "Votre compte n'est pas autorise a effectuer cette action.";
  const data = error.response?.data;
  return String(data?.error || data?.message || data?.detail || extractFirstApiMessage(data) || fallback);
}

function getPreselectedStockInfo(stockId, stocks) {
  if (!stockId || stocks.length === 0) return { stock: null, message: "", type: "" };
  const target = stocks.find((s) => String(s.id_stock) === String(stockId));
  if (!target || Number(target.quantite || 0) <= 0) {
    return { stock: null, type: "error", message: "Le medicament selectionne est indisponible." };
  }
  return {
    stock: target,
    type: "success",
    message: `${target.medicament_nom} a ete ajoute automatiquement au panier.`,
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
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [paymentMethodsMessage, setPaymentMethodsMessage] = useState("");
  const [toast, setToast] = useState(null);

  /* ── Chargement initial ── */
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setPaymentMethodsError("");
        setPaymentMethodsMessage("");

        const paymentRequest = getPharmacyPaymentMethods(pharmacyId).catch((err) => ({
          methods: [],
          loadError: getApiErrorMessage(err, "Impossible de charger les methodes de paiement."),
        }));

        const [pharmacyData, stocksData, paymentData] = await Promise.all([
          getPublicPharmacyDetail(pharmacyId),
          getStocksByPharmacy(pharmacyId),
          paymentRequest,
        ]);

        if (!isMounted) return;

        const nextStocks = (stocksData.results || []).map(normalizePublicStock);
        const nextDrafts = {};
        nextStocks.forEach((s) => { nextDrafts[s.id_stock] = 1; });
        const preselected = getPreselectedStockInfo(stockId, nextStocks);

        setPharmacy(pharmacyData);
        setStocks(nextStocks);
        setDraftQuantities(nextDrafts);
        setPaymentMethods(paymentData.methods || []);
        setPaymentMethodsError(paymentData.loadError || "");
        setPaymentMethodsMessage(
          paymentData.message || "Aucun mode de paiement n'a encore ete configure par cette pharmacie."
        );
        setSelectedPaymentMethod(
          (paymentData.methods || []).find((m) => m.configured) || null
        );
        setCartItems(
          preselected.stock
            ? [{ ...preselected.stock, quantite: 1, quantite_disponible: Number(preselected.stock.quantite || 0) }]
            : []
        );
      } catch (err) {
        if (isMounted) setError(getApiErrorMessage(err, "Impossible de charger les informations du checkout."));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [pharmacyId, stockId]);

  /* ── GPS + calcul frais livraison ── */
  useEffect(() => {
    if (reservationType !== "livraison") {
      setClientLocation(null);
      setLocationStatus("");
      setDeliveryFee(null);
      setDeliveryFeeLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("GPS non disponible sur cet appareil.");
      return;
    }

    setLocationStatus("Recuperation de votre position...");
    setDeliveryFeeLoading(true);
    setDeliveryFee(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setClientLocation({ latitude: lat, longitude: lon });
        setLocationStatus("Position GPS recuperee. Calcul des frais en cours...");

        try {
          const data = await calculateDeliveryFee({
            pharmacy_id: Number(pharmacyId),
            latitude_client: lat,
            longitude_client: lon,
          });
          const fee = Number(data.frais_livraison);
          setDeliveryFee(fee);
          setLocationStatus("Position GPS recuperee automatiquement.");
        } catch (err) {
          const apiMsg = err?.response?.data?.error || "";
          if (apiMsg.includes("position GPS") || apiMsg.includes("GPS")) {
            setLocationStatus(
              "La pharmacie n'a pas encore configure sa position GPS. Les frais de livraison ne peuvent pas etre calcules."
            );
          } else {
            setLocationStatus(
              "Impossible de calculer les frais de livraison. Reessayez plus tard."
            );
          }
          setDeliveryFee(null);
        } finally {
          setDeliveryFeeLoading(false);
        }
      },
      () => {
        setClientLocation(null);
        setLocationStatus(
          "Permission GPS refusee. Autorisez la geolocalisation pour continuer avec la livraison."
        );
        setDeliveryFeeLoading(false);
        setDeliveryFee(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [reservationType, pharmacyId]);

  /* ── Memos ── */
  const selectedStockInfo = useMemo(
    () => getPreselectedStockInfo(stockId, stocks),
    [stockId, stocks]
  );

  const sortedStocks = useMemo(
    () =>
      [...stocks].sort((a, b) => {
        const aAvail = Number(a.quantite || 0) > 0 ? 1 : 0;
        const bAvail = Number(b.quantite || 0) > 0 ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        return String(a.medicament_nom || "").localeCompare(String(b.medicament_nom || ""));
      }),
    [stocks]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((t, i) => t + Number(i.quantite || 0), 0),
    [cartItems]
  );

  const medicinesAmount = useMemo(
    () => cartItems.reduce((t, i) => t + Number(i.quantite || 0) * Number(i.prix || 0), 0),
    [cartItems]
  );

  const resolvedDeliveryFee = reservationType === "livraison" ? (deliveryFee ?? 0) : 0;
  const totalAmount = medicinesAmount + resolvedDeliveryFee;

  /* ── Handlers ── */
  const updateDelivery = (key, value) =>
    setDelivery((d) => ({ ...d, [key]: value }));

  const handleReservationTypeChange = (nextType) => {
    setReservationType(nextType);
    if (nextType === "livraison") {
      setLocationStatus("Recuperation automatique de votre position...");
    }
  };

  const handleDraftQuantityChange = (id, value) =>
    setDraftQuantities((d) => ({ ...d, [id]: value }));

  const handleAddToCart = (stock) => {
    const desired = Number(draftQuantities[stock.id_stock] || 1);
    const max = Number(stock.quantite || 0);
    if (max <= 0) {
      setToast({ type: "error", message: "Ce medicament est en rupture de stock." });
      return;
    }
    if (desired > max) {
      setToast({ type: "error", message: `Stock disponible : ${max}.` });
      return;
    }
    setCartItems((cart) => {
      const exists = cart.find((i) => i.id_stock === stock.id_stock);
      if (exists) {
        return cart.map((i) =>
          i.id_stock === stock.id_stock
            ? { ...i, quantite: desired, quantite_disponible: max }
            : i
        );
      }
      return [...cart, { ...stock, quantite: desired, quantite_disponible: max }];
    });
    setToast({ type: "success", message: `${stock.medicament_nom} ajoute au panier.` });
  };

  const handleCartQuantityChange = (id, next) =>
    setCartItems((cart) =>
      cart.map((i) =>
        i.id_stock === id
          ? { ...i, quantite: Math.min(Math.max(Number(next || 1), 1), Number(i.quantite_disponible || 1)) }
          : i
      )
    );

  const handleRemoveCartItem = (id) =>
    setCartItems((cart) => cart.filter((i) => i.id_stock !== id));

  const validateCheckout = () => {
    if (cartItems.length === 0) return "Ajoutez au moins un medicament avant de confirmer.";
    if (!selectedPaymentMethod) return "Choisissez une methode de paiement.";
    if (!clientPhone.trim()) return "Le numero de telephone client est obligatoire.";
    if (!transactionId.trim()) return "Le transaction ID est obligatoire.";
    if (!paymentProof) return "La capture de paiement est obligatoire.";
    if (reservationType === "livraison") {
      if (!delivery.address.trim()) return "Ajoutez l'adresse de livraison.";
      if (!clientLocation) return "La position GPS est obligatoire pour la livraison.";
    }
    return "";
  };

  const handleSubmitCheckout = async () => {
    const msg = validateCheckout();
    if (msg) { setToast({ type: "error", message: msg }); return; }

    try {
      setSubmitting(true);
      setToast(null);

      await checkoutReservation({
        pharmacie: Number(pharmacyId),
        typeReservation: reservationType,
        items: cartItems.map((i) => ({
          stock: i.id_stock,
          medicament: extractMedicamentId(i),
          quantite: Number(i.quantite),
        })),
        paymentMethod: selectedPaymentMethod.id,
        clientPhone: clientPhone.trim(),
        transactionId: transactionId.trim(),
        paymentProof,
        fraisLivraison: resolvedDeliveryFee,
        montantTotal: totalAmount,
        delivery:
          reservationType === "livraison"
            ? {
                adresse_livraison: delivery.address.trim(),
                telephone: clientPhone.trim(),
                note: delivery.note.trim(),
                latitude: clientLocation.latitude,
                longitude: clientLocation.longitude,
                frais_livraison: resolvedDeliveryFee,
              }
            : null,
      });

      setToast({ type: "success", message: "Commande envoyee. Paiement en attente de verification." });
      setTimeout(() => navigate("/user/reservations"), 900);
    } catch (err) {
      setToast({ type: "error", message: getApiErrorMessage(err, "Impossible d'envoyer la commande.") });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Rendu ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed right-4 top-[68px] z-40">
          <div
            className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold shadow-md ${
              toast.type === "success"
                ? "border-[#2FA6A3]/30 bg-white text-[#13795f]"
                : "border-red-200 bg-white text-red-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">

        {/* Header compact */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2FA6A3]">
              Nouvelle reservation
            </p>
            <h1 className="mt-0.5 text-xl font-black text-[#1C2B4A]">
              {pharmacy?.nom || "Finaliser la commande"}
            </h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={faArrowLeft}
            onClick={() => navigate(pharmacyId ? `/pharmacies/${pharmacyId}` : "/pharmacies")}
          >
            Retour
          </Button>
        </div>

        {/* Hero compact */}
        <div className="mt-3 rounded-2xl border border-[#2F6E9E]/15 bg-gradient-to-r from-[#2F6E9E] to-[#2FA6A3] px-4 py-3 text-white shadow-md">
          <p className="text-sm font-black sm:text-base">
            Retrait ou livraison, paiement direct a la pharmacie.
          </p>
          <p className="mt-0.5 text-[11px] text-white/75">
            Choisissez le type de commande, renseignez le paiement et envoyez la preuve.
          </p>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-[#E2E8F2] bg-white py-16">
            <p className="text-sm font-semibold text-[#2F6E9E]">Chargement...</p>
          </div>
        ) : error ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F2] bg-white py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
            <h2 className="mt-3 text-base font-bold text-[#1C2B4A]">Checkout indisponible</h2>
            <p className="mt-1 max-w-sm text-xs text-[#6B7280]">{error}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[55%_45%]">

            {/* ── Colonne gauche : Médicaments ── */}
            <div className="space-y-3">
              <Card
                title="Medicaments disponibles"
                action={<Badge variant="blue">{sortedStocks.length} produit(s)</Badge>}
                hover={false}
                bodyClassName="p-3"
              >
                {/* Pharmacie */}
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#EEF4FA] bg-[#F8FBFF] px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-[#2F6E9E]" />
                  <p className="text-sm font-bold text-[#1C2B4A]">
                    {pharmacy?.nom || `Pharmacie #${pharmacyId}`}
                  </p>
                </div>

                {/* Message medicament preselectionne */}
                {selectedStockInfo.message && (
                  <div
                    className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      selectedStockInfo.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#2FA6A3]/20 bg-[#E8F7F3] text-[#13795f]"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={selectedStockInfo.type === "error" ? faCircleExclamation : faCircleInfo}
                      className="mt-0.5 shrink-0"
                    />
                    {selectedStockInfo.message}
                  </div>
                )}

                {sortedStocks.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FA] text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faCapsules} className="text-xl" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#1C2B4A]">Aucun medicament reservable</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sortedStocks.map((stock) => (
                      <MedicamentReservationCard
                        key={stock.id_stock}
                        stock={stock}
                        quantity={draftQuantities[stock.id_stock] || 1}
                        inCart={cartItems.some((i) => i.id_stock === stock.id_stock)}
                        disabled={submitting}
                        onQuantityChange={(v) => handleDraftQuantityChange(stock.id_stock, v)}
                        onAddToCart={() => handleAddToCart(stock)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Colonne droite : Sticky panel ── */}
            <aside className="space-y-3 xl:sticky xl:top-[68px] xl:self-start">

              {/* Type de commande */}
              <Card title="Type de commande" hover={false} bodyClassName="p-3">
                <ReservationTypeSelector
                  value={reservationType}
                  disabled={submitting}
                  onChange={handleReservationTypeChange}
                />
              </Card>

              {/* Livraison */}
              {reservationType === "livraison" && (
                <Card title="Livraison" hover={false} bodyClassName="p-3">
                  <DeliveryAddressForm
                    values={delivery}
                    disabled={submitting}
                    locationStatus={locationStatus}
                    onChange={updateDelivery}
                  />
                </Card>
              )}

              {/* Paiement */}
              <Card title="Paiement" subtitle="Direct a la pharmacie." hover={false} bodyClassName="p-3">
                <div className="space-y-2">
                  {paymentMethodsError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {paymentMethodsError}
                    </div>
                  )}

                  {!paymentMethodsError && !paymentMethods.some((m) => m.configured) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      {paymentMethodsMessage}
                    </div>
                  )}

                  {paymentMethods.map((method) => (
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
                  <div className="mt-3 rounded-xl border border-[#2FA6A3]/20 bg-[#E8F7F3] px-3 py-2.5">
                    <p className="text-xs font-black text-[#1C2B4A]">
                      Via {selectedPaymentMethod.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#167769]">
                      N° : {selectedPaymentMethod.accountNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-[#167769]">
                      Beneficiaire : {selectedPaymentMethod.beneficiaryName || pharmacy?.nom || "Pharmacie"}
                    </p>
                    {selectedPaymentMethod.instructions && (
                      <p className="mt-1 text-[11px] leading-4 text-[#167769]">
                        {selectedPaymentMethod.instructions}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faPhone} className="text-[#2F6E9E] text-[10px]" />
                      Numero client
                    </span>
                    <input
                      value={clientPhone}
                      disabled={submitting}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F2] bg-white px-3 py-2 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/10"
                      placeholder="+22233613535"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faCreditCard} className="text-[#2F6E9E] text-[10px]" />
                      Transaction ID
                    </span>
                    <input
                      value={transactionId}
                      disabled={submitting}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F2] bg-white px-3 py-2 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/10"
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

              {/* Panier */}
              <Card
                title="Panier"
                action={<Badge variant="blue">{totalItems} article(s)</Badge>}
                hover={false}
                bodyClassName="p-3"
              >
                {cartItems.length === 0 ? (
                  <p className="rounded-xl bg-[#F8FBFF] px-3 py-4 text-center text-xs font-semibold text-[#6B7280]">
                    Aucun medicament selectionne.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id_stock}
                        className="rounded-xl border border-[#E2E8F2] bg-[#F8FBFF] p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-xs font-bold text-[#1C2B4A]">
                              {item.medicament_nom}
                            </p>
                            <p className="text-[11px] text-[#6B7280]">
                              {Number(item.prix || 0).toFixed(2)} MRU / unite
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleRemoveCartItem(item.id_stock)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-lg border border-[#E2E8F2] bg-white">
                            <button
                              type="button"
                              disabled={submitting || Number(item.quantite) <= 1}
                              onClick={() => handleCartQuantityChange(item.id_stock, Number(item.quantite) - 1)}
                              className="px-2.5 py-1 text-xs font-black text-[#2F6E9E] disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="min-w-[28px] text-center text-xs font-black text-[#1C2B4A]">
                              {item.quantite}
                            </span>
                            <button
                              type="button"
                              disabled={submitting || Number(item.quantite) >= Number(item.quantite_disponible || 1)}
                              onClick={() => handleCartQuantityChange(item.id_stock, Number(item.quantite) + 1)}
                              className="px-2.5 py-1 text-xs font-black text-[#2F6E9E] disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-xs font-black text-[#1C2B4A]">
                            {(Number(item.prix || 0) * Number(item.quantite || 0)).toFixed(2)} MRU
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Resume + bouton envoi */}
              <OrderSummary
                totalItems={totalItems}
                medicinesAmount={medicinesAmount}
                deliveryFee={reservationType === "livraison" ? deliveryFee : 0}
                deliveryFeeLoading={deliveryFeeLoading}
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
