import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingCircleCheck,
  faClock,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import PharmacyDetailModal from "../../components/admin/PharmacyDetailModal";
import PharmacyValidationTable from "../../components/admin/PharmacyValidationTable";
import RejectReasonModal from "../../components/admin/RejectReasonModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getPendingPharmacies,
  rejectAdminPharmacy,
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

  if (error.response?.data?.motif_refus?.[0]) {
    return error.response.data.motif_refus[0];
  }

  return error.response?.data?.error || "Impossible de traiter la demande.";
}

function PaginationControls({ page, totalPages, previous, next, loading, onPageChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#2F6E9E]/10 bg-white/90 px-4 py-3 shadow-[0_16px_36px_rgba(47,110,158,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-pharmaTextLight">
        Page <span className="font-bold text-pharmaText">{page}</span> sur{" "}
        <span className="font-bold text-pharmaText">{totalPages}</span>
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!previous || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!next || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
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

  const totalPages = Math.max(1, Math.ceil(pagination.count / PAGE_SIZE));

  const loadPharmacies = useCallback(async (targetPage) => {
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
      setSuccess(response.message || "Pharmacie validée avec succès.");
      setConfirmOpen(false);
      setSelectedPharmacy(null);
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
      setSuccess(response.message || "Pharmacie refusée avec succès.");
      setRejectOpen(false);
      setSelectedPharmacy(null);
      await refreshCurrentPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Validation des pharmacies">
      <div className="space-y-6">
        <section className="rounded-[1.5rem] bg-gradient-to-br from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] p-4 text-white shadow-[0_18px_46px_rgba(47,110,158,0.2)] sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Administration
              </Badge>
              <h1 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
                Validation des pharmacies
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-white/85">
                Vérifiez les pharmacies créées par les pharmaciens avant leur
                publication dans la liste publique.
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Card hover={false}>
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <FontAwesomeIcon icon={faClock} />
              </span>
              <div>
                <p className="text-sm font-medium text-pharmaTextLight">En attente</p>
                <p className="mt-1 text-2xl font-semibold text-pharmaText">
                  {pagination.count}
                </p>
              </div>
            </div>
          </Card>

          <Card hover={false}>
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#35C3A3]/15 text-[#13795f]">
                <FontAwesomeIcon icon={faBuildingCircleCheck} />
              </span>
              <div>
                <p className="text-sm font-medium text-pharmaTextLight">Impact</p>
                <p className="mt-1 text-sm font-normal leading-6 text-pharmaText">
                  Une pharmacie validée devient visible publiquement.
                </p>
              </div>
            </div>
          </Card>
        </div>

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
                <FontAwesomeIcon icon={faBuildingCircleCheck} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-pharmaText">
                Aucune pharmacie en attente de validation
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-6 text-pharmaTextLight">
                Toutes les demandes ont été traitées. Les nouvelles pharmacies
                apparaîtront automatiquement ici.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <PharmacyValidationTable
              pharmacies={pharmacies}
              onView={openDetail}
              onValidate={openValidate}
              onReject={openReject}
            />

            <PaginationControls
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

      <PharmacyDetailModal
        open={detailOpen}
        pharmacy={selectedPharmacy}
        onClose={() => setDetailOpen(false)}
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
