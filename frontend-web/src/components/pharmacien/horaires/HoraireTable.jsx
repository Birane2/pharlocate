import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "./StatusBadge";

function ActionButton({ label, tone = "blue", icon, onClick }) {
  const toneClass =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50 focus:ring-red-100"
      : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8 focus:ring-[#2F6E9E]/15";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-4 ${toneClass}`}
    >
      <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
    </button>
  );
}

function EmptyState({ loading }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
      {loading ? "Chargement des horaires..." : "Aucun horaire n'existe pour le moment."}
    </div>
  );
}

function HoraireTable({
  horaires,
  loading = false,
  onEdit,
  onDelete,
}) {
  if (loading || horaires.length === 0) {
    return <EmptyState loading={loading} />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
              <th className="px-4 py-3">Jour</th>
              <th className="px-4 py-3">Ouverture</th>
              <th className="px-4 py-3">Fermeture</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Garde</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {horaires.map((horaire) => (
              <tr
                key={horaire.id_horaire}
                className="border-t border-[#E2E8F2] text-sm text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
              >
                <td className="px-4 py-2.5 font-bold capitalize text-[#2F6E9E]">
                  {horaire.jour}
                </td>
                <td className="px-4 py-2.5 font-semibold">
                  {horaire.heure_ouverture?.slice(0, 5)}
                </td>
                <td className="px-4 py-2.5 font-semibold">
                  {horaire.heure_fermeture?.slice(0, 5)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge type="open" value={horaire.est_ouvert} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge type="garde" value={horaire.est_garde} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <ActionButton
                      label="Modifier"
                      icon={faPen}
                      onClick={() => onEdit(horaire)}
                    />
                    <ActionButton
                      label="Supprimer"
                      tone="danger"
                      icon={faTrash}
                      onClick={() => onDelete(horaire)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 p-3 md:hidden">
        {horaires.map((horaire) => (
          <article
            key={horaire.id_horaire}
            className="rounded-xl border border-[#E2E8F2] bg-white px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold capitalize text-[#2F6E9E]">
                  {horaire.jour}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#1C2B4A]">
                  {horaire.heure_ouverture?.slice(0, 5)} - {horaire.heure_fermeture?.slice(0, 5)}
                </p>
              </div>
              <div className="flex gap-1">
                <ActionButton
                  label="Modifier"
                  icon={faPen}
                  onClick={() => onEdit(horaire)}
                />
                <ActionButton
                  label="Supprimer"
                  tone="danger"
                  icon={faTrash}
                  onClick={() => onDelete(horaire)}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge type="open" value={horaire.est_ouvert} />
              <span className="text-xs font-semibold text-[#6B7280]">Garde :</span>
              <StatusBadge type="garde" value={horaire.est_garde} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default HoraireTable;
