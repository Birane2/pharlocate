import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faLocationDot,
  faPhone,
  faShieldHeart,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function getAreaLabel(address) {
  if (!address) {
    return "Quartier non renseigne";
  }

  const [area] = String(address).split(",");
  return area?.trim() || "Quartier non renseigne";
}

function PharmacyCard({ pharmacy, onViewDetails }) {
  const areaLabel = getAreaLabel(pharmacy.adresse);
  const hasCoordinates = Boolean(pharmacy.latitude && pharmacy.longitude);

  return (
    <Card className="h-full border-[#2F6E9E]/10 bg-white/95">
      <div className="flex h-full flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" showIcon>
            Validee
          </Badge>
          <Badge variant={pharmacy.is_open ? "active" : "warning"} showIcon>
            {pharmacy.is_open ? "Ouverte" : "Fermee"}
          </Badge>
          {pharmacy.est_garde && (
            <Badge variant="info" showIcon>
              De garde
            </Badge>
          )}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
            {areaLabel}
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[#16324A]">
            {pharmacy.nom}
          </h2>
          <p className="mt-3 flex items-start gap-3 text-sm leading-7 text-pharmaTextLight">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="mt-1 text-[#2F6E9E]"
            />
            <span>{pharmacy.adresse}</span>
          </p>
          <p className="mt-2 flex items-center gap-3 text-sm text-pharmaTextLight">
            <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
            <span>{pharmacy.telephone}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2F6E9E]">
            <FontAwesomeIcon icon={faShieldHeart} />
            <span>Visibilite publique securisee</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-pharmaTextLight">
            Cette pharmacie est visible car elle a ete validee par l'administration.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {pharmacy.est_garde && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#2FA6A3]/10 px-3 py-1 text-xs font-semibold text-[#13795f]">
                <FontAwesomeIcon icon={faClock} />
                Service de garde signale
              </span>
            )}
            {hasCoordinates && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6E9E]/10 px-3 py-1 text-xs font-semibold text-[#2F6E9E]">
                Coordonnees disponibles
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            icon={faArrowRight}
            iconPosition="right"
            onClick={() => onViewDetails(pharmacy)}
          >
            Voir details
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default PharmacyCard;
