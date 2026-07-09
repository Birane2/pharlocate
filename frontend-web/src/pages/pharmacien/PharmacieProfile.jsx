import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import ErrorMessage from "../../components/common/ErrorMessage";
import Loading from "../../components/common/Loading";
import PharmacieProfileForm from "../../components/pharmacie/PharmacieProfileForm";
import PharmacyRequiredCard from "../../components/pharmacie/PharmacyRequiredCard";
import {
  createPharmacy,
  getMyPharmacyProfile,
  updateMyPharmacyPhoto,
  updateMyPharmacyProfile,
} from "../../services/pharmacyService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }
  if (error.response?.status === 403) {
    return "Acces refuse.";
  }
  if (error.response?.status === 404) {
    return (
      error.response?.data?.message ||
      "Ce pharmacien ne possede pas encore de pharmacie associee. Veuillez creer votre pharmacie pour acceder a toutes les fonctionnalites."
    );
  }
  if (error.response?.status === 500) {
    return "Erreur serveur. Reessayez plus tard.";
  }

  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;

  if (data && typeof data === "object") {
    for (const val of Object.values(data)) {
      if (Array.isArray(val) && val[0]) return val[0];
      if (typeof val === "string") return val;
    }
  }

  return "Impossible d'enregistrer le profil pharmacie.";
}

const initialForm = {
  nom: "",
  adresse: "",
  telephone: "",
};

function toForm(pharmacy) {
  return {
    nom: pharmacy.nom || "",
    adresse: pharmacy.adresse || "",
    telephone: pharmacy.telephone || "",
  };
}

function toLocationData(pharmacy) {
  if (!pharmacy?.latitude && !pharmacy?.longitude) return null;
  return {
    lat: Number(pharmacy.latitude) || 0,
    lng: Number(pharmacy.longitude) || 0,
    address: pharmacy.adresse || "",
    city: pharmacy.city || "",
    region: pharmacy.region || "",
    country: pharmacy.country || "",
    postal_code: pharmacy.postal_code || "",
    google_place_id: pharmacy.google_place_id || "",
  };
}

function buildPayload(form, locationData) {
  const payload = {
    nom: form.nom,
    adresse: form.adresse,
    telephone: form.telephone,
  };

  if (locationData) {
    payload.latitude = locationData.lat;
    payload.longitude = locationData.lng;
    payload.city = locationData.city || "";
    payload.region = locationData.region || "";
    payload.country = locationData.country || "";
    payload.postal_code = locationData.postal_code || "";
    payload.google_place_id = locationData.google_place_id || "";
    payload.google_maps_url = null; // clear old URL-based entry
  }

  return payload;
}

// ─── Component ────────────────────────────────────────────────────────────────

function PharmacieProfile() {
  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPharmacy, setHasPharmacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyPharmacyProfile();
        setPharmacy(data);
        setForm(toForm(data));
        setLocationData(toLocationData(data));
        setHasPharmacy(true);
        setError("");
      } catch (err) {
        if (
          err.hasPharmacy === false ||
          err.response?.data?.has_pharmacy === false
        ) {
          setHasPharmacy(false);
          setPharmacy(null);
          setForm(initialForm);
          setLocationData(null);
          setError("");
          return;
        }
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLocationChange = (location) => {
    setLocationData(location);
    // Auto-fill the address field from the geocoding result
    if (location?.address) {
      setForm((prev) => ({ ...prev, adresse: location.address }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = buildPayload(form, locationData);

      if (hasPharmacy) {
        const data = await updateMyPharmacyProfile(payload);
        setPharmacy(data);
        setForm(toForm(data));
        setLocationData(toLocationData(data));
        const gpsMsg =
          data.latitude && data.longitude ? " Position GPS enregistree." : "";
        setSuccessMessage("Profil pharmacie mis a jour avec succes." + gpsMsg);
      } else {
        const response = await createPharmacy(payload);
        const data = response.data || response;
        setPharmacy(data);
        setForm(toForm(data));
        setLocationData(toLocationData(data));
        setHasPharmacy(true);
        setSuccessMessage(
          response.message ||
            "Votre pharmacie a ete creee. Elle est maintenant en attente de validation."
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const photo = event.target.files?.[0];
    if (!photo) return;

    setUploadingPhoto(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await updateMyPharmacyPhoto(photo);
      setPharmacy(data);
      setSuccessMessage("Photo de la pharmacie mise a jour avec succes.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  return (
    <DashboardLayout
      title="Profil pharmacie"
      links={pharmacistLinks}
      headerSubtitle="Mettez a jour les informations visibles pour les patients."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        {loading ? (
          <Loading label="Chargement du profil pharmacie..." />
        ) : (
          <>
            <ErrorMessage message={error} />

            {successMessage && (
              <div className="rounded-xl border border-[#2FA6A3]/30 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-semibold text-[#2FA6A3]">
                {successMessage}
              </div>
            )}

            {/* ── Creation ──────────────────────────────────── */}
            {!hasPharmacy && (
              <>
                <PharmacyRequiredCard
                  title="Vous n'avez pas encore cree votre pharmacie."
                  message="Ce pharmacien ne possede pas encore de pharmacie associee. Veuillez creer votre pharmacie pour acceder a toutes les fonctionnalites."
                />

                <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-[#2F6E9E]">
                      Creer ma pharmacie
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Renseignez les informations principales. La pharmacie sera en attente de
                      validation par un administrateur.
                    </p>
                  </div>

                  <PharmacieProfileForm
                    form={form}
                    locationData={locationData}
                    submitting={submitting}
                    uploadingPhoto={false}
                    showPhoto={false}
                    submitLabel="Creer"
                    onChange={handleChange}
                    onLocationChange={handleLocationChange}
                    onPhotoChange={() => {}}
                    onSubmit={handleSubmit}
                  />
                </section>
              </>
            )}

            {/* ── Edition ───────────────────────────────────── */}
            {pharmacy && (
              <section>
                <PharmacieProfileForm
                  form={form}
                  locationData={locationData}
                  photoPreview={pharmacy.photo}
                  submitting={submitting}
                  uploadingPhoto={uploadingPhoto}
                  submitLabel="Enregistrer les modifications"
                  onChange={handleChange}
                  onLocationChange={handleLocationChange}
                  onPhotoChange={handlePhotoChange}
                  onSubmit={handleSubmit}
                />
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacieProfile;
