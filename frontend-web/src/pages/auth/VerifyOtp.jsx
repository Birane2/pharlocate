import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faEnvelope,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import { getApiErrorMessage } from "../../utils/apiError";

const OTP_LENGTH = 6;

function getApiError(error, fallback) {
  return getApiErrorMessage(
    error,
    fallback,
    "Erreur serveur pendant la vérification. Réessayez plus tard."
  );
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function VerifyOtp() {
  const { verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const [email] = useState(() => searchParams.get("email") || "");
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(90);
  const [message, setMessage] = useState(() =>
    searchParams.get("email") ? "Code envoyé par e-mail." : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const otp = otpDigits.join("");
  const isOtpComplete = otp.length === OTP_LENGTH;

  useEffect(() => {
    if (timer <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimer((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timer]);

  const redirectByRole = (user) => {
    if (user?.role === "pharmacien") {
      navigate("/pharmacien/dashboard");
    } else if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key !== "Backspace") {
      return;
    }

    if (otpDigits[index]) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    if (index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedCode) {
      return;
    }

    const nextDigits = Array(OTP_LENGTH).fill("");
    pastedCode.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setOtpDigits(nextDigits);
    focusInput(Math.min(pastedCode.length, OTP_LENGTH) - 1);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Adresse e-mail manquante. Retournez à l'inscription.");
      return;
    }

    if (!isOtpComplete) {
      setError("Veuillez saisir les 6 chiffres du code OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyRegisterOtp(email.trim(), otp);
      setMessage("Compte vérifié avec succès.");
      window.setTimeout(() => redirectByRole(response.user), 500);
    } catch (err) {
      setError(getApiError(err, "Code incorrect."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || timer > 0 || loading) {
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await resendRegisterOtp(email.trim());
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setTimer(90);
      setMessage("Nouveau code envoyé par e-mail.");
      focusInput(0);
    } catch (err) {
      setError(getApiError(err, "Impossible de renvoyer le code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#2F6E9E]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#2FA6A3]/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,198,184,0.12),transparent_34%),linear-gradient(135deg,rgba(47,110,158,0.05)_0%,rgba(255,255,255,0.75)_48%,rgba(47,166,163,0.06)_100%)]" />

      <section className="relative w-full max-w-[480px] rounded-2xl border border-[#E2E8F2] bg-white/95 p-5 shadow-[0_18px_50px_rgba(28,43,74,0.10)] backdrop-blur sm:p-6">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-11" imageClassName="drop-shadow-sm" />

          <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
            <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#1C2B4A]">
            Vérification OTP
          </h1>
          <p className="mt-1 text-sm font-medium text-[#6B7280]">
            Entrez le code reçu par e-mail.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-[#2F6E9E]/10 bg-[#F8FAFC] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2FA6A3]/10 text-[#2FA6A3]">
              <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#6B7280]">
                Code envoyé à
              </p>
              <p className="truncate text-sm font-bold text-[#1C2B4A]">
                {email || "Adresse e-mail non renseignée"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-center text-xs font-bold text-[#1C2B4A]">
              Code de vérification
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  aria-label={`Chiffre OTP ${index + 1}`}
                  className="h-12 w-11 rounded-xl border border-[#D9E2EC] bg-white text-center text-lg font-black text-[#1C2B4A] shadow-sm outline-none transition focus:border-[#2F6E9E] focus:ring-4 focus:ring-[#2F6E9E]/10 sm:h-14 sm:w-12"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center text-sm font-semibold text-[#6B7280]">
            {timer > 0 ? (
              <span>Renvoyer le code dans {formatTimer(timer)}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || !email}
                className="text-[#2FA6A3] transition hover:text-[#2F6E9E] hover:underline disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
              >
                Renvoyer le code
              </button>
            )}
          </div>

          {message && (
            <div className="rounded-xl border border-[#2FA6A3]/25 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#167769]">
              {message}
            </div>
          )}

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
            disabled={!isOtpComplete || loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F6E9E] text-sm font-bold text-white shadow-lg shadow-[#2F6E9E]/20 transition hover:bg-[#265B84] focus:outline-none focus:ring-4 focus:ring-[#2F6E9E]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Vérification..." : "Vérifier mon compte"}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-bold text-[#2FA6A3] transition hover:text-[#2F6E9E] hover:underline"
          >
            Modifier l’adresse e-mail
          </button>
          <span className="hidden h-4 w-px bg-[#E2E8F2] sm:block" />
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-[#6B7280] transition hover:text-[#1C2B4A] hover:underline"
          >
            Retour à la connexion
          </button>
        </div>
      </section>
    </div>
  );
}

export default VerifyOtp;
