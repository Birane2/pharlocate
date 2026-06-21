import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faLock, faRotate } from "@fortawesome/free-solid-svg-icons";

const inputClass =
  "h-11 w-full rounded-xl border border-[#E2E8F2] bg-white px-3 text-sm font-semibold text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10";

function PasswordChangeForm({ loading, onSubmit }) {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form, () =>
      setForm({
        old_password: "",
        new_password: "",
        new_password_confirm: "",
      })
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#1C2B4A]">Sécurité</h2>
        <p className="mt-1 text-xs font-semibold text-[#6B7280]">
          L'ancien mot de passe est obligatoire.
        </p>
      </div>

      <div className="grid gap-3">
        <label>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[#6B7280]">
            <FontAwesomeIcon icon={faKey} className="text-[#2F6E9E]" />
            Ancien mot de passe
          </span>
          <input
            className={inputClass}
            name="old_password"
            type="password"
            value={form.old_password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[#6B7280]">
            <FontAwesomeIcon icon={faLock} className="text-[#2F6E9E]" />
            Nouveau mot de passe
          </span>
          <input
            className={inputClass}
            name="new_password"
            type="password"
            value={form.new_password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[#6B7280]">
            <FontAwesomeIcon icon={faLock} className="text-[#2F6E9E]" />
            Confirmer le nouveau mot de passe
          </span>
          <input
            className={inputClass}
            name="new_password_confirm"
            type="password"
            value={form.new_password_confirm}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2FA6A3] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#248C8A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FontAwesomeIcon icon={faRotate} />
        {loading ? "Modification..." : "Changer le mot de passe"}
      </button>
    </form>
  );
}

export default PasswordChangeForm;
