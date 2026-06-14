import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCompass,
  faLocationCrosshairs,
  faRotate,
  faRoute,
  faShieldHeart,
  faStore,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import PharmacyList from "../../components/map/PharmacyList";
import PharmacyMap from "../../components/map/PharmacyMap";
import PharmacyPopup from "../../components/map/PharmacyPopup";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getNearbyPharmacies } from "../../services/pharmacyService";
import {
  getBrowserPosition,
  getGooglePlaceDetails,
  loadGoogleMapsApi,
  NOUAKCHOTT_CENTER,
  searchExternalPharmaciesNearby,
} from "../../services/googleMapsService";
import { computeRouteWithOsrm } from "../../services/routingService";
import { getApiErrorMessage } from "../../utils/apiError";

const zoneOptions = [
  { value: "all", label: "Toutes les zones" },
  { value: "nouakchott", label: "Nouakchott" },
  { value: "nouadhibou", label: "Nouadhibou" },
  { value: "rosso", label: "Rosso" },
  { value: "kaedi", label: "Kaedi" },
];

const radiusOptions = [
  { value: "5000", label: "5 km" },
  { value: "10000", label: "10 km" },
  { value: "20000", label: "20 km" },
  { value: "50000", label: "50 km" },
];

const MAP_TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bpharmacie\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInternalPharmacy(pharmacy) {
  return {
    ...pharmacy,
    id: `internal-${pharmacy.id}`,
    internalId: pharmacy.id,
    source: "internal",
    googleMapsUrl: "",
    businessStatus: "",
  };
}

function isDuplicateOfInternal(internalPharmacies, externalPharmacy) {
  const externalName = normalizeText(externalPharmacy.nom);
  const externalAddress = normalizeText(externalPharmacy.adresse);

  return internalPharmacies.some((internalPharmacy) => {
    const internalName = normalizeText(internalPharmacy.nom);
    const internalAddress = normalizeText(internalPharmacy.adresse);
    const closeDistance =
      Number.isFinite(Number(internalPharmacy.distance)) &&
      Number.isFinite(Number(externalPharmacy.distance)) &&
      Math.abs(Number(internalPharmacy.distance) - Number(externalPharmacy.distance)) < 200;

    const similarName =
      internalName &&
      externalName &&
      (internalName.includes(externalName) || externalName.includes(internalName));
    const similarAddress =
      internalAddress &&
      externalAddress &&
      (internalAddress.includes(externalAddress) || externalAddress.includes(internalAddress));

    return similarName && (similarAddress || closeDistance);
  });
}

function mergePharmacies(internalPharmacies, externalPharmacies) {
  const safeInternalPharmacies = internalPharmacies.map(normalizeInternalPharmacy);
  const filteredExternalPharmacies = externalPharmacies.filter(
    (externalPharmacy) => !isDuplicateOfInternal(safeInternalPharmacies, externalPharmacy)
  );

  return [...safeInternalPharmacies, ...filteredExternalPharmacies].sort(
    (firstItem, secondItem) => {
      if (firstItem.est_garde !== secondItem.est_garde) {
        return firstItem.est_garde ? -1 : 1;
      }

      if (firstItem.source !== secondItem.source) {
        return firstItem.source === "internal" ? -1 : 1;
      }

      return Number(firstItem.distance || 0) - Number(secondItem.distance || 0);
    }
  );
}

