import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StockCard from "../../components/stocks/StockCard";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  createStock,
  deleteStock,
  getMedicaments,
  getStocks,
  updateStock,
} from "../../services/stockService";

const initialForm = {
  medicament: "",
  quantite: "",
  prix: "",
};

function extractApiMessage(error, fallback) {
  const data = error.response?.data;

  const extract = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return extract(value[0]);
    }

    if (typeof value === "object") {
      if (typeof value.message === "string") {
        return value.message;
      }

      if (typeof value.error === "string") {
        return value.error;
      }

      if (typeof value.detail === "string") {
        return value.detail;
      }

      return extract(Object.values(value)[0]);
    }

    return "";
  };

  return extract(data) || fallback;
}

function PharmacyStocks() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getLoadErrorMessage = (err) => {
    if (err.response?.status === 401) {
      return "Votre session a expire. Veuillez vous reconnecter.";
    }

    if (err.response?.status === 403) {
      return "Acces refuse pour charger les medicaments ou les stocks.";
    }

    if (err.response?.status === 500) {
      return "Le serveur a rencontre une erreur lors du chargement.";
    }

    return "Impossible de charger les medicaments ou les stocks.";
  };

  const getSubmitErrorMessage = (err) => {
    if (err.response?.status === 401) {
      return "Votre session a expire. Veuillez vous reconnecter.";
    }

    if (err.response?.status === 403) {
      return "Acces refuse pour cette action.";
    }

    if (err.response?.status === 500) {
      return "Erreur serveur lors de l'enregistrement du stock.";
    }

    return extractApiMessage(err, "Impossible d'enregistrer ce stock.");
  };

  const loadData = async () => {
    setLoadingData(true);

    try {
      setMedicaments(await getMedicaments());
      setStocks(await getStocks());
      setError("");
    } catch (err) {
      setMedicaments([]);
      setStocks([]);
      setError(getLoadErrorMessage(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingStockId(null);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        medicament: form.medicament,
        quantite: Number(form.quantite),
        prix: form.prix,
      };

      if (editingStockId) {
        await updateStock(editingStockId, payload);
      } else {
        await createStock(payload);
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getSubmitErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (stock) => {
    setEditingStockId(stock.id_stock || stock.id);
    setForm({
      medicament: String(stock.medicament),
      quantite: String(stock.quantite),
      prix: String(stock.prix),
    });
    setError("");
  };

  const handleDelete = async (stockId) => {
    try {
      await deleteStock(stockId);

      if (editingStockId === stockId) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      const apiError =
        err.response?.status === 401
          ? "Votre session a expire. Veuillez vous reconnecter."
          : err.response?.status === 403
            ? "Acces refuse pour cette suppression."
            : err.response?.status === 500
              ? "Erreur serveur lors de la suppression."
              : err.response?.data?.error || "Impossible de supprimer ce stock.";

      setError(apiError);
    }
  };

  return (
    <DashboardLayout title="Gestion des stocks" links={pharmacistLinks}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-pharmaBlue">
                {editingStockId ? "Modifier le stock" : "Ajouter un stock"}
              </h2>
              <p className="mt-2 text-sm text-pharmaTextLight">
                Renseignez le medicament, la quantite et le prix.
              </p>
            </div>

            {editingStockId ? (
              <Button variant="outline" onClick={resetForm} className="px-4 py-2">
                Annuler
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => navigate("/pharmacien/stocks/ajouter")}
                className="px-4 py-2"
              >
                Ajouter un medicament
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <select
              className="w-full rounded-xl border border-pharmaBorder bg-white p-3 text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
              value={form.medicament}
              onChange={(event) => setForm({ ...form, medicament: event.target.value })}
              required
              disabled={loadingData || medicaments.length === 0}
            >
              <option value="">
                {loadingData
                  ? "Chargement des medicaments..."
                  : medicaments.length === 0
                    ? "Aucun medicament disponible"
                    : "Choisir un medicament"}
              </option>
              {medicaments.map((medicament) => (
                <option key={medicament.id} value={medicament.id}>
                  {medicament.nom}
                </option>
              ))}
            </select>

            {!loadingData && medicaments.length === 0 && (
              <p className="text-sm text-pharmaTextLight">
                Aucun medicament n'existe encore. Ajoutez d'abord des medicaments
                depuis l'admin Django ou via l'API avant de creer un stock.
              </p>
            )}

            <Input
              label="Quantite"
              type="number"
              min="0"
              value={form.quantite}
              onChange={(event) => setForm({ ...form, quantite: event.target.value })}
              required
            />

            <Input
              label="Prix"
              type="number"
              min="0"
              step="0.01"
              value={form.prix}
              onChange={(event) => setForm({ ...form, prix: event.target.value })}
              required
            />

            {error && (
              <div className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || medicaments.length === 0}
            >
              {submitting
                ? "Enregistrement..."
                : editingStockId
                  ? "Mettre a jour le stock"
                  : "Ajouter au stock"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-pharmaBlue">Stocks disponibles</h2>
              <p className="mt-1 text-sm text-pharmaTextLight">
                Les photos des medicaments sont affichees lorsqu'elles sont disponibles.
              </p>
            </div>
            <Badge variant="blue">{stocks.length} stock(s)</Badge>
          </div>

          <div className="mt-5">
            {stocks.length === 0 ? (
              <p className="text-sm text-pharmaTextLight">
                Aucun stock enregistre pour le moment.
              </p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {stocks.map((stock) => (
                  <StockCard
                    key={stock.id_stock || stock.id}
                    stock={stock}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PharmacyStocks;
