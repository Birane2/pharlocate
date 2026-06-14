import API from "../api/axios";

export const createReservation = async (payload) => {
  const res = await API.post("/api/reservations/", payload);
  return res.data;
};

export const checkoutReservation = async ({
  pharmacie,
  items,
  typeReservation,
  paymentMethod,
  clientPhone,
  transactionId,
  paymentProof,
  delivery,
}) => {
  const formData = new FormData();

  formData.append("pharmacie", String(pharmacie));
  formData.append("type_reservation", typeReservation);
  formData.append("mode_retrait", typeReservation);
  formData.append("items", JSON.stringify(items));
  formData.append("payment_method", String(paymentMethod));
  formData.append("numero_client", clientPhone);
  formData.append("client_phone", clientPhone);
  formData.append("transaction_id", transactionId);
  formData.append("reference_paiement", transactionId);

  if (paymentProof) {
    formData.append("capture_paiement", paymentProof);
    formData.append("payment_proof", paymentProof);
  }

  if (typeReservation === "livraison" && delivery) {
    formData.append("delivery", JSON.stringify(delivery));
    formData.append("adresse_livraison", delivery.adresse_livraison || "");
    formData.append("telephone", delivery.telephone || clientPhone);
    formData.append("latitude", String(delivery.latitude || ""));
    formData.append("longitude", String(delivery.longitude || ""));
    formData.append("note", delivery.note || "");
  }

  const res = await API.post("/api/reservations/checkout/", formData);
  return res.data;
};

export const getUserReservations = async (params = {}) => {
  const res = await API.get("/api/user/reservations/", { params });

  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || [],
  };
};

export const getReservations = async (params = {}) => {
  const res = await API.get("/api/pharmacien/reservations/", { params });

  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results || [],
  };
};

export const confirmReservation = async (reservationId) => {
  const res = await API.patch(`/api/pharmacien/reservations/${reservationId}/confirm/`);
  return res.data;
};

export const cancelReservation = async (reservationId) => {
  const res = await API.patch(`/api/pharmacien/reservations/${reservationId}/cancel/`);
  return res.data;
};

export const markReservationReady = async (reservationId) => {
  const res = await API.patch(`/api/pharmacien/reservations/${reservationId}/ready/`);
  return res.data;
};

export const markReservationPickedUp = async (reservationId) => {
  const res = await API.patch(
    `/api/pharmacien/reservations/${reservationId}/picked-up/`
  );
  return res.data;
};