function MapPage() {
  const navigate = useNavigate();
  const [googleMaps, setGoogleMaps] = useState(null);
  const [center, setCenter] = useState(NOUAKCHOTT_CENTER);
  const [userPosition, setUserPosition] = useState(null);
  const [internalPharmacies, setInternalPharmacies] = useState([]);
  const [externalPharmacies, setExternalPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [search, setSearch] = useState("");
  const [quartier, setQuartier] = useState("");
  const [zone, setZone] = useState("all");
  const [radius, setRadius] = useState("10000");
  const [gardeOnly, setGardeOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [pharmacyWarnings, setPharmacyWarnings] = useState([]);
  const [routeError, setRouteError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const clearRoute = () => {
    setRoutePath([]);
    setRouteInfo(null);
    setRouteError("");
  };

  const initializeMapData = async ({ nextCenter, nextRadius, mapsApi }) => {
    const warnings = [];

    const results = await Promise.allSettled([
      withTimeout(
        getNearbyPharmacies({
          lat: nextCenter.lat,
          lng: nextCenter.lng,
          radius: Number(nextRadius),
        }),
        MAP_TIMEOUT_MS,
        "Le backend nearby a depasse le delai autorise."
      ),
      withTimeout(
        searchExternalPharmaciesNearby({
          googleMaps: mapsApi,
          center: nextCenter,
          radius: Number(nextRadius),
          keyword: "pharmacy",
        }),
        MAP_TIMEOUT_MS,
        "Google Places a depasse le delai autorise."
      ),
    ]);

    const [internalResult, externalResult] = results;

    if (internalResult.status === "fulfilled") {
      console.log("[MapPage] reponse backend nearby", internalResult.value);
      setInternalPharmacies(internalResult.value || []);
    } else {
      console.error("[MapPage] erreur backend nearby", internalResult.reason);
      setInternalPharmacies([]);
      warnings.push(
        getApiErrorMessage(
          internalResult.reason,
          "Impossible de charger les pharmacies internes.",
          "Erreur serveur pendant le chargement des pharmacies internes."
        )
      );
    }

    if (externalResult.status === "fulfilled") {
      console.log("[MapPage] reponse Google Places", externalResult.value);
      setExternalPharmacies(externalResult.value || []);
    } else {
      console.error("[MapPage] erreur Google Places", externalResult.reason);
      setExternalPharmacies([]);
      warnings.push(
        getApiErrorMessage(
          externalResult.reason,
          "Impossible de charger les pharmacies Google Maps.",
          "Erreur serveur pendant le chargement des pharmacies Google Maps."
        )
      );
    }

    setPharmacyWarnings(warnings);
  };

  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
      console.log("[MapPage] cle API Google Maps presente:", Boolean(apiKey));

      if (!apiKey) {
        setMapError(
          "La cle Google Maps est absente. Ajoutez VITE_GOOGLE_MAPS_API_KEY dans le fichier .env."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setMapError("");
        setPharmacyWarnings([]);
        setRouteError("");
        setRoutePath([]);
        setRouteInfo(null);

        const mapsApi = await withTimeout(
          loadGoogleMapsApi(),
          MAP_TIMEOUT_MS,
          "Le chargement de Google Maps a depasse le delai autorise."
        );

        if (!isMounted) {
          return;
        }

        console.log("[MapPage] Google Maps charge avec succes");
        setGoogleMaps(mapsApi);

        let resolvedCenter = NOUAKCHOTT_CENTER;
        let resolvedUserPosition = null;

        try {
          resolvedUserPosition = await withTimeout(
            getBrowserPosition(),
            MAP_TIMEOUT_MS,
            "La geolocalisation a depasse le delai autorise."
          );

          if (!isMounted) {
            return;
          }

          resolvedCenter = resolvedUserPosition;
          setUserPosition(resolvedUserPosition);
          setCenter(resolvedUserPosition);
          setLocationMessage("Votre position a ete detectee avec succes.");
          console.log("[MapPage] position utilisateur", resolvedUserPosition);
        } catch (geoError) {
          if (!isMounted) {
            return;
          }

          console.error("[MapPage] erreur geolocalisation", geoError);
          setUserPosition(null);
          setCenter(NOUAKCHOTT_CENTER);
          setLocationMessage(
            "La geolocalisation est indisponible. La carte est centree sur Nouakchott."
          );
          resolvedCenter = NOUAKCHOTT_CENTER;
        }

        await initializeMapData({
          nextCenter: resolvedCenter,
          nextRadius: radius,
          mapsApi,
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        console.error("[MapPage] erreur chargement carte", requestError);
        setCenter(NOUAKCHOTT_CENTER);
        setUserPosition(null);
        setMapError(
          getApiErrorMessage(
            requestError,
            "Impossible de charger la carte ou les pharmacies.",
            "Erreur serveur pendant le chargement de la carte."
          )
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializePage();

    return () => {
      isMounted = false;
    };
  }, []);

  const mergedPharmacies = useMemo(
    () => mergePharmacies(internalPharmacies, externalPharmacies),
    [internalPharmacies, externalPharmacies]
  );

  const filteredPharmacies = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const normalizedQuartier = normalizeText(quartier);

    return mergedPharmacies.filter((pharmacy) => {
      const haystack = normalizeText(
        `${pharmacy.nom} ${pharmacy.adresse} ${pharmacy.telephone || ""}`
      );

      const matchesSearch =
        !normalizedSearch || haystack.includes(normalizedSearch);

      const matchesQuartier =
        !normalizedQuartier || haystack.includes(normalizedQuartier);

      const matchesZone =
        zone === "all" || haystack.includes(normalizeText(zone));

      const matchesGarde = !gardeOnly || pharmacy.est_garde === true;
      const matchesOpen =
        !openOnly || (pharmacy.source === "internal" && pharmacy.is_open === true);

      return (
        matchesSearch &&
        matchesQuartier &&
        matchesZone &&
        matchesGarde &&
        matchesOpen
      );
    });
  }, [mergedPharmacies, search, quartier, zone, gardeOnly, openOnly]);

  const guardCount = useMemo(
    () => filteredPharmacies.filter((pharmacy) => pharmacy.est_garde).length,
    [filteredPharmacies]
  );

  const internalCount = useMemo(
    () => filteredPharmacies.filter((pharmacy) => pharmacy.source === "internal").length,
    [filteredPharmacies]
  );

  const googleCount = useMemo(
    () => filteredPharmacies.filter((pharmacy) => pharmacy.source === "google").length,
    [filteredPharmacies]
  );

  useEffect(() => {
    if (!selectedPharmacy && filteredPharmacies[0]) {
      setSelectedPharmacy(filteredPharmacies[0]);
      return;
    }

    if (
      selectedPharmacy &&
      !filteredPharmacies.some((pharmacy) => pharmacy.id === selectedPharmacy.id)
    ) {
      setSelectedPharmacy(filteredPharmacies[0] || null);
    }
  }, [filteredPharmacies, selectedPharmacy]);

  const handleRefreshAroundUser = async () => {
    if (!googleMaps) {
      return;
    }

    const targetCenter = userPosition || center || NOUAKCHOTT_CENTER;

    try {
      setLoading(true);
      setPharmacyWarnings([]);
      setRouteError("");
      clearRoute();
      await initializeMapData({
        nextCenter: targetCenter,
        nextRadius: radius,
        mapsApi: googleMaps,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = async (event) => {
    const nextRadius = event.target.value;
    setRadius(nextRadius);

    if (!googleMaps) {
      return;
    }

    try {
      setLoading(true);
      setPharmacyWarnings([]);
      clearRoute();
      await initializeMapData({
        nextCenter: userPosition || center || NOUAKCHOTT_CENTER,
        nextRadius,
        mapsApi: googleMaps,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPharmacy = async (pharmacy) => {
    setSelectedPharmacy(pharmacy);

    if (pharmacy.source !== "google" || !pharmacy.placeId || !googleMaps) {
      return;
    }

    try {
      const details = await withTimeout(
        getGooglePlaceDetails({
          googleMaps,
          placeId: pharmacy.placeId,
          origin: userPosition || center,
        }),
        MAP_TIMEOUT_MS,
        "Le chargement du detail Google a depasse le delai autorise."
      );

      if (!details) {
        return;
      }

      console.log("[MapPage] detail Google pharmacie", details);

      setExternalPharmacies((currentExternalPharmacies) =>
        currentExternalPharmacies.map((currentPharmacy) =>
          currentPharmacy.id === pharmacy.id ? { ...currentPharmacy, ...details } : currentPharmacy
        )
      );
      setSelectedPharmacy((currentSelectedPharmacy) =>
        currentSelectedPharmacy?.id === pharmacy.id
          ? { ...currentSelectedPharmacy, ...details }
          : currentSelectedPharmacy
      );
    } catch (requestError) {
      console.error("[MapPage] erreur detail Google pharmacie", requestError);
    }
  };

  const handleShowDirections = async (pharmacy) => {
    const origin = userPosition || center;
    const safeOriginLat = Number(origin?.lat);
    const safeOriginLng = Number(origin?.lng);
    const safeDestinationLat = Number(pharmacy?.latitude);
    const safeDestinationLng = Number(pharmacy?.longitude);

    if (!origin) {
      setRouteError("Position de depart indisponible. Nouakchott sera utilisee apres rechargement.");
      return;
    }

    if (
      !Number.isFinite(safeOriginLat) ||
      !Number.isFinite(safeOriginLng)
    ) {
      setRouteError("Coordonnees utilisateur invalides.");
      return;
    }

    if (
      !Number.isFinite(safeDestinationLat) ||
      !Number.isFinite(safeDestinationLng)
    ) {
      setRouteError("Coordonnees de la pharmacie indisponibles.");
      return;
    }

    setRouteLoading(true);
    setSelectedPharmacy(pharmacy);
    setRouteError("");
    setRoutePath([]);

    try {
      const route = await withTimeout(
        computeRouteWithOsrm({
          origin,
          destination: {
            lat: safeDestinationLat,
            lng: safeDestinationLng,
          },
        }),
        MAP_TIMEOUT_MS,
        "Le calcul de l'itineraire a depasse le delai autorise."
      );

      setRoutePath(route.path || []);
      setRouteInfo({
        pharmacyName: pharmacy.nom,
        distanceText: route.distanceText,
        durationText: route.durationText,
      });
    } catch (requestError) {
      console.error("[MapPage] erreur itineraire", requestError);
      setRoutePath([]);
      setRouteInfo(null);
      setRouteError(
        getApiErrorMessage(
          requestError,
          "Impossible de calculer l'itineraire pour le moment.",
          "Erreur serveur pendant le calcul de l'itineraire."
        )
      );
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5FB]">
      <Navbar />

      <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(47,110,158,0.96),_rgba(47,166,163,0.9))] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge
                variant="info"
                className="border border-white/10 bg-white/15 text-white ring-white/10"
              >
                Carte interactive
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Priorisez les pharmacies de garde et reperez la meilleure option autour de vous.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
                La carte met desormais en avant les pharmacies de garde, distingue plus
                clairement les sources internes et Google Maps, et reste confortable
                a utiliser sur mobile comme sur grand ecran.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                icon={faArrowLeft}
                className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
                onClick={() => navigate("/")}
              >
                Retour a l'accueil
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={faLocationCrosshairs}
                onClick={handleRefreshAroundUser}
              >
                Actualiser autour de moi
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="order-2 space-y-6 xl:order-1">
            <Card
              title="Filtres de recherche"
              subtitle="Affinez la carte par nom, quartier, zone et priorites de service."
              hover={false}
            >
              <div className="space-y-4">
                <Input
                  label="Recherche"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nom, adresse ou telephone"
                />

                <Input
                  label="Quartier"
                  value={quartier}
                  onChange={(event) => setQuartier(event.target.value)}
                  placeholder="Ex. Tevragh-Zeina, Ksar, Sebkha"
                />

                <Input
                  type="select"
                  label="Zone"
                  value={zone}
                  onChange={(event) => setZone(event.target.value)}
                  options={zoneOptions}
                />

                <Input
                  type="select"
                  label="Rayon de recherche"
                  value={radius}
                  onChange={handleRadiusChange}
                  options={radiusOptions}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setGardeOnly((currentValue) => !currentValue)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      gardeOnly
                        ? "border-[#2FA6A3] bg-[#E8F7F3] text-[#167769]"
                        : "border-[#E2E8F2] bg-white text-[#45617E] hover:border-[#2FA6A3]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faShieldHeart} />
                      <span>Gardes uniquement</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenOnly((currentValue) => !currentValue)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      openOnly
                        ? "border-[#2F6E9E] bg-[#E8F0FA] text-[#2F6E9E]"
                        : "border-[#E2E8F2] bg-white text-[#45617E] hover:border-[#2F6E9E]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCompass} />
                      <span>Ouvertes maintenant</span>
                    </div>
                  </button>
                </div>
              </div>
            </Card>

            <Card
              title="Resultats"
              subtitle={`${filteredPharmacies.length} pharmacie(s) visible(s) dans la zone courante.`}
              action={
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">{guardCount} garde</Badge>
                  <Badge variant="info">{internalCount} internes</Badge>
                  <Badge variant="warning">{googleCount} Google</Badge>
                </div>
              }
              hover={false}
            >
              <PharmacyList
                pharmacies={filteredPharmacies}
                selectedPharmacyId={selectedPharmacy?.id || null}
                onSelectPharmacy={handleSelectPharmacy}
                onShowDirections={handleShowDirections}
              />
            </Card>
          </div>

          <div className="order-1 space-y-6 xl:order-2">
            {locationMessage && (
              <div className="rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 text-sm text-[#6B7A99] shadow-sm">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faCompass} className="mt-0.5 text-[#2F6E9E]" />
                  <span>{locationMessage}</span>
                </div>
              </div>
            )}

            {pharmacyWarnings.map((warningMessage) => (
              <div
                key={warningMessage}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
              >
                {warningMessage}
              </div>
            ))}

            {selectedPharmacy && (
              <PharmacyPopup
                pharmacy={selectedPharmacy}
                userPosition={userPosition || center}
                onShowDirections={handleShowDirections}
                routeLoading={routeLoading}
              />
            )}

            {routeError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {routeError}
              </div>
            )}

            {routeLoading && (
              <div className="rounded-2xl border border-[#2F6E9E]/15 bg-[#F8FBFF] px-4 py-3 text-sm font-medium text-[#2F6E9E]">
                Calcul de l'itineraire...
              </div>
            )}

            {routeInfo && (
              <Card
                title="Itineraire actif"
                subtitle={`Trajet calcule vers ${routeInfo.pharmacyName}.`}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearRoute}
                  >
                    Effacer l'itineraire
                  </Button>
                }
                hover={false}
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <div className="flex items-center gap-2 text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faRoute} />
                      <span className="text-sm font-bold">Distance</span>
                    </div>
                    <p className="mt-2 text-lg font-black text-[#1C2B4A]">
                      {routeInfo.distanceText || "Indisponible"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <div className="flex items-center gap-2 text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faCompass} />
                      <span className="text-sm font-bold">Duree estimee</span>
                    </div>
                    <p className="mt-2 text-lg font-black text-[#1C2B4A]">
                      {routeInfo.durationText || "Indisponible"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <div className="flex items-center gap-2 text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faStore} />
                      <span className="text-sm font-bold">Destination</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#1C2B4A]">
                      {routeInfo.pharmacyName}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {loading ? (
              <Card hover={false}>
                <div className="flex min-h-[420px] items-center justify-center text-center">
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                      <FontAwesomeIcon icon={faRotate} className="animate-spin" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#2F6E9E]">
                      Chargement de la carte et des pharmacies proches...
                    </p>
                  </div>
                </div>
              </Card>
            ) : mapError ? (
              <Card hover={false}>
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                  </div>
                  <h2 className="mt-4 text-xl font-bold tracking-tight text-[#1C2B4A]">
                    Carte indisponible
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-[#6B7A99]">{mapError}</p>
                </div>
              </Card>
            ) : (
              <>
                <PharmacyMap
                  googleMaps={googleMaps}
                  center={center}
                  userPosition={userPosition}
                  pharmacies={filteredPharmacies}
                  selectedPharmacy={selectedPharmacy}
                  routePath={routePath}
                  onSelectPharmacy={handleSelectPharmacy}
                />

                {!filteredPharmacies.length && (
                  <Card hover={false}>
                    <div className="py-10 text-center">
                      <h2 className="text-xl font-bold tracking-tight text-[#1C2B4A]">
                        Aucune pharmacie trouvee
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-[#6B7A99]">
                        La carte est bien chargee, mais aucun resultat ne correspond aux filtres actuels.
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}

            <Card
              title="Etat actuel de la carte"
              subtitle="Cette passe finalise surtout l'usage quotidien : priorite aux gardes, filtres plus pratiques et meilleur confort mobile."
              hover={false}
            >
              <div className="grid gap-3 text-sm text-[#6B7A99] md:grid-cols-4">
                <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                  <p className="font-bold text-[#1C2B4A]">Priorite</p>
                  <p className="mt-1">Les pharmacies de garde remontent en tete</p>
                </div>
                <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                  <p className="font-bold text-[#1C2B4A]">Filtres</p>
                  <p className="mt-1">Quartier, garde uniquement et ouvertes maintenant</p>
                </div>
                <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                  <p className="font-bold text-[#1C2B4A]">Mobile</p>
                  <p className="mt-1">Carte prioritaire puis liste detaillee juste en dessous</p>
                </div>
                <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                  <p className="font-bold text-[#1C2B4A]">Statuts</p>
                  <p className="mt-1">Ouverte, fermee et de garde mieux visibles</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
