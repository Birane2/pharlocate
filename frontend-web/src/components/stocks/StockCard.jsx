import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faPenToSquare,
  faTriangleExclamation,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import StockStatusBadge, { getStockStatus } from "./StockStatusBadge";
import { getPublicMediaUrl } from "../../services/pharmacyService";

function StockCard({ stock, onEdit, onDelete, deleting = false, active = false }) {
  const medicament = stock.medicament_data || stock.medicament || {};
  const photoUrl = getPublicMediaUrl(medicament.photo);
  const status = getStockStatus(stock);

  return (
    <Card
      className={`h-full bg-white/95 shadow-[0_18px_42px_rgba(47,110,158,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(47,110,158,0.14)] ${
        active
          ? "border-2 border-[#2F6E9E] shadow-[0_24px_56px_rgba(47,110,158,0.18)]"
          : "border-[#2F6E9E]/10"
      }`}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="overflow-hidden rounded-[1.35rem] border border-[#2F6E9E]/10 bg-[linear-gradient(145deg,_rgba(47,110,158,0.05),_rgba(47,166,163,0.08))]">
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={medicament.nom || "Medicament"}
                className="h-44 w-full object-cover transition duration-500 hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
              />
              <div className="hidden h-44 items-center justify-center text-[#2F6E9E]">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/80 shadow-[0_14px_30px_rgba(47,110,158,0.12)]">
                  <FontAwesomeIcon icon={faCapsules} className="text-2xl" />
                </div>
              </div>
            </>
          ) : null}

          <div
            className={`${photoUrl ? "hidden h-44" : "flex h-44"} items-center justify-center text-[#2F6E9E]`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/80 shadow-[0_14px_30px_rgba(47,110,158,0.12)]">
              <FontAwesomeIcon icon={faCapsules} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StockStatusBadge stock={stock} />
          <Badge variant="blue">Quantite: {stock.quantite}</Badge>
          {active && <Badge variant="info">En cours de modification</Badge>}
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-[#16324A]">
            {medicament.nom || stock.medicament_nom || "Medicament"}
          </h3>
          <p className="mt-2 text-sm leading-7 text-pharmaTextLight">
            {medicament.description || "Aucune description disponible pour ce medicament."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#2F6E9E]/8 bg-[#F7FBFD] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              Prix
            </p>
            <p className="mt-2 text-lg font-black text-[#16324A]">{stock.prix} DH</p>
          </div>
          <div className="rounded-2xl border border-[#2F6E9E]/8 bg-[#F7FBFD] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
              Seuil d'alerte
            </p>
            <p className="mt-2 text-lg font-black text-[#16324A]">{stock.seuil_alerte}</p>
          </div>
        </div>

        {status === "faible" && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
              <span>Ce stock est sous le seuil d'alerte. Une mise a jour est recommandee.</span>
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            icon={faPenToSquare}
            onClick={() => onEdit(stock)}
          >
            Modifier
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 border border-red-200/70 bg-red-50 text-red-600 hover:bg-red-100"
            icon={faTrashCan}
            loading={deleting}
            onClick={() => onDelete(stock)}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default StockCard;
