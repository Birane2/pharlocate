import Badge from "../ui/Badge";
import Button from "../ui/Button";

function money(value) {
  const numericValue = Number(value || 0);
  return `${numericValue.toFixed(2)} MRU`;
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span
        className={`text-sm ${
          strong ? "text-lg font-black text-[#1C2B4A]" : "font-bold text-[#1C2B4A]"
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
  deliveryFee = 0,
  reservationType,
  paymentMethod,
  submitting,
  onSubmit,
}) {
  const totalAmount = Number(medicinesAmount || 0) + Number(deliveryFee || 0);

  return (
    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_#F8FBFF,_#FFFFFF)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-black text-[#1C2B4A]">Resume commande</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {totalItems} medicament(s) selectionne(s)
          </p>
        </div>
        <Badge variant={reservationType === "livraison" ? "info" : "blue"}>
          {reservationType === "livraison" ? "Livraison" : "Retrait"}
        </Badge>
      </div>

      <div className="mt-5 space-y-3">
        <Row label="Medicaments" value={money(medicinesAmount)} />
        {reservationType === "livraison" && (
          <Row label="Frais livraison" value="Calcules par la pharmacie" />
        )}
        <Row label="Paiement" value={paymentMethod?.name || "-"} />
        <div className="border-t border-[#E2E8F2] pt-3">
          <Row label="Total estime" value={money(totalAmount)} strong />
        </div>
      </div>

      <Button
        type="button"
        className="mt-5 w-full"
        loading={submitting}
        onClick={onSubmit}
      >
        Envoyer la commande
      </Button>
    </div>
  );
}

export default OrderSummary;
