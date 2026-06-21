import API from "../api/axios";

export async function getAdminProfile() {
  const response = await API.get("/api/admin/profile/");
  return response.data;
}

export async function updateAdminProfile(payload) {
  const response = await API.patch("/api/admin/profile/", payload);
  return response.data;
}

export async function changeAdminPassword(payload) {
  const response = await API.post("/api/admin/profile/change-password/", payload);
  return response.data;
}
