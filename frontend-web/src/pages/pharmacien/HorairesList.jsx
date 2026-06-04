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
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 500) {
    return "Une erreur serveur est survenue. Reessayez plus tard.";
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

  return "Une erreur est survenue. Verifiez les informations saisies.";
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
  const openedDays = horaires.filter((horaire) => horaire.est_ouvert).length;
  const guardDays = horaires.filter((horaire) => horaire.est_garde).length;

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
        setSuccessMessage("Horaire modifie avec succes.");
      } else {
        await createHoraire(payload);
        setSuccessMessage("Horaire ajoute avec succes.");
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
      setSuccessMessage("Horaire supprime avec succes.");
      await loadHoraires(nextPage);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <DashboardLayout
      title="Horaires"
      links={pharmacistLinks}
      headerSubtitle="Gerez les horaires d'ouverture et les periodes de garde de votre pharmacie."
    >
      <div className="mx-auto max-w-6xl space-y-3">
        <Card
          hover={false}
          className="p-0"
          bodyClassName="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#1C2B4A]">
              Gestion des horaires
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Configurez les horaires et gardes.
            </p>
          </div>

          <Button onClick={openCreateForm} className="w-full md:w-auto">
            + Ajouter un horaire
          </Button>
        </Card>

        <section className="grid gap-2 sm:grid-cols-3">
          {[
            { label: "Horaires", value: pagination.count },
            { label: "Jours ouverts", value: openedDays },
            { label: "Jour de garde", value: guardDays },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-2xl font-black text-[#1C2B4A]">{item.value}</p>
              <p className="mt-0.5 text-xs font-bold text-[#6B7280]">{item.label}</p>
            </article>
          ))}
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-[#2FA6A3]/30 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-semibold text-[#2FA6A3]">
            {successMessage}
          </div>
        )}

        <Card hover={false} className="overflow-hidden p-0">
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
