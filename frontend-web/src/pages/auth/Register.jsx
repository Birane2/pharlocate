import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircleCheck,
  faCircleExclamation,
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faPhone,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import { getApiErrorMessage } from "../../utils/apiError";
import { sanitizePhone, validatePhone } from "../../utils/phoneValidation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRegisterError(error) {
  return getApiErrorMessage(
    error,
    "Erreur lors de l'inscription.",
    "Erreur serveur pendant l'inscription. Réessayez plus tard."
  );
}

const PASSWORD_RULES = [
  { id: "len",     label: "8 caractères min.",  test: (p) => p.length >= 8 },
  { id: "case",    label: "Majuscule & minusc.", test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: "digit",   label: "Un chiffre",          test: (p) => /\d/.test(p) },
  { id: "special", label: "Caractère spécial",   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const COMMON_PASSWORDS = new Set([
  "password", "password123", "12345678", "123456789", "azerty123", "qwerty123",
]);

function validatePassword(password) {
  if (!password) return "Mot de passe obligatoire.";
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase()))
    return "Mot de passe trop courant.";
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.label + " requis.";
  }
  return "";
}

function getStrength(password) {
  return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

const STRENGTH_META = [
  null,
  { label: "Très faible", bar: "w-1/4", color: "bg-red-500",    text: "text-red-600" },
  { label: "Faible",      bar: "w-2/4", color: "bg-orange-400", text: "text-orange-600" },
  { label: "Moyen",       bar: "w-3/4", color: "bg-amber-400",  text: "text-amber-600" },
  { label: "Fort",        bar: "w-full",color: "bg-emerald-500",text: "text-emerald-600" },
];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, icon, hint, error, valid, rightAction, className = "", ...inputProps }) {
  const ring = error
    ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200/60"
    : valid
    ? "border-emerald-400 focus-within:border-emerald-400 focus-within:ring-emerald-100"
    : "border-[#E2E8F2] focus-within:border-[#2F6E9E] focus-within:ring-[#2F6E9E]/10";

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
        {label}
      </label>
      <div
        className={`flex h-11 items-center gap-2.5 rounded-[14px] border bg-white px-3 shadow-sm transition-all focus-within:ring-4 ${ring}`}
      >
        <FontAwesomeIcon
          icon={icon}
          className={`h-3.5 w-3.5 flex-none transition-colors ${
            error ? "text-red-400" : valid ? "text-emerald-500" : "text-[#9CA3AF]"
          }`}
        />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#C4C9D4]"
          {...inputProps}
        />
        {valid && !rightAction && (
          <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5 flex-none text-emerald-500" />
        )}
        {rightAction}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-[#9CA3AF]">{hint}</p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Derived validation ────────────────────────────────────────────────────
  const phoneErr    = touched.phone_number ? validatePhone(form.phone_number) || "" : "";
  const phoneValid  = !!form.phone_number && !validatePhone(form.phone_number);

  const strength     = useMemo(() => getStrength(form.password), [form.password]);
  const strengthMeta = strength > 0 ? STRENGTH_META[strength] : null;

  const passwordRules = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passwordErr   = touched.password && form.password ? validatePassword(form.password) : "";
  const passwordValid = form.password.length > 0 && !validatePassword(form.password);

  const confirmErr   = touched.password_confirm && form.password_confirm
    ? form.password_confirm !== form.password ? "Les mots de passe ne correspondent pas." : ""
    : "";
  const confirmValid = form.password_confirm.length > 0 && form.password_confirm === form.password;

  const firstNameValid = form.first_name.trim().length >= 2;
  const lastNameValid  = form.last_name.trim().length >= 2;
  const emailValid     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleaned = name === "phone_number" ? sanitizePhone(value) : value;
    setForm((prev) => ({ ...prev, [name]: cleaned }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setTouched({ first_name: true, last_name: true, phone_number: true, email: true, password: true, password_confirm: true });

    if (validatePhone(form.phone_number))     return;
    if (validatePassword(form.password))      return;
    if (form.password !== form.password_confirm) return;

    setLoading(true);
    try {
      const res = await register(form);
      navigate(`/verify-otp?email=${encodeURIComponent(res.email || form.email)}`);
    } catch (err) {
      setSubmitError(getRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] px-4 py-8 sm:px-6">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#2F6E9E]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#2FA6A3]/10 blur-3xl" />

      <section className="relative w-full max-w-[640px] rounded-[22px] border border-[#E2E8F2] bg-white/98 p-6 shadow-[0_16px_56px_rgba(28,43,74,0.10)] backdrop-blur sm:p-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9" imageClassName="drop-shadow-sm" />
          <h1 className="mt-4 text-[1.4rem] font-bold tracking-tight text-[#111827]">
            Créer votre compte pharmacien
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>

          {/* Row 1: Names */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Prénom"
              icon={faUser}
              name="first_name"
              placeholder="prénom"
              value={form.first_name}
              autoComplete="given-name"
              valid={firstNameValid}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            <Field
              label="Nom"
              icon={faUser}
              name="last_name"
              placeholder="Nom"
              value={form.last_name}
              autoComplete="family-name"
              valid={lastNameValid}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
          </div>

          {/* Row 2: Contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Téléphone"
              icon={faPhone}
              name="phone_number"
              type="tel"
              inputMode="numeric"
              placeholder="EX 22345678"
              value={form.phone_number}
              autoComplete="tel"
              maxLength={8}
              valid={phoneValid}
              error={phoneErr}
              hint="8 chiffres · commence par 2, 3 ou 4"
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            <Field
              label="Adresse e-mail"
              icon={faEnvelope}
              name="email"
              type="email"
              placeholder=""
              value={form.email}
              autoComplete="email"
              valid={emailValid}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
          </div>

          {/* Password */}
          <div>
            <Field
              label="Mot de passe"
              icon={faLock}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Choisissez un mot de passe "
              value={form.password}
              autoComplete="new-password"
              valid={passwordValid}
              error={passwordErr}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[#9CA3AF] transition hover:text-[#2F6E9E]"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-3.5 w-3.5" />
                </button>
              }
            />

            {form.password && (
              <div className="mt-2 space-y-1.5">
                {/* Strength bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#E2E8F2]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthMeta?.bar ?? "w-0"} ${strengthMeta?.color ?? ""}`}
                    />
                  </div>
                  {strengthMeta && (
                    <span className={`text-[10px] font-bold ${strengthMeta.text}`}>
                      {strengthMeta.label}
                    </span>
                  )}
                </div>
                {/* Rules checklist */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {passwordRules.map((r) => (
                    <span
                      key={r.id}
                      className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors ${
                        r.passed ? "text-emerald-600" : "text-[#9CA3AF]"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={r.passed ? faCircleCheck : faXmark}
                        className={`h-3 w-3 ${r.passed ? "text-emerald-500" : "text-[#CBD5E1]"}`}
                      />
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <Field
            label="Confirmer le mot de passe"
            icon={faLock}
            name="password_confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="Répétez votre mot de passe"
            value={form.password_confirm}
            autoComplete="new-password"
            valid={confirmValid}
            error={confirmErr}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            rightAction={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[#9CA3AF] transition hover:text-[#2F6E9E]"
                aria-label={showConfirm ? "Masquer" : "Afficher"}
              >
                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="h-3.5 w-3.5" />
              </button>
            }
          />

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-4 w-4 flex-none" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#2F6E9E] text-sm font-bold text-white shadow-md shadow-[#2F6E9E]/20 transition hover:bg-[#265B84] focus:outline-none focus:ring-4 focus:ring-[#2F6E9E]/20 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Création en cours…
              </>
            ) : (
              <>
                Créer mon compte
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 space-y-2 text-center">
          <p className="text-sm font-medium text-[#6B7280]">
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-bold text-[#2FA6A3] transition hover:underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
