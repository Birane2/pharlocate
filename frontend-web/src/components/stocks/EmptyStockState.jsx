import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCapsules, faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";
import Card from "../ui/Card";

function EmptyStockState({
  title = "Aucun stock a afficher",
  description = "Ajoutez un premier medicament ou assouplissez les filtres pour faire reapparaitre les stocks.",
  actionLabel = "Ajouter un stock",
  onAction,
}) {
  return (
    <Card
      hover={false}
      className="border-dashed border-[#2F6E9E]/20 bg-[linear-gradient(180deg,_rgba(249,252,253,1),_rgba(255,255,255,0.98))]"
    >
      <div className="py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#2FA6A3]/10 text-[#2FA6A3] shadow-[0_16px_32px_rgba(47,166,163,0.14)]">
          <FontAwesomeIcon icon={faCapsules} className="text-2xl" />
        </div>
        <h3 className="mt-5 text-xl font-black tracking-tight text-[#16324A]">
          {title}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-pharmaTextLight">
          {description}
        </p>

        {onAction && (
          <div className="mt-6">
            <Button type="button" variant="secondary" icon={faPlus} onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default EmptyStockState;
