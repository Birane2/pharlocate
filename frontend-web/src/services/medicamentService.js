import API from "../api/axios";

export const getMedicaments = async () => {
  const res = await API.get("/api/medicaments/");
  return res.data.results || res.data;
};

export const createMedicament = async (data) => {
  const formData = new FormData();

  if (data?.nom) {
    formData.append("nom", data.nom);
  }

  if (data?.description) {
    formData.append("description", data.description);
  }

  if (data?.categorie) {
    formData.append("categorie", data.categorie);
  }

  if (data?.photo) {
    formData.append("photo", data.photo);
  }

  const res = await API.post("/api/medicaments/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
