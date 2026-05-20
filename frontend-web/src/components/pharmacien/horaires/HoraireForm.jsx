import Input from "../../ui/Input";
import Button from "../../ui/Button";

const jours = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

function HoraireForm({
  open,
  mode = "create",
  form,
  error = "",
  loading = false,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-pharmaBlue">
              {mode === "edit" ? "Modifier un horaire" : "Ajouter un horaire"}
            </h3>
            <p className="mt-2 text-sm text-pharmaTextLight">
              Définissez les heures d'ouverture, le statut et la garde.
            </p>
          </div>

          <Button variant="outline" className="px-4 py-2" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-pharmaText">
              Jour
            </label>
            <select
              className="w-full rounded-xl border border-pharmaBorder bg-white p-3 text-pharmaText outline-none transition focus:border-pharmaTurquoise focus:ring-2 focus:ring-pharmaGreenLight/30"
              value={form.jour}
              onChange={(e) => onChange("jour", e.target.value)}
            >
              {jours.map((jour) => (
                <option key={jour} value={jour}>
                  {jour}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Heure d'ouverture"
              type="time"
              value={form.heure_ouverture}
              onChange={(e) => onChange("heure_ouverture", e.target.value)}
              required
            />
            <Input
              label="Heure de fermeture"
              type="time"
              value={form.heure_fermeture}
              onChange={(e) => onChange("heure_fermeture", e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-pharmaBorder bg-pharmaSurface px-4 py-3 text-sm text-pharmaText">
            <input
              type="checkbox"
              checked={form.est_ouvert}
              onChange={(e) => onChange("est_ouvert", e.target.checked)}
            />
            Pharmacie ouverte
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-pharmaBorder bg-pharmaSurface px-4 py-3 text-sm text-pharmaText">
            <input
              type="checkbox"
              checked={form.est_garde}
              onChange={(e) => onChange("est_garde", e.target.checked)}
            />
            Pharmacie de garde
          </label>

          {form.est_garde && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Début de garde"
                type="datetime-local"
                value={form.date_debut_garde}
                onChange={(e) => onChange("date_debut_garde", e.target.value)}
              />
              <Input
                label="Fin de garde"
                type="datetime-local"
                value={form.date_fin_garde}
                onChange={(e) => onChange("date_fin_garde", e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="px-4 py-2" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="px-5 py-2" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : mode === "edit"
                  ? "Mettre à jour"
                  : "Ajouter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HoraireForm;
