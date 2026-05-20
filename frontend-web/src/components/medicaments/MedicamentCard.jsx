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
  const isAvailable = stock.quantite > 0;
  const medicament = stock.medicament || {};
  const photoUrl = getPublicMediaUrl(medicament.photo);

  return (
    <Card className="h-full border-[#2F6E9E]/10 bg-white/95">
      <div className="flex h-full flex-col gap-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-[#2F6E9E]/10 bg-[linear-gradient(145deg,_rgba(47,110,158,0.06),_rgba(47,166,163,0.06))]">
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={medicament.nom || "Medicament"}
                className="h-40 w-full object-cover rounded-lg shadow-[0_12px_24px_rgba(47,110,158,0.08)] transition duration-500 hover:scale-[1.02]"
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
            className={`items-center justify-center text-[#2F6E9E] ${photoUrl ? "hidden h-40" : "flex h-40"}`}
          >
            <FontAwesomeIcon icon={faCapsules} className="text-4xl" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAvailable ? "success" : "danger"} showIcon>
            {stock.statut || (isAvailable ? "Disponible" : "Rupture")}
          </Badge>
          <Badge variant="blue">
            Quantite: {stock.quantite}
          </Badge>
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-[#16324A]">
            {medicament.nom || "Medicament"}
          </h3>
          <p className="mt-2 text-sm leading-7 text-pharmaTextLight">
            {medicament.description || "Aucune description disponible pour ce medicament."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F7FBFD] px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faCoins} />
              Prix
            </p>
            <p className="mt-2 text-base font-black text-[#16324A]">
              {stock.prix} DH
            </p>
          </div>
          <div className="rounded-xl bg-[#F7FBFD] px-3 py-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              <FontAwesomeIcon icon={faLayerGroup} />
              Categorie
            </p>
            <p className="mt-2 text-base font-black text-[#16324A]">
              {medicament.categorie || "General"}
            </p>
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
            Reserver
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default MedicamentCard;
