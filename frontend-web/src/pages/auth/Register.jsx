import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faPhone,
  faUser,
  faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import { getApiErrorMessage } from "../../utils/apiError";

function getRegisterError(error) {
  return getApiErrorMessage(
    error,
    "Erreur lors de l'inscription.",
    "Erreur serveur pendant l'inscription. Réessayez plus tard."
  );
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      label: "",
      color: "bg-[#E2E8F2]",
      textColor: "text-[#6B7280]",
      width: "w-0",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Faible",
      color: "bg-[#EF4444]",
      textColor: "text-[#DC2626]",
      width: "w-1/3",
    };
  }

  if (score <= 3) {
    return {
      label: "Moyen",
      color: "bg-[#F59E0B]",
      textColor: "text-[#D97706]",
      width: "w-2/3",
    };
  }

  return {
    label: "Fort",
    color: "bg-[#22C55E]",
    textColor: "text-[#16A34A]",
    width: "w-full",
  };
}

function AuthField({
  label,
  icon,
  rightAction,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
        {label}
      </label>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
        <FontAwesomeIcon icon={icon} className="h-4 w-4 text-[#2F6E9E]" />
        <input
          className={`h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#1C2B4A] outline-none placeholder:text-[#9CA3AF] ${inputClassName}`}
          {...props}
        />
        {rightAction}
      </div>
    </div>
  );
}

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
    role: "utilisateur",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);

    try {
      const response = await register(form);
      const email = response.email || form.email;
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#2F6E9E]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#2FA6A3]/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,198,184,0.12),transparent_34%),linear-gradient(135deg,rgba(47,110,158,0.05)_0%,rgba(255,255,255,0.74)_48%,rgba(47,166,163,0.06)_100%)]" />

      <section className="relative w-full max-w-[720px] rounded-2xl border border-[#E2E8F2] bg-white/95 p-5 shadow-[0_20px_60px_rgba(28,43,74,0.10)] backdrop-blur sm:p-6">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-10" imageClassName="drop-shadow-sm" />

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1C2B4A]">
            Créer un compte
          </h1>

          <p className="mt-1 text-sm font-medium text-[#6B7280]">
            Accédez à PharmaLocate en quelques secondes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AuthField
              label="Prénom"
              icon={faUser}
              name="first_name"
              placeholder="Oumar"
              value={form.first_name}
              onChange={handleChange}
              required
            />

            <AuthField
              label="Nom"
              icon={faUser}
              name="last_name"
              placeholder="Gangué"
              value={form.last_name}
              onChange={handleChange}
              required
            />

            <AuthField
              label="Numéro de téléphone"
              icon={faPhone}
              name="phone_number"
              type="tel"
              placeholder="+22233613535"
              value={form.phone_number}
              onChange={handleChange}
              required
            />

            <AuthField
              label="E-mail"
              icon={faEnvelope}
              name="email"
              type="email"
              placeholder="oumar@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div>
              <AuthField
                label="Mot de passe"
                icon={faLock}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={form.password}
                onChange={handleChange}
                required
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#2F6E9E]"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="h-4 w-4"
                    />
                  </button>
                }
              />

              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F2]">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.width} ${passwordStrength.color}`}
                  />
                </div>
                {passwordStrength.label && (
                  <p
                    className={`mt-1 text-xs font-bold ${passwordStrength.textColor}`}
                  >
                    Sécurité : {passwordStrength.label}
                  </p>
                )}
              </div>
            </div>

            <AuthField
              label="Confirmation du mot de passe"
              icon={faLock}
              name="password_confirm"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmer"
              value={form.password_confirm}
              onChange={handleChange}
              required
              rightAction={
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((isVisible) => !isVisible)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#2F6E9E]"
                  aria-label={
                    showConfirmPassword
                      ? "Masquer la confirmation"
                      : "Afficher la confirmation"
                  }
                >
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                    className="h-4 w-4"
                  />
                </button>
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] p-1">
              {[
                { value: "utilisateur", label: "Utilisateur" },
                { value: "pharmacien", label: "Pharmacien" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: option.value })}
                  className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold transition ${
                    form.role === option.value
                      ? "bg-white text-[#2F6E9E] shadow-sm"
                      : "text-[#6B7280] hover:text-[#1C2B4A]"
                  }`}
                >
                  <FontAwesomeIcon icon={faUserTag} className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-[#E2E8F2] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#6B7280]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2F6E9E] focus:ring-[#2F6E9E]/20"
            />
            <span>
              J'accepte les conditions d'utilisation de PharmaLocate.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#DC2626]">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-1 h-4 w-4 flex-none"
              />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F6E9E] text-sm font-bold text-white shadow-lg shadow-[#2F6E9E]/20 transition hover:bg-[#265B84] focus:outline-none focus:ring-4 focus:ring-[#2F6E9E]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm font-medium leading-6 text-[#6B7280]">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold text-[#2FA6A3] transition hover:underline"
          >
            Se connecter
          </button>
        </p>
      </section>
    </div>
  );
}

export default Register;
