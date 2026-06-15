import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

function hasCoordinates(latitude, longitude) {
  return latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
}

function GoogleMapsButton({ latitude, longitude, compact = false }) {
  const enabled = hasCoordinates(latitude, longitude);

  const openMaps = () => {
    if (!enabled) {
      return;
    }

    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={openMaps}
      disabled={!enabled}
      title={enabled ? "Ouvrir la position dans Google Maps" : "Position GPS indisponible"}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-black transition ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
      } ${
        enabled
          ? "bg-[#2FA6A3] text-white shadow-sm hover:bg-[#238985]"
          : "cursor-not-allowed bg-slate-100 text-slate-400"
      }`}
    >
      <FontAwesomeIcon icon={faMapLocationDot} />
      {enabled ? "Google Maps" : "GPS indisponible"}
    </button>
  );
}

export default GoogleMapsButton;
