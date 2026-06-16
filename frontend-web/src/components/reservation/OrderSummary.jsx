import Badge from "../ui/Badge";
import Button from "../ui/Button";

function money(value) {
  return `${Number(value || 0).toFixed(2)} MRU`;
}

function Row({ label, value, strong = false, dimmed = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs ${dimmed ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
        {label}
      </span>
      <span
        className={`text-right text-xs ${
          strong
            ? "text-sm font-black text-[#1C2B4A]"
            : dimmed
              ? "font-semibold text-[#9CA3AF]"
              : "font-bold text-[#1C2B4A]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function OrderSummary({
  totalItems,
  medicinesAmount,
  deliveryFee,
  deliveryFeeLoading = false,
  reservationType,
  paymentMethod,
  submitting,
  onSubmit,
}) {
  const isDelivery = reservationType === "livraison";
  const feeKnown = isDelivery ? deliveryFee !== null : true;
  const resolvedFee = isDelivery ? (deliveryFee ?? 0) : 0;
  const totalAmount = Number(medicinesAmount || 0) + resolvedFee;

  let deliveryFeeDisplay;
  let deliveryFeeDimmed = false;

  if (!isDelivery) {
    deliveryFeeDisplay = "0.00 MRU";
  } else if (deliveryFeeLoading) {
    deliveryFeeDisplay = "Calcul en cours...";
    deliveryFeeDimmed = true;
  } else if (deliveryFee === null) {
    deliveryFeeDisplay = "Non calcule";
    deliveryFeeDimmed = true;
  } else {
    deliveryFeeDisplay = money(deliveryFee);
  }

  return (
    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-gradient-to-b from-[#F8FBFF] to-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#1C2B4A]">Resume commande</p>
        <Badge variant={isDelivery ? "info" : "blue"}>
          {isDelivery ? "Livraison" : "Retrait"}
        </Badge>
      </div>

      {totalItems > 0 && (
        <p className="mt-0.5 text-[11px] text-[#6B7280]">
          {totalItems} medicament(s) selectionne(s)
        </p>
      )}

      <div className="mt-3 space-y-1.5">
        <Row label="Medicaments" value={money(medicinesAmount)} />
        <Row
          label="Frais livraison"
          value={deliveryFeeDisplay}
          dimmed={deliveryFeeDimmed}
        />
        <Row label="Paiement" value={paymentMethod?.name || "-"} />
        <div className="border-t border-[#E2E8F2] pt-2">
          <Row
            label="Total"
            value={feeKnown ? money(totalAmount) : money(medicinesAmount) + " *"}
            strong
            dimmed={!feeKnown}
          />
          {!feeKnown && (
            <p className="mt-1 text-[10px] text-[#9CA3AF]">
              * Hors frais de livraison non encore calcules
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="mt-3 w-full"
        loading={submitting}
        onClick={onSubmit}
      >
        Envoyer la commande
      </Button>
    </div>
  );
}

export default OrderSummary;
