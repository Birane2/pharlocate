const OSRM_BASE_URL = "https://router.project-osrm.org";
const ROUTING_TIMEOUT_MS = 12000;

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Le calcul de l'itineraire a depasse le delai autorise."));
      }, timeoutMs);
    }),
  ]);
}

function ensureValidCoordinatePair(point, label) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Coordonnees ${label} invalides.`);
  }

  return { lat, lng };
}

function decodePolyline(encoded) {
  let index = 0;
  const coordinates = [];
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const latitudeDelta = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += latitudeDelta;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const longitudeDelta = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += longitudeDelta;

    coordinates.push({
      lat: latitude / 1e5,
      lng: longitude / 1e5,
    });
  }

  return coordinates;
}

function formatDistanceText(distanceInMeters) {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceInMeters)} m`;
}

function formatDurationText(durationInSeconds) {
  const totalMinutes = Math.round(durationInSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

export async function computeRouteWithOsrm({ origin, destination }) {
  const safeOrigin = ensureValidCoordinatePair(origin, "de depart");
  const safeDestination = ensureValidCoordinatePair(destination, "de destination");

  const requestUrl =
    `${OSRM_BASE_URL}/route/v1/driving/` +
    `${safeOrigin.lng},${safeOrigin.lat};${safeDestination.lng},${safeDestination.lat}` +
    `?overview=full&geometries=polyline&steps=false`;

  console.log("[routingService] requete OSRM", requestUrl);

  const response = await withTimeout(fetch(requestUrl), ROUTING_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error("Impossible de joindre le service d'itineraire.");
  }

  const data = await response.json();
  console.log("[routingService] reponse OSRM", data);

  if (data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes.length) {
    throw new Error("Impossible de calculer l'itineraire pour le moment.");
  }

  const route = data.routes[0];
  const path = decodePolyline(route.geometry);

  return {
    path,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    distanceText: formatDistanceText(route.distance),
    durationText: formatDurationText(route.duration),
  };
}
