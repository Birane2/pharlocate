const GOOGLE_MAPS_SCRIPT_ID = "pharmalocate-google-maps-script";

let googleMapsLoaderPromise = null;

export const NOUAKCHOTT_CENTER = {
  lat: 18.0735,
  lng: -15.9582,
};

function getPlacesStatusMessage(status) {
  switch (status) {
    case "ZERO_RESULTS":
      return "Aucune pharmacie Google Maps n'a ete trouvee dans cette zone.";
    case "REQUEST_DENIED":
      return "Google Places a refuse la requete. Verifiez la cle API, les restrictions de domaine, le billing et l'activation de Places API.";
    case "OVER_QUERY_LIMIT":
      return "Le quota Google Places est depasse. Verifiez le billing et les limites de quota.";
    case "INVALID_REQUEST":
      return "La requete Google Places est invalide. Verifiez la position, le rayon et les parametres envoyes.";
    default:
      return "Impossible de recuperer les pharmacies Google Maps pour le moment.";
  }
}

function calculateDistanceInMeters(origin, destination) {
  if (!origin || !destination) {
    return null;
  }

  const earthRadiusMeters = 6371000;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const lat2 = (destination.lat * Math.PI) / 180;
  const lng2 = (destination.lng * Math.PI) / 180;
  const deltaLat = lat2 - lat1;
  const deltaLng = lng2 - lng1;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMeters * c);
}

function createGoogleMapsPlaceUrl(placeId) {
  if (!placeId) {
    return "";
  }

  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

async function importGoogleLibrary(googleMaps, libraryName) {
  if (googleMaps?.maps?.importLibrary) {
    return googleMaps.maps.importLibrary(libraryName);
  }

  return {};
}

function normalizeGooglePlace(place, origin) {
  const location = place?.geometry?.location;
  const latitude =
    typeof location?.lat === "function" ? location.lat() : location?.lat ?? null;
  const longitude =
    typeof location?.lng === "function" ? location.lng() : location?.lng ?? null;

  const destination =
    latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null;

  return {
    id: `google-${place.place_id}`,
    internalId: null,
    source: "google",
    placeId: place.place_id,
    nom: place.name || "Pharmacie Google Maps",
    adresse: place.vicinity || place.formatted_address || "Adresse non renseignee",
    latitude,
    longitude,
    telephone:
      place.formatted_phone_number ||
      place.international_phone_number ||
      "",
    businessStatus: place.business_status || "",
    googleMapsUrl: createGoogleMapsPlaceUrl(place.place_id),
    distance: calculateDistanceInMeters(origin, destination),
  };
}

export function loadGoogleMapsApi() {
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  console.log("[GoogleMapsService] cle API Google Maps presente:", Boolean(apiKey));

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "La cle Google Maps est absente. Ajoutez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env."
      )
    );
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () =>
        reject(new Error("Impossible de charger Google Maps."))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Impossible de charger Google Maps."));
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

export function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La geolocalisation n'est pas disponible sur cet appareil."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            "La geolocalisation a ete refusee. La carte a ete recentree sur Nouakchott."
          )
        ),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

