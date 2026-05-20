import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const roleLabels = {
  admin: "Admin",
  pharmacien: "Pharmacien",
  utilisateur: "Utilisateur",
};

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F8FBFD] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-pharmaText">{value}</p>
    </div>
  );
}

function AdminUserDetailModal({ open, user, loading = false, onClose }) {
  if (!open) {
    return null;
  }

  const isSuspended = user?.statut === "suspendu";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F2937]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white shadow-[0_30px_90px_rgba(31,41,55,0.25)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#2F6E9E]/10 px-5 py-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#2FA6A3]">
              Detail utilisateur
            </p>
            <h2 className="mt-1 text-xl font-semibold text-pharmaText">
              {user?.nom_complet || user?.username || "Utilisateur"}
            </h2>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2F6E9E]/15 text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </header>

        <div className="p-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm font-semibold text-[#2F6E9E]">
              Chargement du detail utilisateur...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={user?.role === "admin" ? "blue" : "info"} showIcon>
                  {roleLabels[user?.role] || user?.role || "Role inconnu"}
                </Badge>
                <Badge variant={isSuspended ? "danger" : "active"} showIcon>
                  {isSuspended ? "Suspendu" : "Actif"}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Username" value={user?.username || "-"} />
                <DetailRow label="Email" value={user?.email || "Email non renseigne"} />
                <DetailRow label="Nom complet" value={user?.nom_complet || "-"} />
                <DetailRow label="Creation" value={formatDate(user?.date_creation)} />
              </div>

              <div className="rounded-2xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/8 p-4">
                <p className="text-sm font-black text-[#2F6E9E]">
                  Pharmacie associee
                </p>
                {user?.role === "pharmacien" && user?.pharmacy ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <DetailRow label="Nom" value={user.pharmacy.nom} />
                    <DetailRow
                      label="Validation"
                      value={user.pharmacy.statut_validation || "-"}
                    />
                    <DetailRow
                      label="Visible"
                      value={user.pharmacy.est_valide ? "Oui" : "Non"}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-medium text-pharmaTextLight">
                    {user?.role === "pharmacien"
                      ? "Ce pharmacien ne possede pas encore de pharmacie associee."
                      : "Non applicable pour ce role."}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailModal;
