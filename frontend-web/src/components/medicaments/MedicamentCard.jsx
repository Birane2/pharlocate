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
import { getPublicMediaUrl } from "../../services/pharmacyService";

function MedicamentCard({ stock, onReserve }) {
  const isAvailable = Number(stock.quantite || 0) > 0;
  const medicamentName = stock.medicament_nom || stock.medicament?.nom || "Medicament";
  const medicamentDescription =
    stock.medicament_description ||
    stock.medicament?.description ||
    "Aucune description disponible pour ce medicament.";
  const medicamentCategory =
    stock.medicament_categorie || stock.medicament?.categorie || "General";
  const photoUrl = getPublicMediaUrl(stock.medicament_photo || stock.medicament?.photo);
  const statusLabel = stock.status || stock.statut || (isAvailable ? "Disponible" : "Rupture");

  return (
    <Card className="h-full border-[#2F6E9E]/10 bg-white/95" bodyClassName="p-4">
      <div className="flex h-full flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-[#2F6E9E]/10 bg-[linear-gradient(145deg,_rgba(47,110,158,0.06),_rgba(47,166,163,0.06))]">
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={medicamentName}
                className="h-28 w-full object-cover transition duration-500 hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
              />
              <div className="hidden h-28 items-center justify-center text-[#2F6E9E]">
                <FontAwesomeIcon icon={faCapsules} className="text-3xl" />
              </div>
            </>
          ) : null}

          <div
            className={`items-center justify-center text-[#2F6E9E] ${
              photoUrl ? "hidden h-28" : "flex h-28"
            }`}
          >
            <FontAwesomeIcon icon={faCapsules} className="text-3xl" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAvailable ? "success" : "danger"} showIcon>
            {statusLabel}
          </Badge>
          <Badge variant="blue">Quantite: {stock.quantite}</Badge>
        </div>

        <div>
          <h3 className="line-clamp-1 text-lg font-black tracking-tight text-[#16324A]">
            {medicamentName}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-pharmaTextLight">
            {medicamentDescription}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
                <FontAwesomeIcon icon={faCoins} />
                Prix
              </p>
              <p className="mt-2 text-base font-black text-[#16324A]">
                {stock.prix}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
                <FontAwesomeIcon icon={faLayerGroup} />
                Categorie
              </p>
              <p className="mt-2 text-base font-black text-[#16324A]">
                {medicamentCategory}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            icon={faCartPlus}
            disabled={!isAvailable}
            onClick={() => onReserve(stock)}
          >
            Reserver ce medicament
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default MedicamentCard;
