import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronDown,
  faCircleCheck,
  faClock,
  faHospital,
  faLocationDot,
  faPhone,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

function Header({
  title = "Administration",
  subtitle,
  showLogo = false,
  logoTo = "/",
  showSubtitle = true,
  pharmacy,
  pharmacyHeader = false,
}) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const displayName = user?.role === "pharmacien" ? "Pharmacien" : user?.username || "Admin";
  const avatarLabel = (user?.username || displayName).slice(0, 2).toUpperCase();
  const pharmacyName = (pharmacy?.nom || "Votre pharmacie")
    .replace(/^(ph\.?\s*)+/i, "")
    .trim();

  return (
    <header className="sticky top-0 z-50 border-b border-[#2F6E9E]/10 bg-white/95 px-4 py-2 shadow-[0_8px_20px_rgba(47,110,158,0.06)] backdrop-blur sm:px-6 lg:px-7">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {showLogo && (
            <Logo
              to={logoTo}
              className="h-9"
              imageClassName="drop-shadow-sm"
            />
          )}

          <div className="min-w-0">
            {pharmacyHeader ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <FontAwesomeIcon
                    icon={faHospital}
                    className="h-4 w-4 shrink-0 text-[#2FA6A3] sm:h-5 sm:w-5"
                  />
                  <h1 className="truncate text-lg font-bold tracking-tight text-[#1C2B4A] sm:text-2xl sm:leading-tight">
                    Ph. {pharmacyName}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      pharmacy?.est_valide
                        ? "bg-[#5EC6B8]/20 text-[#167769]"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={pharmacy?.est_valide ? faCircleCheck : faClock}
                    />
                    {pharmacy?.est_valide ? "Validee" : "En attente"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-[#6B7280] sm:text-xs">
                  {pharmacy?.adresse && (
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-[#2F6E9E]" />
                      {pharmacy.adresse}
                    </span>
                  )}
                  {pharmacy?.telephone && (
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
                      {pharmacy.telephone}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="truncate text-lg font-bold tracking-tight text-[#2F6E9E]">
                  {title}
                </h1>
                {showSubtitle && (
                  <p className="mt-0.5 truncate text-xs font-medium leading-5 text-[#6B7280]">
                    {subtitle || `Bienvenue, ${displayName}`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <label className="hidden items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-bold text-[#6B7280] shadow-sm md:flex">
              <FontAwesomeIcon icon={faCalendarDays} className="text-[#2F6E9E]" />
              <input
                type="date"
                className="bg-transparent text-xs font-bold text-[#1C2B4A] outline-none"
                aria-label="Selectionner une date"
              />
            </label>
          )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-[#2F6E9E]/5"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6E9E] to-[#2FA6A3] text-xs font-bold text-white shadow-sm">
              {avatarLabel}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-28 truncate text-xs font-bold text-[#1C2B4A]">
                {user?.username || displayName}
              </span>
              <span className="block text-[10px] font-medium text-[#6B7280]">
                {displayName}
              </span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`hidden h-3 w-3 text-[#6B7280] transition sm:block ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[#2F6E9E]/10 bg-white p-2 shadow-lg"
              role="menu"
            >
              <p className="truncate px-2 py-1 text-xs font-bold text-[#1C2B4A]">
                {user?.username || displayName}
              </p>
              <Link
                to="/pharmacien/profil"
                className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/5"
                role="menuitem"
              >
                <FontAwesomeIcon icon={faUser} />
                Profil
              </Link>
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-red-600 transition hover:bg-red-50"
                role="menuitem"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Deconnexion
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
