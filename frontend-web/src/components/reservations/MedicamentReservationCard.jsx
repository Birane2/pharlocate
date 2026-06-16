import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCapsules, faCartPlus } from "@fortawesome/free-solid-svg-icons";
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white transition hover:border-[#2F6E9E]/20 hover:shadow-sm">

      {/* Photo avec badges overlay */}
      <div className="relative h-[110px] shrink-0 overflow-hidden bg-[#EEF4FA]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={stock.medicament_nom}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.nextElementSibling;
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        <div
          style={{ display: photoUrl ? "none" : "flex" }}
          className="h-full items-center justify-center text-[#2F6E9E]/25"
        >
          <FontAwesomeIcon icon={faCapsules} className="text-4xl" />
        </div>

        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
              isAvailable
                ? "bg-emerald-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {isAvailable ? "Disponible" : "Rupture"}
          </span>
        </div>

        {inCart && (
          <div className="absolute right-1.5 top-1.5">
            <span className="rounded-full bg-[#2FA6A3]/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              Panier
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col gap-2 p-2.5">

        {/* Nom + infos compactes */}
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-[13px] font-bold text-[#1C2B4A]">
            {stock.medicament_nom}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
            <span className="font-bold text-[#2F6E9E]">{stock.prix} MRU</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="truncate text-[#6B7280]">
              {stock.medicament_categorie || "General"}
            </span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-[#6B7280]">Stock: {stock.quantite}</span>
          </div>
        </div>

        {/* Quantite */}
        <QuantitySelector
          value={quantity}
          min={1}
          max={Math.max(1, Number(stock.quantite || 1))}
          disabled={!isAvailable || disabled}
          onChange={onQuantityChange}
        />

        {/* Bouton panier */}
        <button
          type="button"
          disabled={!isAvailable || disabled}
          onClick={onAddToCart}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            inCart
              ? "bg-[#2FA6A3] text-white hover:bg-[#248C8A]"
              : "border border-[#2F6E9E]/20 bg-[#F0F6FC] text-[#2F6E9E] hover:border-[#2F6E9E]/40 hover:bg-[#2F6E9E] hover:text-white"
          }`}
        >
          <FontAwesomeIcon icon={faCartPlus} style={{ fontSize: "10px" }} />
          {inCart ? "Mettre a jour" : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}

export default MedicamentReservationCard;
