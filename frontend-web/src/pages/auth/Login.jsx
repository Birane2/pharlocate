import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faLock,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import { sanitizePhone, validatePhone } from "../../utils/phoneValidation";

function getApiError(err) {
  const data = err.response?.data;
  const message =
    data?.error ||
    data?.detail ||
    data?.phone_number?.[0] ||
    data?.phone?.[0] ||
    data?.email?.[0] ||
    data?.username?.[0] ||
    data?.password?.[0] ||
    data?.non_field_errors?.[0] ||
    err.message;

  return message || "Téléphone ou mot de passe incorrect.";
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone_number: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "phone_number") {
      const clean = sanitizePhone(value);
      setForm({ ...form, phone_number: clean });
      setPhoneError(validatePhone(clean) || "");
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const redirectByRole = (profile) => {
    if (profile?.role === "pharmacien") {
      navigate("/pharmacien/dashboard");
    } else if (profile?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const phoneErr = validatePhone(form.phone_number);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    setLoading(true);

    try {
      const profile = await login(form.phone_number.trim(), form.password);
      redirectByRole(profile);
    } catch (err) {
      if (err.response?.data?.requires_verification) {
        const email = err.response.data.email || "";
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#2F6E9E]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#2FA6A3]/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,198,184,0.12),transparent_34%),linear-gradient(135deg,rgba(47,110,158,0.05)_0%,rgba(255,255,255,0.72)_46%,rgba(47,166,163,0.06)_100%)]" />

      <section className="relative w-full max-w-[450px] rounded-2xl border border-[#E2E8F2] bg-white/95 p-5 shadow-[0_20px_60px_rgba(28,43,74,0.10)] backdrop-blur sm:p-6">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-11" imageClassName="drop-shadow-sm" />

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1C2B4A]">
            Connexion
          </h1>

          <p className="mt-1.5 text-sm font-medium text-[#6B7280]">
            Accédez à votre espace PharmaLocate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Téléphone 
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
              <FontAwesomeIcon
                icon={faPhone}
                className="h-4 w-4 text-[#2F6E9E]"
              />
              <input
                name="phone_number"
                type="tel"
                inputMode="numeric"
                placeholder="Ex : 22345678"
                value={form.phone_number}
                onChange={handleChange}
                maxLength={8}
                required
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#1C2B4A] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-xs font-semibold text-[#DC2626]">
                {phoneError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Mot de passe
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
              <FontAwesomeIcon
                icon={faLock}
                className="h-4 w-4 text-[#2F6E9E]"
              />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={form.password}
                onChange={handleChange}
                required
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#1C2B4A] outline-none placeholder:text-[#9CA3AF]"
              />
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
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs font-semibold text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#2F6E9E] focus:ring-[#2F6E9E]/20"
              />
              Se souvenir de moi
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-left font-bold text-[#2F6E9E] transition hover:underline sm:text-right"
            >
              Mot de passe oublié ?
            </button>
          </div>

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
            disabled={loading || !!validatePhone(form.phone_number)}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F6E9E] text-sm font-bold text-white shadow-lg shadow-[#2F6E9E]/20 transition hover:bg-[#265B84] focus:outline-none focus:ring-4 focus:ring-[#2F6E9E]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm font-medium leading-6 text-[#6B7280]">
          Vous n’avez pas de compte ?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-bold text-[#2FA6A3] transition hover:underline"
          >
            Créer un compte
          </button>
        </p>
      </section>
    </div>
  );
}

export default Login;
