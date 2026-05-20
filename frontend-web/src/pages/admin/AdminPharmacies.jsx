import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClinicMedical, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import AdminPharmacyDetailModal from "../../components/admin/AdminPharmacyDetailModal";
import AdminPharmacyFilters from "../../components/admin/AdminPharmacyFilters";
import AdminPharmacyTable from "../../components/admin/AdminPharmacyTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import Pagination from "../../components/common/Pagination";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import {
  deleteAdminPharmacy,
  getAdminPharmacies,
  getAdminPharmacyDetail,
  reactivateAdminPharmacy,
  suspendAdminPharmacy,
  validateAdminPharmacy,
} from "../../services/adminPharmacyService";

const PAGE_SIZE = 5;

const emptyPagination = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function getApiErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Accès refusé. Cette page est réservée aux administrateurs.";
  }

  if (error.response?.status === 404) {
    return "Pharmacie introuvable.";
  }

  return error.response?.data?.error || "Impossible de traiter la demande.";
}

function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statutValidation, setStatutValidation] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  const loadPharmacies = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminPharmacies({
          page: targetPage,
          pageSize: PAGE_SIZE,
          search,
          statutValidation,
        });

        setPagination(data);
        setPharmacies(data.results);
        setPage(targetPage);
      } catch (err) {
        setError(getApiErrorMessage(err));
        setPagination(emptyPagination);
        setPharmacies([]);
      } finally {
        setLoading(false);
      }
    },
    [search, statutValidation]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPharmacies(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPharmacies]);

  const refreshCurrentPage = async () => {
    const targetPage =
      pharmacies.length === 1 && page > 1 ? Math.max(1, page - 1) : page;
    await loadPharmacies(targetPage);
  };

  const openDetail = async (pharmacy) => {
    setError("");
    setSelectedPharmacy(pharmacy);
    setDetailOpen(true);

    try {
      setSelectedPharmacy(await getAdminPharmacyDetail(pharmacy.id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const openConfirm = (type, pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setConfirmState({ type, pharmacy });
  };

  const closeConfirm = () => {
    setConfirmState(null);
  };

  const runAction = async () => {
    if (!confirmState?.pharmacy) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const { type, pharmacy } = confirmState;
      let response;

      if (type === "validate") {
        response = await validateAdminPharmacy(pharmacy.id);
      } else if (type === "suspend") {
        response = await suspendAdminPharmacy(pharmacy.id);
      } else if (type === "reactivate") {
        response = await reactivateAdminPharmacy(pharmacy.id);
      } else if (type === "delete") {
        response = await deleteAdminPharmacy(pharmacy.id);
      }

      setSuccess(response?.message || "Action effectuée avec succès.");
      closeConfirm();
      setSelectedPharmacy(null);
      await refreshCurrentPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmContent = {
    validate: {
      title: "Valider cette pharmacie ?",
      message: "Elle deviendra visible publiquement.",
      label: "Valider",
      variant: "secondary",
    },
    suspend: {
      title: "Suspendre cette pharmacie ?",
      message: "Elle ne sera plus visible publiquement.",
      label: "Suspendre",
      variant: "outline",
    },
    reactivate: {
      title: "Réactiver cette pharmacie ?",
      message: "Elle redeviendra visible publiquement.",
      label: "Réactiver",
      variant: "secondary",
    },
    delete: {
      title: "Supprimer cette pharmacie ?",
      message: "Cette action est définitive et supprimera les données associées.",
      label: "Supprimer",
      variant: "danger",
    },
  }[confirmState?.type] || {};

  return (
    <AdminLayout title="Gestion des pharmacies">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] p-5 text-white shadow-[0_22px_60px_rgba(47,110,158,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Administration
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                Gestion des pharmacies
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-normal leading-6 text-white/85">
                Consultez, filtrez et administrez toutes les pharmacies de la plateforme.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-white bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
              icon={faRotateRight}
              onClick={() => loadPharmacies(page)}
              loading={loading}
            >
              Actualiser
            </Button>
          </div>
        </section>

        <AdminPharmacyFilters
          search={search}
          statutValidation={statutValidation}
          onSearchChange={setSearch}
          onStatusChange={setStatutValidation}
          onSubmit={() => loadPharmacies(1)}
          onReset={() => {
            setSearch("");
            setStatutValidation("");
            window.setTimeout(() => loadPharmacies(1), 0);
          }}
        />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-[#35C3A3]/25 bg-[#35C3A3]/10 px-4 py-3 text-sm font-medium text-[#13795f]">
            {success}
          </div>
        )}

        {loading ? (
          <Card hover={false}>
            <div className="flex h-48 items-center justify-center text-sm font-semibold text-pharmaBlue">
              Chargement des pharmacies...
            </div>
          </Card>
        ) : pharmacies.length === 0 ? (
          <Card hover={false}>
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35C3A3]/15 text-[#13795f]">
                <FontAwesomeIcon icon={faClinicMedical} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                Aucune pharmacie trouvée
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-6 text-pharmaTextLight">
                Aucune pharmacie ne correspond aux critères actuels.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <AdminPharmacyTable
              pharmacies={pharmacies}
              onView={openDetail}
              onValidate={(pharmacy) => openConfirm("validate", pharmacy)}
              onSuspend={(pharmacy) => openConfirm("suspend", pharmacy)}
              onReactivate={(pharmacy) => openConfirm("reactivate", pharmacy)}
              onDelete={(pharmacy) => openConfirm("delete", pharmacy)}
            />

            <Pagination
              page={page}
              totalPages={totalPages}
              previous={pagination.previous}
              next={pagination.next}
              loading={loading}
              onPageChange={loadPharmacies}
            />
          </>
        )}
      </div>

      <AdminPharmacyDetailModal
        open={detailOpen}
        pharmacy={selectedPharmacy}
        onClose={() => setDetailOpen(false)}
      />

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmContent.title}
        message={`${confirmContent.message || ""} Pharmacie : ${confirmState?.pharmacy?.nom || ""}`}
        confirmLabel={confirmContent.label}
        variant={confirmContent.variant}
        loading={actionLoading}
        onCancel={closeConfirm}
        onConfirm={runAction}
      />
    </AdminLayout>
  );
}

export default AdminPharmacies;
