import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faFloppyDisk,
  faImage,
  faLocationDot,
  faTriangleExclamation,
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
  currentCoords,
  photoPreview,
  submitting,
  uploadingPhoto,
  submitLabel = "Enregistrer les modifications",
  showPhoto = true,
  onChange,
  onPhotoChange,
  onSubmit,
}) {
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const hasCoordinates = Boolean(currentCoords?.lat && currentCoords?.lng);

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
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">

        {/* Colonne principale */}
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

          {/* Localisation */}
          <section className="border-t border-[#E2E8F2] pt-4">
            <SectionTitle>Localisation GPS</SectionTitle>

            <div className="space-y-3">
              {/* Champ URL Google Maps */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#1C2B4A]">
                  <FontAwesomeIcon icon={faLocationDot} className="text-[#2F6E9E]" style={{ fontSize: "10px" }} />
                  Lien Google Maps
                </span>
                <input
                  type="url"
                  name="google_maps_url"
                  value={form.google_maps_url}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="https://maps.google.com/?q=18.0735,-15.9582"
                  className="w-full rounded-xl border border-[#E2E8F2] bg-white px-3 py-2 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/10 disabled:bg-[#F8FAFC] disabled:opacity-70 placeholder:text-[#CBD5E1]"
                />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Collez ici le lien Google Maps de votre pharmacie.
                </p>
              </label>

              {/* Instructions */}
              <div className="rounded-xl border border-[#2F6E9E]/15 bg-[#EEF6FB] px-3 py-2.5">
                <p className="text-xs font-bold text-[#2F6E9E]">Comment obtenir le lien ?</p>
                <ol className="mt-1.5 list-inside list-decimal space-y-0.5 text-[11px] text-[#4B7BA5]">
                  <li>Ouvrez Google Maps et recherchez votre pharmacie</li>
                  <li>Cliquez sur votre pharmacie pour la selectionner</li>
                  <li>Appuyez sur &ldquo;Partager&rdquo; → &ldquo;Copier le lien&rdquo;</li>
                  <li>Collez le lien dans le champ ci-dessus</li>
                </ol>
              </div>

              {/* Statut de la position */}
              {hasCoordinates ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2FA6A3]/25 bg-[#E8F7F3] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="shrink-0 text-[#2FA6A3]" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#167769]">Position enregistree</p>
                      <p className="truncate text-[11px] text-[#2FA6A3]">
                        {currentCoords.lat}, {currentCoords.lng}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2FA6A3] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#248C8A]"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: "9px" }} />
                    Ouvrir
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
                  <span>
                    Aucune position enregistree. Ajoutez un lien Google Maps pour localiser votre pharmacie sur la carte.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Colonne latérale */}
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
