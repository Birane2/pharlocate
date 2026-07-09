import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faClinicMedical,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import PharmacieProfileForm from "../../components/pharmacie/PharmacieProfileForm";
import Loading from "../../components/common/Loading";
import Logo from "../../components/ui/Logo";
import {
  createPharmacyProfile,
  getMyPharmacyStatus,
} from "../../services/pharmacyService";

function getApiError(error) {
  if (error.response?.status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }
  if (error.response?.status === 403) {
    return "Accès refusé.";
  }
  const data = error.response?.data;
  if (data?.error) return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") {
    for (const val of Object.values(data)) {
      if (Array.isArray(val) && val[0]) return String(val[0]);
      if (typeof val === "string" && val) return val;
    }
  }
  return "Impossible de créer la pharmacie. Réessayez.";
}

const initialForm = { nom: "", adresse: "", telephone: "" };

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
    payload.google_maps_url = null;
  }
  return payload;
}

function CompletePharmacyProfile() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [locationData, setLocationData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if pharmacist already has a pharmacy
  useEffect(() => {
    let mounted = true;
    getMyPharmacyStatus()
      .then((status) => {
        if (!mounted) return;
        if (status?.has_pharmacy === true) {
          navigate("/pharmacien/dashboard", { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleLocationChange = (location) => {
    setLocationData(location);
    if (location?.address) {
      setForm((prev) => ({ ...prev, adresse: location.address }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createPharmacyProfile(buildPayload(form, locationData));
      setSuccess(true);
      window.setTimeout(() => navigate("/pharmacien/dashboard"), 2500);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loading label="Vérification en cours..." />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#F8FAFC] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#2F6E9E]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#2FA6A3]/10 blur-3xl" />

      <div className="relative w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Logo className="h-10" imageClassName="drop-shadow-sm" />
          <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F6E9E]/10">
            <FontAwesomeIcon
              icon={faClinicMedical}
              className="h-7 w-7 text-[#2F6E9E]"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#1C2B4A]">
            Créez votre pharmacie
          </h1>
          <p className="mt-1.5 max-w-md text-sm font-medium text-[#6B7280]">
            Bienvenue sur PharmaLocate. Renseignez les informations de votre
            pharmacie pour commencer. Un administrateur validera votre dossier.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2F6E9E] text-white">
            1
          </span>
          <span className="text-[#2F6E9E]">Inscription</span>
          <div className="h-px w-8 bg-[#2F6E9E]" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2F6E9E] text-white">
            2
          </span>
          <span className="text-[#2F6E9E]">Vérification email</span>
          <div className="h-px w-8 bg-[#2F6E9E]" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2F6E9E] text-white">
            3
          </span>
          <span className="font-bold text-[#2F6E9E]">Profil pharmacie</span>
          <div className="h-px w-8 bg-[#CBD5E1]" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#CBD5E1] text-[#6B7280]">
            4
          </span>
          <span className="text-[#9CA3AF]">Validation admin</span>
        </div>

        {/* Success state */}
        {success ? (
          <div className="rounded-2xl border border-[#2FA6A3]/30 bg-[#2FA6A3]/8 p-8 text-center">
            <div className="flex justify-center">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="h-14 w-14 text-[#2FA6A3]"
              />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#1C2B4A]">
              Pharmacie créée avec succès !
            </h2>
            <p className="mt-2 text-sm font-medium text-[#6B7280]">
              Votre dossier est en attente de validation par un administrateur.
              Vous serez notifié par email dès l'approbation.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#F59E0B]">
              <FontAwesomeIcon icon={faHourglassHalf} className="h-4 w-4" />
              Redirection vers le tableau de bord…
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-5 shadow-sm sm:p-6">
            {/* Pending validation notice */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F59E0B]/30 bg-[#FEF3C7] px-4 py-3">
              <FontAwesomeIcon
                icon={faHourglassHalf}
                className="mt-0.5 h-4 w-4 flex-none text-[#D97706]"
              />
              <p className="text-sm font-semibold text-[#92400E]">
                Après soumission, votre pharmacie sera examinée par un
                administrateur avant d'être visible sur la plateforme.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-4 py-3 text-sm font-semibold text-[#DC2626]">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  className="mt-0.5 h-4 w-4 flex-none"
                />
                <span>{error}</span>
              </div>
            )}

            <PharmacieProfileForm
              form={form}
              locationData={locationData}
              photoPreview={null}
              submitting={submitting}
              uploadingPhoto={false}
              submitLabel="Soumettre ma pharmacie"
              showPhoto={false}
              onChange={handleChange}
              onLocationChange={handleLocationChange}
              onPhotoChange={() => {}}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CompletePharmacyProfile;
