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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#2F6E9E]">
              {mode === "edit" ? "Modifier un horaire" : "Ajouter un horaire"}
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Definissez les heures, le statut et la garde.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-black tracking-tight text-[#1C2B4A]">
              Jour
            </label>
            <select
              className="w-full rounded-2xl border border-[#2F6E9E]/15 bg-white px-3.5 py-2.5 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
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

          <div className="grid gap-3 md:grid-cols-2">
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

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2.5 text-sm font-semibold text-[#1C2B4A]">
              <input
                type="checkbox"
                checked={form.est_ouvert}
                onChange={(e) => onChange("est_ouvert", e.target.checked)}
              />
              Pharmacie ouverte
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2.5 text-sm font-semibold text-[#1C2B4A]">
              <input
                type="checkbox"
                checked={form.est_garde}
                onChange={(e) => onChange("est_garde", e.target.checked)}
              />
              Pharmacie de garde
            </label>
          </div>

          {form.est_garde && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Debut de garde"
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : mode === "edit"
                  ? "Mettre a jour"
                  : "Ajouter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HoraireForm;
