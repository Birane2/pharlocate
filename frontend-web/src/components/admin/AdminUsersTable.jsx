import {
  faBan,
  faCheck,
  faEye,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const roleLabels = {
  admin: "Admin",
  pharmacien: "Pharmacien",
  utilisateur: "Utilisateur",
};

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

function getUserInitials(user) {
  const name = user.nom_complet || user.username || "Utilisateur";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRoleClass(role) {
  if (role === "admin") {
    return "bg-[#2F6E9E]/12 text-[#245B82]";
  }

  if (role === "pharmacien") {
    return "bg-[#2FA6A3]/10 text-[#2FA6A3]";
  }

  return "bg-[#4A8BBE]/10 text-[#2F6E9E]";
}

function getStatusClass(statut) {
  if (statut === "suspendu") {
    return "bg-[#EF4444]/10 text-[#DC2626]";
  }

  if (statut === "en_attente") {
    return "bg-[#F59E0B]/12 text-[#B45309]";
  }

  return "bg-[#10B981]/10 text-[#047857]";
}

function Badge({ children, className }) {
  return (
    <span className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

function IconButton({ label, icon, tone = "blue", loading = false, onClick }) {
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
      disabled={loading}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

function UserActions({ user, loadingActionId, onView, onActivate, onSuspend, onDelete }) {
  const isSuspended = user.statut === "suspendu";
  const isLoading = loadingActionId === user.id;

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <IconButton
        label="Voir detail"
        icon={faEye}
        loading={isLoading}
        onClick={() => onView(user)}
      />
      {isSuspended ? (
        <IconButton
          label="Activer"
          icon={faCheck}
          tone="success"
          loading={isLoading}
          onClick={() => onActivate(user)}
        />
      ) : (
        <IconButton
          label="Suspendre"
          icon={faBan}
          tone="warning"
          loading={isLoading}
          onClick={() => onSuspend(user)}
        />
      )}
      <IconButton
        label="Supprimer"
        icon={faTrash}
        tone="danger"
        loading={isLoading}
        onClick={() => onDelete(user)}
      />
    </div>
  );
}

function AdminUsersTable({ users, loadingActionId, onView, onActivate, onSuspend, onDelete }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date creation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F6E9E]/10 text-xs font-black text-[#2F6E9E]">
                      {getUserInitials(user)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {user.nom_complet || user.username}
                      </p>
                      <p className="truncate text-xs font-semibold text-[#6B7280]">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-xs truncate px-4 py-2.5 font-semibold text-[#6B7280]">
                  {user.email || "Email non renseigne"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={getRoleClass(user.role)}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={getStatusClass(user.statut)}>
                    {user.statut === "suspendu" ? "Suspendu" : "Actif"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs font-bold text-[#6B7280]">
                  {formatDate(user.date_creation)}
                </td>
                <td className="px-4 py-2.5">
                  <UserActions
                    user={user}
                    loadingActionId={loadingActionId}
                    onView={onView}
                    onActivate={onActivate}
                    onSuspend={onSuspend}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 p-3 md:hidden">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-xl border border-[#E2E8F2] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F6E9E]/10 text-xs font-black text-[#2F6E9E]">
                  {getUserInitials(user)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1C2B4A]">
                    {user.nom_complet || user.username}
                  </p>
                  <p className="truncate text-xs font-semibold text-[#6B7280]">
                    {user.email || "Email non renseigne"}
                  </p>
                </div>
              </div>
              <UserActions
                user={user}
                loadingActionId={loadingActionId}
                onView={onView}
                onActivate={onActivate}
                onSuspend={onSuspend}
                onDelete={onDelete}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className={getRoleClass(user.role)}>
                {roleLabels[user.role] || user.role}
              </Badge>
              <Badge className={getStatusClass(user.statut)}>
                {user.statut === "suspendu" ? "Suspendu" : "Actif"}
              </Badge>
              <span className="text-xs font-bold text-[#6B7280]">
                {formatDate(user.date_creation)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminUsersTable;
