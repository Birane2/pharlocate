import { faClinicMedical } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Card from "../ui/Card";

function PharmacyRequiredCard({
  title = "Vous n'avez pas encore cree votre pharmacie.",
  message = "Ce pharmacien ne possede pas encore de pharmacie associee. Veuillez creer votre pharmacie pour acceder a toutes les fonctionnalites.",
  buttonLabel = "Creer ma pharmacie",
}) {
  const navigate = useNavigate();

  return (
    <Card className="mx-auto max-w-2xl" hover={false}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2FA6A3]/12 text-[#2FA6A3]">
          <FontAwesomeIcon icon={faClinicMedical} className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-normal text-[#2F6E9E]">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-pharmaTextLight">
          {message}
        </p>

        <Button
          className="mt-6"
          icon={faClinicMedical}
          onClick={() => navigate("/pharmacien/pharmacie")}
        >
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

export default PharmacyRequiredCard;
