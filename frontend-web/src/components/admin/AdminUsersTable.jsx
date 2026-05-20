import {
  faEye,
  faLock,
  faTrash,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getRoleVariant(role) {
  if (role === "admin") {
    return "blue";
  }

  if (role === "pharmacien") {
    return "info";
  }

  return "success";
}

function AdminUsersTable({ users, loadingActionId, onView, onActivate, onSuspend, onDelete }) {
  return (
    <Card hover={false} bodyClassName="p-0 sm:p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2F6E9E]/10">
          <thead className="bg-[#F8FBFD]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Pharmacie
              </th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Creation
              </th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-[#2F6E9E]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#2F6E9E]/10 bg-white">
            {users.map((user) => {
              const isSuspended = user.statut === "suspendu";
              const isLoading = loadingActionId === user.id;

              return (
                <tr key={user.id} className="transition hover:bg-[#2FA6A3]/5">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-black text-pharmaText">
                        {user.nom_complet || user.username}
                      </p>
                      <p className="mt-1 text-xs font-medium text-pharmaTextLight">
                        @{user.username} - {user.email || "Email non renseigne"}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant={getRoleVariant(user.role)} showIcon>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant={isSuspended ? "danger" : "active"} showIcon>
                      {isSuspended ? "Suspendu" : "Actif"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-sm font-medium text-pharmaTextLight">
                    {user.role === "pharmacien"
                      ? user.pharmacy_name || "Aucune pharmacie"
                      : "Non applicable"}
                  </td>

                  <td className="px-4 py-4 text-sm font-medium text-pharmaTextLight">
                    {formatDate(user.date_creation)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={faEye}
                        disabled={isLoading}
                        onClick={() => onView(user)}
                      >
                        Voir detail
                      </Button>

                      {isSuspended ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={faUnlock}
                          loading={isLoading}
                          onClick={() => onActivate(user)}
                        >
                          Activer
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={faLock}
                          loading={isLoading}
                          onClick={() => onSuspend(user)}
                        >
                          Suspendre
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="danger"
                        icon={faTrash}
                        loading={isLoading}
                        onClick={() => onDelete(user)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default AdminUsersTable;
