import {
  faCheck,
  faEye,
  faPause,
  faPlay,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const statusLabels = {
  en_attente: "En attente",
  validee: "Validée",
  refusee: "Refusée",
  suspendue: "Suspendue",
};

const statusVariants = {
  en_attente: "warning",
  validee: "success",
  refusee: "danger",
  suspendue: "danger",
};

function AdminPharmacyTable({
  pharmacies,
  onView,
  onValidate,
  onSuspend,
  onReactivate,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#2F6E9E]/10 bg-white/90 shadow-[0_22px_56px_rgba(47,110,158,0.1)]">
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-[#2F6E9E]/10">
          <thead className="bg-[#F8FBFD]">
            <tr>
              {["Pharmacie", "Pharmacien", "Statut", "Activité", "Actions"].map((header) => (
                <th key={header} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-pharmaTextLight">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2F6E9E]/10">
            {pharmacies.map((pharmacy) => (
              <tr key={pharmacy.id} className="transition hover:bg-[#2F6E9E]/5">
                <td className="px-5 py-4">
                  <p className="font-semibold text-pharmaText">{pharmacy.nom}</p>
                  <p className="mt-1 max-w-sm text-sm leading-5 text-pharmaTextLight">
                    {pharmacy.adresse}
                  </p>
                  <p className="mt-1 text-xs text-pharmaTextLight">{pharmacy.telephone}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-pharmaText">
                    {pharmacy.pharmacien_username}
                  </p>
                  <p className="text-xs text-pharmaTextLight">{pharmacy.pharmacien_email}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={statusVariants[pharmacy.statut_validation] || "info"} showIcon>
                    {statusLabels[pharmacy.statut_validation] || pharmacy.statut_validation}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-pharmaTextLight">
                  {pharmacy.horaires_count} horaires · {pharmacy.stocks_count} stocks · {pharmacy.reservations_count} réserv.
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" icon={faEye} onClick={() => onView(pharmacy)}>
                      Détail
                    </Button>
                    {pharmacy.statut_validation === "en_attente" && (
                      <Button size="sm" variant="secondary" icon={faCheck} onClick={() => onValidate(pharmacy)}>
                        Valider
                      </Button>
                    )}
                    {pharmacy.statut_validation === "validee" && (
                      <Button size="sm" variant="outline" icon={faPause} onClick={() => onSuspend(pharmacy)}>
                        Suspendre
                      </Button>
                    )}
                    {pharmacy.statut_validation === "suspendue" && (
                      <Button size="sm" variant="secondary" icon={faPlay} onClick={() => onReactivate(pharmacy)}>
                        Réactiver
                      </Button>
                    )}
                    <Button size="sm" variant="danger" icon={faTrash} onClick={() => onDelete(pharmacy)}>
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 xl:hidden">
        {pharmacies.map((pharmacy) => (
          <article key={pharmacy.id} className="rounded-2xl border border-[#2F6E9E]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-pharmaText">{pharmacy.nom}</h3>
                <p className="mt-1 text-sm leading-5 text-pharmaTextLight">{pharmacy.adresse}</p>
              </div>
              <Badge variant={statusVariants[pharmacy.statut_validation] || "info"}>
                {statusLabels[pharmacy.statut_validation] || pharmacy.statut_validation}
              </Badge>
            </div>

            <p className="mt-3 text-sm text-pharmaTextLight">
              Pharmacien : {pharmacy.pharmacien_username}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" icon={faEye} onClick={() => onView(pharmacy)}>
                Détail
              </Button>
              {pharmacy.statut_validation === "en_attente" && (
                <Button size="sm" variant="secondary" icon={faCheck} onClick={() => onValidate(pharmacy)}>
                  Valider
                </Button>
              )}
              {pharmacy.statut_validation === "validee" && (
                <Button size="sm" variant="outline" icon={faPause} onClick={() => onSuspend(pharmacy)}>
                  Suspendre
                </Button>
              )}
              {pharmacy.statut_validation === "suspendue" && (
                <Button size="sm" variant="secondary" icon={faPlay} onClick={() => onReactivate(pharmacy)}>
                  Réactiver
                </Button>
              )}
              <Button size="sm" variant="danger" icon={faTrash} onClick={() => onDelete(pharmacy)}>
                Supprimer
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default AdminPharmacyTable;
