import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faImage,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PharmacyLocationPicker from "./PharmacyLocationPicker";

function SectionTitle({ children }) {
  return (
    <h2 className="mb-3 text-sm font-bold tracking-tight text-[#1C2B4A]">
      {children}
    </h2>
  );
}

/**
 * PharmacieProfileForm
 *
 * Props:
 *   form            – { nom, adresse, telephone }
 *   locationData    – null | { lat, lng, address, city, region, country, postal_code, google_place_id }
 *   photoPreview    – URL string or null
 *   submitting      – bool
 *   uploadingPhoto  – bool
 *   submitLabel     – string
 *   showPhoto       – bool (default true)
 *   onChange        – handler for basic text inputs
 *   onLocationChange – called with location object when map picker confirms
 *   onPhotoChange   – handler for photo file input
 *   onSubmit        – form submit handler
 */
function PharmacieProfileForm({
  form,
  locationData,
  photoPreview,
  submitting,
  uploadingPhoto,
  submitLabel = "Enregistrer les modifications",
  showPhoto = true,
  onChange,
  onLocationChange,
  onPhotoChange,
  onSubmit,
}) {
  const [selectedPhotoName, setSelectedPhotoName] = useState("");

  const photoName = useMemo(() => {
    if (selectedPhotoName) return selectedPhotoName;
    if (!photoPreview) return "Aucune photo selectionnee";
    return decodeURIComponent(photoPreview.split("/").pop() || "Photo actuelle");
  }, [photoPreview, selectedPhotoName]);

  const handlePhotoInputChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedPhotoName(file?.name || "");
    onPhotoChange(event);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">

        {/* ── Colonne principale ──────────────────────────────── */}
        <div className="space-y-4">

          {/* Informations générales */}
          <section>
            <SectionTitle>Informations generales</SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Nom pharmacie"
                name="nom"
                value={form.nom}
                onChange={onChange}
                required
              />
              <Input
                label="Telephone"
                name="telephone"
                value={form.telephone}
                onChange={onChange}
                required
              />
              <Input
                label="Adresse"
                name="adresse"
                value={form.adresse}
                onChange={onChange}
                className="md:col-span-2"
                required
              />
            </div>
          </section>

          {/* Localisation GPS */}
          <section className="border-t border-[#E2E8F2] pt-4">
            <SectionTitle>Localisation GPS</SectionTitle>
            <PharmacyLocationPicker
              value={locationData}
              onChange={onLocationChange}
              disabled={submitting}
            />
          </section>
        </div>

        {/* ── Colonne latérale ────────────────────────────────── */}
        <aside className="space-y-4 border-t border-[#E2E8F2] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          {showPhoto && (
            <section>
              <SectionTitle>Photo pharmacie</SectionTitle>
              <div className="rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-3">
                <div className="h-36 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Pharmacie"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#6B7280]">
                      <FontAwesomeIcon icon={faImage} className="h-7 w-7 text-[#2FA6A3]" />
                      Aucune photo
                    </div>
                  )}
                </div>

                <p className="mt-2 truncate text-xs font-semibold text-[#6B7280]">
                  {photoName}
                </p>

                <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1F5B87]">
                  <FontAwesomeIcon icon={faUpload} />
                  {uploadingPhoto ? "Envoi..." : "Modifier photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingPhoto}
                    onChange={handlePhotoInputChange}
                  />
                </label>
              </div>
            </section>
          )}

          <section className="border-t border-[#E2E8F2] pt-4">
            <Button
              type="submit"
              icon={faFloppyDisk}
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Enregistrement..." : submitLabel}
            </Button>
          </section>
        </aside>
      </div>
    </form>
  );
}

export default PharmacieProfileForm;
