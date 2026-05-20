import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCapsules,
  faCircleInfo,
  faFlask,
  faLayerGroup,
  faMoneyBillWave,
  faPenToSquare,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import MedicamentCreateFields from "./MedicamentCreateFields";
import MedicamentSelect from "./MedicamentSelect";
import StockStatusBadge from "./StockStatusBadge";

function StockForm({
  form,
  medicaments = [],
  submitting = false,
  loadingMedicaments = false,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  error = "",
  mode,
  onModeChange,
  selectedStock,
}) {
  const hasMedicaments = medicaments.length > 0;
  const supportsModeTabs =
    typeof mode === "string" && typeof onModeChange === "function";
  const selectedMode = supportsModeTabs ? mode : "existing";
  const medicamentFieldName = Object.prototype.hasOwnProperty.call(form, "medicament")
    ? "medicament"
    : "medicament_id";
  const selectedMedicamentValue = form[medicamentFieldName] || "";
  const disableExistingSelection =
    loadingMedicaments || (!hasMedicaments && !isEditing) || isEditing;

  const handleMedicamentSelect = (value) => {
    onChange({
      target: {
        name: medicamentFieldName,
        value,
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isEditing && (
        <div className="rounded-[1.45rem] border border-[#2F6E9E]/20 bg-[#2F6E9E]/6 px-4 py-4 shadow-[0_14px_30px_rgba(47,110,158,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black tracking-tight text-[#2F6E9E]">
                <FontAwesomeIcon icon={faPenToSquare} />
                Mode modification actif
              </div>
              <p className="mt-2 text-sm leading-6 text-pharmaTextLight">
                Vous modifiez actuellement{" "}
                <span className="font-black text-[#16324A]">
                  {selectedStock?.medicament_data?.nom ||
                    selectedStock?.medicament_nom ||
                    "ce stock"}
                </span>
                . Seules la quantite, le prix et le seuil d'alerte sont modifiables.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedStock && <StockStatusBadge stock={selectedStock} />}
              <Badge variant="blue">Stock #{selectedStock?.id_stock || selectedStock?.id}</Badge>
            </div>
          </div>
        </div>
      )}

      {supportsModeTabs && (
        <div className="rounded-[1.6rem] border border-[#2F6E9E]/10 bg-[linear-gradient(180deg,_rgba(247,251,253,0.96),_rgba(255,255,255,0.98))] p-4 shadow-[0_14px_34px_rgba(47,110,158,0.07)]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onModeChange("existing")}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                selectedMode === "existing"
                  ? "border-[#2F6E9E] bg-[#2F6E9E] text-white shadow-[0_16px_32px_rgba(47,110,158,0.18)]"
                  : "border-[#2F6E9E]/10 bg-white text-[#16324A] hover:border-[#2FA6A3]/35 hover:bg-[#F7FBFD]"
              }`}
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLayerGroup} />
                <span className="text-sm font-black tracking-tight">
                  Medicament existant
                </span>
              </div>
              <p
                className={`mt-2 text-xs leading-6 ${
                  selectedMode === "existing" ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                Choisissez un produit deja present dans le catalogue.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onModeChange("new")}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                selectedMode === "new"
                  ? "border-[#2FA6A3] bg-[#2FA6A3] text-white shadow-[0_16px_32px_rgba(47,166,163,0.18)]"
                  : "border-[#2F6E9E]/10 bg-white text-[#16324A] hover:border-[#2FA6A3]/35 hover:bg-[#F7FBFD]"
              }`}
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCapsules} />
                <span className="text-sm font-black tracking-tight">
                  Nouveau medicament
                </span>
              </div>
              <p
                className={`mt-2 text-xs leading-6 ${
                  selectedMode === "new" ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                Creez une nouvelle fiche avec description et photo.
              </p>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {selectedMode === "existing" ? (
          supportsModeTabs ? (
            <MedicamentSelect
              medicaments={medicaments}
              value={selectedMedicamentValue}
              disabled={disableExistingSelection}
              onChange={handleMedicamentSelect}
            />
          ) : (
            <Input
              label="Medicament"
              type="select"
              name={medicamentFieldName}
              value={selectedMedicamentValue}
              disabled={disableExistingSelection}
              placeholder={
                loadingMedicaments
                  ? "Chargement des medicaments..."
                  : hasMedicaments
                    ? "Choisir un medicament"
                    : "Aucun medicament disponible"
              }
              options={medicaments.map((medicament) => ({
                value: medicament.id,
                label: medicament.nom,
              }))}
              helperText={
                isEditing
                  ? "Le medicament associe a ce stock reste verrouille pendant la modification."
                  : "Le stock sera automatiquement rattache a votre pharmacie."
              }
              onChange={onChange}
              required
            />
          )
        ) : (
          <MedicamentCreateFields form={form} onChange={onChange} />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Quantite"
            name="quantite"
            type="number"
            min="0"
            step="1"
            placeholder="Ex : 25"
            value={form.quantite}
            onChange={onChange}
            required
          />

          <Input
            label="Prix"
            name="prix"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex : 12.50"
            value={form.prix}
            onChange={onChange}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Seuil d'alerte"
              name="seuil_alerte"
              type="number"
              min="0"
              step="1"
              placeholder="Ex : 10"
              value={form.seuil_alerte}
              onChange={onChange}
              helperText="Par defaut, un stock devient faible si la quantite passe sous ce seuil."
              required
            />
          </div>
        </div>
      </div>


      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loadingMedicaments && !hasMedicaments && selectedMode === "existing" && !isEditing && (
        <div className="rounded-2xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-medium text-[#2F6E9E]">
          Aucun medicament n'existe encore. Utilisez la page d'ajout pour creer un
          medicament avant de l'integrer a votre stock.
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[#2F6E9E]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="blue" showIcon>
          Pharmacien connecte : stock lie a votre pharmacie
        </Badge>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              icon={faRotateLeft}
              onClick={onCancel}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            loading={submitting}
            disabled={selectedMode === "existing" && !isEditing && !hasMedicaments}
          >
            {isEditing
              ? "Mettre a jour le stock"
              : selectedMode === "new"
                ? "Creer et ajouter au stock"
                : "Ajouter au stock"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default StockForm;
