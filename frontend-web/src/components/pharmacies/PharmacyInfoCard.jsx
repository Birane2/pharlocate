import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMapLocationDot,
  faPhone,
  faPrescriptionBottleMedical,
  faRoute,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function PharmacyInfoCard({
  pharmacy,
  photoUrl,
  onOpenDirections,
  onReserve,
  medicamentsCount = 0,
}) {
  return (
    <Card
      hover={false}
      className="overflow-hidden border-[#2F6E9E]/10 bg-white/95"
      bodyClassName="p-0"
    >
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[260px] bg-[linear-gradient(145deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))]">
          {photoUrl ? (
            <img src={photoUrl} alt={pharmacy.nom} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(145deg,_rgba(47,110,158,0.98),_rgba(47,166,163,0.92))] p-8 text-white">
              <div className="max-w-xs text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-3xl shadow-[0_18px_36px_rgba(0,0,0,0.16)]">
                  <FontAwesomeIcon icon={faPrescriptionBottleMedical} />
                </div>
                <p className="mt-5 text-sm leading-7 text-white/85">
                  Aucune photo disponible pour le moment.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" showIcon>
              Validee
            </Badge>
            <Badge variant={pharmacy.is_open ? "active" : "warning"} showIcon>
              {pharmacy.is_open ? "Ouverte" : "Fermee"}
            </Badge>
            {pharmacy.est_garde && (
              <Badge variant="info" showIcon>
                Pharmacie de garde
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#16324A] sm:text-4xl">
              {pharmacy.nom}
            </h1>
            <p className="mt-4 flex items-start gap-3 text-sm leading-7 text-pharmaTextLight">
              <FontAwesomeIcon icon={faLocationDot} className="mt-1 text-[#2F6E9E]" />
              <span>{pharmacy.adresse}</span>
            </p>
            <p className="mt-3 flex items-center gap-3 text-sm text-pharmaTextLight">
              <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
              <span>{pharmacy.telephone}</span>
            </p>
            <p className="mt-3 flex items-center gap-3 text-sm text-pharmaTextLight">
              <FontAwesomeIcon icon={faMapLocationDot} className="text-[#1681FF]" />
              <span>
                {pharmacy.latitude}, {pharmacy.longitude}
              </span>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6E9E]">
                Note moyenne
              </p>
              <p className="mt-2 text-2xl font-black text-[#16324A]">
                {pharmacy.note_moyenne || 0}/5
              </p>
            </div>
            <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6E9E]">
                Avis
              </p>
              <p className="mt-2 text-2xl font-black text-[#16324A]">
                {pharmacy.total_avis || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F6E9E]">
                Medicaments
              </p>
              <p className="mt-2 text-2xl font-black text-[#16324A]">
                {medicamentsCount}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              icon={faRoute}
              className="sm:min-w-[220px]"
              onClick={onOpenDirections}
            >
              Itineraire
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              icon={faPrescriptionBottleMedical}
              className="sm:min-w-[220px]"
              onClick={onReserve}
            >
              Reserver
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PharmacyInfoCard;
