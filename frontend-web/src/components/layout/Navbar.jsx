import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faClinicMedical,
  faMapLocationDot,
  faShieldHeart,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Logo from "../ui/Logo";

const publicLinks = [
  { label: "Accueil", to: "/" },
  { label: "Pharmacies", to: "/pharmacies" },
  { label: "Carte", to: "/map" },
  { label: "Gardes", to: "/pharmacies?est_garde=true" },
];

function Navbar() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F2] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4">
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <Logo className="h-11 w-auto" />
        </Link>

        <nav className="hidden items-center justify-center gap-8 lg:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-[#6B7A99] transition-colors duration-300 hover:text-[#2F6E9E]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden justify-self-end lg:flex">
          <Button type="button" variant="outline" size="sm" onClick={logout}>
            Déconnexion
          </Button>
        </div>

        <button
          type="button"
          className="justify-self-end rounded-2xl border border-[#E2E8F2] bg-white p-3 text-[#1C2B4A] shadow-sm transition-colors duration-300 hover:border-[#2F6E9E] hover:text-[#2F6E9E] lg:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} className="text-lg" />
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-[#E2E8F2] bg-white transition-all duration-300 lg:hidden ${
          isOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4">
          {publicLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={closeMenu}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#1C2B4A] transition-colors duration-300 hover:bg-[#F0F5FB]"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                closeMenu();
                logout();
              }}
            >
              Déconnexion
            </Button>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#6B7A99]">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faClinicMedical} className="text-[#2F6E9E]" />
              <span>Recherchez une pharmacie publique en quelques secondes.</span>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faMapLocationDot} className="text-[#2FA6A3]" />
              <span>Accédez rapidement à la carte interactive.</span>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faShieldHeart} className="text-[#4A8BBE]" />
              <span>Consultez des informations fiables et validées.</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
