import Button from "../ui/Button";
import Input from "../ui/Input";

function AdminPharmacyFilters({
  search,
  statutValidation,
  onSearchChange,
  onStatusChange,
  onSubmit,
  onReset,
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-4 rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 p-4 shadow-[0_18px_44px_rgba(47,110,158,0.08)] md:grid-cols-[1fr_240px_auto]"
    >
      <Input
        label="Recherche"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Nom, adresse, téléphone, pharmacien..."
      />

      <Input
        label="Statut"
        type="select"
        value={statutValidation}
        onChange={(event) => onStatusChange(event.target.value)}
        options={[
          { value: "", label: "Tous les statuts" },
          { value: "en_attente", label: "En attente" },
          { value: "validee", label: "Validée" },
          { value: "suspendue", label: "Suspendue" },
          { value: "refusee", label: "Refusée" },
        ]}
      />

      <div className="flex items-end gap-2">
        <Button type="submit" className="w-full md:w-auto">
          Filtrer
        </Button>
        <Button type="button" variant="outline" className="w-full md:w-auto" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}

export default AdminPharmacyFilters;
