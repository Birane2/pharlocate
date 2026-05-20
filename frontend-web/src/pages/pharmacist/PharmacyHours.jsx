import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { getPharmacies } from "../../services/pharmacyService";
import {
  createHoraire,
  deleteHoraire,
  getHoraires,
  updateHoraire,
} from "../../services/horaireService";
import { useAuth } from "../../context/AuthContext";

const jours = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const initialForm = {
  pharmacie: "",
  jour: "lundi",
  heure_ouverture: "08:00",
  heure_fermeture: "18:00",
  est_ouvert: true,
  est_garde: false,
  date_debut_garde: "",
  date_fin_garde: "",
};

const initialFilters = {
  pharmacie: "",
  jour: "",
  est_garde: "",
};

const defaultPageSize = 5;

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
    return "Le serveur a rencontré une erreur. Réessayez dans un instant.";
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

function PharmacyHours() {
  const { user } = useAuth();
  const [horaires, setHoraires] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    currentPage: 1,
    pageSize: defaultPageSize,
  });
  const [loadingTable, setLoadingTable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadHoraires = async (page = 1, nextFilters = filters) => {
    setLoadingTable(true);
    setError("");

    try {
      const params = {
        page,
        page_size: pagination.pageSize,
      };

      if (nextFilters.pharmacie) {
        params.pharmacie = nextFilters.pharmacie;
      }

      if (nextFilters.jour) {
        params.jour = nextFilters.jour;
      }

      if (nextFilters.est_garde !== "") {
        params.est_garde = nextFilters.est_garde;
      }

      const data = await getHoraires(params);

      setHoraires(data.results || []);
      setPagination((prev) => ({
        ...prev,
        count: data.count || 0,
        currentPage: page,
      }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const pharmacyList = await getPharmacies();
        setPharmacies(pharmacyList);

        const currentPharmacy =
          pharmacyList.find((pharmacy) => pharmacy.username === user?.username) ||
          pharmacyList[0];

        const nextPharmacyId = String(currentPharmacy?.id || "");
        const nextFilters = {
          ...initialFilters,
          pharmacie: nextPharmacyId,
        };

        setForm((prev) => ({
          ...prev,
          pharmacie: prev.pharmacie || nextPharmacyId,
        }));

        setFilters(nextFilters);

        const data = await getHoraires({
          page: 1,
          page_size: defaultPageSize,
          pharmacie: nextPharmacyId,
        });

        setHoraires(data.results || []);
        setPagination((prev) => ({
          ...prev,
          count: data.count || 0,
          currentPage: 1,
        }));
      } catch (err) {
        setError(formatApiError(err));
      }
    };

    run();
  }, [user?.username]);

  const resetForm = (keepSuccessMessage = false) => {
    setEditingId(null);
    if (!keepSuccessMessage) {
      setSuccessMessage("");
    }
    setError("");
    setForm((prev) => ({
      ...initialForm,
      pharmacie: prev.pharmacie,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        pharmacie: Number(form.pharmacie),
        jour: form.jour,
        heure_ouverture: form.heure_ouverture,
        heure_fermeture: form.heure_fermeture,
        est_ouvert: form.est_ouvert,
        est_garde: form.est_garde,
        date_debut_garde: form.date_debut_garde || null,
        date_fin_garde: form.date_fin_garde || null,
      };

      if (editingId) {
        await updateHoraire(editingId, payload);
        resetForm(true);
        setSuccessMessage("Horaire modifié avec succès.");
      } else {
        await createHoraire(payload);
        resetForm(true);
        setSuccessMessage("Horaire ajouté avec succès.");
      }
      await loadHoraires(1, filters);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (horaire) => {
    setEditingId(horaire.id_horaire);
    setSuccessMessage("");
    setError("");
    setForm({
      pharmacie: String(horaire.pharmacie),
      jour: horaire.jour,
      heure_ouverture: horaire.heure_ouverture.slice(0, 5),
      heure_fermeture: horaire.heure_fermeture.slice(0, 5),
      est_ouvert: horaire.est_ouvert,
      est_garde: horaire.est_garde,
      date_debut_garde: toDatetimeLocal(horaire.date_debut_garde),
      date_fin_garde: toDatetimeLocal(horaire.date_fin_garde),
    });
  };

  const handleDelete = async (horaire) => {
    const confirmed = window.confirm(
      `Supprimer l'horaire du ${horaire.jour} pour ${horaire.pharmacie_nom} ?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      await deleteHoraire(horaire.id_horaire);

      if (editingId === horaire.id_horaire) {
        resetForm();
      }

      setSuccessMessage("Horaire supprimé avec succès.");
      await loadHoraires(pagination.currentPage, filters);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.count / pagination.pageSize));

  return (
    <DashboardLayout title="Gestion des horaires" links={pharmacistLinks}>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-pharmaBlue">
                {editingId ? "Modifier un horaire" : "Ajouter un horaire"}
              </h2>
              <p className="mt-2 text-sm text-pharmaTextLight">
                Gérez les ouvertures hebdomadaires et les périodes de garde.
              </p>
            </div>

            {editingId && (
              <Button variant="outline" className="px-4 py-2" onClick={resetForm}>
                Annuler
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-pharmaText">
                Pharmacie
              </label>
              <select
                className="w-full rounded-xl border border-pharmaBorder bg-white p-3 text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
                value={form.pharmacie}
                onChange={(e) => setForm({ ...form, pharmacie: e.target.value })}
                required
              >
                <option value="">Choisir une pharmacie</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-pharmaText">
                Jour
              </label>
              <select
                className="w-full rounded-xl border border-pharmaBorder bg-white p-3 text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
                value={form.jour}
                onChange={(e) => setForm({ ...form, jour: e.target.value })}
              >
                {jours.map((jour) => (
                  <option key={jour} value={jour}>
                    {jour}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Heure d'ouverture"
                type="time"
                value={form.heure_ouverture}
                onChange={(e) => setForm({ ...form, heure_ouverture: e.target.value })}
                required
              />

              <Input
                label="Heure de fermeture"
                type="time"
                value={form.heure_fermeture}
                onChange={(e) => setForm({ ...form, heure_fermeture: e.target.value })}
                required
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-pharmaBorder bg-white px-4 py-3 text-sm text-pharmaText">
              <input
                type="checkbox"
                checked={form.est_ouvert}
                onChange={(e) => setForm({ ...form, est_ouvert: e.target.checked })}
              />
              Pharmacie ouverte ce jour
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-pharmaBorder bg-white px-4 py-3 text-sm text-pharmaText">
              <input
                type="checkbox"
                checked={form.est_garde}
                onChange={(e) => setForm({ ...form, est_garde: e.target.checked })}
              />
              Pharmacie de garde
            </label>

            {form.est_garde && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Début de garde"
                  type="datetime-local"
                  value={form.date_debut_garde}
                  onChange={(e) =>
                    setForm({ ...form, date_debut_garde: e.target.value })
                  }
                />

                <Input
                  label="Fin de garde"
                  type="datetime-local"
                  value={form.date_fin_garde}
                  onChange={(e) =>
                    setForm({ ...form, date_fin_garde: e.target.value })
                  }
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-pharmaTurquoise/30 bg-pharmaTurquoise/10 px-4 py-3 text-sm text-pharmaTurquoise">
                {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Enregistrement..."
                : editingId
                  ? "Mettre à jour l'horaire"
                  : "Ajouter l'horaire"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-pharmaBlue">Liste des horaires</h2>
              <p className="mt-2 text-sm text-pharmaTextLight">
                Filtrez, modifiez ou supprimez les créneaux existants.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="rounded-xl border border-pharmaBorder bg-white p-3 text-sm text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
                value={filters.pharmacie}
                onChange={(e) => {
                  const nextFilters = { ...filters, pharmacie: e.target.value };
                  setFilters(nextFilters);
                  loadHoraires(1, nextFilters);
                }}
              >
                <option value="">Toutes les pharmacies</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.nom}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-pharmaBorder bg-white p-3 text-sm text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
                value={filters.jour}
                onChange={(e) => {
                  const nextFilters = { ...filters, jour: e.target.value };
                  setFilters(nextFilters);
                  loadHoraires(1, nextFilters);
                }}
              >
                <option value="">Tous les jours</option>
                {jours.map((jour) => (
                  <option key={jour} value={jour}>
                    {jour}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-pharmaBorder bg-white p-3 text-sm text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
                value={filters.est_garde}
                onChange={(e) => {
                  const nextFilters = { ...filters, est_garde: e.target.value };
                  setFilters(nextFilters);
                  loadHoraires(1, nextFilters);
                }}
              >
                <option value="">Tous statuts</option>
                <option value="true">De garde</option>
                <option value="false">Hors garde</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-pharmaTextLight">
                  <th className="px-3">Pharmacie</th>
                  <th className="px-3">Jour</th>
                  <th className="px-3">Heures</th>
                  <th className="px-3">Statut</th>
                  <th className="px-3">Garde</th>
                  <th className="px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan="6" className="px-3 py-6 text-center text-sm text-pharmaTextLight">
                      Chargement des horaires...
                    </td>
                  </tr>
                ) : horaires.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 py-6 text-center text-sm text-pharmaTextLight">
                      Aucun horaire trouvé pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  horaires.map((horaire) => (
                    <tr key={horaire.id_horaire} className="rounded-xl bg-white shadow-soft">
                      <td className="rounded-l-xl px-3 py-4 text-sm text-pharmaText">
                        {horaire.pharmacie_nom}
                      </td>
                      <td className="px-3 py-4 text-sm capitalize text-pharmaText">
                        {horaire.jour}
                      </td>
                      <td className="px-3 py-4 text-sm text-pharmaText">
                        {horaire.heure_ouverture.slice(0, 5)} - {horaire.heure_fermeture.slice(0, 5)}
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant={horaire.est_ouvert ? "active" : "danger"}>
                          {horaire.est_ouvert ? "Ouvert" : "Fermé"}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        {horaire.est_garde ? (
                          <div className="space-y-2">
                            <Badge variant="warning">Pharmacie de garde</Badge>
                            {horaire.date_debut_garde && horaire.date_fin_garde && (
                              <p className="text-xs text-pharmaTextLight">
                                {toDatetimeLocal(horaire.date_debut_garde).replace("T", " ")}
                                {" → "}
                                {toDatetimeLocal(horaire.date_fin_garde).replace("T", " ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-pharmaTextLight">Standard</span>
                        )}
                      </td>
                      <td className="rounded-r-xl px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="px-4 py-2"
                            onClick={() => handleEdit(horaire)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="danger"
                            className="px-4 py-2"
                            onClick={() => handleDelete(horaire)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-pharmaBorder pt-4">
            <p className="text-sm text-pharmaTextLight">
              Page {pagination.currentPage} sur {totalPages} - {pagination.count} horaire(s)
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="px-4 py-2"
                disabled={pagination.currentPage <= 1}
                onClick={() => loadHoraires(pagination.currentPage - 1, filters)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                className="px-4 py-2"
                disabled={pagination.currentPage >= totalPages}
                onClick={() => loadHoraires(pagination.currentPage + 1, filters)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PharmacyHours;
