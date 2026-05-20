import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateRight,
  faUserGroup,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import AdminUserDetailModal from "../../components/admin/AdminUserDetailModal";
import AdminUserFilters from "../../components/admin/AdminUserFilters";
import AdminUsersTable from "../../components/admin/AdminUsersTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import Pagination from "../../components/common/Pagination";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import {
  activateAdminUser,
  deleteAdminUser,
  getAdminUserDetail,
  getAdminUsers,
  suspendAdminUser,
} from "../../services/adminUserService";

const PAGE_SIZE = 4;

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
    [search, role]
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

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="space-y-6">
        <section className="rounded-[1.5rem] bg-gradient-to-br from-[#2F6E9E] via-[#4A8BBE] to-[#2FA6A3] p-5 text-white shadow-[0_22px_60px_rgba(47,110,158,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Administration
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal md:text-3xl">
                Gestion des utilisateurs
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-normal leading-6 text-white/85">
                Supervisez les comptes, les roles et les statuts d'acces de PharmaLocate.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
              icon={faRotateRight}
              onClick={() => loadUsers(page)}
              loading={loading}
            >
              Actualiser
            </Button>
          </div>
        </section>

        <AdminUserFilters
          search={search}
          role={role}
          loading={loading}
          onSearchChange={setSearch}
          onRoleChange={setRole}
          onSubmit={() => loadUsers(1)}
          onReset={() => {
            setSearch("");
            setRole("");
            window.setTimeout(() => loadUsers(1), 0);
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
            <div className="flex h-48 items-center justify-center text-sm font-semibold text-[#2F6E9E]">
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
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#2F6E9E]/10 bg-white/90 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faUsersGear} />
                </span>
                <div>
                  <p className="text-sm font-black text-pharmaText">
                    {pagination.count} utilisateur{pagination.count > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs font-medium text-pharmaTextLight">
                    Liste synchronisee avec l'API admin
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

            <Pagination
              page={page}
              totalPages={totalPages}
              previous={pagination.previous}
              next={pagination.next}
              loading={loading}
              onPageChange={loadUsers}
            />
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
