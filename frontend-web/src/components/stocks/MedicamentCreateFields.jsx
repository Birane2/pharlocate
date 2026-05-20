import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faCloudArrowUp,
  faImage,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import Input from "../ui/Input";

function MedicamentCreateFields({ form, onChange }) {
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!form.photo) {
      setImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(form.photo);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [form.photo]);

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
    <div className="grid gap-4">
      <Input
        label="Nom du medicament"
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

      <div>
        <label className="mb-2 block text-sm font-black tracking-tight text-[#1F2937]">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          rows={4}
          placeholder="Description courte du medicament"
          className="w-full rounded-2xl border border-[#2F6E9E]/15 bg-white px-4 py-3 text-[#1F2937] outline-none transition duration-200 placeholder:text-[#6B7280]/70 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
          onChange={onChange}
        />
      </div>

      <div className="rounded-[1.5rem] border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.95),_rgba(255,255,255,0.98))] p-4 shadow-[0_14px_34px_rgba(47,110,158,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                <FontAwesomeIcon icon={faImage} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-[#1F2937]">
                  Photo du medicament
                </p>
                <p className="text-xs leading-6 text-[#6B7280]">
                  Importez une image claire du produit pour faciliter son identification.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-[#2F6E9E]/25 bg-white px-5 py-8 text-center transition duration-300 hover:border-[#2FA6A3] hover:bg-[#F7FBFD]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#2FA6A3]/10 text-[#2FA6A3]">
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-[#16324A]">
                  {form.photo ? "Changer l'image" : "Televerser une image"}
                </p>
                <p className="mt-1 text-xs leading-6 text-[#6B7280]">
                  PNG, JPG ou WEBP. Cliquez pour selectionner un fichier.
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#2F6E9E]/8 px-3 py-1 text-xs font-black text-[#2F6E9E]">
                {form.photo?.name || "Aucun fichier selectionne"}
              </span>
              {form.photo && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 transition hover:bg-red-100"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:max-w-[230px]">
            <div className="rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white p-3 shadow-[0_12px_28px_rgba(47,110,158,0.08)]">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                Apercu
              </p>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Apercu du medicament"
                  className="h-40 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-[linear-gradient(145deg,_rgba(47,110,158,0.07),_rgba(47,166,163,0.08))] text-[#2F6E9E]">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faCapsules} className="text-3xl" />
                    <p className="mt-3 text-xs font-semibold text-[#6B7280]">
                      Aucune image
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicamentCreateFields;
