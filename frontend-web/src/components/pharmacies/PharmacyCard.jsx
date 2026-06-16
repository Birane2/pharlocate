import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClinicMedical,
  faLocationDot,
  faPhone,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";
import { getPublicMediaUrl } from "../../services/pharmacyService";

function getDistanceLabel(pharmacy) {
  const distance =
    pharmacy.distance_km ?? pharmacy.distanceKm ?? pharmacy.distance ?? null;

  if (distance === null || distance === undefined || distance === "") {
    return null;
  }

  const numericDistance = Number(distance);

  if (Number.isNaN(numericDistance)) {
    return String(distance);
  }

  return `${numericDistance.toFixed(numericDistance < 10 ? 1 : 0)} km`;
}

function PharmacyCard({ pharmacy, onViewDetails }) {
  const photoUrl = getPublicMediaUrl(pharmacy.photo);
  const distanceLabel = getDistanceLabel(pharmacy);
  const phone = pharmacy.telephone || pharmacy.phone || pharmacy.phone_number;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2F6E9E]/20 hover:shadow-md">

      {/* Photo avec badges en overlay */}
      <div className="relative h-[128px] shrink-0 overflow-hidden bg-[#EEF4FA]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={pharmacy.nom}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-[#2F6E9E]/25">
            <FontAwesomeIcon icon={faClinicMedical} className="text-4xl" />
          </div>
        )}

        {/* Badges statut en overlay bas-gauche */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm ${
              pharmacy.is_open
                ? "bg-emerald-500/90 text-white"
                : "bg-amber-500/90 text-white"
            }`}
          >
            {pharmacy.is_open ? "Ouverte" : "Fermee"}
          </span>
          {pharmacy.est_garde && (
            <span className="rounded-full bg-[#2F6E9E]/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              Garde
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-2 p-3">

        {/* Nom + adresse */}
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-[13px] font-bold leading-snug text-[#1C2B4A]">
            {pharmacy.nom}
          </h2>
          <p className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-snug text-[#6B7280]">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="mt-0.5 shrink-0 text-[#2F6E9E]"
              style={{ fontSize: "10px" }}
            />
            <span className="line-clamp-1">{pharmacy.adresse || "Adresse non renseignee"}</span>
          </p>
        </div>

        {/* Telephone + distance */}
        <div className="flex flex-col gap-1">
          {phone && (
            <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <FontAwesomeIcon
                icon={faPhone}
                className="shrink-0 text-[#2FA6A3]"
                style={{ fontSize: "10px" }}
              />
              <span className="truncate">{phone}</span>
            </p>
          )}
          {distanceLabel && (
            <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <FontAwesomeIcon
                icon={faRoute}
                className="shrink-0 text-[#2F6E9E]"
                style={{ fontSize: "10px" }}
              />
              <span>{distanceLabel}</span>
            </p>
          )}
        </div>

        {/* Bouton */}
        <button
          type="button"
          onClick={() => onViewDetails(pharmacy)}
          className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#2F6E9E]/15 bg-[#F0F6FC] py-2 text-[11px] font-bold text-[#2F6E9E] transition-all duration-200 hover:border-[#2F6E9E]/40 hover:bg-[#2F6E9E] hover:text-white"
        >
          Voir details
          <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "9px" }} />
        </button>
      </div>
    </div>
  );
}

export default PharmacyCard;
