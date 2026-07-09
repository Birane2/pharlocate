import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faLocationDot,
  faMagnifyingGlass,
  faSpinner,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAURITANIA_CENTER = { lat: 18.0735, lng: -15.9582 };
const SCRIPT_ID = "pharmalocate-gmaps";
const LOAD_TIMEOUT_MS = 15000;

// ─── Error catalogue ──────────────────────────────────────────────────────────

const ERR = {
  NO_KEY: "no_key",
  AUTH: "auth",
  NETWORK: "network",
  TIMEOUT: "timeout",
};

const ERR_INFO = {
  [ERR.NO_KEY]: {
    title: "Clé API Google Maps manquante",
    steps: [
      "Ouvrez le fichier frontend-web/.env",
      "Ajoutez la ligne : VITE_GOOGLE_MAPS_API_KEY=AIzaSy…votre_cle",
      "Redémarrez le serveur Vite (Ctrl+C puis npm run dev)",
      "Créez une clé sur console.cloud.google.com/apis/credentials",
    ],
  },
  [ERR.AUTH]: {
    title: "Clé API invalide ou APIs non activées",
    steps: [
      "Activez Maps JavaScript API dans Google Cloud Console",
      "Activez Places API dans Google Cloud Console",
      "Activez Geocoding API dans Google Cloud Console",
      "Autorisez http://localhost:5173/* dans les restrictions HTTP",
      "Vérifiez que la clé dans .env est correcte et sans espace",
    ],
  },
  [ERR.NETWORK]: {
    title: "Erreur de chargement Google Maps",
    steps: [
      "Vérifiez votre connexion internet",
      "Désactivez temporairement les bloqueurs de publicités",
      "Réessayez dans quelques instants",
    ],
  },
  [ERR.TIMEOUT]: {
    title: "Délai de chargement dépassé",
    steps: [
      "Vérifiez votre connexion internet",
      "Rechargez la page et réessayez",
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[GoogleMapPicker] VITE_GOOGLE_MAPS_API_KEY =", key || "(vide — .env manquant ou clé non renseignée)");
  }
  return (key || "").trim();
}

function extractAddressComponents(components = []) {
  const get = (...types) => {
    for (const type of types) {
      const c = components.find((x) => x.types.includes(type));
      if (c) return c.long_name;
    }
    return "";
  };
  return {
    city: get("locality", "administrative_area_level_2", "sublocality_level_1", "sublocality"),
    region: get("administrative_area_level_1"),
    country: get("country"),
    postal_code: get("postal_code"),
  };
}

function buildMapsScriptUrl(apiKey) {
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr`;
}

// ─── ErrorPanel ───────────────────────────────────────────────────────────────

function ErrorPanel({ type, onRetry }) {
  const info = ERR_INFO[type] || ERR_INFO[ERR.NETWORK];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-[#F8FAFC] p-8">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-amber-500" />
      </span>

      <div className="max-w-sm text-center">
        <p className="text-sm font-bold text-[#1C2B4A]">{info.title}</p>

        <ol className="mt-3 space-y-1.5 text-left">
          {info.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#6B7280]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2F6E9E]/10 text-[9px] font-bold text-[#2F6E9E]">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {type !== ERR.NO_KEY && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-[#2F6E9E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1F5B87]"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GoogleMapPicker({ onClose, onConfirm, initialLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mountedRef = useRef(true);

  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // ── Marker helper ──────────────────────────────────────────────────────────

  const placeMarker = (position) => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    markerRef.current?.setMap(null);

    markerRef.current = new window.google.maps.Marker({
      position,
      map,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 16 26 16 26S32 26.5 32 16C32 7.16 24.84 0 16 0z"
                  fill="#2F6E9E"/>
            <circle cx="16" cy="16" r="7" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 42),
        anchor: new window.google.maps.Point(16, 42),
      },
    });
  };

  // ── Reverse geocode ────────────────────────────────────────────────────────

  const reverseGeocode = async (loc) => {
    if (!mountedRef.current) return;
    setIsGeocoding(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: loc });
      const place = result.results?.[0];
      const { city, region, country, postal_code } = extractAddressComponents(
        place?.address_components || []
      );
      if (mountedRef.current) {
        setSelectedLocation({
          lat: loc.lat,
          lng: loc.lng,
          address:
            place?.formatted_address ||
            `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
          city,
          region,
          country,
          postal_code,
          google_place_id: place?.place_id || "",
        });
      }
    } catch {
      if (mountedRef.current) {
        setSelectedLocation({
          lat: loc.lat,
          lng: loc.lng,
          address: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
          city: "", region: "", country: "", postal_code: "", google_place_id: "",
        });
      }
    } finally {
      if (mountedRef.current) setIsGeocoding(false);
    }
  };

  // ── Map initialisation ─────────────────────────────────────────────────────

  const initMap = () => {
    if (!mountedRef.current) return;
    const container = mapContainerRef.current;
    if (!container || !window.google?.maps) return;

    const center = initialLocation
      ? { lat: Number(initialLocation.lat), lng: Number(initialLocation.lng) }
      : MAURITANIA_CENTER;

    const map = new window.google.maps.Map(container, {
      center,
      zoom: initialLocation ? 16 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      gestureHandling: "greedy",
    });

    mapRef.current = map;
    if (mountedRef.current) setIsLoading(false);

    // Initial marker & location if editing
    if (initialLocation) {
      placeMarker(center);
      setSelectedLocation({
        lat: Number(initialLocation.lat),
        lng: Number(initialLocation.lng),
        address: initialLocation.address || "",
        city: initialLocation.city || "",
        region: initialLocation.region || "",
        country: initialLocation.country || "",
        postal_code: initialLocation.postal_code || "",
        google_place_id: initialLocation.google_place_id || "",
      });
    }

    // Places Autocomplete
    if (searchInputRef.current && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { fields: ["geometry", "formatted_address", "address_components", "place_id"] }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const loc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        map.setCenter(loc);
        map.setZoom(17);
        placeMarker(loc);

        const { city, region, country, postal_code } = extractAddressComponents(
          place.address_components || []
        );

        setSelectedLocation({
          lat: loc.lat,
          lng: loc.lng,
          address: place.formatted_address || "",
          city, region, country, postal_code,
          google_place_id: place.place_id || "",
        });
      });
    }

    // Click → place marker + geocode
    map.addListener("click", (event) => {
      const loc = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      placeMarker(loc);
      reverseGeocode(loc);
    });
  };

  // ── Script loader ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    const apiKey = getApiKey();

    if (!apiKey) {
      setIsLoading(false);
      setErrorType(ERR.NO_KEY);
      return;
    }

    // Already loaded from a previous open
    if (window.google?.maps) {
      initMap();
      return;
    }

    let timeoutId;
    let pollId;

    const handleAuthFailure = () => {
      if (!mountedRef.current) return;
      setIsLoading(false);
      setErrorType(ERR.AUTH);
    };

    // Google Maps calls this when the key is invalid or APIs are disabled
    window.gm_authFailure = handleAuthFailure;

    const handleScriptError = () => {
      if (!mountedRef.current) return;
      clearTimeout(timeoutId);
      setIsLoading(false);
      setErrorType(ERR.NETWORK);
    };

    const handleScriptLoad = () => {
      clearTimeout(timeoutId);
      // Small delay to let gm_authFailure fire if needed
      setTimeout(() => {
        if (!mountedRef.current) return;
        if (window.google?.maps) {
          initMap();
        } else {
          setIsLoading(false);
          setErrorType(ERR.AUTH);
        }
      }, 200);
    };

    // Timeout safety net
    timeoutId = setTimeout(() => {
      if (!mountedRef.current) return;
      clearInterval(pollId);
      setIsLoading(false);
      setErrorType(ERR.TIMEOUT);
    }, LOAD_TIMEOUT_MS);

    // Existing script (loading from another component)
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      pollId = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(pollId);
          clearTimeout(timeoutId);
          if (mountedRef.current) initMap();
        }
      }, 100);
      return () => {
        clearInterval(pollId);
        clearTimeout(timeoutId);
        mountedRef.current = false;
      };
    }

    // Inject script
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = buildMapsScriptUrl(apiKey);
    script.async = true;
    script.defer = true;
    script.onload = handleScriptLoad;
    script.onerror = handleScriptError;
    document.head.appendChild(script);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      clearInterval(pollId);
      // Don't remove the script — reuse on next open
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // ── Retry handler ─────────────────────────────────────────────────────────

  const handleRetry = () => {
    // Remove old script so it reloads fresh
    const old = document.getElementById(SCRIPT_ID);
    if (old) old.remove();
    window.google = undefined;

    setErrorType(null);
    setIsLoading(true);
    setSelectedLocation(null);
    setRetryCount((n) => n + 1);
  };

  // ── Confirm ───────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (selectedLocation) onConfirm(selectedLocation);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ height: "min(88vh, 680px)" }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F2] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2F6E9E]/10">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="text-[#2F6E9E]"
                style={{ fontSize: "13px" }}
              />
            </span>
            <h2 className="text-sm font-bold text-[#1C2B4A]">
              Choisir l&apos;emplacement de votre pharmacie
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F8FAFC] hover:text-[#1C2B4A]"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* ── Search bar ──────────────────────────────────────── */}
        <div className="shrink-0 border-b border-[#E2E8F2] px-4 py-3">
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              style={{ fontSize: "12px" }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher une pharmacie ou une adresse…"
              className="w-full rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] py-2.5 pl-8 pr-4 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2F6E9E] focus:ring-2 focus:ring-[#2F6E9E]/10 placeholder:text-[#9CA3AF] disabled:opacity-50"
              disabled={!!errorType || isLoading}
            />
          </div>
          {!errorType && (
            <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
              Recherchez puis cliquez précisément sur l&apos;emplacement de votre pharmacie.
            </p>
          )}
        </div>

        {/* ── Map area ────────────────────────────────────────── */}
        <div className="relative min-h-0 flex-1">
          {/* Map div — always in DOM so ref stays valid */}
          <div
            ref={mapContainerRef}
            className="h-full w-full"
            style={{ visibility: (isLoading || errorType) ? "hidden" : "visible" }}
          />

          {/* Loading overlay */}
          {isLoading && !errorType && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#2F6E9E]" />
              <p className="text-sm font-medium text-[#6B7280]">Chargement de Google Maps…</p>
              <p className="text-[11px] text-[#9CA3AF]">Cela peut prendre quelques secondes.</p>
            </div>
          )}

          {/* Error overlay */}
          {errorType && (
            <ErrorPanel type={errorType} onRetry={handleRetry} />
          )}

          {/* Geocoding badge */}
          {isGeocoding && !isLoading && !errorType && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-lg ring-1 ring-[#E2E8F2]">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin text-[#2F6E9E]"
                  style={{ fontSize: "10px" }}
                />
                <span className="text-[11px] font-semibold text-[#6B7280]">
                  Récupération de l&apos;adresse…
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#E2E8F2] px-5 py-4">
          {/* Location preview */}
          {selectedLocation && !errorType ? (
            <div className="mb-3 rounded-xl border border-[#2FA6A3]/25 bg-[#E8F7F3] px-4 py-3">
              <div className="flex items-start gap-2.5">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="mt-0.5 shrink-0 text-[#2FA6A3]"
                  style={{ fontSize: "12px" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold text-[#167769]">
                    {selectedLocation.address}
                  </p>
                  {(selectedLocation.city || selectedLocation.country) && (
                    <p className="mt-0.5 text-[11px] text-[#2FA6A3]">
                      {[selectedLocation.city, selectedLocation.region, selectedLocation.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] text-[#4BA89B]">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            !errorType && !isLoading && (
              <div className="mb-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-center text-[11px] text-[#9CA3AF]">
                Cliquez sur la carte pour positionner votre pharmacie
              </div>
            )
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#E2E8F2] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#1C2B4A]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLocation || isGeocoding || !!errorType}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1F5B87] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: "11px" }} />
              Confirmer cet endroit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
