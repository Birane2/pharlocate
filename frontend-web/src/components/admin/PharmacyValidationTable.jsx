import {
  faCheck,
  faClock,
  faEye,
  faLocationDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCoordinates(pharmacy) {
  if (!pharmacy.latitude || !pharmacy.longitude) {
    return "Coordonnees indisponibles";
  }

  return `${pharmacy.latitude}, ${pharmacy.longitude}`;
}

function PendingBadge() {
  return (
    <span className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full bg-[#F59E0B]/12 px-3 py-1 text-xs font-bold text-[#B45309]">
      <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
      En attente
    </span>
  );
}

function IconButton({ label, icon, tone = "blue", disabled = false, onClick }) {
  const toneClass =
    tone === "danger"
      ? "text-[#DC2626] hover:bg-[#EF4444]/10 focus:ring-[#EF4444]/15"
      : tone === "success"
        ? "text-[#047857] hover:bg-[#10B981]/10 focus:ring-[#10B981]/15"
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

function ValidationActions({ pharmacy, disabled, onView, onValidate, onReject }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <IconButton
        label="Voir detail"
        icon={faEye}
        disabled={disabled}
        onClick={() => onView(pharmacy)}
      />
      <IconButton
        label="Valider"
        icon={faCheck}
        tone="success"
        disabled={disabled}
        onClick={() => onValidate(pharmacy)}
      />
      <IconButton
        label="Refuser"
        icon={faXmark}
        tone="danger"
        disabled={disabled}
        onClick={() => onReject(pharmacy)}
      />
    </div>
  );
}

function PharmacyValidationTable({
  pharmacies,
  actionLoading = false,
  onView,
  onValidate,
  onReject,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              <th className="px-4 py-3">Pharmacie</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Pharmacien</th>
              <th className="px-4 py-3">Date</th>
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
                <td className="px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                  {pharmacy.telephone || "Telephone non renseigne"}
                </td>
                <td className="max-w-xs px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[#2FA6A3]" />
                    <span className="truncate">{formatCoordinates(pharmacy)}</span>
                  </span>
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
                  {formatDate(pharmacy.date_creation)}
                </td>
                <td className="px-4 py-2.5">
                  <PendingBadge />
                </td>
                <td className="px-4 py-2.5">
                  <ValidationActions
                    pharmacy={pharmacy}
                    disabled={actionLoading}
                    onView={onView}
                    onValidate={onValidate}
                    onReject={onReject}
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
              <PendingBadge />
            </div>

            <div className="mt-3 grid gap-2 text-xs text-[#6B7280]">
              <p>
                <span className="font-bold text-[#1C2B4A]">Telephone : </span>
                {pharmacy.telephone || "-"}
              </p>
              <p>
                <span className="font-bold text-[#1C2B4A]">Pharmacien : </span>
                {pharmacy.pharmacien_username || "-"}
              </p>
              <p>
                <span className="font-bold text-[#1C2B4A]">Date : </span>
                {formatDate(pharmacy.date_creation)}
              </p>
              <p className="truncate">
                <span className="font-bold text-[#1C2B4A]">GPS : </span>
                {formatCoordinates(pharmacy)}
              </p>
            </div>

            <div className="mt-3">
              <ValidationActions
                pharmacy={pharmacy}
                disabled={actionLoading}
                onView={onView}
                onValidate={onValidate}
                onReject={onReject}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PharmacyValidationTable;
