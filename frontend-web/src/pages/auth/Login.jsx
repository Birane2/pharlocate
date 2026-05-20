import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = await login(form.username, form.password);

      if (profile?.role === "pharmacien") {
        navigate("/pharmacien/dashboard");
      } else if (profile?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const apiError =
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        err.message;

      setError(apiError || "Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(53,195,163,0.14),transparent_34%),linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_52%,#F0FAFA_100%)] px-4 py-8">
      <Card className="w-full max-w-md" hover={false}>
        <div className="flex flex-col items-center text-center">
          <Logo className="h-16" imageClassName="drop-shadow-sm" />

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-pharmaBlue">
            Connexion
          </h1>

          <p className="mt-2 max-w-xs text-sm font-normal leading-6 text-pharmaTextLight">
            Accédez à votre espace sécurisé .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="Nom d'utilisateur"
            name="username"
            type="text"
            placeholder="Ex : oumar"
            value={form.username}
            onChange={handleChange}
            required
          />

          <Input
            label="Mot de passe"
            name="password"
            type="password"
            placeholder="Votre mot de passe"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && (
            <div className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm font-medium leading-6 text-pharmaDanger">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-normal leading-6 text-pharmaTextLight">
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold text-pharmaTurquoise transition hover:text-pharmaBlue"
          >
            Créer un compte
          </button>
        </p>
      </Card>
    </div>
  );
}

export default Login;
