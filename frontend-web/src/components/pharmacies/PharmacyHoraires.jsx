import Badge from "../ui/Badge";
import Card from "../ui/Card";

const orderedDays = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

function sortHoraires(horaires) {
  return [...horaires].sort((firstItem, secondItem) => {
    const firstIndex = orderedDays.indexOf(firstItem.jour);
    const secondIndex = orderedDays.indexOf(secondItem.jour);
    return firstIndex - secondIndex;
  });
}

function PharmacyHoraires({ horaires = [] }) {
  const orderedHoraires = sortHoraires(horaires);

  return (
    <Card
      title="Horaires"
      subtitle="Consultez les heures d'ouverture et les periodes de garde."
      className="h-full"
    >
      {orderedHoraires.length === 0 ? (
        <p className="text-sm leading-7 text-pharmaTextLight">
          Aucun horaire n'est encore disponible pour cette pharmacie.
        </p>
      ) : (
        <div className="space-y-3">
          {orderedHoraires.map((horaire) => (
            <div
              key={horaire.id_horaire}
              className="rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-black capitalize tracking-tight text-[#16324A]">
                    {horaire.jour}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-pharmaTextLight">
                    {horaire.est_ouvert
                      ? `${horaire.heure_ouverture} - ${horaire.heure_fermeture}`
                      : "Ferme ce jour"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={horaire.est_ouvert ? "active" : "warning"}>
                    {horaire.est_ouvert ? "Ouvert" : "Ferme"}
                  </Badge>
                  {horaire.est_garde && <Badge variant="info">Garde</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default PharmacyHoraires;
