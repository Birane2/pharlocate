import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleXmark,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import PharmacyDetailModal from "../../components/admin/PharmacyDetailModal";
import PharmacyValidationTable from "../../components/admin/PharmacyValidationTable";
import RejectReasonModal from "../../components/admin/RejectReasonModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getPendingPharmacies,
  rejectAdminPharmacy,
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
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse. Cette page est reservee aux administrateurs.";
  }

  if (error.response?.status === 404) {
    return "Pharmacie introuvable.";
  }

  if (error.response?.data?.motif_refus?.[0]) {
    return error.response.data.motif_refus[0];
  }

  return error.response?.data?.error || "Impossible de traiter la demande.";
}

function PharmaciesValidation() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [todayStats, setTodayStats] = useState({ validated: 0, rejected: 0 });

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));
  const firstItem = pagination.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, pagination.count);

  const loadPharmacies = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");

    try {
      const data = await getPendingPharmacies({
        page: targetPage,
        pageSize: PAGE_SIZE,
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
  }, []);

  const refreshCurrentPage = async () => {
    const targetPage =
      pharmacies.length === 1 && page > 1 ? Math.max(1, page - 1) : page;
    await loadPharmacies(targetPage);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPharmacies(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPharmacies]);

  const openDetail = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setDetailOpen(true);
  };

  const openValidate = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setConfirmOpen(true);
  };

  const openReject = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setRejectOpen(true);
  };

  const handleValidate = async () => {
    if (!selectedPharmacy) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await validateAdminPharmacy(selectedPharmacy.id);
      setSuccess(response.message || "Pharmacie validee avec succes.");
      setConfirmOpen(false);
      setDetailOpen(false);
      setSelectedPharmacy(null);
      setTodayStats((current) => ({
        ...current,
        validated: current.validated + 1,
      }));
      await refreshCurrentPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!selectedPharmacy) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await rejectAdminPharmacy(selectedPharmacy.id, reason);
      setSuccess(response.message || "Pharmacie refusee avec succes.");
      setRejectOpen(false);
      setDetailOpen(false);
      setSelectedPharmacy(null);
      setTodayStats((current) => ({
        ...current,
        rejected: current.rejected + 1,
      }));
      await refreshCurrentPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Validation des pharmacies"
      subtitle="Verifiez et traitez les demandes de creation des pharmacies."
    >
      <div className="space-y-3">
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "En attente",
              value: pagination.count,
              icon: faClock,
              className: "bg-[#F59E0B]/12 text-[#B45309]",
            },
            {
              label: "Validees aujourd'hui",
              value: todayStats.validated,
              icon: faCircleCheck,
              className: "bg-[#10B981]/10 text-[#047857]",
            },
            {
              label: "Refusees aujourd'hui",
              value: todayStats.rejected,
              icon: faCircleXmark,
              className: "bg-[#EF4444]/10 text-[#DC2626]",
            },
          ].map((item) => (
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
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.className}`}>
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                </span>
              </div>
            </article>
          ))}
        </section>

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
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                Aucune pharmacie en attente de validation
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-6 text-pharmaTextLight">
                Toutes les demandes ont ete traitees. Les nouvelles pharmacies
                apparaitront automatiquement ici.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <PharmacyValidationTable
              pharmacies={pharmacies}
              actionLoading={actionLoading}
              onView={openDetail}
              onValidate={openValidate}
              onReject={openReject}
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F2] bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-[#6B7280]">
                Affichage de {firstItem} a {lastItem} sur {pagination.count} demandes
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

      <PharmacyDetailModal
        open={detailOpen}
        pharmacy={selectedPharmacy}
        loading={actionLoading}
        onClose={() => setDetailOpen(false)}
        onValidate={openValidate}
        onReject={openReject}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Valider cette pharmacie ?"
        message={`La pharmacie "${selectedPharmacy?.nom || ""}" deviendra visible publiquement.`}
        confirmLabel="Valider"
        variant="secondary"
        loading={actionLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleValidate}
      />

      <RejectReasonModal
        open={rejectOpen}
        pharmacy={selectedPharmacy}
        loading={actionLoading}
        onCancel={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </AdminLayout>
  );
}

export default PharmaciesValidation;
