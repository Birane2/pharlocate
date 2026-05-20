import API from "../api/axios";

export const createReservation = async (payload) => {
  const res = await API.post("/api/reservations/", payload);
  return res.data;
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
