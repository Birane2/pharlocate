import Badge from "../ui/Badge";
import Button from "../ui/Button";

const statusLabels = {
  en_attente: "En attente",
  validee: "Validée",
  refusee: "Refusée",
  suspendue: "Suspendue",
};

const statusVariants = {
  en_attente: "warning",
  validee: "success",
  refusee: "danger",
  suspendue: "danger",
};

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pharmaTextLight">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6 text-pharmaText">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function AdminPharmacyDetailModal({ open, pharmacy, onClose }) {
  if (!open || !pharmacy) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F2937]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_30px_90px_rgba(31,41,55,0.25)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2FA6A3]">
              Détail pharmacie
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pharmaBlue">
              {pharmacy.nom}
            </h2>
          </div>
          <Badge variant={statusVariants[pharmacy.statut_validation] || "info"} showIcon>
            {statusLabels[pharmacy.statut_validation] || pharmacy.statut_validation}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Adresse" value={pharmacy.adresse} />
          <DetailRow label="Téléphone" value={pharmacy.telephone} />
          <DetailRow label="Latitude" value={pharmacy.latitude} />
          <DetailRow label="Longitude" value={pharmacy.longitude} />
          <DetailRow label="Pharmacien" value={pharmacy.pharmacien_username} />
          <DetailRow label="Email pharmacien" value={pharmacy.pharmacien_email} />
          <DetailRow label="Horaires" value={pharmacy.horaires_count} />
          <DetailRow label="Stocks" value={pharmacy.stocks_count} />
          <DetailRow label="Réservations" value={pharmacy.reservations_count} />
        </div>

        {pharmacy.motif_refus && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
            <strong>Motif :</strong> {pharmacy.motif_refus}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl bg-pharmaSurface p-4">
            <h3 className="font-semibold text-pharmaText">Horaires</h3>
            <div className="mt-3 space-y-2 text-sm text-pharmaTextLight">
              {(pharmacy.horaires || []).slice(0, 5).map((horaire) => (
                <p key={horaire.id}>
                  {horaire.jour} : {horaire.heure_ouverture} - {horaire.heure_fermeture}
                </p>
              ))}
              {(pharmacy.horaires || []).length === 0 && <p>Aucun horaire.</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-pharmaSurface p-4">
            <h3 className="font-semibold text-pharmaText">Stocks</h3>
            <div className="mt-3 space-y-2 text-sm text-pharmaTextLight">
              {(pharmacy.stocks || []).slice(0, 5).map((stock) => (
                <p key={stock.id}>
                  {stock.medicament_nom} : {stock.quantite} unité(s)
                </p>
              ))}
              {(pharmacy.stocks || []).length === 0 && <p>Aucun stock.</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-pharmaSurface p-4">
            <h3 className="font-semibold text-pharmaText">Réservations</h3>
            <div className="mt-3 space-y-2 text-sm text-pharmaTextLight">
              {(pharmacy.reservations || []).slice(0, 5).map((reservation) => (
                <p key={reservation.id}>
                  #{reservation.id} - {reservation.user_username} ({reservation.statut})
                </p>
              ))}
              {(pharmacy.reservations || []).length === 0 && <p>Aucune réservation.</p>}
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminPharmacyDetailModal;
