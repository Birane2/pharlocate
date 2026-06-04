import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faUser,
  faUserDoctor,
  faUserGroup,
  faUserShield,
  faUsers,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import AdminUserDetailModal from "../../components/admin/AdminUserDetailModal";
import AdminUserFilters from "../../components/admin/AdminUserFilters";
import AdminUsersTable from "../../components/admin/AdminUsersTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import {
  activateAdminUser,
  deleteAdminUser,
  getAdminUserDetail,
  getAdminUsers,
  suspendAdminUser,
} from "../../services/adminUserService";

const PAGE_SIZE = 10;

const emptyPagination = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse. Cette page est reservee aux administrateurs.";
  }

  if (error.response?.status === 404) {
    return "Utilisateur introuvable.";
  }

  if (error.response?.status >= 500) {
    return "Erreur serveur. Veuillez reessayer dans quelques instants.";
  }

  return (
    error.response?.data?.error ||
    error.response?.data?.detail ||
    "Impossible de traiter la demande."
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [statut, setStatut] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  const loadUsers = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminUsers({
          page: targetPage,
          pageSize: PAGE_SIZE,
          search,
          role,
          statut,
        });

        setPagination(data);
        setUsers(data.results);
        setPage(targetPage);
      } catch (err) {
        setError(getApiErrorMessage(err));
        setPagination(emptyPagination);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [search, role, statut]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const refreshCurrentPage = async () => {
    const targetPage = users.length === 1 && page > 1 ? page - 1 : page;
    await loadUsers(targetPage);
  };

  const openDetail = async (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      setSelectedUser(await getAdminUserDetail(user.id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const openConfirm = (type, user) => {
    setConfirmState({ type, user });
  };

  const closeConfirm = () => {
    setConfirmState(null);
  };

  const runAction = async () => {
    if (!confirmState?.user) {
      return;
    }

    const { type, user } = confirmState;
    setActionLoadingId(user.id);
    setError("");
    setSuccess("");

    try {
      let response;

      if (type === "activate") {
        response = await activateAdminUser(user.id);
      } else if (type === "suspend") {
        response = await suspendAdminUser(user.id);
      } else if (type === "delete") {
        response = await deleteAdminUser(user.id);
      }

      setSuccess(response?.message || "Action effectuee avec succes.");
      closeConfirm();
      setSelectedUser(null);
      await refreshCurrentPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmContent = {
    activate: {
      title: "Activer ce compte ?",
      message: "Cet utilisateur pourra de nouveau acceder a la plateforme.",
      label: "Activer",
      variant: "secondary",
    },
    suspend: {
      title: "Suspendre ce compte ?",
      message: "Cet utilisateur ne pourra plus se connecter.",
      label: "Suspendre",
      variant: "outline",
    },
    delete: {
      title: "Supprimer cet utilisateur ?",
      message: "Cette action est definitive et supprimera les donnees associees.",
      label: "Supprimer",
      variant: "danger",
    },
  }[confirmState?.type] || {};

  const kpis = useMemo(
    () => [
      {
        label: "Total utilisateurs",
        value: pagination.count,
        icon: faUsers,
        tone: "blue",
      },
      {
        label: "Utilisateurs",
        value: users.filter((user) => user.role === "utilisateur").length,
        icon: faUser,
        tone: "lightBlue",
      },
      {
        label: "Pharmaciens",
        value: users.filter((user) => user.role === "pharmacien").length,
        icon: faUserDoctor,
        tone: "turquoise",
      },
      {
        label: "Administrateurs",
        value: users.filter((user) => user.role === "admin").length,
        icon: faUserShield,
        tone: "darkBlue",
      },
    ],
    [pagination.count, users]
  );

  const firstItem = pagination.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, pagination.count);

  return (
    <AdminLayout
      title="Utilisateurs"
      subtitle="Gerez les comptes utilisateurs, pharmaciens et administrateurs."
    >
      <div className="space-y-3">
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const toneClass =
              item.tone === "turquoise"
                ? "bg-[#2FA6A3]/10 text-[#2FA6A3]"
                : item.tone === "lightBlue"
                  ? "bg-[#4A8BBE]/10 text-[#4A8BBE]"
                  : item.tone === "darkBlue"
                    ? "bg-[#1C2B4A]/10 text-[#1C2B4A]"
                    : "bg-[#2F6E9E]/10 text-[#2F6E9E]";

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-[#1C2B4A]">{item.value}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#6B7280]">
                      {item.label}
                    </p>
                  </div>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <AdminUserFilters
          search={search}
          role={role}
          statut={statut}
          loading={loading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onFilterChange={(filter) => {
            setRole(filter.role);
            setStatut(filter.statut);
            setPage(1);
          }}
        />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-[#5EC6B8]/30 bg-[#5EC6B8]/10 px-4 py-3 text-sm font-medium text-[#13795f]">
            {success}
          </div>
        )}

        {loading ? (
          <Card hover={false}>
            <div className="flex h-40 items-center justify-center text-sm font-semibold text-[#2F6E9E]">
              Chargement des utilisateurs...
            </div>
          </Card>
        ) : users.length === 0 ? (
          <Card hover={false}>
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2FA6A3]/15 text-[#2FA6A3]">
                <FontAwesomeIcon icon={faUserGroup} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                Aucun utilisateur trouve
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-6 text-pharmaTextLight">
                Aucun compte ne correspond aux criteres actuels.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faUsersGear} />
                </span>
                <div>
                  <p className="text-sm font-black text-pharmaText">
                    {pagination.count} utilisateur{pagination.count > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs font-medium text-pharmaTextLight">
                    Affichage de {firstItem} a {lastItem} sur {pagination.count}
                  </p>
                </div>
              </div>
            </div>

            <AdminUsersTable
              users={users}
              loadingActionId={actionLoadingId}
              onView={openDetail}
              onActivate={(user) => openConfirm("activate", user)}
              onSuspend={(user) => openConfirm("suspend", user)}
              onDelete={(user) => openConfirm("delete", user)}
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F2] bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-[#6B7280]">
                Affichage de {firstItem} a {lastItem} sur {pagination.count} utilisateurs
              </p>
              <div className="flex items-center justify-end gap-3">
                <p className="text-xs font-semibold text-[#6B7280]">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={!pagination.previous || loading}
                    onClick={() => loadUsers(page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                    aria-label="Page precedente"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.next || loading}
                    onClick={() => loadUsers(page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                    aria-label="Page suivante"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AdminUserDetailModal
        open={detailOpen}
        user={selectedUser}
        loading={detailLoading}
        onClose={() => setDetailOpen(false)}
      />

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmContent.title}
        message={`${confirmContent.message || ""} Utilisateur : ${
          confirmState?.user?.username || ""
        }`}
        confirmLabel={confirmContent.label}
        variant={confirmContent.variant}
        loading={Boolean(actionLoadingId)}
        onCancel={closeConfirm}
        onConfirm={runAction}
      />
    </AdminLayout>
  );
}

export default AdminUsers;
