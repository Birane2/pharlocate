import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faFloppyDisk,
  faImage,
  faLocationCrosshairs,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";
import Input from "../ui/Input";

function SectionTitle({ children }) {
  return (
    <h2 className="mb-3 text-sm font-bold tracking-tight text-[#1C2B4A]">
      {children}
    </h2>
  );
}

function PharmacieProfileForm({
  form,
  photoPreview,
  submitting,
  uploadingPhoto,
  detectingPosition,
  submitLabel = "Enregistrer les modifications",
  showPhoto = true,
  onChange,
  onPhotoChange,
  onUseCurrentPosition,
  onSubmit,
}) {
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const hasCoordinates = Boolean(form.latitude && form.longitude);

  const photoName = useMemo(() => {
    if (selectedPhotoName) {
      return selectedPhotoName;
    }

    if (!photoPreview) {
      return "Aucune photo selectionnee";
    }

    return decodeURIComponent(photoPreview.split("/").pop() || "Photo actuelle");
  }, [photoPreview, selectedPhotoName]);

  const handlePhotoInputChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedPhotoName(file?.name || "");
    onPhotoChange(event);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
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

          <section className="border-t border-[#E2E8F2] pt-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle>Localisation</SectionTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={faLocationCrosshairs}
                loading={detectingPosition}
                disabled={submitting || detectingPosition}
                onClick={onUseCurrentPosition}
                className="w-full sm:w-auto"
              >
                Detecter ma position
              </Button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Position actuelle
              </span>
              <span className="text-[#1C2B4A]">
                {hasCoordinates ? `${form.latitude}, ${form.longitude}` : "Non detectee"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowCoordinates((isOpen) => !isOpen)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#2F6E9E]/15 px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/8"
            >
              Afficher les coordonnees GPS
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`h-3 w-3 transition ${showCoordinates ? "rotate-180" : ""}`}
              />
            </button>

            {showCoordinates && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  label="Latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={onChange}
                  placeholder="18.114961"
                  helperText="Entre -90 et 90"
                />
                <Input
                  label="Longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={onChange}
                  placeholder="-15.961197"
                  helperText="Entre -180 et 180"
                />
              </div>
            )}
          </section>
        </div>

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
