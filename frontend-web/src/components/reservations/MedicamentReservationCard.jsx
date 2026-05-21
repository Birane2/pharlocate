import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faCartPlus,
  faCoins,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import QuantitySelector from "./QuantitySelector";
import { getPublicMediaUrl } from "../../services/pharmacyService";

function MedicamentReservationCard({
  stock,
  quantity,
  inCart = false,
  disabled = false,
  onQuantityChange,
  onAddToCart,
}) {
  const isAvailable = Number(stock.quantite || 0) > 0;
  const photoUrl = getPublicMediaUrl(stock.medicament_photo);

  return (
    <Card className="h-full border-[#2F6E9E]/10 bg-white/95">
      <div className="flex h-full flex-col gap-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-[#2F6E9E]/10 bg-[linear-gradient(145deg,_rgba(47,110,158,0.06),_rgba(47,166,163,0.06))]">
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={stock.medicament_nom}
                className="h-40 w-full object-cover transition duration-500 hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
              />
              <div className="hidden h-40 items-center justify-center text-[#2F6E9E]">
                <FontAwesomeIcon icon={faCapsules} className="text-4xl" />
              </div>
            </>
          ) : null}

          <div
            className={`items-center justify-center text-[#2F6E9E] ${
              photoUrl ? "hidden h-40" : "flex h-40"
            }`}
          >
            <FontAwesomeIcon icon={faCapsules} className="text-4xl" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAvailable ? "success" : "danger"} showIcon>
            {stock.status || (isAvailable ? "Disponible" : "Rupture")}
          </Badge>
          <Badge variant="blue">Stock: {stock.quantite}</Badge>
          {inCart && <Badge variant="info">Dans le panier</Badge>}
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-[#16324A]">
            {stock.medicament_nom}
          </h3>
          <p className="mt-2 text-sm leading-7 text-pharmaTextLight">
            {stock.medicament_description || "Aucune description disponible pour ce medicament."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F7FBFD] px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faCoins} />
              Prix
            </p>
            <p className="mt-2 text-base font-black text-[#16324A]">{stock.prix}</p>
          </div>
          <div className="rounded-2xl bg-[#F7FBFD] px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faLayerGroup} />
              Categorie
            </p>
            <p className="mt-2 text-base font-black text-[#16324A]">
              {stock.medicament_categorie || "General"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#1C2B4A]">Quantite a reserver</p>
            <QuantitySelector
              value={quantity}
              min={1}
              max={Math.max(1, Number(stock.quantite || 1))}
              disabled={!isAvailable || disabled}
              onChange={onQuantityChange}
            />
          </div>

          <Button
            type="button"
            variant={inCart ? "secondary" : "outline"}
            className="w-full"
            icon={faCartPlus}
            disabled={!isAvailable || disabled}
            onClick={onAddToCart}
          >
            {inCart ? "Mettre a jour le panier" : "Ajouter au panier"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default MedicamentReservationCard;
