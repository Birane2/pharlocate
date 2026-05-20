import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  createHoraire,
  deleteHoraire,
  getHoraireDetail,
  getHoraires,
  updateHoraire,
} from "../../services/horaireService";
import HoraireTable from "../../components/pharmacien/horaires/HoraireTable";
import HoraireForm from "../../components/pharmacien/horaires/HoraireForm";
import ConfirmModal from "../../components/pharmacien/horaires/ConfirmModal";
import Pagination from "../../components/pharmacien/horaires/Pagination";

const defaultPageSize = 3;

const initialForm = {
  jour: "lundi",
  heure_ouverture: "08:00",
  heure_fermeture: "18:00",
  est_ouvert: true,
  est_garde: false,
  date_debut_garde: "",
  date_fin_garde: "",
};

function toDatetimeLocal(value) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function formatApiError(error) {
  if (error.response?.status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 500) {
    return "Une erreur serveur est survenue. Réessayez plus tard.";
  }

  const data = error.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];

    if (Array.isArray(firstValue) && firstValue[0]) {
      return firstValue[0];
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return "Une erreur est survenue. Vérifiez les informations saisies.";
}

function HorairesList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { horaireId } = useParams();
  const [horaires, setHoraires] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    currentPage: 1,
    pageSize: defaultPageSize,
    next: null,
    previous: null,
  });

  const totalPages = Math.max(1, Math.ceil(pagination.count / pagination.pageSize));
  const isCreateMode = location.pathname.endsWith("/nouveau");
  const isEditMode = Boolean(horaireId);
  const isFormOpen = isCreateMode || isEditMode;

  const loadHoraires = async (page = 1) => {
    setLoadingList(true);
    setError("");

    try {
      const data = await getHoraires({
        page,
        page_size: pagination.pageSize,
      });

      setHoraires(data.results || []);
      setPagination((prev) => ({
        ...prev,
        count: data.count || 0,
        currentPage: page,
        next: data.next || null,
        previous: data.previous || null,
      }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoadingList(true);
      setError("");

      try {
        const data = await getHoraires({
          page: 1,
          page_size: defaultPageSize,
        });

        setHoraires(data.results || []);
        setPagination((prev) => ({
          ...prev,
          count: data.count || 0,
          currentPage: 1,
          next: data.next || null,
          previous: data.previous || null,
        }));
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoadingList(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const run = async () => {
      setLoadingForm(true);
      setFormError("");

      try {
        const data = await getHoraireDetail(horaireId);
        setForm({
          jour: data.jour,
          heure_ouverture: data.heure_ouverture.slice(0, 5),
          heure_fermeture: data.heure_fermeture.slice(0, 5),
          est_ouvert: data.est_ouvert,
          est_garde: data.est_garde,
          date_debut_garde: toDatetimeLocal(data.date_debut_garde),
          date_fin_garde: toDatetimeLocal(data.date_fin_garde),
        });
      } catch (err) {
        setFormError(formatApiError(err));
      } finally {
        setLoadingForm(false);
      }
    };

    run();
  }, [horaireId, isEditMode]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const closeForm = () => {
    setForm(initialForm);
    setFormError("");
    navigate("/pharmacien/horaires");
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setFormError("");
    navigate("/pharmacien/horaires/nouveau");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const payload = {
        jour: form.jour,
        heure_ouverture: form.heure_ouverture,
        heure_fermeture: form.heure_fermeture,
        est_ouvert: form.est_ouvert,
        est_garde: form.est_garde,
        date_debut_garde: form.date_debut_garde || null,
        date_fin_garde: form.date_fin_garde || null,
      };

      if (isEditMode) {
        await updateHoraire(horaireId, payload);
        setSuccessMessage("Horaire modifié avec succès.");
      } else {
        await createHoraire(payload);
        setSuccessMessage("Horaire ajouté avec succès.");
      }

      closeForm();
      await loadHoraires(1);
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDeleteRequest = (horaire) => {
    setDeleteTarget(horaire);
    setSuccessMessage("");
    setError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    setLoadingDelete(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteHoraire(deleteTarget.id_horaire);

      const nextPage =
        horaires.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;

      setDeleteTarget(null);
      setSuccessMessage("Horaire supprimé avec succès.");
      await loadHoraires(nextPage);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <DashboardLayout title="Liste des horaires" links={pharmacistLinks}>
      <div className="space-y-6">
        <Card className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pharmaTurquoise">
              Horaires
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-pharmaBlue">
              Gestion des horaires
            </h1>
            <p className="mt-2 text-sm font-normal leading-6 text-pharmaTextLight">
              Visualisez, ajoutez, modifiez et supprimez les horaires de votre
              pharmacie.
            </p>
          </div>

          <Button onClick={openCreateForm}>
            Ajouter un horaire
          </Button>
        </Card>

        {error && (
          <div className="rounded-2xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-pharmaTurquoise/30 bg-pharmaTurquoise/10 px-4 py-3 text-sm text-pharmaTurquoise">
            {successMessage}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <HoraireTable
            horaires={horaires}
            loading={loadingList}
            onEdit={(horaire) =>
              navigate(`/pharmacien/horaires/${horaire.id_horaire}/modifier`)
            }
            onDelete={handleDeleteRequest}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            pageSize={pagination.pageSize}
            loading={loadingList}
            hasPrevious={Boolean(pagination.previous)}
            hasNext={Boolean(pagination.next)}
            onPrevious={() => loadHoraires(pagination.currentPage - 1)}
            onNext={() => loadHoraires(pagination.currentPage + 1)}
          />
        </Card>
      </div>

      <HoraireForm
        open={isFormOpen}
        mode={isEditMode ? "edit" : "create"}
        form={form}
        error={formError}
        loading={loadingForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer cet horaire"
        message={
          deleteTarget
            ? `Confirmez-vous la suppression de l'horaire du ${deleteTarget.jour} ?`
            : ""
        }
        loading={loadingDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}

export default HorairesList;
