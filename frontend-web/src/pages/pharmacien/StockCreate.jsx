import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { faArrowLeft, faCapsules } from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PharmacyRequiredCard from "../../components/pharmacie/PharmacyRequiredCard";
import StockForm from "../../components/stocks/StockForm";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { createMedicament, getMedicaments } from "../../services/medicamentService";
import { getMyPharmacyStatus } from "../../services/pharmacyService";
import { createStock } from "../../services/stockService";

const initialForm = {
  medicament_id: "",
  nom: "",
  description: "",
  categorie: "",
  photo: null,
  quantite: "",
  prix: "",
  seuil_alerte: "5",
};

function getApiErrorMessage(error) {
  const data = error.response?.data;
  const extractMessage = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return extractMessage(value[0]);
    }

    if (typeof value === "object") {
      if (typeof value.message === "string") {
        return value.message;
      }

      if (typeof value.detail === "string") {
        return value.detail;
      }

      return extractMessage(Object.values(value)[0]);
    }

    return "";
  };

  if (error.response?.status === 400) {
    return extractMessage(data) || "Veuillez verifier les champs du formulaire.";
  }

  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces refuse. Cette action est reservee aux pharmaciens.";
  }

  if (error.response?.status === 404) {
    return (
      extractMessage(data) ||
      "Vous devez d abord creer votre pharmacie avant d ajouter un medicament au stock."
    );
  }

  return extractMessage(data) || error.message || "Impossible d'ajouter ce medicament au stock.";
}

function StockCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("existing");
  const [form, setForm] = useState(initialForm);
  const [medicaments, setMedicaments] = useState([]);
  const [hasPharmacy, setHasPharmacy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const pharmacyStatus = await getMyPharmacyStatus();

        if (!isMounted) {
          return;
        }

        if (pharmacyStatus?.has_pharmacy === false) {
          setHasPharmacy(false);
          setMedicaments([]);
          return;
        }

        setHasPharmacy(true);
        setMedicaments(await getMedicaments());
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const nextValue =
      event.target.name === "photo"
        ? event.target.files?.[0] || event.target.value || null
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      [event.target.name]: nextValue,
    }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      medicament_id: "",
      nom: "",
      description: "",
      categorie: "",
      photo: null,
    }));
  };

  const validateForm = () => {
    if (mode === "existing" && !form.medicament_id) {
      return "Selectionnez un medicament existant.";
    }

    if (mode === "new" && !form.nom.trim()) {
      return "Renseignez le nom du nouveau medicament.";
    }

    if (Number(form.quantite) < 0) {
      return "La quantite ne peut pas etre negative.";
    }

    if (Number(form.prix) < 0) {
      return "Le prix ne peut pas etre negatif.";
    }

    if (Number(form.seuil_alerte) < 0) {
      return "Le seuil d'alerte ne peut pas etre negatif.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        quantite: Number(form.quantite),
        prix: form.prix,
        seuil_alerte: Number(form.seuil_alerte),
      };

      if (mode === "existing") {
        payload.medicament = Number(form.medicament_id);
      } else {
        const createdMedicamentResponse = await createMedicament({
          nom: form.nom.trim(),
          description: form.description.trim(),
          categorie: form.categorie.trim(),
          photo: form.photo,
        });

        const createdMedicament =
          createdMedicamentResponse?.data || createdMedicamentResponse;

        payload.medicament = createdMedicament.id;
      }

      const response = await createStock(payload);
      setSuccess(response.message || "Medicament ajoute au stock avec succes.");
      setForm(initialForm);

      window.setTimeout(() => {
        navigate("/pharmacien/stocks");
      }, 900);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Ajouter au stock" links={pharmacistLinks}>
      <div className="space-y-6">
        <section className="rounded-[1.5rem] bg-gradient-to-br from-[#2F6E9E] via-[#4A8BBE] to-[#2FA6A3] p-5 text-white shadow-[0_22px_60px_rgba(47,110,158,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="info" className="bg-white/15 text-white ring-white/20">
                Stock pharmacie
              </Badge>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal md:text-3xl">
                Ajouter un medicament au stock
              </h1>
             
            </div>

            <Button
              variant="outline"
              icon={faArrowLeft}
              className="border-white bg-white/10 text-white hover:bg-white hover:text-[#2F6E9E]"
              onClick={() => navigate("/pharmacien/stocks")}
            >
              Retour aux stocks
            </Button>
          </div>
        </section>

        {!loading && !hasPharmacy ? (
          <PharmacyRequiredCard
            title="Creation pharmacie requise"
            message="Vous devez d'abord creer votre pharmacie avant d'ajouter un medicament au stock."
          />
        ) : (
          <Card
            title="Informations du stock"
            subtitle="Les donnees seront automatiquement rattachees a votre pharmacie."
            hover={false}
            action={<Badge variant="blue" icon={faCapsules} showIcon>Catalogue medicaments</Badge>}
          >
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm font-semibold text-[#2F6E9E]">
                Chargement des medicaments...
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-2xl border border-[#5EC6B8]/30 bg-[#5EC6B8]/10 px-4 py-3 text-sm font-medium text-[#13795f]">
                    {success}
                  </div>
                )}

                <StockForm
                  form={form}
                  medicaments={medicaments}
                  mode={mode}
                  loadingMedicaments={loading}
                  submitting={submitting}
                  onModeChange={handleModeChange}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StockCreate;
