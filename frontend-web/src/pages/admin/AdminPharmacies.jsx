import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClinicMedical,
  faClock,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import AdminPharmacyDetailModal from "../../components/admin/AdminPharmacyDetailModal";
import AdminPharmacyFilters from "../../components/admin/AdminPharmacyFilters";
import AdminPharmacyTable from "../../components/admin/AdminPharmacyTable";
import ConfirmModal from "../../components/common/ConfirmModal";
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

const PAGE_SIZE = 10;

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

  const kpis = useMemo(
    () => [
      {
        label: "Total pharmacies",
        value: pagination.count,
        icon: faHospital,
        tone: "blue",
      },
      {
        label: "Validees",
        value: pharmacies.filter((item) => item.est_valide || item.statut_validation === "validee").length,
        icon: faCircleCheck,
        tone: "green",
      },
      {
        label: "En attente",
        value: pharmacies.filter((item) => item.statut_validation === "en_attente").length,
        icon: faClock,
        tone: "orange",
      },
      {
        label: "Suspendues",
        value: pharmacies.filter((item) => item.statut_validation === "suspendue").length,
        icon: faBan,
        tone: "danger",
      },
    ],
    [pagination.count, pharmacies]
  );

  const firstItem = pagination.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, pagination.count);

  return (
    <AdminLayout
      title="Pharmacies"
      subtitle="Gerez les pharmacies enregistrees sur PharmaLocate."
    >
      <div className="space-y-3">
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const toneClass =
              item.tone === "green"
                ? "bg-[#10B981]/10 text-[#047857]"
                : item.tone === "orange"
                  ? "bg-[#F59E0B]/12 text-[#B45309]"
                  : item.tone === "danger"
                    ? "bg-[#EF4444]/10 text-[#DC2626]"
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

        <AdminPharmacyFilters
          search={search}
          statutValidation={statutValidation}
          loading={loading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatutValidation(value);
            setPage(1);
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
            <div className="flex h-40 items-center justify-center text-sm font-semibold text-pharmaBlue">
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
              actionLoading={actionLoading}
              onView={openDetail}
              onValidate={(pharmacy) => openConfirm("validate", pharmacy)}
              onSuspend={(pharmacy) => openConfirm("suspend", pharmacy)}
              onReactivate={(pharmacy) => openConfirm("reactivate", pharmacy)}
              onDelete={(pharmacy) => openConfirm("delete", pharmacy)}
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F2] bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-[#6B7280]">
                Affichage de {firstItem} a {lastItem} sur {pagination.count} pharmacies
              </p>
              <div className="flex items-center justify-end gap-3">
                <p className="text-xs font-semibold text-[#6B7280]">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={!pagination.previous || loading}
                    onClick={() => loadPharmacies(page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                    aria-label="Page precedente"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.next || loading}
                    onClick={() => loadPharmacies(page + 1)}
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
