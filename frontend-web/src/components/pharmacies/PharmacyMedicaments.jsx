import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCapsules,
  faCartPlus,
  faCoins,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";
import Card from "../ui/Card";

function PharmacyMedicaments({ stocks = [], onReserve }) {
  return (
    <Card
      title="Medicaments disponibles"
      subtitle="Seuls les medicaments avec une quantite disponible sont affiches."
    >
      {stocks.length === 0 ? (
        <p className="text-sm leading-7 text-pharmaTextLight">
          Aucun medicament disponible pour le moment dans cette pharmacie.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stocks.map((stock) => (
            <div
              key={stock.id_stock}
              className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#16324A]">
                    {stock.medicament_nom}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-pharmaTextLight">
                    {stock.medicament_description || "Aucune description disponible."}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faCapsules} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
                    <FontAwesomeIcon icon={faLayerGroup} />
                    Stock
                  </p>
                  <p className="mt-2 text-base font-black text-[#16324A]">
                    {stock.quantite}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
                    <FontAwesomeIcon icon={faCoins} />
                    Prix
                  </p>
                  <p className="mt-2 text-base font-black text-[#16324A]">
                    {stock.prix} DH
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2F6E9E]">
                    Categorie
                  </p>
                  <p className="mt-2 text-base font-black text-[#16324A]">
                    {stock.medicament_categorie || "General"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  icon={faCartPlus}
                  onClick={() => onReserve(stock)}
                >
                  Reserver ce medicament
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default PharmacyMedicaments;
