import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import { createPharmacy, getPharmacies } from "../../services/pharmacyService";

function PharmacyProfile() {
  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    latitude: "",
    longitude: "",
    telephone: "",
  });

  const loadData = async () => {
    const data = await getPharmacies();
    setPharmacy(data[0] || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createPharmacy(form);
    await loadData();
  };

  return (
    <DashboardLayout title="Profil pharmacie" links={pharmacistLinks}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-pharmaBlue">
            Ma pharmacie
          </h2>

          {pharmacy ? (
            <div className="mt-5 space-y-3">
              <p><strong>Nom :</strong> {pharmacy.nom}</p>
              <p><strong>Adresse :</strong> {pharmacy.adresse}</p>
              <p><strong>Téléphone :</strong> {pharmacy.telephone}</p>
              <Badge variant={pharmacy.est_valide ? "active" : "warning"}>
                {pharmacy.est_valide ? "Validée" : "En attente"}
              </Badge>
            </div>
          ) : (
            <p className="mt-4 text-sm text-pharmaText">
              Aucune pharmacie créée.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-pharmaBlue">
            Créer ma pharmacie
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input label="Nom" name="nom" onChange={handleChange} />
            <Input label="Adresse" name="adresse" onChange={handleChange} />
            <Input label="Latitude" name="latitude" onChange={handleChange} />
            <Input label="Longitude" name="longitude" onChange={handleChange} />
            <Input label="Téléphone" name="telephone" onChange={handleChange} />

            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PharmacyProfile;