import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../components/ui/Logo";
import { confirmPasswordReset } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/apiError";

function ResetPassword() {
  const navigate = useNavigate();
  const [email] = useState(
    () => sessionStorage.getItem("password_reset_email") || ""
  );
  const [resetToken] = useState(
    () => sessionStorage.getItem("password_reset_token") || ""
  );
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password");
    }
  }, [email, navigate, resetToken]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const response = await confirmPasswordReset(
        email,
        resetToken,
        form.newPassword,
        form.confirmPassword
      );
      sessionStorage.removeItem("password_reset_email");
      sessionStorage.removeItem("password_reset_token");
      setMessage(response.message || "Mot de passe réinitialisé avec succès.");
      window.setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Impossible de réinitialiser le mot de passe.",
          "Erreur serveur pendant la réinitialisation. Réessayez plus tard."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#2F6E9E]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#2FA6A3]/12 blur-3xl" />

      <section className="relative w-full max-w-[450px] rounded-2xl border border-[#E2E8F2] bg-white/95 p-5 shadow-[0_20px_60px_rgba(28,43,74,0.10)] backdrop-blur sm:p-6">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-11" imageClassName="drop-shadow-sm" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1C2B4A]">
            Nouveau mot de passe
          </h1>
          <p className="mt-1.5 text-sm font-medium text-[#6B7280]">
            Définissez un mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Nouveau mot de passe
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-[#2F6E9E]" />
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Nouveau mot de passe"
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

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Confirmation
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-[#2F6E9E]" />
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                required
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#1C2B4A] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-[#2FA6A3]/25 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#167769]">
              {message}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#DC2626]">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-1 h-4 w-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F6E9E] text-sm font-bold text-white shadow-lg shadow-[#2F6E9E]/20 transition hover:bg-[#265B84] focus:outline-none focus:ring-4 focus:ring-[#2F6E9E]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Enregistrement..." : "Réinitialiser"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ResetPassword;
