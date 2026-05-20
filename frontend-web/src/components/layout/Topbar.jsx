import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

function Topbar({ title = "Dashboard" }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-pharmaBorder bg-white/90 px-5 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-pharmaBlue">{title}</h1>
        <p className="mt-1 text-sm font-normal leading-5 text-pharmaTextLight">
          Bienvenue, {user?.username} - {user?.role}
        </p>
      </div>

      <Button variant="outline" onClick={logout} className="hidden md:block">
        Déconnexion
      </Button>
    </header>
  );
}

export default Topbar;
