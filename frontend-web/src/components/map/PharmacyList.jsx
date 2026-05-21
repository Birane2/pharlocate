import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLocationDot,
  faPhone,
  faShieldHeart,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatDistance } from "../../services/googleMapsService";

function getSourcePresentation(pharmacy) {
  if (pharmacy.source === "google") {
    return {
      badgeLabel: "Google Maps",
      badgeVariant: "warning",
      iconClassName: "bg-orange-50 text-orange-600",
    };
  }

  return {
    badgeLabel: "PharmaLocate",
    badgeVariant: "info",
    iconClassName: pharmacy.est_garde
      ? "bg-[#E8F7F3] text-[#167769]"
      : "bg-[#E8F0FA] text-[#2F6E9E]",
  };
}

function PharmacyList({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onShowDirections,
}) {
  if (pharmacies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D8E3F0] bg-[#F8FBFF] px-4 py-8 text-center">
        <p className="text-sm leading-7 text-[#6B7A99]">
          Aucune pharmacie n'a ete trouvee dans cette zone pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pharmacies.map((pharmacy) => {
        const isActive = selectedPharmacyId === pharmacy.id;
        const sourcePresentation = getSourcePresentation(pharmacy);

        return (
          <div
            key={pharmacy.id}
            className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 ${
              isActive
                ? "border-[#2FA6A3] bg-[#F2FBF9] ring-2 ring-[#2FA6A3]/15"
                : "border-[#E2E8F2] bg-white hover:border-[#2F6E9E]/30 hover:bg-[#F8FBFF]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${sourcePresentation.iconClassName}`}
              >
                <FontAwesomeIcon icon={pharmacy.est_garde ? faShieldHeart : faStore} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-[#1C2B4A]">
                    {pharmacy.nom}
                  </h3>
                  <Badge variant={sourcePresentation.badgeVariant}>
                    {sourcePresentation.badgeLabel}
                  </Badge>
                  {pharmacy.source === "internal" && pharmacy.est_garde && (
                    <Badge variant="success">De garde</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-[#6B7A99]">{pharmacy.adresse}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-[#6B7A99]">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
                <span>{pharmacy.telephone || "Telephone non renseigne"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-[#2F6E9E]" />
                <span>
                  {Number.isFinite(Number(pharmacy.distance))
                    ? formatDistance(pharmacy.distance)
                    : "Distance indisponible"}
                </span>
              </div>
              {pharmacy.source === "internal" && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-[#2F6E9E]" />
                  <span>
                    {pharmacy.is_open ? "Ouverte actuellement" : "Fermee actuellement"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onSelectPharmacy(pharmacy)}
              >
                Voir sur la carte
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onShowDirections(pharmacy)}
              >
                Itineraire
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PharmacyList;
