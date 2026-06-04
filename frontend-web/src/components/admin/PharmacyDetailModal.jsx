import {
  faCheck,
  faClock,
  faHospital,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../ui/Button";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-[#1C2B4A]">
        {value || "Non renseigne"}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("fr-FR");
}

function PharmacyDetailModal({
  pharmacy,
  open,
  loading = false,
  onClose,
  onValidate,
  onReject,
}) {
  if (!open || !pharmacy) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F2937]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_30px_90px_rgba(31,41,55,0.25)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2FA6A3]">
              Detail pharmacie
            </p>
            <h2 className="mt-1 truncate text-xl font-black text-[#1C2B4A]">
              {pharmacy.nom}
            </h2>
          </div>
          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F59E0B]/12 px-3 py-1 text-xs font-bold text-[#B45309]">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
            En attente
          </span>
        </div>

        {pharmacy.photo ? (
          <img
            src={pharmacy.photo}
            alt={pharmacy.nom}
            className="mt-4 h-36 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="mt-4 flex h-28 items-center justify-center rounded-xl bg-[#2F6E9E]/8 text-[#2F6E9E]">
            <FontAwesomeIcon icon={faHospital} className="h-8 w-8" />
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <DetailRow label="Adresse" value={pharmacy.adresse} />
          <DetailRow label="Telephone" value={pharmacy.telephone} />
          <DetailRow label="Latitude" value={pharmacy.latitude} />
          <DetailRow label="Longitude" value={pharmacy.longitude} />
          <DetailRow label="Pharmacien" value={pharmacy.pharmacien_username} />
          <DetailRow label="Email pharmacien" value={pharmacy.pharmacien_email} />
          <DetailRow label="Date creation" value={formatDate(pharmacy.date_creation)} />
          <DetailRow label="Statut" value={pharmacy.statut_validation || "en_attente"} />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fermer
          </Button>
          <Button
            variant="danger"
            icon={faXmark}
            onClick={() => onReject(pharmacy)}
            disabled={loading}
          >
            Refuser
          </Button>
          <Button
            variant="secondary"
            icon={faCheck}
            onClick={() => onValidate(pharmacy)}
            loading={loading}
          >
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PharmacyDetailModal;
