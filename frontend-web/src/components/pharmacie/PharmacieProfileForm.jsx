import Button from "../ui/Button";
import Input from "../ui/Input";

function PharmacieProfileForm({
  form,
  photoPreview,
  submitting,
  uploadingPhoto,
  submitLabel = "Enregistrer les modifications",
  showPhoto = true,
  onChange,
  onPhotoChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className={`grid gap-5 ${showPhoto ? "md:grid-cols-[180px_minmax(0,1fr)]" : ""}`}>
        {showPhoto && (
          <div>
            <div className="aspect-square overflow-hidden rounded-xl border border-pharmaBorder bg-white">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Pharmacie"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-pharmaTextLight">
                  Aucune photo
                </div>
              )}
            </div>

            <label className="mt-3 block">
              <span className="sr-only">Choisir une photo</span>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-pharmaTextLight file:mr-3 file:rounded-lg file:border-0 file:bg-pharmaBlue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                disabled={uploadingPhoto}
                onChange={onPhotoChange}
              />
            </label>
          </div>
        )}

        <div className="grid gap-4">
          <Input
            label="Nom"
            name="nom"
            value={form.nom}
            onChange={onChange}
            required
          />
          <Input
            label="Adresse"
            name="adresse"
            value={form.adresse}
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

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Latitude"
              name="latitude"
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={onChange}
              required
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
              required
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
        {submitting ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}

export default PharmacieProfileForm;
