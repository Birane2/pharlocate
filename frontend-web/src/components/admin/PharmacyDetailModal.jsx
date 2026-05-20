import Badge from "../ui/Badge";
import Button from "../ui/Button";

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

function PharmacyDetailModal({ pharmacy, open, onClose }) {
  if (!open || !pharmacy) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F2937]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-[0_30px_90px_rgba(31,41,55,0.25)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2FA6A3]">
              Détail pharmacie
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pharmaBlue">
              {pharmacy.nom}
            </h2>
          </div>
          <Badge variant="warning" showIcon>
            En attente
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Adresse" value={pharmacy.adresse} />
          <DetailRow label="Téléphone" value={pharmacy.telephone} />
          <DetailRow label="Latitude" value={pharmacy.latitude} />
          <DetailRow label="Longitude" value={pharmacy.longitude} />
          <DetailRow label="Pharmacien" value={pharmacy.pharmacien_username} />
          <DetailRow label="Email pharmacien" value={pharmacy.pharmacien_email} />
          <DetailRow label="Date création" value={new Date(pharmacy.date_creation).toLocaleString("fr-FR")} />
          <DetailRow label="Statut" value={pharmacy.statut_validation} />
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

export default PharmacyDetailModal;
