import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLocationDot,
  faMapLocationDot,
  faPhone,
  faRoute,
  faShieldHeart,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import {
  buildGoogleMapsDirectionsLink,
  formatDistance,
} from "../../services/googleMapsService";

function getSourceBadge(pharmacy) {
  if (pharmacy.source === "google") {
    return {
      label: "Google Maps",
      variant: "warning",
      iconContainer: "bg-orange-50 text-orange-600",
    };
  }

  return {
    label: "PharmaLocate",
    variant: "info",
    iconContainer: "bg-[#E8F7F3] text-[#2FA6A3]",
  };
}

function getBusinessStatusLabel(pharmacy) {
  if (pharmacy.source !== "google") {
    return null;
  }

  const normalizedStatus = String(pharmacy.businessStatus || "").toUpperCase();

  if (normalizedStatus === "OPERATIONAL") {
    return { label: "Operationnelle", variant: "success" };
  }

  if (normalizedStatus === "CLOSED_TEMPORARILY") {
    return { label: "Fermee temporairement", variant: "warning" };
  }

  if (normalizedStatus === "CLOSED_PERMANENTLY") {
    return { label: "Fermee definitivement", variant: "danger" };
  }

  return null;
}

function PharmacyPopup({ pharmacy, userPosition, onShowDirections, routeLoading = false }) {
  const navigate = useNavigate();

  if (!pharmacy) {
    return null;
  }

  const sourceBadge = getSourceBadge(pharmacy);
  const businessStatus = getBusinessStatusLabel(pharmacy);
  const directionsLink = buildGoogleMapsDirectionsLink(userPosition, {
    lat: Number(pharmacy.latitude),
    lng: Number(pharmacy.longitude),
  });

  return (
    <div className="rounded-2xl border border-[#E2E8F2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${sourceBadge.iconContainer}`}
          >
            <FontAwesomeIcon icon={faStore} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[#1C2B4A]">
                {pharmacy.nom}
              </h2>
              <Badge variant={sourceBadge.variant}>{sourceBadge.label}</Badge>
              {pharmacy.source === "internal" && pharmacy.est_garde && (
                <Badge variant="success">De garde</Badge>
              )}
              {businessStatus && (
                <Badge variant={businessStatus.variant}>{businessStatus.label}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-[#6B7A99]">{pharmacy.adresse}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-[#6B7A99]">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
          <span>{pharmacy.telephone || "Telephone non renseigne"}</span>
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faLocationDot} className="text-[#2F6E9E]" />
          <span>
            {Number.isFinite(Number(pharmacy.distance))
              ? `A environ ${formatDistance(pharmacy.distance)} de votre position`
              : "Distance en cours de calcul"}
          </span>
        </div>

        {pharmacy.source === "internal" && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={pharmacy.is_open ? "success" : "warning"}>
              {pharmacy.is_open ? "Ouverte maintenant" : "Fermee actuellement"}
            </Badge>
            {pharmacy.est_garde && <Badge variant="info">Service de garde</Badge>}
          </div>
        )}

        {pharmacy.source === "google" && (
          <p className="rounded-2xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            Cette pharmacie provient de Google Maps et n'est pas encore enregistree dans PharmaLocate.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {pharmacy.source === "internal" ? (
          <Button
            type="button"
            variant="outline"
            icon={faMapLocationDot}
            onClick={() => navigate(`/pharmacies/${pharmacy.internalId || pharmacy.id}`)}
          >
            Voir detail
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            icon={faMapLocationDot}
            onClick={() => {
              if (pharmacy.googleMapsUrl) {
                window.open(pharmacy.googleMapsUrl, "_blank", "noopener,noreferrer");
              }
            }}
          >
            Ouvrir Google Maps
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          icon={faRoute}
          loading={routeLoading}
          onClick={() => onShowDirections(pharmacy)}
        >
          Itineraire
        </Button>
      </div>

      {pharmacy.source === "internal" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F8FBFF] px-3 py-2 text-xs font-semibold text-[#45617E]">
          <FontAwesomeIcon icon={pharmacy.est_garde ? faShieldHeart : faClock} />
          <span>
            {pharmacy.est_garde
              ? "Pharmacie interne prioritaire pour les besoins urgents."
              : "Pharmacie validee dans le systeme PharmaLocate."}
          </span>
        </div>
      )}

      {directionsLink && (
        <div className="mt-4 text-right">
          <button
            type="button"
            className="text-sm font-semibold text-[#2F6E9E] underline-offset-4 transition hover:underline"
            onClick={() => window.open(directionsLink, "_blank", "noopener,noreferrer")}
          >
            Ouvrir l'itineraire dans Google Maps
          </button>
        </div>
      )}
    </div>
  );
}

export default PharmacyPopup;
