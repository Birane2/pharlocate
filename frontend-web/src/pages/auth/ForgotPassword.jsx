import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import Logo from "../../components/ui/Logo";
import { requestPasswordReset } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/apiError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(normalizedEmail);
      sessionStorage.setItem("password_reset_email", normalizedEmail);
      setMessage(response.message || "Code de réinitialisation envoyé.");
      window.setTimeout(() => navigate("/reset-password/verify"), 650);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Impossible de demander la réinitialisation.",
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
            Mot de passe oublié
          </h1>
          <p className="mt-1.5 text-sm font-medium text-[#6B7280]">
            Recevez un code de réinitialisation par e-mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#1C2B4A]">
              Adresse e-mail
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#E2E8F2] bg-white px-3.5 shadow-sm transition focus-within:border-[#2F6E9E] focus-within:ring-4 focus-within:ring-[#2F6E9E]/10">
              <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-[#2F6E9E]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="exemple@email.com"
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
            {loading ? "Envoi..." : "Recevoir le code"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-5 w-full text-center text-sm font-bold text-[#2FA6A3] transition hover:underline"
        >
          Retour à la connexion
        </button>
      </section>
    </div>
  );
}

export default ForgotPassword;
