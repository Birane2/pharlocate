import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEye,
  faLocationDot,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

function formatDate(value) {
  if (!value) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function PharmacyValidationTable({ pharmacies, onView, onValidate, onReject }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#2F6E9E]/10 bg-white/90 shadow-[0_22px_56px_rgba(47,110,158,0.1)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-[#2F6E9E]/10">
          <thead className="bg-[#F8FBFD]">
            <tr>
              {["Pharmacie", "Contact", "Position", "Pharmacien", "Statut", "Actions"].map((header) => (
                <th
                  key={header}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-pharmaTextLight"
                >
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
                  <p className="mt-1 max-w-xs text-sm leading-5 text-pharmaTextLight">
                    {pharmacy.adresse}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-pharmaText">
                  {pharmacy.telephone}
                </td>
                <td className="px-5 py-4 text-sm text-pharmaTextLight">
                  <span className="inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[#2FA6A3]" />
                    {pharmacy.latitude}, {pharmacy.longitude}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-pharmaText">
                    {pharmacy.pharmacien_username}
                  </p>
                  <p className="text-xs text-pharmaTextLight">{pharmacy.pharmacien_email}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge variant="warning" showIcon>
                    En attente
                  </Badge>
                  <p className="mt-2 text-xs text-pharmaTextLight">
                    {formatDate(pharmacy.date_creation)}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" icon={faEye} onClick={() => onView(pharmacy)}>
                      Détail
                    </Button>
                    <Button size="sm" variant="secondary" icon={faCheck} onClick={() => onValidate(pharmacy)}>
                      Valider
                    </Button>
                    <Button size="sm" variant="danger" icon={faTimes} onClick={() => onReject(pharmacy)}>
                      Refuser
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {pharmacies.map((pharmacy) => (
          <article key={pharmacy.id} className="rounded-2xl border border-[#2F6E9E]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-pharmaText">{pharmacy.nom}</h3>
                <p className="mt-1 text-sm leading-5 text-pharmaTextLight">{pharmacy.adresse}</p>
              </div>
              <Badge variant="warning">En attente</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-pharmaTextLight">
              <p>Téléphone : {pharmacy.telephone}</p>
              <p>Pharmacien : {pharmacy.pharmacien_username}</p>
              <p>Créée le : {formatDate(pharmacy.date_creation)}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button size="sm" variant="outline" icon={faEye} onClick={() => onView(pharmacy)}>
                Détail
              </Button>
              <Button size="sm" variant="secondary" icon={faCheck} onClick={() => onValidate(pharmacy)}>
                Valider
              </Button>
              <Button size="sm" variant="danger" icon={faTimes} onClick={() => onReject(pharmacy)}>
                Refuser
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default PharmacyValidationTable;
