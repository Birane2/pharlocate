import Button from "../../ui/Button";
import StatusBadge from "./StatusBadge";

function HoraireTable({
  horaires,
  loading = false,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-pharmaSurface">
          <tr className="text-left text-sm text-pharmaTextLight">
            <th className="px-5 py-4 font-semibold">Jour</th>
            <th className="px-5 py-4 font-semibold">Ouverture</th>
            <th className="px-5 py-4 font-semibold">Fermeture</th>
            <th className="px-5 py-4 font-semibold">Statut</th>
            <th className="px-5 py-4 font-semibold">Garde</th>
            <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="px-5 py-10 text-center text-sm text-pharmaTextLight">
                Chargement des horaires...
              </td>
            </tr>
          ) : horaires.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-5 py-10 text-center text-sm text-pharmaTextLight">
                Aucun horaire n'existe pour le moment.
              </td>
            </tr>
          ) : (
            horaires.map((horaire) => (
              <tr
                key={horaire.id_horaire}
                className="border-t border-pharmaBorder/70 text-sm text-pharmaText"
              >
                <td className="px-5 py-4 capitalize font-semibold text-pharmaBlue">
                  {horaire.jour}
                </td>
                <td className="px-5 py-4">
                  {horaire.heure_ouverture?.slice(0, 5)}
                </td>
                <td className="px-5 py-4">
                  {horaire.heure_fermeture?.slice(0, 5)}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="open" value={horaire.est_ouvert} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="garde" value={horaire.est_garde} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="px-4 py-2"
                      onClick={() => onEdit(horaire)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="danger"
                      className="px-4 py-2"
                      onClick={() => onDelete(horaire)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default HoraireTable;
