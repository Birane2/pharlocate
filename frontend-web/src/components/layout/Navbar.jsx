import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCalendarCheck,
  faChevronDown,
  faGauge,
  faArrowRightFromBracket,
  faShieldHalved,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

const homeOnlyLinks = [
  { label: "Accueil", to: "#home" },
  { label: "Fonctionnalites", to: "#features" },
  { label: "Comment ca marche", to: "#how-it-works" },
  { label: "A propos", to: "#pharmacists" },
  { label: "Contact", to: "#contact" },
];

const globalLinks = [{ label: "Pharmacies", to: "/pharmacies" }];

function NavItem({ link, onClick, active }) {
  const cls = `rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
    active
      ? "bg-[#2F6E9E]/10 text-[#2F6E9E]"
      : "text-[#6B7280] hover:bg-[#2F6E9E]/8 hover:text-[#2F6E9E]"
  }`;

  if (link.to.startsWith("#")) {
    return (
      <a href={link.to} onClick={onClick} className={cls}>
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.to} onClick={onClick} className={cls}>
      {link.label}
    </Link>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const isOnHome = location.pathname === "/";
  const visibleLinks = isOnHome
    ? [...homeOnlyLinks, ...globalLinks]
    : globalLinks;

  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.phone_number ||
    user?.username ||
    "Compte";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isLinkActive = (link) => {
    if (link.to === "/pharmacies") return location.pathname.startsWith("/pharmacies");
    if (link.to.startsWith("#")) return location.pathname === "/" && location.hash === link.to;
    return location.pathname === link.to;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2F6E9E]/10 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center" onClick={closeMobile}>
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {visibleLinks.map((link) => (
            <NavItem key={link.label} link={link} active={isLinkActive(link)} />
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-[#D8E3EE] bg-white px-2 py-1.5 text-xs font-semibold text-[#1C2B4A] shadow-sm transition hover:border-[#2F6E9E]/40 hover:bg-[#F8FAFC]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2F6E9E] text-[10px] font-black text-white">
                  {initials || <FontAwesomeIcon icon={faUser} className="text-[9px]" />}
                </div>
                <span className="max-w-[88px] truncate">{userName}</span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[10px] text-[#6B7280] transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[188px] rounded-2xl border border-[#E2E8F2] bg-white p-1.5 shadow-lg">
                    <Link
                      to="/user/reservations"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#1C2B4A] transition hover:bg-[#F0F5FB]"
                    >
                      <FontAwesomeIcon icon={faCalendarCheck} className="w-3.5 text-[#2FA6A3]" />
                      Mes reservations
                    </Link>
                    {user?.role === "pharmacien" && (
                      <Link
                        to="/pharmacien/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#1C2B4A] transition hover:bg-[#F0F5FB]"
                      >
                        <FontAwesomeIcon icon={faGauge} className="w-3.5 text-[#2F6E9E]" />
                        Espace pharmacien
                      </Link>
                    )}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#1C2B4A] transition hover:bg-[#F0F5FB]"
                      >
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 text-[#2F6E9E]" />
                        Administration
                      </Link>
                    )}
                    <hr className="my-1 border-[#F0F4F8]" />
                    <button
                      type="button"
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-3.5" />
                      Deconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-[#D8E3EE] bg-white px-3 py-1.5 text-xs font-semibold text-[#2F6E9E] shadow-sm transition hover:bg-[#F8FAFC]"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#2F6E9E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#255C86]"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-xl border border-[#D8E3EE] bg-white p-2 text-[#1C2B4A] shadow-sm transition hover:border-[#2F6E9E] hover:text-[#2F6E9E] lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-[#2F6E9E]/10 bg-white transition-all duration-200 lg:hidden ${
          mobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-0.5 px-4 py-3">
          {visibleLinks.map((link) => (
            <NavItem
              key={link.label}
              link={link}
              active={isLinkActive(link)}
              onClick={closeMobile}
            />
          ))}

          {isAuthenticated ? (
            <div className="mt-2 rounded-2xl border border-[#D8E3EE] bg-[#F8FAFC] p-3">
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2F6E9E] text-[11px] font-black text-white">
                  {initials || <FontAwesomeIcon icon={faUser} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1C2B4A]">{userName}</p>
                  <p className="text-[11px] text-[#6B7280]">{user?.role || "utilisateur"}</p>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Link
                  to="/user/reservations"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2F6E9E] transition hover:bg-[#EEF4FA]"
                >
                  <FontAwesomeIcon icon={faCalendarCheck} className="w-3.5 text-[#2FA6A3]" />
                  Mes reservations
                </Link>
                {user?.role === "pharmacien" && (
                  <Link
                    to="/pharmacien/dashboard"
                    onClick={closeMobile}
                    className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2F6E9E] transition hover:bg-[#EEF4FA]"
                  >
                    <FontAwesomeIcon icon={faGauge} className="w-3.5" />
                    Espace pharmacien
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMobile}
                    className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2F6E9E] transition hover:bg-[#EEF4FA]"
                  >
                    <FontAwesomeIcon icon={faShieldHalved} className="w-3.5" />
                    Administration
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); closeMobile(); }}
                  className="flex items-center gap-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-3.5" />
                  Deconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="rounded-xl border border-[#D8E3EE] bg-white px-4 py-2 text-center text-sm font-semibold text-[#2F6E9E]"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
                className="rounded-xl bg-[#2F6E9E] px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
