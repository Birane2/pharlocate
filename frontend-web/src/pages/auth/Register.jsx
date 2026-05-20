import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/ui/Logo";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    role: "utilisateur",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await register(form);
      navigate("/login");
    } catch {
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(53,195,163,0.14),transparent_34%),linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_52%,#F0FAFA_100%)] px-4 py-8">
      <Card className="w-full max-w-md" hover={false}>
        <div className="flex flex-col items-center text-center">
          <Logo className="h-16" imageClassName="drop-shadow-sm" />

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-pharmaBlue">
            Inscription
          </h1>

          <p className="mt-2 max-w-xs text-sm font-normal leading-6 text-pharmaTextLight">
            Créez un compte pour accéder à votre espace sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Nom d'utilisateur"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            name="password_confirm"
            value={form.password_confirm}
            onChange={handleChange}
            required
          />

          <Input
            label="Type de compte"
            name="role"
            type="select"
            value={form.role}
            onChange={handleChange}
            options={[
              { value: "utilisateur", label: "Utilisateur" },
              { value: "pharmacien", label: "Pharmacien" },
            ]}
          />

          {error && (
            <p className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm font-medium leading-6 text-pharmaDanger">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full">
            S'inscrire
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-normal leading-6 text-pharmaTextLight">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-pharmaTurquoise transition hover:text-pharmaBlue"
          >
            Se connecter
          </button>
        </p>
      </Card>
    </div>
  );
}

export default Register;
