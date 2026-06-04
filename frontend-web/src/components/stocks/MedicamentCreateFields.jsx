import { useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faCloudArrowUp,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Input from "../ui/Input";

function MedicamentCreateFields({ form, onChange }) {
  const imagePreview = useMemo(() => {
    if (!form.photo) {
      return "";
    }

    return URL.createObjectURL(form.photo);
  }, [form.photo]);

  useEffect(() => {
    if (!imagePreview) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    onChange({
      target: {
        name: "photo",
        value: file,
        files: file ? [file] : [],
      },
    });
  };

  const handleRemovePhoto = () => {
    onChange({
      target: {
        name: "photo",
        value: null,
        files: [],
      },
    });
  };

  return (
    <>
      <Input
        label="Nom medicament"
        name="nom"
        value={form.nom}
        placeholder="Ex : Paracetamol"
        onChange={onChange}
        required
      />

      <Input
        label="Categorie"
        name="categorie"
        value={form.categorie}
        placeholder="Ex : Antalgique"
        onChange={onChange}
      />

      <div className="md:col-span-2">
        <label className="mb-1.5 block text-xs font-black tracking-tight text-[#1F2937]">
          Description courte
        </label>
        <textarea
          name="description"
          value={form.description}
          rows={2}
          placeholder="Description courte du medicament"
          className="w-full rounded-xl border border-[#2F6E9E]/15 bg-white px-3.5 py-2.5 text-sm text-[#1F2937] outline-none transition duration-200 placeholder:text-[#6B7280]/70 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
          onChange={onChange}
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1.5 block text-xs font-black tracking-tight text-[#1F2937]">
          Photo medicament
        </label>
        <div className="grid gap-3 rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-3 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
          <div className="h-24 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Apercu du medicament"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-[#2F6E9E]">
                <FontAwesomeIcon icon={faCapsules} className="text-xl" />
                <span className="text-[10px] font-semibold text-[#6B7280]">
                  Aucune image
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#1C2B4A]">
              {form.photo?.name || "Aucun fichier selectionne"}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">PNG, JPG, WEBP</p>

            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2F6E9E] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1F5B87]">
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Importer
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>

              {form.photo && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  Retirer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MedicamentCreateFields;
