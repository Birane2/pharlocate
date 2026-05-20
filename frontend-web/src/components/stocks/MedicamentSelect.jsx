import Input from "../ui/Input";

function MedicamentSelect({ medicaments, value, disabled = false, onChange }) {
  return (
    <Input
      label="Medicament existant"
      type="select"
      value={value}
      placeholder="Choisir un medicament"
      disabled={disabled}
      options={medicaments.map((medicament) => ({
        value: medicament.id,
        label: medicament.nom,
      }))}
      helperText="Selectionnez un medicament deja disponible dans le catalogue."
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default MedicamentSelect;
