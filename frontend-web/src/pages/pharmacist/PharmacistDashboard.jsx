import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { pharmacistLinks } from "../../routes/dashboardLinks";

function PharmacistDashboard() {
  return (
    <DashboardLayout title="Tableau de bord pharmacien" links={pharmacistLinks}>
      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-sm text-pharmaText">Stocks actifs</p>
          <h2 className="mt-2 text-3xl font-bold text-pharmaBlue">0</h2>
          <Badge variant="active">Disponible</Badge>
        </Card>

        <Card>
          <p className="text-sm text-pharmaText">Réservations</p>
          <h2 className="mt-2 text-3xl font-bold text-pharmaTurquoise">0</h2>
          <Badge variant="warning">En attente</Badge>
        </Card>

        <Card>
          <p className="text-sm text-pharmaText">Statut pharmacie</p>
          <h2 className="mt-2 text-2xl font-bold text-pharmaBlue">Active</h2>
          <Badge>Ouvert</Badge>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PharmacistDashboard;