export async function searchExternalPharmaciesNearby({
  googleMaps,
  center,
  radius = 10000,
  keyword = "pharmacie",
}) {
  if (!googleMaps?.maps || !center) {
    console.error("[GoogleMapsService] Google Maps ou centre manquant pour Places", {
      hasGoogleMaps: Boolean(googleMaps?.maps),
      center,
    });
    return [];
  }

  await importGoogleLibrary(googleMaps, "places");

  const runNearbySearch = (searchKeyword) =>
    new Promise((resolve, reject) => {
      const serviceContainer = document.createElement("div");
      const service = new googleMaps.maps.places.PlacesService(serviceContainer);
      const request = {
        location: center,
        radius: Math.min(Number(radius || 10000), 50000),
        keyword: searchKeyword,
        type: "pharmacy",
      };

      console.log("[GoogleMapsService] requete Places nearbySearch", request);

      service.nearbySearch(request, (results, status) => {
        console.log("[GoogleMapsService] statut Places nearbySearch", status);
        console.log(
          "[GoogleMapsService] nombre de pharmacies Google trouvees",
          Array.isArray(results) ? results.length : 0
        );

        if (
          status === googleMaps.maps.places.PlacesServiceStatus.ZERO_RESULTS ||
          !results?.length
        ) {
          resolve({
            status: "ZERO_RESULTS",
            results: [],
          });
          return;
        }

        if (status !== googleMaps.maps.places.PlacesServiceStatus.OK) {
          const error = new Error(getPlacesStatusMessage(status));
          error.status = status;
          reject(error);
          return;
        }

        resolve({
          status: "OK",
          results: results.map((place) => normalizeGooglePlace(place, center)),
        });
      });
    });

  try {
    const primaryResult = await runNearbySearch(keyword);

    if (primaryResult.status === "OK") {
      return primaryResult.results;
    }

    if (primaryResult.status === "ZERO_RESULTS" && keyword !== "pharmacy") {
      console.log(
        "[GoogleMapsService] aucun resultat avec le mot-cle francais, tentative de secours avec 'pharmacy'"
      );
      const fallbackResult = await runNearbySearch("pharmacy");
      return fallbackResult.results;
    }

    return [];
  } catch (error) {
    console.error("[GoogleMapsService] erreur Places nearbySearch", error);
    throw error;
  }
}

export async function getGooglePlaceDetails({ googleMaps, placeId, origin }) {
  if (!googleMaps?.maps || !placeId) {
    return null;
  }

  await importGoogleLibrary(googleMaps, "places");

  return new Promise((resolve) => {
    const serviceContainer = document.createElement("div");
    const service = new googleMaps.maps.places.PlacesService(serviceContainer);

    service.getDetails(
      {
        placeId,
        fields: [
          "name",
          "formatted_address",
          "formatted_phone_number",
          "international_phone_number",
          "geometry",
          "business_status",
          "url",
          "place_id",
        ],
      },
      (place, status) => {
        if (
          status !== googleMaps.maps.places.PlacesServiceStatus.OK ||
          !place
        ) {
          resolve(null);
          return;
        }

        const normalizedPlace = normalizeGooglePlace(
          {
            ...place,
            vicinity: place.formatted_address,
          },
          origin
        );

        resolve({
          ...normalizedPlace,
          googleMapsUrl: place.url || normalizedPlace.googleMapsUrl,
        });
      }
    );
  });
}

export async function computeDrivingRoute({
  googleMaps,
  origin,
  destination,
}) {
  if (!googleMaps?.maps || !origin || !destination) {
    throw new Error("Les coordonnees d'origine et de destination sont requises.");
  }

  console.log("[GoogleMapsService] calcul itineraire", { origin, destination });

  const directionsService = new googleMaps.maps.DirectionsService();

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: googleMaps.maps.TravelMode.DRIVING,
        unitSystem: googleMaps.maps.UnitSystem.METRIC,
      },
      (result, status) => {
        console.log("[GoogleMapsService] statut Directions", status);

        if (status !== "OK" || !result?.routes?.length) {
          const error = new Error("Impossible de calculer l'itineraire.");
          error.status = status;
          reject(error);
          return;
        }

        const firstLeg = result.routes[0]?.legs?.[0];

        resolve({
          result,
          distanceText: firstLeg?.distance?.text || "",
          durationText: firstLeg?.duration?.text || "",
        });
      }
    );
  });
}

export function formatDistance(distanceInMeters) {
  const numericDistance = Number(distanceInMeters || 0);

  if (numericDistance >= 1000) {
    return `${(numericDistance / 1000).toFixed(1)} km`;
  }

  return `${Math.round(numericDistance)} m`;
}

export function buildGoogleMapsDirectionsLink(origin, destination) {
  if (!origin || !destination) {
    return "";
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}
