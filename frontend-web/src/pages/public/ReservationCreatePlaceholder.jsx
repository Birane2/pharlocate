import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";

function ReservationCreatePlaceholder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const summary = useMemo(
    () => ({
      pharmacyId: searchParams.get("pharmacy"),
      stockId: searchParams.get("stock"),
    }),
    [searchParams]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f5fbff_0%,_#ffffff_55%,_#f7fcfb_100%)]">
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Logo className="h-14 sm:h-16" to="/" />
          <Button
            type="button"
            variant="outline"
            icon={faArrowLeft}
            onClick={() =>
              navigate(summary.pharmacyId ? `/pharmacies/${summary.pharmacyId}` : "/pharmacies")
            }
          >
            Retour
          </Button>
        </div>

        <div className="mt-8">
          <Card hover={false} className="border-[#2F6E9E]/10 bg-white/95">
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#2F6E9E]/10 text-[#2F6E9E]">
                <FontAwesomeIcon icon={faReceipt} className="text-2xl" />
              </div>
              <h1 className="mt-5 text-2xl font-black tracking-tight text-[#16324A]">
                Reservation pre-remplie
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-pharmaTextLight">
                Cette page de transition confirme que le bouton "Reserver" transmet bien
                le contexte de la pharmacie et du medicament. La prochaine etape logique
                sera de brancher ici le formulaire complet de reservation vers
                `POST /api/reservations/`.
              </p>

              <div className="mt-6 grid w-full max-w-xl gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                    Pharmacie
                  </p>
                  <p className="mt-2 text-lg font-black text-[#16324A]">
                    {summary.pharmacyId || "Non renseignee"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6E9E]">
                    Stock
                  </p>
                  <p className="mt-2 text-lg font-black text-[#16324A]">
                    {summary.stockId || "Non renseigne"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ReservationCreatePlaceholder;
