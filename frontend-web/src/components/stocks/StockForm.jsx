import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faCircleInfo,
  faLayerGroup,
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
    <form onSubmit={onSubmit} className="space-y-4">
      {isEditing && (
        <div className="rounded-2xl border border-[#2F6E9E]/15 bg-[#2F6E9E]/5 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2F6E9E]">
              <FontAwesomeIcon icon={faPenToSquare} />
              Modification du stock
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedStock && <StockStatusBadge stock={selectedStock} />}
              <Badge variant="blue">Stock #{selectedStock?.id_stock || selectedStock?.id}</Badge>
            </div>
          </div>
        </div>
      )}

      {supportsModeTabs && (
        <div className="inline-flex rounded-2xl bg-[#F8FAFC] p-1">
          {[
            { value: "existing", label: "Medicament existant", icon: faLayerGroup },
            { value: "new", label: "Nouveau medicament", icon: faCapsules },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onModeChange(tab.value)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                selectedMode === tab.value
                  ? "bg-[#2F6E9E] text-white shadow-sm"
                  : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8"
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {selectedMode === "existing" ? (
          supportsModeTabs ? (
            <div className="md:col-span-2">
              <MedicamentSelect
                medicaments={medicaments}
                value={selectedMedicamentValue}
                disabled={disableExistingSelection}
                onChange={handleMedicamentSelect}
              />
            </div>
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
              onChange={onChange}
              required
            />
          )
        ) : (
          <MedicamentCreateFields form={form} onChange={onChange} />
        )}

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
          label="Prix (MRU)"
          name="prix"
          type="number"
          min="0"
          step="0.01"
          placeholder="Ex : 200.00 MRU"
          value={form.prix}
          onChange={onChange}
          required
        />

        <Input
          label="Seuil d'alerte"
          name="seuil_alerte"
          type="number"
          min="0"
          step="1"
          placeholder="Ex : 10"
          value={form.seuil_alerte}
          onChange={onChange}
          required
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loadingMedicaments && !hasMedicaments && selectedMode === "existing" && !isEditing && (
        <div className="rounded-xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-medium text-[#2F6E9E]">
          Aucun medicament disponible.
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-[#E2E8F2] pt-4 sm:flex-row sm:justify-end">
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            icon={faRotateLeft}
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          loading={submitting}
          className="w-full sm:w-auto"
          disabled={selectedMode === "existing" && !isEditing && !hasMedicaments}
        >
          {isEditing
            ? "Mettre a jour"
            : "Ajouter au stock"}
        </Button>
      </div>
    </form>
  );
}

export default StockForm;
