import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone, faSave, faUser } from "@fortawesome/free-solid-svg-icons";
import { sanitizePhone, validatePhone } from "../../utils/phoneValidation";

const inputClass =
  "h-11 w-full rounded-xl border border-[#E2E8F2] bg-white px-3 text-sm font-semibold text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10";

function Field({ icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[#6B7280]">
        <FontAwesomeIcon icon={icon} className="text-[#2F6E9E]" />
        {label}
      </span>
      {children}
    </label>
  );
}

function ProfileEditForm({ profile, loading, onSubmit }) {
  // Strip +222 prefix so the field shows the local 8-digit number
  const toLocal = (phone) => {
    const p = (phone || '').trim();
    if (p.startsWith('+222') && p.length === 12) return p.slice(4);
    if (p.startsWith('222') && p.length === 11) return p.slice(3);
    return p;
  };

  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone_number: toLocal(profile?.phone_number || ""),
  });
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "phone_number") {
      const clean = sanitizePhone(value);
      setForm((current) => ({ ...current, phone_number: clean }));
      setPhoneError(validatePhone(clean) || "");
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const err = validatePhone(form.phone_number);
    if (err) { setPhoneError(err); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#1C2B4A]">Informations personnelles</h2>
        <p className="mt-1 text-xs font-semibold text-[#6B7280]">
          Modifiez uniquement vos informations de contact.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field icon={faUser} label="Prénom">
          <input
            className={inputClass}
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            autoComplete="given-name"
          />
        </Field>
        <Field icon={faUser} label="Nom">
          <input
            className={inputClass}
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            autoComplete="family-name"
          />
        </Field>
        <Field icon={faEnvelope} label="E-mail">
          <input
            className={inputClass}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </Field>
        <Field icon={faPhone} label="Téléphone">
          <input
            className={inputClass}
            name="phone_number"
            type="tel"
            inputMode="numeric"
            placeholder="22345678"
            value={form.phone_number}
            onChange={handleChange}
            maxLength={8}
            autoComplete="tel"
            required
          />
          {phoneError && (
            <p className="mt-1 text-xs font-semibold text-[#DC2626]">
              {phoneError}
            </p>
          )}
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading || !!validatePhone(form.phone_number)}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#255C84] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FontAwesomeIcon icon={faSave} />
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

export default ProfileEditForm;
