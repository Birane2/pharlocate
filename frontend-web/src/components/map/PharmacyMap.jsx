import { useEffect, useRef } from "react";

function createMarkerIcon(fillColor, strokeColor) {
  return {
    path: "M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2ZM12 11.75C10.4812 11.75 9.25 10.5188 9.25 9C9.25 7.48122 10.4812 6.25 12 6.25C13.5188 6.25 14.75 7.48122 14.75 9C14.75 10.5188 13.5188 11.75 12 11.75Z",
    fillColor,
    fillOpacity: 1,
    strokeColor,
    strokeWeight: 1,
    scale: 1.8,
    anchor: new window.google.maps.Point(12, 22),
  };
}

function getMarkerStyle(pharmacy, isActive) {
  if (pharmacy.source === "google") {
    return isActive
      ? { fillColor: "#f59e0b", strokeColor: "#c2410c" }
      : { fillColor: "#fb923c", strokeColor: "#c2410c" };
  }

  if (pharmacy.est_garde) {
    return isActive
      ? { fillColor: "#16a34a", strokeColor: "#166534" }
      : { fillColor: "#22c55e", strokeColor: "#15803d" };
  }

  return isActive
    ? { fillColor: "#2FA6A3", strokeColor: "#13795f" }
    : { fillColor: "#2F6E9E", strokeColor: "#1F5B87" };
}

function PharmacyMap({
  googleMaps,
  center,
  userPosition,
  pharmacies,
  selectedPharmacy,
  routePath,
  onSelectPharmacy,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  useEffect(() => {
    if (!googleMaps || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current = new googleMaps.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

  }, [googleMaps, center]);

  useEffect(() => {
    if (!mapInstanceRef.current || !center) {
      return;
    }

    mapInstanceRef.current.setCenter(center);
  }, [center]);

  useEffect(() => {
    if (!googleMaps || !mapInstanceRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = pharmacies
      .filter((pharmacy) => pharmacy.latitude !== null && pharmacy.longitude !== null)
      .map((pharmacy) => {
        const isActive = selectedPharmacy?.id === pharmacy.id;
        const markerStyle = getMarkerStyle(pharmacy, isActive);
        const marker = new googleMaps.maps.Marker({
          map: mapInstanceRef.current,
          position: {
            lat: Number(pharmacy.latitude),
            lng: Number(pharmacy.longitude),
          },
          title: pharmacy.nom,
          icon: createMarkerIcon(markerStyle.fillColor, markerStyle.strokeColor),
        });

        marker.addListener("click", () => {
          onSelectPharmacy(pharmacy);
        });

        return marker;
      });
  }, [googleMaps, pharmacies, selectedPharmacy, onSelectPharmacy]);

  useEffect(() => {
    if (!googleMaps || !mapInstanceRef.current || !userPosition) {
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    userMarkerRef.current = new googleMaps.maps.Marker({
      map: mapInstanceRef.current,
      position: userPosition,
      title: "Votre position",
      icon: {
        path: googleMaps.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#5EC6B8",
        fillOpacity: 1,
        strokeColor: "#167769",
        strokeWeight: 2,
      },
    });
  }, [googleMaps, userPosition]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPharmacy) {
      return;
    }

    mapInstanceRef.current.panTo({
      lat: Number(selectedPharmacy.latitude),
      lng: Number(selectedPharmacy.longitude),
    });
  }, [selectedPharmacy]);

  useEffect(() => {
    if (!googleMaps || !mapInstanceRef.current) {
      return;
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!Array.isArray(routePath) || routePath.length === 0) {
      return;
    }

    routePolylineRef.current = new googleMaps.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#2FA6A3",
      strokeOpacity: 0.9,
      strokeWeight: 5,
    });

    routePolylineRef.current.setMap(mapInstanceRef.current);

    const bounds = new googleMaps.maps.LatLngBounds();
    routePath.forEach((point) => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds);
  }, [googleMaps, routePath]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <div ref={mapRef} className="h-[360px] w-full md:h-[520px] xl:h-[620px]" />
    </div>
  );
}

export default PharmacyMap;
