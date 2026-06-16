import API from "../api/axios";

export const calculateDeliveryFee = async ({ pharmacy_id, latitude_client, longitude_client }) => {
  const res = await API.post("/api/deliveries/calculate-fee/", {
    pharmacy_id,
    latitude_client,
    longitude_client,
  });
  return res.data;
};
