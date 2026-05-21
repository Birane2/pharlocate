import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faReceipt,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import QuantitySelector from "./QuantitySelector";

function formatPrice(value) {
  const numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return String(value || "0");
  }

  return numericValue.toFixed(2);
}

function ReservationCart({
  pharmacyName,
  cartItems,
  totalItems,
  totalAmount,
  submitting = false,
  onQuantityChange,
  onRemoveItem,
  onSubmit,
}) {
  return (
    <Card
      title="Panier de reservation"
      subtitle="Verifiez les quantites avant d'envoyer votre reservation."
      action={<Badge variant="blue">{totalItems} article(s)</Badge>}
      hover={false}
      className="border-[#2F6E9E]/10 bg-white/95"
    >
      {pharmacyName && (
        <div className="mb-5 rounded-2xl border border-[#2F6E9E]/10 bg-[#F8FBFF] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
            Pharmacie
          </p>
          <p className="mt-2 text-base font-black text-[#16324A]">{pharmacyName}</p>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
            <FontAwesomeIcon icon={faReceipt} className="text-2xl" />
          </div>
          <h2 className="mt-5 text-xl font-black tracking-tight text-[#16324A]">
            Votre panier est vide
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-pharmaTextLight">
            Ajoutez un ou plusieurs medicaments disponibles pour preparer votre reservation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id_stock}
              className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] p-4"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCapsules} className="text-[#2F6E9E]" />
                      <p className="text-base font-black tracking-tight text-[#16324A]">
                        {item.medicament_nom}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-pharmaTextLight">
                      Prix unitaire: {formatPrice(item.prix)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={faTrashCan}
                    onClick={() => onRemoveItem(item.id_stock)}
                  >
                    Retirer
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <QuantitySelector
                    value={item.quantite}
                    min={1}
                    max={Math.max(1, Number(item.quantite_disponible || 1))}
                    disabled={submitting}
                    onChange={(value) => onQuantityChange(item.id_stock, value)}
                  />

                  <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                    <span className="text-pharmaTextLight">Sous-total: </span>
                    <span className="font-black text-[#16324A]">
                      {formatPrice(Number(item.prix) * Number(item.quantite))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.96),_rgba(255,255,255,0.98))] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black tracking-tight text-[#16324A]">
                  Total de la reservation
                </p>
                <p className="mt-1 text-sm text-pharmaTextLight">
                  {totalItems} medicament(s) selectionne(s)
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                  Montant estime
                </p>
                <p className="mt-2 text-2xl font-black text-[#16324A]">
                  {formatPrice(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            loading={submitting}
            onClick={onSubmit}
          >
            Confirmer la reservation
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ReservationCart;
