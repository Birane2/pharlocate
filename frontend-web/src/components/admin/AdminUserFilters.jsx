import { faFilter, faRotateLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const roleOptions = [
  { label: "Utilisateur", value: "utilisateur" },
  { label: "Pharmacien", value: "pharmacien" },
  { label: "Admin", value: "admin" },
];

function AdminUserFilters({
  search,
  role,
  loading = false,
  onSearchChange,
  onRoleChange,
  onSubmit,
  onReset,
}) {
  return (
    <Card hover={false}>
      <form
        className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Input
          label="Recherche"
          value={search}
          placeholder="Username, nom ou email"
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <Input
          label="Role"
          type="select"
          value={role}
          placeholder="Tous les roles"
          options={roleOptions}
          onChange={(event) => onRoleChange(event.target.value)}
        />

        <div className="flex items-end">
          <Button type="submit" icon={faSearch} disabled={loading} className="w-full">
            Rechercher
          </Button>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            icon={faRotateLeft}
            disabled={loading}
            className="w-full"
            onClick={onReset}
          >
            Reinitialiser
          </Button>
        </div>
      </form>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#2FA6A3]/10 px-4 py-3 text-sm font-medium text-[#2F6E9E]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#2FA6A3]">
          <span className="sr-only">Filtres</span>
          <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
        </span>
        <span>Filtre actif: {role || "tous les roles"}</span>
      </div>
    </Card>
  );
}

export default AdminUserFilters;
