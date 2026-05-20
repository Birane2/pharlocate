import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import ErrorMessage from "../../components/common/ErrorMessage";
import Loading from "../../components/common/Loading";
import PharmacieProfileForm from "../../components/pharmacie/PharmacieProfileForm";
import PharmacieStatusBadge from "../../components/pharmacie/PharmacieStatusBadge";
import PharmacyRequiredCard from "../../components/pharmacie/PharmacyRequiredCard";
import {
  createPharmacy,
  getMyPharmacyProfile,
  updateMyPharmacyPhoto,
  updateMyPharmacyProfile,
} from "../../services/pharmacyService";

const initialForm = {
  nom: "",
  adresse: "",
  telephone: "",
  latitude: "",
  longitude: "",
};

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

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];

    if (Array.isArray(firstValue) && firstValue[0]) {
      return firstValue[0];
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return "Impossible d'enregistrer le profil pharmacie.";
}

function toForm(pharmacy) {
  return {
    nom: pharmacy.nom || "",
    adresse: pharmacy.adresse || "",
    telephone: pharmacy.telephone || "",
    latitude: pharmacy.latitude || "",
    longitude: pharmacy.longitude || "",
  };
}

function PharmacieProfile() {
  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [hasPharmacy, setHasPharmacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyPharmacyProfile();
        setPharmacy(data);
        setForm(toForm(data));
        setHasPharmacy(true);
        setError("");
      } catch (err) {
        if (err.hasPharmacy === false || err.response?.data?.has_pharmacy === false) {
          setHasPharmacy(false);
          setPharmacy(null);
          setForm(initialForm);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (hasPharmacy) {
        const data = await updateMyPharmacyProfile(form);
        setPharmacy(data);
        setForm(toForm(data));
        setSuccessMessage("Profil pharmacie mis a jour avec succes.");
      } else {
        const response = await createPharmacy(form);
        const data = response.data || response;
        setPharmacy(data);
        setForm(toForm(data));
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

    if (!photo) {
      return;
    }

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
    <DashboardLayout title="Profil pharmacie" links={pharmacistLinks}>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-pharmaBlue">
                Profil pharmacie
              </h1>
              <p className="mt-2 text-sm text-pharmaTextLight">
                Mettez a jour les informations visibles pour les patients.
              </p>
            </div>

            {pharmacy && (
              <PharmacieStatusBadge isValid={pharmacy.est_valide} />
            )}
          </div>
        </Card>

        {loading ? (
          <Loading label="Chargement du profil pharmacie..." />
        ) : (
          <>
            <ErrorMessage message={error} />

            {successMessage && (
              <div className="rounded-xl border border-pharmaTurquoise/30 bg-pharmaTurquoise/10 px-4 py-3 text-sm text-pharmaTurquoise">
                {successMessage}
              </div>
            )}

            {!hasPharmacy && (
              <>
                <PharmacyRequiredCard
                  title="Vous n'avez pas encore cree votre pharmacie."
                  message="Ce pharmacien ne possede pas encore de pharmacie associee. Veuillez creer votre pharmacie pour acceder a toutes les fonctionnalites."
                />

                <Card>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-pharmaBlue">
                      Creer ma pharmacie
                    </h2>
                    <p className="mt-2 text-sm text-pharmaTextLight">
                      Renseignez les informations principales. La pharmacie sera en attente de validation par un administrateur.
                    </p>
                  </div>

                  <PharmacieProfileForm
                    form={form}
                    submitting={submitting}
                    uploadingPhoto={false}
                    showPhoto={false}
                    submitLabel="Creer ma pharmacie"
                    onChange={handleChange}
                    onPhotoChange={() => {}}
                    onSubmit={handleSubmit}
                  />
                </Card>
              </>
            )}

            {pharmacy && (
              <Card>
                <div className="mb-5 grid gap-3 text-sm text-pharmaTextLight md:grid-cols-2">
                  <p>
                    Statut admin :{" "}
                    <span className="font-semibold text-pharmaText">
                      {pharmacy.est_valide ? "Validee" : "En attente"}
                    </span>
                  </p>
                  <p>
                    Date creation :{" "}
                    <span className="font-semibold text-pharmaText">
                      {new Date(pharmacy.date_creation).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                <PharmacieProfileForm
                  form={form}
                  photoPreview={pharmacy.photo}
                  submitting={submitting}
                  uploadingPhoto={uploadingPhoto}
                  submitLabel="Enregistrer les modifications"
                  onChange={handleChange}
                  onPhotoChange={handlePhotoChange}
                  onSubmit={handleSubmit}
                />
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacieProfile;
