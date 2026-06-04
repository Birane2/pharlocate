import {
  faBan,
  faCheck,
  faEye,
  faRotateRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const statusLabels = {
  en_attente: "En attente",
  validee: "Validee",
  refusee: "Refusee",
  suspendue: "Suspendue",
};

function getStatus(pharmacy) {
  if (pharmacy.est_valide) {
    return "validee";
  }

  return pharmacy.statut_validation || "en_attente";
}

function getStatusClass(status) {
  if (status === "validee") {
    return "bg-[#10B981]/10 text-[#047857]";
  }

  if (status === "en_attente") {
    return "bg-[#F59E0B]/12 text-[#B45309]";
  }

  if (status === "suspendue") {
    return "bg-[#EF4444]/10 text-[#DC2626]";
  }

  return "bg-red-50 text-red-600";
}

function StatusBadge({ pharmacy }) {
  const status = getStatus(pharmacy);

  return (
    <span className={`inline-flex min-w-24 justify-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function IconButton({ label, icon, tone = "blue", disabled = false, onClick }) {
  const toneClass =
    tone === "danger"
      ? "text-[#DC2626] hover:bg-[#EF4444]/10 focus:ring-[#EF4444]/15"
      : tone === "success"
        ? "text-[#047857] hover:bg-[#10B981]/10 focus:ring-[#10B981]/15"
        : tone === "warning"
          ? "text-[#B45309] hover:bg-[#F59E0B]/12 focus:ring-[#F59E0B]/15"
          : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8 focus:ring-[#2F6E9E]/15";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

function PharmacyActions({
  pharmacy,
  disabled,
  onView,
  onValidate,
  onSuspend,
  onReactivate,
  onDelete,
}) {
  const status = getStatus(pharmacy);

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <IconButton
        label="Voir detail"
        icon={faEye}
        disabled={disabled}
        onClick={() => onView(pharmacy)}
      />
      {status === "en_attente" && (
        <IconButton
          label="Valider"
          icon={faCheck}
          tone="success"
          disabled={disabled}
          onClick={() => onValidate(pharmacy)}
        />
      )}
      {status === "validee" && (
        <IconButton
          label="Suspendre"
          icon={faBan}
          tone="warning"
          disabled={disabled}
          onClick={() => onSuspend(pharmacy)}
        />
      )}
      {status === "suspendue" && (
        <IconButton
          label="Reactiver"
          icon={faRotateRight}
          tone="success"
          disabled={disabled}
          onClick={() => onReactivate(pharmacy)}
        />
      )}
      {["en_attente", "suspendue", "refusee"].includes(status) && (
        <IconButton
          label="Supprimer"
          icon={faTrash}
          tone="danger"
          disabled={disabled}
          onClick={() => onDelete(pharmacy)}
        />
      )}
    </div>
  );
}

function formatCoordinates(pharmacy) {
  if (!pharmacy.latitude || !pharmacy.longitude) {
    return "Coordonnees indisponibles";
  }

  return `${pharmacy.latitude}, ${pharmacy.longitude}`;
}

function AdminPharmacyTable({
  pharmacies,
  actionLoading = false,
  onView,
  onValidate,
  onSuspend,
  onReactivate,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              <th className="px-4 py-3">Pharmacie</th>
              <th className="px-4 py-3">Pharmacien</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pharmacies.map((pharmacy) => (
              <tr
                key={pharmacy.id}
                className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
              >
                <td className="max-w-xs px-4 py-2.5">
                  <p className="truncate font-bold">{pharmacy.nom}</p>
                  <p className="truncate text-xs font-semibold text-[#6B7280]">
                    {pharmacy.adresse || "Adresse non renseignee"}
                  </p>
                </td>
                <td className="max-w-xs px-4 py-2.5">
                  <p className="truncate font-bold">
                    {pharmacy.pharmacien_username || "Pharmacien"}
                  </p>
                  <p className="truncate text-xs font-semibold text-[#6B7280]">
                    {pharmacy.pharmacien_email || "Email non renseigne"}
                  </p>
                </td>
                <td className="px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                  {pharmacy.telephone || "Telephone non renseigne"}
                </td>
                <td className="max-w-xs px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                  <p className="truncate">{pharmacy.adresse || "-"}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#94A3B8]">
                    {formatCoordinates(pharmacy)}
                  </p>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge pharmacy={pharmacy} />
                </td>
                <td className="px-4 py-2.5">
                  <PharmacyActions
                    pharmacy={pharmacy}
                    disabled={actionLoading}
                    onView={onView}
                    onValidate={onValidate}
                    onSuspend={onSuspend}
                    onReactivate={onReactivate}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 p-3 lg:hidden">
        {pharmacies.map((pharmacy) => (
          <article
            key={pharmacy.id}
            className="rounded-xl border border-[#E2E8F2] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-[#1C2B4A]">
                  {pharmacy.nom}
                </h3>
                <p className="mt-1 truncate text-xs font-semibold text-[#6B7280]">
                  {pharmacy.adresse || "Adresse non renseignee"}
                </p>
              </div>
              <StatusBadge pharmacy={pharmacy} />
            </div>

            <div className="mt-3 grid gap-2 text-xs text-[#6B7280]">
              <p>
                <span className="font-bold text-[#1C2B4A]">Pharmacien : </span>
                {pharmacy.pharmacien_username || "-"}
              </p>
              <p>
                <span className="font-bold text-[#1C2B4A]">Telephone : </span>
                {pharmacy.telephone || "-"}
              </p>
              <p className="truncate">
                <span className="font-bold text-[#1C2B4A]">GPS : </span>
                {formatCoordinates(pharmacy)}
              </p>
            </div>

            <div className="mt-3">
              <PharmacyActions
                pharmacy={pharmacy}
                disabled={actionLoading}
                onView={onView}
                onValidate={onValidate}
                onSuspend={onSuspend}
                onReactivate={onReactivate}
                onDelete={onDelete}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminPharmacyTable;
