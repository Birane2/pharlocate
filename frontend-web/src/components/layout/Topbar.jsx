import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

function Topbar({ title = "Dashboard" }) {
  const { user, logout } = useAuth();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const displayName = fullName || user?.phone_number || "Utilisateur";

  return (
    <header className="flex items-center justify-between border-b border-pharmaBorder bg-white/90 px-5 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-pharmaBlue">{title}</h1>
        <p className="mt-1 text-sm font-normal leading-5 text-pharmaTextLight">
          Bienvenue, {displayName} - {user?.role}
        </p>
      </div>

      <Button variant="outline" onClick={logout} className="hidden md:block">
        Déconnexion
      </Button>
    </header>
  );
}

export default Topbar;
